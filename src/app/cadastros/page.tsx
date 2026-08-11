"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Layers, Plus, Trash2, Building, Ship, DollarSign, Pencil, X } from "lucide-react";

const brl = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export default function CadastrosPage() {
  const supabase = createClient();
  
  // Estados para Ativos
  const [ativos, setAtivos] = useState<any[]>([]);
  const [nomeAtivo, setNomeAtivo] = useState("");
  const [tipoAtivo, setTipoAtivo] = useState("IMOVEL");
  const [metricaPadrao, setMetricaPadrao] = useState("DIAS");
  const [investimento, setInvestimento] = useState("");
  const [editandoAtivoId, setEditandoAtivoId] = useState<number | null>(null);
  
  // Estados para DRE Grupos e Categorias
  const [gruposDre, setGruposDre] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [dreGrupoId, setDreGrupoId] = useState("");
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<number | null>(null);

  const [carregandoAtivo, setCarregandoAtivo] = useState(false);
  const [carregandoCat, setCarregandoCat] = useState(false);

  async function carregarTabelas() {
    const { data: dadosAtivos } = await supabase.from("ativos").select("*").order("nome");
    const { data: dadosGrupos } = await supabase.from("dre_grupos").select("*").order("nome");
    const { data: dadosCat } = await supabase.from("categorias_despesa").select("*, dre_grupos(nome)").order("nome");

    setAtivos(dadosAtivos || []);
    setGruposDre(dadosGrupos || []);
    setCategorias(dadosCat || []);
  }

  useEffect(() => { carregarTabelas(); }, []);

  // ================= FUNÇÕES DE ATIVOS =================

  function iniciarEdicaoAtivo(ativo: any) {
    setEditandoAtivoId(ativo.id);
    setNomeAtivo(ativo.nome);
    setTipoAtivo(ativo.tipo);
    setMetricaPadrao(ativo.metrica_padrao);
    setInvestimento(ativo.investimento ? String(ativo.investimento).replace('.', ',') : "");
    // Rola a página para o topo suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicaoAtivo() {
    setEditandoAtivoId(null);
    setNomeAtivo("");
    setTipoAtivo("IMOVEL");
    setMetricaPadrao("DIAS");
    setInvestimento("");
  }

  async function salvarAtivo(e: React.FormEvent) {
    e.preventDefault();
    setCarregandoAtivo(true);

    const dadosParaSalvar = {
      nome: nomeAtivo,
      tipo: tipoAtivo,
      metrica_padrao: metricaPadrao,
      investimento: investimento ? Number(investimento.replace(',', '.')) : null
    };

    let error;

    if (editandoAtivoId) {
      // ATUALIZAR
      const res = await supabase.from("ativos").update(dadosParaSalvar).eq("id", editandoAtivoId);
      error = res.error;
    } else {
      // CRIAR NOVO
      const res = await supabase.from("ativos").insert(dadosParaSalvar);
      error = res.error;
    }

    setCarregandoAtivo(false);

    if (error) {
      alert("❌ Erro ao salvar Ativo: " + error.message);
    } else {
      cancelarEdicaoAtivo();
      carregarTabelas();
    }
  }

  async function excluirAtivo(id: number) {
    if (!confirm("Tem certeza? Isso apagará histórico financeiro e operacional vinculado a este ativo.")) return;
    await supabase.from("ativos").delete().eq("id", id);
    if (editandoAtivoId === id) cancelarEdicaoAtivo();
    carregarTabelas();
  }

  // ================= FUNÇÕES DE CATEGORIAS =================

  function iniciarEdicaoCategoria(categoria: any) {
    setEditandoCategoriaId(categoria.id);
    setNomeCategoria(categoria.nome);
    setDreGrupoId(String(categoria.dre_grupo_id));
  }

  function cancelarEdicaoCategoria() {
    setEditandoCategoriaId(null);
    setNomeCategoria("");
    setDreGrupoId("");
  }

  async function salvarCategoria(e: React.FormEvent) {
    e.preventDefault();
    setCarregandoCat(true);

    const dadosParaSalvar = {
      nome: nomeCategoria,
      dre_grupo_id: Number(dreGrupoId)
    };

    let error;

    if (editandoCategoriaId) {
      // ATUALIZAR
      const res = await supabase.from("categorias_despesa").update(dadosParaSalvar).eq("id", editandoCategoriaId);
      error = res.error;
    } else {
      // CRIAR NOVO
      const res = await supabase.from("categorias_despesa").insert(dadosParaSalvar);
      error = res.error;
    }

    setCarregandoCat(false);

    if (error) {
      alert("❌ Erro ao salvar Categoria: " + error.message);
    } else {
      cancelarEdicaoCategoria();
      carregarTabelas();
    }
  }

  async function excluirCategoria(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    await supabase.from("categorias_despesa").delete().eq("id", id);
    if (editandoCategoriaId === id) cancelarEdicaoCategoria();
    carregarTabelas();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-6 h-6 text-slate-700" />
          Cadastros do Sistema
        </h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie seus ativos de locação, investimento e estrutura do plano de contas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FORMULÁRIO DE ATIVOS */}
        <Card className={editandoAtivoId ? "ring-2 ring-blue-500 shadow-lg" : ""}>
          <CardHeader className={`${editandoAtivoId ? 'bg-blue-50' : 'bg-slate-50'} border-b border-slate-100 rounded-t-xl transition-colors`}>
            <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
              <Building className={`w-5 h-5 ${editandoAtivoId ? 'text-blue-600' : 'text-slate-500'}`} /> 
              {editandoAtivoId ? "Editando Ativo" : "Novo Ativo (Imóvel / Embarcação)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={salvarAtivo} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Nome do Ativo</label>
                <input required type="text" placeholder="Ex: Lancha Seadoo / Casa Airbnb" value={nomeAtivo} onChange={e => setNomeAtivo(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Tipo de Ativo</label>
                  <select value={tipoAtivo} onChange={e => {
                    const val = e.target.value;
                    setTipoAtivo(val);
                    setMetricaPadrao(val === 'IMOVEL' ? 'DIAS' : 'HORAS');
                  }} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-600 outline-none">
                    <option value="IMOVEL">Imóvel (Airbnb / Casa)</option>
                    <option value="EMBARCACAO">Embarcação (Jet / Lancha)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block">Métrica de Operação</label>
                  <input disabled value={metricaPadrao === 'DIAS' ? 'Dias (Estadia)' : 'Horas (Horímetro)'}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-100 text-slate-500 text-sm font-medium" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600" /> Valor do Investimento Inicial (R$)
                </label>
                <input type="text" placeholder="Ex: 150000,00" value={investimento} onChange={e => setInvestimento(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none font-medium" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {editandoAtivoId && (
                  <button type="button" onClick={cancelarEdicaoAtivo} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 px-4 py-2 text-sm font-medium transition">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                )}
                <button type="submit" disabled={carregandoAtivo} className={`flex items-center gap-2 text-white px-6 py-2 rounded-md text-sm font-medium transition shadow-sm disabled:opacity-50 ${editandoAtivoId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-900'}`}>
                  {editandoAtivoId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {carregandoAtivo ? "Salvando..." : (editandoAtivoId ? "Atualizar Ativo" : "Adicionar Ativo")}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FORMULÁRIO DE CATEGORIAS */}
        <Card className={editandoCategoriaId ? "ring-2 ring-slate-400 shadow-lg" : ""}>
          <CardHeader className={`${editandoCategoriaId ? 'bg-slate-100' : 'bg-slate-50'} border-b border-slate-100 rounded-t-xl transition-colors`}>
            <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
              <Layers className={`w-5 h-5 ${editandoCategoriaId ? 'text-slate-600' : 'text-slate-400'}`} />
              {editandoCategoriaId ? "Editando Categoria" : "Nova Categoria de Despesa"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={salvarCategoria} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Nome da Despesa</label>
                <input required type="text" placeholder="Ex: Manutenção Preventiva" value={nomeCategoria} onChange={e => setNomeCategoria(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-slate-600 outline-none" />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Grupo no DRE (Plano de Contas)</label>
                <select required value={dreGrupoId} onChange={e => setDreGrupoId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-slate-600 outline-none">
                  <option value="">Onde essa despesa entra no DRE?</option>
                  {gruposDre.map(g => <option key={g.id} value={g.id}>{g.nome} ({g.tipo})</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-8">
                {editandoCategoriaId && (
                  <button type="button" onClick={cancelarEdicaoCategoria} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 px-4 py-2 text-sm font-medium transition">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                )}
                <button type="submit" disabled={carregandoCat} className={`flex items-center gap-2 text-white px-6 py-2 rounded-md text-sm font-medium transition shadow-sm disabled:opacity-50 ${editandoCategoriaId ? 'bg-slate-600 hover:bg-slate-700' : 'bg-slate-800 hover:bg-slate-900'}`}>
                  {editandoCategoriaId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {carregandoCat ? "Salvando..." : (editandoCategoriaId ? "Atualizar Categoria" : "Adicionar Categoria")}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>

      {/* TABELAS DE LISTAGEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LISTA DE ATIVOS */}
        <Card>
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
            <CardTitle className="text-base text-slate-700">Ativos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Investimento</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ativos.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{a.nome}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.tipo === 'IMOVEL' ? <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Imóvel</span> : <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">Embarcação</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{a.investimento ? brl(a.investimento) : '-'}</td>
                    <td className="px-4 py-3 flex items-center justify-center gap-3">
                      <button onClick={() => iniciarEdicaoAtivo(a)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Editar Ativo">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => excluirAtivo(a.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Excluir Ativo">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* LISTA DE CATEGORIAS */}
        <Card>
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
            <CardTitle className="text-base text-slate-700">Categorias Cadastradas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Grupo DRE</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categorias.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.nome}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{c.dre_grupos?.nome}</td>
                    <td className="px-4 py-3 flex items-center justify-center gap-3">
                      <button onClick={() => iniciarEdicaoCategoria(c)} className="text-slate-400 hover:text-slate-700 transition-colors" title="Editar Categoria">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => excluirCategoria(c.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Excluir Categoria">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}