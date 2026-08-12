"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Wallet, Filter, LayoutDashboard } from "lucide-react";

const brl = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export default function Dashboard() {
  const supabase = createClient();
  const [carregando, setCarregando] = useState(true);
  const [ativos, setAtivos] = useState<any[]>([]);
  const [perfilUsuario, setPerfilUsuario] = useState<any>(null);
  
  // Filtros do Dashboard
  const [ativoFiltro, setAtivoFiltro] = useState("TODOS");
  const [tipoData, setTipoData] = useState("MES");
  const [mes, setMes] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  // Resumo dos KPIs
  const [resumo, setResumo] = useState({
    receitaLiquidaPeriodo: 0,
    despesasPagasPeriodo: 0,
    despesasPendentesPeriodo: 0,
    saldoAcumuladoHistorico: 0
  });

  // Tabela rápida
  const [ultimasDespesas, setUltimasDespesas] = useState<any[]>([]);

  // 1. CARREGA AS PERMISSÕES E OS ATIVOS DISPONÍVEIS LOGO NO INÍCIO
  useEffect(() => {
    async function carregarDadosIniciais() {
      const { data: { user } } = await supabase.auth.getUser();
      let perfilData = null;
      if (user) {
        const { data } = await supabase.from("perfis_usuarios").select("*").eq("id", user.id).single();
        perfilData = data;
        setPerfilUsuario(data);
      }

      const { data: atvs } = await supabase.from("ativos").select("id, nome").order("nome");
      let listaAtivos = atvs || [];

      // SE O USUÁRIO TIVER RESTRIÇÕES, FILTRAMOS A LISTA DO MENU
      if (perfilData && !perfilData.is_admin && perfilData.ativos_permitidos?.length > 0) {
        listaAtivos = listaAtivos.filter(a => perfilData.ativos_permitidos.includes(a.id));
      }
      setAtivos(listaAtivos);
    }
    carregarDadosIniciais();
  }, [supabase]);

  // 2. BUSCA OS DADOS (RESPEITANDO AS RESTRIÇÕES DO PERFIL)
  useEffect(() => {
    async function carregarDashboard() {
      if (!perfilUsuario) return; // Aguarda carregar o perfil antes de buscar dados financeiros

      setCarregando(true);

      let pDia = "2000-01-01";
      let uDia = "2100-12-31";

      if (tipoData === "MES" && mes) {
        const [anoStr, mesStr] = mes.split('-');
        pDia = `${anoStr}-${mesStr}-01`;
        uDia = new Date(Number(anoStr), Number(mesStr), 0).toISOString().split('T')[0];
      }

      // ==========================================
      // CÁLCULO DO PERÍODO SELECIONADO
      // ==========================================
      let reqRecPeriodo = supabase.from("receitas").select("valor_liquido").gte("data_inicio", pDia).lte("data_inicio", uDia);
      let reqDespPeriodo = supabase.from("despesas")
        .select("id, descricao, valor, status, data_vencimento, categorias_despesa(nome)")
        .gte("data_vencimento", pDia)
        .lte("data_vencimento", uDia)
        .order("data_vencimento", { ascending: true });

      // APLICA AS RESTRIÇÕES DE SEGURANÇA NAS QUERIES
      if (ativoFiltro !== "TODOS") {
        reqRecPeriodo = reqRecPeriodo.eq("ativo_id", ativoFiltro);
        reqDespPeriodo = reqDespPeriodo.eq("ativo_id", ativoFiltro);
      } else if (!perfilUsuario.is_admin && perfilUsuario.ativos_permitidos?.length > 0) {
        // Se escolheu "TODOS" mas é um usuário restrito, obrigamos a buscar apenas os permitidos
        reqRecPeriodo = reqRecPeriodo.in("ativo_id", perfilUsuario.ativos_permitidos);
        reqDespPeriodo = reqDespPeriodo.in("ativo_id", perfilUsuario.ativos_permitidos);
      }

      const { data: recPeriodo } = await reqRecPeriodo;
      const { data: despPeriodo } = await reqDespPeriodo;

      let recLiqPeriodo = 0;
      recPeriodo?.forEach(r => recLiqPeriodo += Number(r.valor_liquido || 0));

      let despPagasPeriodo = 0;
      let despPendentesPeriodo = 0;
      despPeriodo?.forEach(d => {
        if (d.status === "PAGO") despPagasPeriodo += Number(d.valor || 0);
        if (d.status === "PENDENTE") despPendentesPeriodo += Number(d.valor || 0);
      });

      setUltimasDespesas((despPeriodo || []).slice(0, 6));

      // ==========================================
      // CÁLCULO DO SALDO ACUMULADO (HISTÓRICO)
      // ==========================================
      let reqRecAcum = supabase.from("receitas").select("valor_liquido").lte("data_inicio", uDia);
      let reqDespAcum = supabase.from("despesas").select("valor").lte("data_vencimento", uDia);

      // APLICA AS RESTRIÇÕES DE SEGURANÇA NAS QUERIES ACUMULADAS
      if (ativoFiltro !== "TODOS") {
        reqRecAcum = reqRecAcum.eq("ativo_id", ativoFiltro);
        reqDespAcum = reqDespAcum.eq("ativo_id", ativoFiltro);
      } else if (!perfilUsuario.is_admin && perfilUsuario.ativos_permitidos?.length > 0) {
        reqRecAcum = reqRecAcum.in("ativo_id", perfilUsuario.ativos_permitidos);
        reqDespAcum = reqDespAcum.in("ativo_id", perfilUsuario.ativos_permitidos);
      }

      const { data: recAcum } = await reqRecAcum;
      const { data: despAcum } = await reqDespAcum;

      let totalRecAcum = 0;
      recAcum?.forEach(r => totalRecAcum += Number(r.valor_liquido || 0));

      let totalDespAcum = 0;
      despAcum?.forEach(d => totalDespAcum += Number(d.valor || 0));

      const saldoFinalHistorico = totalRecAcum - totalDespAcum;

      setResumo({
        receitaLiquidaPeriodo: recLiqPeriodo,
        despesasPagasPeriodo: despPagasPeriodo,
        despesasPendentesPeriodo: despPendentesPeriodo,
        saldoAcumuladoHistorico: saldoFinalHistorico
      });

      setCarregando(false);
    }

    carregarDashboard();
  }, [mes, tipoData, ativoFiltro, supabase, perfilUsuario]);

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO E FILTROS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            Visão Geral
          </h2>
          <p className="text-sm text-slate-500 mt-1">Acompanhamento financeiro em tempo real do seu caixa.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          
          <select value={ativoFiltro} onChange={e => setAtivoFiltro(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none">
            <option value="TODOS">Consolidado (Todos)</option>
            {ativos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>

          <select value={tipoData} onChange={e => setTipoData(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none">
            <option value="MES">Por Mês</option>
            <option value="TUDO">Acumulado Total</option>
          </select>

          {tipoData === "MES" && (
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              className="h-9 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
          )}
        </div>
      </div>

      {/* CARDS DE INDICADORES (KPIs) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-500 ${carregando ? 'opacity-30' : 'opacity-100'}`}>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase">Receita Líquida</CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{brl(resumo.receitaLiquidaPeriodo)}</div>
            <p className="text-xs text-slate-400 mt-1">Entradas {tipoData === 'MES' ? 'neste mês' : 'totais'}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-green-700 uppercase">Saldo em Caixa</CardTitle>
            <Wallet className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-green-700">{brl(resumo.saldoAcumuladoHistorico)}</div>
            <p className="text-[11px] font-semibold text-green-600/70 mt-1 uppercase tracking-wide">Acumulado Histórico Real</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase">A Pagar (Pendentes)</CardTitle>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">{brl(resumo.despesasPendentesPeriodo)}</div>
            <p className="text-xs text-slate-400 mt-1">Contas pendentes {tipoData === 'MES' ? 'neste mês' : 'no período'}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-300 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase">Despesas Pagas</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-700">{brl(resumo.despesasPagasPeriodo)}</div>
            <p className="text-xs text-slate-400 mt-1">Contas quitadas {tipoData === 'MES' ? 'neste mês' : 'no período'}</p>
          </CardContent>
        </Card>

      </div>

      {/* PAINEL DE CONTAS DO PERÍODO */}
      <Card className={`shadow-sm border-slate-200 transition-opacity duration-500 ${carregando ? 'opacity-30' : 'opacity-100'}`}>
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-base text-slate-700 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Vencimentos e Despesas do Período
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ultimasDespesas.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-700">{d.data_vencimento.split("-").reverse().join("/")}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{d.descricao}</td>
                    <td className="px-6 py-4 text-slate-500">{d.categorias_despesa?.nome}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{brl(d.valor)}</td>
                    <td className="px-6 py-4 text-center">
                      {d.status === "PAGO" ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-bold">Pago</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs font-bold">Pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
                {ultimasDespesas.length === 0 && !carregando && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                      Nenhuma despesa localizada para os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}