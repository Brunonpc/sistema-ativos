"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { LayoutDashboard, Receipt, DollarSign, Wrench, Layers, FileText, Settings, Activity, Users } from "lucide-react";

export default function Sidebar() {
  const supabase = createClient();
  const [perfil, setPerfil] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("perfis_usuarios").select("*").eq("id", user.id).single();
        setPerfil(data);
      }
      setCarregando(false);
    }
    carregarPerfil();
  }, [supabase]);

  // Se estiver carregando, mostra o menu vazio para não dar "flash" na tela
  if (carregando) {
    return <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shadow-xl z-10"></aside>;
  }

  // Verifica se é administrador total
  const isAdmin = perfil?.is_admin === true;
  
  // Lista de abas liberadas no banco de dados
  const abas = perfil?.abas_permitidas || [];

  // Função que decide se o botão aparece ou não
  const temAcesso = (aba: string) => isAdmin || abas.includes(aba);

  return (
    <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shadow-xl z-10">
      <div className="h-16 flex items-center px-6 bg-[#0f172a] font-bold text-white text-lg gap-3 border-b border-slate-800">
        <Layers className="w-6 h-6 text-blue-500" />
        Gestão de Ativos
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu Principal</p>

        {temAcesso('visao-geral') && (
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <LayoutDashboard className="w-5 h-5 text-slate-400" /> Visão Geral
          </a>
        )}
        
        {temAcesso('receitas') && (
          <a href="/receitas" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <Receipt className="w-5 h-5 text-slate-400" /> Receitas
          </a>
        )}

        {temAcesso('despesas') && (
          <a href="/despesas" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <DollarSign className="w-5 h-5 text-slate-400" /> Despesas
          </a>
        )}

        {temAcesso('operacional') && (
          <a href="/operacional" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <Wrench className="w-5 h-5 text-slate-400" /> Operacional
          </a>
        )}

        {temAcesso('cadastros') && (
          <a href="/cadastros" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <Layers className="w-5 h-5 text-slate-400" /> Cadastros
          </a>
        )}

        {temAcesso('relatorios') && (
          <a href="/relatorios" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <FileText className="w-5 h-5 text-slate-400" /> DRE & Relatórios
          </a>
        )}

        {temAcesso('relatorios-operacionais') && (
          <a href="/relatorios-operacionais" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium text-blue-400">
            <Activity className="w-5 h-5 text-blue-400" /> Relatório Operacional
          </a>
        )}

        {temAcesso('usuarios') && (
          <a href="/usuarios" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium text-purple-400">
            <Users className="w-5 h-5 text-purple-400" /> Gerenciar Acessos
          </a>
        )}
      </div>

      <div className="p-4 bg-[#0f172a]">
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium">
          <Settings className="w-4 h-4 text-slate-400" /> Configurações
        </a>
      </div>
    </aside>
  );
}