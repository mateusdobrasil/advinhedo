export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Analytics } from "@vercel/analytics/next"

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  // 1. Verifica sessão
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // 2. Busca cargo do perfil logado
  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  const cargos = perfil?.tipo_usuario || ''
  const tipoLower = cargos.toLowerCase()

  // 3. Mapeamento estrito de permissões baseando-se nas strings do banco
  const possuiAdmin = tipoLower.includes('administrador')
  const possuiAdministrativo = tipoLower.includes('administrativo') || tipoLower.includes('secretario') || tipoLower.includes('tesoureiro') || tipoLower.includes('cadastro')
  const possuiProfessor = tipoLower.includes('professor')
  const possuiAluno = tipoLower.includes('aluno') || tipoLower.trim() === '' || (!possuiAdmin && !possuiAdministrativo && !possuiProfessor)

  // Configuração estendida de metadados dos perfis de acesso
  const modulosAcesso = [
    {
      nome: 'Administrador',
      icon: '🔐',
      desc: 'Controle total do polo, logs de auditoria e parametrização de permissões.',
      link: '/aplicacao/ibv/admin',
      visivel: possuiAdmin,
      estiloIcon: 'bg-purple-50 text-purple-600',
      bordaFoco: 'hover:border-purple-300'
    },
    {
      nome: 'Administrativo',
      icon: '💼',
      desc: 'Manutenção central de matrículas, turmas, cursos e controle financeiro.',
      link: '/aplicacao/ibv/admin',
      visivel: possuiAdministrativo,
      estiloIcon: 'bg-blue-50 text-blue-600',
      bordaFoco: 'hover:border-blue-300'
    },
    {
      nome: 'Professor',
      icon: '👨‍🏫',
      desc: 'Lançamento de chamadas diárias, acompanhamento e diário de classe.',
      link: '/aplicacao/ibv/admin',
      visivel: possuiProfessor,
      estiloIcon: 'bg-emerald-50 text-emerald-600',
      bordaFoco: 'hover:border-emerald-300'
    },
    {
      nome: 'Aluno',
      icon: '🎓',
      desc: 'Visualização de notas, histórico de presença e perfil estudantil.',
      link: '/aplicacao/ibv/aluno',
      visivel: possuiAluno,
      estiloIcon: 'bg-indigo-50 text-indigo-600',
      bordaFoco: 'hover:border-indigo-300'
    }
  ]

  const modulosFiltrados = modulosAcesso.filter(modulo => modulo.visivel)

  // Fallback de segurança: Se nenhuma flag for validada, força entrada de Aluno
  if (modulosFiltrados.length === 0) {
    redirect('/aplicacao/ibv/aluno')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 flex flex-col justify-center items-center">
      <Analytics />
      
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Níveis de Acesso — IBV</h1>
          <p className="text-gray-500 mt-2 text-sm">Selecione o perfil com o qual deseja se conectar neste ambiente.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left pt-4">
          {modulosFiltrados.map((modulo) => (
            <Link
              key={modulo.nome}
              href={modulo.link}
              className={`p-6 bg-white rounded-2xl border border-gray-200 transition group flex flex-col items-start hover:shadow-md ${modulo.bordaFoco}`}
            >
              <div className={`text-2xl mb-3 p-3 rounded-xl transition group-hover:scale-110 ${modulo.estiloIcon}`}>
                {modulo.icon}
              </div>
              <h2 className="font-bold text-gray-800 text-lg">{modulo.nome}</h2>
              <p className="text-xs text-gray-400 mt-1 flex-1 leading-relaxed">{modulo.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}