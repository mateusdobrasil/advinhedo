"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function GerenciadorAgendaPage() {
  const [abaAtiva, setAbaAtiva] = useState<"especiais">("especiais");
  const [eventosDB, setEventosDB] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const supabase = createClientComponentClient();

  // Função para buscar eventos
  const buscarEventos = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("agenda_eventos")
      .select("*")
      .order("data_evento", { ascending: true });

    if (!error && data) setEventosDB(data);
    setCarregando(false);
  };

  useEffect(() => {
    buscarEventos();
  }, [supabase]);

  // Função para Deletar Evento
  const deletarEvento = async (id: string) => {
    if (!confirm("Tem a certeza que deseja excluir este evento?")) return;
    const { error } = await supabase.from("agenda_eventos").delete().eq("id", id);
    if (!error) {
      setEventosDB(eventosDB.filter(ev => ev.id !== id));
      alert("Evento excluído com sucesso!");
    }
  };

  // Separa eventos especiais
  const cultosRegularesNomes = ["Culto de Ensino", "Culto da Família", "Culto de Louvor e Palavra", "EBD"];
  const especiais = eventosDB.filter(ev => !cultosRegularesNomes.includes(ev.titulo));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* NOVO BOTÃO VOLTAR */}
            <Link 
              href="/admin" 
              className="bg-slate-100 text-slate-600 p-2.5 rounded-xl hover:bg-slate-200 transition flex items-center justify-center shadow-sm"
              title="Voltar ao Painel Principal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gerenciador de Agenda</h1>
            </div>
          </div>
          <Link href="/eventos" target="_blank" className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
            Ver Site
          </Link>
        </div>
        <div className="max-w-6xl mx-auto px-6 flex gap-6 border-t border-slate-100 pt-2">
          <button className="pb-3 text-sm font-bold border-b-2 border-slate-800 text-slate-800">⭐ Tabela de Eventos</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Eventos do Ano ({especiais.length})</h2>
              <p className="text-sm text-slate-500">Eventos carregados diretamente da base de dados.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {carregando ? (
              <p className="p-8 text-center text-slate-500">A carregar tabela...</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Data e Hora</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Título / Local</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {especiais.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-4 align-top w-48">
                        <p className="font-bold text-slate-800">{ev.data_evento}</p>
                        <p className="text-xs font-bold text-slate-600">{ev.horario} - {ev.dia_semana}</p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <p className="font-black text-base text-slate-800">{ev.titulo}</p>
                        <p className="text-xs text-slate-500">{ev.departamento} • {ev.congregacao} • {ev.abrangencia}</p>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <button onClick={() => deletarEvento(ev.id)} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}