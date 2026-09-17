'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ClassificationViewer from '@/components/ClassificationViewer'

const GENRES = ['MYTH', 'LEGEND', 'FOLKTALE', 'EPIC', 'RIDDLE', 'PROVERB', 'SONG', 'CHANT', 'PRAYER', 'INCANTATION']
const THEMES = [
  'CREATION_MYTHS', 'HEROIC_DEEDS', 'COURTSHIP_AND_MARRIAGE', 'AGRICULTURAL_CYCLES',
  'HUNTING_AND_FISHING', 'DEATH_AND_AFTERLIFE', 'SPIRIT_WORLD', 'NATURE_AND_ENVIRONMENT',
  'SOCIAL_CUSTOMS', 'MORAL_LESSONS', 'HISTORICAL_EVENTS', 'SUPERNATURAL_BEINGS',
]
const PROVINCES = ['Agusan del Norte', 'Agusan del Sur', 'Surigao del Norte', 'Surigao del Sur', 'Davao de Oro']

interface FormData {
  title: string; manoboTitle: string; englishTitle: string
  type: string; content: string; transcription: string; translation: string
  audioFile: string; audioDuration: string; source: string; yearCollected: string
  narrator: string; communityLocation: string; province: string
  municipality: string; barangay: string; genre: string
  themes: string[]; culturalElements: string
}

const EMPTY: FormData = {
  title: '', manoboTitle: '', englishTitle: '', type: 'ORAL_LITERATURE',
  content: '', transcription: '', translation: '', audioFile: '',
  audioDuration: '', source: '', yearCollected: '', narrator: '',
  communityLocation: '', province: 'Agusan del Sur', municipality: '', barangay: '',
  genre: 'MYTH', themes: [], culturalElements: '',
}

interface Props {
  initialData?: Partial<FormData> & { id?: string }
  mode: 'create' | 'edit'
}

export default function EntryForm({ initialData, mode }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initialData })
  const [saving, setSaving] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [translatingField, setTranslatingField] = useState<string | null>(null)
  const [translationNotice, setTranslationNotice] = useState<string | null>(null)
  const [classResult, setClassResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'basic' | 'content' | 'location' | 'classification'>('basic')

  const set = (key: keyof FormData, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  const toggleTheme = (theme: string) => {
    set('themes', form.themes.includes(theme)
      ? form.themes.filter(t => t !== theme)
      : [...form.themes, theme])
  }

  const handleAutoTranslate = async (field: 'manoboTitle' | 'transcription' | 'translation') => {
    let sourceText = ''
    let sourceLang: 'en' | 'msm' = 'en'
    let targetLang: 'msm' | 'en' = 'msm'

    if (field === 'manoboTitle') {
      sourceText = form.title || form.englishTitle
      sourceLang = 'en'
      targetLang = 'msm'
    } else if (field === 'transcription') {
      sourceText = form.content || form.translation
      sourceLang = 'en'
      targetLang = 'msm'
    } else if (field === 'translation') {
      sourceText = form.transcription
      sourceLang = 'msm'
      targetLang = 'en'
    }

    if (!sourceText) {
      setError(`Please fill the source text before auto-translating to ${field}.`)
      return
    }

    setTranslatingField(field)
    setError('')
    setTranslationNotice(null)

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, sourceLang, targetLang }),
      })
      const data = await res.json()
      if (data.result?.translatedText) {
        set(field, data.result.translatedText)
        setTranslationNotice(`✓ Auto-translated using Agusan Manobo Bible corpus (Confidence: ${Math.round(data.result.confidence * 100)}%)`)
      } else {
        throw new Error('No translation returned')
      }
    } catch {
      setError('Translation request failed.')
    } finally {
      setTranslatingField(null)
    }
  }

  const runClassification = async () => {
    if (!form.content) { setError('Enter content first to classify.'); return }
    setClassifying(true)
    setError('')
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.content, additionalContext: form.transcription }),
      })
      const data = await res.json()
      setClassResult(data.result)
      setActiveSection('classification')
    } catch { setError('Classification failed. Please try again.') }
    finally { setClassifying(false) }
  }

  const acceptClassification = (genre: string, themes: string[]) => {
    set('genre', genre)
    set('themes', themes)
    setClassResult(null)
    setActiveSection('basic')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content || !form.source || !form.province || !form.municipality || !form.communityLocation) {
      setError('Please fill all required fields.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = mode === 'edit' && initialData?.id
        ? `/api/entries/${initialData.id}`
        : '/api/entries'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          audioDuration: form.audioDuration ? Number(form.audioDuration) : null,
          yearCollected: form.yearCollected ? Number(form.yearCollected) : null,
          culturalElements: form.culturalElements.split(',').map(s => s.trim()).filter(Boolean),
        }),
      })

      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      router.push(`/archive/${data.entry.id}`)
    } catch (err) {
      setError('Failed to save entry. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg-input)', border: '1px solid var(--border-color)',
    borderRadius: '8px', color: 'var(--text-primary)',
    fontSize: '14px', fontFamily: 'Inter, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
    letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }
  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
    borderRadius: '12px', padding: '20px', marginBottom: '16px',
  }

  const sections = [
    { id: 'basic', label: '📋 Basic Info' },
    { id: 'content', label: '📝 Content' },
    { id: 'location', label: '📍 Location' },
    { id: 'classification', label: '🧠 Classification' },
  ] as const

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}>
      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
              background: activeSection === s.id ? 'linear-gradient(135deg, var(--primary-red), var(--primary-red-dark))' : 'var(--bg-input)',
              color: activeSection === s.id ? '#fff' : 'var(--text-secondary)',
            }}
          >{s.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#e11d48', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {translationNotice && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
          {translationNotice}
        </div>
      )}

      {/* Basic Info */}
      {activeSection === 'basic' && (
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>TITLE *</label>
              <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Entry title" required />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>MANOBO TITLE</label>
                <button
                  type="button"
                  onClick={() => handleAutoTranslate('manoboTitle')}
                  disabled={translatingField === 'manoboTitle' || (!form.title && !form.englishTitle)}
                  style={{
                    background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0
                  }}
                >
                  {translatingField === 'manoboTitle' ? '⏳ Translating...' : '🌐 Auto-Translate (Bible Corpus)'}
                </button>
              </div>
              <input style={inputStyle} value={form.manoboTitle} onChange={e => set('manoboTitle', e.target.value)} placeholder="Title in Manobo language" />
            </div>
            <div>
              <label style={labelStyle}>ENGLISH TITLE</label>
              <input style={inputStyle} value={form.englishTitle} onChange={e => set('englishTitle', e.target.value)} placeholder="English title" />
            </div>
            <div>
              <label style={labelStyle}>ENTRY TYPE *</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="ORAL_LITERATURE">📖 Oral Literature</option>
                <option value="FOLK_SONG">🎵 Folk Song</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>SOURCE *</label>
              <input style={inputStyle} value={form.source} onChange={e => set('source', e.target.value)} placeholder="e.g. Catipay & Curato (2024)" required />
            </div>
            <div>
              <label style={labelStyle}>NARRATOR</label>
              <input style={inputStyle} value={form.narrator} onChange={e => set('narrator', e.target.value)} placeholder="Name of narrator" />
            </div>
            <div>
              <label style={labelStyle}>YEAR COLLECTED</label>
              <input style={inputStyle} type="number" value={form.yearCollected} onChange={e => set('yearCollected', e.target.value)} placeholder="e.g. 2023" min="1900" max="2100" />
            </div>
            <div>
              <label style={labelStyle}>AUDIO FILE PATH</label>
              <input style={inputStyle} value={form.audioFile} onChange={e => set('audioFile', e.target.value)} placeholder="/audio/filename.mp3" />
            </div>
            <div>
              <label style={labelStyle}>AUDIO DURATION (seconds)</label>
              <input style={inputStyle} type="number" value={form.audioDuration} onChange={e => set('audioDuration', e.target.value)} placeholder="e.g. 180" />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeSection === 'content' && (
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>Content</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>EXPLANATION / ANALYSIS (ENGLISH) *</label>
              <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Enter English explanation, description, or analysis of the piece..." required />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>MANOBO / ORIGINAL TEXT (TRANSCRIPTION)</label>
                <button
                  type="button"
                  onClick={() => handleAutoTranslate('transcription')}
                  disabled={translatingField === 'transcription' || (!form.content && !form.translation)}
                  style={{
                    background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0
                  }}
                >
                  {translatingField === 'transcription' ? '⏳ Translating...' : '🌐 Auto-Translate (Manobo)'}
                </button>
              </div>
              <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.transcription} onChange={e => set('transcription', e.target.value)} placeholder="Enter the original text in Manobo or Cebuano as collected..." />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>ENGLISH TRANSLATION</label>
                <button
                  type="button"
                  onClick={() => handleAutoTranslate('translation')}
                  disabled={translatingField === 'translation' || !form.transcription}
                  style={{
                    background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0
                  }}
                >
                  {translatingField === 'translation' ? '⏳ Translating...' : '🌐 Auto-Translate (English)'}
                </button>
              </div>
              <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.translation} onChange={e => set('translation', e.target.value)} placeholder="Enter the English translation..." />
            </div>
            <div>
              <label style={labelStyle}>CULTURAL ELEMENTS (comma-separated)</label>
              <input style={inputStyle} value={form.culturalElements} onChange={e => set('culturalElements', e.target.value)} placeholder="e.g. Great Spirit, First Man and Woman, Creation Narrative" />
            </div>
            <button
              type="button"
              onClick={runClassification}
              disabled={classifying || !form.content}
              style={{
                padding: '10px 20px', background: classifying ? 'var(--bg-input)' : 'linear-gradient(135deg, var(--primary-red), var(--primary-red-dark))',
                border: 'none', borderRadius: '8px', color: classifying ? 'var(--text-muted)' : '#fff', cursor: classifying ? 'default' : 'pointer',
                fontSize: '14px', fontWeight: 600, alignSelf: 'flex-start',
              }}
            >
              {classifying ? '⏳ Classifying...' : '🧠 Run Auto-Classification'}
            </button>
          </div>
        </div>
      )}

      {/* Location */}
      {activeSection === 'location' && (
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>Location Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>PROVINCE *</label>
              <select style={inputStyle} value={form.province} onChange={e => set('province', e.target.value)} required>
                {PROVINCES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>MUNICIPALITY *</label>
              <input style={inputStyle} value={form.municipality} onChange={e => set('municipality', e.target.value)} placeholder="Municipality" required />
            </div>
            <div>
              <label style={labelStyle}>BARANGAY</label>
              <input style={inputStyle} value={form.barangay} onChange={e => set('barangay', e.target.value)} placeholder="Barangay" />
            </div>
            <div>
              <label style={labelStyle}>COMMUNITY LOCATION *</label>
              <input style={inputStyle} value={form.communityLocation} onChange={e => set('communityLocation', e.target.value)} placeholder="e.g. Sitio Kalibutan" required />
            </div>
          </div>
        </div>
      )}

      {/* Classification */}
      {activeSection === 'classification' && (
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>Genre & Theme Classification</h3>

          {classResult && (
            <div style={{ marginBottom: '20px' }}>
              <ClassificationViewer
                result={classResult}
                onAccept={acceptClassification}
                onClose={() => setClassResult(null)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label style={labelStyle}>GENRE (EUGENIO 1993) *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {GENRES.map(g => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: form.genre === g ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    <input type="radio" name="genre" value={g} checked={form.genre === g} onChange={() => set('genre', g)} style={{ accentColor: 'var(--primary-red)' }} />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>THEMES (ANDRESS 1985)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {THEMES.map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: form.themes.includes(t) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={form.themes.includes(t)} onChange={() => toggleTheme(t)} style={{ accentColor: 'var(--primary-red)' }} />
                    {t.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" onClick={() => router.back()}
          style={{ padding: '10px 24px', background: 'transparent', border: '1px solid var(--border-hover)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ padding: '10px 28px', background: saving ? 'var(--bg-input)' : 'linear-gradient(135deg, var(--primary-red), var(--primary-red-dark))', border: 'none', borderRadius: '8px', color: saving ? 'var(--text-muted)' : '#fff', cursor: saving ? 'default' : 'pointer', fontSize: '14px', fontWeight: 700 }}>
          {saving ? '⏳ Saving...' : mode === 'create' ? '✓ Create Entry' : '✓ Save Changes'}
        </button>
      </div>
    </form>
  )
}
