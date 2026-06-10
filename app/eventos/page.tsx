import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";
import { eventos, programacao } from "@/data/site";

export const metadata = {
  title: "Eventos",
  description: "Programação semanal e próximos eventos da Assembleia de Deus em Vinhedo.",
};

export default function EventosPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-midnight text-sand">
          <div className="container-page py-20">
            <span className="eyebrow text-gold-light">Eventos</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">
              Programação e eventos
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80">
              Confira nossos horários de culto e os próximos eventos da igreja.
            </p>
          </div>
        </section>

        {/* Programação semanal */}
        <section className="container-page py-20">
          <h2 className="text-3xl sm:text-4xl">Programação semanal</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {programacao.map((bloco) => (
              <div
                key={bloco.dia}
                className="rounded-2xl border border-midnight/10 bg-white/60 p-7"
              >
                <p className="font-display text-xl text-midnight">{bloco.dia}</p>
                <ul className="mt-5 space-y-3">
                  {bloco.cultos.map((c) => (
                    <li key={c.nome} className="flex items-baseline gap-3">
                      <span className="w-14 shrink-0 font-semibold tabular-nums text-gold">
                        {c.hora}
                      </span>
                      <span className="text-stone">{c.nome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Próximos eventos */}
        <section className="bg-sand-warm">
          <div className="container-page py-20">
            <h2 className="text-3xl sm:text-4xl">Próximos eventos</h2>
            <div className="mt-10 space-y-5">
              {eventos.map((ev) => (
                <article
                  key={ev.titulo}
                  className="grid gap-4 rounded-2xl border border-midnight/10 bg-white/60 p-7 sm:grid-cols-[160px_1fr] sm:items-center"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-midnight">{ev.data}</p>
                    <p className="mt-1 text-gold">{ev.horario}</p>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-midnight">{ev.titulo}</h3>
                    <p className="mt-2 leading-relaxed text-stone">{ev.descricao}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
