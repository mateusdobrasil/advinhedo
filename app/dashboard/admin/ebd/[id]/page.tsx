export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import CriadorMatricula from '../../../../components/CriadorMatricula'
import MatriculaPorTurma from '../../../../components/MatriculaPorTurma'
import FormChamadaEBD from '../../../../components/FormChamadaEBD'
import BotaoImprimir from '../../../../components/BotaoImprimir'

interface PageProps {
  params: any
  searchParams: any
}

export default async function DetalhesTurmaPage({ params, searchParams }: PageProps) {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verificação de Sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  const { data: perfil } = await supabase.from('perfis').select('tipo_usuario').eq('id', session.user.id).single()
  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || tipo.includes('administrativo') || tipo.includes('professor')
  if (!temAcesso) redirect('/dashboard')

  // 👇 NOVA LÓGICA: Variável que define quem pode matricular alunos
  const podeEditar = tipo.includes('administrador') || tipo.includes('administrativo')

  const resolvedParams = await params
  const id = resolvedParams.id
  
  // 2. Lógica da Data
  const resolvedSearch = await searchParams
  const hoje = new Date()
  const dataLocal = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  
  const dataSelecionada = resolvedSearch?.data || dataLocal
  const dataFormatada = new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR')

  // 3. Busca a Turma e os Alunos
  const { data: turma, error: erroTurma } = await supabase.from('turmas').select('*').eq('id', id).single()
  if (erroTurma || !turma) notFound()

  const { data: dadosMatriculas } = await supabase
    .from('matriculas')
    .select(`id, aluno_id, status, revista_entregue, created_at, perfis ( nome_completo )`)
    .eq('turma_id', id)

  const alunos = dadosMatriculas
    ?.map((mat: any) => ({
      matricula_id: mat.id,
      aluno_id: mat.aluno_id,
      status: mat.status || 'Ativo',
      revista_entregue: mat.revista_entregue || false,
      nome_completo: mat.perfis?.nome_completo || 'Aluno Desconhecido'
    }))
    .sort((a: any, b: any) => a.nome_completo.localeCompare(b.nome_completo)) || []

  // 4. Buscas Auxiliares
  const { data: todasAsTurmas } = await supabase.from('turmas').select('id, nome, curso').eq('status', 'Ativa').order('nome')
  const { data: todosOsAlunos } = await supabase.from('perfis').select('id, nome_completo, cpf').ilike('tipo_usuario', '%aluno%').order('nome_completo')
  const { data: cursosRegras } = await supabase.from('cursos').select('nome, valor_mensalidade')

  // 5. LÓGICA DO RESUMO DIÁRIO
  let frequenciasExistentes: any[] = []
  if (turma.is_ebd) {
    const { data: freqs } = await supabase
      .from('frequencia_ebd')
      .select('*')
      .eq('turma_id', id)
      .eq('data_aula', dataSelecionada)
      
    frequenciasExistentes = freqs || []
  }

  // Cálculos matemáticos corrigidos
  const totalMatriculados = alunos.length
  const totalPresentes = frequenciasExistentes.filter(f => f.presente === true).length
  const totalAusentes = Math.max(0, totalMatriculados - totalPresentes)
  const totalBiblias = frequenciasExistentes.filter(f => f.trouxe_biblia === true).length
  const totalRevistas = frequenciasExistentes.filter(f => f.trouxe_revista === true).length

  let visitantesDia = 0
  let ofertaDia = 0
  frequenciasExistentes.forEach(registro => {
    if (registro.visitantes) visitantesDia += Number(registro.visitantes)
    if (registro.oferta) ofertaDia += Number(registro.oferta)
  })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* CABEÇALHO DA TURMA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${turma.status === 'Ativa' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  {turma.status || 'Ativa'}
                </span>
                {turma.is_ebd && (
                  <span className="text-[10px] uppercase font-bold px-2 py-1 bg-orange-500 text-white rounded-md shadow-sm">
                    Classe EBD
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{turma.nome}</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">{turma.dia_semana} às {turma.horario}</p>
            </div>
            <Link href="/dashboard/admin/ebd" className="w-full sm:w-auto text-center text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg font-bold transition border border-white/10">
              Voltar para Turmas
            </Link>
          </div>
        </div>

        {/* 1. FECHAMENTO DO DIA */}
        {turma.is_ebd && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            
            {/* Cabecalho e Filtros do Fechamento */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-800 flex flex-wrap items-center gap-2">
                  📊 Resumo do Dia <span className="text-xs sm:text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{dataFormatada}</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Visualize o resumo da aula.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <form method="GET" className="flex flex-1 sm:flex-none items-center gap-2">
                  <input type="date" name="data" defaultValue={dataSelecionada} className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-2 w-full" />
                  <button type="submit" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition whitespace-nowrap">
                    Filtrar
                  </button>
                </form>
                <div className="w-full sm:w-auto">
                  <BotaoImprimir />
                </div>
              </div>
            </div>

            {/* Cards do Fechamento (Grid responsiva melhorada) */}
            <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 flex flex-col">
                <span className="text-[9px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">Matriculados</span>
                <span className="text-xl sm:text-[20px] font-black text-gray-800">{totalMatriculados}</span>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 flex flex-col">
                <span className="text-[9px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">Presentes</span>
                <span className="text-xl sm:text-[20px] font-black text-gray-800">{totalPresentes}</span>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 flex flex-col">
                <span className="text-[9px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">Ausentes</span>
                <span className="text-xl sm:text-[20px] font-black text-gray-800">{totalAusentes}</span>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 flex flex-col">
                <span className="text-[9px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">Bíblias</span>
                <span className="text-xl sm:text-[20px] font-black text-gray-800">{totalBiblias}</span>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 flex flex-col">
                <span className="text-[9px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">Revistas</span>
                <span className="text-xl sm:text-[20px] font-black text-gray-800">{totalRevistas}</span>
              </div>
              <div className="bg-orange-50 p-3 sm:p-4 rounded-xl border border-orange-100 flex flex-col">
                <span className="text-[9px] sm:text-[12px] font-bold text-orange-600 uppercase tracking-wider mb-1 truncate">Visitantes</span>
                <span className="text-xl sm:text-[20px] font-black text-orange-700">{visitantesDia}</span>
              </div>
              <div className="col-span-2 lg:col-span-1 bg-green-50 p-3 sm:p-4 rounded-xl border border-green-200 flex flex-col">
                <span className="text-[9px] sm:text-[12px] font-bold text-green-700 uppercase tracking-wider mb-1 truncate">Ofertas</span>
                <span className="text-xl sm:text-[20px] font-black text-green-700">R$ {ofertaDia.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. REALIZAR CHAMADA */}
        <div>
          {turma.is_ebd && alunos.length > 0 && (
            <FormChamadaEBD 
              turmaId={turma.id} 
              alunos={alunos} 
              dataSelecionada={dataSelecionada}
              frequenciasExistentes={frequenciasExistentes}
            />
          )}
        </div>

        {/* 3. MATRÍCULAS E ALUNOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">Manutenção de Alunos ({alunos?.length || 0})</h2>
            
            {/* 👇 Container exibido APENAS para quem tem permissão 👇 */}
            {podeEditar && (
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="w-full sm:w-auto">
                  <MatriculaPorTurma 
                    turmas={todasAsTurmas || []} 
                    turmaDestinoId={turma.id} 
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <CriadorMatricula 
                    alunos={todosOsAlunos || []} 
                    turmas={todasAsTurmas || []} 
                    cursosRegras={cursosRegras || []} 
                    turmaIdPadrao={turma.id} 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Nome do Aluno</th>
                  <th className="px-4 sm:px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-center">Status</th>
                  <th className="px-4 sm:px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos && alunos.length > 0 ? (
                  alunos.map((aluno) => (
                    <tr key={aluno.matricula_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-4 font-bold text-gray-800">{aluno.nome_completo}</td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${aluno.status === 'Ativo' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {aluno.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <Link href={`/dashboard/admin/cadastro/${aluno.aluno_id}`} className="text-[10px] bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-900 hover:text-white transition uppercase">
                          Perfil
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">Nenhum aluno matriculado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}