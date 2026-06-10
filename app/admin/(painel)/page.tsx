import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function AdminHubPage() {
  
  // Ação de Servidor para sair (Logout) e destruir o cookie
  async function fazerLogout() {
    'use server'
    cookies().delete('admin_acesso_site')
    redirect('/admin/login')
  }

  return (
    <div className="p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* CABEÇALHO DO PAINEL */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Sessão Ativa
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">Painel do Site</h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">
              Selecione qual área do site institucional você deseja atualizar hoje.
            </p>
          </div>
          
          <form action={fazerLogout}>
            <button type="submit" className="text-sm font-bold text-slate-500 hover:text-red-600 transition flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm hover:border-red-200 hover:bg-red-50">
              <span>Sair do Painel</span>
            </button>
          </form>
        </div>

        {/* CARDS DE NAVEGAÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* CARD 1: PÁGINA INICIAL */}
          <Link
            href="/admin/site"
            className="group bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col items-start gap-6"
          >
            <div className="bg-blue-50 text-blue-600 text-4xl w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              🏠
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition">Editar Página Inicial</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Acesse o editor completo para alterar os textos de apresentação, a história da igreja e configurar as imagens de destaque.
              </p>
            </div>
          </Link>

          {/* CARD 2: AGENDA */}
          <Link
            href="/admin/agenda"
            className="group bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all flex flex-col items-start gap-6"
          >
            <div className="bg-amber-50 text-amber-600 text-4xl w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              📅
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition">Editar Agenda e Cultos</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Gerencie os dias e horários de cultos regulares, adicione reuniões semanais e cadastre eventos especiais como Santa Ceia e festividades.
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  )
}