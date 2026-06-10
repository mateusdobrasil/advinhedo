"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { programacao, eventos as eventosSite } from "@/data/site";

// Mock Inicial dos Grandes Eventos (Cartazes)
const cartazesIniciais = [
  {
    id: 1,
    titulo: "Conferência de Missões 2026",
    data: "15 a 18 de Novembro",
    imagem: "/imgs/templo.jpg",
    tag: "Congresso",
  },
  {
    id: 2,
    titulo: "Culto de Jovens - UMADVI",
    data: "Último Sábado do Mês",
    imagem: "/imgs/templo.jpg",
    tag: "Juventude",
  }
];

export default function GerenciadorAgendaPage() {
  // Controle de Abas (Tabs) do Painel
  const [abaAtiva, setAbaAtiva] = useState<"destaques" | "semanal" | "especiais">("destaques");

  // Estados locais para simular a edição antes de enviar para o banco
  const [cartazes, setCartazes] = useState(cartazesIniciais);
  const [cultos, setCultos] = useState(programacao);
  const [especiais, setEspeciais] = useState(eventosSite);

  const [salvando, setSalvando] = useState(false);

  // Simulação de salvamento no banco de dados
  const handleSalvar = () => {
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      alert("✅ Alterações salvas com sucesso!");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* ================= CABEÇALHO DO PAINEL ================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/admin" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition flex items-center gap-1 mb-1">
              ← Voltar ao Hub
            </Link>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-amber-500">📅</span> Gerenciador de Agenda
            </h1>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Link href="/eventos" target="_blank" className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition text-center flex-1 sm:flex-none">
              Ver Site
            </Link>
            <button 
              onClick={handleSalvar}
              disabled={salvando}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition disabled:opacity-50 shadow-md text-center flex-1 sm:flex-none flex justify-center items-center gap-2"
            >
              {salvando ? "Salvando..." : "💾 Salvar Alterações"}
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO DAS ABAS */}
        <div className="max-w-6xl mx-auto px-6 flex gap-6 border-t border-slate-100 pt-2 overflow-x-auto">
          <button 
            onClick={() => setAbaAtiva("destaques")}
            className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 whitespace-nowrap ${abaAtiva === "destaques" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            🖼️ Cartazes (Destaques)
          </button>
          <button 
            onClick={() => setAbaAtiva("semanal")}
            className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 whitespace-nowrap ${abaAtiva === "semanal" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            🔄 Cultos da Semana
          </button>
          <button 
            onClick={() => setAbaAtiva("especiais")}
            className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 whitespace-nowrap ${abaAtiva === "especiais" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            ⭐ Eventos Especiais
          </button>
        </div>
      </header>

      {/* ================= CONTEÚDO DAS ABAS ================= */}
      <main className="max-w-6xl mx-auto px-6 pt-8">

        {/* 1. ABA: CARTAZES E GRANDES EVENTOS */}
        {abaAtiva === "destaques" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Mural Principal</h2>
                <p className="text-sm text-slate-500 mt-1">Gerencie as imagens (folders) que aparecem no topo da página de Eventos.</p>
              </div>
              <button className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-200 transition whitespace-nowrap">
                + Novo Cartaz
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cartazes.map((cartaz) => (
                <div key={cartaz.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                  <div className="relative aspect-video bg-slate-100">
                    <Image src={cartaz.imagem} alt={cartaz.titulo} fill className="object-cover opacity-80" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-100">Trocar Imagem</button>
                    </div>
                    <span className="absolute top-3 right-3 bg-white/90 text-slate-800 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">
                      {cartaz.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <input type="text" defaultValue={cartaz.titulo} className="w-full font-bold text-lg text-slate-800 outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500 bg-transparent mb-1" />
                    <input type="text" defaultValue={cartaz.data} className="w-full text-sm text-slate-500 outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500 bg-transparent" />
                  </div>
                  <div className="px-5 pb-5 flex justify-end">
                    <button className="text-xs font-bold text-red-500 hover:text-red-700 transition">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. ABA: CULTOS DA SEMANA */}
        {abaAtiva === "semanal" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Cultos Regulares</h2>
                <p className="text-sm text-slate-500 mt-1">A programação fixa semanal da igreja.</p>
              </div>
              <button className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-200 transition whitespace-nowrap">
                + Adicionar Dia
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cultos.map((bloco, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <input type="text" defaultValue={bloco.dia} className="font-black text-lg text-slate-800 outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500 bg-transparent" />
                    <button className="text-red-400 hover:text-red-600" title="Excluir Dia">✕</button>
                  </div>
                  
                  <div className="space-y-3">
                    {bloco.cultos.map((c, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-3 group">
                        <input type="text" defaultValue={c.hora} className="w-16 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center py-1.5 outline-none focus:ring-1 focus:ring-amber-500" />
                        <input type="text" defaultValue={c.nome} className="flex-1 bg-transparent text-sm font-medium text-slate-600 outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500" />
                        <button className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition">🗑️</button>
                      </div>
                    ))}
                    <button className="text-xs font-bold text-amber-600 hover:text-amber-800 transition mt-2 flex items-center gap-1">
                      <span>+</span> Novo Horário
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. ABA: EVENTOS ESPECIAIS */}
        {abaAtiva === "especiais" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Próximos Eventos e Congressos</h2>
                <p className="text-sm text-slate-500 mt-1">Lista de eventos específicos com datas descritivas.</p>
              </div>
              <button className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-200 transition whitespace-nowrap">
                + Novo Evento
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Data e Hora</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Título / Descrição</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {especiais.map((ev, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-4 align-top w-48">
                        <input type="text" defaultValue={ev.data} className="w-full font-bold text-slate-800 mb-1 outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500 bg-transparent" />
                        <input type="text" defaultValue={ev.horario} className="w-full text-xs font-bold text-amber-600 outline-none border-b border-transparent hover:border-amber-200 focus:border-amber-500 bg-transparent" />
                      </td>
                      <td className="px-6 py-4 align-top">
                        <input type="text" defaultValue={ev.titulo} className="w-full font-black text-base text-slate-800 mb-1 outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500 bg-transparent" />
                        <textarea defaultValue={ev.descricao} rows={2} className="w-full text-sm text-slate-500 outline-none border border-transparent hover:border-slate-200 focus:border-amber-500 bg-transparent rounded-lg resize-none p-1" />
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <button className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition uppercase tracking-wider opacity-0 group-hover:opacity-100">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}