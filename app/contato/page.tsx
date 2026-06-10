import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { igreja } from "@/data/site";

export const metadata = {
  title: "Contato",
  description: "Endereço, redes sociais e transmissões da Assembleia de Deus em Vinhedo.",
};

export default function ContatoPage() {
  return (
    <>
      <SiteHeader />
      <main className="church">
        <section className="bg-midnight text-sand">
          <div className="container-page py-20">
            <span className="eyebrow text-gold-light">Contato</span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">Fale conosco</h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80">
              Acompanhe nossos cultos ao vivo e fique por perto pelas redes sociais.
            </p>
          </div>
        </section>

        <section className="container-page py-20">
          <div className="grid gap-12 lg:grid-cols-2">
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
                
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${igreja.endereco.linha1}, ${igreja.endereco.bairro}, ${igreja.endereco.cidade}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-midnight transition hover:text-gold"
                >
                  Ver no mapa
                  <span aria-hidden="true">→</span>
                </a>
              </div>

              <div>
              <h2 className="text-2xl">Redes sociais</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                
                <a  href={igreja.redes.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-full border border-midnight/20 px-6 py-3 text-sm font-semibold text-midnight transition hover:border-midnight hover:bg-midnight hover:text-sand"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" />
                  </svg>
                  Instagram
                </a>

                
                <a  href={igreja.redes.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-full border border-midnight/20 px-6 py-3 text-sm font-semibold text-midnight transition hover:border-midnight hover:bg-midnight hover:text-sand"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M10 9.2v5.6l5-2.8-5-2.8z" fill="currentColor" />
                  </svg>
                  YouTube
                </a>
              </div>
            </div>
            </div>

            {/* Transmissão YouTube */}
            <div>
              <h2 className="text-2xl">Cultos ao vivo</h2>
              <p className="mt-2 text-stone">
                Todos os nossos cultos são transmitidos pelo nosso canal. Acompanhe de
                onde estiver.
              </p>
              <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-midnight/10 shadow-soft">
                <iframe
                  src="https://www.youtube.com/embed/live_stream?channel=UCivfHM9Eqqsi93cmmIkEqRw"
                  title="Transmissão ao vivo - AD Vinhedo"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <a href={igreja.redes.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-midnight transition hover:text-gold"
              >
                Ver cultos anteriores no canal
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}