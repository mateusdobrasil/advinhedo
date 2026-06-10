import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import {
  igreja as igrejaPadrao,
  conteudo as conteudoPadrao,
  pilares,
  programacao,
} from "@/data/site";
import { carregarConteudo } from "@/app/actions/site-conteudo";

export default async function Home() {
  // Lê do banco; se vazio, usa o conteúdo padrão do data/site.ts
  const dados = await carregarConteudo();
  const igreja = dados?.igreja ?? igrejaPadrao;
  const conteudo = dados?.conteudo ?? conteudoPadrao;

  return (
    <>
      <SiteHeader />
      <main className="church">
        {/* ============== HERO ============== */}
        <section className="relative overflow-hidden bg-midnight text-sand">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-30%] h-[120%] w-[140%] -translate-x-1/2 opacity-70"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(227,195,133,0.35) 0%, rgba(19,41,75,0) 60%)",
            }}
          />
          <div className="container-page relative grid gap-10 py-24 md:py-32 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="animate-rise">
              <span className="eyebrow text-gold-light">{igreja.nomeCompleto}</span>
              <h1 className="mt-5 font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
                Um lugar para crescer na{" "}
                <span className="italic text-gold-light">fé</span>, na{" "}
                <span className="italic text-gold-light">Palavra</span> e na comunhão.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-sand/80">{conteudo.hero.subtitulo}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="#programacao" className="btn-primary">
                  Horários de culto
                </Link>
                <Link
                  href="/como-chegar"
                  className="btn-ghost border-sand/30 text-sand hover:bg-sand hover:text-midnight"
                >
                  Como chegar
                </Link>
              </div>
            </div>

            <div className="relative animate-rise">
              <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-sand/15 bg-gradient-to-br from-midnight-soft to-midnight-deep shadow-soft">
                <Image
                  src={conteudo.imagens.heroTemplo}
                  alt={`Templo da ${igreja.nome}`}
                  width={900}
                  height={1125}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============== PILARES ============== */}
        <section className="container-page py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {pilares.map((p) => (
              <article
                key={p.titulo}
                className="rounded-2xl border border-midnight/10 bg-white/60 p-8 transition hover:shadow-soft"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  {p.titulo}
                </span>
                <p className="mt-4 leading-relaxed text-stone">{p.texto}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============== SOBRE ============== */}
        <section className="bg-sand-warm">
          <div className="container-page grid gap-12 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="eyebrow">Nossa história</span>
              <h2 className="mt-4 text-3xl sm:text-4xl">Sobre a {igreja.nome}</h2>
              <p className="mt-6 text-lg leading-relaxed text-stone">
                {conteudo.sobre.paragrafo1}
              </p>
              <p className="mt-4 leading-relaxed text-stone">{conteudo.sobre.paragrafo2}</p>
              <Link
                href="/igreja"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-midnight transition hover:text-gold"
              >
                Conheça nossa história
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="aspect-video overflow-hidden rounded-3xl border border-midnight/10 shadow-soft">
              <Image
                src={conteudo.imagens.sobreTemplo}
                alt={`Templo da ${igreja.nome}`}
                width={1280}
                height={720}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* ============== PASTOR ============== */}
        <section className="container-page py-20">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-midnight/10 shadow-soft">
              <Image
                src={conteudo.imagens.pastor}
                alt={conteudo.pastor.nome}
                width={640}
                height={640}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="eyebrow">Liderança</span>
              <h2 className="mt-4 text-3xl sm:text-4xl">Conheça o pastor</h2>
              <p className="mt-2 text-lg font-semibold text-midnight">{conteudo.pastor.nome}</p>
              <p className="mt-6 leading-relaxed text-stone">{conteudo.pastor.bio1}</p>
              <p className="mt-4 leading-relaxed text-stone">{conteudo.pastor.bio2}</p>
            </div>
          </div>
        </section>

        {/* ============== PROGRAMAÇÃO ============== */}
        <section id="programacao" className="bg-midnight text-sand">
          <div className="container-page py-20">
            <div className="max-w-2xl">
              <span className="eyebrow text-gold-light">Programação</span>
              <h2 className="mt-4 text-3xl sm:text-4xl">Nossos cultos</h2>
              <p className="mt-4 text-sand/75">
                Reúna-se conosco durante a semana. Todas as pessoas são bem-vindas.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {programacao.map((bloco) => (
                <div
                  key={bloco.dia}
                  className="rounded-2xl border border-sand/15 bg-midnight-soft/40 p-7"
                >
                  <p className="font-display text-xl text-gold-light">{bloco.dia}</p>
                  <ul className="mt-5 space-y-3">
                    {bloco.cultos.map((c) => (
                      <li key={c.nome} className="flex items-baseline gap-3">
                        <span className="w-14 shrink-0 font-semibold tabular-nums text-sand">
                          {c.hora}
                        </span>
                        <span className="text-sand/80">{c.nome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href="/eventos" className="btn-primary">
                Ver todos os eventos
              </Link>
            </div>
          </div>
        </section>

        {/* ============== CONTRIBUIÇÃO ============== */}
        <section id="contribuir" className="container-page py-20">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gold to-gold-light p-10 text-midnight-deep sm:p-14">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl">Faça uma contribuição</h2>
              <p className="mt-4 text-lg text-midnight-deep/80">
                Contribua com seu dízimo ou oferta e participe da obra de Deus. Cada
                gesto sustenta o trabalho da igreja e o cuidado com a comunidade.
              </p>
              <Link
                href={igreja.linkCadastro}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-midnight px-7 py-3 text-sm font-semibold text-sand transition hover:bg-midnight-deep"
              >
                Contribuir agora
              </Link>
            </div>
          </div>
        </section>

        {/* ============== CONTATO RÁPIDO ============== */}
        <section className="bg-sand-warm">
          <div className="container-page grid gap-10 py-20 md:grid-cols-2">
            <div>
              <span className="eyebrow">Fale conosco</span>
              <h2 className="mt-4 text-3xl sm:text-4xl">Estamos por perto</h2>
              <p className="mt-4 leading-relaxed text-stone">
                Tem alguma dúvida ou gostaria de uma oração? Entre em contato — nossa
                equipe responderá assim que possível.
              </p>
              <dl className="mt-8 space-y-5 text-sm">
                <div>
                  <dt className="font-semibold text-midnight">E-mail</dt>
                  <dd className="mt-1 text-stone">
                    <a href={`mailto:${igreja.email}`} className="hover:text-gold">
                      {igreja.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-midnight">Endereço</dt>
                  <dd className="mt-1 text-stone">
                    {igreja.endereco.linha1} — {igreja.endereco.bairro},{" "}
                    {igreja.endereco.cidade}, CEP {igreja.endereco.cep}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="overflow-hidden rounded-3xl border border-midnight/10 shadow-soft">
              <iframe
                src={igreja.mapaEmbed}
                title="Localização da igreja no mapa"
                className="h-full min-h-[320px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}