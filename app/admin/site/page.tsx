"use client";

import { useState, useEffect, ChangeEvent, ReactNode } from "react";
import Link from "next/link";
import { igreja as igrejaPadrao, conteudo as conteudoPadrao } from "@/data/site";
import { salvarConteudo, carregarConteudo } from "@/app/actions/site-conteudo";
import { supabaseBrowser } from "@/lib/supabase-browser";

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
      <main className="church min-h-screen bg-sand flex items-center justify-center">
        <p className="text-stone font-bold animate-pulse">Carregando editor...</p>
      </main>
    );
  }

  return (
    <main className="church min-h-screen bg-sand pb-20">
      
      {/* ================= CABEÇALHO DO PAINEL ================= */}
      <header className="bg-white border-b border-midnight/10 sticky top-0 z-40 shadow-sm mb-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* BOTÃO VOLTAR */}
            <Link 
              href="/admin" 
              className="bg-sand-warm text-stone p-2.5 rounded-xl hover:bg-gold hover:text-midnight transition flex items-center justify-center shadow-sm"
              title="Voltar ao Painel Principal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-midnight tracking-tight">Editar Página Inicial</h1>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Link href="/" target="_blank" className="bg-sand-warm text-midnight px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gold transition text-center flex-1 sm:flex-none">
              Ver Site
            </Link>
            <button 
              onClick={salvar}
              disabled={salvando}
              className="bg-midnight text-sand px-6 py-2.5 rounded-xl text-sm font-black hover:bg-midnight/90 transition disabled:opacity-50 shadow-md text-center flex-1 sm:flex-none flex justify-center items-center gap-2"
            >
              {salvando ? "Salvando..." : "💾 Salvar Alterações"}
            </button>
          </div>
        </div>
      </header>

      {/* ================= CORPO DO EDITOR ================= */}
      <div className="max-w-7xl mx-auto px-6">
        {status && (
          <div className={`mb-8 p-4 rounded-xl font-bold text-sm border ${status.includes("sucesso") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {status}
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-2">
          
          <div className="space-y-8">
            {/* ---------- DADOS DA IGREJA ---------- */}
            <Secao titulo="Dados da Igreja">
              <Campo label="Nome curto" value={igreja.nome} onChange={(v) => setIgrejaCampo("nome", v)} />
              <Campo label="Nome completo" value={igreja.nomeCompleto} onChange={(v) => setIgrejaCampo("nomeCompleto", v)} />
              <Campo label="E-mail" value={igreja.email} onChange={(v) => setIgrejaCampo("email", v)} />
              <Campo label="Endereço" value={igreja.endereco.linha1} onChange={(v) => setEndereco("linha1", v)} />
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Bairro" value={igreja.endereco.bairro} onChange={(v) => setEndereco("bairro", v)} />
                <Campo label="CEP" value={igreja.endereco.cep} onChange={(v) => setEndereco("cep", v)} />
              </div>
              <Campo label="Instagram (URL)" value={igreja.redes.instagram} onChange={(v) => setRede("instagram", v)} />
            </Secao>

            {/* ---------- TEXTOS DA HOME ---------- */}
            <Secao titulo="Textos da Página Inicial">
              <CampoArea label="Subtítulo do Hero (Topo)" value={conteudo.hero.subtitulo} onChange={setHero} />
              <CampoArea label="Nossa História — parágrafo 1" value={conteudo.sobre.paragrafo1} onChange={(v) => setSobre("paragrafo1", v)} />
              <CampoArea label="Nossa História — parágrafo 2" value={conteudo.sobre.paragrafo2} onChange={(v) => setSobre("paragrafo2", v)} />
            </Secao>
          </div>

          <div className="space-y-8">
            {/* ---------- PASTOR ---------- */}
            <Secao titulo="Liderança Pastoral">
              <Campo label="Nome do Pastor" value={conteudo.pastor.nome} onChange={(v) => setPastor("nome", v)} />
              <CampoArea label="Biografia — parágrafo 1" value={conteudo.pastor.bio1} onChange={(v) => setPastor("bio1", v)} />
              <CampoArea label="Biografia — parágrafo 2" value={conteudo.pastor.bio2} onChange={(v) => setPastor("bio2", v)} />
            </Secao>

            {/* ---------- IMAGENS ---------- */}
            <Secao titulo="Imagens do Site">
              <p className="text-sm text-stone mb-4">
                Envie as imagens (JPG, PNG ou WEBP, máx. 5MB). Elas são salvas no servidor automaticamente.
              </p>
              <div className="space-y-6">
                <CampoImagem label="Foto Principal (Hero/Templo)" value={conteudo.imagens.heroTemplo} onChange={(v) => setImagem("heroTemplo", v)} />
                <CampoImagem label="Foto da Seção História" value={conteudo.imagens.sobreTemplo} onChange={(v) => setImagem("sobreTemplo", v)} />
                <CampoImagem label="Foto do Pastor" value={conteudo.imagens.pastor} onChange={(v) => setImagem("pastor", v)} />
              </div>
            </Secao>
          </div>

        </div>
      </div>
    </main>
  );
}

/* ---------------- Componentes auxiliares ---------------- */

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-midnight/10 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold text-midnight mb-6 border-b border-midnight/10 pb-4">{titulo}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-midnight mb-1.5">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="w-full rounded-xl border border-midnight/15 bg-sand-warm/30 px-4 py-3 text-midnight outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 hover:border-midnight/30"
      />
    </label>
  );
}

function CampoArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-midnight mb-1.5">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className="w-full rounded-xl border border-midnight/15 bg-sand-warm/30 px-4 py-3 text-midnight outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 hover:border-midnight/30 resize-y"
      />
    </label>
  );
}

function CampoImagem({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem válido.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro("A imagem é muito grande (máximo 5 MB).");
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      const ext = file.name.split(".").pop();
      const nome = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.${ext}`;

      const { error: upErro } = await supabaseBrowser.storage
        .from("site")
        .upload(nome, file, { cacheControl: "3600", upsert: false });

      if (upErro) {
        setErro(`Falha ao enviar a imagem: ${upErro.message}`);
        return;
      }

      const { data } = supabaseBrowser.storage.from("site").getPublicUrl(nome);
      onChange(data.publicUrl);
    } catch (err) {
      setErro("Ocorreu um erro inesperado ao enviar.");
    } finally {
      setEnviando(false);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-sand-warm/30 p-5 rounded-2xl border border-midnight/10">
      <div className="flex justify-between items-center mb-3">
        <span className="block text-sm font-bold text-midnight">{label}</span>
        <label className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg transition ${enviando ? "bg-stone/20 text-stone" : "bg-gold text-midnight hover:bg-gold-light shadow-sm"}`}>
          {enviando ? "A Enviar..." : "Substituir"}
          <input type="file" accept="image/*" onChange={enviar} disabled={enviando} className="hidden" />
        </label>
      </div>

      {value ? (
        <div className="overflow-hidden rounded-xl border border-midnight/10 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Pré-visualização"
            className="h-32 w-full object-cover transition-opacity"
            onError={(ev) => ((ev.target as HTMLImageElement).style.opacity = "0.3")}
          />
        </div>
      ) : (
        <div className="h-32 w-full flex items-center justify-center bg-white border border-dashed border-midnight/20 rounded-xl text-stone text-sm">
          Sem imagem configurada
        </div>
      )}

      {erro && <p className="mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded">{erro}</p>}
    </div>
  );
}