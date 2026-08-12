"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Shield, ShieldAlert, Trash2, Pencil, X, Save, UserPlus } from "lucide-react";

const LISTA_ABAS = [
  { id: 'visao-geral', label: 'Visão Geral (Dashboard)' },
  { id: 'receitas', label: 'Receitas & Locações' },
  { id: 'despesas', label: 'Despesas & Contas a Pagar' },
  { id: 'operacional', label: 'Controle Operacional (Diário de Bordo)' },
  { id: 'cadastros', label: 'Cadastros (Ativos e Categorias)' },
  { id: 'relatorios', label: 'DRE & Relatórios' },
  { id: 'relatorios-operacionais', label: 'Relatório Operacional & ROI' },
  { id: 'usuarios', label: 'Gerenciamento de Usuários' },
];

export default function UsuariosPage() {
  const supabase = createClient();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [ativos, setAtivos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoTabela, setCarregandoTabela] = useState(true);

  // Estados do Formulário
  const [usuarioEditandoId, setUsuarioEditandoId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [abasPermitidas, setAbasPermitidas] = useState<string[]>([]);
  const [ativosPermitidos, setAtivosPermitidos] = useState<string[]>([]);

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados() {
    setCarregandoTabela(true);
    const { data: users } = await supabase.from("perfis_usuarios").select("*").order("email");
    const { data: atvs } = await supabase.from("ativos").select("id, nome").order("nome");
    
    setUsuarios(users || []);
    setAtivos(atvs || []);
    setCarregandoTabela(false);
  }

  // Controle de Checkboxes
  function toggleAba(abaId: string) {
    setAbasPermitidas(prev => prev.includes(abaId) ? prev.filter(a => a !== abaId) : [...prev, abaId]);
  }

  function toggleAtivo(ativoId: string) {
    setAtivosPermitidos(prev => prev.includes(ativoId) ? prev.filter(a => a !== ativoId) : [...prev, ativoId]);
  }

  // Iniciar a edição de um usuário
  function iniciarEdicao(u: any) {
    setUsuarioEditandoId(u.id);
    setEmail(u.email);
    setSenha(""); // Senha fica em branco na edição (não alteramos senha por aqui)
    setIsAdmin(u.is_admin);
    setAbasPermitidas(u.abas_permitidas || []);
    setAtivosPermitidos((u.ativos_permitidos || []).map(String));
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo do formulário
  }

  // Cancelar a edição e limpar o formulário
  function limparFormulario() {
    setUsuarioEditandoId(null);
    setEmail("");
    setSenha("");
    setIsAdmin(false);
    setAbasPermitidas([]);
    setAtivosPermitidos([]);
  }

  async function salvarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    if (usuarioEditandoId) {
      // ==========================================
      // FLUXO DE EDIÇÃO (UPDATE)
      // ==========================================
      const { error } = await supabase.from("perfis_usuarios").update({
        is_admin: isAdmin,
        abas_permitidas: isAdmin ? [] : abasPermitidas,
        ativos_permitidos: isAdmin ? [] : ativosPermitidos.map(Number)
      }).eq("id", usuarioEditandoId);

      if (error) {
        alert("❌ Erro ao atualizar permissões: " + error.message);
      } else {
        limparFormulario();
        carregarDados();
      }

    } else {
      // ==========================================
      // FLUXO DE CRIAÇÃO (INSERT)
      // ==========================================
      if (senha.length < 6) {
        alert("A senha precisa ter no mínimo 6 caracteres.");
        setCarregando(false);
        return;
      }

      // 1. Cria na Autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: senha,
      });

      if (authError) {
        alert("❌ Erro ao criar login: " + authError.message);
        setCarregando(false);
        return;
      }

      // 2. Grava as permissões na tabela de perfis
      if (authData.user) {
        const { error: dbError } = await supabase.from("perfis_usuarios").insert({
          id: authData.user.id,
          email: email,
          is_admin: isAdmin,
          abas_permitidas: isAdmin ? [] : abasPermitidas,
          ativos_permitidos: isAdmin ? [] : ativosPermitidos.map(Number)
        });

        if (dbError) {
          alert("❌ Usuário criado, mas erro ao salvar permissões: " + dbError.message);
        } else {
          limparFormulario();
          carregarDados();
        }
      }
    }

    setCarregando(false);
  }

  async function excluirUsuario(id: string) {
    if (!confirm("Tem certeza que deseja remover o acesso deste usuário? Ele não conseguirá mais logar.")) return;
    
    // Deleta o perfil da tabela. (Nota: Para excluir da aba Auth do Supabase de forma definitiva, deve ser feito pelo painel)
    await supabase.from("perfis_usuarios").delete().eq("id", id);
    carregarDados();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-purple-600" />
          Gerenciamento de Acessos
        </h2>
        <p className="text-sm text-slate-500 mt-1">Crie usuários, edite permissões e controle quem visualiza cada ativo.</p>
      </div>

      <Card className={usuarioEditandoId ? "border-2 border-purple-500 shadow-md transition-all" : "transition-all"}>
        <CardHeader className={`${usuarioEditandoId ? 'bg-purple-50' : 'bg-slate-50'} border-b border-slate-100 rounded-t-xl flex flex-row items-center justify-between`}>
          <CardTitle className={`text-lg ${usuarioEditandoId ? 'text-purple-700 font-bold' : 'text-slate-700'}`}>
            {usuarioEditandoId ? "Editando Permissões do Usuário" : "Cadastrar Novo Usuário"}
          </CardTitle>
          {usuarioEditandoId && (
            <button onClick={limparFormulario} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-sm font-semibold">
              <X className="w-4 h-4" /> Cancelar Edição
            </button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={salvarUsuario} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">E-mail de Acesso</label>
                <input required type="email" placeholder="usuario@empresa.com" value={email} onChange={e => setEmail(e.target.value)}
                  disabled={usuarioEditandoId !== null} // Impede alterar o email durante a edição
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-purple-600 text-sm disabled:bg-slate-100 disabled:text-slate-400" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Senha Inicial {usuarioEditandoId && <span className="text-xs font-normal text-slate-400">(Desabilitado na edição)</span>}</label>
                <input required={!usuarioEditandoId} type="password" placeholder={usuarioEditandoId ? "••••••••" : "Mínimo de 6 dígitos"} value={senha} onChange={e => setSenha(e.target.value)}
                  disabled={usuarioEditandoId !== null} // Impede alterar a senha aqui (segurança do Auth)
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-purple-600 text-sm disabled:bg-slate-100 disabled:text-slate-400" />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/50 flex items-center gap-3">
              <input type="checkbox" id="admin" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="w-5 h-5 text-purple-600 rounded border-slate-300 focus:ring-purple-600" />
              <label htmlFor="admin" className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                <Shield className="w-5 h-5 text-purple-600" />
                Conceder privilégios de Administrador Total (Acesso a tudo e permissão para alterar configurações)
              </label>
            </div>

            <div className={`space-y-4 transition-opacity duration-300 ${isAdmin ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Abas Permitidas para Visualização</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {LISTA_ABAS.map(aba => (
                    <label key={aba.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer p-2 rounded-md border border-slate-100 hover:bg-slate-50 transition-colors">
                      <input type="checkbox" checked={abasPermitidas.includes(aba.id)} onChange={() => toggleAba(aba.id)} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600" />
                      {aba.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                  Ativos Autorizados <span className="text-xs font-normal text-slate-400">(Se nenhum for selecionado, visualiza todos)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {ativos.map(ativo => (
                    <label key={ativo.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer p-2 rounded-md border border-slate-100 hover:bg-slate-50 transition-colors">
                      <input type="checkbox" checked={ativosPermitidos.includes(String(ativo.id))} onChange={() => toggleAtivo(String(ativo.id))} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600" />
                      {ativo.nome}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button type="submit" disabled={carregando} className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold transition shadow-sm disabled:opacity-50 text-white ${usuarioEditandoId ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#0f172a] hover:bg-slate-800'}`}>
                {usuarioEditandoId ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {carregando ? "Salvando..." : (usuarioEditandoId ? "Salvar Alterações" : "Cadastrar Novo Usuário")}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl py-4">
          <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
            Usuários com Acesso ao Sistema
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">{usuarios.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`overflow-x-auto transition-opacity duration-300 ${carregandoTabela ? 'opacity-40' : 'opacity-100'}`}>
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
                {usuarios.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${usuarioEditandoId === u.id ? 'bg-purple-50/30' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-900">{u.email}</td>
                    <td className="px-6 py-4 text-center">
                      {u.is_admin ? (
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold text-xs border border-blue-200 inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Administrador
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold text-xs border border-slate-200">
                          Personalizado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {u.is_admin ? "Acesso Total a todas as abas" : (u.abas_permitidas?.join(", ") || "Nenhuma aba liberada")}
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-3">
                      <button onClick={() => iniciarEdicao(u)} className="text-slate-400 hover:text-purple-600 transition-colors" title="Editar Permissões">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => excluirUsuario(u.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Excluir Acesso">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && !carregandoTabela && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Nenhum usuário cadastrado.</td>
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