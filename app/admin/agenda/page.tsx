"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function GerenciadorAgendaPage() {
  const [abaAtiva, setAbaAtiva] = useState<"eventos" | "banners">("eventos");
  
  const [eventosDB, setEventosDB] = useState<any[]>([]);
  const [bannersDB, setBannersDB] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Estados para Busca e Formulário de Eventos
  const [busca, setBusca] = useState("");
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    data_evento: "", dia_semana: "Domingo", horario: "", titulo: "", departamento: "AD Vinhedo", abrangencia: "Local", congregacao: "Sede"
  });

  // Estados para Formulário de Banners
  const [salvandoBanner, setSalvandoBanner] = useState(false);
  const [erroBanner, setErroBanner] = useState("");
  const [novoBanner, setNovoBanner] = useState({
    titulo: "", data_inicio: "", data_fim: "", imagem_url: ""
  });

  const supabase = createClientComponentClient();

  // =========================================================================
  // CARREGAMENTO DE DADOS E EXCLUSÃO AUTOMÁTICA
  // =========================================================================
  const buscarDados = async () => {
    setCarregando(true);
    const hoje = new Date().toISOString().split("T")[0];

    // Busca Eventos
    const { data: eventos } = await supabase
      .from("agenda_eventos")
      .select("*")
      .order("data_evento", { ascending: true });

    if (eventos) setEventosDB(eventos);

    // Busca Banners
    const { data: banners } = await supabase
      .from("banners")
      .select("*")
      .order("data_inicio", { ascending: true });

    if (banners) {
      // Lógica de exclusão automática: verifica quais banners já passaram da data fim
      const bannersValidos = [];
      for (const banner of banners) {
        if (banner.data_fim < hoje) {
          // Exclui automaticamente do banco
          await supabase.from("banners").delete().eq("id", banner.id);
          // Opcional: Aqui você também poderia excluir a imagem do storage para economizar espaço
        } else {
          bannersValidos.push(banner);
        }
      }
      setBannersDB(bannersValidos);
    }
    
    setCarregando(false);
  };

  useEffect(() => {
    buscarDados();
  }, [supabase]);

  // =========================================================================
  // AÇÕES DE EVENTOS
  // =========================================================================
  const adicionarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoEvento(true);
    
    const { data, error } = await supabase.from("agenda_eventos").insert([novoEvento]).select();
    
    if (!error && data) {
      setEventosDB([...eventosDB, data[0]].sort((a, b) => a.data_evento.localeCompare(b.data_evento)));
      setNovoEvento({ data_evento: "", dia_semana: "Domingo", horario: "", titulo: "", departamento: "AD Vinhedo", abrangencia: "Local", congregacao: "Sede" });
      alert("Evento adicionado!");
    } else {
      alert("Erro ao adicionar evento.");
    }
    setSalvandoEvento(false);
  };

  const deletarEvento = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;
    const { error } = await supabase.from("agenda_eventos").delete().eq("id", id);
    if (!error) {
      setEventosDB(eventosDB.filter(ev => ev.id !== id));
    }
  };

  // Filtra eventos pela busca (ignora os cultos regulares fixos para a tabela focar nos especiais)
  const cultosRegularesNomes = ["Culto de Ensino", "Culto da Família", "Culto de Louvor e Palavra", "EBD"];
  const eventosEspeciais = eventosDB.filter(ev => !cultosRegularesNomes.includes(ev.titulo));
  
  const eventosFiltrados = eventosEspeciais.filter(ev => 
    ev.titulo.toLowerCase().includes(busca.toLowerCase()) || 
    ev.data_evento.includes(busca)
  );

  // =========================================================================
  // AÇÕES DE BANNERS (UPLOAD E CADASTRO)
  // =========================================================================
  const handleUploadBanner = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErroBanner("Selecione um arquivo de imagem válido.");
      return;
    }

    setErroBanner("");
    setSalvandoBanner(true);

    try {
      const ext = file.name.split(".").pop();
      const nomeArquivo = `banner-${Date.now()}.${ext}`;

      const { error: upErro } = await supabase.storage
        .from("site")
        .upload(nomeArquivo, file, { cacheControl: "3600" });

      if (upErro) throw upErro;

      const { data } = supabase.storage.from("site").getPublicUrl(nomeArquivo);
      setNovoBanner({ ...novoBanner, imagem_url: data.publicUrl });
    } catch (err) {
      setErroBanner("Erro ao enviar a imagem do banner.");
    } finally {
      setSalvandoBanner(false);
    }
  };

  const adicionarBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoBanner.imagem_url) {
      setErroBanner("Aguarde o upload da imagem ou envie uma imagem primeiro.");
      return;
    }

    setSalvandoBanner(true);
    const { data, error } = await supabase.from("banners").insert([novoBanner]).select();
    
    if (!error && data) {
      setBannersDB([...bannersDB, data[0]].sort((a, b) => a.data_inicio.localeCompare(b.data_inicio)));
      setNovoBanner({ titulo: "", data_inicio: "", data_fim: "", imagem_url: "" });
      alert("Banner cadastrado com sucesso!");
    } else {
      setErroBanner("Erro ao salvar o banner no banco.");
    }
    setSalvandoBanner(false);
  };

  const deletarBanner = async (id: string) => {
    if (!confirm("Excluir este banner? Ele deixará de aparecer no site imediatamente.")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (!error) {
      setBannersDB(bannersDB.filter(b => b.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* CABEÇALHO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="bg-slate-100 text-slate-600 p-2.5 rounded-xl hover:bg-slate-200 transition shadow-sm" title="Voltar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Agenda & Cartazes</h1>
          </div>
          <Link href="/eventos" target="_blank" className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
            Ver Site
          </Link>
        </div>
        
        {/* NAVEGAÇÃO ABAS */}
        <div className="max-w-6xl mx-auto px-6 flex gap-8 border-t border-slate-100 pt-2">
          <button 
            onClick={() => setAbaAtiva("eventos")}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${abaAtiva === "eventos" ? "border-slate-800 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            ⭐ Tabela de Eventos
          </button>
          <button 
            onClick={() => setAbaAtiva("banners")}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${abaAtiva === "banners" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            🖼️ Banners em Carrossel
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8">
        
        {/* ================= ABA: TABELA DE EVENTOS ================= */}
        {abaAtiva === "eventos" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* ADICIONAR NOVO EVENTO */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-black text-slate-800 mb-4">Cadastrar Novo Evento</h2>
              <form onSubmit={adicionarEvento} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 sm:col-span-4">
                  <input type="text" placeholder="Título do Evento (ex: Conferência Jovem)" required value={novoEvento.titulo} onChange={e => setNovoEvento({...novoEvento, titulo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-slate-400" />
                </div>
                <input type="date" required value={novoEvento.data_evento} onChange={e => setNovoEvento({...novoEvento, data_evento: e.target.value})} className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-slate-400" />
                <input type="time" required value={novoEvento.horario} onChange={e => setNovoEvento({...novoEvento, horario: e.target.value})} className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-slate-400" />
                <select value={novoEvento.dia_semana} onChange={e => setNovoEvento({...novoEvento, dia_semana: e.target.value})} className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-slate-400">
                  {["Segunda-Feira", "Terca-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sabado", "Domingo"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="submit" disabled={salvandoEvento} className="bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition disabled:opacity-50">
                  {salvandoEvento ? "Salvando..." : "+ Adicionar"}
                </button>
              </form>
            </div>

            {/* LISTA E BUSCA */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <input 
                  type="text" 
                  placeholder="🔍 Buscar evento por título ou data (ex: 2026-10-15)..." 
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              {carregando ? (
                <p className="p-8 text-center text-slate-500 font-medium">Carregando tabela...</p>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Data e Hora</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Título / Local</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eventosFiltrados.length === 0 ? (
                        <tr><td colSpan={3} className="p-8 text-center text-slate-400">Nenhum evento encontrado.</td></tr>
                      ) : (
                        eventosFiltrados.map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-50 transition group">
                            <td className="px-6 py-4 align-top w-48">
                              <p className="font-bold text-slate-800">{ev.data_evento}</p>
                              <p className="text-xs font-bold text-slate-500">{ev.horario} - {ev.dia_semana}</p>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <p className="font-black text-base text-slate-800">{ev.titulo}</p>
                              <p className="text-xs text-slate-500">{ev.departamento} • {ev.congregacao}</p>
                            </td>
                            <td className="px-6 py-4 align-top text-right">
                              <button onClick={() => deletarEvento(ev.id)} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 uppercase tracking-wider transition opacity-0 group-hover:opacity-100">
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA: BANNERS E CARTAZES ================= */}
        {abaAtiva === "banners" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* ADICIONAR NOVO BANNER */}
            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-200/50 shadow-sm">
              <h2 className="text-lg font-black text-slate-800 mb-2">Cadastrar Novo Banner</h2>
              <p className="text-sm text-slate-500 mb-6">Banners vencidos (data fim menor que hoje) são removidos automaticamente do sistema para manter o site atualizado.</p>
              
              <form onSubmit={adicionarBanner} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Título do Cartaz</label>
                    <input type="text" required placeholder="Ex: Congresso de Jovens 2026" value={novoBanner.titulo} onChange={e => setNovoBanner({...novoBanner, titulo: e.target.value})} className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Exibir a partir de:</label>
                    <input type="date" required value={novoBanner.data_inicio} onChange={e => setNovoBanner({...novoBanner, data_inicio: e.target.value})} className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Parar de exibir em:</label>
                    <input type="date" required value={novoBanner.data_fim} onChange={e => setNovoBanner({...novoBanner, data_fim: e.target.value})} className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Imagem do Cartaz</label>
                    <label className="cursor-pointer w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-sm font-bold text-amber-700 hover:bg-amber-100 transition flex justify-center items-center">
                      {salvandoBanner ? "Enviando..." : novoBanner.imagem_url ? "Imagem Anexada ✓" : "Upload de Imagem"}
                      <input type="file" accept="image/*" onChange={handleUploadBanner} disabled={salvandoBanner} className="hidden" />
                    </label>
                  </div>
                </div>
                
                {erroBanner && <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">{erroBanner}</p>}
                
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={salvandoBanner || !novoBanner.imagem_url} className="bg-amber-500 text-white font-black px-8 py-3 rounded-xl hover:bg-amber-600 transition disabled:opacity-50">
                    Cadastrar Banner
                  </button>
                </div>
              </form>
            </div>

            {/* LISTA DE BANNERS ATIVOS */}
            <h3 className="text-lg font-black text-slate-800 mt-8 mb-4">Banners Ativos ({bannersDB.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bannersDB.map(banner => (
                <div key={banner.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="relative aspect-video bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner.imagem_url} alt={banner.titulo} className="object-cover w-full h-full" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight mb-2">{banner.titulo}</h4>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 inline-block px-2 py-1 rounded">
                        Válido até: {banner.data_fim.split("-").reverse().join("/")}
                      </p>
                    </div>
                    <button onClick={() => deletarBanner(banner.id)} className="mt-4 text-xs font-bold text-red-500 hover:text-red-700 transition w-max">
                      Excluir Banner
                    </button>
                  </div>
                </div>
              ))}
              
              {bannersDB.length === 0 && !carregando && (
                <div className="col-span-full p-8 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400 font-medium">
                  Nenhum banner ativo no momento.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}