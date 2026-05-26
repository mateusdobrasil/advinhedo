export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'

export default async function PerfilAlunoAdminPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verificação de Sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // 2. Busca perfil logado para validar acesso
  const { data: perfilLogado } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  // 3. TRAVA DE SEGURANÇA: Bloqueia Aluno
  const tipo = perfilLogado?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || 
                    tipo.includes('administrativo') || 
                    tipo.includes('professor')

  if (!temAcesso) {
    redirect('/dashboard/aluno') // Impede que o aluno veja o perfil dos outros
  }

  const { id } = params

  // 4. Busca os dados do aluno alvo
  const { data: aluno } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', id)
    .single()

  if (!aluno) {
    notFound()
  }

  // 5. Busca as matrículas dele (com nome da turma)
  const { data: matriculas } = await supabase
    .from('matriculas')
    .select(`*, turmas ( nome, curso )`)
    .eq('aluno_id', id)

  // 6. Busca o histórico de notas e faltas
  const { data: boletim } = await supabase
    .from('diario_classe')
    .select(`*, materias ( nome ), turmas ( nome )`)
    .eq('aluno_id', id)
    .order('created_at', { ascending: false })

  // 7. Busca o financeiro
  const { data: financeiro } = await supabase
    .from('financeiro')
    .select('*')
    .eq('aluno_id', id)
    .order('data_vencimento', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* CABEÇALHO E BOTÃO VOLTAR */}
        <div className="flex justify-between items-start mb-8">
          <Link href="/dashboard/admin/alunos" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-2 transition">
            ← Voltar para a lista
          </Link>
          <div className="text-right">
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-full uppercase">Perfil do Aluno</span>
          </div>
        </div>

        {/* CARTÃO DE IDENTIFICAÇÃO */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-inner">
            {aluno.nome_completo?.charAt(0) || '?'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-800">{aluno.nome_completo}</h1>
            <p className="text-gray-500">{aluno.email}</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              {aluno.polo?.split(',').map((p: string) => (
                <span key={p} className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-md">{p}</span>
              ))}
              <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-md">CPF: {aluno.cpf || 'Não informado'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA DA ESQUERDA: Matrículas e Notas */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SEÇÃO MATRÍCULAS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">🏫 Matrículas Ativas</h3>
              </div>
              <div className="p-5">
                {matriculas && matriculas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matriculas.map((m: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg border border-gray-100 bg-slate-50">
                        <p className="text-xs text-indigo-600 font-bold uppercase">{m.turmas?.curso}</p>
                        <h4 className="font-bold text-gray-800">{m.turmas?.nome}</h4>
                        <span className="text-[10px] mt-2 inline-block bg-white px-2 py-1 rounded border font-medium text-gray-500">Status: {m.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">Nenhuma matrícula encontrada.</p>
                )}
              </div>
            </div>

            {/* SEÇÃO BOLETIM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">✅ Histórico Acadêmico</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Turma / Matéria</th>
                    <th className="px-6 py-3 text-center">Faltas</th>
                    <th className="px-6 py-3 text-center">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {boletim && boletim.length > 0 ? (
                    boletim.map((b: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4">
                          <span className="block font-bold text-gray-800">{b.materias?.nome}</span>
                          <span className="text-xs text-gray-400">{b.turmas?.nome}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-red-500">{b.faltas}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black text-lg ${b.nota >= 7 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {b.nota.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">Nenhum registro acadêmico.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUNA DA DIREITA: Financeiro */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">💰 Situação Financeira</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {financeiro && financeiro.length > 0 ? (
                  financeiro.map((f: any) => (
                    <div key={f.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{f.descricao}</p>
                        <p className="text-[10px] text-gray-400 uppercase">Venc: {new Date(f.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">R$ {f.valor.toFixed(2)}</p>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${f.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 italic text-sm">Sem faturas registradas.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}