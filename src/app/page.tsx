"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Wallet } from "lucide-react";

const brl = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export default function Dashboard() {
  const supabase = createClient();
  const [carregando, setCarregando] = useState(true);
  
  // Resumo do Mês
  const [resumo, setResumo] = useState({
    receitaLiquida: 0,
    despesasPagas: 0,
    despesasPendentes: 0,
    saldoMes: 0
  });

  // Últimas Movimentações para a tabela rápida
  const [ultimasDespesas, setUltimasDespesas] = useState<any[]>([]);

  useEffect(() => {
    async function carregarDashboard() {
      // O SEGREDO DAS DATAS: Descobre o primeiro e último dia do mês atual
      const dataAtual = new Date();
      const ano = dataAtual.getFullYear();
      const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
      
      const primeiroDia = `${ano}-${mes}-01`;
      const ultimoDia = new Date(ano, Number(mes), 0).toISOString().split('T')[0];

      // 1. Busca Receitas do mês (Filtro Inteligente de Datas)
      const { data: receitas } = await supabase
        .from("receitas")
        .select("valor_liquido")
        .gte("data_inicio", primeiroDia)
        .lte("data_inicio", ultimoDia);
      
      // 2. Busca Despesas do mês (Filtro Inteligente de Datas)
      const { data: despesas } = await supabase
        .from("despesas")
        .select("id, descricao, valor, status, data_vencimento, categorias_despesa(nome)")
        .gte("data_vencimento", primeiroDia)
        .lte("data_vencimento", ultimoDia)
        .order("data_vencimento", { ascending: true });

      // Matemática do Dashboard
      let totalReceitas = 0;
      let totalPagas = 0;
      let totalPendentes = 0;

      (receitas || []).forEach(r => totalReceitas += Number(r.valor_liquido));
      
      (despesas || []).forEach(d => {
        if (d.status === "PAGO") totalPagas += Number(d.valor);
        if (d.status === "PENDENTE") totalPendentes += Number(d.valor);
      });

      setResumo({
        receitaLiquida: totalReceitas,
        despesasPagas: totalPagas,
        despesasPendentes: totalPendentes,
        saldoMes: totalReceitas - totalPagas
      });

      // Pega só as 5 despesas mais urgentes para o painel
      setUltimasDespesas((despesas || []).slice(0, 5));
      setCarregando(false);
    }

    carregarDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Visão Geral</h2>
        <p className="text-sm text-slate-500 mt-1">Acompanhamento em tempo real do caixa deste mês.</p>
      </div>

      {/* CARDS DE INDICADORES (KPIs) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-500 ${carregando ? 'opacity-30' : 'opacity-100'}`}>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase">Receita Líquida</CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">{brl(resumo.receitaLiquida)}</div>
            <p className="text-xs text-slate-400 mt-1">Entradas do mês atual</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase">Saldo em Caixa</CardTitle>
            <Wallet className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-green-600">{brl(resumo.saldoMes)}</div>
            <p className="text-xs text-slate-400 mt-1">Receitas subtraindo despesas pagas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase">A Pagar (Pendentes)</CardTitle>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">{brl(resumo.despesasPendentes)}</div>
            <p className="text-xs text-slate-400 mt-1">Contas aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-300 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase">Despesas Pagas</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-700">{brl(resumo.despesasPagas)}</div>
            <p className="text-xs text-slate-400 mt-1">Contas já quitadas no mês</p>
          </CardContent>
        </Card>

      </div>

      {/* PAINEL DE CONTAS A PAGAR RÁPIDO */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-base text-slate-700 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Próximos Vencimentos (Neste Mês)
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
                    <td className="px-6 py-4 font-semibold text-slate-900">{d.descricao}</td>
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
                {ultimasDespesas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                      Nenhuma despesa lançada para este mês ainda.
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