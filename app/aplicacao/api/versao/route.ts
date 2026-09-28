import { NextResponse } from 'next/server'
import { obterVersaoApp } from '@/lib/versaoApp'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    { versao: obterVersaoApp() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
