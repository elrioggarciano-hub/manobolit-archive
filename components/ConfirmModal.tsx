'use client'

import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Reusable confirm dialog: fades the overlay in, scales the card in, and
// mirrors both out on close instead of unmounting abruptly.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const [rendered, setRendered] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      setClosing(false)
    } else if (rendered) {
      setClosing(true)
      const t = setTimeout(() => setRendered(false), 180)
      return () => clearTimeout(t)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!rendered) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [rendered, loading, onCancel])

  if (!rendered) return null

  return (
    <div
      className={`modal-overlay${closing ? ' closing' : ''}`}
      role="presentation"
      onClick={() => !loading && onCancel()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className={`modal-content${closing ? ' closing' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.35)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <h3 id="confirm-modal-title" style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 22px', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-anim"
            style={{
              padding: '9px 18px',
              background: 'transparent',
              border: '1px solid var(--border-hover)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-anim"
            style={{
              padding: '9px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: danger ? '#dc2626' : 'var(--primary-red-dark)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading && <span className="btn-spinner" aria-hidden="true" />}
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
