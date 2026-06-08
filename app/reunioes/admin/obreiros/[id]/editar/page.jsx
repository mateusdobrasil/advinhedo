'use client'

/**
 * /reunioes/admin/obreiros/[id]/editar/page.jsx
 * Edição dos campos essenciais do obreiro
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Formata CPF enquanto digita: 000.000.000-00
function mascaraCPF(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// Converte YYYY-MM-DD → DD/MM/YYYY para exibição
function isoParaBR(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

// Converte DD/MM/YYYY → YYYY-MM-DD para salvar
function brParaISO(br) {
  if (!br || br.length < 10) return null
  const [d, m, a] = br.split('/')
  if (!d || !m || !a) return null
  return `${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

// Formata data enquanto digita: DD/MM/YYYY
function mascaraData(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
}

export default function EditarObreiroPage() {
  const router = useRouter()
  const { id } = useParams()
  useReuniaoAuth()

  const [loading, setLoading]     = useState(true)
  const [salvando, setSalvando]   = useState(false)
  const [toast, setToast]         = useState(null)
  const [congregacoes, setCongregacoes] = useState([])
  const [cargos, setCargos]       = useState([])
  const [funcoes, setFuncoes]     = useState([])

  const [form, setForm] = useState({
    nome:           '',
    congregacao_id: '',
    cargo_id:       '',
    funcao_id:      '',
    cpf:            '',
    data_nascimento: '',
    telefone:       '',
    email:          '',
    situacao:       'Ativo',
  })

  const [erros, setErros] = useState({})

  // Carrega tudo em paralelo
  useEffect(() => {
    async function carregar() {
      const [
        { data: obreiro },
        { data: congsData },
        { data: cargosData },
        { data: funcoesData },
      ] = await Promise.all([
        supabase.from('obreiros').select('*').eq('id', id).single(),
        supabase.from('congregacoes').select('id, nome').order('nome'),
        supabase.from('cargos').select('id, nome, nivel').order('nivel', { ascending: false }),
        supabase.from('funcoes').select('id, nome').order('nome'),
      ])

      if (obreiro) {
        setForm({
          nome:            obreiro.nome || '',
          congregacao_id:  obreiro.congregacao_id || '',
          cargo_id:        obreiro.cargo_id || '',
          funcao_id:       obreiro.funcao_id || '',
          cpf:             obreiro.cpf || '',
          data_nascimento: obreiro.data_nascimento ? isoParaBR(obreiro.data_nascimento) : '',
          telefone:        obreiro.telefone || '',
          email:           obreiro.email || '',
          situacao:        obreiro.situacao || 'Ativo',
        })
      }

      setCongregacoes(congsData || [])
      setCargos(cargosData || [])
      setFuncoes(funcoesData || [])
      setLoading(false)
    }
    carregar()
  }, [id])

  function atualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: null }))
  }

  function validar() {
    const novosErros = {}
    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório'
    if (!form.congregacao_id) novosErros.congregacao_id = 'Congregação é obrigatória'
    if (!form.cargo_id) novosErros.cargo_id = 'Cargo é obrigatório'
    if (form.cpf && form.cpf.replace(/\D/g, '').length !== 11)
      novosErros.cpf = 'CPF incompleto (11 dígitos)'
    if (form.data_nascimento && form.data_nascimento.length < 10)
      novosErros.data_nascimento = 'Data incompleta (DD/MM/AAAA)'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar() {
    if (!validar()) return
    setSalvando(true)

    const payload = {
      nome:            form.nome.trim(),
      congregacao_id:  form.congregacao_id || null,
      cargo_id:        form.cargo_id       || null,
      funcao_id:       form.funcao_id      || null,
      cpf:             form.cpf            || null,
      data_nascimento: brParaISO(form.data_nascimento),
      telefone:        form.telefone       || null,
      email:           form.email?.toLowerCase() || null,
      situacao:        form.situacao,
    }

    const { error } = await supabase.from('obreiros').update(payload).eq('id', id)
    setSalvando(false)

    if (error) {
      mostrarToast('Erro ao salvar. Tente novamente.', 'erro')
    } else {
      mostrarToast('Dados salvos com sucesso!', 'sucesso')
      setTimeout(() => router.push('/reunioes/admin/obreiros'), 1500)
    }
  }

  function mostrarToast(msg, tipo) {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingTxt}>Carregando dados...</p>
      </div>
    )
  }

  return (
    <div style={s.container}>

      {toast && (
        <div style={{ ...s.toast, background: toast.tipo === 'sucesso' ? '#065F46' : '#991B1B' }}>
          {toast.tipo === 'sucesso' ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <button style={s.voltarBtn} onClick={() => router.push('/reunioes/admin/obreiros')}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.headerTitulo}>Editar obreiro</div>
          <div style={s.headerSub} title={form.nome}>
            {form.nome || 'Sem nome'}
          </div>
        </div>
        <button
          style={{ ...s.btnSalvarHeader, opacity: salvando ? 0.6 : 1 }}
          onClick={salvar}
          disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div style={s.body}>

        {/* Situação */}
        <div style={s.secao}>
          <div style={s.secaoTitulo}>Status</div>
          <div style={s.radioGroup}>
            {['Ativo', 'Inativo'].map(op => (
              <button
                key={op}
                style={{
                  ...s.radioBtn,
                  ...(form.situacao === op ? (op === 'Ativo' ? s.radioBtnAtivo : s.radioBtnInativo) : {})
                }}
                onClick={() => atualizar('situacao', op)}>
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Identificação */}
        <div style={s.secao}>
          <div style={s.secaoTitulo}>Identificação</div>

          <div style={s.campo}>
            <label style={s.label}>Nome completo *</label>
            <input
              style={{ ...s.input, ...(erros.nome ? s.inputErro : {}) }}
              value={form.nome}
              onChange={e => atualizar('nome', e.target.value)}
              placeholder="Nome completo do obreiro"
            />
            {erros.nome && <span style={s.erroMsg}>{erros.nome}</span>}
          </div>

          <div style={s.campoRow}>
            <div style={{ ...s.campo, flex: 1 }}>
              <label style={s.label}>CPF</label>
              <input
                style={{ ...s.input, ...(erros.cpf ? s.inputErro : {}) }}
                value={form.cpf}
                onChange={e => atualizar('cpf', mascaraCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
              {erros.cpf && <span style={s.erroMsg}>{erros.cpf}</span>}
            </div>
            <div style={{ ...s.campo, flex: 1 }}>
              <label style={s.label}>Data de nascimento</label>
              <input
                style={{ ...s.input, ...(erros.data_nascimento ? s.inputErro : {}) }}
                value={form.data_nascimento}
                onChange={e => atualizar('data_nascimento', mascaraData(e.target.value))}
                placeholder="DD/MM/AAAA"
                inputMode="numeric"
              />
              {erros.data_nascimento && <span style={s.erroMsg}>{erros.data_nascimento}</span>}
            </div>
          </div>
        </div>

        {/* Igreja */}
        <div style={s.secao}>
          <div style={s.secaoTitulo}>Igreja</div>

          <div style={s.campo}>
            <label style={s.label}>Congregação *</label>
            <select
              style={{ ...s.select, ...(erros.congregacao_id ? s.inputErro : {}) }}
              value={form.congregacao_id}
              onChange={e => atualizar('congregacao_id', e.target.value)}>
              <option value="">Selecione a congregação</option>
              {congregacoes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {erros.congregacao_id && <span style={s.erroMsg}>{erros.congregacao_id}</span>}
          </div>

          <div style={s.campoRow}>
            <div style={{ ...s.campo, flex: 1 }}>
              <label style={s.label}>Cargo eclesiástico *</label>
              <select
                style={{ ...s.select, ...(erros.cargo_id ? s.inputErro : {}) }}
                value={form.cargo_id}
                onChange={e => atualizar('cargo_id', e.target.value)}>
                <option value="">Selecione o cargo</option>
                {cargos.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {erros.cargo_id && <span style={s.erroMsg}>{erros.cargo_id}</span>}
            </div>

            <div style={{ ...s.campo, flex: 1 }}>
              <label style={s.label}>Função</label>
              <select
                style={s.select}
                value={form.funcao_id}
                onChange={e => atualizar('funcao_id', e.target.value)}>
                <option value="">Sem função</option>
                {funcoes.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div style={s.secao}>
          <div style={s.secaoTitulo}>Contato</div>

          <div style={s.campoRow}>
            <div style={{ ...s.campo, flex: 1 }}>
              <label style={s.label}>Telefone</label>
              <input
                style={s.input}
                value={form.telefone}
                onChange={e => atualizar('telefone', e.target.value)}
                placeholder="(19) 99999-9999"
                inputMode="tel"
              />
            </div>
            <div style={{ ...s.campo, flex: 1 }}>
              <label style={s.label}>E-mail</label>
              <input
                style={s.input}
                value={form.email}
                onChange={e => atualizar('email', e.target.value)}
                placeholder="email@exemplo.com"
                inputMode="email"
                autoCapitalize="none"
              />
            </div>
          </div>
        </div>

        {/* Botão salvar principal */}
        <button
          style={{ ...s.btnSalvar, opacity: salvando ? 0.6 : 1 }}
          onClick={salvar}
          disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>

        <button style={s.btnCancelar} onClick={() => router.push('/reunioes/admin/obreiros')}>
          Cancelar
        </button>

      </div>
    </div>
  )
}

const s = {
  container:      { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 560, margin: '0 auto', paddingBottom: 40 },
  loadingWrap:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 12 },
  spinner:        { width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingTxt:     { color: '#9CA3AF', fontSize: 14 },
  toast:          { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, fontWeight: 500, padding: '10px 20px', borderRadius: 24, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  header:         { background: '#111827', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:      { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo:   { fontSize: 15, fontWeight: 600 },
  headerSub:      { fontSize: 11, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  btnSalvarHeader:{ background: '#34D399', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  body:           { padding: '16px' },
  secao:          { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px', marginBottom: 12 },
  secaoTitulo:    { fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  campo:          { marginBottom: 12 },
  campoRow:       { display: 'flex', gap: 10 },
  label:          { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 },
  input:          { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  select:         { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' },
  inputErro:      { borderColor: '#F87171', background: '#FFF5F5' },
  erroMsg:        { display: 'block', fontSize: 11, color: '#DC2626', marginTop: 4 },
  radioGroup:     { display: 'flex', gap: 8 },
  radioBtn:       { flex: 1, padding: '9px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', color: '#6B7280', fontSize: 13, cursor: 'pointer', textAlign: 'center' },
  radioBtnAtivo:  { background: '#D1FAE5', borderColor: '#6EE7B7', color: '#065F46', fontWeight: 600 },
  radioBtnInativo:{ background: '#FEE2E2', borderColor: '#FCA5A5', color: '#991B1B', fontWeight: 600 },
  btnSalvar:      { width: '100%', padding: '13px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 },
  btnCancelar:    { width: '100%', padding: '13px', background: 'transparent', color: '#9CA3AF', border: 'none', fontSize: 14, cursor: 'pointer' },
}