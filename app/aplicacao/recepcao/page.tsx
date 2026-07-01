"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { logoutRecepcao } from "@/app/aplicacao/actions/recepcao-auth";
import logo from "../imgs/logo.png";

export default function ApresentacaoDashboard() {
  const supabase = createClientComponentClient();
  const router   = useRouter();

  const [eventos, setEventos]                   = useState<any[]>([]);
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
  const [localSelecionado, setLocalSelecionado]   = useState<string>("");
  const [eventoSelecionado, setEventoSelecionado] = useState<string>("");
  const [loading, setLoading]                     = useState(true);

  useEffect(() => {
    const carregarEventos = async () => {
      const { data } = await supabase
        .from('recepcao_eventos')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (data) {
        const hojeStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString().split('T')[0];

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
          supabase.from('recepcao_eventos').update({ ativo: false }).in('id', eventosVencidos).then();
        }

        setEventos(eventosValidos);

        const locais = Array.from(new Set(
          eventosValidos.map(e => e.local_evento?.trim() || 'Local não especificado')
        ));
        setLocaisDisponiveis(locais);

        const cookieEvento = document.cookie
          .split('; ')
          .find(row => row.startsWith('evento_ativo='))
          ?.split('=')[1];

        if (cookieEvento) {
          const eventoNoCookie = eventosValidos.find(e => e.id === cookieEvento);
          if (eventoNoCookie) {
            setLocalSelecionado(eventoNoCookie.local_evento?.trim() || 'Local não especificado');
            setEventoSelecionado(cookieEvento);
          } else {
            document.cookie = `evento_ativo=; path=/; max-age=0`;
            setEventoSelecionado("");
            setLocalSelecionado("");
          }
        }
      }
      setLoading(false);
    };

    carregarEventos();
  }, [supabase]);

  const handleSelecionarLocal = (local: string) => {
    setLocalSelecionado(local);
    setEventoSelecionado("");
    document.cookie = `evento_ativo=; path=/; max-age=0`;
  };

  const handleSelecionarEvento = (id: string) => {
    setEventoSelecionado(id);
    document.cookie = `evento_ativo=${id}; path=/; max-age=${60 * 60 * 24 * 7}`;
  };

  async function sair() {
    await logoutRecepcao()
    router.push('/aplicacao/recepcao/login')
  }

  const isAcessoLiberado   = eventoSelecionado !== "";
  const eventosFiltrados   = eventos.filter(e =>
    (e.local_evento?.trim() || 'Local não especificado') === localSelecionado
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">

      {/* Botão sair */}
      <div className="w-full max-w-7xl flex justify-end mb-2">
        <button
          onClick={sair}
          className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-4 py-2 transition-colors">
          Sair
        </button>
      </div>

      <div className="text-center mb-6 flex flex-col items-center">
        <Image
          src={logo}
          alt="Logo AD Vinhedo"
          className="h-48 w-auto object-contain mb-6 drop-shadow-sm"
          priority
        />
        <h1 className="text-4xl font-bold text-gray-800">Painel Administrativo - Recepção da Igreja</h1>
        <p className="text-gray-500 mt-2">Gestão de Apresentação de Visitas, Aniversários, Pedidos de Oração, Agradecimentos e Avisos</p>
      </div>

      {/* Seleção em duas etapas */}
      <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10 relative z-10 flex flex-col md:flex-row gap-6">

        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 text-center md:text-left">
            1. Selecione o Local
          </label>
          <select
            value={localSelecionado}
            onChange={e => handleSelecionarLocal(e.target.value)}
            disabled={loading || locaisDisponiveis.length === 0}
            className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 disabled:opacity-50 text-base">
            <option value="">{loading ? "Carregando..." : "Escolha o Local..."}</option>
            {locaisDisponiveis.map((local, index) => (
              <option key={index} value={local}>{local}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 text-center md:text-left">
            2. Culto / Evento Atual
          </label>
          <select
            value={eventoSelecionado}
            onChange={e => handleSelecionarEvento(e.target.value)}
            disabled={!localSelecionado || loading}
            className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 disabled:opacity-50 text-base">
            <option value="">
              {!localSelecionado ? "Aguardando Local..." : "Selecione o culto..."}
            </option>
            {eventosFiltrados.map(evento => {
              const dataFormatada = new Date(evento.data_evento + 'T00:00:00').toLocaleDateString('pt-BR');
              return (
                <option key={evento.id} value={evento.id}>
                  {evento.nome_evento} ({dataFormatada})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {!isAcessoLiberado && !loading && (
        <div className="mb-6 px-6 py-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg font-medium text-center">
          Selecione o local e o evento acima para habilitar o painel. Caso não haja eventos, acesse "Edição" para criar um novo.
        </div>
      )}

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full max-w-7xl">

        <Link href={isAcessoLiberado ? "/aplicacao/recepcao/cadastro" : "#"}
          className={`bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 ${isAcessoLiberado ? 'shadow-sm hover:shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none grayscale'}`}>
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Cadastro</h2>
          <p className="text-gray-500 mt-2 text-sm">Registrar novos visitantes, famílias e acompanhantes.</p>
        </Link>

        <Link href={isAcessoLiberado ? "/aplicacao/recepcao/apresentacao" : "#"}
          className={`bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 ${isAcessoLiberado ? 'shadow-sm hover:shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none grayscale'}`}>
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Apresentação Púlpito</h2>
          <p className="text-gray-500 mt-2 text-sm">Visualizar fila do dia e marcar visitantes já apresentados.</p>
        </Link>

        <Link href={isAcessoLiberado ? "/aplicacao/recepcao/apresentacaoblack" : "#"}
          className={`bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 ${isAcessoLiberado ? 'shadow-sm hover:shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none grayscale'}`}>
          <div className="w-16 h-16 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-900 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Apresentação Telão</h2>
          <p className="text-gray-500 mt-2 text-sm">Visualizar fila com fundo escuro (ideal para telões e painéis).</p>
        </Link>

        <Link href="/aplicacao/recepcao/edicao"
          className="bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Edição de Eventos</h2>
          <p className="text-gray-500 mt-2 text-sm">Criar eventos atuais, corrigir dados e gerenciar status ativos.</p>
        </Link>

        <Link href="/aplicacao/recepcao/historico"
          className="bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Histórico</h2>
          <p className="text-gray-500 mt-2 text-sm">Consultar todos os recados e eventos passados, incluindo inativos.</p>
        </Link>

      </div>
    </div>
  );
}