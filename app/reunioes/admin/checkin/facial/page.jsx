'use client'

import { Suspense } from 'react'

export default function FacialPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Carregando reconhecimento facial...</p>
      </div>
    }>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Reconhecimento Facial - Em Desenvolvimento</h1>
        <p>Esta funcionalidade está sendo implementada.</p>
      </div>
    </Suspense>
  )
}
