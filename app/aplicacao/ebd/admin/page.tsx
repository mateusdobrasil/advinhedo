export const dynamic = 'force-dynamic'

import { Analytics } from "@vercel/analytics/next"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { paginasPermitidas, ehAdministrador } from '@/lib/permissoes'

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

  // Só entra no Hub quem é Administrador (bypass fixo) ou tem pelo menos uma
  // página liberada em Admin > Níveis de Acesso — vale para qualquer cargo,
  // inclusive customizados (ex: "Secretário de Sala").
  const souAdministrador = ehAdministrador(tipoUsuario)
  const chavesPermitidas = souAdministrador ? null : await paginasPermitidas(supabase, tipoUsuario, 'ebd')
  const temAcessoAdmin = souAdministrador || (chavesPermitidas !== null && chavesPermitidas.size > 0)

  if (!temAcessoAdmin) {
    redirect('/aplicacao/ebd/aluno') // Redireciona para a área de aluno exclusiva da EBD
  }

  // 2. Lista ENXUTA: Contém apenas os módulos pertencentes à EBD com os links corretos
  const modulos = [
    { nome: 'Cadastro Central', icon: '📇', link: '/aplicacao/ebd/admin/cadastro', desc: 'Gerencie alunos e dados', ativo: true, chave: 'cadastro' },
    { nome: 'Alunos', icon: '👥', link: '/aplicacao/ebd/admin/alunos', desc: 'Gestão de estudantes', ativo: true, chave: 'alunos' },
    { nome: 'Matrículas', icon: '📝', link: '/aplicacao/ebd/admin/matriculas', desc: 'Aprovações e inscrições', ativo: true, chave: 'matriculas' },
    { nome: 'Turmas', icon: '🧑‍🏫', link: '/aplicacao/ebd/admin/turmas', desc: 'Turmas fora da EBD', ativo: true, chave: 'turmas' },
    { nome: 'Cursos', icon: '📚', link: '/aplicacao/ebd/admin/cursos', desc: 'Cursos disponíveis', ativo: true, chave: 'cursos' },
    { nome: 'Salas da EBD', icon: '📖', link: '/aplicacao/ebd/admin/ebd', desc: 'Gerencie a EBD', ativo: true, chave: 'ebd' },
    { nome: 'Relatórios da EBD', icon: '📈', link: '/aplicacao/ebd/admin/relatoriosEBD', desc: 'Métricas e frequências', ativo: true, chave: 'relatoriosEBD' },
    { nome: 'Relatórios', icon: '📊', link: '/aplicacao/ebd/admin/relatorios', desc: 'Visão geral do instituto', ativo: true, chave: 'relatorios' },
    { nome: 'Financeiro', icon: '💰', link: '/aplicacao/ebd/admin/financeiro', desc: 'Mensalidades e cobranças', ativo: true, chave: 'financeiro' },
    { nome: 'Materiais', icon: '🗂️', link: '/aplicacao/ebd/admin/materiais', desc: 'Materiais de estudo', ativo: true, chave: 'materiais' },
    { nome: 'Avisos', icon: '📣', link: '/aplicacao/ebd/admin/avisos', desc: 'Comunicados e avisos', ativo: true, chave: 'avisos' },
    { nome: 'Polos', icon: '🏢', link: '/aplicacao/ebd/admin/polos', desc: 'Sedes e Congregações', ativo: true, chave: 'polos' },
    { nome: 'Permissões', icon: '🔐', link: '/aplicacao/ebd/admin/permissoes', desc: 'Cargos e acessos', ativo: true, chave: 'permissoes' },
    { nome: 'Níveis de Acesso', icon: '🔑', link: '/aplicacao/ebd/admin/niveis-acesso', desc: 'Cargos disponíveis no sistema', ativo: true, chave: 'niveis-acesso' },
    { nome: 'Auditoria', icon: '👁️', link: '/aplicacao/ebd/admin/auditoria', desc: 'Logs e rastreamento', ativo: true, chave: 'auditoria' },
    { nome: 'Diplomas', icon: '🎓', link: '/aplicacao/ebd/admin/diplomas', desc: 'Emissão de certificados', ativo: false, chave: 'diplomas' },

  ]

  // FILTRO ÚNICO: cada cargo só vê os cards das páginas liberadas em Admin > Níveis de Acesso
  // (Administrador sempre vê tudo — bypass fixo). Reaproveita chavesPermitidas calculado acima.
  const modulosFiltrados = modulos.filter(m => chavesPermitidas === null || chavesPermitidas.has(m.chave))

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Painel de Gestão EBD</h1>
            <p className="text-gray-500 mt-1">Selecione o módulo administrativo que deseja acessar.</p>
        </div>
        <Link href="/aplicacao/ebd" className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition">
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