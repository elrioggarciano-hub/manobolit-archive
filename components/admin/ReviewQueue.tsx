'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ReviewEntry {
  id: string
  title: string
  manoboTitle?: string | null
  englishTitle?: string | null
  type: string
  content: string
  transcription?: string | null
  translation?: string | null
  bisayaTranslation?: string | null
  source: string
  communityLocation?: string | null
  municipality?: string | null
  province?: string | null
  genre: string
  themes: string[]
  reviewStatus: 'PENDING' | 'VERIFIED' | 'UNCERTAIN'
  isHashMismatched?: boolean
  verifiedGenre?: string | null
  verifiedThemes?: string[]
  reviewerId?: string | null
  reviewedAt?: string | null
  reviewNotes?: string | null
  contentHash?: string | null
  suggestedGenre: string
  suggestedThemes: string[]
  predictionSource: string
  modelVersion: string
  confidenceScore: number
  probabilities: Record<string, number>
  reviewHistory?: Array<{
    id: string
    decision: string
    approvedGenre?: string | null
    reviewerId: string
    createdAt: string
    notes?: string | null
  }>
}

export interface CategoryDef {
  id: string
  code: string
  type: string
  title: string
  framework: string
  description: string
  isDraft: boolean
}

const ALL_GENRES = [
  'MYTH', 'LEGEND', 'FOLKTALE', 'EPIC',
  'RIDDLE', 'PROVERB', 'SONG', 'CHANT'
]

const GENRE_COLORS: Record<string, string> = {
  MYTH: '#8b5cf6',
  LEGEND: '#3b82f6',
  FOLKTALE: '#10b981',
  EPIC: '#f59e0b',
  RIDDLE: '#ec4899',
  PROVERB: '#14b8a6',
  SONG: '#f97316',
  CHANT: '#6366f1',
}

export default function ReviewQueue() {
  const [entries, setEntries] = useState<ReviewEntry[]>([])
  const [categories, setCategories] = useState<CategoryDef[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'UNCERTAIN'>('PENDING')
  const [selectedEntry, setSelectedEntry] = useState<ReviewEntry | null>(null)
  const [correctingGenre, setCorrectingGenre] = useState<string>('')
  const [reviewerNotes, setReviewerNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showDefinitionsSidebar, setShowDefinitionsSidebar] = useState(true)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/review?status=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      }
    } catch (e) {
      console.error('Failed to load review queue:', e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/ml/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (e) {
      console.error('Failed to load categories:', e)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDecision = async (
    entry: ReviewEntry,
    decision: 'CONFIRMED' | 'CORRECTED' | 'UNCERTAIN',
    overrideGenre?: string
  ) => {
    setIsSubmitting(true)
    setActionMessage(null)

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: entry.id,
          decision,
          approvedGenre: overrideGenre || (decision === 'CONFIRMED' ? entry.suggestedGenre : undefined),
          notes: reviewerNotes.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setActionMessage({
          text: `Verification recorded: ${decision} for "${entry.title}"`,
          type: 'success',
        })
        setSelectedEntry(null)
        setReviewerNotes('')
        setCorrectingGenre('')
        fetchQueue()
      } else {
        const errData = await res.json()
        setActionMessage({ text: errData.error || 'Failed to save review', type: 'error' })
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner and Filter Bar */}
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
              📋 Human-Verification Queue
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Authorized reviewers confirm, correct, or mark classifications as uncertain. Only human-verified records are admitted into the retraining pipeline.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(['PENDING', 'VERIFIED', 'UNCERTAIN', 'ALL'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: filter === tab ? '1px solid var(--primary-red, #8F000D)' : '1px solid var(--border-color)',
                  background: filter === tab ? 'var(--primary-red, #8F000D)' : 'var(--bg-input)',
                  color: filter === tab ? '#fff' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'PENDING' && '⏳ '}
                {tab === 'VERIFIED' && '✅ '}
                {tab === 'UNCERTAIN' && '❓ '}
                {tab}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowDefinitionsSidebar(!showDefinitionsSidebar)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: showDefinitionsSidebar ? 'rgba(143, 0, 13, 0.1)' : 'var(--bg-input)',
                color: showDefinitionsSidebar ? 'var(--primary-red, #8F000D)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              📖 {showDefinitionsSidebar ? 'Hide Taxonomy' : 'Show Taxonomy'}
            </button>
          </div>
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

      {/* Main Grid: Entries Queue + Category Taxonomy Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: showDefinitionsSidebar ? '1fr 340px' : '1fr', gap: '24px' }}>
        {/* Left Column: Entries List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading review queue...
            </div>
          ) : entries.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-color)',
                borderRadius: '14px',
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
              <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>No records in {filter} queue</h3>
              <p style={{ margin: 0, fontSize: '13px' }}>
                All records matching this filter have been processed or none currently exist.
              </p>
            </div>
          ) : (
            entries.map(entry => {
              const genreColor = GENRE_COLORS[entry.genre] || '#6366f1'
              const isSelected = selectedEntry?.id === entry.id

              return (
                <div
                  key={entry.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: entry.isHashMismatched
                      ? '2px solid #ef4444'
                      : isSelected
                        ? '2px solid var(--primary-red, #8F000D)'
                        : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Status & Warning Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background:
                            entry.reviewStatus === 'VERIFIED'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : entry.reviewStatus === 'UNCERTAIN'
                                ? 'rgba(168, 85, 247, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                          color:
                            entry.reviewStatus === 'VERIFIED'
                              ? '#10b981'
                              : entry.reviewStatus === 'UNCERTAIN'
                                ? '#a855f7'
                                : '#f59e0b',
                          border: `1px solid ${entry.reviewStatus === 'VERIFIED'
                              ? '#10b98144'
                              : entry.reviewStatus === 'UNCERTAIN'
                                ? '#a855f744'
                                : '#f59e0b44'
                            }`,
                        }}
                      >
                        {entry.reviewStatus === 'VERIFIED' && 'VERIFIED (Human-Approved)'}
                        {entry.reviewStatus === 'UNCERTAIN' && 'UNCERTAIN (Needs Consultation)'}
                        {entry.reviewStatus === 'PENDING' && 'PENDING REVIEW'}
                      </span>

                      {entry.isHashMismatched && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid #ef444444',
                          }}
                        >
                          ⚠️ Text modified after review • Re-verification required
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Source: <strong>{entry.source}</strong>
                      {entry.communityLocation && ` • ${entry.communityLocation}`}
                    </div>
                  </div>

                  {/* Title and Metadata */}
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {entry.title}
                    </h3>
                    {entry.manoboTitle && (
                      <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--primary-red, #8F000D)' }}>
                        {entry.manoboTitle}
                      </div>
                    )}
                  </div>

                  {/* Text Snippets */}
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      maxHeight: '160px',
                      overflowY: 'auto',
                    }}
                  >
                    {entry.transcription && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '11px', textTransform: 'uppercase' }}>
                          Agusan Manobo Transcription:
                        </strong>
                        <p style={{ margin: '2px 0 0', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                          {entry.transcription}
                        </p>
                      </div>
                    )}
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '11px', textTransform: 'uppercase' }}>
                        Content / Description:
                      </strong>
                      <p style={{ margin: '2px 0 0', color: 'var(--text-primary)' }}>{entry.content}</p>
                    </div>
                  </div>

                  {/* Suggested Prediction Box */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(143, 0, 13, 0.04)',
                      border: '1px solid rgba(143, 0, 13, 0.15)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '13px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-secondary)', marginRight: '6px' }}>Suggested Category:</span>
                      <strong style={{ color: genreColor, fontSize: '14px' }}>{entry.suggestedGenre}</strong>
                      <span
                        style={{
                          marginLeft: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: entry.predictionSource === 'ML_PIPELINE' ? '#10b98122' : '#f59e0b22',
                          color: entry.predictionSource === 'ML_PIPELINE' ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {entry.predictionSource} ({entry.modelVersion})
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      Model Confidence: <strong>{Math.round(entry.confidenceScore * 100)}%</strong>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDecision(entry, 'CONFIRMED')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#10b981',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Confirm ({entry.suggestedGenre})
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedEntry(null)
                          } else {
                            setSelectedEntry(entry)
                            setCorrectingGenre(entry.genre)
                          }
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: isSelected ? 'var(--primary-red, #8F000D)' : 'var(--bg-input)',
                          color: isSelected ? '#fff' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ {isSelected ? 'Cancel Edit' : 'Correct Category...'}
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDecision(entry, 'UNCERTAIN')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          background: 'rgba(168, 85, 247, 0.1)',
                          color: '#a855f7',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        ❓ Mark Uncertain
                      </button>
                    </div>

                    {entry.reviewerId && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Reviewed by <strong>{entry.reviewerId}</strong>
                        {entry.reviewedAt && ` on ${new Date(entry.reviewedAt).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>

                  {/* Inline Correction Form when user clicks "Correct Category..." */}
                  {isSelected && (
                    <div
                      style={{
                        marginTop: '10px',
                        background: 'var(--bg-input)',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Select Proper Eugenio (1993) Genre:
                        </label>
                        <select
                          value={correctingGenre}
                          onChange={e => setCorrectingGenre(e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        >
                          {ALL_GENRES.map(g => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                          Reviewer Notes (Optional context, cultural justification):
                        </label>
                        <input
                          type="text"
                          value={reviewerNotes}
                          onChange={e => setReviewerNotes(e.target.value)}
                          placeholder="e.g. Verified against Catipay & Curato informant fieldwork..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleDecision(entry, 'CORRECTED', correctingGenre)}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'var(--primary-red, #8F000D)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {isSubmitting ? 'Saving...' : `Save as ${correctingGenre}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Audit Trail toggle */}
                  {entry.reviewHistory && entry.reviewHistory.length > 0 && (
                    <details style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                        Review Audit Trail ({entry.reviewHistory.length} recorded events)
                      </summary>
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {entry.reviewHistory.map(h => (
                          <div key={h.id} style={{ padding: '4px 8px', background: 'var(--bg-input)', borderRadius: '4px' }}>
                            {new Date(h.createdAt).toLocaleString()} • <strong>{h.decision}</strong> by {h.reviewerId}
                            {h.approvedGenre && ` (Approved: ${h.approvedGenre})`}
                            {h.notes && ` — "${h.notes}"`}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Category Taxonomy Sidebar */}
        {showDefinitionsSidebar && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '20px',
              position: 'sticky',
              top: '100px',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                📖 Category Taxonomies
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Official Eugenio (1993) definitions to guide objective human verification without relying solely on keywords.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories
                .filter(c => c.type === 'GENRE')
                .map(cat => {
                  const color = GENRE_COLORS[cat.code] || '#6366f1'
                  return (
                    <div
                      key={cat.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        borderLeft: `4px solid ${color}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color }}>{cat.title}</strong>
                        {cat.isDraft && (
                          <span style={{ fontSize: '10px', background: '#f59e0b22', color: '#f59e0b', padding: '1px 5px', borderRadius: '4px' }}>
                            Draft
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {cat.description}
                      </p>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
