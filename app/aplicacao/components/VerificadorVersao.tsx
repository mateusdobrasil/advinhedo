'use client'

import { useEffect, useState } from 'react'

const INTERVALO_VERIFICACAO_MS = 5 * 60 * 1000 // 5 minutos

export default function VerificadorVersao({ versaoAtual }: { versaoAtual: string }) {
  const [atualizacaoDisponivel, setAtualizacaoDisponivel] = useState(false)

  useEffect(() => {
    let cancelado = false

    const verificarVersao = async () => {
      try {
        const resposta = await fetch('/aplicacao/api/versao', { cache: 'no-store' })
        if (!resposta.ok) return
        const { versao } = await resposta.json()
        if (!cancelado && versao && versao !== versaoAtual) {
          setAtualizacaoDisponivel(true)
        }
      } catch {
        // Falha de rede é ignorada — tenta de novo no próximo ciclo
      }
    }

    const intervalo = setInterval(verificarVersao, INTERVALO_VERIFICACAO_MS)
    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [versaoAtual])

  if (!atualizacaoDisponivel) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] flex justify-center px-4 pb-4 sm:pb-6 pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 px-5 py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-md w-full">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xl" aria-hidden="true">🔄</span>
          <div className="text-sm">
            <p className="font-bold leading-tight">Nova versão disponível</p>
            <p className="text-gray-400 text-xs mt-0.5">Atualize a página para usar a versão mais recente.</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-bold px-4 py-2 rounded-lg whitespace-nowrap w-full sm:w-auto"
        >
          Atualizar agora
        </button>
      </div>
    </div>
  )
}
