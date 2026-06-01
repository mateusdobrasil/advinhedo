"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  
  // Controle de visibilidade restrito apenas à interação com a barra superior
  const [mostrarControles, setMostrarControles] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      const ordemTipo: Record<string, number> = {
        'Visitas': 1,
        'Pedido de Oraçao': 2,
        'Aniversários': 3,
        'Agradecimento': 4,
        'Aviso': 5
      };

      const filaOrdenada = data.sort((a, b) => {
        const prioridadeA = ordemTipo[a.tipo || 'Visitas'] || 99;
        const prioridadeB = ordemTipo[b.tipo || 'Visitas'] || 99;
        if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      setVisitantes(filaOrdenada);
    }
  }, [supabase]);

  const visitantesExibidos = visitantes.filter(v => {
    if (filtroAtivo === "Todos") return true;
    const tipoReal = v.tipo || "Visitas";
    return tipoReal === filtroAtivo;
  });

  // Lógica de movimento real do mouse (Apenas na barra superior)
  useEffect(() => {
    const resetarTimeoutControles = (e: MouseEvent) => {
      // Verifica se houve movimento físico real do mouse
      if (e.movementX !== 0 || e.movementY !== 0) {
        setMostrarControles(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setMostrarControles(false), 5000);
      }
    };

    window.addEventListener("mousemove", resetarTimeoutControles);
    return () => {
      window.removeEventListener("mousemove", resetarTimeoutControles);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
      if (e.key === 'ArrowRight' && visitantesExibidos.length > 0 && !processando) {
        handleApresentar(visitantesExibidos[0]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visitantesExibidos, processando, eventoAtivo]);

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
      
      {/* Cabeçalho Fixo Black - Monitora toques e passadas de mouse diretamente na barra */}
      <div 
        onClick={(e) => {
          // Se o clique/toque veio de dentro dos botões ou do select, não fecha a barra
          if ((e.target as HTMLElement).closest('.controles-container')) return;
          setMostrarControles(!mostrarControles);
        }}
        onMouseEnter={() => setMostrarControles(true)}
        onMouseLeave={() => setMostrarControles(false)}
        className="p-4 md:px-8 flex items-center justify-between bg-gray-900 border-b border-gray-800 shadow-sm shrink-0 cursor-pointer select-none"
      >
        <div className="flex items-center gap-4">
          <img src={logo.src} alt="Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">{tituloEvento}</h1>
        </div>
        
        {/* Container de Controles - Aparece conforme o estado */}
        <div className={`controles-container flex items-center gap-3 md:gap-4 transition-opacity duration-300 ${mostrarControles ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value)}
            className="bg-gray-800 text-gray-100 border border-gray-700 px-4 py-2 rounded-xl font-bold text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
          >
            {["Todos", "Visitas", "Pedido de Oraçao", "Aniversários", "Agradecimento", "Aviso"].map((tipoOpcao) => (
              <option key={tipoOpcao} value={tipoOpcao} className="bg-gray-900 text-white">
                {tipoOpcao}
              </option>
            ))}
          </select>

          <button 
            onClick={() => eventoAtivo && carregarDados(eventoAtivo)}
            className="bg-gray-800 text-gray-300 px-4 py-2 rounded-xl font-bold hover:bg-gray-700 transition-colors text-base flex items-center gap-2 shadow-sm"
          >
            Atualizar
          </button>
          
          <Link href="/recepcao" className="bg-gray-800 text-gray-300 border border-gray-700 px-5 py-2 rounded-xl font-bold hover:bg-gray-700 hover:text-white transition-colors text-base shadow-sm">
            Sair
          </Link>
        </div>
      </div>

      {/* Corpo da página */}
      <div className="flex-1 flex items-start justify-center p-4 md:pt-6 overflow-hidden h-full">
        
        {visitantesExibidos.length === 0 ? (
          <div className="bg-gray-900 rounded-3xl shadow-sm border border-dashed border-gray-700 p-20 text-center max-w-3xl w-full mt-10">
            <h3 className="text-4xl text-gray-500 font-medium mb-6">Nenhum item {filtroAtivo !== 'Todos' ? `do tipo ${filtroAtivo}` : ''} na fila</h3>
            <p className="text-2xl text-gray-600 mb-10">Aguardando novos cadastros...</p>
          </div>
        ) : (
          (() => {
            const visitante = visitantesExibidos[0];
            const tipo = visitante.tipo || 'Visitas';
            const filhos = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'FILHO') || [];
            const acompanhantes = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'ACOMPANHANTE') || [];
            const nomesFilhos = filhos.map((f: any) => f.nome);
            const nomesAcompanhantes = acompanhantes.map((a: any) => a.nome);

            return (
              <button 
                key={visitante.id} 
                onClick={() => {
                  setMostrarControles(false); // Garante o fechamento da barra ao avançar no tablet
                  handleApresentar(visitante);
                }}
                disabled={processando}
                className={`bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-6 md:p-10 w-full max-w-[95%] 2xl:max-w-[1600px] h-[92%] flex flex-col animate-fade-in text-left transition-all duration-300 cursor-pointer ${processando ? 'opacity-50 cursor-wait' : 'hover:bg-gray-800/40 active:scale-[0.995]'}`}
              >
                
                <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 pb-4 w-full h-full custom-scrollbar">
                  
                  {tipo === 'Pedido de Oraçao' && <p className="text-3xl md:text-4xl text-gray-400 font-medium leading-none m-0">Para quem:</p>}
                  
                  <h2 className="text-6xl md:text-8xl font-bold text-blue-300 uppercase leading-tight break-words w-full drop-shadow-md">
                    {visitante.nome_visitante}
                  </h2>
                  
                  {tipo === 'Visitas' && (
                    <>
                      {visitante.setor_trabalho && <p className="text-3xl md:text-6xl text-gray-400 font-medium leading-snug mt-4">Vindo de: <span className="text-gray-100 font-bold">{visitante.setor_trabalho}</span></p>}
                      {visitante.representado_por && (
                        <div className="pt-4">
                          <div className="bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-300 px-8 py-4 md:px-10 md:py-6 rounded-2xl inline-flex flex-wrap items-center justify-center gap-2 shadow-sm">
                            <span className="font-bold text-yellow-400/80 uppercase text-2xl md:text-4xl tracking-wide">Representado por:</span>
                            <span className="text-4xl md:text-6xl font-bold ml-2 text-yellow-200">{visitante.representado_por}</span>
                          </div>
                        </div>
                      )}
                      {(visitante.nome_esposa || nomesFilhos.length > 0 || nomesAcompanhantes.length > 0) && <div className="w-32 h-1 md:h-2 bg-gray-700 mx-auto my-4 md:my-6 rounded-full shrink-0"></div>}
                      {visitante.nome_esposa && <p className="text-3xl md:text-6xl text-gray-400 font-medium">Esposa: <span className="text-gray-100 font-bold">{visitante.nome_esposa}</span></p>}
                      {nomesFilhos.length > 0 && <p className="text-3xl md:text-6xl text-gray-400 font-medium mt-2">Filhos: <span className="text-gray-100 font-bold"> {formatarLista(nomesFilhos)} </span></p>}
                      {nomesAcompanhantes.length > 0 && <p className="text-3xl md:text-6xl text-gray-400 font-medium mt-2">Acompanhantes: <span className="text-gray-100 font-bold"> {formatarLista(nomesAcompanhantes)} </span></p>}
                    </>
                  )}

                  {tipo === 'Aniversários' && (
                    <>
                      {visitante.representado_por && (
                        <p className="text-3xl md:text-5xl text-gray-400 font-medium leading-snug mt-6">
                          Quem parabeniza: <span className="text-gray-100 font-bold">{visitante.representado_por}</span>
                        </p>
                      )}
                      {visitante.data_aniversario && <p className="text-4xl md:text-7xl text-gray-400 font-medium mt-6">Data: <span className="text-gray-100 font-bold">{formatarData(visitante.data_aniversario)}</span></p>}
                      {visitante.observacoes && <div className="mt-10 bg-gray-800/80 p-8 md:p-10 rounded-3xl border border-gray-700 max-w-5xl"><p className="text-3xl md:text-5xl text-yellow-100/90 italic">"{visitante.observacoes}"</p></div>}
                    </>
                  )}

                  {tipo === 'Agradecimento' && (
                    <div className="mt-10 bg-green-900/20 p-10 rounded-3xl border border-green-800/50 w-full max-w-6xl">
                      <p className="text-4xl md:text-6xl text-gray-100 italic leading-relaxed">"{visitante.observacoes}"</p>
                    </div>
                  )}

                  {tipo === 'Pedido de Oraçao' && (
                    <div className="mt-10 bg-gray-800/80 p-8 md:p-10 rounded-3xl border border-gray-700 w-full max-w-5xl">
                      <p className="text-2xl md:text-4xl text-purple-300 mb-4 uppercase font-bold">Motivo:</p>
                      <p className="text-4xl md:text-6xl text-gray-100 italic leading-relaxed">"{visitante.observacoes}"</p>
                    </div>
                  )}

                  {tipo === 'Aviso' && (
                     <>
                      {visitante.observacoes && (
                        <div className="mt-10 bg-gray-800/80 p-10 md:p-14 rounded-3xl border border-gray-700 w-full max-w-6xl shadow-inner">
                          <p className="text-4xl md:text-7xl text-gray-100 whitespace-pre-wrap leading-relaxed break-words">{visitante.observacoes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* INSTRUÇÃO VISUAL */}
                <div className="shrink-0 w-full pt-4 mt-2 text-center opacity-20">
                   <p className="text-sm uppercase tracking-widest">{processando ? "Atualizando a fila..." : "Clique em qualquer lugar da tela para avançar"}</p>
                </div>
              </button>
            );
          })()
        )}
      </div>
    </div>
  );
}