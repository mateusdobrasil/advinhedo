export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MateriaisAlunoPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verifica se está logado
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/') // Padronizado para a raiz
  }

  // 2. Busca a lista de materiais disponíveis
  const { data: materiais, error } = await supabase
    .from('materiais')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Erro ao buscar materiais:", error)
  }

  // Função simples para formatar a data de postagem
  const formatarData = (dataString: string) => {
    if (!dataString) return ''
    return new Date(dataString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-800">📚 Biblioteca Virtual</h1>
            <p className="text-gray-500 text-sm mt-1">Acesse apostilas, slides e arquivos das disciplinas.</p>
          </div>
          <Link 
            href="/dashboard/aluno" 
            className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Lista de Arquivos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {materiais && materiais.length > 0 ? (
              materiais.map((item) => (
                <li key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{item.titulo}</h3>
                    <p className="text-gray-500 text-sm mt-1">{item.descricao}</p>
                    
                    {/* Exibe a data em que o arquivo foi adicionado */}
                    {item.created_at && (
                      <p className="text-[10px] uppercase font-bold text-gray-400 mt-3 tracking-wider">
                        Postado em: {formatarData(item.created_at)}
                      </p>
                    )}
                  </div>
                  
                  <a 
                    href={item.arquivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm bg-indigo-50 text-indigo-700 px-6 py-2 rounded-lg font-bold hover:bg-indigo-100 transition whitespace-nowrap flex items-center gap-2"
                  >
                    <span>Baixar</span>
                    <span className="text-lg">⬇️</span>
                  </a>
                </li>
              ))
            ) : (
              <li className="p-12 text-center flex flex-col items-center">
                <span className="text-5xl mb-4">📭</span>
                <p className="text-gray-600 font-bold text-lg">Nenhum material disponível ainda.</p>
                <p className="text-gray-400 text-sm mt-1">Os professores adicionarão conteúdos em breve.</p>
              </li>
            )}
          </ul>
        </div>

      </div>
    </div>
  )
}