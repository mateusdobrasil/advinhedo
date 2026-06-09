import Link from 'next/link'

export default function MenuHub({ tipoUsuario }: { tipoUsuario: string }) {
  const userRole = tipoUsuario.toLowerCase()

  const todosLinks = [
    { nome: 'Dashboard Geral', link: '/aplicacao/ibv/admin', icon: '📊', admin: true, admini: true, prof: true },
    { nome: 'Salas da EBD', link: '/aplicacao/ibv/admin/ebd', icon: '📖', admin: true, admini: true, prof: true },
    { nome: 'Matrículas', link: '/aplicacao/ibv/admin/matriculas', icon: '📑', admin: true, admini: true, prof: true },
    { nome: 'Financeiro', link: '/aplicacao/ibv/admin/financeiro', icon: '💰', admin: true, admini: true, prof: false },
    { nome: 'Gestão de Polos', link: '/aplicacao/ibv/admin/polos', icon: '📍', admin: true, admini: false, prof: false },
    { nome: 'Auditoria & Permissões', link: '/aplicacao/ibv/admin/auditoria', icon: '🔐', admin: true, admini: false, prof: false },
  ]

  // Função para verificar se o usuário tem permissão para aquele link
  const podeAcessar = (item: any) => {
    if (userRole.includes('administrador')) return item.admin
    if (userRole.includes('administrativo')) return item.admini
    if (userRole.includes('professor')) return item.prof
    return false
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {todosLinks.filter(podeAcessar).map((item) => (
        <Link key={item.link} href={item.link} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <span className="text-3xl">{item.icon}</span>
          <div>
            <h3 className="font-bold text-gray-800">{item.nome}</h3>
          </div>
        </Link>
      ))}
    </div>
  )
}