"use client";

import { createClient } from "../lib/supabase/client";
import { Bell, LogOut } from "lucide-react";

export default function Header() {
  const supabase = createClient();

  async function fazerLogout() {
    await supabase.auth.signOut();
    // Força o recarregamento da página para o AuthGuard bloquear o acesso imediatamente
    window.location.href = "/";
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-0">
      <div className="text-sm font-medium text-slate-500">
        Dashboard Gerencial
      </div>
      
      <div className="flex items-center gap-5">
        <button className="text-slate-400 hover:text-slate-600 transition-colors" title="Notificações">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
          <div className="text-right hidden sm:block">
            <span className="block text-sm font-semibold text-slate-700">Administrador</span>
          </div>
          
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
            BM
          </div>

          {/* BOTÃO DE SAIR */}
          <button 
            onClick={fazerLogout}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ml-2 border border-red-100"
            title="Sair do Sistema"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}