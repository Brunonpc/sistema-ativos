import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "../components/AuthGuard";
import Header from "../components/Header";
import { LayoutDashboard, Receipt, DollarSign, Wrench, Layers, FileText, Settings, Activity, Users } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão de Ativos",
  description: "Sistema de gestão financeira e operacional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        
        <AuthGuard>
          
          <div className="flex h-screen bg-slate-50">
            {/* ================= MENU LATERAL (SIDEBAR) ================= */}
            <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shadow-xl z-10">
              <div className="h-16 flex items-center px-6 bg-[#0f172a] font-bold text-white text-lg gap-3 border-b border-slate-800">
                <Layers className="w-6 h-6 text-blue-500" />
                Gestão de Ativos
              </div>

              <div className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu Principal</p>

                <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
                  <LayoutDashboard className="w-5 h-5 text-slate-400" /> Visão Geral
                </a>
                <a href="/receitas" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
                  <Receipt className="w-5 h-5 text-slate-400" /> Receitas
                </a>
                <a href="/despesas" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
                  <DollarSign className="w-5 h-5 text-slate-400" /> Despesas
                </a>
                <a href="/operacional" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
                  <Wrench className="w-5 h-5 text-slate-400" /> Operacional
                </a>
                <a href="/cadastros" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
                  <Layers className="w-5 h-5 text-slate-400" /> Cadastros
                </a>
                <a href="/relatorios" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium">
                  <FileText className="w-5 h-5 text-slate-400" /> DRE & Relatórios
                </a>
                <a href="/relatorios-operacionais" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium text-blue-400">
                  <Activity className="w-5 h-5 text-blue-400" /> Relatório Operacional
                </a>
                <a href="/usuarios" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium text-purple-400">
                  <Users className="w-5 h-5 text-purple-400" /> Gerenciar Acessos
                </a>
              </div>

              <div className="p-4 bg-[#0f172a]">
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium">
                  <Settings className="w-4 h-4 text-slate-400" /> Configurações
                </a>
              </div>
            </aside>

            {/* ================= ÁREA PRINCIPAL ================= */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* APENAS O HEADER INTELIGENTE COM O BOTÃO SAIR */}
              <Header />

              <main className="flex-1 overflow-y-auto p-6 md:p-8">
                {children}
              </main>
              
            </div>
          </div>

        </AuthGuard>

      </body>
    </html>
  );
}