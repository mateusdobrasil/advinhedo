"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { igreja } from "@/data/site";

export default function ContatoPage() {
  const [form, setForm] = useState({ nome: "", email: "", mensagem: "" });

  const update =
    (campo: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [campo]: e.target.value }));

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Sem backend: abre o app de e-mail com a mensagem preenchida.
    const assunto = encodeURIComponent(`Contato pelo site — ${form.nome}`);
    const corpo = encodeURIComponent(
      `Nome: ${form.nome}\nE-mail: ${form.email}\n\n${form.mensagem}`
    );
    window.location.href = `mailto:${igreja.email}?subject=${assunto}&body=${corpo}`;
  };

  return (
    <>
      <SiteHeader />
      <main className="church">
        <section className="bg-midnight text-sand">
          <div className="container-page py-20">
            <span className="eyebrow text-gold-light">Contato</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">Fale conosco</h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80">
              Entre em contato para mais informações, pedidos de oração ou para
              conhecer a igreja.
            </p>
          </div>
        </section>

        <section className="container-page py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Formulário */}
            <form onSubmit={enviar} className="space-y-5">
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold text-midnight">
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  required
                  value={form.nome}
                  onChange={update("nome")}
                  className="mt-2 w-full rounded-xl border border-midnight/15 bg-white px-4 py-3 text-midnight outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-midnight">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  className="mt-2 w-full rounded-xl border border-midnight/15 bg-white px-4 py-3 text-midnight outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div>
                <label htmlFor="mensagem" className="block text-sm font-semibold text-midnight">
                  Mensagem
                </label>
                <textarea
                  id="mensagem"
                  required
                  rows={5}
                  value={form.mensagem}
                  onChange={update("mensagem")}
                  className="mt-2 w-full rounded-xl border border-midnight/15 bg-white px-4 py-3 text-midnight outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <button type="submit" className="btn-primary w-full sm:w-auto">
                Enviar mensagem
              </button>
              <p className="text-xs text-stone-light">
                O envio abre seu aplicativo de e-mail. Para receber as mensagens
                automaticamente, conecte um serviço como Formspree ou uma API Route do
                Next.js.
              </p>
            </form>

            {/* Informações */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl">E-mail</h2>
                <p className="mt-2 text-stone">Nossa equipe responderá assim que possível.</p>
                
                  <a href={`mailto:${igreja.email}`}
                  className="mt-2 inline-block font-semibold text-midnight hover:text-gold"
                >
                  {igreja.email}
                </a>
              </div>
              <div>
                <h2 className="text-2xl">Localização</h2>
                <address className="mt-2 not-italic leading-relaxed text-stone">
                  {igreja.endereco.linha1}
                  <br />
                  {igreja.endereco.bairro}, {igreja.endereco.cidade}
                  <br />
                  CEP {igreja.endereco.cep}
                </address>
              </div>
              <div>
                <h2 className="text-2xl">Redes sociais</h2>
                
                  <a href={igreja.redes.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-semibold text-midnight hover:text-gold"
                  >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}