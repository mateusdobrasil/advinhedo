import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { igreja, historia } from "@/data/site";
import MarcoTimeline from "@/components/site/MarcoTimeline";

export const metadata = {
  title: "A Igreja",
  description: "Conheça a história da Assembleia de Deus em Vinhedo, desde 1940.",
};

export default function IgrejaPage() {
  return (
    <>
      <SiteHeader />
      <main className="church">
        {/* Cabeçalho */}
        <section className="bg-midnight text-sand">
          <div className="container-page py-20">
            <span className="eyebrow text-gold-light">A Igreja</span>
            <h1 className="mt-4 max-w-3xl font-display text-4xl sm:text-5xl">
              Nossa história, desde {igreja.fundacao}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80">
              Uma caminhada de fé que começou com um cooperador, uma caixa de pintinhos
              e o desejo de anunciar o evangelho. Acompanhe os marcos da {igreja.nome}.
            </p>
          </div>
        </section>

        {/* Linha do tempo */}
        <section className="container-page py-20">
          <ol className="relative space-y-12 before:absolute before:left-[19px] before:top-2 before:h-full before:w-px before:bg-midnight/15 sm:before:left-[27px]">
            {historia.map((marco) => (
              <MarcoTimeline key={marco.ano} marco={marco} />
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}