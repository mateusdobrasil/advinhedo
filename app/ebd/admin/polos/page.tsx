export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ModalPolo from '../../../components/ModalPolo'

export default async function PolosPage() {
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
  const tipo = perfil?.tipo_usuario?.toLowerCase() || ''
  const temAcesso = tipo.includes('administrador')

  if (!temAcesso) {
    redirect('/dashboard/admin') // Se for Administrativo ou Professor, volta para o Hub
  }

  // 4. Busca os polos cadastrados
  const { data: polos } = await supabase.from('polos').select('*').order('nome', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏢 Gestão de Polos</h1>
            <p className="text-gray-500 text-sm mt-1">Administre a Sede e as Congregações.</p>
          </div>
          <Link href="/dashboard/admin" className="text-sm bg-white border px-4 py-2 rounded-lg font-medium shadow-sm">Voltar</Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {polos && polos.length > 0 ? (
            polos.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-xl">🏛️</div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{p.nome}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase">📍 {p.cidade || 'Sem localização'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.tipo === 'Matriz' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.tipo}
                  </span>
                  
                  {/* BOTÃO EDITAR */}
                  <ModalPolo 
                    polo={p} 
                    botaoTexto="Editar" 
                    classeBotao="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition" 
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border-2 border-dashed rounded-2xl p-12 text-center text-gray-400">Nenhum polo cadastrado.</div>
          )}
        </div>

        {/* BOTÃO CADASTRAR NOVO */}
        <div className="mt-8">
          <ModalPolo 
            botaoTexto="+ Cadastrar Nova Unidade / Congregação" 
            classeBotao="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition" 
          />
        </div>

      </div>
    </div>
  )
}