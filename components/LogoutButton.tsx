'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/admin/login')
        router.refresh()
      }}
      className="btn-anim"
      style={{
        padding: '10px 18px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: loading ? 'default' : 'pointer',
      }}
    >
      {loading && <span className="btn-spinner" style={{ borderTopColor: 'var(--text-secondary)', borderColor: 'var(--border-color)', borderTopStyle: 'solid' }} aria-hidden="true" />}
      {loading ? 'Signing out…' : 'Log Out'}
    </button>
  )
}
