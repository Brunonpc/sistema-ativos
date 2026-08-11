"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DollarSign, Plus, Trash2, Filter, CheckCircle2, AlertCircle } from "lucide-react";

const brl = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export default function DespesasPage() {
  const supabase = createClient();
  const [ativos, setAtivos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoTabela, setCarregandoTabela] = useState(true);

  // Estados do Formulário
  const [ativoId, setAtivoId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState("PENDENTE");

  // Estados dos Filtros
  const [filtroAtivo, setFiltroAtivo] = useState("TODOS");
  const [tipoData, setTipoData] = useState("MES");
  const [mesFiltro, setMesFiltro] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dataIniFiltro, setDataIniFiltro] = useState("");
  const [dataFimFiltro, setDataFimFiltro] = useState("");

  useEffect(() => {
    async function carregarListasBasicas() {
      const { data: atv } = await supabase.from("ativos").select("*").order("nome");
      const { data: cat } = await supabase.from("categorias_despesa").select("*, dre_grupos(nome)").order("nome");
      setAtivos(atv || []);
      setCategorias(cat || []);
    }
    carregarListasBasicas();
  }, [supabase]);

  useEffect(() => {
    carregarTabela();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroAtivo, tipoData, mesFiltro, dataIniFiltro, dataFimFiltro]);

  async function carregarTabela() {
    setCarregandoTabela(true);
    let req = supabase.from("despesas")
      .select("*, ativos(nome), categorias_despesa(nome, dre_grupos(nome))")
      .order("data_vencimento", { ascending: false });

    if (filtroAtivo !== "TODOS") {
      req = req.eq("ativo_id", filtroAtivo === "NENHUM" ? null : filtroAtivo);
    }

    if (tipoData === "MES" && mesFiltro) {
      const [anoStr, mesStr] = mesFiltro.split('-');
      const pDia = `${anoStr}-${mesStr}-01`;
      const uDia = new Date(Number(anoStr), Number(mesStr), 0).toISOString().split('T')[0];
      req = req.gte("data_vencimento", pDia).lte("data_vencimento", uDia);
    } else if (tipoData === "PERIODO") {
      if (dataIniFiltro) req = req.gte("data_vencimento", dataIniFiltro);
      if (dataFimFiltro) req = req.lte("data_vencimento", dataFimFiltro);
    }

    const { data } = await req;
    setDespesas(data || []);
    setCarregandoTabela(false);
  }

  async function salvarDespesa(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    const { error } = await supabase.from("despesas").insert({
      ativo_id: ativoId ? Number(ativoId) : null,
      categoria_id: Number(categoriaId),
      descricao,
      valor: Number(valor.replace(',', '.')),
      data_vencimento: dataVencimento,
      status
    });

    setCarregando(false);

    if (error) {
      alert("❌ Erro ao salvar despesa: " + error.message);
    } else {
      setAtivoId(""); setCategoriaId(""); setDescricao(""); setValor(""); setDataVencimento(""); setStatus("PENDENTE");
      carregarTabela();
    }
  }

  async function excluirDespesa(id: number) {
    if (!confirm("Tem certeza que deseja apagar esta despesa?")) return;
    await supabase.from("despesas").delete().eq("id", id);
    carregarTabela();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-red-600" />
          Contas a Pagar & Despesas
        </h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie seus custos operacionais e administrativos.</p>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
          <CardTitle className="text-lg text-slate-700">Nova Despesa</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={salvarDespesa} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Ativo (Opcional)</label>
                <select value={ativoId} onChange={e => setAtivoId(e.target.value)} 
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-red-600 bg-white text-sm">
                  <option value="">— Despesa Geral do Negócio —</option>
                  {ativos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Categoria (DRE)</label>
                <select required value={categoriaId} onChange={e => setCategoriaId(e.target.value)} 
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-red-600 bg-white text-sm">
                  <option value="">Selecione...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Descrição / Fornecedor</label>
                <input required type="text" placeholder="Ex: Marina, Limpeza, Luz..." value={descricao} onChange={e => setDescricao(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-red-600 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="text-sm font-bold text-red-600 mb-1 block">Valor (R$)</label>
                <input required type="text" placeholder="500,00" value={valor} onChange={e => setValor(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-red-200 focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-900" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Data de Vencimento</label>
                <input required type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-red-600 text-sm bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Status</label>
                <select required value={status} onChange={e => setStatus(e.target.value)} 
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-red-600 bg-white text-sm font-medium">
                  <option value="PENDENTE">A Pagar (Pendente)</option>
                  <option value="PAGO">Pago (Quitado)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={carregando} className="flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-6 py-2.5 rounded-md text-sm font-medium transition shadow-sm disabled:opacity-50">
                <Plus className="w-4 h-4" />
                {carregando ? "Salvando..." : "Salvar Despesa"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg text-slate-700">Contas e Despesas</CardTitle>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
              {despesas.length} lançamentos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 ml-1" />
            
            <select value={filtroAtivo} onChange={e => setFiltroAtivo(e.target.value)}
              className="h-8 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-red-600 outline-none max-w-[140px] truncate">
              <option value="TODOS">Todos (Geral + Ativos)</option>
              <option value="NENHUM">Somente Geral (Sem Ativo)</option>
              {ativos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>

            <select value={tipoData} onChange={e => setTipoData(e.target.value)}
              className="h-8 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-red-600 outline-none">
              <option value="MES">Por Mês</option>
              <option value="PERIODO">Período exato</option>
            </select>

            {tipoData === "MES" ? (
              <input type="month" value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
                className="h-8 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-red-600 outline-none" />
            ) : (
              <div className="flex items-center gap-1">
                <input type="date" value={dataIniFiltro} onChange={e => setDataIniFiltro(e.target.value)}
                  className="h-8 px-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-red-600 outline-none" />
                <span className="text-slate-400 text-xs">até</span>
                <input type="date" value={dataFimFiltro} onChange={e => setDataFimFiltro(e.target.value)}
                  className="h-8 px-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-red-600 outline-none" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`overflow-x-auto transition-opacity duration-300 ${carregandoTabela ? 'opacity-40' : 'opacity-100'}`}>
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria / DRE</th>
                  <th className="px-6 py-4">Ativo Vinculado</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {despesas.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {d.data_vencimento.split("-").reverse().join("/")}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{d.descricao}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 font-medium">{d.categorias_despesa?.nome}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{d.categorias_despesa?.dre_grupos?.nome}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {d.ativos?.nome || <span className="italic text-slate-300">Despesa Geral</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-red-600">{brl(d.valor)}</td>
                    <td className="px-6 py-4 text-center">
                      {d.status === "PAGO" ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-bold border border-green-200">
                          <CheckCircle2 className="w-3 h-3" /> Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-xs font-bold border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </td>
                    {/* CORRIGIDO DE r.id PARA d.id */}
                    <td className="px-6 py-4 flex justify-center">
                      <button onClick={() => excluirDespesa(d.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {despesas.length === 0 && !carregandoTabela && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">Nenhum lançamento encontrado para este filtro.</td>
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