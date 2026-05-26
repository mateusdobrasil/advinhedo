import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FormularioPerfil from '../../components/FormularioPerfil'

export default async function PerfilPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Busca os dados atuais do usuário
  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // 1. LÓGICA DE REDIRECIONAMENTO DINÂMICO
  const tipo = perfil?.tipo_usuario?.toLowerCase() || 'aluno'
  const linkVoltar = tipo.includes('aluno') 
    ? '/dashboard/aluno' 
    : '/dashboard/admin'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Configurações da Conta</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie os seus dados pessoais e segurança.</p>
          </div>
          <Link 
            href={linkVoltar} // 👈 Rota injetada dinamicamente
            className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Voltar
          </Link>
        </div>

        {/* Card de Informações Imutáveis (Email e Cargo) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center justify-between">
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">E-mail de Acesso</p>
                <p className="text-gray-800 font-medium">{session.user.email}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Nível de Acesso</p>
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-bold uppercase">
                    {perfil?.tipo_usuario || 'ALUNO'}
                </span>
            </div>
        </div>

        {/* Formulário Interativo de Atualização */}
        <FormularioPerfil nomeAtual={perfil?.nome_completo || ''} />

      </div>
    </div>
  )
}