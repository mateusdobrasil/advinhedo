"use client";

import { useState } from "react";
import Image from "next/image";

type Marco = {
  ano: string;
  titulo: string;
  subtitulo: string;
  imagem: string;
  texto: string;
};

export default function MarcoTimeline({ marco }: { marco: Marco }) {
  const [aberto, setAberto] = useState(false);

  return (
    <li className="relative pl-14 sm:pl-20">
      {/* Marcador do ano na linha */}
      <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full bg-midnight text-xs font-bold text-gold-light sm:h-14 sm:w-14 sm:text-sm">
        {marco.ano.slice(-2)}
      </span>

      <div className="rounded-2xl border border-midnight/10 bg-white/60 p-6 transition hover:shadow-soft sm:p-8">
        <div className="grid gap-6 sm:grid-cols-[320px_1fr] sm:items-start">
          {/* Foto */}
          <div className="aspect-[4/4] overflow-hidden rounded-xl border border-midnight/10 bg-sand-warm">
            <Image
              src={marco.imagem}
              alt={`${marco.ano} — ${marco.titulo}`}
              width={520}
              height={390}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Conteúdo */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {marco.ano}
            </span>
            <h2 className="mt-1 font-display text-2xl text-midnight">{marco.titulo}</h2>
            <p className="mt-3 leading-relaxed text-stone">{marco.subtitulo}</p>

            {/* Texto expansível */}
            <div
              className={`grid transition-all duration-300 ${
                aberto ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="leading-relaxed text-stone">{marco.texto}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-midnight transition hover:text-gold"
            >
              {aberto ? "Mostrar menos" : "Continuar lendo"}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className={`transition ${aberto ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}