"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Activity, Filter, Building, TrendingUp, Clock, DollarSign } from "lucide-react";

const brl = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export default function RelatorioOperacionalPage() {
  const supabase = createClient();
  const [ativos, setAtivos] = useState<any[]>([]);
  const [ativoSelecionado, setAtivoSelecionado] = useState<any>(null);

  const [ativoId, setAtivoId] = useState("");
  const [tipoFiltroData, setTipoFiltroData] = useState("MES");
  const [mesFiltro, setMesFiltro] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [receitas, setReceitas] = useState<any[]>([]);
  const [despesasMesTotal, setDespesasMesTotal] = useState(0);
  const [totalHorasRodadas, setTotalHorasRodadas] = useState(0);
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [faturamentoLiquido, setFaturamentoLiquido] = useState(0);

  const [retornoAcumulado, setRetornoAcumulado] = useState(0);
  const [paybackMeses, setPaybackMeses] = useState(0);
  const [multiplicadorRoi, setMultiplicadorRoi] = useState(0);

  useEffect(() => {
    async function carregarAtivos() {
      const { data } = await supabase.from("ativos").select("*").order("nome");
      setAtivos(data || []);
      if (data && data.length > 0) {
        setAtivoId(String(data[0].id));
      }
    }
    carregarAtivos();
  }, [supabase]);

  useEffect(() => {
    if (!ativoId) return;

    async function processarRelatorio() {
      const atv = ativos.find(a => String(a.id) === String(ativoId));
      setAtivoSelecionado(atv);

      let pDia = "";
      let uDia = "";

      if (tipoFiltroData === "MES" && mesFiltro) {
        const [ano, mes] = mesFiltro.split('-');
        pDia = `${ano}-${mes}-01`;
        uDia = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
      } else if (tipoFiltroData === "PERIODO") {
        pDia = dataInicio || "2000-01-01";
        uDia = dataFim || "2100-12-31";
      }

      const { data: recs } = await supabase.from("receitas")
        .select("*")
        .eq("ativo_id", Number(ativoId))
        .gte("data_inicio", pDia)
        .lte("data_inicio", uDia)
        .order("data_inicio", { ascending: false });

      setReceitas(recs || []);

      let fatBruto = 0;
      (recs || []).forEach(r => {
        fatBruto += Number(r.valor_liquido || 0);
      });
      setFaturamentoTotal(fatBruto);

      const { data: desps } = await supabase.from("despesas")
        .select("valor, categorias_despesa(dre_grupos(tipo))")
        .eq("ativo_id", Number(ativoId))
        .gte("data_vencimento", pDia)
        .lte("data_vencimento", uDia);

      let somaDespesas = 0;
      (desps || []).forEach(d => {
        // Tipagem segura com (d as any)
        const tipoGrupo = (d as any).categorias_despesa?.dre_grupos?.tipo;
        if (tipoGrupo !== 'DISTRIBUICAO_LUCRO') {
          somaDespesas += Number(d.valor || 0);
        }
      });
      setDespesasMesTotal(somaDespesas);
      setFaturamentoLiquido(fatBruto - somaDespesas);

      let horas = 0;
      if (atv?.tipo === 'EMBARCACAO') {
        const { data: ops } = await supabase.from("operacional")
          .select("total_horas")
          .eq("ativo_id", Number(ativoId))
          .gte("data_registro", pDia)
          .lte("data_registro", uDia);

        (ops || []).forEach(o => {
          horas += Number(o.total_horas || 0);
        });
      }
      setTotalHorasRodadas(horas);

      const { data: todasRecsAtivo } = await supabase.from("receitas").select("valor_liquido").eq("ativo_id", Number(ativoId));
      const { data: todasDespsAtivo } = await supabase.from("despesas").select("valor, categorias_despesa(dre_grupos(tipo))").eq("ativo_id", Number(ativoId));
      
      let totRecHistorico = 0;
      (todasRecsAtivo || []).forEach(r => totRecHistorico += Number(r.valor_liquido || 0));
      let totDespHistorico = 0;
      (todasDespsAtivo || []).forEach(d => {
        if ((d as any).categorias_despesa?.dre_grupos?.tipo !== 'DISTRIBUICAO_LUCRO') {
          totDespHistorico += Number(d.valor || 0);
        }
      });

      const retornoLiquidoHistorico = totRecHistorico - totDespHistorico;
      setRetornoAcumulado(retornoLiquidoHistorico);

      const inv = Number(atv?.investimento || 0);
      if (inv > 0) {
        setMultiplicadorRoi(retornoLiquidoHistorico / inv);
        const liquidoAtual = fatBruto - somaDespesas;
        if (liquidoAtual > 0) {
          setPaybackMeses(inv / liquidoAtual);
        } else {
          setPaybackMeses(0);
        }
      } else {
        setMultiplicadorRoi(0);
        setPaybackMeses(0);
      }
    }

    processarRelatorio();
  }, [ativoId, tipoFiltroData, mesFiltro, dataInicio, dataFim, ativos, supabase]);

  const totalDiasPeriodo = receitas.reduce((acc, r) => acc + Number(r.duracao_medida || 0), 0);
  const despesaMediaPorDia = totalDiasPeriodo > 0 ? despesasMesTotal / totalDiasPeriodo : 0;
  const faturamentoPorHora = totalHorasRodadas > 0 ? faturamentoTotal / totalHorasRodadas : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Relatório Operacional
          </h2>
          <p className="text-sm text-slate-500 mt-1">Análise de desempenho operacional, estadias, horímetro e ROI por ativo.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          
          <select value={ativoId} onChange={e => setAtivoId(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none">
            {ativos.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.tipo})</option>)}
          </select>

          <select value={tipoFiltroData} onChange={e => setTipoFiltroData(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none">
            <option value="MES">Por Mês</option>
            <option value="PERIODO">Período Exato</option>
          </select>

          {tipoFiltroData === "MES" ? (
            <input type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
              className="h-9 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
          ) : (
            <div className="flex items-center gap-1">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                className="h-9 px-2 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
              <span className="text-slate-400 text-xs">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                className="h-9 px-2 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-500 uppercase">Valor Investido</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-slate-800">{brl(Number(ativoSelecionado?.investimento || 0))}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-500 uppercase">Retorno Líquido Acumulado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-green-600">{brl(retornoAcumulado)}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-500 uppercase">Multiplicador de ROI</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-purple-600">{multiplicadorRoi.toFixed(2)}x</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-500 uppercase">Payback Estimado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-amber-600">{paybackMeses > 0 ? `${paybackMeses.toFixed(1)} meses` : 'N/A'}</div></CardContent>
        </Card>
      </div>

      {ativoSelecionado?.tipo === 'IMOVEL' && (
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" /> Resumo de Estadias & Despesas Proporcionais
              </CardTitle>
              <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded border border-slate-200 font-medium">
                Despesas do Período (sem lucros): <strong className="text-red-600">{brl(despesasMesTotal)}</strong> | Média/Dia: <strong className="text-slate-800">{brl(despesaMediaPorDia)}</strong>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white border-b text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Hóspede / Cliente</th>
                      <th className="px-6 py-4">Período da Estadia</th>
                      <th className="px-6 py-4 text-center">Total Dias</th>
                      <th className="px-6 py-4 text-right">Receita Líquida</th>
                      <th className="px-6 py-4 text-right">Valor por Dia</th>
                      <th className="px-6 py-4 text-right">Despesa Proporcional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receitas.map((r) => {
                      const dias = Number(r.duracao_medida || 0);
                      const valorLiq = Number(r.valor_liquido || 0);
                      const valorPorDia = dias > 0 ? valorLiq / dias : 0;
                      const despesaProporcional = dias * despesaMediaPorDia;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900">{r.cliente}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {r.data_inicio.split("-").reverse().join("/")} até {r.data_fim.split("-").reverse().join("/")}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold text-xs">{dias} dias</span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-green-700">{brl(valorLiq)}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">{brl(valorPorDia)} / dia</td>
                          <td className="px-6 py-4 text-right font-bold text-red-500">-{brl(despesaProporcional)}</td>
                        </tr>
                      );
                    })}
                    {receitas.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">Nenhuma estadia registrada neste período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {ativoSelecionado?.tipo === 'EMBARCACAO' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 text-white shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Clock className="w-4 h-4 text-blue-400" /> Horas Rodadas no Período</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-black text-blue-400">{totalHorasRodadas} horas</div></CardContent>
            </Card>
            <Card className="bg-slate-900 text-white shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-400" /> Faturamento por Hora</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-black text-green-400">{brl(faturamentoPorHora)} / h</div></CardContent>
            </Card>
            <Card className="bg-slate-900 text-white shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><DollarSign className="w-4 h-4 text-amber-400" /> Faturamento Líquido (Receitas - Desp.)</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-black text-amber-400">{brl(faturamentoLiquido)}</div></CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-base text-slate-700">Histórico de Receitas da Embarcação</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white border-b text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Cliente / Descrição</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4 text-center">Duração</th>
                      <th className="px-6 py-4 text-right">Valor Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receitas.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{r.cliente}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{r.data_inicio.split("-").reverse().join("/")}</td>
                        <td className="px-6 py-4 text-center"><span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold text-xs">{r.duracao_medida} horas</span></td>
                        <td className="px-6 py-4 text-right font-black text-green-700">{brl(Number(r.valor_liquido || 0))}</td>
                      </tr>
                    ))}
                    {receitas.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Nenhum passeio registrado neste período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}