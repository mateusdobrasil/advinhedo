"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Mock de Grandes Eventos (Cartazes) - Este podemos manter fixo por enquanto ou migrar depois
const grandesEventos = [
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

// Lista para identificar o que é culto de rotina
const cultosRegularesNomes = ["Culto de Ensino", "Culto da Família", "Culto de Louvor e Palavra", "EBD"];

export default function EventosPage() {
  const [filtro, setFiltro] = useState<"todos" | "semanal" | "especiais">("todos");
  
  // Estados para o Banco de Dados
  const [eventosDB, setEventosDB] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function carregarEventos() {
      const hoje = new Date().toISOString().split("T")[0]; // Pega a data de hoje (YYYY-MM-DD)

      const { data, error } = await supabase
        .from("agenda_eventos")
        .select("*")
        .gte("data_evento", hoje) // Busca de hoje em diante
        .order("data_evento", { ascending: true });

      if (!error && data) {
        setEventosDB(data);
      }
      setCarregando(false);
    }

    carregarEventos();
  }, [supabase]);

  // Função para deixar a data bonita (ex: 2026-05-10 -> 10 de Mai)
  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${dia} de ${meses[parseInt(mes) - 1]}`;
  };

  // Separação Inteligente
  const cultosRegulares = eventosDB.filter((ev) => cultosRegularesNomes.includes(ev.titulo)).slice(0, 8); // Pega os próximos 8 cultos
  const eventosEspeciais = eventosDB.filter((ev) => !cultosRegularesNomes.includes(ev.titulo));

  return (
    <>
      <Header />
      <main className="bg-sand-warm min-h-screen">
        
        {/* HERO */}
        <section className="bg-midnight text-sand py-16 sm:py-24">
          <div className="container-page text-center sm:text-left">
            <span className="eyebrow text-gold-light">Fique por dentro</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight">Agenda e Eventos</h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80 mx-auto sm:mx-0">
              Acompanhe nossos cultos regulares, congressos e programações especiais.
            </p>
          </div>
        </section>

        {/* CARTAZES */}
        <section className="container-page py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {grandesEventos.map((evento) => (
              <div key={evento.id} className="group relative overflow-hidden rounded-3xl shadow-lg border border-midnight/10 bg-midnight min-h-[300px] flex flex-col justify-end">
                <Image src={evento.imagem} alt={evento.titulo} fill className="object-cover opacity-60 group-hover:opacity-40 transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/50 to-transparent"></div>
                <div className="relative z-10 p-6 sm:p-8 w-full mt-auto">
                  <span className="bg-gold text-midnight text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block shadow-sm">{evento.tag}</span>
                  <h3 className="text-2xl sm:text-3xl font-display text-white mb-2 leading-tight">{evento.titulo}</h3>
                  <p className="text-sand/90 font-medium text-sm sm:text-base flex items-center gap-2">
                    <span className="text-gold">📅</span> {evento.data}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FILTROS */}
        <section className="sticky top-16 z-30 bg-sand-warm/95 backdrop-blur-md border-y border-midnight/5 shadow-sm py-4 mb-8">
          <div className="container-page flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button onClick={() => setFiltro("todos")} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${filtro === "todos" ? "bg-midnight text-gold shadow-md scale-105" : "bg-white/60 text-stone hover:bg-white"}`}>Toda a Agenda</button>
            <button onClick={() => setFiltro("semanal")} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${filtro === "semanal" ? "bg-midnight text-gold shadow-md scale-105" : "bg-white/60 text-stone hover:bg-white"}`}>Cultos Regulares</button>
            <button onClick={() => setFiltro("especiais")} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${filtro === "especiais" ? "bg-midnight text-gold shadow-md scale-105" : "bg-white/60 text-stone hover:bg-white"}`}>Eventos Especiais</button>
          </div>
        </section>

        {carregando ? (
          <div className="container-page pb-24 text-center text-midnight font-bold animate-pulse">Carregando eventos do banco de dados...</div>
        ) : (
          <div className="container-page pb-24 space-y-16">
            
            {/* PRÓXIMOS CULTOS REGULARES */}
            {(filtro === "todos" || filtro === "semanal") && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl sm:text-3xl font-display text-midnight mb-8 flex items-center gap-3"><span className="text-gold">●</span> Próximos Cultos Regulares</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {cultosRegulares.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-midnight/10 bg-white/80 p-6 hover:shadow-lg transition-all">
                      <p className="font-display text-xl text-midnight border-b border-midnight/10 pb-3 mb-4">{c.dia_semana}</p>
                      <div className="flex items-start gap-3">
                        <span className="bg-midnight/5 text-midnight rounded-md px-2 py-1 text-xs font-bold tabular-nums mt-0.5">{c.horario}</span>
                        <div>
                          <p className="text-stone font-bold text-sm leading-relaxed">{c.titulo}</p>
                          <p className="text-xs text-stone/70">{formatarData(c.data_evento)} • {c.congregacao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* EVENTOS ESPECIAIS (LISTA VERTICAL) */}
            {(filtro === "todos" || filtro === "especiais") && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl sm:text-3xl font-display text-midnight mb-8 flex items-center gap-3"><span className="text-gold">★</span> Eventos Especiais do Ano</h2>
                <div className="flex flex-col gap-4">
                  {eventosEspeciais.map((ev) => (
                    <article key={ev.id} className="group flex flex-col sm:flex-row gap-0 sm:gap-6 rounded-2xl border border-midnight/10 bg-white/80 overflow-hidden hover:shadow-md transition-all items-stretch">
                      <div className="bg-midnight text-sand p-6 sm:w-48 flex flex-col justify-center items-center text-center shrink-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-gold-light mb-1">{ev.dia_semana}</p>
                        <p className="font-display text-2xl text-white leading-tight">{formatarData(ev.data_evento)}</p>
                        <p className="mt-3 text-sm font-bold text-midnight bg-gold px-3 py-1 rounded-full">{ev.horario}</p>
                      </div>
                      <div className="p-6 sm:py-8 flex-1 flex flex-col justify-center">
                        <div className="flex gap-2 mb-2">
                          <span className="text-[10px] uppercase font-bold bg-midnight/5 text-midnight px-2 py-1 rounded">{ev.departamento}</span>
                          <span className="text-[10px] uppercase font-bold bg-midnight/5 text-midnight px-2 py-1 rounded">{ev.congregacao}</span>
                        </div>
                        <h3 className="font-display text-2xl text-midnight group-hover:text-gold-dark transition-colors mb-2">{ev.titulo}</h3>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}