export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import EditorUsuario from '../../../../components/EditorUsuario'
import EditorCadastroCompleto from '../../../../components/EditorCadastroCompleto'

interface PageProps {
  params: any
}

export default async function DetalhesCadastroPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies })

  // 1. Segurança: Verifica se está logado
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // Busca perfil logado
  const { data: adminPerfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  // 2. TRAVA DE SEGURANÇA: Bloqueia Alunos
  // Apenas Administrador, Administrativo e Professor podem ver detalhes de cadastros
  const tipo = adminPerfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador') || 
                    tipo.includes('administrativo') || 
                    tipo.includes('professor')

  if (!temAcesso) {
    redirect('/aplicacao/ibuc/aluno') // Aluno não entra aqui de jeito nenhum
  }

  const resolvedParams = await params
  const id = resolvedParams.id

  // 3. Busca o perfil alvo
  const { data: perfil, error } = await supabase.from('perfis').select('*').eq('id', id).single()
  if (error || !perfil) notFound()

  // 4. Busca a lista de Polos para passar para o Editor
  const { data: polos } = await supabase.from('polos').select('id, nome, cidade, tipo').order('nome')

  // 👇 IDENTIFICADOR DE POLO 👇
  // Relaciona o polo_id do usuário com o nome do polo no banco.
  // Mantém a compatibilidade com cadastros antigos usando "perfil.polo" como backup.
  const poloVinculado = polos?.find(p => p.id === perfil.polo_id)
  const nomeExibicaoPolo = poloVinculado ? poloVinculado.nome : (perfil.polo || 'Sem polo definido')

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* CABEÇALHO COM O BOTÃO DE EDIÇÃO */}
        <div className="bg-slate-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
              {perfil.tipo_usuario || 'Aluno'}
            </span>
            <h1 className="text-2xl font-bold mt-3 text-white">{perfil.nome_completo}</h1>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <EditorUsuario usuario={perfil} polos={polos || []} />
            <EditorCadastroCompleto usuario={perfil} polos={polos || []} />
            
            <Link
              href="/aplicacao/ibuc/admin/cadastro"
              className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition border border-white/10 text-center"
            >
              Voltar
            </Link>
          </div>
        </div>

        {/* DETALHES DO CADASTRO */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Nome Completo</label>
              <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{perfil.nome_completo}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">E-mail Institucional</label>
              <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{perfil.email || 'Não informado'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Telefone / WhatsApp</label>
              <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{perfil.telefone || 'Não informado'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Polo Vinculado</label>
              <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                {nomeExibicaoPolo}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">ID do Usuário (UUID)</label>
              <p className="text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 text-[10px] break-all">{perfil.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}