export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import UploaderMaterial from '../../../components/UploaderMaterial'

export default async function AdminMateriaisPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verificação de Sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // 2. Busca o perfil do usuário logado para checar acesso
  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  // 3. TRAVA DE SEGURANÇA: Administrador, Administrativo e Professor
  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || 
                    tipo.includes('administrativo') || 
                    tipo.includes('professor')

  if (!temAcesso) {
    redirect('/dashboard') // Redireciona alunos e sem acesso
  }

  // 4. Busca a lista de materiais já cadastrados
  const { data: materiais } = await supabase
    .from('materiais')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Biblioteca Virtual (Admin)</h1>
            <p className="text-gray-500 text-sm mt-1">Faça upload de materiais didáticos para os alunos.</p>
          </div>
          <Link 
            href="/dashboard/admin" 
            className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Voltar
          </Link>
        </div>

        {/* Formulário de Upload (Só aparece ao clicar) */}
        <div className="mb-8 flex justify-end">
          <UploaderMaterial />
        </div>

        {/* Lista de Materiais Cadastrados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Materiais Publicados</h2>
          </div>
          
          <ul className="divide-y divide-gray-100">
            {materiais && materiais.length > 0 ? (
              materiais.map((item) => (
                <li key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition">
                  <div>
                    <h3 className="font-bold text-gray-800">{item.titulo}</h3>
                    <p className="text-gray-500 text-sm">{item.descricao}</p>
                    <p className="text-xs text-gray-400 mt-2">Publicado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <a 
                    href={item.arquivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition whitespace-nowrap"
                  >
                    Abrir Arquivo
                  </a>
                </li>
              ))
            ) : (
              <li className="p-8 text-center text-gray-500">
                Nenhum material publicado ainda.
              </li>
            )}
          </ul>
        </div>

      </div>
    </div>
  )
}