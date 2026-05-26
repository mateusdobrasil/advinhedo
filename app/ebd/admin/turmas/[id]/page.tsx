export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import CriadorMatricula from '../../../../components/CriadorMatricula'
import AdicionarVisitanteEBD from '../../../../components/AdicionarVisitanteEBD'
import FormChamadaEBD from '../../../../components/FormChamadaEBD'

interface PageProps {
  params: any
}

export default async function DetalhesTurmaPage({ params }: PageProps) {
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

  const resolvedParams = await params
  const id = resolvedParams.id

  // 2. Busca os dados da Turma atual (Já traz a coluna is_ebd pelo select '*')
  const { data: turma, error: erroTurma } = await supabase
    .from('turmas')
    .select('*')
    .eq('id', id)
    .single()

  if (erroTurma || !turma) notFound()

  // 3. Busca as Matrículas desta turma
  const { data: dadosMatriculas, error: erroAlunos } = await supabase
    .from('matriculas')
    .select(`
      id,
      aluno_id,
      status,
      revista_entregue,
      created_at,
      perfis ( nome_completo ),
      turmas ( nome, curso )
    `)
    .eq('turma_id', id)

  if (erroAlunos) {
    console.error("❌ ERRO AO BUSCAR MATRÍCULAS:", erroAlunos.message)
  }

  // Formata os alunos matriculados para a tabela de visualização
  const alunos = dadosMatriculas
    ?.map((mat: any) => ({
      matricula_id: mat.id,
      aluno_id: mat.aluno_id,
      status: mat.status || 'Ativo',
      revista_entregue: mat.revista_entregue || false,
      nome_completo: mat.perfis?.nome_completo || 'Aluno Desconhecido',
      email: '—', 
      telefone: '—' 
    }))
    .sort((a: any, b: any) => a.nome_completo.localeCompare(b.nome_completo)) || []

  // Formata os alunos especificamente para o Componente de Chamada
  const alunosParaChamada = alunos.map(a => ({
    id: a.aluno_id,
    nome_completo: a.nome_completo
  }))

  // ==========================================
  // BUSCAS PARA OS MODAIS E FORMULÁRIOS
  // ==========================================

  // 3. Buscas para alimentar o botão "+ Nova Matrícula"
  const { data: todasAsTurmas } = await supabase
    .from('turmas')
    .select('id, nome, curso')
    .eq('status', 'Ativa')
    .order('nome')

  const { data: todosOsAlunos } = await supabase
    .from('perfis')
    .select('id, nome_completo, cpf')
    .ilike('tipo_usuario', '%aluno%') // <--- ALTERADO DE .eq PARA .ilike
    .order('nome_completo')

  const { data: cursosRegras } = await supabase
    .from('cursos')
    .select('nome, valor_mensalidade')

  // Só busca as frequências se for realmente uma turma da EBD, para poupar o banco de dados
  let frequenciasExistentes: any[] = []
  if (turma.is_ebd) {
    const { data: freqs } = await supabase
      .from('frequencia_ebd')
      .select('*')
      .eq('turma_id', id)
    frequenciasExistentes = freqs || []
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CABEÇALHO DA TURMA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${turma.status === 'Ativa' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  {turma.status || 'Ativa'}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-1 bg-white/10 rounded-md text-gray-300">
                  {turma.modalidade}
                </span>
                {/* Etiqueta extra mostrando se é EBD no cabeçalho */}
                {turma.is_ebd && (
                  <span className="text-[10px] uppercase font-bold px-2 py-1 bg-orange-500 text-white rounded-md">
                    Classe EBD
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">{turma.nome}</h1>
              <p className="text-gray-400 text-sm mt-1">
                {turma.curso || 'Sem Curso Associado'} • {turma.dia_semana} às {turma.horario} 
                {turma.faixa_etaria && ` • ${turma.faixa_etaria}`}
              </p>
            </div>
            
            <Link
              href="/dashboard/admin/turmas"
              className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition border border-white/10"
            >
              Voltar para Turmas
            </Link>
          </div>
        </div>

        {/* LISTA DE ALUNOS E AÇÕES DA TURMA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">Alunos Matriculados ({alunos?.length || 0})</h2>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              
              {/* EXIBIÇÃO CONDICIONAL: Somente renderiza esses botões se for EBD */}
              {turma.is_ebd && (
                <>
                  <AdicionarVisitanteEBD turmaId={turma.id} />
                </>
              )}
              
              {/* BOTÃO DE MATRÍCULA PADRÃO (Sempre aparece) */}
              <CriadorMatricula 
                alunos={todosOsAlunos || []} 
                turmas={todasAsTurmas || []} 
                cursosRegras={cursosRegras || []} 
                turmaIdPadrao={turma.id} 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Nome do Aluno</th>
                  {/* Cabeçalho dinâmico */}
                  <th className="px-6 py-3 font-medium text-center">
                    {turma.is_ebd ? 'Status / Material' : 'Status'}
                  </th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos && alunos.length > 0 ? (
                  alunos.map((aluno) => (
                    <tr key={aluno.matricula_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {aluno.nome_completo}
                        {aluno.status === 'Visitante' && (
                          <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase font-bold">
                            Novo
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-center space-y-2">
                        {/* Status Padrão */}
                        <div className="block">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider 
                            ${aluno.status === 'Ativo' ? 'bg-blue-100 text-blue-700' : 
                              aluno.status === 'Visitante' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                            {aluno.status}
                          </span>
                        </div>
                        

                      </td>

                      <td className="px-6 py-4 text-right align-middle">
                        <Link 
                          href={`/dashboard/admin/cadastro/${aluno.aluno_id}`} 
                          className="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition inline-block"
                        >
                          Ver Perfil
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">
                      Nenhum aluno matriculado nesta turma ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>      
      </div>
    </div>
  )
}