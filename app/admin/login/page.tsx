import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const SENHA_ADMIN = process.env.EDIT_PASSWORD || 'advinhedo2026'

export default async function AdminLoginPage({ searchParams }: { searchParams: any }) {
  const resolvedSearch = await searchParams
  const erro = resolvedSearch?.erro === '1'

  // Server Action para validar a senha
  async function validarSenha(formData: FormData) {
    'use server'
    const senhaDigitada = formData.get('senha')

    if (senhaDigitada === SENHA_ADMIN) {
      cookies().set('admin_acesso_site', 'autorizado', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // Dura 7 dias
        path: '/admin',
      })
      redirect('/admin') // Manda para o Hub
    } else {
      redirect('/admin/login?erro=1')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center relative overflow-hidden">
        
        <Link href="/" className="absolute top-4 left-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition">
          ← Voltar
        </Link>

        <div className="text-5xl mb-6 mt-4">🔐</div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Acesso Restrito</h1>
        <p className="text-sm text-slate-500 mb-8">
          Este é o painel de edição do site. Insira a senha administrativa para prosseguir.
        </p>

        <form action={validarSenha} className="space-y-5">
          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-100">
              Senha incorreta. Tente novamente.
            </div>
          )}
          
          <input
            type="password"
            name="senha"
            required
            placeholder="Digite a senha..."
            className="w-full border border-slate-200 p-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-slate-800 outline-none transition bg-slate-50 focus:bg-white text-center text-lg font-medium tracking-widest"
          />
          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition shadow-md"
          >
            Desbloquear Painel
          </button>
        </form>
      </div>
    </div>
  )
}