'use client'

/**
 * /reunioes/admin/obreiros/[id]/foto/page.jsx
 * Tira/atualiza foto do obreiro e salva descritor facial
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

export default function FotoPage() {
  const router = useRouter()
  const { id } = useParams()
  useReuniaoAuth()

  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)

  const [obreiro, setObreiro]     = useState(null)
  const [etapa, setEtapa]         = useState('carregando') // 'carregando' | 'camera' | 'preview' | 'salvando' | 'sucesso' | 'erro'
  const [fotoBlob, setFotoBlob]   = useState(null)
  const [fotoUrl, setFotoUrl]     = useState(null)
  const [modelos, setModelos]     = useState(false)
  const [msg, setMsg]             = useState('')

  // Carrega obreiro e modelos
  useEffect(() => {
    async function init() {
      const { data } = await supabase
        .from('obreiros')
        .select('id, nome, foto_url, face_descriptor, congregacoes(nome)')
        .eq('id', id)
        .single()
      setObreiro(data)

      // Carrega modelos face-api
      const faceapi = await import('@vladmandic/face-api')
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ])
      setModelos(true)
      setEtapa('camera')
      iniciarCamera()
    }
    init().catch(() => {
      setMsg('Erro ao carregar os modelos de reconhecimento facial.')
      setEtapa('erro')
    })

    return () => pararCamera()
  }, [id])

  async function iniciarCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 640 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setMsg('Não foi possível acessar a câmera frontal.')
      setEtapa('erro')
    }
  }

  function pararCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  // Tira a foto
  async function tirarFoto() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      setFotoBlob(blob)
      setFotoUrl(URL.createObjectURL(blob))
      pararCamera()
      setEtapa('preview')
    }, 'image/jpeg', 0.9)
  }

  // Salva a foto e extrai o descritor facial
  async function salvarFoto() {
    if (!fotoBlob || !obreiro) return
    setEtapa('salvando')

    try {
      const faceapi = await import('@vladmandic/face-api')

      // Cria elemento de imagem para análise
      const img = new Image()
      img.src = fotoUrl
      await new Promise(res => { img.onload = res })

      // Detecta rosto e extrai descritor
      const deteccao = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!deteccao) {
        setMsg('Nenhum rosto detectado. Certifique-se de que o rosto está centralizado e bem iluminado.')
        setEtapa('preview')
        return
      }

      // Upload da foto no Storage
      const nomeArquivo = `${obreiro.id}.jpg`
      const { error: uploadErro } = await supabase.storage
        .from('fotos-obreiros')
        .upload(nomeArquivo, fotoBlob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadErro) throw uploadErro

      // URL pública da foto
      const { data: { publicUrl } } = supabase.storage
        .from('fotos-obreiros')
        .getPublicUrl(nomeArquivo)

      // Salva URL e descritor no banco
      const { error: dbErro } = await supabase
        .from('obreiros')
        .update({
          foto_url:        publicUrl,
          face_descriptor: Array.from(deteccao.descriptor), // Float32Array → array normal
        })
        .eq('id', obreiro.id)

      if (dbErro) throw dbErro

      setEtapa('sucesso')

    } catch (err) {
      setMsg(`Erro ao salvar: ${err.message || 'tente novamente.'}`)
      setEtapa('preview')
    }
  }

  function repetirFoto() {
    setFotoBlob(null)
    setFotoUrl(null)
    setEtapa('camera')
    iniciarCamera()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/reunioes/admin/obreiros')}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.headerTitulo}>{obreiro?.nome || 'Carregando...'}</div>
          <div style={s.headerSub}>{obreiro?.congregacoes?.nome || ''}</div>
        </div>
      </div>

      {/* Carregando modelos */}
      {etapa === 'carregando' && (
        <div style={s.centrado}>
          <div style={s.spinner} />
          <p style={s.texto}>Carregando modelos de reconhecimento facial...</p>
          <p style={s.textoSub}>Isso pode levar alguns segundos na primeira vez</p>
        </div>
      )}

      {/* Câmera */}
      {etapa === 'camera' && (
        <div style={s.cameraWrap}>
          <p style={s.instrucao}>Centralize o rosto no círculo e toque em "Tirar foto"</p>

          <div style={s.videoContainer}>
            <video ref={videoRef} style={s.video} playsInline muted />
            <div style={s.guia} />
          </div>

          <button style={s.btnFoto} onClick={tirarFoto}>Tirar foto</button>
        </div>
      )}

      {/* Preview da foto */}
      {etapa === 'preview' && (
        <div style={s.previewWrap}>
          <p style={s.instrucao}>
            {msg || 'Confira a foto. O rosto deve estar bem visível e centralizado.'}
          </p>

          <div style={s.previewImgWrap}>
            <img src={fotoUrl} alt="Preview" style={s.previewImg} />
          </div>

          {msg && <p style={s.avisoErro}>{msg}</p>}

          <div style={s.previewBtns}>
            <button style={s.btnRepetir} onClick={repetirFoto}>Repetir</button>
            <button style={s.btnSalvar} onClick={salvarFoto}>Usar esta foto →</button>
          </div>
        </div>
      )}

      {/* Salvando */}
      {etapa === 'salvando' && (
        <div style={s.centrado}>
          <div style={s.spinner} />
          <p style={s.texto}>Analisando rosto e salvando...</p>
          <p style={s.textoSub}>Extraindo vetor facial — aguarde</p>
        </div>
      )}

      {/* Sucesso */}
      {etapa === 'sucesso' && (
        <div style={s.centrado}>
          <div style={s.sucessoIcone}>✓</div>
          <p style={s.texto}>Foto cadastrada com sucesso!</p>
          <p style={s.textoSub}>{obreiro?.nome} já pode usar o reconhecimento facial no check-in.</p>

          <div style={s.sucessoBtns}>
            <button style={s.btnVoltar} onClick={() => router.push('/reunioes/admin/obreiros')}>
              ← Voltar à lista
            </button>
            <button style={s.btnSalvar} onClick={repetirFoto}>
              Atualizar foto
            </button>
          </div>
        </div>
      )}

      {/* Erro */}
      {etapa === 'erro' && (
        <div style={s.centrado}>
          <div style={s.erroIcone}>✕</div>
          <p style={s.texto}>Erro</p>
          <p style={s.textoSub}>{msg}</p>
          <button style={s.btnVoltar} onClick={() => router.push('/reunioes/admin/obreiros')}>
            ← Voltar à lista
          </button>
        </div>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

const s = {
  container:      { minHeight: '100dvh', background: '#111827', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' },
  header:         { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  voltarBtn:      { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo:   { fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerSub:      { fontSize: 11, color: '#6B7280', marginTop: 2 },
  centrado:       { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 12 },
  spinner:        { width: 36, height: 36, border: '3px solid #374151', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  texto:          { fontSize: 16, fontWeight: 600, color: '#fff', margin: 0, textAlign: 'center' },
  textoSub:       { fontSize: 13, color: '#9CA3AF', margin: 0, textAlign: 'center', lineHeight: 1.6 },
  sucessoIcone:   { width: 72, height: 72, borderRadius: '50%', background: '#065F46', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 },
  erroIcone:      { width: 72, height: 72, borderRadius: '50%', background: '#991B1B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 },
  sucessoBtns:    { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, marginTop: 8 },
  // Câmera
  cameraWrap:     { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px' },
  instrucao:      { fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 },
  videoContainer: { position: 'relative', width: '100%', maxWidth: 340 },
  video:          { width: '100%', borderRadius: 16, display: 'block', background: '#000' },
  guia:           { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', paddingBottom: '70%', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' },
  btnFoto:        { marginTop: 24, padding: '14px 40px', background: '#fff', border: 'none', borderRadius: 50, color: '#111827', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  // Preview
  previewWrap:    { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px' },
  previewImgWrap: { width: '100%', maxWidth: 340, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  previewImg:     { width: '100%', display: 'block' },
  avisoErro:      { fontSize: 13, color: '#FCA5A5', textAlign: 'center', margin: '-10px 0 10px', lineHeight: 1.5 },
  previewBtns:    { display: 'flex', gap: 10, width: '100%', maxWidth: 340 },
  btnRepetir:     { flex: 1, padding: '13px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#9CA3AF', fontSize: 14, cursor: 'pointer' },
  btnSalvar:      { flex: 2, padding: '13px', background: '#fff', border: 'none', borderRadius: 12, color: '#111827', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnVoltar:      { width: '100%', padding: '13px', background: '#1F2937', border: '1px solid #374151', borderRadius: 12, color: '#9CA3AF', fontSize: 14, cursor: 'pointer' },
}