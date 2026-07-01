"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toggleStatusApresentacao } from '../actions/actions';
import logo from '../../imgs/logo.png';

export default function TelaApresentacao() {
  const router = useRouter(); 
  const supabase = createClientComponentClient();

  const [eventoAtivo, setEventoAtivo] = useState<string | null>(null);
  const [tituloEvento, setTituloEvento] = useState("Carregando...");
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [erro, setErro] = useState("");
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  // Busca todos os dados
  const carregarDados = useCallback(async (eventoId: string) => {
    const { data, error } = await supabase
      .from('recepcao_visitantes')
      .select(`
        id, nome_visitante, setor_trabalho, nome_esposa, representado_por,
        foi_apresentado, tipo, data_aniversario, observacoes, created_at,
        recepcao_dependentes_acompanhantes ( nome, tipo )
      `)
      .eq('evento_id', eventoId)
      .eq('foi_apresentado', false)
      .order('created_at', { ascending: true });

    if (error) {
      setErro(error.message);
    } else {
      setVisitantes(data || []);
    }
  }, [supabase]);

  useEffect(() => {
    const cookieEvento = document.cookie
      .split('; ')
      .find(row => row.startsWith('evento_ativo='))
      ?.split('=')[1];

    if (!cookieEvento) {
      router.push('/aplicacao/recepcao');
      return;
    }
    
    setEventoAtivo(cookieEvento);

    supabase.from('recepcao_eventos').select('nome_evento').eq('id', cookieEvento).single()
      .then(({ data }) => {
        if (data) setTituloEvento(data.nome_evento);
      });

    carregarDados(cookieEvento);

    const intervalo = setInterval(() => {
      carregarDados(cookieEvento);
    }, 3000);

    return () => clearInterval(intervalo);
  }, [router, supabase, carregarDados]);

  const handleApresentar = async (visitante: any) => {
    if (processandoId) return;
    setProcessandoId(visitante.id);
    
    await toggleStatusApresentacao(visitante.id, visitante.foi_apresentado);
    setVisitantes(prev => prev.filter(v => v.id !== visitante.id));
    await carregarDados(eventoAtivo!);
    setProcessandoId(null);
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Separa a lista por tipos
  const listaVisitas = visitantes.filter(v => (v.tipo === 'Visitas' || !v.tipo));
  const listaOracao = visitantes.filter(v => v.tipo === 'Pedido de Oraçao');
  const listaAniversarios = visitantes.filter(v => v.tipo === 'Aniversários');
  const listaAgradecimentos = visitantes.filter(v => v.tipo === 'Agradecimento');
  const listaAvisos = visitantes.filter(v => v.tipo === 'Aviso');

  if (erro) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg text-2xl">
          Erro ao carregar a fila de apresentação: {erro}
          <br /><br />
          <span className="text-sm text-red-400">Dica: Se o erro persistir, vá ao Supabase {">"} Project Settings {">"} API {">"} Reload PostgREST schema.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Cabeçalho Fixo */}
      <div className="p-4 md:px-8 flex flex-col gap-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo.src} alt="Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Painel do Dirigente</h1>
              <p className="text-sm font-bold text-blue-600">{tituloEvento}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-base md:text-lg font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-full hidden sm:block">
              Total na fila: <span className="text-gray-900">{visitantes.length}</span>
            </div>
            <Link href="/aplicacao/recepcao" className="bg-gray-800 text-white px-5 py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors text-base shadow-sm">
              Sair
            </Link>
          </div>
        </div>

        {/* Navegação Rápida */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mr-2 hidden md:block">Navegar:</span>
          
          <button onClick={() => scrollToSection('bloco-visitas')} disabled={listaVisitas.length === 0} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${listaVisitas.length > 0 ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'}`}>Visitas ({listaVisitas.length})</button>
          <button onClick={() => scrollToSection('bloco-oracoes')} disabled={listaOracao.length === 0} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${listaOracao.length > 0 ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'}`}>Orações ({listaOracao.length})</button>
          <button onClick={() => scrollToSection('bloco-aniversarios')} disabled={listaAniversarios.length === 0} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${listaAniversarios.length > 0 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'}`}>Aniversários ({listaAniversarios.length})</button>
          <button onClick={() => scrollToSection('bloco-agradecimentos')} disabled={listaAgradecimentos.length === 0} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${listaAgradecimentos.length > 0 ? 'bg-green-100 text-green-800 hover:bg-green-200 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'}`}>Agradecimentos ({listaAgradecimentos.length})</button>
          <button onClick={() => scrollToSection('bloco-avisos')} disabled={listaAvisos.length === 0} className={`px-4 py-2 rounded-lg font-bold text-base transition-colors ${listaAvisos.length > 0 ? 'bg-red-100 text-red-800 hover:bg-red-200 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'}`}>Avisos ({listaAvisos.length})</button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        
        {visitantes.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-dashed border-gray-300 p-20 text-center max-w-2xl mx-auto mt-10">
            <h3 className="text-4xl text-gray-400 font-medium mb-4">Púlpito Limpo</h3>
            <p className="text-2xl text-gray-400 mb-8">Não há nada aguardando leitura no momento.</p>
            <button onClick={() => eventoAtivo && carregarDados(eventoAtivo)} className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-8 py-4 rounded-xl font-bold text-lg transition-colors mx-auto">
              Recarregar Painel
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-10 max-w-6xl mx-auto w-full pb-32">
            
            {/* BLOCO: VISITAS */}
            {listaVisitas.length > 0 && (
              <div id="bloco-visitas" className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden scroll-mt-48">
                <div className="bg-blue-600 px-6 py-5 flex justify-between items-center"><h2 className="text-2xl font-bold text-white uppercase tracking-wider">Visitas ({listaVisitas.length})</h2></div>
                <div className="p-4 md:p-6 space-y-6">
                  {listaVisitas.map(v => {
                    const filhos = v.recepcao_dependentes_acompanhantes?.filter((d: any) => d.tipo === 'FILHO').map((f:any)=>f.nome) || [];
                    const acompanhantes = v.recepcao_dependentes_acompanhantes?.filter((d: any) => d.tipo === 'ACOMPANHANTE').map((a:any)=>a.nome) || [];
                    return (
                      <div key={v.id} className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
                        <div className="flex-1">
                          <div className="text-gray-700 space-y-2 text-lg md:text-xl"><b>Visitante:</b></div>
                          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{v.nome_visitante}</h3>
                          <div className="text-gray-700 space-y-2 text-lg md:text-3xl">
                            {v.setor_trabalho && <p><b>Vindo de:</b> {v.setor_trabalho}</p>}
                            {v.representado_por && <p className="text-yellow-800 bg-yellow-200/60 px-3 py-1 rounded inline-block mt-1"><b>Representado por:</b> {v.representado_por}</p>}
                            {v.nome_esposa && <p className="pt-1"><b>Esposa:</b> {v.nome_esposa}</p>}
                            {filhos.length > 0 && <p><b>Filhos:</b> {formatarLista(filhos)}</p>}
                            {acompanhantes.length > 0 && <p><b>Acompanhantes:</b> {formatarLista(acompanhantes)}</p>}
                          </div>
                        </div>
                        <button onClick={() => handleApresentar(v)} disabled={processandoId === v.id} className="shrink-0 self-center md:self-start bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 text-lg rounded-xl shadow-md disabled:opacity-50 transition-transform active:scale-95 w-full md:w-auto">Apresentado</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* BLOCO: PEDIDOS DE ORAÇÃO */}
            {listaOracao.length > 0 && (
              <div id="bloco-oracoes" className="bg-white rounded-2xl shadow-sm border border-purple-200 overflow-hidden scroll-mt-48">
                <div className="bg-purple-600 px-6 py-5 flex justify-between items-center"><h2 className="text-2xl font-bold text-white uppercase tracking-wider">Pedidos de Oração ({listaOracao.length})</h2></div>
                <div className="p-4 md:p-6 space-y-6">
                  {listaOracao.map(v => (
                    <div key={v.id} className="bg-purple-50/70 border border-purple-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
                      <div className="flex-1">
                        {v.representado_por && (
                          <div className="mb-4 bg-purple-100/50 p-3 rounded-lg border border-purple-200">
                            <span className="text-sm md:text-base text-purple-700 font-bold uppercase block mb-1">Quem pede:</span>
                            <p className="text-xl md:text-4xl font-bold text-gray-800 leading-tight">{v.representado_por}</p>
                          </div>
                        )}
                        <div className="mb-4">
                          <span className="text-sm md:text-base text-purple-700 font-bold uppercase block mb-1">Para quem é a oração:</span>
                          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{v.nome_visitante}</h3>
                        </div>
                        {v.observacoes && (
                          <div className="bg-white p-4 rounded-xl border border-purple-200 mt-2">
                            <p className="text-sm md:text-base text-gray-500 font-bold uppercase mb-2">Motivo do Pedido:</p>
                            <p className="text-gray-800 font-medium text-lg md:text-xl leading-relaxed">{v.observacoes}</p>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleApresentar(v)} disabled={processandoId === v.id} className="shrink-0 self-center md:self-start bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 text-lg rounded-xl shadow-md disabled:opacity-50 transition-transform active:scale-95 w-full md:w-auto">Lido ✓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BLOCO: ANIVERSÁRIOS */}
            {listaAniversarios.length > 0 && (
              <div id="bloco-aniversarios" className="bg-white rounded-2xl shadow-sm border border-yellow-300 overflow-hidden scroll-mt-48">
                <div className="bg-yellow-500 px-6 py-5 flex justify-between items-center"><h2 className="text-2xl font-bold text-yellow-950 uppercase tracking-wider">Aniversariantes ({listaAniversarios.length})</h2></div>
                <div className="p-4 md:p-6 space-y-6">
                  {listaAniversarios.map(v => (
                    <div key={v.id} className="bg-yellow-50/80 border border-yellow-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
                      <div className="flex-1">
                        <div className="text-gray-700 space-y-2 text-lg md:text-xl"><b>Aniversariante:</b></div>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{v.nome_visitante}</h3>
                        
                        {/* Novo campo: Quem parabeniza */}
                        {v.representado_por && (
                          <div className="mb-3">
                            <span className="text-yellow-800 bg-yellow-200/60 px-3 py-1 rounded inline-block text-lg md:text-xl">
                              <b>Quem parabeniza:</b> {v.representado_por}
                            </span>
                          </div>
                        )}

                        {v.data_aniversario && <p className="text-gray-700 font-medium mb-3 text-lg md:text-xl"><b>Data:</b> {formatarData(v.data_aniversario)}</p>}
                        {v.observacoes && <p className="text-gray-800 italic bg-white p-4 rounded-lg border border-yellow-200 text-lg md:text-xl">"{v.observacoes}"</p>}
                      </div>
                      <button onClick={() => handleApresentar(v)} disabled={processandoId === v.id} className="shrink-0 self-center md:self-start bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 text-lg rounded-xl shadow-md disabled:opacity-50 transition-transform active:scale-95 w-full md:w-auto">Lido ✓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BLOCO: AGRADECIMENTOS */}
            {listaAgradecimentos.length > 0 && (
              <div id="bloco-agradecimentos" className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden scroll-mt-48">
                <div className="bg-green-600 px-6 py-5 flex justify-between items-center"><h2 className="text-2xl font-bold text-white uppercase tracking-wider">Agradecimentos ({listaAgradecimentos.length})</h2></div>
                <div className="p-4 md:p-6 space-y-6">
                  {listaAgradecimentos.map(v => (
                    <div key={v.id} className="bg-green-50/70 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
                      <div className="flex-1">
                        <span className="text-sm md:text-base text-green-800 font-bold uppercase block mb-1">Quem agradece:</span>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{v.nome_visitante}</h3>
                        <p className="text-gray-800 whitespace-pre-wrap bg-white p-5 rounded-xl border border-green-200 text-xl md:text-2xl leading-relaxed">{v.observacoes}</p>
                      </div>
                      <button onClick={() => handleApresentar(v)} disabled={processandoId === v.id} className="shrink-0 self-center md:self-start bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 text-lg rounded-xl shadow-md disabled:opacity-50 transition-transform active:scale-95 w-full md:w-auto">Lido ✓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BLOCO: AVISOS */}
            {listaAvisos.length > 0 && (
              <div id="bloco-avisos" className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden scroll-mt-48">
                <div className="bg-red-600 px-6 py-5 flex justify-between items-center"><h2 className="text-2xl font-bold text-white uppercase tracking-wider">Avisos e Recados ({listaAvisos.length})</h2></div>
                <div className="p-4 md:p-6 space-y-6">
                  {listaAvisos.map(v => (
                    <div key={v.id} className="bg-red-50/70 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
                      <div className="flex-1">
                        <div className="text-gray-700 space-y-2 text-lg md:text-xl"><b>Quem avisa:</b></div>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{v.nome_visitante}</h3>
                        <p className="text-gray-800 whitespace-pre-wrap bg-white p-5 rounded-xl border border-red-200 text-xl md:text-2xl leading-relaxed">{v.observacoes}</p>
                      </div>
                      <button onClick={() => handleApresentar(v)} disabled={processandoId === v.id} className="shrink-0 self-center md:self-start bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-8 text-lg rounded-xl shadow-md disabled:opacity-50 transition-transform active:scale-95 w-full md:w-auto">Aviso Lido</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}