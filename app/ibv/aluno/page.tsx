export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Analytics } from "@vercel/analytics/next"
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AlunoDashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  // 1. Busca dados do aluno
  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // 2. Busca matrículas e turmas associadas
  const { data: matriculas } = await supabase
    .from('matriculas')
    .select('*, turmas(id, nome, curso)')
    .eq('aluno_id', session.user.id)

  // 3. Busca Avisos filtrados (Contexto do aluno)
  // Lógica: Avisos Gerais ("Todos") OU Avisos do Polo do aluno OU Avisos das Turmas dele
  const idsTurmasDoAluno = matriculas?.map(m => m.turma_id) || []
  const poloDoAluno = perfil?.polo || 'Todos'

  let queryAvisos = supabase
    .from('avisos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Se o aluno tiver turmas, incluímos filtro por elas
  if (idsTurmasDoAluno.length > 0) {
    queryAvisos = queryAvisos.or(`polo.eq.Todos,polo.eq.${poloDoAluno},turma_id.in.(${idsTurmasDoAluno.join(',')})`)
  } else {
    queryAvisos = queryAvisos.or(`polo.eq.Todos,polo.eq.${poloDoAluno}`)
  }

  const { data: avisos } = await queryAvisos

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center mb-8">

          <div>
          {/* CABEÇALHO */}
            <header>
              <h1 className="text-3xl font-black text-gray-800">
                Olá, {perfil?.nome_completo?.split(' ')[0] || 'Aluno'}! 👋
              </h1>
              <p className="text-gray-500">Bem-vindo ao seu portal de estudos.</p>
            </header>
          </div>
          <Link href="/ibv" className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition">
              Voltar ao Nível de Acesso
          </Link>
        </div>
        <Analytics />
        
        {/* ATALHOS RÁPIDOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/ibv/aluno/notas" className="bg-indigo-600 
              text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 
              hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            <span className="text-2xl mb-2 block">📊</span>
            <span className="font-bold text-sm">Meu Boletim</span>
          </Link>
          <Link href="/ibv/aluno/materiais" className="bg-indigo-600 
              text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 
              hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            <span className="text-2xl mb-2 block">📚</span>
            <span className="font-bold text-sm">Materiais</span>
          </Link>
          <Link href="/ibv/aluno/financeiro" className="bg-indigo-600 
              text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 
              hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            <span className="text-2xl mb-2 block">💰</span>
            <span className="font-bold text-sm">Financeiro</span>
          </Link>
          <Link href="/ibv/aluno/ebd" className="bg-indigo-600 
              text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 
              hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            <span className="text-2xl mb-2 block">📖</span>
            <span className="font-bold text-sm">EBD</span>
          </Link>
        </div>

        {/* AVISOS */}
        {avisos && avisos.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-bold text-gray-800">Avisos para você</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {avisos.map((aviso: any) => (
                <div key={aviso.id} className="bg-white p-4 rounded-2xl border border-gray-100 
                    shadow-sm hover:shadow-md transition">
                  <h3 className="font-bold text-indigo-700">{aviso.titulo}</h3>
                  <p className="text-sm text-gray-600 mt-1">{aviso.conteudo}</p>
                  <p className="text-[10px] text-gray-400 mt-3 uppercase font-bold">
                    Publicado em: {new Date(aviso.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TURMAS ATIVAS */}
        <section>
          <h2 className="font-bold text-gray-800 mb-4">Suas Turmas Ativas</h2>
          {matriculas && matriculas.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {matriculas.map((m: any) => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-100 
                    flex justify-between items-center shadow-sm">
                  <div>
                    <h3 className="font-bold text-gray-800">{m.turmas?.nome}</h3>
                    <p className="text-sm text-gray-500">{m.turmas?.curso}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                    m.status?.toLowerCase() === 'ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {m.status || 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center">
              <p className="text-gray-500">Você ainda não está matriculado em nenhuma turma.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
