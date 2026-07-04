'use client'

/**
 * /reunioes/admin/obreiros/novo/page.jsx
 * Cadastro de novo obreiro
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useReuniaoAuth } from '@/hooks/useReuniaoAuth'
import { carregarListasApoio, criarObreiro } from '@/app/aplicacao/actions/obreiro-novo'

// ── SEM cliente Supabase no navegador ──
// Listas de apoio, número de cadastro, gravação e log de auditoria
// passam pelas server actions (cookie + service role).

function mascaraCPF(valor) {
  return valor.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function mascaraData(valor) {
  return valor.replace(/\D/g, '').slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
}

function brParaISO(br) {
  if (!br || br.length < 10) return null
  const [d, m, a] = br.split('/')
  if (!d || !m || !a) return null
  return `${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

export default function NovoObreiroPage() {
  const router = useRouter()
  useReuniaoAuth()

  const [salvando, setSalvando]         = useState(false)
  const [toast, setToast]               = useState(null)
  const [congregacoes, setCongregacoes] = useState([])
  const [cargos, setCargos]             = useState([])
  const [funcoes, setFuncoes]           = useState([])
  const [erros, setErros]               = useState({})

  const [form, setForm] = useState({
    nome:            '',
    congregacao_id:  '',
    cargo_id:        '',
    funcao_id:       '',
    cpf:             '',
    data_nascimento: '',
    telefone:        '',
    email:           '',
    situacao:        'Ativo',
  })

  useEffect(() => {
    async function carregar() {
      const res = await carregarListasApoio()
      if (!res.ok) {
        mostrarToast(res.error || 'Erro ao carregar as listas.', 'erro')
        return
      }
      setCongregacoes(res.congregacoes)
      setCargos(res.cargos)
      setFuncoes(res.funcoes)
    }
    carregar()
  }, [])

  function atualizar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: null }))
  }

  function validar() {
    const novosErros = {}
    if (!form.nome.trim())       novosErros.nome = 'Nome é obrigatório'
    if (!form.congregacao_id)    novosErros.congregacao_id = 'Congregação é obrigatória'
    if (!form.cargo_id)          novosErros.cargo_id = 'Cargo é obrigatório'
    if (form.cpf && form.cpf.replace(/\D/g, '').length !== 11)
      novosErros.cpf = 'CPF incompleto (11 dígitos)'
    if (form.data_nascimento && form.data_nascimento.length < 10)
      novosErros.data_nascimento = 'Data incompleta (DD/MM/AAAA)'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar() {
    if (!validar() || salvando) return
    setSalvando(true)

    // A action calcula o número de cadastro no servidor (com retry
    // contra colisões) e registra o log de auditoria
    const res = await criarObreiro({
      situacao:        form.situacao,
      nome:            form.nome,
      congregacao_id:  form.congregacao_id,
      cargo_id:        form.cargo_id,
      funcao_id:       form.funcao_id,
      cpf:             form.cpf,
      data_nascimento: brParaISO(form.data_nascimento),
      telefone:        form.telefone,
      email:           form.email,
    })

    setSalvando(false)

    if (!res.ok) {
      mostrarToast(res.error || 'Erro ao cadastrar. Tente novamente.', 'erro')
    } else {
      mostrarToast('Obreiro cadastrado!', 'sucesso')
      // Redireciona para a foto após cadastrar
      setTimeout(() => router.push(`/aplicacao/reunioes/admin/secretaria/obreiros/${res.id}/foto`), 1200)
    }
  }

  function mostrarToast(msg, tipo) {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
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
        <button style={s.voltarBtn} onClick={() => router.push('/aplicacao/reunioes/admin/secretaria/obreiros')}>←</button>
        <div style={{ flex: 1 }}>
          <div style={s.headerTitulo}>Novo obreiro</div>
          <div style={s.headerSub}>Preencha os dados e salve</div>
        </div>
        <button
          style={{ ...s.btnSalvarHeader, opacity: salvando ? 0.6 : 1 }}
          onClick={salvar}
          disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div style={s.body}>

        {/* Status */}
        <div style={s.secao}>
          <div style={s.secaoTitulo}>Status</div>
          <div style={s.radioGroup}>
            {['Ativo', 'Inativo'].map(op => (
              <button key={op}
                style={{ ...s.radioBtn, ...(form.situacao === op ? (op === 'Ativo' ? s.radioBtnAtivo : s.radioBtnInativo) : {}) }}
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
              autoFocus
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

        {/* Aviso sobre foto */}
        <div style={s.avisoFoto}>
          <span style={s.avisoIcone}>◉</span>
          <p style={s.avisoTexto}>
            Após salvar, você será redirecionado para cadastrar a foto facial do obreiro.
          </p>
        </div>

        <button
          style={{ ...s.btnSalvar, opacity: salvando ? 0.6 : 1 }}
          onClick={salvar}
          disabled={salvando}>
          {salvando ? 'Cadastrando...' : 'Cadastrar obreiro'}
        </button>

        <button style={s.btnCancelar} onClick={() => router.push('/aplicacao/reunioes/admin/secretaria/obreiros')}>
          Cancelar
        </button>

      </div>
    </div>
  )
}

const s = {
  container:      { minHeight: '100dvh', background: '#F9FAFB', fontFamily: "'Geist','Inter',sans-serif", maxWidth: 560, margin: '0 auto', paddingBottom: 40 },
  toast:          { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, fontWeight: 500, padding: '10px 20px', borderRadius: 24, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  header:         { background: '#111827', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
  voltarBtn:      { background: 'none', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer', padding: '0 4px', flexShrink: 0 },
  headerTitulo:   { fontSize: 15, fontWeight: 600 },
  headerSub:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  btnSalvarHeader:{ background: '#34D399', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  body:           { padding: '16px' },
  secao:          { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px', marginBottom: 12 },
  secaoTitulo:    { fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  campo:          { marginBottom: 12 },
  campoRow:       { display: 'flex', gap: 10 },
  label:          { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 },
  input:          { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  select:         { width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' },
  inputErro:      { border: '1px solid #F87171', background: '#FFF5F5' },
  erroMsg:        { display: 'block', fontSize: 11, color: '#DC2626', marginTop: 4 },
  radioGroup:     { display: 'flex', gap: 8 },
  radioBtn:       { flex: 1, padding: '9px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', color: '#6B7280', fontSize: 13, cursor: 'pointer', textAlign: 'center' },
  radioBtnAtivo:  { background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', fontWeight: 600 },
  radioBtnInativo:{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontWeight: 600 },
  avisoFoto:      { display: 'flex', alignItems: 'flex-start', gap: 10, background: '#EDE9FE', border: '1px solid #C4B5FD', borderRadius: 12, padding: '12px 14px', marginBottom: 14 },
  avisoIcone:     { fontSize: 16, color: '#7C3AED', flexShrink: 0, marginTop: 1 },
  avisoTexto:     { fontSize: 13, color: '#5B21B6', margin: 0, lineHeight: 1.5 },
  btnSalvar:      { width: '100%', padding: '13px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 },
  btnCancelar:    { width: '100%', padding: '13px', background: 'transparent', color: '#9CA3AF', border: 'none', fontSize: 14, cursor: 'pointer' },
}