"use client";

import { useState } from "react";
import Image from "next/image";
import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";
import { eventos, programacao } from "@/data/site";

// Mock de Grandes Eventos (Cartazes) - Futuramente virá do Supabase
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

export default function EventosPage() {
  const [filtro, setFiltro] = useState<"todos" | "semanal" | "especiais">("todos");

  return (
    <>
      <Header />
      <main className="bg-sand-warm min-h-screen">
        
        {/* ================= HERO ================= */}
        <section className="bg-midnight text-sand py-16 sm:py-24">
          <div className="container-page text-center sm:text-left">
            <span className="eyebrow text-gold-light">Fique por dentro</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight">
              Agenda e Eventos
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80 mx-auto sm:mx-0">
              Acompanhe nossos cultos regulares, congressos e programações especiais. Programe-se para estar em comunhão conosco durante todo o ano!
            </p>
          </div>
        </section>

        {/* ================= DESTAQUES (CARTAZES) ================= */}
        <section className="container-page py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {grandesEventos.map((evento) => (
              <div 
                key={evento.id} 
                className="group relative overflow-hidden rounded-3xl shadow-lg border border-midnight/10 bg-midnight min-h-[300px] sm:min-h-[350px] flex flex-col justify-end"
              >
                {/* Imagem de Fundo (Cartaz) */}
                <Image
                  src={evento.imagem}
                  alt={evento.titulo}
                  fill
                  className="object-cover opacity-60 group-hover:opacity-40 transition duration-700 group-hover:scale-105"
                />
                {/* Gradiente de proteção para leitura do texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/50 to-transparent"></div>
                
                {/* Conteúdo do Cartaz */}
                <div className="relative z-10 p-6 sm:p-8 w-full mt-auto">
                  <span className="bg-gold text-midnight text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block shadow-sm">
                    {evento.tag}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-display text-white mb-2 leading-tight">
                    {evento.titulo}
                  </h3>
                  <p className="text-sand/90 font-medium text-sm sm:text-base flex items-center gap-2">
                    <span className="text-gold">📅</span> {evento.data}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= FILTROS (STICKY) ================= */}
        {/* A classe sticky mantém o filtro visível no topo ao rolar a página longa */}
        <section className="sticky top-16 z-30 bg-sand-warm/95 backdrop-blur-md border-y border-midnight/5 shadow-sm py-4 mb-8">
          <div className="container-page flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              onClick={() => setFiltro("todos")}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                filtro === "todos"
                  ? "bg-midnight text-gold shadow-md scale-105"
                  : "bg-white/60 text-stone hover:bg-white border border-midnight/10"
              }`}
            >
              Toda a Agenda
            </button>
            <button
              onClick={() => setFiltro("semanal")}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                filtro === "semanal"
                  ? "bg-midnight text-gold shadow-md scale-105"
                  : "bg-white/60 text-stone hover:bg-white border border-midnight/10"
              }`}
            >
              Cultos da Semana
            </button>
            <button
              onClick={() => setFiltro("especiais")}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                filtro === "especiais"
                  ? "bg-midnight text-gold shadow-md scale-105"
                  : "bg-white/60 text-stone hover:bg-white border border-midnight/10"
              }`}
            >
              Eventos Especiais
            </button>
          </div>
        </section>

        {/* ================= LISTAS DINÂMICAS ================= */}
        <div className="container-page pb-24 space-y-16">
          
          {/* BLOCO: PROGRAMAÇÃO SEMANAL */}
          {(filtro === "todos" || filtro === "semanal") && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl sm:text-3xl font-display text-midnight mb-8 flex items-center gap-3">
                <span className="text-gold">●</span> Cultos Regulares
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {programacao.map((bloco) => (
                  <div
                    key={bloco.dia}
                    className="rounded-2xl border border-midnight/10 bg-white/80 p-6 hover:shadow-lg hover:border-midnight/20 transition-all"
                  >
                    <p className="font-display text-xl text-midnight border-b border-midnight/10 pb-3 mb-4">
                      {bloco.dia}
                    </p>
                    <ul className="space-y-4">
                      {bloco.cultos.map((c) => (
                        <li key={c.nome} className="flex items-start gap-3">
                          <span className="bg-midnight/5 text-midnight rounded-md px-2 py-1 text-xs font-bold tabular-nums mt-0.5">
                            {c.hora}
                          </span>
                          <span className="text-stone font-medium text-sm leading-relaxed">
                            {c.nome}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BLOCO: PRÓXIMOS EVENTOS (LISTA OTIMIZADA PARA BANCO DE DADOS) */}
          {(filtro === "todos" || filtro === "especiais") && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl sm:text-3xl font-display text-midnight mb-8 flex items-center gap-3">
                <span className="text-gold">★</span> Eventos Especiais do Ano
              </h2>
              
              {/* O formato de lista (flex-col) escala muito melhor que grid quando há dezenas de itens */}
              <div className="flex flex-col gap-4">
                {eventos.map((ev) => (
                  <article
                    key={ev.titulo}
                    className="group flex flex-col sm:flex-row gap-0 sm:gap-6 rounded-2xl border border-midnight/10 bg-white/80 overflow-hidden hover:shadow-md transition-all items-stretch"
                  >
                    {/* Bloco de Data - Fica na esquerda no Desktop e no topo no Mobile */}
                    <div className="bg-midnight text-sand p-6 sm:w-48 flex flex-col justify-center items-center text-center shrink-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-gold-light mb-1">
                        Data
                      </p>
                      <p className="font-display text-xl text-white leading-tight">
                        {ev.data}
                      </p>
                      <p className="mt-3 text-sm font-bold text-midnight bg-gold px-3 py-1 rounded-full">
                        {ev.horario}
                      </p>
                    </div>
                    
                    {/* Bloco de Descrição */}
                    <div className="p-6 sm:py-8 flex-1 flex flex-col justify-center">
                      <h3 className="font-display text-2xl text-midnight group-hover:text-gold-dark transition-colors mb-2">
                        {ev.titulo}
                      </h3>
                      <p className="text-stone leading-relaxed text-sm sm:text-base">
                        {ev.descricao}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}