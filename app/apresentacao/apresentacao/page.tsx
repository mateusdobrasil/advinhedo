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
  const [processando, setProcessando] = useState(false);

  // Função silenciosa que busca os dados no banco sem recarregar a tela
  const carregarDados = useCallback(async (eventoId: string) => {
    const { data, error } = await supabase
      .from('visitantes')
      .select(`
        id, nome_visitante, setor_trabalho, nome_esposa, representado_por,
        foi_apresentado, dependentes_acompanhantes ( nome, tipo )
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

  // Configuração inicial e Loop de 5 segundos
  useEffect(() => {
    const cookieEvento = document.cookie
      .split('; ')
      .find(row => row.startsWith('evento_ativo='))
      ?.split('=')[1];

    if (!cookieEvento) {
      router.push('/apresentacao');
      return;
    }
    
    setEventoAtivo(cookieEvento);

    // Busca o título do evento
    supabase.from('eventos').select('nome_evento').eq('id', cookieEvento).single()
      .then(({ data }) => {
        if (data) setTituloEvento(data.nome_evento);
      });

    // Primeira busca
    carregarDados(cookieEvento);

    // Loop infinito que atualiza silenciosamente a cada 5 segundos
    const intervalo = setInterval(() => {
      carregarDados(cookieEvento);
    }, 3000);

    return () => clearInterval(intervalo);
  }, [router, supabase, carregarDados]);

  // Função para marcar como apresentado
  const handleApresentar = async (visitante: any) => {
    if (processando) return;
    setProcessando(true);
    
    // Atualiza o banco
    await toggleStatusApresentacao(visitante.id, visitante.foi_apresentado);
    
    // Puxa a nova fila imediatamente
    await carregarDados(eventoAtivo!);
    setProcessando(false);
  };

  // Atalho do Teclado (Seta para a direita)
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

  if (erro) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-red-50 text-red-600 rounded-lg text-2xl">
          Erro ao carregar a fila de apresentação: {erro}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      
      {/* Cabeçalho Fixo */}
      <div className="p-4 md:px-8 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <img src={logo.src} alt="Logo AD Vinhedo" className="h-10 w-auto object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{tituloEvento}</h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-base md:text-lg font-bold text-blue-700 bg-blue-100 px-4 py-2 rounded-full">
            Restam na fila: {visitantes.length}
          </div>
          
          <button 
            onClick={() => eventoAtivo && carregarDados(eventoAtivo)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors text-base md:text-lg flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>

          <Link href="/apresentacao" className="bg-gray-800 text-white px-5 py-2 rounded-xl font-bold hover:bg-gray-700 transition-colors text-base md:text-lg shadow-sm">
            Sair
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-4 md:pt-6 overflow-hidden">
        
        {visitantes.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-dashed border-gray-300 p-20 text-center max-w-3xl w-full mt-10">
            <h3 className="text-4xl text-gray-400 font-medium mb-6">Nenhum visitante na fila</h3>
            <p className="text-2xl text-gray-400 mb-10">Aguardando novos cadastros...</p>
            
            <button 
              onClick={() => eventoAtivo && carregarDados(eventoAtivo)}
              className="bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 px-8 py-4 rounded-2xl font-bold transition-colors text-xl flex items-center justify-center gap-3 mx-auto"
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
            const filhos = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'FILHO') || [];
            const acompanhantes = visitante.dependentes_acompanhantes?.filter((d: any) => d.tipo === 'ACOMPANHANTE') || [];

            const nomesFilhos = filhos.map((f: any) => f.nome);
            const nomesAcompanhantes = acompanhantes.map((a: any) => a.nome);

            return (
              <div key={visitante.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10 w-full max-w-[95%] 2xl:max-w-[1600px] max-h-full flex flex-col animate-fade-in">
                
                <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center text-center space-y-4 md:space-y-6 pb-4">
                  
                  <h2 className="text-5xl md:text-7xl font-bold text-blue-900 uppercase leading-tight break-words w-full drop-shadow-sm">
                    {visitante.nome_visitante}
                  </h2>
                  
                  {visitante.setor_trabalho && (
                    <p className="text-2xl md:text-5xl text-gray-500 font-medium leading-snug">
                      Vindo de: <span className="text-gray-800 font-bold">{visitante.setor_trabalho}</span>
                    </p>
                  )}

                  {visitante.representado_por && (
                    <div className="pt-2">
                      <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-900 px-6 py-3 md:px-8 md:py-4 rounded-2xl inline-flex flex-wrap items-center justify-center gap-2 shadow-sm">
                        <span className="font-bold text-yellow-700 uppercase text-xl md:text-3xl tracking-wide">
                          Representado por:
                        </span>
                        <span className="text-3xl md:text-5xl font-bold ml-2">
                          {visitante.representado_por}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="w-24 h-1 md:h-2 bg-blue-100 mx-auto my-2 md:my-4 rounded-full shrink-0"></div>

                  {visitante.nome_esposa && (
                    <p className="text-2xl md:text-5xl text-gray-500 font-medium leading-snug">
                      Esposa: <span className="text-gray-800 font-bold"> {visitante.nome_esposa} </span>
                    </p>
                  )}

                  {nomesFilhos.length > 0 && (
                     <p className="text-2xl md:text-5xl text-gray-500 font-medium leading-snug break-words">
                      Filhos: <span className="text-gray-800 font-bold"> {formatarLista(nomesFilhos)} </span>
                    </p>
                  )}

                  {nomesAcompanhantes.length > 0 && (
                    <p className="text-2xl md:text-5xl text-gray-500 font-medium leading-snug break-words">
                      Acompanhantes: <span className="text-gray-800 font-bold"> {formatarLista(nomesAcompanhantes)} </span>
                    </p>
                  )}
                </div>

                <div className="shrink-0 w-full pt-6 mt-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleApresentar(visitante)}
                    disabled={processando}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 md:py-6 px-8 rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-4 text-2xl md:text-3xl uppercase tracking-wide disabled:opacity-50"
                  >
                    <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {processando ? "Atualizando fila..." : "Marcar como Apresentado"}
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