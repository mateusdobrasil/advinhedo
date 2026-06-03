"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import logo from "../../imgs/logo.png";

export default function EdicaoVisitante() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // --- GERENCIAMENTO DE EVENTOS ---
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoAtivoId, setEventoAtivoId] = useState<string>("");
  const [loadingEventos, setLoadingEventos] = useState(true);
  
  // NOVO ESTADO: Armazena todos os locais existentes históricos do banco de dados
  const [locaisExistentes, setLocaisExistentes] = useState<string[]>([]);

  // Estados para Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoEventoNome, setNovoEventoNome] = useState("");
  const [novoEventoData, setNovoEventoData] = useState("");
  const [novoEventoLocal, setNovoEventoLocal] = useState(""); 
  const [salvandoEvento, setSalvandoEvento] = useState(false);

  // --- GERENCIAMENTO DE VISITANTES (EDICAO) ---
  const [termoBusca, setTermoBusca] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [visitanteEditando, setVisitanteEditando] = useState<any | null>(null);
  
  // Filtro de navegação
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");

  // Estados dos inputs de edição (Reativos)
  const [tipo, setTipo] = useState("Visitas");
  const [nome, setNome] = useState("");
  const [representadoPor, setRepresentadoPor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataAniversario, setDataAniversario] = useState("");
  
  // Exclusivos de Visitas
  const [setor, setSetor] = useState("");
  const [esposa, setEsposa] = useState("");
  const [foiApresentado, setFoiApresentado] = useState(false);
  const [dependentes, setDependentes] = useState<any[]>([]);

  // 1. CARREGAR EVENTOS, DESATIVAR VENCIDOS E BUSCAR TODOS OS LOCAIS HISTÓRICOS
  const carregarEventos = useCallback(async () => {
    setLoadingEventos(true);
    
    // Busca eventos ativos para o select principal
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    // BUSCA COMPLEMENTAR: Coleta todos os locais cadastrados na história (ativos e inativos)
    const { data: todosEventos } = await supabase
      .from('eventos')
      .select('local_evento');

    if (todosEventos) {
      // Filtra strings vazias, remove duplicados e padroniza com trim()
      const locaisUnicos = Array.from(new Set(
        todosEventos
          .map(e => e.local_evento?.trim())
          .filter(Boolean)
      )) as string[];
      setLocaisExistentes(locaisUnicos);
    }

    if (data) {
      const hojeStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
      
      const eventosValidos: any[] = [];
      const eventosVencidos: string[] = [];

      data.forEach(evento => {
        if (evento.data_evento < hojeStr) {
          eventosVencidos.push(evento.id);
        } else {
          eventosValidos.push(evento);
        }
      });

      if (eventosVencidos.length > 0) {
        supabase.from('eventos').update({ ativo: false }).in('id', eventosVencidos).then();
      }

      setEventos(eventosValidos);

      const cookieEvento = document.cookie
        .split('; ')
        .find(row => row.startsWith('evento_ativo='))
        ?.split('=')[1];

      if (cookieEvento && eventosValidos.some(e => e.id === cookieEvento)) {
        setEventoAtivoId(cookieEvento);
      } else if (cookieEvento) {
        document.cookie = `evento_ativo=; path=/; max-age=0`;
        setEventoAtivoId("");
      }
    }
    setLoadingEventos(false);
  }, [supabase]);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  // 2. MUDAR DE EVENTO E ENCERRAR EVENTO (MANUAL)
  const handleSelecionarEvento = (id: string) => {
    setEventoAtivoId(id);
    document.cookie = `evento_ativo=${id}; path=/; max-age=${60 * 60 * 24 * 7}`;
    setVisitanteEditando(null);
  };

  const handleEncerrarEvento = async () => {
    if (!eventoAtivoId) return;
    if (!confirm("Tem certeza que deseja encerrar este evento? Ele será desativado e não aparecerá mais nas listas.")) return;

    setLoadingEventos(true);
    const { error } = await supabase.from('eventos').update({ ativo: false }).eq('id', eventoAtivoId);
    
    if (error) {
      alert(`Erro ao encerrar evento: ${error.message}`);
      setLoadingEventos(false);
      return;
    }

    document.cookie = `evento_ativo=; path=/; max-age=0`;
    setEventoAtivoId("");
    setVisitanteEditando(null);
    setResultados([]);
    setMensagem("Evento encerrado com sucesso.");
    
    await carregarEventos();
  };

  // 3. CRIAR NOVO EVENTO
  const abrirModal = () => {
    setNovoEventoNome("");
    setNovoEventoLocal(""); 
    const hoje = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    setNovoEventoData(hoje);
    setIsModalOpen(true);
  };

  const handleSalvarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEventoNome || !novoEventoData) return;

    setSalvandoEvento(true);
    const { data, error } = await supabase
      .from('eventos')
      .insert([{ 
        nome_evento: novoEventoNome, 
        data_evento: novoEventoData, 
        local_evento: novoEventoLocal?.trim() || null, 
        ativo: true 
      }])
      .select()
      .single();

    if (!error && data) {
      setEventos([data, ...eventos]); 
      handleSelecionarEvento(data.id); 
      setIsModalOpen(false); 
      // Força a atualização da lista de locais inteligentes para incluir o novo se houver
      await carregarEventos();
    } else {
      alert("Erro ao criar evento. Tente novamente.");
    }
    setSalvandoEvento(false);
  };

  // 4. BUSCAR VISITANTES DO EVENTO ATIVO (COM SILENT REFRESH)
  const fetchVisitantes = useCallback(async (busca = "", silent = false) => {
    if (!eventoAtivoId) {
      setResultados([]);
      return;
    }

    if (!silent) {
      setBuscando(true);
      setMensagem("");
    }

    let query = supabase
      .from("visitantes")
      .select(`*, dependentes_acompanhantes (*)`)
      .eq("evento_id", eventoAtivoId)
      .order("created_at", { ascending: false });

    if (busca.trim() !== "") {
      query = query.ilike("nome_visitante", `%${busca.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (!silent) setMensagem(`Erro na busca: ${error.message}`);
    } else {
      setResultados(data || []);
    }
    
    if (!silent) setBuscando(false);
  }, [eventoAtivoId, supabase]);

  useEffect(() => {
    if (eventoAtivoId) {
      fetchVisitantes(""); 
    }
  }, [eventoAtivoId, fetchVisitantes]);

  useEffect(() => {
    if (!eventoAtivoId || visitanteEditando) return;

    const intervalo = setInterval(() => {
      fetchVisitantes(termoBusca, true);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [eventoAtivoId, termoBusca, visitanteEditando, fetchVisitantes]);

  const handleBuscaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVisitantes(termoBusca);
  };

  // --- LÓGICA DE FILTRAGEM (NAVEGAÇÃO) ---
  const contagem = {
    Todos: resultados.length,
    Visitas: resultados.filter(r => (r.tipo || 'Visitas') === 'Visitas').length,
    'Pedido de Oraçao': resultados.filter(r => r.tipo === 'Pedido de Oraçao').length,
    Aniversários: resultados.filter(r => r.tipo === 'Aniversários').length,
    Agradecimento: resultados.filter(r => r.tipo === 'Agradecimento').length,
    Aviso: resultados.filter(r => r.tipo === 'Aviso').length,
  };

  const resultadosFiltrados = resultados.filter(r => {
    if (filtroAtivo === "Todos") return true;
    const tipoReal = r.tipo || "Visitas";
    return tipoReal === filtroAtivo;
  });

  // --- FUNÇÕES DE EDIÇÃO DE VISITANTES ---
  const alternarStatusApresentacao = async (id: string, statusAtual: boolean) => {
    const novoStatus = !statusAtual;
    const { error } = await supabase.from("visitantes").update({ foi_apresentado: novoStatus }).eq("id", id);
    if (error) {
      setMensagem(`Erro ao atualizar status: ${error.message}`);
    } else {
      setResultados(resultados.map(v => v.id === id ? { ...v, foi_apresentado: novoStatus } : v));
    }
  };

  const iniciarEdicao = (visitante: any) => {
    setVisitanteEditando(visitante);
    setTipo(visitante.tipo || "Visitas");
    setNome(visitante.nome_visitante || "");
    setRepresentadoPor(visitante.representado_por || "");
    setObservacoes(visitante.observacoes || "");
    setDataAniversario(visitante.data_aniversario || "");
    setSetor(visitante.setor_trabalho || "");
    setEsposa(visitante.nome_esposa || "");
    setFoiApresentado(visitante.foi_apresentado);
    setDependentes(visitante.dependentes_acompanhantes || []);
  };

  const adicionarDependente = (tipoDep: string) => setDependentes([...dependentes, { nome: "", tipo: tipoDep, novo: true }]);
  const atualizarNomeDependente = (index: number, novoNome: string) => {
    const novos = [...dependentes]; novos[index].nome = novoNome; setDependentes(novos);
  };
  const marcarParaExclusao = (index: number) => {
    const novos = [...dependentes];
    if (novos[index].novo) novos.splice(index, 1);
    else novos[index].excluido = true;
    setDependentes(novos);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setMensagem("");

    try {
      const { error: errorVisitante } = await supabase
        .from("visitantes")
        .update({
          tipo: tipo,
          nome_visitante: nome,
          representado_por: (tipo === 'Visitas' || tipo === 'Pedido de Oraçao' || tipo === 'Aniversários') ? representadoPor : null,
          observacoes: (tipo !== 'Visitas') ? observacoes : null,
          data_aniversario: (tipo === 'Aniversários') ? dataAniversario : null,
          setor_trabalho: tipo === 'Visitas' ? setor : null,
          nome_esposa: tipo === 'Visitas' ? esposa : null,
          foi_apresentado: foiApresentado
        })
        .eq("id", visitanteEditando.id);

      if (errorVisitante) throw errorVisitante;

      if (tipo === 'Visitas') {
        for (const dep of dependentes) {
          if (dep.excluido && dep.id) await supabase.from("dependentes_acompanhantes").delete().eq("id", dep.id);
          else if (dep.novo && dep.nome.trim() !== "") await supabase.from("dependentes_acompanhantes").insert([{ visitante_id: visitanteEditando.id, evento_id: eventoAtivoId, nome: dep.nome, tipo: dep.tipo }]);
          else if (!dep.excluido && dep.id) await supabase.from("dependentes_acompanhantes").update({ nome: dep.nome }).eq("id", dep.id);
        }
      } else {
        await supabase.from("dependentes_acompanhantes").delete().eq("visitante_id", visitanteEditando.id);
      }

      setMensagem("Registro atualizado com sucesso!");
      setVisitanteEditando(null);
      setTermoBusca("");
      
      fetchVisitantes(""); 
    } catch (error: any) {
      console.error(error);
      setMensagem(`Erro ao atualizar: ${error.message}`);
    } finally {
      setBuscando(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este registro permanentemente?")) return;
    setBuscando(true);
    const { error } = await supabase.from("visitantes").delete().eq("id", id);
    if (error) setMensagem(`Erro ao excluir: ${error.message}`);
    else {
      setMensagem("Registro excluído com sucesso.");
      setVisitanteEditando(null);
      setResultados(resultados.filter(r => r.id !== id));
    }
    setBuscando(false);
  };

  const formatarLista = (lista: string[]) => {
    if (lista.length === 0) return "";
    if (lista.length === 1) return lista[0];
    const ultimos = lista[lista.length - 1];
    const primeiros = lista.slice(0, -1);
    return primeiros.join(', ') + ' e ' + ultimos;
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  let labelNome = "Nome Principal *";
  if (tipo === "Visitas") labelNome = "Nome do Visitante *";
  if (tipo === "Aniversários") labelNome = "Nome do Aniversariante *";
  if (tipo === "Pedido de Oraçao") labelNome = "Para quem é a oração? *";
  if (tipo === "Agradecimento") labelNome = "Quem está agradecendo? *";
  if (tipo === "Aviso") labelNome = "Quem está dando o aviso? (Ou título) *";

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        
        {/* Cabeçalho Principal */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <img src={logo.src} alt="Logo" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Administração / Edição</h1>
              <p className="text-sm font-bold text-blue-600 mt-1">Gerencie eventos e cadastros</p>
            </div>
          </div>
          <Link href="/recepcao" className="text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
            ← Voltar ao Painel
          </Link>
        </div>

        {/* ---------------- SEÇÃO: GERENCIAMENTO DE EVENTO ---------------- */}
        {!visitanteEditando && (
          <div className="w-full bg-blue-50/50 p-5 rounded-xl border border-blue-100 mb-6 flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                Evento Selecionado
              </label>
              <select 
                value={eventoAtivoId} 
                onChange={(e) => handleSelecionarEvento(e.target.value)}
                disabled={loadingEventos}
                className="w-full p-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-900 shadow-sm"
              >
                <option value="">{loadingEventos ? "Carregando..." : "Selecione um evento..."}</option>
                {eventos.map(evento => {
                  const dataFormatada = new Date(evento.data_evento + 'T00:00:00').toLocaleDateString('pt-BR');
                  return (
                    <option key={evento.id} value={evento.id}>
                      {evento.nome_evento} {evento.local_evento ? `- ${evento.local_evento}` : ''} ({dataFormatada})
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              {eventoAtivoId && (
                <button 
                  onClick={handleEncerrarEvento}
                  disabled={loadingEventos}
                  className="flex-1 md:flex-none bg-red-100 text-red-700 font-bold py-3 px-4 rounded-lg hover:bg-red-200 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
                  title="Desativar este evento"
                >
                  Encerrar Evento
                </button>
              )}
              <button 
                onClick={abrirModal}
                disabled={loadingEventos}
                className="flex-1 md:flex-none bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
              >
                Criar Novo
              </button>
            </div>
          </div>
        )}

        {/* ---------------- BARRA DE FILTRO (PÍLULAS) ---------------- */}
        {eventoAtivoId && !visitanteEditando && resultados.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mr-2 w-full md:w-auto mb-2 md:mb-0">Filtro:</span>
            
            <button 
              onClick={() => setFiltroAtivo('Todos')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex-1 md:flex-none ${filtroAtivo === 'Todos' ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
            >
              Todos ({contagem['Todos']})
            </button>

            <button 
              onClick={() => setFiltroAtivo('Visitas')}
              disabled={contagem['Visitas'] === 0}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex-1 md:flex-none ${filtroAtivo === 'Visitas' ? 'bg-blue-600 text-white shadow-sm' : contagem['Visitas'] > 0 ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
            >
              Visitas ({contagem['Visitas']})
            </button>

            <button 
              onClick={() => setFiltroAtivo('Pedido de Oraçao')}
              disabled={contagem['Pedido de Oraçao'] === 0}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex-1 md:flex-none ${filtroAtivo === 'Pedido de Oraçao' ? 'bg-purple-600 text-white shadow-sm' : contagem['Pedido de Oraçao'] > 0 ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
            >
              Orações ({contagem['Pedido de Oraçao']})
            </button>

            <button 
              onClick={() => setFiltroAtivo('Aniversários')}
              disabled={contagem['Aniversários'] === 0}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex-1 md:flex-none ${filtroAtivo === 'Aniversários' ? 'bg-yellow-500 text-white shadow-sm' : contagem['Aniversários'] > 0 ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
            >
              Aniversários ({contagem['Aniversários']})
            </button>

            <button 
              onClick={() => setFiltroAtivo('Agradecimento')}
              disabled={contagem['Agradecimento'] === 0}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex-1 md:flex-none ${filtroAtivo === 'Agradecimento' ? 'bg-green-600 text-white shadow-sm' : contagem['Agradecimento'] > 0 ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
            >
              Agradecimentos ({contagem['Agradecimento']})
            </button>

            <button 
              onClick={() => setFiltroAtivo('Aviso')}
              disabled={contagem['Aviso'] === 0}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex-1 md:flex-none ${filtroAtivo === 'Aviso' ? 'bg-red-600 text-white shadow-sm' : contagem['Aviso'] > 0 ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
            >
              Avisos ({contagem['Aviso']})
            </button>
          </div>
        )}

        {/* MENSAGEM */}
        {mensagem && (
          <div className={`p-4 mb-6 rounded-md font-medium ${mensagem.includes("sucesso") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {mensagem}
          </div>
        )}

        {/* BLOQUEIA O RESTO SE NÃO TIVER EVENTO */}
        {!eventoAtivoId && !loadingEventos && (
          <div className="text-center py-10">
            <h3 className="text-xl font-bold text-gray-400">Nenhum evento ativo selecionado.</h3>
            <p className="text-gray-400 mt-2">Crie ou selecione um evento acima para visualizar os cadastros.</p>
          </div>
        )}

        {/* ---------------- BUSCA E RESULTADOS ---------------- */}
        {eventoAtivoId && !visitanteEditando && (
          <div className="mb-8">
            <form onSubmit={handleBuscaSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Buscar por nome ou título..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button type="submit" disabled={buscando} className="bg-gray-800 text-white px-6 font-bold rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50">
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </form>
          </div>
        )}

        {eventoAtivoId && !visitanteEditando && resultados.length === 0 && !buscando && (
           <p className="text-center text-gray-500 py-10">Nenhum registro encontrado neste evento.</p>
        )}

        {/* Renderiza a mensagem se houver resultados no total, mas o filtro atual estiver vazio */}
        {eventoAtivoId && !visitanteEditando && resultados.length > 0 && resultadosFiltrados.length === 0 && (
           <p className="text-center text-gray-500 py-10">Nenhum registro corresponde ao filtro de <b>{filtroAtivo}</b>.</p>
        )}

        {eventoAtivoId && !visitanteEditando && resultadosFiltrados.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                Lista de Cadastros {filtroAtivo !== 'Todos' && `- ${filtroAtivo}`} ({resultadosFiltrados.length})
                <span className="flex h-2 w-2 relative ml-2" title="Atualização em tempo real ativa">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {resultadosFiltrados.map((visitante) => {
                const tipoV = visitante.tipo || 'Visitas';
                const filhos = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'FILHO').map((f: any) => f.nome) || [];
                const acompanhantes = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'ACOMPANHANTE').map((a: any) => a.nome) || [];

                return (
                  <div key={visitante.id} className="p-5 flex flex-col lg:flex-row justify-between items-start gap-6 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0 w-full"> 
                      <h4 className="font-bold text-gray-900 text-xl mb-3 flex flex-wrap items-center gap-2 break-words">
                        <span className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider font-bold shrink-0
                          ${tipoV === 'Aniversários' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 
                            tipoV === 'Pedido de Oraçao' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 
                            tipoV === 'Agradecimento' ? 'bg-green-100 text-green-800 border border-green-300' : 
                            tipoV === 'Aviso' ? 'bg-red-100 text-red-800 border border-red-300' : 
                            'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                          {tipoV}
                        </span>
                        {visitante.nome_visitante}
                      </h4>
                      
                      <div className="text-base text-gray-600 space-y-2 mb-4 break-words">
                        {tipoV === 'Visitas' && (
                          <>
                            {visitante.setor_trabalho && <p><span className="font-medium text-gray-800">Vindo de:</span> {visitante.setor_trabalho}</p>}
                            {visitante.representado_por && <p><span className="font-medium text-gray-800">Representado por:</span> {visitante.representado_por}</p>}
                            {visitante.nome_esposa && <p><span className="font-medium text-gray-800">Esposa:</span> {visitante.nome_esposa}</p>}
                            {filhos.length > 0 && <p><span className="font-medium text-gray-800">Filhos:</span> {formatarLista(filhos)}</p>}
                            {acompanhantes.length > 0 && <p><span className="font-medium text-gray-800">Acompanhantes:</span> {formatarLista(acompanhantes)}</p>}
                          </>
                        )}
                        {tipoV === 'Aniversários' && (
                          <>
                            {visitante.representado_por && <p><span className="font-medium text-gray-800">Quem parabeniza:</span> {visitante.representado_por}</p>}
                            {visitante.data_aniversario && <p><span className="font-medium text-gray-800">Data:</span> {formatarData(visitante.data_aniversario)}</p>}
                            {visitante.observacoes && <p className="italic bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-2 whitespace-pre-wrap"><span className="font-bold text-gray-800 not-italic block mb-1">Observações:</span> {visitante.observacoes}</p>}
                          </>
                        )}
                        {tipoV === 'Agradecimento' && (
                          <>
                            {visitante.observacoes && <p className="bg-green-50 p-3 rounded-lg border border-green-100 mt-2 whitespace-pre-wrap text-gray-900 leading-relaxed"><span className="font-bold text-green-900 block mb-1">Agradecimento:</span> {visitante.observacoes}</p>}
                          </>
                        )}
                        {tipoV === 'Pedido de Oraçao' && (
                          <>
                            {visitante.representado_por && <p><span className="font-medium text-gray-800">Quem pediu:</span> {visitante.representado_por}</p>}
                            {visitante.observacoes && <p className="bg-purple-50 p-3 rounded-lg border border-purple-100 mt-2 whitespace-pre-wrap"><span className="font-bold text-purple-900 block mb-1">Motivo:</span> {visitante.observacoes}</p>}
                          </>
                        )}
                        {tipoV === 'Aviso' && (
                          <>
                            {visitante.observacoes && <p className="bg-red-50 p-4 rounded-lg border border-red-100 mt-2 whitespace-pre-wrap text-gray-900 leading-relaxed"><span className="font-bold text-red-900 block mb-1">Recado / Aviso completo:</span> {visitante.observacoes}</p>}
                          </>
                        )}
                      </div>

                      <div className="text-sm font-medium flex gap-2 items-center">
                        <span className={`w-3 h-3 rounded-full ${visitante.foi_apresentado ? 'bg-green-500' : 'bg-yellow-400'}`}></span>
                        <span className={visitante.foi_apresentado ? "text-green-700" : "text-yellow-600"}>
                          {visitante.foi_apresentado ? "Concluído / Apresentado" : "Aguardando na Fila"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap lg:flex-col xl:flex-row gap-2 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                      <button 
                        onClick={() => alternarStatusApresentacao(visitante.id, visitante.foi_apresentado)} 
                        className={`flex-1 lg:flex-none px-5 py-2.5 rounded-lg font-bold transition-colors ${
                          visitante.foi_apresentado ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {visitante.foi_apresentado ? "Voltar para Fila" : "Marcar Apresentado"}
                      </button>

                      <button onClick={() => iniciarEdicao(visitante)} className="flex-1 lg:flex-none px-5 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                        Editar Info
                      </button>
                      <button onClick={() => handleExcluir(visitante.id)} className="flex-1 lg:flex-none px-5 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- FORMULÁRIO DE EDIÇÃO INLINE ---------------- */}
        {visitanteEditando && (
          <form onSubmit={handleSalvarEdicao} className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6 bg-blue-50 p-5 rounded-xl border border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 break-words flex-1 pr-4">Editando: {visitanteEditando.nome_visitante}</h2>
              <button type="button" onClick={() => { setVisitanteEditando(null); fetchVisitantes(""); }} className="shrink-0 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg border shadow-sm transition-colors">
                ← Cancelar e Voltar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-blue-700 mb-1">Tipo de Registro *</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full p-3 border-2 border-blue-200 bg-blue-50 text-blue-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold">
                  <option value="Visitas">Visitas</option>
                  <option value="Aniversários">Aniversários</option>
                  <option value="Pedido de Oraçao">Pedido de Oração</option>
                  <option value="Agradecimento">Agradecimento</option>
                  <option value="Aviso">Aviso</option>
                </select>
              </div>

              {tipo === "Pedido de Oraçao" && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quem pediu? (Opcional)</label>
                  <input type="text" value={representadoPor} onChange={(e) => setRepresentadoPor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              )}

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{labelNome}</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              {tipo === "Visitas" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Setor de Trabalho (Congregação)</label>
                    <input type="text" value={setor} onChange={(e) => setSetor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Representado por (Se houver)</label>
                    <input type="text" value={representadoPor} onChange={(e) => setRepresentadoPor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Esposa</label>
                    <input type="text" value={esposa} onChange={(e) => setEsposa(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </>
              )}

              {tipo === "Aniversários" && (
                <>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quem parabeniza? (Opcional)</label>
                    <input type="text" value={representadoPor} onChange={(e) => setRepresentadoPor(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: Família, amigos, departamento..." />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data do Aniversário *</label>
                    <input type="date" required value={dataAniversario} onChange={(e) => setDataAniversario(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações / Detalhes</label>
                    <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                  </div>
                </>
              )}

              {tipo === "Agradecimento" && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agradecimento *</label>
                  <textarea value={observacoes} required onChange={(e) => setObservacoes(e.target.value)} rows={4} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                </div>
              )}

              {tipo === "Pedido de Oraçao" && (
                <>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qual é o pedido? *</label>
                    <textarea value={observacoes} required onChange={(e) => setObservacoes(e.target.value)} rows={4} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                  </div>
                </>
              )}

              {tipo === "Aviso" && (
                <>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aviso / Recado *</label>
                    <textarea value={observacoes} required onChange={(e) => setObservacoes(e.target.value)} rows={6} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                  </div>
                </>
              )}
            </div>

            <hr className="border-gray-100 my-6" />

            {tipo === "Visitas" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-700">Filhos</h3>
                    <button type="button" onClick={() => adicionarDependente('FILHO')} className="text-sm text-blue-600 font-medium hover:underline">+ Adicionar</button>
                  </div>
                  <div className="space-y-3">
                    {dependentes.filter(d => d.tipo === 'FILHO' && !d.excluido).length === 0 && <p className="text-sm text-gray-400 italic">Nenhum filho cadastrado.</p>}
                    {dependentes.map((dep, index) => {
                      if (dep.tipo !== 'FILHO' || dep.excluido) return null;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <input type="text" value={dep.nome} onChange={(e) => atualizarNomeDependente(index, e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Nome do filho" />
                          <button type="button" onClick={() => marcarParaExclusao(index)} className="text-red-500 hover:text-red-700 font-bold px-3 py-2 bg-red-50 rounded-lg">X</button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-700">Acompanhantes</h3>
                    <button type="button" onClick={() => adicionarDependente('ACOMPANHANTE')} className="text-sm text-green-600 font-medium hover:underline">+ Adicionar</button>
                  </div>
                  <div className="space-y-3">
                    {dependentes.filter(d => d.tipo === 'ACOMPANHANTE' && !d.excluido).length === 0 && <p className="text-sm text-gray-400 italic">Nenhum acompanhante cadastrado.</p>}
                    {dependentes.map((dep, index) => {
                      if (dep.tipo !== 'ACOMPANHANTE' || dep.excluido) return null;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <input type="text" value={dep.nome} onChange={(e) => atualizarNomeDependente(index, e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Nome do acompanhante" />
                          <button type="button" onClick={() => marcarParaExclusao(index)} className="text-red-500 hover:text-red-700 font-bold px-3 py-2 bg-red-50 rounded-lg">X</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={buscando} className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 mt-8 text-lg">
              {buscando ? "Salvando Alterações..." : "Salvar Alterações e Voltar"}
            </button>
          </form>
        )}

      </div>

      {/* ---------------- MODAL DE CRIAR EVENTO (INTELIGENTE COM AUTOCOMPLETE + TEXTO LIVRE) ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-blue-600 p-4">
              <h3 className="text-xl font-bold text-white">Criar Novo Evento</h3>
            </div>
            
            <form onSubmit={handleSalvarEvento} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Evento *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Culto de Celebração"
                    value={novoEventoNome} 
                    onChange={(e) => setNovoEventoNome(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>

                {/* CAMPO DE LOCAL MODIFICADO: Possui o atributo 'list' vinculado à nossa datalist */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Local do Evento</label>
                  <input 
                    type="text" 
                    list="locais-existentes-list"
                    placeholder="Clique para ver sugestões ou digite um novo..."
                    value={novoEventoLocal} 
                    onChange={(e) => setNovoEventoLocal(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  
                  {/* DATA LIST: Alimenta as opções sem trancar a digitação manual */}
                  <datalist id="locais-existentes-list">
                    {locaisExistentes.map((local, index) => (
                      <option key={index} value={local} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Data do Evento *</label>
                  <input 
                    type="date" 
                    required 
                    value={novoEventoData} 
                    onChange={(e) => setNovoEventoData(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={salvandoEvento}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {salvandoEvento ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}