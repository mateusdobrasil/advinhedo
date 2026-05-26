import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 1. Apenas atualiza a sessão
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()
  const path = url.pathname

  // 2. PROTEÇÃO BÁSICA: Se não estiver logado e tentar entrar no dashboard, vai para a Home (/)
  if (!session && path.startsWith('/ibv')) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 3. Se já estiver logado e tentar ir para a Home (/), manda para o distribuidor
  if (session && path === '/') {
    url.pathname = '/ibv'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}