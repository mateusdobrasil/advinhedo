"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { navegacao, aplicacoes, igreja } from "@/data/site"; 

export default function SiteHeader() {
  const [open, setOpen] = useState(false); // menu mobile
  const [apps, setApps] = useState(false); // dropdown "Aplicações" (desktop)
  const appsRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) {
        setApps(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-midnight/10 bg-sand/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/imgs/logo.png"
            alt={igreja.nomeCompleto}
            width={40}
            height={40}
            priority
            className="h-16 w-auto"
          />
          
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-7 md:flex">
          {navegacao.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-stone transition hover:text-midnight"
            >
              {item.label}
            </Link>
          ))}

          {/* Dropdown Aplicações */}
          <div className="relative" ref={appsRef}>
            <button
              type="button"
              onClick={() => setApps((v) => !v)}
              aria-haspopup="true"
              aria-expanded={apps}
              className="btn-primary !px-5 !py-2"
            >
              Aplicações
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className={`ml-1.5 transition ${apps ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {apps && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-midnight/10 bg-white shadow-soft">
                {aplicacoes.map((app) => (
                  <Link
                    key={app.href}
                    href={app.href}
                    onClick={() => setApps(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-stone transition hover:bg-sand-warm hover:text-midnight"
                  >
                    {app.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Botão mobile */}
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg text-midnight md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav className="border-t border-midnight/10 bg-sand md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {navegacao.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone transition hover:bg-sand-warm hover:text-midnight"
              >
                {item.label}
              </Link>
            ))}

            {/* Seção Aplicações no mobile */}
            <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Aplicações
            </p>
            {aplicacoes.map((app) => (
              <Link
                key={app.href}
                href={app.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-midnight transition hover:bg-sand-warm"
              >
                {app.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}