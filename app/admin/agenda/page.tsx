"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function GerenciadorAgendaPage() {
  const [abaAtiva, setAbaAtiva] = useState<"eventos" | "banners">("eventos");
  
  const [eventosDB, setEventosDB] = useState<any[]>([]);
  const [bannersDB, setBannersDB] = useState<any[]>([]);
  
  // Estados para as tabelas de suporte
  const [congregacoesDB, setCongregacoesDB] = useState<any[]>([]);
  const [departamentosDB, setDepartamentosDB] = useState<any[]>([]);
  
  const [carregando, setCarregando] = useState(true);
  
  const [viewEventos, setViewEventos] = useState<"nenhum" | "form" | "departamentos" | "congregacoes">("nenhum");
  const [novoNomeDep, setNovoNomeDep] = useState("");
  const [novoNomeCong, setNovoNomeCong] = useState("");
  const [busca, setBusca] = useState("");
  
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    data_evento: "", dia_semana: "Domingo", horario: "", titulo: "", departamento: "AD Vinhedo", abrangencia: "Local", congregacao: "Sede"
  });

  const [salvandoBanner, setSalvandoBanner] = useState(false);
  const [erroBanner, setErroBanner] = useState("");
  const [novoBanner, setNovoBanner] = useState({
    titulo: "", data_inicio: "", data_fim: "", imagem_url: ""
  });

  const supabase = createClientComponentClient();

  const buscarDados = async () => {
    setCarregando(true);
    const hoje = new Date().toISOString().split("T")[0];

    // Busca Eventos
    const { data: eventos } = await supabase.from("agenda_eventos").select("*").order("data_evento", { ascending: true });
    if (eventos) setEventosDB(eventos);

    // Busca Congregações (Usando a sua tabela existente "congregacoes")
    const { data: congregacoes } = await supabase.from("congregacoes").select("*").order("nome");
    if (congregacoes) setCongregacoesDB(congregacoes);

    // Busca Departamentos
    const { data: departamentos } = await supabase.from("departamento").select("*").order("nome");
    if (departamentos) setDepartamentosDB(departamentos);

    // Busca Banners com Exclusão Automática
    const { data: banners } = await supabase.from("banners").select("*").order("data_inicio", { ascending: true });
    if (banners) {
      const bannersValidos = [];
      for (const banner of banners) {
        if (banner.data_fim < hoje) {
          await supabase.from("banners").delete().eq("id", banner.id);
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
  const obterDiaSemana = (dataStr: string) => {
    if (!dataStr) return "";
    const dias = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
    // Usamos split para contornar problemas de fuso horário na conversão de string para Date
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    return dias[data.getDay()];
  };

  const adicionarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoEvento(true);
    
    const eventoParaSalvar = { ...novoEvento, dia_semana: obterDiaSemana(novoEvento.data_evento) };
    const { data, error } = await supabase.from("agenda_eventos").insert([eventoParaSalvar]).select();
    
    if (!error && data) {
      setEventosDB([...eventosDB, data[0]].sort((a, b) => a.data_evento.localeCompare(b.data_evento)));
      setNovoEvento({ data_evento: "", dia_semana: "Domingo", horario: "", titulo: "", departamento: "AD Vinhedo", abrangencia: "Local", congregacao: "Sede" });
      setViewEventos("nenhum");
      alert("Evento adicionado com sucesso!");
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

  // =========================================================================
  // AÇÕES DE DEPARTAMENTOS E CONGREGAÇÕES
  // =========================================================================
  const handleAddDepartamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeDep) return;
    const { data, error } = await supabase.from("departamento").insert([{ nome: novoNomeDep }]).select();
    if (!error && data) {
      setDepartamentosDB([...departamentosDB, data[0]].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoNomeDep("");
    } else {
      alert("Erro ao adicionar departamento.");
    }
  };

  const handleEditDepartamento = async (id: string, nomeAtual: string) => {
    const novoNome = prompt("Digite o novo nome para o departamento:", nomeAtual);
    if (!novoNome || novoNome === nomeAtual) return;
    const { error } = await supabase.from("departamento").update({ nome: novoNome }).eq("id", id);
    if (!error) {
      setDepartamentosDB(departamentosDB.map(d => d.id === id ? { ...d, nome: novoNome } : d).sort((a, b) => a.nome.localeCompare(b.nome)));
    } else {
      alert("Erro ao editar departamento.");
    }
  };

  const handleDeleteDepartamento = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este departamento?")) return;
    const { error } = await supabase.from("departamento").delete().eq("id", id);
    if (!error) {
      setDepartamentosDB(departamentosDB.filter(d => d.id !== id));
    } else {
      alert("Erro ao excluir. O departamento pode estar vinculado a algum evento.");
    }
  };

  const handleAddCongregacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeCong) return;
    const { data, error } = await supabase.from("congregacoes").insert([{ nome: novoNomeCong }]).select();
    if (!error && data) {
      setCongregacoesDB([...congregacoesDB, data[0]].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoNomeCong("");
    } else {
      alert("Erro ao adicionar congregação.");
    }
  };

  const handleEditCongregacao = async (id: string, nomeAtual: string) => {
    const novoNome = prompt("Digite o novo nome para a congregação:", nomeAtual);
    if (!novoNome || novoNome === nomeAtual) return;
    const { error } = await supabase.from("congregacoes").update({ nome: novoNome }).eq("id", id);
    if (!error) {
      setCongregacoesDB(congregacoesDB.map(c => c.id === id ? { ...c, nome: novoNome } : c).sort((a, b) => a.nome.localeCompare(b.nome)));
    } else {
      alert("Erro ao editar congregação.");
    }
  };

  const handleDeleteCongregacao = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta congregação?")) return;
    const { error } = await supabase.from("congregacoes").delete().eq("id", id);
    if (!error) {
      setCongregacoesDB(congregacoesDB.filter(c => c.id !== id));
    } else {
      alert("Erro ao excluir. A congregação pode estar vinculada a algum evento.");
    }
  };

  const cultosRegularesNomes = ["Culto de Ensino", "Culto da Família", "Culto de Louvor e Palavra", "EBD"];
  const eventosEspeciais = eventosDB.filter(ev => !cultosRegularesNomes.includes(ev.titulo));
  
  const eventosFiltrados = eventosEspeciais.filter(ev => 
    ev.titulo.toLowerCase().includes(busca.toLowerCase()) || 
    ev.data_evento.includes(busca)
  );

  // =========================================================================
  // AÇÕES DE BANNERS
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

      const { error: upErro } = await supabase.storage.from("site").upload(nomeArquivo, file, { cacheControl: "3600" });
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
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-black text-slate-800">Eventos Cadastrados</h2>
              <div className="flex gap-2 flex-wrap justify-end">
                <button 
                  onClick={() => setViewEventos(viewEventos === "departamentos" ? "nenhum" : "departamentos")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm ${viewEventos === "departamentos" ? "bg-slate-300 text-slate-800" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                >
                  {viewEventos === "departamentos" ? "✕ Fechar Deptos" : "Departamentos"}
                </button>
                <button 
                  onClick={() => setViewEventos(viewEventos === "congregacoes" ? "nenhum" : "congregacoes")}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm ${viewEventos === "congregacoes" ? "bg-slate-300 text-slate-800" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                >
                  {viewEventos === "congregacoes" ? "✕ Fechar Congregações" : "Congregações"}
                </button>
                <button 
                  onClick={() => setViewEventos(viewEventos === "form" ? "nenhum" : "form")}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-sm flex items-center gap-2"
                >
                  {viewEventos === "form" ? "✕ Cancelar Evento" : "+ Novo Evento"}
                </button>
              </div>
            </div>

            {viewEventos === "form" && (
              <div className="bg-slate-100 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-inner mb-6 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Cadastrar Novo Evento na Agenda</h3>
                <form onSubmit={adicionarEvento} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Título do Evento *</label>
                    <input type="text" placeholder="Ex: Congresso de Jovens UMADEVI" required value={novoEvento.titulo} onChange={e => setNovoEvento({...novoEvento, titulo: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Data *</label>
                    <input type="date" required value={novoEvento.data_evento} onChange={e => setNovoEvento({...novoEvento, data_evento: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Horário * (Ex: 19h30)</label>
                    <input type="text" required placeholder="19h30" value={novoEvento.horario} onChange={e => setNovoEvento({...novoEvento, horario: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Departamento</label>
                    <select value={novoEvento.departamento} onChange={e => setNovoEvento({...novoEvento, departamento: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                      <option value="" disabled>Selecione...</option>
                      {departamentosDB.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Abrangência</label>
                    <select value={novoEvento.abrangencia} onChange={e => setNovoEvento({...novoEvento, abrangencia: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                      <option value="Local">Local</option>
                      <option value="Campo">Campo</option>
                      <option value="Estadual">Estadual</option>
                      <option value="Nacional">Nacional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Congregação</label>
                    <select value={novoEvento.congregacao} onChange={e => setNovoEvento({...novoEvento, congregacao: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                      <option value="" disabled>Selecione...</option>
                      {congregacoesDB.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex justify-end mt-4">
                    <button type="submit" disabled={salvandoEvento} className="bg-blue-600 text-white px-8 py-3.5 font-black rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-md">
                      {salvandoEvento ? "Salvando..." : "Salvar Evento no Banco"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {viewEventos === "departamentos" && (
              <div className="bg-slate-100 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-inner mb-6 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Gerenciar Departamentos</h3>
                
                <form onSubmit={handleAddDepartamento} className="flex gap-3 mb-8">
                  <input type="text" value={novoNomeDep} onChange={e => setNovoNomeDep(e.target.value)} placeholder="Nome do novo departamento..." className="flex-1 bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required />
                  <button type="submit" className="bg-blue-600 text-white px-6 py-3 font-black rounded-xl hover:bg-blue-700 transition shadow-md">Adicionar</button>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {departamentosDB.map(dep => (
                      <li key={dep.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                        <span className="font-bold text-slate-700">{dep.nome}</span>
                        <div className="flex gap-3">
                          <button onClick={() => handleEditDepartamento(dep.id, dep.nome)} className="text-blue-500 hover:text-blue-700 text-sm font-bold transition">Editar</button>
                          <button onClick={() => handleDeleteDepartamento(dep.id)} className="text-red-500 hover:text-red-700 text-sm font-bold transition">Excluir</button>
                        </div>
                      </li>
                    ))}
                    {departamentosDB.length === 0 && <li className="p-4 text-center text-slate-500 text-sm">Nenhum departamento cadastrado.</li>}
                  </ul>
                </div>
              </div>
            )}

            {viewEventos === "congregacoes" && (
              <div className="bg-slate-100 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-inner mb-6 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Gerenciar Congregações</h3>
                
                <form onSubmit={handleAddCongregacao} className="flex gap-3 mb-8">
                  <input type="text" value={novoNomeCong} onChange={e => setNovoNomeCong(e.target.value)} placeholder="Nome da nova congregação..." className="flex-1 bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required />
                  <button type="submit" className="bg-blue-600 text-white px-6 py-3 font-black rounded-xl hover:bg-blue-700 transition shadow-md">Adicionar</button>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {congregacoesDB.map(cong => (
                      <li key={cong.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                        <span className="font-bold text-slate-700">{cong.nome}</span>
                        <div className="flex gap-3">
                          <button onClick={() => handleEditCongregacao(cong.id, cong.nome)} className="text-blue-500 hover:text-blue-700 text-sm font-bold transition">Editar</button>
                          <button onClick={() => handleDeleteCongregacao(cong.id)} className="text-red-500 hover:text-red-700 text-sm font-bold transition">Excluir</button>
                        </div>
                      </li>
                    ))}
                    {congregacoesDB.length === 0 && <li className="p-4 text-center text-slate-500 text-sm">Nenhuma congregação cadastrada.</li>}
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-4">
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
                              <p className="text-xs text-slate-500">{ev.departamento} • {ev.congregacao} ({ev.abrangencia})</p>
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
            
            <div className="bg-amber-50/50 p-6 sm:p-8 rounded-3xl border border-amber-200/50 shadow-sm">
              <h2 className="text-lg font-black text-slate-800 mb-2">Cadastrar Novo Banner</h2>
              <p className="text-sm text-slate-500 mb-6">Banners vencidos (data fim menor que hoje) são removidos automaticamente do sistema para manter o site atualizado.</p>
              
              <form onSubmit={adicionarBanner} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Título do Cartaz</label>
                    <input type="text" required placeholder="Ex: Congresso de Jovens 2026" value={novoBanner.titulo} onChange={e => setNovoBanner({...novoBanner, titulo: e.target.value})} className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Exibir a partir de:</label>
                    <input type="date" required value={novoBanner.data_inicio} onChange={e => setNovoBanner({...novoBanner, data_inicio: e.target.value})} className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Parar de exibir em:</label>
                    <input type="date" required value={novoBanner.data_fim} onChange={e => setNovoBanner({...novoBanner, data_fim: e.target.value})} className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Imagem do Cartaz</label>
                    <label className="cursor-pointer w-full bg-white border border-amber-200 px-4 py-3 rounded-xl text-sm font-bold text-amber-700 hover:bg-amber-100 transition flex justify-center items-center">
                      {salvandoBanner ? "Enviando..." : novoBanner.imagem_url ? "Imagem Anexada ✓" : "Upload de Imagem"}
                      <input type="file" accept="image/*" onChange={handleUploadBanner} disabled={salvandoBanner} className="hidden" />
                    </label>
                  </div>
                </div>
                
                {erroBanner && <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">{erroBanner}</p>}
                
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={salvandoBanner || !novoBanner.imagem_url} className="bg-amber-500 text-white font-black px-8 py-3.5 rounded-xl hover:bg-amber-600 transition disabled:opacity-50 shadow-md">
                    Cadastrar Banner
                  </button>
                </div>
              </form>
            </div>

            <h3 className="text-lg font-black text-slate-800 mt-10 mb-4">Banners Ativos ({bannersDB.length})</h3>
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