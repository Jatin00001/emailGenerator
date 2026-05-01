import { useState, useCallback, useRef, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Rich Text Editor
// ─────────────────────────────────────────────────────────────────────────────
function RichEditor({ value, onChange, placeholder, minHeight = 80 }) {
  const ref = useRef(null)
  const isInternalChange = useRef(false)

  useEffect(() => {
    if (ref.current && !isInternalChange.current) {
      if (ref.current.innerHTML !== value) {
        ref.current.innerHTML = value || ''
      }
    }
    isInternalChange.current = false
  }, [value])

  const emit = () => {
    isInternalChange.current = true
    onChange(ref.current.innerHTML)
  }

  const exec = (cmd, val = null) => {
    ref.current.focus()
    document.execCommand(cmd, false, val)
    emit()
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL:', 'https://')
    if (url) exec('createLink', url)
  }

  const autoLinkify = (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    const el = ref.current
    if (!el) return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
    const URL_RE = /(?<![">])(https?:\/\/[^\s<>"]+)/g
    const toReplace = []
    let node
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('a')) continue
      const text = node.textContent
      if (!URL_RE.test(text)) continue
      toReplace.push(node)
    }
    if (toReplace.length === 0) return

    toReplace.forEach(textNode => {
      const text = textNode.textContent
      const frag = document.createDocumentFragment()
      let last = 0
      const re = /(?<![">])(https?:\/\/[^\s<>"]+)/g
      let m
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)))
        const a = document.createElement('a')
        a.href = m[1]; a.target = '_blank'; a.rel = 'noopener noreferrer'
        a.style.color = '#1a73e8'; a.style.textDecoration = 'underline'
        a.textContent = m[1]
        frag.appendChild(a)
        last = m.index + m[1].length
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
      textNode.parentNode.replaceChild(frag, textNode)
    })
    emit()
  }

  const toolbarBtn = (label, title, action) => (
    <button key={title} title={title}
      onMouseDown={e => { e.preventDefault(); action() }}
      style={{
        background: 'transparent', border: '1px solid #e0e0e0', borderRadius: 5,
        padding: '4px 9px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        color: '#3c4043', fontFamily: 'inherit', lineHeight: 1.4,
      }}>
      {label}
    </button>
  )

  return (
    <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '7px 10px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
        {toolbarBtn('B',       'Bold',              () => exec('bold'))}
        {toolbarBtn('I',       'Italic',            () => exec('italic'))}
        {toolbarBtn('U',       'Underline',         () => exec('underline'))}
        {toolbarBtn('S̶',       'Strikethrough',     () => exec('strikeThrough'))}
        <div style={{ width: 1, background: '#e0e0e0', margin: '0 4px' }} />
        {toolbarBtn('• List',  'Bullet List',       () => exec('insertUnorderedList'))}
        {toolbarBtn('1. List', 'Numbered List',     () => exec('insertOrderedList'))}
        <div style={{ width: 1, background: '#e0e0e0', margin: '0 4px' }} />
        {toolbarBtn('🔗 Link', 'Insert Link',       insertLink)}
        {toolbarBtn('✕ Link',  'Remove Link',       () => exec('unlink'))}
        <div style={{ width: 1, background: '#e0e0e0', margin: '0 4px' }} />
        {toolbarBtn('Clear',   'Clear Formatting',  () => exec('removeFormat'))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onKeyDown={autoLinkify}
        onPaste={() => setTimeout(() => { autoLinkify({ key: ' ' }); emit() }, 50)}
        data-placeholder={placeholder}
        style={{ minHeight, padding: '10px 14px', fontSize: 14, color: '#202124', fontFamily: "'Inter',sans-serif", lineHeight: 1.75, outline: 'none', overflowY: 'auto' }}
      />
      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #aaa; pointer-events: none; }
        [contenteditable] a { color: #1a73e8 !important; text-decoration: underline !important; cursor: pointer; }
        [contenteditable] ul { margin: 4px 0; padding-left: 20px; }
        [contenteditable] ol { margin: 4px 0; padding-left: 20px; }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  page:        { minHeight: '100vh', background: 'linear-gradient(135deg,#e8f0fe 0%,#f8f9ff 100%)', fontFamily: "'Inter',sans-serif", padding: '0 0 60px' },
  topbar:      { background: '#1a73e8', color: '#fff', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(26,115,232,0.4)' },
  topbarTitle: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 0.3 },
  topbarSub:   { margin: 0, fontSize: 13, opacity: 0.85 },
  container:   { maxWidth: 900, margin: '0 auto', padding: '32px 16px' },
  card:        { background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px 28px', marginBottom: 20 },
  cardTitle:   { margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#202124', display: 'flex', alignItems: 'center', gap: 8 },
  label:       { display: 'block', fontSize: 12, fontWeight: 600, color: '#5f6368', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:       { width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, color: '#202124', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" },
  row2:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  btnPrimary:  { background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 },
  btnSecondary:{ background: '#f1f3f4', color: '#3c4043', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
  btnDanger:   { background: 'transparent', color: '#d93025', border: '1.5px solid #fad2cf', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnGmail:    { background: 'linear-gradient(135deg,#ea4335,#c5221f)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 16px rgba(234,67,53,0.35)', letterSpacing: 0.3 },
  sectionBlock:{ border: '1.5px solid #e8eaed', borderRadius: 10, padding: '18px 20px', marginBottom: 14, background: '#fafbff' },
  sectionHeader:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionBadge:{ background: '#e8f0fe', color: '#1a73e8', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 },
  lineItem:    { display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, padding: '10px 12px' },
  lineInputs:  { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  previewWrap: { border: '2px solid #1a73e8', borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  previewBar:  { background: '#1a73e8', color: '#fff', padding: '10px 18px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 },
  statusOk:    { color: '#137333', background: '#e6f4ea', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600 },
  statusErr:   { color: '#c5221f', background: '#fce8e6', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600 },
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const defaultSection = () => ({
  id: Date.now() + Math.random(),
  title: '',
  lines: [{ id: Date.now() + Math.random(), text: '', url: '' }],
})

function getWeekSubject() {
  const today = new Date()
  const day   = today.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMon)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const fmt = d => String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear()
  return `Enquiry App & TSAI Update ${fmt(monday)} - ${fmt(friday)}`
}

const defaultState = () => ({
  subject:    getWeekSubject(),
  recipient:  '',
  greeting:   'Good Morning / Evening,',
  intro:      "Hope everyone is doing well! Please find attached this week's update for the Enquiry App, Ts.ai and Automation.",
  sections: [
    { id: 1, title: 'Enquiry App',  lines: [{ id: 11, text: '', url: '' }] },
    { id: 2, title: 'Automation',   lines: [{ id: 21, text: '', url: '' }] },
  ],
  closing:    '',
  senderName: 'The Team',
})

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [form,        setForm]        = useState(defaultState)
  const [resetKey,    setResetKey]    = useState(0)
  const [preview,     setPreview]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [status,      setStatus]      = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleReset = () => {
    setForm(defaultState())
    setResetKey(k => k + 1)
    setPreview('')
    setShowPreview(false)
    setStatus(null)
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addSection         = () => setForm(f => ({ ...f, sections: [...f.sections, defaultSection()] }))
  const removeSection      = id => setForm(f => ({ ...f, sections: f.sections.filter(s => s.id !== id) }))
  const updateSectionTitle = (id, val) => setForm(f => ({ ...f, sections: f.sections.map(s => s.id === id ? { ...s, title: val } : s) }))
  const moveSection        = (id, dir) => setForm(f => {
    const arr = [...f.sections], i = arr.findIndex(s => s.id === id), j = i + dir
    if (j < 0 || j >= arr.length) return f
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    return { ...f, sections: arr }
  })

  const addLine    = sid => setForm(f => ({ ...f, sections: f.sections.map(s => s.id === sid ? { ...s, lines: [...s.lines, { id: Date.now() + Math.random(), text: '', url: '' }] } : s) }))
  const removeLine = (sid, lid) => setForm(f => ({ ...f, sections: f.sections.map(s => s.id === sid ? { ...s, lines: s.lines.filter(l => l.id !== lid) } : s) }))
  const updateLine = (sid, lid, key, val) => setForm(f => ({ ...f, sections: f.sections.map(s => s.id === sid ? { ...s, lines: s.lines.map(l => l.id === lid ? { ...l, [key]: val } : l) } : s) }))

  const buildEmail = useCallback(async () => {
    setLoading(true); setStatus(null)
    try {
      const payload = {
        subject:     form.subject,
        greeting:    form.greeting,
        intro:       form.intro,
        sections:    form.sections.map(s => ({ title: s.title, lines: s.lines.map(l => ({ text: l.text, url: l.url || '' })) })),
        closing:     form.closing,
        sender_name: form.senderName,
        recipient:   form.recipient,
      }
      const base = import.meta.env.VITE_BACKEND_URL || ''
      const res  = await fetch(`${base}/build-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setPreview(data.html)
      setShowPreview(true)
      setStatus({ ok: true, msg: '✅ Email built successfully!' })
      return data.html
    } catch (e) {
      setStatus({ ok: false, msg: `❌ ${e.message}` }); return null
    } finally {
      setLoading(false)
    }
  }, [form])

  const openGmail = async () => {
    let html = preview
    if (!html) { html = await buildEmail(); if (!html) return }
    const to      = encodeURIComponent(form.recipient || '')
    const subject = encodeURIComponent(form.subject)
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}`, '_blank')
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'email_body.html'; a.click()
    URL.revokeObjectURL(url)
    setStatus({ ok: true, msg: '📧 Gmail opened! Open email_body.html → Ctrl+A → Ctrl+C → paste in Gmail body.' })
  }

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <span style={{ fontSize: 28 }}>📧</span>
        <div>
          <p style={S.topbarTitle}>Email Builder</p>
          <p style={S.topbarSub}>Build beautiful weekly update emails → send via Gmail</p>
        </div>
      </div>

      <div style={S.container}>

        {/* Settings */}
        <div style={S.card}>
          <p style={S.cardTitle}>⚙️ Email Settings</p>
          <div style={S.row2}>
            <div>
              <label style={S.label}>Subject *</label>
              <input style={S.input} value={form.subject} onChange={e => setField('subject', e.target.value)} placeholder="Weekly Update – ..." />
            </div>
            <div>
              <label style={S.label}>Recipient Email (optional)</label>
              <input style={S.input} value={form.recipient} onChange={e => setField('recipient', e.target.value)} placeholder="team@example.com" />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={S.label}>Sender Name</label>
            <input style={{ ...S.input, maxWidth: 300 }} value={form.senderName} onChange={e => setField('senderName', e.target.value)} placeholder="The Team" />
          </div>
        </div>

        {/* Opening */}
        <div style={S.card}>
          <p style={S.cardTitle}>👋 Opening</p>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Greeting</label>
            <input style={S.input} value={form.greeting} onChange={e => setField('greeting', e.target.value)} placeholder="Good Morning / Evening," />
          </div>
          <div>
            <label style={S.label}>Intro Paragraph</label>
            <RichEditor key={`intro-${resetKey}`} value={form.intro} onChange={v => setField('intro', v)} placeholder="I hope everyone is doing well! ..." minHeight={72} />
          </div>
        </div>

        {/* Sections */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <p style={{ ...S.cardTitle, margin: 0 }}>📂 Sections</p>
            <button style={S.btnSecondary} onClick={addSection}>＋ Add Section</button>
          </div>

          {form.sections.map((section, si) => (
            <div key={section.id} style={S.sectionBlock}>
              <div style={S.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={S.sectionBadge}>Section {si + 1}</span>
                  <button style={{ ...S.btnSecondary, padding: '4px 8px', fontSize: 12 }} onClick={() => moveSection(section.id, -1)} disabled={si === 0}>▲</button>
                  <button style={{ ...S.btnSecondary, padding: '4px 8px', fontSize: 12 }} onClick={() => moveSection(section.id, 1)} disabled={si === form.sections.length - 1}>▼</button>
                </div>
                <button style={S.btnDanger} onClick={() => removeSection(section.id)}>✕ Remove</button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Section Title</label>
                <input style={S.input} value={section.title} onChange={e => updateSectionTitle(section.id, e.target.value)} placeholder="e.g. Enquiry App, Automation, TS AI..." />
              </div>

              <label style={{ ...S.label, marginBottom: 8 }}>Lines / Bullet Points</label>
              {section.lines.map((line) => (
                <div key={line.id} style={S.lineItem}>
                  <div style={{ paddingTop: 10, color: '#1a73e8', fontWeight: 700, fontSize: 16, minWidth: 16 }}>•</div>
                  <div style={S.lineInputs}>
                    <RichEditor key={`line-${resetKey}-${line.id}`} value={line.text} onChange={v => updateLine(section.id, line.id, 'text', v)} placeholder="Line text (supports bold, italic, links...)" minHeight={40} />
                    <input style={{ ...S.input, fontSize: 12, color: '#5f6368' }} value={line.url} onChange={e => updateLine(section.id, line.id, 'url', e.target.value)} placeholder="🔗 URL (optional) — https://..." />
                  </div>
                  <button style={{ ...S.btnDanger, marginTop: 4, alignSelf: 'flex-start' }} onClick={() => removeLine(section.id, line.id)} disabled={section.lines.length === 1}>✕</button>
                </div>
              ))}

              <button style={{ ...S.btnSecondary, marginTop: 6, fontSize: 12 }} onClick={() => addLine(section.id)}>＋ Add Line</button>
            </div>
          ))}
        </div>

        {/* Closing */}
        <div style={S.card}>
          <p style={S.cardTitle}>✍️ Closing (optional)</p>
          <RichEditor key={`closing-${resetKey}`} value={form.closing} onChange={v => setField('closing', v)} placeholder="Any closing remarks..." minHeight={72} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          <button style={S.btnPrimary} onClick={buildEmail} disabled={loading}>
            {loading ? '⏳ Building...' : '👁️ Preview Email'}
          </button>
          <button style={S.btnGmail} onClick={openGmail} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="white"/>
            </svg>
            Open in Gmail
          </button>
          <button style={{ ...S.btnSecondary, marginLeft: 'auto' }} onClick={handleReset}>🔄 Reset</button>
        </div>

        {status && (
          <div style={{ ...(status.ok ? S.statusOk : S.statusErr), marginBottom: 20 }}>
            {status.msg}
          </div>
        )}

        {showPreview && preview && (
          <div style={S.previewWrap}>
            <div style={S.previewBar}>
              <span>👁️</span> Email Preview
              <button style={{ ...S.btnSecondary, marginLeft: 'auto', fontSize: 12, padding: '4px 12px' }} onClick={() => setShowPreview(false)}>Hide</button>
            </div>
            <iframe srcDoc={preview} style={{ width: '100%', height: 620, border: 'none', display: 'block' }} title="Email Preview" />
          </div>
        )}

      </div>
    </div>
  )
}
