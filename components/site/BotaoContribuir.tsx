"use client";

import { useState } from "react";
import Image from "next/image";

export default function BotaoContribuir() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-8 inline-flex items-center justify-center rounded-full bg-midnight px-7 py-3 text-sm font-semibold text-sand transition hover:bg-midnight-deep"
      >
        Contribuir agora
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-deep/60 p-4"
          onClick={() => setAberto(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-contribuir"
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-sand p-7 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg text-stone transition hover:bg-sand-warm hover:text-midnight"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <h2 id="titulo-contribuir" className="font-display text-2xl text-midnight">
              Dados para dízimos e ofertas
            </h2>

            <div className="mt-6 space-y-5 text-sm">
              {/* Santander */}
            <div className="rounded-xl border border-midnight/10 bg-white/70 p-4">
            <p className="font-semibold text-midnight">Banco Santander</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <dl className="space-y-1 text-stone">
                <div className="flex justify-between gap-4">
                    <dt>CNPJ</dt>
                    <dd className="font-medium text-midnight">00.120.201/0001-22</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt>Agência</dt>
                    <dd className="font-medium text-midnight">0335</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt>Conta corrente</dt>
                    <dd className="font-medium text-midnight">13003824-4</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt>Chave Pix</dt>
                    <dd className="font-medium text-midnight">financeiro@advinhedo.org</dd>
                </div>
                </dl>
                <div className="mx-auto rounded-lg border border-midnight/10 bg-white p-2">
                <Image
                    src="/imgs/QRcode_pix-email.png"
                    alt="QR Code Pix Santander (chave e-mail)"
                    width={120}
                    height={120}
                    className="h-28 w-28"
                />
                </div>
            </div>
            </div>

              {/* Sicoob */}
                <div className="rounded-xl border border-midnight/10 bg-white/70 p-4">
                <p className="font-semibold text-midnight">Banco Sicoob</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <dl className="space-y-1 text-stone">
                    <div className="flex justify-between gap-4">
                        <dt>Chave Pix</dt>
                        <dd className="font-medium text-midnight">00.120.201/0001-22</dd>
                    </div>
                    </dl>
                    <div className="mx-auto rounded-lg border border-midnight/10 bg-white p-2">
                    <Image
                        src="/imgs/QRcode_pix-cnpj.png"
                        alt="QR Code Pix Sicoob (chave CNPJ)"
                        width={120}
                        height={120}
                        className="h-28 w-28"
                    />
                    </div>
                </div>
                </div>
            </div>

            <p className="mt-6 text-center text-xs text-stone-light">
              &ldquo;Cada um contribua segundo propôs no seu coração.<br/>
              2 Coríntios 9:7&rdquo;
            </p>
          </div>
        </div>
      )}
    </>
  );
}