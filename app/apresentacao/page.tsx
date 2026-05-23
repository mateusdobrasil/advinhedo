import Link from "next/link";
import logo from "../imgs/logo.png";

export default function ApresentacaoDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      
      <div className="text-center mb-10 flex flex-col items-center">
        {/* Logo centralizada acima do título */}
        <img 
          src={logo.src} 
          alt="Logo AD Vinhedo" 
          className="h-24 w-auto object-contain mb-6 drop-shadow-sm" 
        />
        <h1 className="text-4xl font-bold text-gray-800">Painel AD Vinhedo</h1>
        <p className="text-gray-500 mt-2">Gestão de Apresentação de Visitantes</p>
      </div>

      {/* Grid responsivo: 1 coluna no celular, 4 colunas em telas médias/grandes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-5xl">
        
        {/* Card 1: Cadastro */}
        <Link href="/apresentacao/cadastro" 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Cadastro</h2>
          <p className="text-gray-500 mt-2 text-sm">Registrar novos visitantes, famílias e acompanhantes.</p>
        </Link>

        {/* Card 2: Apresentação ao vivo (Clara) */}
        <Link href="/apresentacao/apresentacao" 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Apresentação</h2>
          <p className="text-gray-500 mt-2 text-sm">Visualizar fila do dia e marcar visitantes já apresentados.</p>
        </Link>

        {/* Card 3: Apresentação ao vivo (Black) - Ícone de Lua e Cores Escuras */}
        <Link href="/apresentacao/apresentacaoblack" 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-900 group-hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Apresentação Black</h2>
          <p className="text-gray-500 mt-2 text-sm">Visualizar fila com fundo escuro (ideal para telões e painéis).</p>
        </Link>

        {/* Card 4: Edição */}
        <Link href="/apresentacao/edicao" 
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center group">
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