'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/admin/login')
        router.refresh()
      }}
      style={{
        padding: '10px 18px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
      }}
    >
      Log Out
    </button>
  )
}
