export const dynamic = 'force-dynamic'

import { Analytics } from "@vercel/analytics/next"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  // 1. Busca os dados básicos do perfil (capturando o polo_id direto)
  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome_completo, tipo_usuario, polo, polo_id')
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
    redirect('/dashboard/aluno')
  }

  // 2. CORREÇÃO: Busca o nome do polo separadamente para eliminar erros de tipagem do TypeScript
  let nomePolo = perfil?.polo || ''
  
  if (perfil?.polo_id) {
    const { data: poloDados } = await supabase
      .from('polos')
      .select('nome')
      .eq('id', perfil.polo_id)
      .single()
      
    if (poloDados?.nome) {
      nomePolo = poloDados.nome
    }
  }
  
  const isPoloEBD = nomePolo.toUpperCase().includes('EBD')
  
  // 3. Lista dos módulos com a flag "isEBD" nos cards correspondentes
  const modulos = [
    { nome: 'Cadastro Central', icon: '📇', link: '/dashboard/admin/cadastro', desc: 'Gerencie alunos e dados', ativo: true, permissoes: ['Administrador', 'Administrativo'], isEBD: true },
    { nome: 'Alunos', icon: '👥', link: '/dashboard/admin/alunos', desc: 'Gestão de estudantes', ativo: true, permissoes: ['Administrador', 'Administrativo'], isEBD: true },
    { nome: 'Diário de Classe', icon: '✅', link: '/dashboard/admin/diario', desc: 'Notas e presenças', ativo: true, permissoes: ['Administrador', 'Administrativo', 'Professor'] },
    { nome: 'Mural de Avisos', icon: '📢', link: '/dashboard/admin/avisos', desc: 'Publique recados globais', ativo: true, permissoes: ['Administrador', 'Administrativo', 'Professor'] },
    { nome: 'Turmas', icon: '🏫', link: '/dashboard/admin/turmas', desc: 'Organize as salas', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    { nome: 'Matrículas', icon: '📝', link: '/dashboard/admin/matriculas', desc: 'Aprovações e inscrições', ativo: true, permissoes: ['Administrador', 'Administrativo'], isEBD: true },
    { nome: 'Cursos', icon: '🏛️', link: '/dashboard/admin/cursos', desc: 'Grade curricular', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    { nome: 'Matérias', icon: '📚', link: '/dashboard/admin/materias', desc: 'Disciplinas e conteúdos', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    
    // Módulos específicos da EBD
    { nome: 'Salas da EBD', icon: '📖', link: '/dashboard/admin/ebd', desc: 'Gerencie a EBD', ativo: true, permissoes: ['Administrador', 'Administrativo', 'Professor'], isEBD: true },
    { nome: 'Relatórios da EBD', icon: '📈', link: '/dashboard/admin/relatoriosEBD', desc: 'Gerencie a EBD', ativo: true, permissoes: ['Administrador', 'Administrativo'], isEBD: true },
    
    { nome: 'Relatórios', icon: '📊', link: '/dashboard/admin/relatorios', desc: 'Métricas e gráficos', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    { nome: 'Financeiro', icon: '💰', link: '/dashboard/admin/financeiro', desc: 'Caixa e mensalidades', ativo: true, permissoes: ['Administrador', 'Administrativo'] },
    { nome: 'Polos', icon: '🏢', link: '/dashboard/admin/polos', desc: 'Sedes e Congregações', ativo: true, permissoes: ['Administrador'] },
    { nome: 'Permissões', icon: '🔐', link: '/dashboard/admin/permissoes', desc: 'Cargos e acessos', ativo: true, permissoes: ['Administrador'] },
    { nome: 'Auditoria', icon: '👁️', link: '/dashboard/admin/auditoria', desc: 'Logs e rastreamento', ativo: true, permissoes: ['Administrador'] },
    { nome: 'Diplomas', icon: '🎓', link: '/dashboard/admin/diplomas', desc: 'Emissão de certificados', ativo: false, permissoes: ['Administrador', 'Administrativo', 'Professor'], isEBD: true },
  ]

  // FILTRO DUPLO: Permissão de Cargo + Verificação do Polo
  const modulosFiltrados = modulos.filter(m => {
    // 1. Verifica se tem permissão de cargo
    const temPermissaoCargo = m.permissoes.some(p => tipoUsuario.toLowerCase().includes(p.toLowerCase()))
    if (!temPermissaoCargo) return false

    // 2. Se o usuário for exclusivamente do polo EBD, ele só vê os cards com a flag isEBD
    if (isPoloEBD) {
      return m.isEBD === true
    }

    // Se for de outro polo (ex: IBV, Sede, etc), vê tudo que o cargo permite
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Painel de Gestão IBV</h1>
          <p className="text-gray-500 mt-1">Selecione o módulo administrativo que deseja acessar.</p>
        </div>

        <Analytics />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {modulosFiltrados.map((modulo) => (
            <Link 
              key={modulo.nome}
              href={modulo.ativo ? modulo.link : '#'}
              className={`p-6 rounded-2xl border transition group flex flex-col items-start ${
                modulo.ativo 
                  ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer' 
                  : 'bg-gray-100 border-gray-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`text-3xl mb-3 p-3 rounded-xl ${modulo.ativo ? 'bg-blue-50 group-hover:scale-110 transition' : 'bg-gray-200'}`}>
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
