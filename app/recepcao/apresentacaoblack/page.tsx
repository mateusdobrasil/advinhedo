"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toggleStatusApresentacao } from '../actions/actions';
import logo from '../../imgs/logo_branco.png';

export default function TelaApresentacaoBlack() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [eventoAtivo, setEventoAtivo] = useState<string | null>(null);
  const [tituloEvento, setTituloEvento] = useState("Carregando...");
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(false);

  const carregarDados = useCallback(async (eventoId: string) => {
    const { data, error } = await supabase
      .from('visitantes')
      .select(`
        id, nome_visitante, setor_trabalho, nome_esposa, representado_por,
        foi_apresentado, tipo, data_aniversario, observacoes, created_at,
        dependentes_acompanhantes ( nome, tipo )
      `)
      .eq('evento_id', eventoId)
      .eq('foi_apresentado', false);

    if (error) {
      setErro(error.message);
    } else if (data) {
      // REGRA DE ORDENAÇÃO: 
      // 1. Visitas | 2. Pedidos de Oração | 3. Aniversários | 4. Avisos
      const ordemTipo: Record<string, number> = {
        'Visitas': 1,
        'Pedido de Oraçao': 2,
        'Aniversários': 3,
        'Aviso': 4
      };

      const filaOrdenada = data.sort((a, b) => {
        const prioridadeA = ordemTipo[a.tipo || 'Visitas'] || 99;
        const prioridadeB = ordemTipo[b.tipo || 'Visitas'] || 99;
        
        // Se as prioridades forem diferentes, ordena pela prioridade (1, 2, 3, 4)
        if (prioridadeA !== prioridadeB) {
          return prioridadeA - prioridadeB;
        }
        
        // Se for o mesmo tipo, quem chegou primeiro na fila aparece primeiro (ordem de chegada)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      setVisitantes(filaOrdenada);
    }
  }, [supabase]);

  useEffect(() => {
    const cookieEvento = document.cookie
      .split('; ')
      .find(row => row.startsWith('evento_ativo='))
      ?.split('=')[1];

    if (!cookieEvento) {
      router.push('/recepcao');
      return;
    }
    
    setEventoAtivo(cookieEvento);

    supabase.from('eventos').select('nome_evento').eq('id', cookieEvento).single()
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
    if (processando) return;
    setProcessando(true);
    
    await toggleStatusApresentacao(visitante.id, visitante.foi_apresentado);
    await carregarDados(eventoAtivo!);
    setProcessando(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && visitantes.length > 0 && !processando) {
        handleApresentar(visitantes[0]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visitantes, processando, eventoAtivo]);

  const formatarLista = (lista: string[]) => {
    if (lista.length === 0) return "";
    if (lista.length === 1) return lista[0];
    const ultimos = lista[lista.length - 1];
    const primeiros = lista.slice(0, -1);
    return primeiros.join(', ') + ' e ' + ultimos;
  };

  // Função para formatar a data do banco (YYYY-MM-DD para DD/MM/YYYY)
  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    // O T00:00:00 garante que não haverá bug de fuso horário
    return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  if (erro) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="p-6 bg-red-900/50 text-red-200 rounded-lg text-2xl border border-red-800">
          Erro ao carregar a fila de apresentação: {erro}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden text-gray-100">
      
      {/* Cabeçalho Fixo Black */}
      <div className="p-4 md:px-8 flex items-center justify-between bg-gray-900 border-b border-gray-800 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <img src={logo.src} alt="Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">{tituloEvento}</h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-base md:text-lg font-bold text-blue-300 bg-blue-900/40 border border-blue-800 px-4 py-2 rounded-full">
            Restam na fila: {visitantes.length}
          </div>
          
          <button 
            onClick={() => eventoAtivo && carregarDados(eventoAtivo)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition-colors text-base md:text-lg flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>

          <Link href="/recepcao" className="bg-gray-800 text-gray-300 border border-gray-700 px-5 py-2 rounded-xl font-bold hover:bg-gray-700 hover:text-white transition-colors text-base md:text-lg shadow-sm">
            Sair
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-4 md:pt-6 overflow-hidden">
        
        {visitantes.length === 0 ? (
          <div className="bg-gray-900 rounded-3xl shadow-sm border border-dashed border-gray-700 p-20 text-center max-w-3xl w-full mt-10">
            <h3 className="text-4xl text-gray-500 font-medium mb-6">Nenhum visitante na fila</h3>
            <p className="text-2xl text-gray-600 mb-10">Aguardando novos cadastros...</p>
            
            <button 
              onClick={() => eventoAtivo && carregarDados(eventoAtivo)}
              className="bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 px-8 py-4 rounded-2xl font-bold transition-colors text-xl flex items-center justify-center gap-3 mx-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Verificar novos cadastros
            </button>
          </div>
        ) : (
          (() => {
            const visitante = visitantes[0];
            const tipo = visitante.tipo || 'Visitas';
            
            // Dados de dependentes (apenas para Visitas)
            const filhos = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'FILHO') || [];
            const acompanhantes = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'ACOMPANHANTE') || [];
            const nomesFilhos = filhos.map((f: any) => f.nome);
            const nomesAcompanhantes = acompanhantes.map((a: any) => a.nome);

            return (
              <div key={visitante.id} className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-6 md:p-10 w-full max-w-[95%] 2xl:max-w-[1600px] max-h-full flex flex-col animate-fade-in">
                
                <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center text-center space-y-4 md:space-y-6 pb-4 custom-scrollbar">
                  
                  {/* TAG COLORIDA COM O TIPO DA APRESENTAÇÃO 
                  <div className="mb-2">
                    <span className={`px-6 py-2 rounded-full text-xl md:text-2xl font-bold uppercase tracking-wider shadow-sm border-2 
                      ${tipo === 'Aniversários' ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700' : 
                        tipo === 'Pedido de Oraçao' ? 'bg-purple-900/40 text-purple-300 border-purple-700' : 
                        tipo === 'Aviso' ? 'bg-red-900/40 text-red-300 border-red-700' : 
                        'bg-blue-900/40 text-blue-300 border-blue-700'
                      }`}>
                      {tipo}
                    </span>
                  </div>
                  */}

                  {/* SUBTÍTULO ORAÇÃO (SE FOR O CASO) */}
                  {tipo === 'Pedido de Oraçao' && (
                    <p className="text-3xl md:text-4xl text-gray-400 font-medium leading-none m-0">Para quem:</p>
                  )}

                  {/* NOME PRINCIPAL - COMPARTILHADO */}
                  <h2 className="text-5xl md:text-7xl font-bold text-blue-300 uppercase leading-tight break-words w-full drop-shadow-md">
                    {visitante.nome_visitante}
                  </h2>
                  
                  {/* ----------------- RENDERIZAÇÃO: VISITAS ----------------- */}
                  {tipo === 'Visitas' && (
                    <>
                      {visitante.setor_trabalho && (
                        <p className="text-2xl md:text-5xl text-gray-400 font-medium leading-snug">
                          Vindo de: <span className="text-gray-100 font-bold">{visitante.setor_trabalho}</span>
                        </p>
                      )}

                      {visitante.representado_por && (
                        <div className="pt-2">
                          <div className="bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-300 px-6 py-3 md:px-8 md:py-4 rounded-2xl inline-flex flex-wrap items-center justify-center gap-2 shadow-sm">
                            <span className="font-bold text-yellow-400/80 uppercase text-xl md:text-3xl tracking-wide">
                              Representado por:
                            </span>
                            <span className="text-3xl md:text-5xl font-bold ml-2 text-yellow-200">
                              {visitante.representado_por}
                            </span>
                          </div>
                        </div>
                      )}

                      {(visitante.nome_esposa || nomesFilhos.length > 0 || nomesAcompanhantes.length > 0) && (
                         <div className="w-24 h-1 md:h-2 bg-gray-700 mx-auto my-2 md:my-4 rounded-full shrink-0"></div>
                      )}

                      {visitante.nome_esposa && (
                        <p className="text-2xl md:text-5xl text-gray-400 font-medium leading-snug">
                          Esposa: <span className="text-gray-100 font-bold"> {visitante.nome_esposa} </span>
                        </p>
                      )}

                      {nomesFilhos.length > 0 && (
                        <p className="text-2xl md:text-5xl text-gray-400 font-medium leading-snug break-words">
                          Filhos: <span className="text-gray-100 font-bold"> {formatarLista(nomesFilhos)} </span>
                        </p>
                      )}

                      {nomesAcompanhantes.length > 0 && (
                        <p className="text-2xl md:text-5xl text-gray-400 font-medium leading-snug break-words">
                          Acompanhantes: <span className="text-gray-100 font-bold"> {formatarLista(nomesAcompanhantes)} </span>
                        </p>
                      )}
                    </>
                  )}

                  {/* ----------------- RENDERIZAÇÃO: ANIVERSÁRIOS ----------------- */}
                  {tipo === 'Aniversários' && (
                    <>
                      {visitante.data_aniversario && (
                        <p className="text-3xl md:text-6xl text-gray-400 font-medium leading-snug mt-4">
                          Data: <span className="text-gray-100 font-bold">{formatarData(visitante.data_aniversario)}</span>
                        </p>
                      )}
                      
                      {visitante.observacoes && (
                        <div className="mt-8 bg-gray-800/80 p-6 md:p-8 rounded-3xl border border-gray-700 w-full max-w-4xl mx-auto shadow-inner">
                          <p className="text-2xl md:text-4xl text-yellow-100/90 italic break-words">
                            "{visitante.observacoes}"
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* ----------------- RENDERIZAÇÃO: PEDIDO DE ORAÇÃO ----------------- */}
                  {tipo === 'Pedido de Oraçao' && (
                    <>
                      {visitante.representado_por && (
                         <p className="text-3xl md:text-5xl text-gray-400 font-medium leading-snug mt-6">
                          Quem pediu: <span className="text-gray-100 font-bold">{visitante.representado_por}</span>
                        </p>
                      )}

                      {visitante.observacoes && (
                        <div className="mt-8 bg-gray-800/80 p-6 md:p-8 rounded-3xl border border-gray-700 w-full max-w-4xl mx-auto shadow-inner text-left">
                          <p className="text-xl md:text-3xl text-purple-300 font-medium mb-3 uppercase tracking-wider">Motivo do Pedido:</p>
                          <p className="text-3xl md:text-5xl text-gray-100 italic break-words leading-relaxed">"{visitante.observacoes}"</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* ----------------- RENDERIZAÇÃO: AVISOS ----------------- */}
                  {tipo === 'Aviso' && (
                    <>
                      {visitante.observacoes && (
                        <div className="mt-8 bg-gray-800/80 p-8 md:p-12 rounded-3xl border border-gray-700 w-full max-w-5xl mx-auto shadow-inner">
                          <p className="text-3xl md:text-6xl text-gray-100 whitespace-pre-wrap leading-relaxed break-words">
                            {visitante.observacoes}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                </div>

                <div className="shrink-0 w-full pt-6 mt-4 border-t border-gray-800">
                  <button 
                    onClick={() => handleApresentar(visitante)}
                    disabled={processando}
                    className={`w-full text-white font-bold py-5 md:py-6 px-8 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-4 text-2xl md:text-3xl uppercase tracking-wide disabled:opacity-50
                      ${tipo === 'Aviso' ? 'bg-red-700 hover:bg-red-600' : 'bg-green-600 hover:bg-green-500'}
                    `}
                  >
                    <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {processando ? "Atualizando fila..." : (tipo === 'Aviso' ? "Aviso Lido (Avançar)" : "Marcar como Apresentado")}
                  </button>
                </div>

              </div>
            )
          })()
        )}
      </div>
    </div>
  );
}