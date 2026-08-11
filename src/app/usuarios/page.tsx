"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, UserPlus, Trash2, Shield, CheckSquare, Square, Building } from "lucide-react";

export default function UsuariosPage() {
  const supabase = createClient();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [ativos, setAtivos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Estados do Formulário de Cadastro
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [abasSelecionadas, setAbasSelecionadas] = useState<string[]>(['visao-geral']);
  const [ativosSelecionados, setAtivosSelecionados] = useState<number[]>([]);

  const listaAbasDisponiveis = [
    { id: 'visao-geral', label: 'Visão Geral (Dashboard)' },
    { id: 'receitas', label: 'Receitas & Locações' },
    { id: 'despesas', label: 'Despesas & Contas a Pagar' },
    { id: 'operacional', label: 'Controle Operacional (Diário de Bordo)' },
    { id: 'cadastros', label: 'Cadastros (Ativos e Categorias)' },
    { id: 'relatorios', label: 'DRE & Relatórios' },
    { id: 'relatorios-operacionais', label: 'Relatório Operacional & ROI' },
    { id: 'usuarios', label: 'Gerenciamento de Usuários' },
  ];

  async function carregarDados() {
    const { data: atv } = await supabase.from("ativos").select("id, nome").order("nome");
    const { data: perfis } = await supabase.from("perfis_usuarios").select("*");
    setAtivos(atv || []);
    setUsuarios(perfis || []);
  }

  useEffect(() => { carregarDados(); }, []);

  function toggleAba(idAba: string) {
    if (abasSelecionadas.includes(idAba)) {
      setAbasSelecionadas(abasSelecionadas.filter(a => a !== idAba));
    } else {
      setAbasSelecionadas([...abasSelecionadas, idAba]);
    }
  }

  function toggleAtivo(idAtivo: number) {
    if (ativosSelecionados.includes(idAtivo)) {
      setAtivosSelecionados(ativosSelecionados.filter(id => id !== idAtivo));
    } else {
      setAtivosSelecionados([...ativosSelecionados, idAtivo]);
    }
  }

  async function cadastrarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    // 1. Cria o usuário no Supabase Auth via API do cliente
    const { data, error: errAuth } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (errAuth || !data.user) {
      alert("❌ Erro ao criar usuário no Auth: " + (errAuth?.message || "Erro desconhecido"));
      setCarregando(false);
      return;
    }

    const userId = data.user.id;

    // 2. Salva as permissões personalizadas na tabela perfis_usuarios
    const { error: errPerfil } = await supabase.from("perfis_usuarios").insert({
      id: userId,
      email,
      is_admin: isAdmin,
      abas_permitidas: abasSelecionadas,
      ativos_permitidos: ativosSelecionados
    });

    setCarregando(false);

    if (errPerfil) {
      alert("⚠️ Usuário criado no Auth, mas houve erro ao salvar permissões: " + errPerfil.message);
    } else {
      alert("✅ Usuário cadastrado com sucesso!");
      setEmail(""); setSenha(""); setIsAdmin(false); setAbasSelecionadas(['visao-geral']); setAtivosSelecionados([]);
      carregarDados();
    }
  }

  async function excluirUsuario(id: string) {
    if (!confirm("Tem certeza que deseja remover o acesso deste usuário?")) return;
    await supabase.from("perfis_usuarios").delete().eq("id", id);
    carregarDados();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Gerenciamento de Usuários & Acessos
        </h2>
        <p className="text-sm text-slate-500 mt-1">Cadastre novos usuários, defina quais abas eles podem ver e quais ativos podem gerenciar.</p>
      </div>

      {/* FORMULÁRIO DE CADASTRO */}
      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
          <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" /> Novo Cadastro de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={cadastrarUsuario} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">E-mail de Acesso</label>
                <input required type="email" placeholder="usuario@empresa.com" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Senha Inicial</label>
                <input required type="password" placeholder="Mínimo de 6 dígitos" value={senha} onChange={e => setSenha(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white" />
              </div>
            </div>

            {/* Checkbox Administrador */}
            <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <input type="checkbox" id="isAdmin" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <label htmlFor="isAdmin" className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> Conceder privilégios de Administrador Total (Acesso a tudo e permissão para cadastrar outros usuários)
              </label>
            </div>

            {/* Permissão de Abas */}
            {!isAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Abas Permitidas para Visualização</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {listaAbasDisponiveis.map(aba => {
                    const selecionado = abasSelecionadas.includes(aba.id);
                    return (
                      <div key={aba.id} onClick={() => toggleAba(aba.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${selecionado ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'}`}>
                        {selecionado ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        <span className="text-xs">{aba.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Permissão de Ativos */}
            {!isAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block flex items-center gap-1">
                  <Building className="w-4 h-4 text-slate-600" /> Ativos Autorizados (Se nenhum for selecionado, visualiza todos)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {ativos.map(atv => {
                    const selecionado = ativosSelecionados.includes(atv.id);
                    return (
                      <div key={atv.id} onClick={() => toggleAtivo(atv.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${selecionado ? 'bg-green-50 border-green-200 text-green-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'}`}>
                        {selecionado ? <CheckSquare className="w-4 h-4 text-green-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        <span className="text-xs">{atv.nome}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={carregando} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-md text-sm font-medium transition shadow-sm disabled:opacity-50">
                {carregando ? "Cadastrando..." : "Cadastrar Novo Usuário"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* LISTA DE USUÁRIOS CADASTRADOS */}
      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
          <CardTitle className="text-lg text-slate-700">Usuários com Acesso ao Sistema</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4 text-center">Tipo de Acesso</th>
                  <th className="px-6 py-4">Abas Liberadas</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{u.email}</td>
                    <td className="px-6 py-4 text-center">
                      {u.is_admin ? (
                        <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Administrador
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          Personalizado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {u.is_admin ? "Acesso Total a todas as abas" : (u.abas_permitidas?.join(", ") || "Nenhuma aba")}
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                      <button onClick={() => excluirUsuario(u.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Remover Acesso">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Nenhum perfil cadastrado na tabela ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}