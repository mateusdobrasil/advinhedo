'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function BotaoSair() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button 
      onClick={handleLogout} 
      className="text-sm text-red-600 hover:text-red-800 transition font-medium"
    >
      Sair
    </button>
  )
}