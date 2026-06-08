'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MODELS_URL   = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
const LIMIAR_DIST  = 0.5
const INTERVALO_MS = 1200

function iniciais(nome) {
  return (nome || '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

const COR_CARGO = {
  'Pastor':      { bg: '#FEF3C7', text: '#92400E' },
  'Evangelista': { bg: '#EDE9FE', text: '#5B21B6' },
  'Presbítero':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Diácono':     { bg: '#D1FAE5', text: '#065F46' },
  'Cooperador':  { bg: '#FCE7F3', text: '#9D174D' },
  'Membro':      { bg: '#F3F4F6', text: '#374151' },
}

// ── Componente interno (usa useSearchParams) ──────────────────────────────────
function FacialContent() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const reuniaoId     = searchParams.get('reuniao')
  const reuniaoTitulo = searchParams.get('titulo')
  useReuniaoAuth()

  const videoRef       = useRef(null)
  const canvasRef      = useRef(null)
  const streamRef      = useRef(null)
  const matcherRef     = useRef(null)
  const intervaloRef   = useRef(null)
  const processandoRef = useRef(false)

  const [etapa, setEtapa]         = useState('carregando')
  const [statusMsg, setStatusMsg] = useState('Carregando modelos...')
  const [obreiro, setObreiro]     = useState(null)
  const [confianca, setConfianca] = useState(0)

  useEffect(() => {
    if (!reuniaoId) { router.push('/reunioes/admin/checkin'); return }
    init()
    return () => {
      clearInterval(intervaloRef.current)
      pararCamera()
    }
  }, [reuniaoId])

  async function init() {
    try {
      setStatusMsg('Carregando modelos de IA...')
      const faceapi = await import('@vladmandic/face-api')

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ])

      setStatusMsg('Carregando cadastros faciais...')

      const { data: obreiros } = await supabase
        .from('obreiros')
        .select('id, nome, foto_url, face_descriptor, congregacoes(nome), cargos(nome)')
        .eq('situacao', 'Ativo')
        .not('face_descriptor', 'is', null)

      if (!obreiros?.length) {
        setStatusMsg('Nenhum obreiro com foto cadastrada. Cadastre fotos primeiro.')
        setEtapa('erro')
        return
      }

      const rotulos = obreiros.map(o => {
        const descritor = new Float32Array(o.face_descriptor)
        return new faceapi.LabeledFaceDescriptors(o.id, [descritor])
      })

      const mapaObreiros = {}
      obreiros.forEach(o => { mapaObreiros[o.id] = o })

      matcherRef.current = { matcher: new faceapi.FaceMatcher(rotulos, LIMIAR_DIST), mapaObreiros }

      setStatusMsg('Iniciando câmera...')
      await iniciarCamera()
      setEtapa('scanner')
      setStatusMsg('Aponte a câmera para o rosto do obreiro')
      iniciarReconhecimento(faceapi)

    } catch (err) {
      setStatusMsg(`Erro ao inicializar: ${err.message}`)
      setEtapa('erro')
    }
  }

  async function iniciarCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 }
    })
    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }
  }

  function pararCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function iniciarReconhecimento(faceapi) {
    intervaloRef.current = setInterval(async () => {
      if (processandoRef.current) return
      if (!videoRef.current || !matcherRef.current) return
      if (videoRef.current.readyState < 2) return

      processandoRef.current = true

      try {
        const deteccao = await faceapi
          .detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor()

        if (!deteccao) {
          setStatusMsg('Aponte a câmera para o rosto do obreiro')
          processandoRef.current = false
          return
        }

        const { matcher, mapaObreiros } = matcherRef.current
        const resultado = matcher.findBestMatch(deteccao.descriptor)

        if (resultado.label === 'unknown') {
          setStatusMsg('Rosto não reconhecido — tente se aproximar ou usar mais luz')
          processandoRef.current = false
          return
        }

        clearInterval(intervaloRef.current)
        pararCamera()

        const obreiroEncontrado = mapaObreiros[resultado.label]
        const pctConfianca = Math.round((1 - resultado.distance) * 100)
        setConfianca(Math.min(99, pctConfianca))
        setObreiro(obreiroEncontrado)
        setEtapa('confirmacao')

      } catch {
        // silencia erros de frame individual
      }

      processandoRef.current = false
    }, INTERVALO_MS)
  }

  async function confirmarCheckin() {
    if (!obreiro) return

    const { data: existente } = await supabase
      .from('presencas')
      .select('id')
      .eq('reuniao_id', reuniaoId)
      .eq('obreiro_id', obreiro.id)
      .single()

    if (existente) { setEtapa('jaPresente'); return }

    const { error } = await supabase.from('presencas').insert({
      reuniao_id:     reuniaoId,
      obreiro_id:     obreiro.id,
      presente:       true,
      metodo_checkin: 'facial',
    })

    setEtapa(error ? 'erro' : 'sucesso')
    if (error) setStatusMsg('Erro ao registrar presença.')
  }

  async function naoSouEu() {
    setObreiro(null)
    setEtapa('scanner')
    setStatusMsg('Aponte a câmera novamente')
    processandoRef.current = false
    const faceapi = await import('@vladmandic/face-api')
    await iniciarCamera()
    iniciarReconhecimento(faceapi)
  }

  async function proximo() {
    setObreiro(null)
    setEtapa('scanner')
    setStatusMsg('Aponte a câmera para o próximo obreiro')
    processandoRef.current = false
    const faceapi = await import('@vladmandic/face-api')
    await iniciarCamera()
    iniciarReconhecimento(faceapi)
  }

  const cor = COR_CARGO[obreiro?.cargos?.nome] || COR_CARGO['Membro']

  return (
    <div style={s.container}>

      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/reunioes/admin/checkin')}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.headerTitulo}>Check-in facial</div>
          <div style={s.headerSub}>{reuniaoTitulo || 'Reunião de obreiros'}</div>
        </div>
      </div>

      {etapa === 'carregando' && (
        <div style={s.centrado}>
          <div style={s.spinner} />
          <p style={s.textoClaro}>{statusMsg}</p>
        </div>
      )}

      {etapa === 'scanner' && (
        <div style={s.scannerWrap}>
          <p style={s.instrucao}>{statusMsg}</p>
          <div style={s.videoContainer}>
            <video ref={videoRef} style={s.video} playsInline muted />
            <div style={s.guia} />
            <div style={s.scanLine} />
          </div>
          <p style={s.dica}>O sistema reconhece automaticamente — sem precisar tocar</p>
        </div>
      )}

      {etapa === 'confirmacao' && obreiro && (
        <div style={s.resultadoWrap}>
          <p style={s.resultadoLabel}>Obreiro identificado</p>
          <div style={s.obreiroCard}>
            {obreiro.foto_url ? (
              <img src={obreiro.foto_url} alt={obreiro.nome} style={s.obreiroFoto} />
            ) : (
              <div style={{ ...s.obreiroAvatar, background: cor.bg, color: cor.text }}>
                {iniciais(obreiro.nome)}
              </div>
            )}
            <div>
              <div style={s.obreiroNome}>{obreiro.nome}</div>
              <div style={s.obreiroSub}>
                {obreiro.congregacoes?.nome || '—'}
                {obreiro.cargos?.nome && (
                  <span style={{ ...s.badge, background: cor.bg, color: cor.text }}>
                    {obreiro.cargos.nome}
                  </span>
                )}
              </div>
              <div style={s.confiancaWrap}>
                <div style={s.confiancaBarra}>
                  <div style={{ ...s.confiancaFill, width: `${confianca}%` }} />
                </div>
                <span style={s.confiancaTxt}>{confianca}% de confiança</span>
              </div>
            </div>
          </div>
          <p style={s.pergunta}>É você?</p>
          <div style={s.confirmBtns}>
            <button style={s.btnNaoSouEu} onClick={naoSouEu}>Não sou eu</button>
            <button style={s.btnConfirmar} onClick={confirmarCheckin}>Sim, confirmar ✓</button>
          </div>
        </div>
      )}

      {etapa === 'sucesso' && obreiro && (
        <div style={s.resultadoWrap}>
          <div style={s.sucessoIcone}>✓</div>
          <p style={s.textoClaro}>Presença registrada!</p>
          <div style={s.obreiroCardSimples}>
            <p style={s.obreiroNome}>{obreiro.nome}</p>
            <p style={s.obreiroSub}>{obreiro.congregacoes?.nome}</p>
          </div>
          <button style={s.btnProximo} onClick={proximo}>Próximo obreiro →</button>
        </div>
      )}

      {etapa === 'jaPresente' && obreiro && (
        <div style={s.resultadoWrap}>
          <div style={{ ...s.sucessoIcone, background: '#1E3A5F' }}>!</div>
          <p style={s.textoClaro}>Já registrado</p>
          <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
            {obreiro.nome} já fez check-in nesta reunião.
          </p>
          <button style={s.btnProximo} onClick={proximo}>Próximo obreiro →</button>
        </div>
      )}

      {etapa === 'erro' && (
        <div style={s.centrado}>
          <div style={{ ...s.sucessoIcone, background: '#7F1D1D' }}>✕</div>
          <p style={s.textoClaro}>Erro</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>{statusMsg}</p>
          <button style={s.btnVoltar} onClick={() => router.push('/reunioes/admin/checkin')}>
            ← Voltar ao check-in
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

// ── Export com Suspense boundary (obrigatório no Next.js 14) ──────────────────
export default function FacialPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #374151', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <FacialContent />
    </Suspense>
  )
}

const s = {
  container:          { minHeight: '100dvh', background: '#111827', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' },
  header:             { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  voltarBtn:          { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo:       { fontSize: 14, fontWeight: 600, color: '#fff' },
  headerSub:          { fontSize: 11, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  centrado:           { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 16 },
  spinner:            { width: 36, height: 36, border: '3px solid #374151', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  textoClaro:         { fontSize: 16, fontWeight: 600, color: '#fff', margin: 0, textAlign: 'center' },
  scannerWrap:        { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px' },
  instrucao:          { fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 },
  videoContainer:     { position: 'relative', width: '100%', maxWidth: 360 },
  video:              { width: '100%', borderRadius: 16, display: 'block', background: '#000' },
  guia:               { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '65%', paddingBottom: '65%', borderRadius: '50%', border: '2px solid rgba(52,211,153,0.6)', pointerEvents: 'none' },
  scanLine:           { position: 'absolute', top: '17%', left: '17%', width: '66%', height: 2, background: 'rgba(52,211,153,0.5)', animation: 'scanMove 2s ease-in-out infinite' },
  dica:               { marginTop: 20, fontSize: 12, color: '#4B5563', textAlign: 'center' },
  resultadoWrap:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 16 },
  resultadoLabel:     { fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 },
  obreiroCard:        { background: '#1F2937', border: '1px solid #374151', borderRadius: 16, padding: '16px', width: '100%', maxWidth: 340, display: 'flex', alignItems: 'center', gap: 14 },
  obreiroFoto:        { width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 },
  obreiroAvatar:      { width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  obreiroNome:        { fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  obreiroSub:         { fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6, margin: 0 },
  badge:              { borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 500 },
  confiancaWrap:      { marginTop: 10 },
  confiancaBarra:     { height: 4, background: '#374151', borderRadius: 99, overflow: 'hidden', marginBottom: 4, width: 160 },
  confiancaFill:      { height: '100%', background: '#34D399', borderRadius: 99 },
  confiancaTxt:       { fontSize: 11, color: '#6B7280' },
  pergunta:           { fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 },
  confirmBtns:        { display: 'flex', gap: 10, width: '100%', maxWidth: 340 },
  btnNaoSouEu:        { flex: 1, padding: '13px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#9CA3AF', fontSize: 14, cursor: 'pointer' },
  btnConfirmar:       { flex: 2, padding: '13px', background: '#065F46', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  obreiroCardSimples: { textAlign: 'center' },
  sucessoIcone:       { width: 72, height: 72, borderRadius: '50%', background: '#065F46', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 },
  btnProximo:         { padding: '13px 32px', background: '#fff', border: 'none', borderRadius: 12, color: '#111827', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  btnVoltar:          { padding: '13px 32px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#9CA3AF', fontSize: 14, cursor: 'pointer', marginTop: 8 },
}