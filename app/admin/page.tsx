"use client";

import { useState, useEffect, ChangeEvent, ReactNode } from "react";
import { igreja as igrejaPadrao, conteudo as conteudoPadrao } from "@/data/site";
import { salvarConteudo, carregarConteudo } from "@/app/actions/site-conteudo";

export default function AdminPage() {
  const [igreja, setIgreja] = useState(igrejaPadrao);
  const [conteudo, setConteudo] = useState(conteudoPadrao);
  const [salvando, setSalvando] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Carrega o que já está salvo no banco ao abrir
  useEffect(() => {
    carregarConteudo()
      .then((dados) => {
        if (dados?.igreja) setIgreja(dados.igreja);
        if (dados?.conteudo) setConteudo(dados.conteudo);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Helpers de atualização imutável
  const setIgrejaCampo = (campo: keyof typeof igreja, valor: string) =>
    setIgreja((s) => ({ ...s, [campo]: valor }));

  const setEndereco = (campo: keyof typeof igreja.endereco, valor: string) =>
    setIgreja((s) => ({ ...s, endereco: { ...s.endereco, [campo]: valor } }));

  const setRede = (campo: keyof typeof igreja.redes, valor: string) =>
    setIgreja((s) => ({ ...s, redes: { ...s.redes, [campo]: valor } }));

  const setImagem = (campo: keyof typeof conteudo.imagens, valor: string) =>
    setConteudo((s) => ({ ...s, imagens: { ...s.imagens, [campo]: valor } }));

  const setHero = (valor: string) =>
    setConteudo((s) => ({ ...s, hero: { ...s.hero, subtitulo: valor } }));

  const setSobre = (campo: keyof typeof conteudo.sobre, valor: string) =>
    setConteudo((s) => ({ ...s, sobre: { ...s.sobre, [campo]: valor } }));

  const setPastor = (campo: keyof typeof conteudo.pastor, valor: string) =>
    setConteudo((s) => ({ ...s, pastor: { ...s.pastor, [campo]: valor } }));

  const salvar = async () => {
    setSalvando(true);
    setStatus(null);
    try {
      const res = await salvarConteudo({ igreja, conteudo });
      setStatus(res.ok ? "Alterações salvas com sucesso!" : `Erro: ${res.erro}`);
    } catch {
      setStatus("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  if (carregando) {
    return (
      <main className="church min-h-screen bg-sand">
        <div className="container-page py-20">
          <p className="text-stone">Carregando conteúdo...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="church min-h-screen bg-sand">
      <div className="container-page py-12">
        <header className="mb-10">
          <span className="eyebrow">Painel</span>
          <h1 className="mt-2 text-3xl">Editar conteúdo do site</h1>
          <p className="mt-2 text-stone">
            Altere os textos e os caminhos das imagens. As mudanças são salvas no banco
            e refletem no site após salvar.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ---------- DADOS DA IGREJA ---------- */}
          <Secao titulo="Dados da igreja">
            <Campo label="Nome curto" value={igreja.nome} onChange={(v) => setIgrejaCampo("nome", v)} />
            <Campo label="Nome completo" value={igreja.nomeCompleto} onChange={(v) => setIgrejaCampo("nomeCompleto", v)} />
            <Campo label="E-mail" value={igreja.email} onChange={(v) => setIgrejaCampo("email", v)} />
            <Campo label="Endereço" value={igreja.endereco.linha1} onChange={(v) => setEndereco("linha1", v)} />
            <Campo label="Bairro" value={igreja.endereco.bairro} onChange={(v) => setEndereco("bairro", v)} />
            <Campo label="CEP" value={igreja.endereco.cep} onChange={(v) => setEndereco("cep", v)} />
            <Campo label="Instagram (URL)" value={igreja.redes.instagram} onChange={(v) => setRede("instagram", v)} />
          </Secao>

          {/* ---------- IMAGENS ---------- */}
          <Secao titulo="Imagens">
            <p className="text-sm text-stone-light">
              Suba os arquivos em <code className="rounded bg-sand-warm px-1 py-0.5">public/imgs/</code> e
              informe o caminho (ex: <code className="rounded bg-sand-warm px-1 py-0.5">/imgs/templo.jpg</code>).
            </p>
            <CampoImagem label="Foto do hero (templo)" value={conteudo.imagens.heroTemplo} onChange={(v) => setImagem("heroTemplo", v)} />
            <CampoImagem label="Foto da seção sobre" value={conteudo.imagens.sobreTemplo} onChange={(v) => setImagem("sobreTemplo", v)} />
            <CampoImagem label="Foto do pastor" value={conteudo.imagens.pastor} onChange={(v) => setImagem("pastor", v)} />
          </Secao>

          {/* ---------- TEXTOS DA HOME ---------- */}
          <Secao titulo="Textos da página inicial">
            <CampoArea label="Subtítulo do hero" value={conteudo.hero.subtitulo} onChange={setHero} />
            <CampoArea label="Sobre — parágrafo 1" value={conteudo.sobre.paragrafo1} onChange={(v) => setSobre("paragrafo1", v)} />
            <CampoArea label="Sobre — parágrafo 2" value={conteudo.sobre.paragrafo2} onChange={(v) => setSobre("paragrafo2", v)} />
          </Secao>

          {/* ---------- PASTOR ---------- */}
          <Secao titulo="Pastor">
            <Campo label="Nome" value={conteudo.pastor.nome} onChange={(v) => setPastor("nome", v)} />
            <CampoArea label="Biografia — parágrafo 1" value={conteudo.pastor.bio1} onChange={(v) => setPastor("bio1", v)} />
            <CampoArea label="Biografia — parágrafo 2" value={conteudo.pastor.bio2} onChange={(v) => setPastor("bio2", v)} />
          </Secao>
        </div>

        {/* ---------- AÇÕES ---------- */}
        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-midnight/10 pt-8">
          <button onClick={salvar} disabled={salvando} className="btn-primary disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
          {status && <span className="text-sm font-medium text-stone">{status}</span>}
        </div>
      </div>
    </main>
  );
}

/* ---------------- Componentes auxiliares ---------------- */

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-midnight/10 bg-white p-6">
      <h2 className="text-xl">{titulo}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-midnight">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-midnight/15 bg-white px-4 py-2.5 text-midnight outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}

function CampoArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-midnight">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-midnight/15 bg-white px-4 py-2.5 text-midnight outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}

function CampoImagem({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Campo label={label} value={value} onChange={onChange} />
      {value && (
        <div className="mt-2 overflow-hidden rounded-lg border border-midnight/10 bg-sand-warm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Prévia"
            className="h-32 w-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")}
          />
        </div>
      )}
    </div>
  );
}