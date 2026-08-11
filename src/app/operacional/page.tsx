"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Wrench, Plus, Trash2, Droplet, ClipboardList, PlayCircle, StopCircle, Activity } from "lucide-react";

export default function OperacionalPage() {
  const supabase = createClient();
  const [ativos, setAtivos] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Estados do Formulário
  const [ativoId, setAtivoId] = useState("");
  const [dataRegistro, setDataRegistro] = useState("");
  const [horimetroInicial, setHorimetroInicial] = useState("");
  const [horimetroFinal, setHorimetroFinal] = useState("");
  const [litros, setLitros] = useState("");
  const [observacoes, setObservacoes] = useState("");

  async function carregarDados() {
    const { data: dadosAtivos } = await supabase.from("ativos").select("*").order("nome");
    const { data: dadosOp } = await supabase
      .from("operacional")
      .select("*, ativos(nome, metrica_padrao)")
      .order("data_registro", { ascending: false });

    setAtivos(dadosAtivos || []);
    setRegistros(dadosOp || []);
  }

  useEffect(() => { carregarDados(); }, []);

  async function salvarRegistro(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    // Converte vírgulas para pontos
    const valInicial = horimetroInicial ? Number(horimetroInicial.replace(',', '.')) : null;
    const valFinal = horimetroFinal ? Number(horimetroFinal.replace(',', '.')) : null;
    const valLitros = litros ? Number(litros.replace(',', '.')) : null;

    // Calcula o total de horas rodadas
    let total = null;
    if (valInicial !== null && valFinal !== null) {
      total = Number((valFinal - valInicial).toFixed(1));
    }

    const { error } = await supabase.from("operacional").insert({
      ativo_id: Number(ativoId),
      data_registro: dataRegistro,
      horimetro_inicial: valInicial,
      horimetro_final: valFinal,
      total_horas: total,
      abastecimento_litros: valLitros,
      observacoes
    });

    setCarregando(false);

    if (error) {
      alert("❌ Erro ao salvar registro: " + error.message);
    } else {
      setAtivoId(""); setDataRegistro(""); setHorimetroInicial(""); setHorimetroFinal(""); setLitros(""); setObservacoes("");
      carregarDados();
    }
  }

  async function excluirRegistro(id: number) {
    if (!confirm("Tem certeza que deseja apagar este registro?")) return;
    await supabase.from("operacional").delete().eq("id", id);
    carregarDados();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-slate-700" />
          Controle Operacional
        </h2>
        <p className="text-sm text-slate-500 mt-1">Diário de bordo, manutenções, horímetro e abastecimentos.</p>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
          <CardTitle className="text-lg text-slate-700">Novo Apontamento</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={salvarRegistro} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Ativo</label>
                <select required value={ativoId} onChange={e => setAtivoId(e.target.value)} 
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-slate-600 bg-white text-sm">
                  <option value="">Selecione a embarcação ou imóvel...</option>
                  {ativos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Data do Registro</label>
                <input required type="date" value={dataRegistro} onChange={e => setDataRegistro(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-slate-600 text-sm bg-white" />
              </div>
            </div>

            {/* LINHA DE MEDIÇÕES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <div className="bg-white p-2 rounded-md shadow-sm"><PlayCircle className="w-5 h-5 text-blue-600" /></div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-blue-700 uppercase">Horímetro Inicial</label>
                  <input type="number" step="0.1" placeholder="Ex: 150,5" value={horimetroInicial} onChange={e => setHorimetroInicial(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-slate-900 p-0 placeholder:text-slate-300" />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="bg-white p-2 rounded-md shadow-sm"><StopCircle className="w-5 h-5 text-slate-600" /></div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Horímetro Final</label>
                  <input type="number" step="0.1" placeholder="Ex: 154,5" value={horimetroFinal} onChange={e => setHorimetroFinal(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-slate-900 p-0 placeholder:text-slate-300" />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                <div className="bg-white p-2 rounded-md shadow-sm"><Droplet className="w-5 h-5 text-amber-500" /></div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-amber-700 uppercase">Abastecimento (L)</label>
                  <input type="number" step="0.1" placeholder="Ex: 80" value={litros} onChange={e => setLitros(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-slate-900 p-0 placeholder:text-slate-300" />
                </div>
              </div>

            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Observações do dia / Manutenções feitas</label>
              <textarea rows={2} placeholder="Descreva problemas relatados, trocas de óleo, limpezas pesadas, etc..." value={observacoes} onChange={e => setObservacoes(e.target.value)}
                className="w-full p-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-slate-600 text-sm resize-none" />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={carregando} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-md text-sm font-medium transition shadow-sm disabled:opacity-50">
                <Plus className="w-4 h-4" />
                {carregando ? "Salvando..." : "Salvar Apontamento"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl py-4">
          <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Histórico Operacional
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Ativo</th>
                  <th className="px-6 py-4 text-center">Início / Fim</th>
                  <th className="px-6 py-4 text-center">Total Rodado</th>
                  <th className="px-6 py-4 text-center">Abastecimento</th>
                  <th className="px-6 py-4">Observações</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {r.data_registro.split("-").reverse().join("/")}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{r.ativos?.nome}</td>
                    
                    <td className="px-6 py-4 text-center text-xs font-medium text-slate-500">
                      {r.horimetro_inicial || r.horimetro_final ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Ini: {r.horimetro_inicial || '-'}</span>
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Fim: {r.horimetro_final || '-'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {r.total_horas ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center justify-center gap-1 w-fit mx-auto">
                          <Activity className="w-3 h-3" /> {r.total_horas} h
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {r.abastecimento_litros ? (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">{r.abastecimento_litros} L</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-xs" title={r.observacoes}>
                      {r.observacoes || <span className="italic text-slate-400">Sem observações</span>}
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                      <button onClick={() => excluirRegistro(r.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {registros.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                      Nenhum registro operacional lançado ainda.
                    </td>
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