'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface BackButtonProps {
  fallbackHref?: string
  defaultLabel?: string
  style?: React.CSSProperties
  className?: string
}

export default function BackButton({
  fallbackHref = '/explore',
  defaultLabel = 'Back to Explorer',
  style,
  className = 'btn-anim',
}: BackButtonProps) {
  const router = useRouter()
  const [label, setLabel] = useState(defaultLabel)
  const [hasHistory, setHasHistory] = useState(false)
  const [targetFrom, setTargetFrom] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check if 'from' param was explicitly passed in the URL
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const fromParam = urlParams.get('from')
      if (fromParam) {
        setTargetFrom(fromParam)
        if (fromParam.includes('/explore')) setLabel('Back to Explorer')
        else if (fromParam.includes('/admin')) setLabel('Back to Admin')
        else if (fromParam.includes('/dashboard')) setLabel('Back to Dashboard')
        else if (fromParam.includes('/classification')) setLabel('Back to Classification')
        else if (fromParam.includes('/translator')) setLabel('Back to Translator')
        else setLabel('Back to Previous Page')
        setHasHistory(true)
        return
      }
    } catch (e) {
      // ignore
    }

    // 2. Check document.referrer
    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer)
        if (refUrl.origin === window.location.origin) {
          setHasHistory(true)
          const path = refUrl.pathname
          if (path.startsWith('/explore')) setLabel('Back to Explorer')
          else if (path.startsWith('/admin')) setLabel('Back to Admin')
          else if (path.startsWith('/dashboard')) setLabel('Back to Dashboard')
          else if (path.startsWith('/classification')) setLabel('Back to Classification')
          else if (path.startsWith('/translator')) setLabel('Back to Translator')
          else if (path === '/') setLabel('Back to Home')
          else setLabel('Back')
          return
        }
      } catch (e) {
        // ignore invalid URL
      }
    }

    // 3. Check window.history
    if (window.history.length > 1) {
      setHasHistory(true)
    }
  }, [defaultLabel])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (targetFrom) {
      router.push(targetFrom)
      return
    }

    // If we have browser history from the same origin, router.back() restores
    // the previous URL, its scroll position, and search params.
    if (hasHistory && window.history.length > 1) {
      router.back()
      return
    }

    // Check if we saved the last explore URL in sessionStorage
    try {
      const savedExplore = sessionStorage.getItem('manobolit_last_explore_url')
      if (savedExplore) {
        router.push(savedExplore)
        return
      }
    } catch (e) {
      // sessionStorage unavailable
    }

    router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--brand-accent)',
        textDecoration: 'none',
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        ...style,
      }}
    >
      <span aria-hidden="true">←</span> {label}
    </button>
  )
}
