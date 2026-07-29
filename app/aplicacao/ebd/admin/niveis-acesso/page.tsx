export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ModalNivelAcesso from '../../../components/ModalNivelAcesso'
import BotaoExcluirNivelAcesso from '../../../components/BotaoExcluirNivelAcesso'
import PaginasDoCargo from '../../../components/PaginasDoCargo'
import { usuarioTemAcessoPagina, ehAdministrador, PAGINAS_EBD } from '@/lib/permissoes'

export default async function NiveisAcessoPage() {
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

  // 3. TRAVA DE SEGURANÇA MÁXIMA: Apenas Administrador tem acesso.
  const temAcesso = await usuarioTemAcessoPagina(supabase, perfil?.tipo_usuario, 'ebd', 'niveis-acesso')

  if (!temAcesso) {
    redirect('/aplicacao/ebd/admin') // Se for Administrativo ou Professor, volta para o Hub
  }

  // 4. Busca os níveis de acesso cadastrados e as páginas já liberadas por cargo
  const { data: niveis } = await supabase.from('niveis_acesso').select('*').order('nome', { ascending: true })
  const { data: permissoesPaginas } = await supabase
    .from('permissoes_paginas')
    .select('nivel_acesso, pagina_chave')
    .eq('modulo', 'ebd')

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🔑 Níveis de Acesso</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie os cargos disponíveis para atribuir aos usuários.</p>
          </div>
          <Link href="/aplicacao/ebd/admin" className="text-sm bg-white border px-4 py-2 rounded-lg font-medium shadow-sm">Voltar</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {niveis && niveis.length > 0 ? (
            niveis.map((n) => {
              const paginasDoCargo = (permissoesPaginas || [])
                .filter((p) => p.nivel_acesso === n.nome)
                .map((p) => p.pagina_chave)

              return (
                <div key={n.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg text-xl">🔑</div>
                    <h3 className="font-bold text-gray-800 text-lg">{n.nome}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {ehAdministrador(n.nome) ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg font-bold uppercase tracking-wider">
                        Acesso total (fixo)
                      </span>
                    ) : (
                      <PaginasDoCargo
                        modulo="ebd"
                        nivelAcesso={n.nome}
                        paginasDisponiveis={PAGINAS_EBD}
                        paginasAtuais={paginasDoCargo}
                      />
                    )}
                    <BotaoExcluirNivelAcesso id={n.id} nome={n.nome} />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white border-2 border-dashed rounded-2xl p-12 text-center text-gray-400">Nenhum nível de acesso cadastrado.</div>
          )}
        </div>

        <ModalNivelAcesso />

      </div>
    </div>
  )
}
