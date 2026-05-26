export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import CriadorTurma from '../../../components/CriadorTurma'

export default async function TurmasPage() {
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
    redirect('/dashboard') // Se não tiver permissão, redireciona para fora do admin
  }

  // 4. Busca as turmas ordenadas por status (Ativa primeiro) e depois por ordem alfabética
  const { data: turmas, error } = await supabase
    .from('turmas')
    .select('*')
    .eq('is_ebd', false)
    .order('status', { ascending: true })
    .order('nome', { ascending: true })

  if (error) {
    console.error("Erro na leitura das turmas:", error.message)
  }

  // 5. Procure as salas da EBD configuradas na base de dados
  const { data: ebdSalasConfig } = await supabase
    .from('ebd_salas_config')
    .select('id, nome, faixa_etaria')
    .eq('status', 'Ativo')
    .order('nome', { ascending: true })

  // 6. Busca os Cursos Ativos para popular o select de criação/edição de turmas
  const { data: cursosAtivos } = await supabase
    .from('cursos')
    .select('id, nome')
    .eq('status', 'Ativo')
    .order('nome', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏫 Gestão de Turmas</h1>
            <p className="text-gray-500 text-sm mt-1">Crie e gerencie as salas de aula e polos de estudo.</p>
          </div>
          <Link href="/dashboard/admin" className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
            Voltar ao Hub
          </Link>
        </div>

        {/* BOTÃO CADASTRAR NOVA TURMA */}
        <div className="mb-8 flex justify-end">
          <CriadorTurma 
            cursosDisponiveis={cursosAtivos || []} 
            ebdSalasConfig={ebdSalasConfig || []} // <-- Injetado aqui
          />
        </div>

        {/* GRID DE TURMAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmas && turmas.length > 0 ? (
            turmas.map((turma) => {
              // Verifica o status para aplicar o visual correto (Ativa vs Inativa)
              const isAtiva = turma.status?.toLowerCase() === 'ativa'
              
              return (
                <div 
                  key={turma.id} 
                  className={`p-6 rounded-xl shadow-sm border transition flex flex-col 
                    ${isAtiva ? 'bg-white border-gray-200 hover:shadow-md' : 'bg-gray-100 border-gray-200 opacity-75'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`font-bold text-xl ${isAtiva ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                      {turma.nome}
                    </h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full 
                      ${isAtiva ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {turma.status || 'Ativa'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-6 flex-1">
                    <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Curso:</span> {turma.curso}</p>
                    <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Modalidade:</span> {turma.modalidade}</p>
                    <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Dia:</span> {turma.dia_semana}</p>
                    <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">Horário:</span> {turma.horario}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4 flex gap-2 items-center">
                    {/* BOTÃO VER ALUNOS (Abre a rota [id] que você criou) */}
                    <Link 
                      href={`/dashboard/admin/turmas/${turma.id}`}
                      className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-bold text-center hover:bg-blue-100 transition border border-blue-100"
                    >
                      Ver Alunos
                    </Link>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full p-12 text-center bg-white rounded-xl border border-gray-200">
              <span className="text-4xl mb-4 block">🏫</span>
              <p className="text-gray-600 font-medium">Nenhuma turma cadastrada no sistema.</p>
              <p className="text-gray-400 text-sm mt-1">Clique no botão para começar a organizar o período letivo.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}