"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { Lock, ShieldCheck } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [sessao, setSessao] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  useEffect(() => {
    // 1. Verifica se já tem alguém logado ao abrir a tela
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setCarregando(false);
    });

    // 2. Fica "escutando" se você fez login com sucesso
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoadingLogin(true);
    setErro("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      setErro("E-mail ou senha incorretos. Tente novamente!");
    }

    setLoadingLogin(false);
  }

  // TELA 1: Carregamento super rápido
  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium animate-pulse">Verificando segurança...</div>;
  }

  // TELA 2: Bloqueio (O Login)
  if (!sessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-center text-slate-800 mb-2">Acesso Restrito</h2>
          <p className="text-center text-slate-500 text-sm mb-6">Insira suas credenciais para acessar a Gestão de Ativos.</p>

          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-red-100">
              {erro}
            </div>
          )}

          <form onSubmit={fazerLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Acesso</label>
              <input required type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
              <input required type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)}
                className="w-full h-11 px-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
            </div>
            <button type="submit" disabled={loadingLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Lock className="w-5 h-5" />
              {loadingLogin ? "Autenticando..." : "Entrar no Sistema"}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // TELA 3: Se passou da segurança, devolve o seu sistema inteiro!
  return <>{children}</>;
}