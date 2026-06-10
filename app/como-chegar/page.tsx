import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";
import { igreja, congregacoes } from "@/data/site";

export const metadata = {
  title: "Como chegar",
  description: "Endereço, mapa e orientações para chegar à Assembleia de Deus em Vinhedo.",
};

export default function ComoChegarPage() {
  return (
    <>
      <Header />
      <main className="church">
        <section className="bg-midnight text-sand">
          <div className="container-page py-20">
            <span className="eyebrow text-gold-light">Como chegar</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">Venha nos visitar</h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80">
              Será uma alegria receber você. Confira nosso endereço e o mapa abaixo.
            </p>
          </div>
        </section>

        {/* Sede */}
        <section className="container-page py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-2xl">Endereço</h2>
              <address className="mt-5 space-y-1 text-lg not-italic leading-relaxed text-stone">
                <p>{igreja.endereco.linha1}</p>
                <p>{igreja.endereco.bairro}</p>
                <p>{igreja.endereco.cidade}</p>
                <p>CEP {igreja.endereco.cep}</p>
              </address>

              <div className="mt-8 flex flex-wrap gap-3">
                
                <a  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${igreja.endereco.linha1}, ${igreja.endereco.bairro}, ${igreja.endereco.cidade}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Traçar rota
                </a>
                <a href={`mailto:${igreja.email}`} className="btn-ghost">
                  Falar conosco
                </a>
              </div>

              <div className="mt-10 rounded-2xl border border-midnight/10 bg-sand-warm p-6">
                <h3 className="text-lg font-semibold text-midnight">Horários de culto</h3>
                <p className="mt-2 text-sm text-stone">
                  Domingo às 09h00, 10h15 e 18h30 · Sexta-feira às 19h30. Confira a
                  programação completa na página de eventos.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-midnight/10 shadow-soft">
              <iframe
                src={igreja.mapaEmbed}
                title="Localização da igreja no mapa"
                className="h-full min-h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* Congregações */}
        <section className="bg-sand-warm">
          <div className="container-page py-20">
            <span className="eyebrow">Nossas congregações</span>
            <h2 className="mt-4 text-3xl sm:text-4xl">Onde também estamos</h2>
            <p className="mt-4 max-w-2xl text-stone">
              Além da sede, a {igreja.nome} está presente em diversos bairros da cidade.
              Encontre a congregação mais próxima de você.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {congregacoes.map((c) => (
                <article
                  key={c.nome + c.endereco}
                  className="flex flex-col rounded-2xl border border-midnight/10 bg-white/60 p-6 transition hover:shadow-soft"
                >
                  <h3 className="font-display text-xl text-midnight">{c.nome}</h3>
                  <span className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    {c.bairro}
                  </span>
                  <p className="mt-3 flex-1 leading-relaxed text-stone">{c.endereco}</p>
                  
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.endereco)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-midnight transition hover:text-gold"
                  >
                    Ver no mapa
                    <span aria-hidden="true">→</span>
                  </a>
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