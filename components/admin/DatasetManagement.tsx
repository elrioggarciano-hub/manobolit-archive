'use client'

import { useState, useEffect } from 'react'

export interface CategoryDef {
  id: string
  code: string
  type: string
  title: string
  framework: string
  description: string
  isDraft: boolean
  approvedBy?: string | null
  approvedAt?: string | null
}

export default function DatasetManagement() {
  const [summary, setSummary] = useState<any>(null)
  const [categories, setCategories] = useState<CategoryDef[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<CategoryDef | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [importJson, setImportJson] = useState('')
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sumRes, catRes] = await Promise.all([
        fetch('/api/ml/dataset/summary'),
        fetch('/api/ml/categories'),
      ])

      if (sumRes.ok) {
        setSummary(await sumRes.json())
      }
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }
    } catch (e) {
      console.error('Failed to load dataset management info:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExport = async () => {
    setIsExporting(true)
    setActionMessage(null)
    try {
      const res = await fetch('/api/ml/dataset')
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `manobolit_verified_dataset_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setActionMessage({
          text: `Exported ${data.count} human-verified records (${data.excludedMismatched} modified records excluded for safety).`,
          type: 'success',
        })
      } else {
        setActionMessage({ text: 'Failed to export verified dataset', type: 'error' })
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Export error', type: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    if (!importJson.trim()) return
    setActionMessage(null)
    try {
      const parsed = JSON.parse(importJson)
      const items = Array.isArray(parsed) ? parsed : parsed.dataset || [parsed]

      const res = await fetch('/api/ml/dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (res.ok) {
        const data = await res.json()
        setActionMessage({
          text: `Successfully imported ${data.importedCount} records. Imported labels are preserved as pending suggestions until verified.`,
          type: 'success',
        })
        setImportJson('')
        fetchData()
      } else {
        const errData = await res.json()
        setActionMessage({ text: errData.error || 'Import failed', type: 'error' })
      }
    } catch (err: any) {
      setActionMessage({ text: `Invalid JSON format: ${err.message}`, type: 'error' })
    }
  }

  const handleSaveCategory = async () => {
    if (!editingCategory) return
    setActionMessage(null)
    try {
      const res = await fetch('/api/ml/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editingCategory.code,
          type: editingCategory.type,
          title: editTitle.trim(),
          framework: editingCategory.framework,
          description: editDesc.trim(),
          isDraft: false, // Approving or saving as admin
        }),
      })

      if (res.ok) {
        setActionMessage({ text: `Updated and approved definition for "${editTitle}"`, type: 'success' })
        setEditingCategory(null)
        fetchData()
      } else {
        const errData = await res.json()
        setActionMessage({ text: errData.error || 'Failed to update definition', type: 'error' })
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error', type: 'error' })
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading dataset statistics...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner and Summary */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              📦 Dataset Provenance & Taxonomy Maintenance
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Export verified training sets, validate record provenance on import, and maintain official Eugenio & Andress category definitions.
            </p>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary-red, #8F000D), var(--primary-red-dark, #5c000a))',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            {isExporting ? 'Exporting...' : '📥 Export Verified Dataset (JSON)'}
          </button>
        </div>

        {actionMessage && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: actionMessage.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${actionMessage.type === 'success' ? '#10b98144' : '#ef444444'}`,
            }}
          >
            {actionMessage.text}
          </div>
        )}
      </div>

      {/* Dataset Health and Representation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Data Health & Integrity
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Archive Records:</span>
              <strong>{summary?.totalRecords}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
              <span>Human-Verified (Eligible for ML):</span>
              <strong>{summary?.totalVerified}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
              <span>Pending Review:</span>
              <strong>{summary?.totalPending}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7' }}>
              <span>Uncertain (Flagged for Fieldwork):</span>
              <strong>{summary?.totalUncertain}</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Taxonomy Balance Alert
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', lineHeight: '1.5' }}>
            {summary?.missingGenres && summary.missingGenres.length > 0 ? (
              <div>
                <strong style={{ color: '#ef4444' }}>Missing Categories (0 verified samples):</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {summary.missingGenres.map((g: string) => (
                    <span
                      key={g}
                      style={{
                        padding: '2px 8px',
                        background: '#ef444422',
                        color: '#ef4444',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span style={{ color: '#10b981', fontWeight: 700 }}>
                All 8 official Eugenio oral literature categories have verified examples.
              </span>
            )}

            {summary?.underrepresentedGenres && summary.underrepresentedGenres.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong style={{ color: '#f59e0b' }}>Underrepresented Categories (&lt; 3 verified samples):</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {summary.underrepresentedGenres.map((g: string) => (
                    <span
                      key={g}
                      style={{
                        padding: '2px 8px',
                        background: '#f59e0b22',
                        color: '#f59e0b',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Dataset Tool */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
          📥 Import Literature Records
        </h3>
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Paste a JSON array of records. To prevent poisoning, all imported records default to <strong>PENDING</strong> review status unless signed reviewer provenance is explicitly validated.
        </p>

        <textarea
          rows={4}
          value={importJson}
          onChange={e => setImportJson(e.target.value)}
          placeholder='[ { "title": "Example", "content": "Narrative...", "type": "ORAL_LITERATURE", "source": "Fieldwork 2024" } ]'
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        />

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            disabled={!importJson.trim()}
            onClick={handleImport}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--primary-red, #8F000D)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: !importJson.trim() ? 'not-allowed' : 'pointer',
              opacity: !importJson.trim() ? 0.6 : 1,
            }}
          >
            Import Records
          </button>
        </div>
      </div>

      {/* Category Definitions Maintenance & AI Draft Approval */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              📖 Category Definitions & Scholarly Taxonomies
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Maintain definition guidelines used during human verification. AI-drafted definitions are marked as drafts until approved by an administrator.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'var(--bg-input)',
                border: cat.isDraft ? '1px dashed #f59e0b' : '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{cat.title}</strong>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: 'rgba(143, 0, 13, 0.1)',
                      color: 'var(--primary-red, #8F000D)',
                    }}
                  >
                    {cat.code}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({cat.framework})</span>
                  {cat.isDraft && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: '#f59e0b22',
                        color: '#f59e0b',
                        border: '1px solid #f59e0b55',
                      }}
                    >
                      AI-Draft (Requires Approval)
                    </span>
                  )}
                </div>

                <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {cat.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCategory(cat)
                  setEditTitle(cat.title)
                  setEditDesc(cat.description)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat.isDraft ? 'Approve / Edit' : 'Edit Definition'}
              </button>
            </div>
          ))}
        </div>

        {/* Modal / Inline edit definition dialog */}
        {editingCategory && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '2px solid var(--primary-red, #8F000D)',
            }}
          >
            <h4 style={{ margin: '0 0 10px', color: 'var(--text-primary)' }}>
              Edit Definition for {editingCategory.code} ({editingCategory.framework})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Title:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Scholarly Description:
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary-red, #8F000D)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Approve & Save Definition
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
