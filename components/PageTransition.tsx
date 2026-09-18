'use client'

import { usePathname } from 'next/navigation'

// Re-keys its child tree by pathname so the fade/slide-up animation
// (see .page-transition in globals.css) replays on every navigation.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  )
}
