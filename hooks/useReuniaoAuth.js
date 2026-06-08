/**
 * hooks/useReuniaoAuth.js
 * Redireciona para /reunioes se não autenticado
 * Use em todas as páginas de /reunioes/admin/*
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useReuniaoAuth() {
  const router = useRouter()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('reunioes_auth')
      if (auth !== 'true') router.replace('/reunioes')
    }
  }, [router])
}