"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import logo from "../imgs/logo.png";

export default function ApresentacaoDashboard() {
  const supabase = createClientComponentClient();
  
  const [eventos, setEventos] = useState<any[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Busca os eventos no banco e checa se já existe um selecionado no cookie
  useEffect(() => {
    const carregarEventos = async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (data) setEventos(data);

      // Lê o cookie para ver se já tínhamos um evento escolhido antes
      const cookieEvento = document.cookie
        .split('; ')
        .find(row => row.startsWith('evento_ativo='))
        ?.split('=')[1];

      if (cookieEvento && data?.some(e => e.id === cookieEvento)) {
        setEventoSelecionado(cookieEvento);
      }
      setLoading(false);
    };

    carregarEventos();
  }, [supabase]);

  // Atualiza o state e salva no Cookie para as outras páginas usarem
  const handleSelecionarEvento = (id: string) => {
    setEventoSelecionado(id);
    document.cookie = `evento_ativo=${id}; path=/; max-age=${60 * 60 * 24 * 7}`; // Expira em 7 dias
  };

  const isAcessoLiberado = eventoSelecionado !== "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      
      <div className="text-center mb-6 flex flex-col items-center">
        {/* Logo centralizada acima do título */}
        <img 
          src={logo.src} 
          alt="Logo AD Vinhedo" 
          className="h-48 w-auto object-contain mb-6 drop-shadow-sm" 
        />
        <h1 className="text-4xl font-bold text-gray-800">Painel Administrativo - Recepção da Igreja</h1>
        <p className="text-gray-500 mt-2">Gestão de Apresentação de Visitas, Aniversários, Pedidos de Oração e Avisos</p>
      </div>

      {/* Barra de Seleção de Evento */}
      <div className="w-full max-w-xl bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-10 relative z-10">
        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
          Selecione o Culto / Evento Atual
        </label>
        <select 
          value={eventoSelecionado} 
          onChange={(e) => handleSelecionarEvento(e.target.value)}
          disabled={loading}
          className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 disabled:opacity-50 text-center text-lg"
        >
          <option value="">{loading ? "Carregando..." : "Selecione um evento para liberar o acesso..."}</option>
          {eventos.map(evento => {
            // Formata a data para exibir no select (DD/MM/YYYY)
            const dataFormatada = new Date(evento.data_evento + 'T00:00:00').toLocaleDateString('pt-BR');
            return (
              <option key={evento.id} value={evento.id}>
                {evento.nome_evento} ({dataFormatada})
              </option>
            );
          })}
        </select>
      </div>

      {/* Mensagem de alerta se não houver evento selecionado */}
      {!isAcessoLiberado && !loading && (
        <div className="mb-6 px-6 py-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg font-medium text-center">
          Selecione um evento acima para habilitar o painel.
        </div>
      )}

      {/* Grid responsivo: 1 coluna no celular, 4 colunas em telas médias/grandes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-5xl">
        
        {/* Card 1: Cadastro */}
        <Link href={isAcessoLiberado ? "/recepcao/cadastro" : "#"}
              className={`bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 ${isAcessoLiberado ? 'shadow-sm hover:shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none grayscale'}`}>
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Cadastro</h2>
          <p className="text-gray-500 mt-2 text-sm">Registrar novos visitantes, famílias e acompanhantes.</p>
        </Link>

        {/* Card 2: Apresentação ao vivo (Clara) */}
        <Link href={isAcessoLiberado ? "/recepcao/apresentacao" : "#"} 
              className={`bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 ${isAcessoLiberado ? 'shadow-sm hover:shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none grayscale'}`}>
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Apresentação Púlpito</h2>
          <p className="text-gray-500 mt-2 text-sm">Visualizar fila do dia e marcar visitantes já apresentados.</p>
        </Link>

        {/* Card 3: Apresentação ao vivo (Black) */}
        <Link href={isAcessoLiberado ? "/recepcao/apresentacaoblack" : "#"} 
              className={`bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 ${isAcessoLiberado ? 'shadow-sm hover:shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none grayscale'}`}>
          <div className="w-16 h-16 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-900 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Apresentação Telão</h2>
          <p className="text-gray-500 mt-2 text-sm">Visualizar fila com fundo escuro (ideal para telões e painéis).</p>
        </Link>

        {/* Card 4: Edição */}
        <Link href={isAcessoLiberado ? "/recepcao/edicao" : "#"} 
              className={`bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center text-center group transition-all duration-300 ${isAcessoLiberado ? 'shadow-sm hover:shadow-md cursor-pointer' : 'opacity-40 cursor-not-allowed pointer-events-none grayscale'}`}>
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Edição</h2>
          <p className="text-gray-500 mt-2 text-sm">Buscar histórico, corrigir dados ou gerenciar cadastros salvos.</p>
        </Link>

      </div>

    </div>
  );
}