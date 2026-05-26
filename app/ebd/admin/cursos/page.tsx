export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import CriadorCurso from '../../../components/CriadorCurso'

export default async function CursosPage() {
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
    redirect('/ebd') // Se não tiver permissão, redireciona para fora do painel
  }

  // 4. BUSCA COM ORDENAÇÃO DUPLA: 'Ativo' vem antes de 'Inativo' no alfabeto
  const { data: cursos } = await supabase
    .from('cursos')
    .select('*')
    .order('status', { ascending: true }) 
    .order('nome', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏛️ Gestão de Cursos</h1>
            <p className="text-gray-500 text-sm">Organize a grade curricular do IBV.</p>
          </div>
          <Link href="/ebd/admin" className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
            Voltar ao Hub
          </Link>
        </div>

        {/* BOTÃO CADASTRAR NOVO CURSO */}
        <div className="mb-8 flex justify-end">
          {/* CORREÇÃO: Chamamos apenas o componente vazio para ele entrar em modo "Criação" */}
          <CriadorCurso />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {cursos?.map((c) => {
            // Verifica de forma segura se o texto é ativo (ignorando maiúsculas/minúsculas)
            const isAtivo = c.status?.toLowerCase() === 'ativo'

            return (
              <div 
                key={c.id} 
                className={`p-5 rounded-xl border flex justify-between items-center transition
                  ${isAtivo ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-75'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg text-xl ${isAtivo ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                    {isAtivo ? '📚' : '💤'}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${isAtivo ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                      {c.nome}
                    </h3>
                    <p className="text-gray-400 text-xs">Duração: {c.duracao} | R$ {c.valor_mensalidade}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase 
                    ${isAtivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.status || 'Indefinido'}
                  </span>
                  
                  {/* Aqui o botão recebe o curso 'c', então ele entende que é modo de Edição. Perfeito! */}
                  <CriadorCurso curso={c} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}