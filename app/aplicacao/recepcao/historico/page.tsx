"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import logo from "../../imgs/logo.png";

export default function HistoricoVisitantes() {
  const supabase = createClientComponentClient();

  // --- ESTADOS DE DADOS ---
  const [eventos, setEventEventos] = useState<any[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<Record<string, any[]>>({});
  const [mensagem, setMensagem] = useState("");

  // --- ESTADOS DE FILTROS ---
  const [filtroLocal, setFiltroLocal] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // 1. CARREGAR TODOS OS EVENTOS (INCLUSIVE INATIVOS)
  const carregarEventos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data_evento', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      setEventEventos(data);
      
      const locais = Array.from(new Set(
        data.map(e => e.local_evento?.trim() || 'Local não especificado')
      ));
      setLocaisDisponiveis(locais as string[]);
    } else if (error) {
      setMensagem(`Erro ao carregar eventos: ${error.message}`);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  const eventosParaDropdown = eventos.filter(e => {
    let pass = true;
    const localDoEvento = e.local_evento?.trim() || 'Local não especificado';
    
    if (filtroLocal && localDoEvento !== filtroLocal) pass = false;
    if (filtroDataInicio && e.data_evento < filtroDataInicio) pass = false;
    if (filtroDataFim && e.data_evento > filtroDataFim) pass = false;
    
    return pass;
  });

  useEffect(() => {
    if (filtroEvento && !eventosParaDropdown.find(e => e.id === filtroEvento)) {
      setFiltroEvento("");
    }
  }, [filtroLocal, filtroDataInicio, filtroDataFim, eventosParaDropdown, filtroEvento]);

  // 2. BUSCAR RESULTADOS (AGORA COM ORDENAÇÃO POR TIPO)
  const handleBuscarHistorico = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBuscando(true);
    setMensagem("");

    let eventosAlvo = eventosParaDropdown;
    if (filtroEvento) {
      eventosAlvo = eventos.filter(ev => ev.id === filtroEvento);
    }

    const idsEventos = eventosAlvo.map(ev => ev.id);

    if (idsEventos.length === 0) {
      setResultados({});
      setMensagem("Nenhum evento encontrado com os filtros atuais.");
      setBuscando(false);
      return;
    }

    const { data, error } = await supabase
      .from('visitantes')
      .select('*, dependentes_acompanhantes(*)')
      .in('evento_id', idsEventos)
      .order('created_at', { ascending: false });

    if (error) {
      setMensagem(`Erro ao buscar histórico: ${error.message}`);
      setResultados({});
    } else if (data) {
      // REGRA DE ORDENAÇÃO: 1. Visitas | 2. Pedidos de Oração | 3. Aniversários | 4. Agradecimento | 5. Aviso
      const ordemTipo: Record<string, number> = {
        'Visitas': 1,
        'Pedido de Oraçao': 2,
        'Aniversários': 3,
        'Agradecimento': 4,
        'Aviso': 5
      };

      const dadosOrdenados = [...data].sort((a, b) => {
        const prioridadeA = ordemTipo[a.tipo || 'Visitas'] || 99;
        const prioridadeB = ordemTipo[b.tipo || 'Visitas'] || 99;
        
        // Se os tipos forem diferentes, ordena pela prioridade da fila
        if (prioridadeA !== prioridadeB) {
          return prioridadeA - prioridadeB;
        }
        // Se for o mesmo tipo, mostra o cadastro mais recente primeiro no histórico
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Agrupa os visitantes já ordenados pelo ID do evento
      const agrupado = dadosOrdenados.reduce((acc: Record<string, any[]>, curr: any) => {
        if (!acc[curr.evento_id]) acc[curr.evento_id] = [];
        acc[curr.evento_id].push(curr);
        return acc;
      }, {});

      setResultados(agrupado);
      if (data.length === 0) {
         setMensagem("Nenhum registro de cadastro encontrado nestes eventos.");
      }
    }
    
    setBuscando(false);
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatarLista = (lista: string[]) => {
    if (lista.length === 0) return "";
    if (lista.length === 1) return lista[0];
    const ultimos = lista[lista.length - 1];
    const primeiros = lista.slice(0, -1);
    return primeiros.join(', ') + ' e ' + ultimos;
  };

  const quantidadeTotalRegistros = Object.values(resultados).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Histórico de Eventos</h1>
              <p className="text-sm font-bold text-teal-600 mt-1">Consulte cadastros de eventos passados e encerrados</p>
            </div>
          </div>
          <Link href="/aplicacao/recepcao" className="text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors shrink-0">
            ← Voltar ao Painel
          </Link>
        </div>

        {/* ---------------- BARRA DE FILTROS ---------------- */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl mb-10">
          <form onSubmit={handleBuscarHistorico} className="flex flex-col gap-5">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Filtro: Local */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Local do Evento</label>
                <select 
                  value={filtroLocal} 
                  onChange={(e) => setFiltroLocal(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
                >
                  <option value="">Todos os locais</option>
                  {locaisDisponiveis.map((local, index) => (
                    <option key={index} value={local}>{local}</option>
                  ))}
                </select>
              </div>

              {/* Filtro: Data Início */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data Inicial</label>
                <input 
                  type="date" 
                  value={filtroDataInicio} 
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
                />
              </div>

              {/* Filtro: Data Fim */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data Final</label>
                <input 
                  type="date" 
                  value={filtroDataFim} 
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
              {/* Filtro: Evento Específico */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Evento / Culto Específico (Opcional)</label>
                <select 
                  value={filtroEvento} 
                  onChange={(e) => setFiltroEvento(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-gray-800 font-medium"
                >
                  <option value="">Todos os eventos no período/local</option>
                  {eventosParaDropdown.map(evento => (
                    <option key={evento.id} value={evento.id}>
                      {evento.nome_evento} {evento.local_evento ? `- ${evento.local_evento}` : ''} ({formatarData(evento.data_evento)}) {!evento.ativo && '[ENCERRADO]'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1">
                <button 
                  type="submit" 
                  disabled={buscando || loading}
                  className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {buscando ? "Buscando..." : "Buscar Histórico"}
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* ---------------- FEEDBACK MENSAGEM ---------------- */}
        {mensagem && (
          <div className={`p-4 mb-6 rounded-md font-medium text-center ${mensagem.includes("Erro") ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            {mensagem}
          </div>
        )}

        {/* ---------------- RESULTADOS DA BUSCA ---------------- */}
        {Object.keys(resultados).length > 0 && (
          <div>
            <div className="mb-6 flex justify-between items-end border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Resultados da Busca</h2>
              <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                {quantidadeTotalRegistros} cadastros encontrados
              </span>
            </div>

            <div className="space-y-10">
              {Object.keys(resultados).map((eventoId) => {
                const evento = eventos.find(e => e.id === eventoId);
                const visitantesDoEvento = resultados[eventoId];
                if (!evento) return null;

                return (
                  <div key={eventoId} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    
                    {/* Cabeçalho do Evento no Histórico */}
                    <div className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${evento.ativo ? 'bg-gray-800' : 'bg-gray-600'}`}>
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {evento.nome_evento}
                          {!evento.ativo && <span className="text-xs font-bold bg-gray-500 text-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">Encerrado</span>}
                        </h3>
                        <p className="text-sm font-medium text-gray-300 mt-1">
                          {evento.local_evento?.trim() || 'Local não especificado'} • {formatarData(evento.data_evento)}
                        </p>
                      </div>
                      <div className="text-sm font-bold text-gray-800 bg-white/90 px-4 py-2 rounded-lg shrink-0">
                        {visitantesDoEvento.length} Registros
                      </div>
                    </div>

                    {/* Lista de Cadastros do Evento (Ordenados por Tipo) */}
                    <div className="divide-y divide-gray-100 p-2 md:p-6">
                      {visitantesDoEvento.map((visitante) => {
                        const tipoV = visitante.tipo || 'Visitas';
                        const filhos = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'FILHO').map((f: any) => f.nome) || [];
                        const acompanhantes = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'ACOMPANHANTE').map((a: any) => a.nome) || [];

                        return (
                          <div key={visitante.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between items-start gap-6 rounded-lg">
                            <div className="flex-1 min-w-0 w-full"> 
                              <h4 className="font-bold text-gray-900 text-lg md:text-xl mb-3 flex flex-wrap items-center gap-2 break-words">
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
                              
                              <div className="text-sm md:text-base text-gray-600 space-y-1 mb-3 break-words">
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
                                    {visitante.observacoes && <p className="italic bg-gray-100 p-3 rounded-lg border border-gray-200 mt-2 whitespace-pre-wrap"><span className="font-bold text-gray-800 not-italic block mb-1">Observações:</span> {visitante.observacoes}</p>}
                                  </>
                                )}
                                {tipoV === 'Agradecimento' && (
                                  <>
                                    {visitante.observacoes && <p className="bg-gray-100 p-3 rounded-lg border border-gray-200 mt-2 whitespace-pre-wrap text-gray-900 leading-relaxed"><span className="font-bold text-gray-800 block mb-1">Agradecimento:</span> {visitante.observacoes}</p>}
                                  </>
                                )}
                                {tipoV === 'Pedido de Oraçao' && (
                                  <>
                                    {visitante.representado_por && <p><span className="font-medium text-gray-800">Quem pediu:</span> {visitante.representado_por}</p>}
                                    {visitante.observacoes && <p className="bg-gray-100 p-3 rounded-lg border border-gray-200 mt-2 whitespace-pre-wrap"><span className="font-bold text-gray-800 block mb-1">Motivo:</span> {visitante.observacoes}</p>}
                                  </>
                                )}
                                {tipoV === 'Aviso' && (
                                  <>
                                    {visitante.observacoes && <p className="bg-gray-100 p-4 rounded-lg border border-gray-200 mt-2 whitespace-pre-wrap text-gray-900 leading-relaxed"><span className="font-bold text-gray-800 block mb-1">Recado completo:</span> {visitante.observacoes}</p>}
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="shrink-0 text-sm font-medium flex gap-2 items-center bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                              <span className={`w-2.5 h-2.5 rounded-full ${visitante.foi_apresentado ? 'bg-green-500' : 'bg-yellow-400'}`}></span>
                              <span className={visitante.foi_apresentado ? "text-green-700" : "text-yellow-600"}>
                                {visitante.foi_apresentado ? "Foi Apresentado" : "Não lido/Pendente"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}