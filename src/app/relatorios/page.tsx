"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { FileText, Download, TrendingUp, Filter, DollarSign } from "lucide-react";

const brl = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export default function DreRelatoriosPage() {
  const supabase = createClient();
  const [ativos, setAtivos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [mes, setMes] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [ativoFiltro, setAtivoFiltro] = useState("TODOS");

  const [dre, setDre] = useState({
    receitaBruta: 0,
    deducoes: 0,
    receitaLiquida: 0,
    custosDiretos: 0,
    margemContribuicao: 0,
    despesasFixas: 0,
    impostos: 0,
    lucroLiquido: 0,
    distribuicaoLucro: 0,
    saldoCaixa: 0,
    margemLucroPct: 0
  });

  useEffect(() => {
    async function carregarAtivos() {
      const { data } = await supabase.from("ativos").select("id, nome").order("nome");
      setAtivos(data || []);
    }
    carregarAtivos();
  }, [supabase]);

  useEffect(() => {
    async function gerarDRE() {
      setCarregando(true);

      const [ano, mesStr] = mes.split('-');
      const primeiroDia = `${ano}-${mesStr}-01`;
      const ultimoDia = new Date(Number(ano), Number(mesStr), 0).toISOString().split('T')[0];

      let reqRec = supabase.from("receitas")
        .select("*")
        .gte("data_inicio", primeiroDia)
        .lte("data_inicio", ultimoDia);
      
      if (ativoFiltro !== "TODOS") reqRec = reqRec.eq("ativo_id", ativoFiltro);
      const { data: receitas } = await reqRec;

      let reqDesp = supabase.from("despesas")
        .select("valor, categorias_despesa(dre_grupos(tipo))")
        .gte("data_vencimento", primeiroDia)
        .lte("data_vencimento", ultimoDia);
      
      if (ativoFiltro !== "TODOS") reqDesp = reqDesp.eq("ativo_id", ativoFiltro);
      const { data: despesas } = await reqDesp;

      let rBruta = 0, deduc = 0, cDireto = 0, dFixa = 0, imp = 0, distLucro = 0;

      (receitas || []).forEach(r => {
        rBruta += Number(r.valor_bruto || 0);
        deduc += (Number(r.taxas_plataforma || 0) + Number(r.taxas_limpeza || 0));
      });

      (despesas || []).forEach(d => {
        // Tipagem segura com (d as any) para evitar erro do TypeScript
        const tipo = (d as any).categorias_despesa?.dre_grupos?.tipo;
        const valor = Number(d.valor || 0);
        
        if (tipo === 'CUSTO_DIRETO') cDireto += valor;
        if (tipo === 'DESPESA_FIXA') dFixa += valor;
        if (tipo === 'IMPOSTO') imp += valor;
        if (tipo === 'DISTRIBUICAO_LUCRO') distLucro += valor;
      });

      const rLiquida = rBruta - deduc;
      const mContrib = rLiquida - cDireto;
      const lucroLiq = mContrib - dFixa - imp;
      const sCaixa = lucroLiq - distLucro;
      const margemPct = rLiquida > 0 ? (lucroLiq / rLiquida) * 100 : 0;

      setDre({
        receitaBruta: rBruta,
        deducoes: deduc,
        receitaLiquida: rLiquida,
        custosDiretos: cDireto,
        margemContribuicao: mContrib,
        despesasFixas: dFixa,
        impostos: imp,
        lucroLiquido: lucroLiq,
        distribuicaoLucro: distLucro,
        saldoCaixa: sCaixa,
        margemLucroPct: margemPct
      });

      setCarregando(false);
    }

    gerarDRE();
  }, [mes, ativoFiltro, supabase]);

  const mesExtenso = new Date(`${mes}-02`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            DRE & Relatórios
          </h2>
          <p className="text-sm text-slate-500 mt-1">Demonstrativo do Resultado do Exercício e Análise de Margem.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <span className="text-sm font-semibold text-slate-600">Filtros:</span>
          
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
          
          <select value={ativoFiltro} onChange={e => setAtivoFiltro(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none min-w-[200px]">
            <option value="TODOS">Visão Consolidada (Todos)</option>
            {ativos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
      </div>

      <Card className={`shadow-md border-slate-200 overflow-hidden transition-opacity duration-300 ${carregando ? 'opacity-50' : 'opacity-100'}`}>
        <CardHeader className="bg-[#0f172a] flex flex-row items-center justify-between py-5">
          <div>
            <CardTitle className="text-lg text-white">
              {ativoFiltro === "TODOS" ? "DRE - Visão Consolidada" : `DRE - ${ativos.find(a => a.id === Number(ativoFiltro))?.nome}`}
            </CardTitle>
            <p className="text-slate-400 text-sm mt-1">Regime de Competência - {mesExtenso}</p>
          </div>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium transition border border-slate-700">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="w-full text-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50">
              <span className="font-medium text-slate-700"><span className="text-slate-400 mr-2">(+)</span> Receita Bruta Operacional</span>
              <span className="font-semibold text-slate-900">{brl(dre.receitaBruta)}</span>
            </div>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50">
              <span className="font-medium text-slate-500"><span className="text-slate-300 mr-2">(-)</span> Deduções, Taxas de Plataforma e Limpeza</span>
              <span className="font-medium text-red-500">-{brl(dre.deducoes)}</span>
            </div>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-blue-50/50">
              <span className="font-bold text-blue-700 uppercase"><span className="text-blue-400 mr-2">(=)</span> Receita Operacional Líquida</span>
              <span className="font-black text-blue-700">{brl(dre.receitaLiquida)}</span>
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50">
              <span className="font-medium text-slate-500"><span className="text-slate-300 mr-2">(-)</span> Custos Diretos da Operação (Combustível, Marina, Limpeza)</span>
              <span className="font-medium text-red-500">-{brl(dre.custosDiretos)}</span>
            </div>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-800 uppercase"><span className="text-slate-400 mr-2">(=)</span> Margem de Contribuição</span>
              <span className="font-black text-slate-900">{brl(dre.margemContribuicao)}</span>
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50">
              <span className="font-medium text-slate-500"><span className="text-slate-300 mr-2">(-)</span> Despesas Fixas e Administrativas</span>
              <span className="font-medium text-red-500">-{brl(dre.despesasFixas)}</span>
            </div>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50">
              <span className="font-medium text-slate-500"><span className="text-slate-300 mr-2">(-)</span> Impostos e Taxas Governamentais</span>
              <span className="font-medium text-red-500">-{brl(dre.impostos)}</span>
            </div>

            <div className="flex justify-between items-center px-6 py-5 bg-[#16a34a] text-white">
              <span className="font-black uppercase text-base flex items-center gap-2">
                <span className="text-green-300">(=)</span> <DollarSign className="w-5 h-5" /> Resultado (Lucro/Prejuízo Líquido)
              </span>
              <span className="font-black text-xl">{brl(dre.lucroLiquido)}</span>
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
              <span className="font-semibold text-slate-600"><span className="text-slate-400 mr-2">(-)</span> Distribuição de Lucro aos Sócios</span>
              <span className="font-bold text-red-500">-{brl(dre.distribuicaoLucro)}</span>
            </div>
            <div className="flex justify-between items-center px-6 py-5 bg-[#1e40af] text-white shadow-inner">
              <span className="font-black uppercase text-base flex items-center gap-2">
                <span className="text-blue-300">(=)</span> Saldo em Caixa Final
              </span>
              <span className="font-black text-xl">{brl(dre.saldoCaixa)}</span>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Margem de Lucro</p>
            <div className="text-3xl font-black text-slate-800">
              {dre.margemLucroPct.toFixed(2).replace('.', ',')}%
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-full border border-slate-100">
            <TrendingUp className={`w-8 h-8 ${dre.margemLucroPct >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}