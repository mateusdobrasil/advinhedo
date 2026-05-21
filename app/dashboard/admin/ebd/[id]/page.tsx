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

  // 5. LÓGICA DO RESUMO DIÁRIO (CORRIGIDA)
  let frequenciasExistentes: any[] = []
  if (turma.is_ebd) {
    const { data: freqs } = await supabase
      .from('frequencia_ebd')
      .select('*')
      .eq('turma_id', id)
      .eq('data_aula', dataSelecionada)
      
    frequenciasExistentes = freqs || []
  }

  // Contadores de Presença e Materiais da Aula
  const totalPresentes = frequenciasExistentes.filter(f => f.presente === true).length
  const totalBiblias = frequenciasExistentes.filter(f => f.trouxe_biblia === true).length
  const totalRevistas = frequenciasExistentes.filter(f => f.trouxe_revista === true).length

  // Somadores (Varre todas as linhas para não perder dados)
  let visitantesDia = 0
  let ofertaDia = 0

  frequenciasExistentes.forEach(registro => {
    if (registro.visitantes) {
      visitantesDia += Number(registro.visitantes)
    }
    if (registro.oferta) {
      ofertaDia += Number(registro.oferta)
    }
  })

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
                {turma.is_ebd && (
                  <span className="text-[10px] uppercase font-bold px-2 py-1 bg-orange-500 text-white rounded-md shadow-sm">
                    Classe EBD
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">{turma.nome}</h1>
              <p className="text-gray-400 text-sm mt-1">{turma.dia_semana} às {turma.horario}</p>
            </div>
            <Link href="/dashboard/admin/ebd" className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-bold transition border border-white/10">
              Voltar para Turmas
            </Link>
          </div>
        </div>

        {/* 1. FECHAMENTO DO DIA */}
        {turma.is_ebd && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  📊 Resumo do Dia <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{dataFormatada}</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">Visualize o resumo da aula.</p>
              </div>
              
              <div className="flex gap-2">
                <form method="GET" className="flex items-center gap-2">
                  <input type="date" name="data" defaultValue={dataSelecionada} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-2" />
                  <button type="submit" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition">
                    Filtrar
                  </button>
                </form>
                <BotaoImprimir />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Alunos Presentes</span>
                <span className="text-2xl font-black text-gray-800">{totalPresentes}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Bíblias (Total)</span>
                <span className="text-2xl font-black text-gray-800">{totalBiblias}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Revistas (Classe)</span>
                <span className="text-2xl font-black text-gray-800">{totalRevistas}</span>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col">
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Visitantes (Total)</span>
                <span className="text-2xl font-black text-orange-700">{visitantesDia}</span>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col">
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Ofertas (Total)</span>
                <span className="text-2xl font-black text-green-700">R$ {ofertaDia.toFixed(2)}</span>
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
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">Manutenção de Alunos ({alunos?.length || 0})</h2>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <MatriculaPorTurma 
                turmas={todasAsTurmas || []} 
                turmaDestinoId={turma.id} 
              />
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
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Nome do Aluno</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-center">Status de Matrícula</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos && alunos.length > 0 ? (
                  alunos.map((aluno) => (
                    <tr key={aluno.matricula_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-800">{aluno.nome_completo}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider ${aluno.status === 'Ativo' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{aluno.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/admin/cadastro/${aluno.aluno_id}`} className="text-[10px] bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold hover:bg-slate-900 hover:text-white transition uppercase">Ver Perfil</Link>
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