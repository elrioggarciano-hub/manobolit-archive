'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/lib/context/LanguageContext'
import { Language } from '@/lib/i18n/translations'

interface LanguageSelectorProps {
  compact?: boolean
  className?: string
}

export default function LanguageSelector({ compact = false, className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, languages, currentOption, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={t('select_language')}
        className="btn-anim"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '32px',
          padding: compact ? '0 10px' : '0 12px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-input)',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.style.borderColor = 'var(--brand-accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.borderColor = 'var(--border-color)'
        }}
      >
        {/* Globe icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>

        <span>{currentOption.shortLabel}</span>

        {/* Small dropdown chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="dropdown-anim"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: '210px',
            background: 'var(--bg-surface, #18181b)',
            border: '1px solid var(--border-color, #27272a)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            padding: '6px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '6px 10px 4px',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-muted, #94a3b8)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {t('select_language')}
          </div>

          {languages.map((opt) => {
            const isSelected = language === opt.code
            return (
              <button
                key={opt.code}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  setLanguage(opt.code as Language)
                  setIsOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(143, 0, 13, 0.12)' : 'transparent',
                  border: 'none',
                  color: isSelected ? 'var(--brand-accent, #f0908f)' : 'var(--text-primary, #f8fafc)',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ lineHeight: 1.2 }}>{opt.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                    {opt.nativeLabel}
                  </span>
                </div>
                {isSelected && (
                  <span style={{ color: 'var(--brand-accent, #f0908f)', fontSize: '13px', fontWeight: 'bold' }}>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

