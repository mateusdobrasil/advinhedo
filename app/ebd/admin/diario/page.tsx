export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import CriadorDiario from '../../../components/CriadorDiario'

export default async function DiarioPage() {
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
    redirect('/dashboard') // Se for aluno, redireciona para a área dele
  }

  // 4. Busca os dados para alimentar as caixas de seleção do modal
  const { data: alunos } = await supabase.from('perfis').select('id, nome_completo').ilike('tipo_usuario', '%aluno%').order('nome_completo')
  const { data: turmas } = await supabase.from('turmas').select('id, nome').eq('is_ebd', false).order('nome')
  const { data: materias } = await supabase.from('materias').select('id, nome').eq('status', 'Ativa').order('nome')

  // 5. Busca os registros do diário trazendo os nomes usando Join
  const { data: diarios } = await supabase
    .from('diario_classe')
    .select(`
      *,
      perfis ( nome_completo ),
      turmas ( nome ),
      materias ( nome )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">✅ Diário de Classe</h1>
            <p className="text-gray-500 text-sm mt-1">Controle de notas, faltas e desempenho dos alunos.</p>
          </div>
          <Link href="/dashboard/admin" className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
            Voltar ao Hub
          </Link>
        </div>

        <div className="mb-8 flex justify-end">
          <CriadorDiario alunos={alunos || []} turmas={turmas || []} materias={materias || []} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Aluno</th>
                  <th className="px-6 py-3 font-medium">Turma / Matéria</th>
                  <th className="px-6 py-3 font-medium text-center">Faltas</th>
                  <th className="px-6 py-3 font-medium text-center">Nota</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {diarios && diarios.length > 0 ? (
                  diarios.map((reg) => {
                    const dataLancamento = new Date(reg.created_at).toLocaleDateString('pt-BR')
                    const aprovado = reg.nota >= 7 // Regra de aprovação (nota 7)

                    return (
                      <tr key={reg.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-400">{dataLancamento}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {(reg.perfis as any)?.nome_completo || 'Aluno Indefinido'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <span className="font-bold">{(reg.turmas as any)?.nome}</span><br/>
                          <span className="text-xs text-indigo-600">{(reg.materias as any)?.nome}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-red-500">
                          {reg.faltas}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black text-lg ${aprovado ? 'text-emerald-600' : 'text-red-600'}`}>
                            {reg.nota.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${aprovado ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {aprovado ? 'Aprovado' : 'Recuperação'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum registro de aula lançado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}