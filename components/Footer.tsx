'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  if (pathname === '/explore') return null

  return (
    <footer 
      style={{
        background: '#18181b',
        color: '#f8fafc',
        padding: '64px 24px 100px', // Extra bottom padding so it is not hidden by the floating audio player
        fontFamily: 'Inter, sans-serif',
        borderTop: '1px solid #27272a',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '40px',
            marginBottom: '40px' 
          }}
        >
          {/* Column 1: Logo & Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 
              style={{ 
                margin: 0,
                fontSize: '30px',
                fontWeight: 700,
                color: '#f0908f',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}
            >
              ManoboLit Archive
            </h2>
            <p 
              style={{ 
                margin: 0, 
                fontSize: '13px', 
                color: '#94a3b8', 
                lineHeight: 1.6,
                maxWidth: '320px',
              }}
            >
              A digital sanctuary for the oral traditions of the Agusan Manobo people. Powered by scholarly research and cultural reverence.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#ffffff', // White label
                letterSpacing: '0.1em',
              }}
            >
              NAVIGATION
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Archive Explorer', href: '/' },
                { label: 'Taxonomy Rules', href: '/dashboard' },
                { label: 'Research Papers', href: '/admin' },
                { label: 'Cultural Ethics', href: '/' },
              ].map(link => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  style={{
                    fontSize: '13px',
                    color: '#cbd5e1',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ffffff' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#ffffff', // White label
                letterSpacing: '0.1em',
              }}
            >
              CONTACT
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a 
                href="mailto:preservation@manobolit.org"
                style={{
                  fontSize: '13px',
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1' }}
              >
                preservation@manobolit.org
              </a>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                Agusan del Sur, Philippines
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Credits Line */}
        <div 
          style={{ 
            borderTop: '1px solid #27272a', 
            paddingTop: '20px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#64748b'
          }}
        >
          <span>&copy; {new Date().getFullYear()} ManoboLit Archive. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
