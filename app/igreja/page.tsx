import Header from "@/components/site/SiteHeader";
import Footer from "@/components/site/SiteFooter";
import { igreja, pilares } from "@/data/site";

export const metadata = {
  title: "A Igreja",
  description: "Conheça a história e os valores da Assembleia de Deus em Vinhedo.",
};

export default function IgrejaPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-midnight text-sand">
          <div className="container-page py-20">
            <span className="eyebrow text-gold-light">A Igreja</span>
            <h1 className="mt-4 max-w-3xl font-display text-4xl sm:text-5xl">
              Uma família de fé desde {igreja.fundacao}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-sand/80">
              Conheça a história, a fé e os valores que sustentam a {igreja.nomeCompleto}.
            </p>
          </div>
        </section>

        <section className="container-page py-20">
          <div className="prose-church max-w-3xl space-y-5 text-lg leading-relaxed text-stone">
            <p>
              A {igreja.nome} nasceu do desejo de anunciar o evangelho de Jesus Cristo
              na cidade de {igreja.cidade}. Desde {igreja.fundacao}, gerações têm sido
              alcançadas pela Palavra de Deus nesta comunidade.
            </p>
            <p>
              {/* Substitua por sua história real */}
              Use este espaço para contar a trajetória da igreja: como tudo começou, os
              servos que Deus levantou ao longo dos anos, os marcos importantes e o
              crescimento da obra. Edite o texto em{" "}
              <code className="rounded bg-sand-warm px-1.5 py-0.5 text-base">
                app/igreja/page.js
              </code>
              .
            </p>
            <p>
              Cremos que os princípios da Bíblia Sagrada permanecem firmes, e é sobre
              esse fundamento que continuamos a edificar a vida da igreja, com oração,
              ensino e comunhão.
            </p>
          </div>
        </section>

        <section className="bg-sand-warm">
          <div className="container-page py-20">
            <h2 className="text-3xl sm:text-4xl">No que cremos</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {pilares.map((p) => (
                <div key={p.titulo} className="rounded-2xl border border-midnight/10 bg-white/60 p-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                    {p.titulo}
                  </span>
                  <p className="mt-4 leading-relaxed text-stone">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
