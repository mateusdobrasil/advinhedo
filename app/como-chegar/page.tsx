import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";
import { igreja } from "@/data/site";

export const metadata = {
  title: "Como chegar",
  description: "Endereço, mapa e orientações para chegar à Assembleia de Deus em Vinhedo.",
};

export default function ComoChegarPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-midnight text-sand">
          <div className="container-page py-20">
            <span className="eyebrow text-gold-light">Como chegar</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">Venha nos visitar</h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80">
              Será uma alegria receber você. Confira nosso endereço e o mapa abaixo.
            </p>
          </div>
        </section>

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
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
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
      </main>
      <Footer />
    </>
  );
}
