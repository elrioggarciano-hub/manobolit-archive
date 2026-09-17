'use client'

import { useEffect, useState } from 'react'

// For inline-style layouts (grid-template-columns, flex-direction, etc.) that
// can't be overridden by a stylesheet media query, since inline styles always
// win over external CSS specificity.
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])

  return isMobile
}
