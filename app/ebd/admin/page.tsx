export const dynamic = 'force-dynamic'

import { Analytics } from "@vercel/analytics/next"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminEBDPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // 1. Busca APENAS o tipo de usuário (não precisamos mais buscar o polo aqui)
  const { data: perfil } = await supabase
    .from('perfis')
    .select('tipo_usuario')
    .eq('id', session.user.id)
    .single()

  // Captura o cargo do banco
  const tipoUsuario = perfil?.tipo_usuario || ''
  
  // Lista de permissões aceitas para entrar no Hub
  const cargosAdmin = ['administrador', 'administrativo', 'professor']
  const temAcessoAdmin = cargosAdmin.some(cargo => 
    tipoUsuario.toLowerCase().includes(cargo.toLowerCase())
  )

  if (!temAcessoAdmin) {
    redirect('/ebd/aluno') // Redireciona para a área de aluno exclusiva da EBD
  }

  // 2. Lista ENXUTA: Contém apenas os módulos pertencentes à EBD com os links corretos
  const modulos = [
    { nome: 'Cadastro Central', icon: '📇', link: '/ebd/admin/cadastro', desc: 'Gerencie alunos e dados', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    { nome: 'Alunos', icon: '👥', link: '/ebd/admin/alunos', desc: 'Gestão de estudantes', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    { nome: 'Matrículas', icon: '📝', link: '/ebd/admin/matriculas', desc: 'Aprovações e inscrições', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    { nome: 'Salas da EBD', icon: '📖', link: '/ebd/admin/ebd', desc: 'Gerencie a EBD', ativo: true, permissoes: ['Administrador', 'Administrativo', 'Professor'] },
    { nome: 'Relatórios da EBD', icon: '📈', link: '/ebd/admin/relatoriosEBD', desc: 'Métricas e frequências', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    { nome: 'Diplomas', icon: '🎓', link: '/ebd/admin/diplomas', desc: 'Emissão de certificados', ativo: false, permissoes: ['Administrador', 'Administrativo', 'Professor'] },
    { nome: 'Polos', icon: '🏢', link: '/ebd/admin/polos', desc: 'Sedes e Congregações', ativo: true, permissoes: ['Administrador'] },
    { nome: 'Permissões', icon: '🔐', link: '/ebd/admin/permissoes', desc: 'Cargos e acessos', ativo: true, permissoes: ['Administrador'] },
    { nome: 'Auditoria', icon: '👁️', link: '/ebd/admin/auditoria', desc: 'Logs e rastreamento', ativo: true, permissoes: ['Administrador'] },
    
  ]

  // FILTRO ÚNICO: Apenas Permissão de Cargo (O escopo EBD já está garantido pela pasta)
  const modulosFiltrados = modulos.filter(m => 
    m.permissoes.some(p => tipoUsuario.toLowerCase().includes(p.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Painel de Gestão EBD</h1>
            <p className="text-gray-500 mt-1">Selecione o módulo administrativo que deseja acessar.</p>
        </div>
        <Link href="/ebd" className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition">
            Voltar ao Nível de Acesso
        </Link>
      </div>
        <Analytics />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {modulosFiltrados.map((modulo) => (
            <Link 
              key={modulo.nome}
              href={modulo.ativo ? modulo.link : '#'}
              className={`p-6 rounded-2xl border transition group flex flex-col items-start ${
                modulo.ativo 
                  ? 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-md cursor-pointer' 
                  : 'bg-gray-100 border-gray-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`text-3xl mb-3 p-3 rounded-xl ${modulo.ativo ? 'bg-orange-50 group-hover:scale-110 transition' : 'bg-gray-200'}`}>
                {modulo.icon}
              </div>
              <h2 className="font-bold text-gray-800 text-lg">{modulo.nome}</h2>
              <p className="text-xs text-gray-500 mt-1">{modulo.desc}</p>
              
              {!modulo.ativo && (
                <span className="mt-4 text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500 px-2 py-1 rounded">
                  Em Breve
                </span>
              )}
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}