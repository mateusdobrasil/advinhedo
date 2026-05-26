export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import CriadorMateria from '../../../components/CriadorMateria'

export default async function MateriasPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verificação de Segurança
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
    redirect('/ebd') // Redireciona alunos e sem acesso para fora do painel
  }

  // 4. Busca os Cursos Ativos (para alimentar o Select do CriadorMateria)
  const { data: cursosAtivos } = await supabase
    .from('cursos')
    .select('id, nome')
    .eq('status', 'Ativo')
    .order('nome', { ascending: true })

  // 5. Busca todas as Matérias com o nome do Curso relacionado
  // Ordena por Status (Ativa antes de Inativa no alfabeto) e depois por Nome
  const { data: materias, error } = await supabase
    .from('materias')
    .select(`
      *,
      cursos ( nome )
    `)
    .order('status', { ascending: true })
    .order('nome', { ascending: true })

  if (error) {
    console.error("Erro ao buscar matérias:", error.message)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              📚 Grade de Matérias
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Gerencie as disciplinas e vínculos com os cursos ativos do IBV.
            </p>
          </div>

          {/* Botões (Lado Direito) */}
          <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
            
            {/* 1º Botão: Voltar (Em cima) */}
            <Link 
              href="/ebd/admin" 
              className="text-sm bg-white border border-gray-200 text-gray-700 px-5 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm w-max"
            >
              Voltar ao Hub
            </Link>

            {/* 2º Botão: Criador de Matéria (Embaixo, alinhado à direita) */}
            <CriadorMateria cursos={cursosAtivos || []} />
            
          </div>
        </div>
        {/* ========================================== */}          

        {/* LISTAGEM DE MATÉRIAS */}
        <div className="grid grid-cols-1 gap-4">
          {materias && materias.length > 0 ? (
            materias.map((m) => {
              const isAtiva = m.status?.toLowerCase() === 'ativa'

              return (
                <div 
                  key={m.id} 
                  className={`p-5 rounded-xl border flex justify-between items-center transition
                    ${isAtiva 
                      ? 'bg-white border-gray-100 shadow-sm' 
                      : 'bg-gray-100 border-gray-200 opacity-75'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg text-xl ${isAtiva ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                      {isAtiva ? '📖' : '💤'}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${isAtiva ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                        {m.nome}
                      </h3>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Curso: { (m.cursos as any)?.nome || 'Sem curso vinculado' }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* TAG DE STATUS */}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase 
                      ${isAtiva ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {m.status || 'Ativa'}
                    </span>
                    
                    {/* COMPONENTE DE EDIÇÃO */}
                    <CriadorMateria materia={m} cursos={cursosAtivos || []} />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <p className="text-gray-400 italic">Nenhuma matéria encontrada no banco de dados.</p>
              {error && <p className="text-red-400 text-xs mt-2">Erro técnico: {error.message}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}