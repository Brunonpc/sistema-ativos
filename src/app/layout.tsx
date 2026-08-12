import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "../components/AuthGuard";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar"; // <- Nosso novo menu inteligente aqui!

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
            <Sidebar />

            {/* ================= ÁREA PRINCIPAL ================= */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
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