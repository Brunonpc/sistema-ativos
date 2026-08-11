"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Receipt, Plus, Trash2, Calendar, Calculator, Filter } from "lucide-react";

const brl = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export default function ReceitasPage() {
  const supabase = createClient();
  const [ativos, setAtivos] = useState<any[]>([]);
  const [receitas, setReceitas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoTabela, setCarregandoTabela] = useState(true);

  // Estados do Formulário
  const [ativoId, setAtivoId] = useState("");
  const [cliente, setCliente] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [duracao, setDuracao] = useState("");
  const [valorBruto, setValorBruto] = useState("");
  const [taxaPlataforma, setTaxaPlataforma] = useState("");
  const [taxaLimpeza, setTaxaLimpeza] = useState("");
  const [valorLiquido, setValorLiquido] = useState(0);

  // Estados dos Filtros
  const [filtroAtivo, setFiltroAtivo] = useState("TODOS");
  const [tipoData, setTipoData] = useState("MES");
  const [mesFiltro, setMesFiltro] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dataIniFiltro, setDataIniFiltro] = useState("");
  const [dataFimFiltro, setDataFimFiltro] = useState("");

  // Carrega os ativos apenas uma vez ao abrir a tela
  useEffect(() => {
    async function carregarAtivos() {
      const { data } = await supabase.from("ativos").select("*").order("nome");
      setAtivos(data || []);
    }
    carregarAtivos();
  }, [supabase]);

  // Busca as receitas sempre que um filtro mudar
  useEffect(() => {
    carregarTabela();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroAtivo, tipoData, mesFiltro, dataIniFiltro, dataFimFiltro]);

  async function carregarTabela() {
    setCarregandoTabela(true);
    let req = supabase.from("receitas").select("*, ativos(nome, metrica_padrao)").order("data_inicio", { ascending: false });

    // Filtro de Ativo
    if (filtroAtivo !== "TODOS") {
      req = req.eq("ativo_id", filtroAtivo);
    }

    // Filtro de Datas
    if (tipoData === "MES" && mesFiltro) {
      const [anoStr, mesStr] = mesFiltro.split('-');
      const pDia = `${anoStr}-${mesStr}-01`;
      const uDia = new Date(Number(anoStr), Number(mesStr), 0).toISOString().split('T')[0];
      req = req.gte("data_inicio", pDia).lte("data_inicio", uDia);
    } else if (tipoData === "PERIODO") {
      if (dataIniFiltro) req = req.gte("data_inicio", dataIniFiltro);
      if (dataFimFiltro) req = req.lte("data_inicio", dataFimFiltro);
    }

    const { data } = await req;
    setReceitas(data || []);
    setCarregandoTabela(false);
  }

  // AUTOMAÇÃO DAS DATAS
  useEffect(() => {
    if (dataInicio && dataFim) {
      const start = new Date(dataInicio);
      const end = new Date(dataFim);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) setDuracao(String(diffDays));
    }
  }, [dataInicio, dataFim]);

  // AUTOMAÇÃO DO VALOR LÍQUIDO
  useEffect(() => {
    const bruto = Number(valorBruto.replace(',', '.')) || 0;
    const tPlat = Number(taxaPlataforma.replace(',', '.')) || 0;
    const tLimp = Number(taxaLimpeza.replace(',', '.')) || 0;
    setValorLiquido(bruto - tPlat - tLimp);
  }, [valorBruto, taxaPlataforma, taxaLimpeza]);

  async function salvarReceita(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    const { error } = await supabase.from("receitas").insert({
      ativo_id: Number(ativoId),
      cliente,
      data_inicio: dataInicio,
      data_fim: dataFim,
      duracao_medida: duracao ? Number(duracao.replace(',', '.')) : 0,
      valor_bruto: Number(valorBruto.replace(',', '.')),
      taxas_plataforma: taxaPlataforma ? Number(taxaPlataforma.replace(',', '.')) : 0,
      taxas_limpeza: taxaLimpeza ? Number(taxaLimpeza.replace(',', '.')) : 0,
      valor_liquido: valorLiquido
    });

    setCarregando(false);

    if (error) {
      alert("❌ Erro ao salvar receita: " + error.message);
    } else {
      setAtivoId(""); setCliente(""); setDataInicio(""); setDataFim(""); setDuracao("");
      setValorBruto(""); setTaxaPlataforma(""); setTaxaLimpeza(""); setValorLiquido(0);
      carregarTabela();
    }
  }

  async function excluirReceita(id: number) {
    if (!confirm("Tem certeza que deseja apagar esta receita?")) return;
    await supabase.from("receitas").delete().eq("id", id);
    carregarTabela();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-blue-600" />
          Receitas & Locações
        </h2>
        <p className="text-sm text-slate-500 mt-1">Registre os aluguéis do Airbnb e os passeios das embarcações.</p>
      </div>

      {/* FORMULÁRIO */}
      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
          <CardTitle className="text-lg text-slate-700">Novo Lançamento</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={salvarReceita} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Ativo (O que rendeu dinheiro?)</label>
                <select required value={ativoId} onChange={e => setAtivoId(e.target.value)} 
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-600 bg-white text-sm">
                  <option value="">Selecione o imóvel ou embarcação...</option>
                  {ativos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Cliente / Plataforma</label>
                <input required type="text" placeholder="Ex: João - Airbnb" value={cliente} onChange={e => setCliente(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-600 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Data de Início (Check-in)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input required type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-600 text-sm bg-white" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Data Fim (Check-out)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input required type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-600 text-sm bg-white" />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-blue-700 mb-1 block">Duração (Dias / Horas)</label>
                <input required type="number" step="0.1" placeholder="Calculado auto..." value={duracao} onChange={e => setDuracao(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-blue-200 bg-blue-50/50 focus:ring-2 focus:ring-blue-600 text-sm font-bold text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Valor Bruto (R$)</label>
                <input required type="text" placeholder="1000,00" value={valorBruto} onChange={e => setValorBruto(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-600 text-sm font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-red-400 uppercase block mb-1">Taxa Plataforma (R$)</label>
                <input type="text" placeholder="150,00" value={taxaPlataforma} onChange={e => setTaxaPlataforma(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-red-200 focus:ring-2 focus:ring-red-500 text-sm text-red-600 font-medium" />
              </div>
              <div>
                <label className="text-xs font-bold text-red-400 uppercase block mb-1">Limpeza/Outros (R$)</label>
                <input type="text" placeholder="100,00" value={taxaLimpeza} onChange={e => setTaxaLimpeza(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-red-200 focus:ring-2 focus:ring-red-500 text-sm text-red-600 font-medium" />
              </div>
              <div>
                <label className="text-xs font-black text-green-600 uppercase block mb-1 flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Líquido (Automático)
                </label>
                <div className="w-full h-10 px-3 rounded-md border border-green-200 bg-green-50 flex items-center text-sm font-black text-green-700">
                  {brl(valorLiquido)}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={carregando} className="flex items-center gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-6 py-2.5 rounded-md text-sm font-medium transition shadow-sm disabled:opacity-50">
                <Plus className="w-4 h-4" />
                {carregando ? "Salvando..." : "Salvar Lançamento"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* HISTÓRICO COM FILTROS */}
      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg text-slate-700">Histórico de Receitas</CardTitle>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
              {receitas.length} lançamentos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 ml-1" />
            
            <select value={filtroAtivo} onChange={e => setFiltroAtivo(e.target.value)}
              className="h-8 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 outline-none max-w-[140px] truncate">
              <option value="TODOS">Todos Ativos</option>
              {ativos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>

            <select value={tipoData} onChange={e => setTipoData(e.target.value)}
              className="h-8 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 outline-none">
              <option value="MES">Por Mês</option>
              <option value="PERIODO">Período exato</option>
            </select>

            {tipoData === "MES" ? (
              <input type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
                className="h-8 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 outline-none" />
            ) : (
              <div className="flex items-center gap-1">
                <input type="date" value={dataIniFiltro} onChange={e => setDataIniFiltro(e.target.value)}
                  className="h-8 px-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 outline-none" />
                <span className="text-slate-400 text-xs">até</span>
                <input type="date" value={dataFimFiltro} onChange={e => setDataFimFiltro(e.target.value)}
                  className="h-8 px-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 outline-none" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`overflow-x-auto transition-opacity duration-300 ${carregandoTabela ? 'opacity-40' : 'opacity-100'}`}>
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Ativo</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Período</th>
                  <th className="px-6 py-4 text-center">Duração</th>
                  <th className="px-6 py-4 text-right">Bruto</th>
                  <th className="px-6 py-4 text-right">Taxas</th>
                  <th className="px-6 py-4 text-right">Líquido</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receitas.map((r) => {
                  const taxaTotal = Number(r.taxas_plataforma) + Number(r.taxas_limpeza);
                  const metrica = r.ativos?.metrica_padrao === 'HORAS' ? 'hora' : 'dia';
                  const valorDiaria = r.duracao_medida > 0 ? (Number(r.valor_liquido) / Number(r.duracao_medida)) : 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{r.ativos?.nome}</td>
                      <td className="px-6 py-4 text-slate-600">{r.cliente}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {r.data_inicio.split("-").reverse().join("/")} até {r.data_fim.split("-").reverse().join("/")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium text-xs">
                          {r.duracao_medida} {metrica}s
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">{brl(r.valor_bruto)}</td>
                      <td className="px-6 py-4 text-right text-red-500 font-medium">
                        {taxaTotal > 0 ? `-${brl(taxaTotal)}` : "R$ 0,00"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-black text-green-700">{brl(r.valor_liquido)}</div>
                        {r.duracao_medida > 0 && (
                          <div className="text-[11px] text-slate-500 font-semibold mt-1">({brl(valorDiaria)} / {metrica})</div>
                        )}
                      </td>
                      <td className="px-6 py-4 flex justify-center">
                        <button onClick={() => excluirReceita(r.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {receitas.length === 0 && !carregandoTabela && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400 italic">Nenhum lançamento encontrado para este filtro.</td>
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