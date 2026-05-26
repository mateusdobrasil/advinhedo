export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import CriadorAviso from '../../../components/CriadorAviso'

export default async function AvisosPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verificação de Sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // 2. Busca o perfil do usuário para checar acesso
  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  // 3. TRAVA DE SEGURANÇA: Administrador, Administrativo e Professor podem postar/ver avisos
  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || 
                    tipo.includes('administrativo') || 
                    tipo.includes('professor')

  if (!temAcesso) {
    redirect('/dashboard') // Se for aluno, redireciona para a área dele
  }

  // 4. Busca as turmas para o formulário
  const { data: turmas } = await supabase.from('turmas').select('id, nome').order('nome')

  // 5. Busca os avisos e faz um Join para pegar o nome da turma (se houver)
  const { data: avisos } = await supabase
    .from('avisos')
    .select(`
      *,
      turmas ( nome )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📢 Mural de Avisos</h1>
            <p className="text-gray-500 text-sm mt-1">Publique comunicados para toda a escola, polos ou turmas específicas.</p>
          </div>
          <Link href="/dashboard/admin" className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
            Voltar ao Hub
          </Link>
        </div>

        <div className="mb-8 flex justify-end">
          <CriadorAviso turmas={turmas || []} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {avisos && avisos.length > 0 ? (
            avisos.map((aviso) => {
              const dataPublicacao = new Date(aviso.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
              const nomeTurma = (aviso.turmas as any)?.nome

              return (
                <div key={aviso.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col relative overflow-hidden">
                  
                  {/* Etiqueta colorida no topo indicando o alcance do aviso */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${nomeTurma ? 'bg-indigo-500' : aviso.polo !== 'Todos' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-800">{aviso.titulo}</h3>
                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2">{dataPublicacao}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-6 flex-1 whitespace-pre-line">
                    {aviso.conteudo}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${aviso.polo === 'Todos' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                      📍 Polo: {aviso.polo}
                    </span>
                    
                    {nomeTurma ? (
                      <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                        🏫 Turma: {nomeTurma}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                        🌎 Geral
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full p-12 text-center bg-white rounded-xl border border-gray-200">
              <span className="text-4xl mb-4 block">📭</span>
              <p className="text-gray-600 font-medium">O mural está vazio.</p>
              <p className="text-gray-400 text-sm mt-1">Clique em "Publicar Aviso" para enviar o primeiro comunicado.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}