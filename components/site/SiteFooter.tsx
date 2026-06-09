"use client";

import Link from "next/link";
import Image from "next/image";
import { igreja, navegacao } from "@/data/site"; 

export default function SiteFooter() {
  return (
    <footer className="bg-midnight-deep text-sand">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/imgs/logo_branco.png"
              alt={igreja.nomeCompleto}
              width={160}
              height={48}
              className="h-12 w-auto"
            />
            <span className="font-display text-2xl">{igreja.nome}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-sand/70">
            {igreja.nomeCompleto}. Anunciamos o evangelho de Jesus Cristo em {igreja.cidade} desde {igreja.fundacao}.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">Navegação</p>
          <ul className="mt-4 space-y-2 text-sm">
            {navegacao.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sand/80 transition hover:text-gold-light">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">Contato</p>
          <address className="mt-4 space-y-2 text-sm not-italic text-sand/80">
            <p>{igreja.endereco.linha1}</p>
            <p>{igreja.endereco.bairro}, {igreja.endereco.cidade}</p>
            <p>CEP {igreja.endereco.cep}</p>
            <p>
              <a href={`mailto:${igreja.email}`} className="transition hover:text-gold-light">
                {igreja.email}
              </a>
            </p>
            <p>
              <a href={igreja.redes.instagram} target="_blank" rel="noopener noreferrer" className="transition hover:text-gold-light">
                Instagram
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-sand/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-sand/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {igreja.nome}. Todos os direitos reservados.</p>
          <p>Feito com cuidado para a glória de Deus.</p>
        </div>
      </div>
    </footer>
  );
}