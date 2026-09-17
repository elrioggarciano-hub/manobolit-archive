'use client'

import { useEffect } from 'react'

const INTERACTIVE_SELECTOR = 'button, a, [role="button"], input[type="checkbox"], input[type="radio"], label, select'

// Global click feedback: on every click of an interactive element, spawn a
// small radiating ripple at the cursor position. Mounted once in the root
// layout so every page/button gets it for free, without touching each button.
export default function ClickRipple() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (!target?.closest(INTERACTIVE_SELECTOR)) return

      const ripple = document.createElement('span')
      ripple.className = 'click-ripple-pulse'
      ripple.style.left = `${e.clientX}px`
      ripple.style.top = `${e.clientY}px`
      document.body.appendChild(ripple)

      const remove = () => ripple.remove()
      ripple.addEventListener('animationend', remove, { once: true })
      setTimeout(remove, 700) // fallback in case animationend doesn't fire
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
