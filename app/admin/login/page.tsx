'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-3.22 4.44M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 12.6 12.6 4.6a2 2 0 0 0-1.4-.6H5a1 1 0 0 0-1 1v6.2a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8Z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

const FEATURES = [
  { label: 'Preserve', desc: 'Digitally archive oral literature and audio recordings', icon: ArchiveIcon },
  { label: 'Classify', desc: 'Automatic genre and theme classification', icon: TagIcon },
  { label: 'Retrieve', desc: 'Multi-dimensional search across the archive', icon: SearchIcon },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [backHover, setBackHover] = useState(false)
  const [cardHover, setCardHover] = useState(false)
  const [buttonHover, setButtonHover] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      router.push(searchParams.get('next') || '/admin')
      router.refresh()
    } catch {
      setError('Could not reach the server. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        fontFamily: 'Inter, sans-serif',
        background: 'var(--bg-main)',
      }}
    >
      {/* Left brand panel — hidden on small/medium screens */}
      <div
        className="hidden lg:flex"
        style={{
          width: '42%',
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 48px',
          background: 'linear-gradient(175deg, #9c0611 0%, var(--primary-red-dark) 55%, #5c000a 100%)',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/weave.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.07,
          }}
        />

        <Link
          href="/"
          onMouseEnter={() => setBackHover(true)}
          onMouseLeave={() => setBackHover(false)}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: backHover ? '#fff' : 'rgba(255,255,255,0.72)',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            width: 'fit-content',
            transition: 'color 0.15s, gap 0.15s',
          }}
        >
          <span style={{ display: 'flex', transform: backHover ? 'translateX(-2px)' : 'translateX(0)', transition: 'transform 0.15s' }}>
            <ArrowLeftIcon />
          </span>
          Back to Archive
        </Link>

        <div style={{ position: 'relative' }}>
          <h1
            style={{
              margin: '0 0 16px',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '42px',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: '#fff',
            }}
          >
            ManoboLit Archive
          </h1>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.65, color: 'rgba(255,255,255,0.72)', maxWidth: '360px' }}>
            A rule-based classification and retrieval system preserving Agusan Manobo oral literature and folk songs for future generations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '40px' }}>
            {FEATURES.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#f1b80d',
                  }}
                >
                  <item.icon />
                </div>
                <div style={{ paddingTop: '4px' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '13.5px', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: '12.5px', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.02em' }}>
          Administrator access only
        </p>
      </div>

      {/* Right form panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        {/* Mobile / tablet compact brand header */}
        <div className="lg:hidden" style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h1
            style={{
              margin: '0 0 6px',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--primary-red-dark)',
            }}
          >
            ManoboLit Archive
          </h1>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '320px', marginInline: 'auto' }}>
            Preserving Agusan Manobo oral literature and folk songs.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="admin-login-card"
          onMouseEnter={() => setCardHover(true)}
          onMouseLeave={() => setCardHover(false)}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            background: 'var(--bg-surface)',
            border: '1px solid rgba(143, 0, 13, 0.14)',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: cardHover
              ? '0 1px 2px rgba(15, 23, 42, 0.05), 0 16px 32px -12px rgba(143, 0, 13, 0.18)'
              : '0 1px 2px rgba(15, 23, 42, 0.04), var(--card-shadow)',
            transition: 'box-shadow 0.25s ease',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, var(--primary-red-dark), var(--primary-red))',
            }}
          />

          <div
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'var(--primary-red-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', marginBottom: '20px',
            }}
          >
            <LockIcon />
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
            Admin Login
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Sign in to manage the ManoboLit Archive.
          </p>

          <label htmlFor="admin-password" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <span
              style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: focused ? 'var(--primary-red-dark)' : 'var(--text-muted)',
                display: 'flex', pointerEvents: 'none', transition: 'color 0.15s',
              }}
            >
              <LockIcon />
            </span>
            <input
              id="admin-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'admin-password-error' : undefined}
              style={{
                width: '100%',
                padding: '12px 44px',
                borderRadius: '10px',
                border: `1.5px solid ${error ? '#dc2626' : focused ? 'var(--primary-red-dark)' : 'var(--border-color)'}`,
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxShadow: focused ? '0 0 0 3px rgba(143, 0, 13, 0.12)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              style={{
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', padding: '6px', borderRadius: '6px',
              }}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          <div role="alert" aria-live="polite" style={{ minHeight: error ? 'auto' : '0px', marginBottom: error ? '16px' : '20px' }}>
            {error && (
              <div
                id="admin-password-error"
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  color: '#dc2626', fontSize: '12.5px', fontWeight: 600,
                }}
              >
                <AlertIcon />
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => setButtonHover(false)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px 22px',
              background: buttonHover && !loading && password ? 'var(--primary-red)' : 'var(--primary-red-dark)',
              color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.6 : 1,
              transform: buttonHover && !loading && password ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: buttonHover && !loading && password ? '0 6px 16px -4px rgba(143, 0, 13, 0.4)' : 'none',
              transition: 'opacity 0.15s, background-color 0.15s, transform 0.15s, box-shadow 0.15s',
            }}
          >
            {loading && (
              <span
                className="admin-login-spinner"
                aria-hidden="true"
                style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                  display: 'inline-block',
                }}
              />
            )}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              margin: '24px 0 0', fontSize: '11.5px', color: 'var(--text-muted)',
            }}
          >
            <ShieldIcon />
            Protected area &bull; Authorized personnel only
          </div>
        </form>
      </div>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
