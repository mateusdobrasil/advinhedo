"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const cultosRegularesNomes = ["Culto de Ensino", "Culto da Família", "Culto de Louvor e Palavra", "EBD"];

export default function EventosPage() {
  const [filtro, setFiltro] = useState<"todos" | "semanal" | "especiais">("todos");
  const [eventosDB, setEventosDB] = useState<any[]>([]);
  const [bannersDB, setBannersDB] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [bannerAtual, setBannerAtual] = useState(0);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function carregarDados() {
      const hoje = new Date().toISOString().split("T")[0];

      const { data: eventosData } = await supabase
        .from("agenda_eventos")
        .select("*")
        .gte("data_evento", hoje)
        .order("data_evento", { ascending: true });

      if (eventosData) setEventosDB(eventosData);

      const { data: bannersData } = await supabase
        .from("banners")
        .select("*")
        .gte("data_fim", hoje)
        .lte("data_inicio", hoje)
        .order("data_inicio", { ascending: true });

      if (bannersData) setBannersDB(bannersData);

      setCarregando(false);
    }
    carregarDados();
  }, [supabase]);

  useEffect(() => {
    if (bannersDB.length <= 1) return;
    const intervalo = setInterval(() => {
      setBannerAtual((prev) => (prev === bannersDB.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(intervalo);
  }, [bannersDB.length]);

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${dia} de ${meses[parseInt(mes) - 1]}`;
  };

  const cultosRegulares = eventosDB.filter((ev) => cultosRegularesNomes.includes(ev.titulo)).slice(0, 8);
  const eventosEspeciais = eventosDB.filter((ev) => !cultosRegularesNomes.includes(ev.titulo));

  return (
    <>
      <Header />
      <main className="bg-sand-warm min-h-screen">
        
        <section className="bg-midnight text-sand py-16 sm:py-24">
          <div className="container-page text-center sm:text-left">
            <span className="eyebrow text-gold-light">Fique por dentro</span>
            <h1 className="mt-4 font-display text-4xl sm:text-6xl tracking-tight">Agenda e Eventos</h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80 mx-auto sm:mx-0">
              Confira os cartazes dos nossos próximos congressos e a programação completa do ano.
            </p>
          </div>
        </section>

        {/* BANNERS / FOLDERS - ASPECT 16:9 LIMITADO COM MAX-W-5XL */}
        {!carregando && bannersDB.length > 0 && (
          <section className="container-page py-12 -mt-16 sm:-mt-24 flex flex-col items-center">
            {/* O travão max-w-5xl impede que ele expluda na tela no PC */}
            <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/20 group">
              
              {bannersDB.map((banner, index) => (
                <div 
                  key={banner.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === bannerAtual ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
                >
                  <Image 
                    src={banner.imagem_url} 
                    alt={banner.titulo} 
                    fill 
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}

              {/* CONTROLES (BOLINHAS) */}
              {bannersDB.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-midnight/30 backdrop-blur-md px-4 py-2.5 rounded-full">
                  {bannersDB.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBannerAtual(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${idx === bannerAtual ? "bg-gold w-6" : "bg-white/70 hover:bg-white"}`}
                      aria-label={`Ir para o banner ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Título do Folder atual (Fica abaixo da imagem, centralizado) */}
            <div className="mt-6 text-center max-w-5xl w-full">
              <h2 className="text-midnight font-display text-xl sm:text-2xl">{bannersDB[bannerAtual]?.titulo}</h2>
            </div>
          </section>
        )}

        {/* FILTROS STICKY */}
        <section className="sticky top-16 z-30 bg-sand-warm/95 backdrop-blur-md border-y border-midnight/5 py-4 mb-8">
          <div className="container-page flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button onClick={() => setFiltro("todos")} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${filtro === "todos" ? "bg-midnight text-gold shadow-lg scale-105" : "bg-white/60 text-stone hover:bg-white"}`}>Toda a Agenda</button>
            <button onClick={() => setFiltro("semanal")} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${filtro === "semanal" ? "bg-midnight text-gold shadow-lg scale-105" : "bg-white/60 text-stone hover:bg-white"}`}>Cultos Regulares</button>
            <button onClick={() => setFiltro("especiais")} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${filtro === "especiais" ? "bg-midnight text-gold shadow-lg scale-105" : "bg-white/60 text-stone hover:bg-white"}`}>Eventos Especiais</button>
          </div>
        </section>

        {carregando ? (
          <div className="container-page pb-24 text-center text-midnight font-bold">A carregar eventos...</div>
        ) : (
          <div className="container-page pb-24 space-y-16">
            
            {(filtro === "todos" || filtro === "semanal") && (
              <section className="animate-rise">
                <h2 className="text-2xl sm:text-3xl font-display text-midnight mb-8 flex items-center gap-3"><span className="text-gold">●</span> Próximos Cultos Regulares</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {cultosRegulares.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-midnight/10 bg-white/80 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
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

            {(filtro === "todos" || filtro === "especiais") && (
              <section className="animate-rise">
                <h2 className="text-2xl sm:text-3xl font-display text-midnight mb-8 flex items-center gap-3"><span className="text-gold">★</span> Eventos Especiais do Ano</h2>
                <div className="flex flex-col gap-4">
                  {eventosEspeciais.map((ev) => (
                    <article key={ev.id} className="group flex flex-col sm:flex-row gap-0 sm:gap-6 rounded-3xl border border-midnight/10 bg-white/80 overflow-hidden hover:shadow-xl transition-all items-stretch hover:-translate-y-1">
                      <div className="bg-midnight text-sand p-6 sm:w-48 flex flex-col justify-center items-center text-center shrink-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-gold-light mb-1">{ev.dia_semana}</p>
                        <p className="font-display text-2xl text-white leading-tight">{formatarData(ev.data_evento)}</p>
                        <p className="mt-3 text-sm font-bold text-midnight bg-gold px-3 py-1 rounded-full">{ev.horario}</p>
                      </div>
                      <div className="p-6 sm:py-8 flex-1 flex flex-col justify-center">
                        <div className="flex gap-2 mb-2 flex-wrap">
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