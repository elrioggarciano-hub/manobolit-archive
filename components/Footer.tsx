'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/context/LanguageContext'

export default function Footer() {
  const pathname = usePathname()
  const { language, setLanguage, t, languages } = useLanguage()

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
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
              {t('footer_tagline')}
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
              {t('footer_nav_heading')}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: t('footer_nav_explorer'), href: '/explore' },
                { label: t('footer_nav_rules'), href: '/classification' },
                { label: t('footer_nav_about'), href: '/about' },
                { label: t('footer_nav_ethics'), href: '/ethics' },
              ].map(link => (
                <Link 
                  key={link.href} 
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

          {/* Column 3: Language Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#ffffff', // White label
                letterSpacing: '0.1em',
              }}
            >
              {t('footer_language_heading')}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {languages.map(opt => {
                const isSelected = language === opt.code
                return (
                  <button
                    key={opt.code}
                    onClick={() => setLanguage(opt.code)}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(240, 144, 143, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid #f0908f' : '1px solid #27272a',
                      color: isSelected ? '#ffffff' : '#cbd5e1',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      maxWidth: '220px',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.borderColor = '#3f3f46'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                        e.currentTarget.style.borderColor = '#27272a'
                      }
                    }}
                  >
                    <span>
                      {opt.label}{' '}
                      <span style={{ fontSize: '11px', color: isSelected ? '#f0908f' : '#64748b', marginLeft: '4px' }}>
                        ({opt.shortLabel})
                      </span>
                    </span>
                    {isSelected && (
                      <span style={{ color: '#f0908f', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Column 4: Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#ffffff', // White label
                letterSpacing: '0.1em',
              }}
            >
              {t('footer_contact_heading')}
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
                {t('footer_location')}
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
          <span>&copy; {new Date().getFullYear()} ManoboLit Archive. {t('footer_rights')}</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/privacy" className="btn-anim" style={{ color: '#64748b', textDecoration: 'none' }}>
              {t('footer_privacy')}
            </Link>
            <Link href="/terms" className="btn-anim" style={{ color: '#64748b', textDecoration: 'none' }}>
              {t('footer_terms')}
            </Link>
            <Link href="/ethics" className="btn-anim" style={{ color: '#64748b', textDecoration: 'none' }}>
              {t('footer_ethical_access')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
