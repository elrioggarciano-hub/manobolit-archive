'use client'

import { useState, useEffect } from 'react'

export interface ModelRecord {
  id: string
  version: string
  algorithm: string
  status: 'ACTIVE' | 'ARCHIVED' | 'REJECTED' | 'CANDIDATE'
  metrics: {
    macro_f1?: number
    accuracy?: number
    sample_size?: number
    per_class?: Record<string, { f1_score: number; precision: number; recall: number; support: number }>
    source?: string
    note?: string
  }
  macroF1?: number | null
  accuracy?: number | null
  datasetSize: number
  verifiedCounts: Record<string, number>
  promotionReason?: string | null
  activatedAt?: string | null
  createdAt: string
}

export interface TrainingJob {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  trigger: string
  datasetSize: number
  newRecordsCount: number
  candidateVersion?: string | null
  evaluationResults?: any
  promotionDecision?: string | null
  errorMessage?: string | null
  startedAt: string
  completedAt?: string | null
}

export default function MLMonitoring() {
  const [activeVersion, setActiveVersion] = useState<string>('rules-baseline')
  const [isMLActive, setIsMLActive] = useState<boolean>(false)
  const [models, setModels] = useState<ModelRecord[]>([])
  const [jobs, setJobs] = useState<TrainingJob[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [triggering, setTriggering] = useState<boolean>(false)
  const [forceRetrain, setForceRetrain] = useState<boolean>(false)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [autoPromotionPaused, setAutoPromotionPaused] = useState<boolean>(false)

  const fetchData = async () => {
    try {
      const [modelsRes, summaryRes] = await Promise.all([
        fetch('/api/ml/models'),
        fetch('/api/ml/dataset/summary'),
      ])

      if (modelsRes.ok) {
        const mData = await modelsRes.json()
        setActiveVersion(mData.activeVersion)
        setIsMLActive(mData.isMLActive)
        setModels(mData.models || [])
        setJobs(mData.recentJobs || [])
      }

      if (summaryRes.ok) {
        const sData = await summaryRes.json()
        setSummary(sData)
      }
    } catch (e) {
      console.error('Failed to load ML monitoring data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleTriggerTraining = async () => {
    setTriggering(true)
    setActionMessage(null)

    try {
      const res = await fetch('/api/ml/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'MANUAL', force: forceRetrain }),
      })

      const data = await res.json()
      if (res.ok) {
        if (data.status === 'SKIPPED_UNCHANGED') {
          setActionMessage({
            text: `Training skipped: ${data.message} Use 'Force retraining' if you wish to retrain anyway.`,
            type: 'info',
          })
        } else if (data.status === 'INSUFFICIENT_DATA') {
          setActionMessage({
            text: `Cannot train: ${data.message}`,
            type: 'error',
          })
        } else if (data.promoted) {
          setActionMessage({
            text: `🎉 Retraining succeeded! Candidate ${data.candidate_version} activated (${data.promotion_reason}).`,
            type: 'success',
          })
        } else {
          setActionMessage({
            text: `Retraining completed: Candidate evaluated but not promoted (${data.promotion_reason || data.status}). Current model preserved.`,
            type: 'info',
          })
        }
        fetchData()
      } else {
        setActionMessage({ text: data.error || 'Failed to dispatch retraining job', type: 'error' })
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error triggering training', type: 'error' })
    } finally {
      setTriggering(false)
    }
  }

  const handleRollback = async (version: string) => {
    if (!confirm(`Are you sure you want to activate model version "${version}"?`)) return
    setActionMessage(null)

    try {
      const res = await fetch('/api/ml/models/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      })

      if (res.ok) {
        const data = await res.json()
        setActionMessage({ text: data.message || `Activated ${version}`, type: 'success' })
        fetchData()
      } else {
        const errData = await res.json()
        setActionMessage({ text: errData.error || 'Rollback failed', type: 'error' })
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error', type: 'error' })
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading ML pipeline status...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Active Model Status Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Active Model & Mode */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Classification Engine
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isMLActive ? '#10b981' : '#f59e0b',
                  boxShadow: `0 0 8px ${isMLActive ? '#10b981' : '#f59e0b'}`,
                }}
              />
              <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
                {isMLActive ? 'Machine Learning (scikit-learn)' : 'Rule-Based Baseline (Fallback)'}
              </strong>
            </div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Active Version: <strong style={{ color: 'var(--primary-red, #8F000D)' }}>{activeVersion}</strong>
            </div>
          </div>

          <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isMLActive
              ? 'Serving predictions from serialized TF-IDF pipeline.'
              : 'Serving predictions from Eugenio (1993) expert rules until ML candidate is verified.'}
          </div>
        </div>

        {/* Card 2: Verified Training Data Eligibility */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Verified Training Data Status
          </div>
          <div style={{ marginTop: '8px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {summary?.totalVerified || 0}{' '}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              eligible samples ({summary?.totalPending || 0} pending review)
            </span>
          </div>

          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            {summary?.isSufficientForTraining ? (
              <span style={{ color: '#10b981', fontWeight: 700 }}>
                ✓ Sufficient data for supervised training
              </span>
            ) : (
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                ⚠️ {summary?.message}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Retraining Controls */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Automation Controls
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={forceRetrain}
                  onChange={e => setForceRetrain(e.target.checked)}
                />
                Force retrain even if data unchanged
              </label>
            </div>
            <div style={{ marginTop: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={autoPromotionPaused}
                  onChange={e => setAutoPromotionPaused(e.target.checked)}
                />
                Pause automatic model promotion
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={triggering}
            onClick={handleTriggerTraining}
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary-red, #8F000D), var(--primary-red-dark, #5c000a))',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: triggering ? 'not-allowed' : 'pointer',
              opacity: triggering ? 0.7 : 1,
            }}
          >
            {triggering ? '⚙️ Training Pipeline Running...' : '⚡ Trigger Retraining Now'}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            background:
              actionMessage.type === 'success'
                ? 'rgba(16, 185, 129, 0.1)'
                : actionMessage.type === 'error'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
            color:
              actionMessage.type === 'success'
                ? '#10b981'
                : actionMessage.type === 'error'
                ? '#ef4444'
                : '#3b82f6',
            border: `1px solid ${
              actionMessage.type === 'success'
                ? '#10b98144'
                : actionMessage.type === 'error'
                ? '#ef444444'
                : '#3b82f644'
            }`,
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Verified Distribution Grid */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
          📊 Verified Records Distribution by Category
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
          {summary?.verifiedCounts &&
            Object.entries(summary.verifiedCounts).map(([cat, count]: [string, any]) => {
              const isMissing = count === 0
              const isLow = count > 0 && count < 3

              return (
                <div
                  key={cat}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: isMissing ? 'rgba(239, 68, 68, 0.05)' : isLow ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-input)',
                    border: isMissing
                      ? '1px dashed #ef444455'
                      : isLow
                      ? '1px solid #f59e0b55'
                      : '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{cat}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: isMissing ? '#ef4444' : isLow ? '#f59e0b' : 'var(--text-primary)', marginTop: '4px' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {isMissing ? 'Missing' : isLow ? 'Low count' : 'Eligible'}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Model Registry History */}
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
              🏛 Model Registry & Version History
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Immutable records of candidate versions, validation evaluations, and promotion decisions with one-click rollback.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 8px' }}>Version</th>
                <th style={{ padding: '10px 8px' }}>Algorithm</th>
                <th style={{ padding: '10px 8px' }}>Macro-F1</th>
                <th style={{ padding: '10px 8px' }}>Accuracy</th>
                <th style={{ padding: '10px 8px' }}>Dataset Size</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px' }}>Promotion Decision</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Fallback rule baseline row */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 8px', fontWeight: 700 }}>rules-baseline</td>
                <td style={{ padding: '10px 8px' }}>DomainExpertRules (Eugenio 1993)</td>
                <td style={{ padding: '10px 8px' }}>—</td>
                <td style={{ padding: '10px 8px' }}>—</td>
                <td style={{ padding: '10px 8px' }}>Rule-based</td>
                <td style={{ padding: '10px 8px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: activeVersion === 'rules-baseline' ? '#10b98122' : '#64748b22',
                      color: activeVersion === 'rules-baseline' ? '#10b981' : '#64748b',
                    }}
                  >
                    {activeVersion === 'rules-baseline' ? 'ACTIVE' : 'ARCHIVED'}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>Domain baseline</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                  {activeVersion !== 'rules-baseline' && (
                    <button
                      type="button"
                      onClick={() => handleRollback('rules-baseline')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      Rollback to Rules
                    </button>
                  )}
                </td>
              </tr>

              {models
                .filter(m => m.version !== 'rules-baseline')
                .map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--primary-red, #8F000D)' }}>
                      {m.version}
                    </td>
                    <td style={{ padding: '10px 8px' }}>{m.algorithm}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700 }}>
                      {m.macroF1 ? `${Math.round(m.macroF1 * 100)}%` : '—'}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      {m.accuracy ? `${Math.round(m.accuracy * 100)}%` : '—'}
                    </td>
                    <td style={{ padding: '10px 8px' }}>{m.datasetSize}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: m.status === 'ACTIVE' ? '#10b98122' : '#64748b22',
                          color: m.status === 'ACTIVE' ? '#10b981' : '#64748b',
                        }}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                      {m.promotionReason || '—'}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      {m.status !== 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleRollback(m.version)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          Activate / Rollback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retraining Jobs Audit Log */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
          📑 Retraining Jobs Execution Log
        </h3>
        {jobs.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            No background retraining jobs executed yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jobs.map(j => (
              <div
                key={j.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-input)',
                  fontSize: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{j.trigger} Trigger</strong> •{' '}
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background:
                        j.status === 'COMPLETED'
                          ? '#10b98122'
                          : j.status === 'SKIPPED'
                          ? '#3b82f622'
                          : '#ef444422',
                      color:
                        j.status === 'COMPLETED'
                          ? '#10b981'
                          : j.status === 'SKIPPED'
                          ? '#3b82f6'
                          : '#ef4444',
                    }}
                  >
                    {j.status}
                  </span>{' '}
                  • Decision: <strong>{j.promotionDecision || '—'}</strong>
                  {j.candidateVersion && ` (${j.candidateVersion})`}
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  {new Date(j.startedAt).toLocaleString()}
                  {j.errorMessage && ` • Error: ${j.errorMessage}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
