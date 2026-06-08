'use client'

import { Suspense } from 'react'
import { ScannerContent } from './_scanner-content'

export default function ScannerPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Carregando scanner...</p>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  )
}
