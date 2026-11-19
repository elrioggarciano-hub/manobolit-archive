'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MANUAL_METADATA, MANUAL_CHAPTERS, ManualChapter, ManualSection } from '@/lib/manual/manualData'

interface Props {
  initialRole?: string
}

export default function ManualClient({ initialRole }: Props) {
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'PUBLIC' | 'ADMIN'>(
    initialRole === 'admin' ? 'ADMIN' : 'ALL'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSectionId, setActiveSectionId] = useState<string>('1.1')
  const [copiedLink, setCopiedLink] = useState(false)

  // Handle URL hash on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace('#', '')
      if (hashId) {
        setActiveSectionId(hashId)
        const el = document.getElementById(hashId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }, [])

  // Filter chapters and sections based on role and search query
  const filteredChapters = useMemo(() => {
    return MANUAL_CHAPTERS.map(ch => {
      // Role match for chapter
      if (selectedRole !== 'ALL') {
        if (selectedRole === 'PUBLIC' && ch.role === 'ADMIN') return null
        if (selectedRole === 'ADMIN' && ch.role === 'PUBLIC') {
          // Admin can see everything or admin-specific
        }
      }

      // Filter sections
      const matchingSections = ch.sections.filter(sec => {
        // Role check
        if (selectedRole === 'PUBLIC' && sec.role === 'ADMIN') return false

        // Search check
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const inTitle = sec.title.toLowerCase().includes(q)
          const inDesc = sec.description.toLowerCase().includes(q)
          const inSteps = sec.steps?.some(
            s => s.label.toLowerCase().includes(q) || s.instruction.toLowerCase().includes(q)
          )
          const inTips = sec.goodToKnow?.some(t => t.toLowerCase().includes(q))
          return inTitle || inDesc || inSteps || inTips
        }
        return true
      })

      if (matchingSections.length === 0) return null

      return {
        ...ch,
        sections: matchingSections,
      }
    }).filter(Boolean) as ManualChapter[]
  }, [selectedRole, searchQuery])

  // Flat list of all visible sections for previous/next navigation
  const allVisibleSections = useMemo(() => {
    const list: { chapter: ManualChapter; section: ManualSection }[] = []
    for (const ch of filteredChapters) {
      for (const sec of ch.sections) {
        list.push({ chapter: ch, section: sec })
      }
    }
    return list
  }, [filteredChapters])

  const currentIndex = allVisibleSections.findIndex(item => item.section.id === activeSectionId)
  const prevSection = currentIndex > 0 ? allVisibleSections[currentIndex - 1] : null
  const nextSection =
    currentIndex >= 0 && currentIndex < allVisibleSections.length - 1
      ? allVisibleSections[currentIndex + 1]
      : null

  const handleSelectSection = (secId: string) => {
    setActiveSectionId(secId)
    const el = document.getElementById(secId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `#${secId}`)
    }
  }

  const handleShareSection = (secId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/manual#${secId}`
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #09090b)',
        color: 'var(--text-primary, #f4f4f5)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Top Banner & Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border-color, #27272a)',
          background: 'var(--bg-surface, #18181b)',
          padding: '24px 20px',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--primary-red, #dc2626)',
                }}
              >
                <span>{MANUAL_METADATA.institution}</span>
                <span>•</span>
                <span>{MANUAL_METADATA.college}</span>
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(22px, 3.5vw, 32px)',
                  fontWeight: 800,
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  color: 'var(--text-primary, #ffffff)',
                }}
              >
                User Manual & Operational Help Center
              </h1>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: 'var(--text-secondary, #a1a1aa)',
                }}
              >
                Version {MANUAL_METADATA.version} • Authentic Operational Guide for Cultural Researchers & Curators
              </p>
            </div>

            {/* Quick Actions (Print / PDF, Link) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href="/manual/print"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'var(--primary-red, #8F000D)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(143, 0, 13, 0.3)',
                  transition: 'opacity 0.2s',
                }}
                title="Open Complete Printable Manual (matches reference PDF layout)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Printable PDF Version</span>
              </Link>
            </div>
          </div>

          {/* Role Filter & Search Bar */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Role Switcher Tabs */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(0,0,0,0.25)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #27272a)',
              }}
            >
              {[
                { id: 'ALL', label: '📖 Complete Manual' },
                { id: 'PUBLIC', label: '🎓 Public / Researcher' },
                { id: 'ADMIN', label: '🛡️ Archive Administrator' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRole(tab.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: selectedRole === tab.id ? 'var(--primary-red, #8F000D)' : 'transparent',
                    color: selectedRole === tab.id ? '#ffffff' : 'var(--text-secondary, #a1a1aa)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary, #71717a)',
                  display: 'flex',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search manual procedures, terms, or figures..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #27272a)',
                  background: 'var(--bg-input, rgba(0,0,0,0.3))',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar TOC + Content Reader */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 320px) 1fr',
          gap: '32px',
          padding: '32px 20px',
        }}
        className="manual-layout-grid"
      >
        {/* Left Sticky Table of Contents */}
        <aside
          style={{
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            paddingRight: '12px',
          }}
          className="manual-toc-sidebar"
        >
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'var(--bg-surface, #18181b)',
              border: '1px solid var(--border-color, #27272a)',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-secondary, #71717a)' }}>
              TABLE OF CONTENTS
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary, #e4e4e7)', marginTop: '2px' }}>
              {allVisibleSections.length} Interactive Topics Available
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredChapters.map(chapter => (
              <div key={chapter.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--primary-red, #dc2626)',
                    padding: '4px 8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Chapter {chapter.chapterNumber} • {chapter.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '6px' }}>
                  {chapter.sections.map(section => {
                    const isSelected = activeSectionId === section.id
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => handleSelectSection(section.id)}
                        style={{
                          textAlign: 'left',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: isSelected ? 'rgba(220, 38, 38, 0.15)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--primary-red, #dc2626)' : '3px solid transparent',
                          color: isSelected ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #a1a1aa)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 700 : 400,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, marginRight: '4px' }}>{section.sectionNumber}</span>
                          {section.title}
                        </span>
                        {section.role === 'ADMIN' && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              background: 'rgba(220, 38, 38, 0.2)',
                              color: '#f87171',
                              padding: '2px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            ADMIN
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Right Content Area: Chapters & Sections */}
        <main style={{ minWidth: 0 }}>
          {filteredChapters.map(chapter => (
            <section
              key={chapter.id}
              style={{
                marginBottom: '56px',
                paddingBottom: '32px',
                borderBottom: '1px solid var(--border-color, #27272a)',
              }}
            >
              {/* Chapter Header Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(143, 0, 13, 0.12), rgba(0,0,0,0.2))',
                  border: '1px solid rgba(143, 0, 13, 0.3)',
                  borderRadius: '12px',
                  padding: '24px 28px',
                  marginBottom: '32px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    color: 'var(--primary-red, #dc2626)',
                    marginBottom: '4px',
                  }}
                >
                  CHAPTER {chapter.chapterNumber}
                </div>
                <h2
                  style={{
                    margin: '0 0 6px',
                    fontSize: 'clamp(24px, 3vw, 32px)',
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontWeight: 700,
                    color: 'var(--text-primary, #ffffff)',
                  }}
                >
                  {chapter.title}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #cbd5e1)', fontStyle: 'italic' }}>
                  {chapter.subtitle}
                </div>
                <p style={{ margin: '12px 0 0', fontSize: '13px', lineHeight: 1.6, color: '#94a3b8' }}>
                  {chapter.summary}
                </p>
              </div>

              {/* Chapter Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {chapter.sections.map(section => (
                  <article
                    key={section.id}
                    id={section.id}
                    style={{
                      scrollMarginTop: '100px',
                      background: 'var(--bg-surface, #18181b)',
                      border: '1px solid var(--border-color, #27272a)',
                      borderRadius: '12px',
                      padding: '28px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                  >
                    {/* Running Header Bar matching reference manual */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: 'var(--text-secondary, #71717a)',
                        borderBottom: '1px solid var(--border-color, #27272a)',
                        paddingBottom: '10px',
                        marginBottom: '16px',
                      }}
                    >
                      <span>
                        MANOBOLIT ARCHIVE - USER MANUAL • CHAPTER {chapter.chapterNumber}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleShareSection(section.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedLink ? '#10b981' : 'var(--text-secondary, #a1a1aa)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                          title="Copy direct link to this section"
                        >
                          {copiedLink ? '✓ Copied URL' : '🔗 Share Section'}
                        </button>
                        <span>SECTION {section.sectionNumber}</span>
                      </div>
                    </div>

                    {/* Section Title */}
                    <h3
                      style={{
                        margin: '0 0 16px',
                        fontSize: '22px',
                        fontWeight: 700,
                        color: 'var(--text-primary, #ffffff)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ color: 'var(--primary-red, #dc2626)' }}>{section.sectionNumber}</span>
                      <span>{section.title}</span>
                      {section.role === 'ADMIN' && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(220, 38, 38, 0.2)',
                            color: '#f87171',
                            letterSpacing: '0.04em',
                          }}
                        >
                          ADMINISTRATOR ROLE ONLY
                        </span>
                      )}
                    </h3>

                    {/* Who uses it & capabilities overview */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color, #27272a)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '20px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--primary-red, #f87171)' }}>Who uses it. </strong>
                        <span style={{ color: 'var(--text-primary, #e4e4e7)' }}>{section.whoUsesIt}</span>
                      </div>

                      {section.capabilities && section.capabilities.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong style={{ color: 'var(--text-primary, #e4e4e7)' }}>What this account can do:</strong>
                          <ul style={{ margin: '6px 0 0', paddingLeft: '20px', color: 'var(--text-secondary, #cbd5e1)' }}>
                            {section.capabilities.map((cap, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>{cap}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.menuLocation && section.menuLocation.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong style={{ color: 'var(--text-primary, #e4e4e7)' }}>Where to find it in the menu:</strong>
                          <ul style={{ margin: '6px 0 0', paddingLeft: '20px', color: 'var(--text-secondary, #cbd5e1)' }}>
                            {section.menuLocation.map((loc, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>{loc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Feature Description */}
                    <p
                      style={{
                        fontSize: '14px',
                        lineHeight: 1.7,
                        color: 'var(--text-secondary, #cbd5e1)',
                        marginBottom: '24px',
                      }}
                    >
                      {section.description}
                    </p>

                    {/* Screenshot Figure with Numbered Callouts */}
                    {section.figureNumber && section.figureImage && (
                      <div style={{ marginBottom: '28px' }}>
                        <div
                          style={{
                            border: '1px solid var(--border-color, #3f3f46)',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            background: '#09090b',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                          }}
                        >
                          <img
                            src={section.figureImage}
                            alt={section.figureAlt || section.figureTitle || 'System screenshot'}
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block',
                            }}
                            loading="lazy"
                          />
                        </div>
                        <div
                          style={{
                            marginTop: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--text-secondary, #a1a1aa)',
                            textAlign: 'center',
                          }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--primary-red, #dc2626)' }}>
                            Figure {section.figureNumber}.{' '}
                          </span>
                          <span>{section.figureTitle}. </span>
                          <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                            The red numbers match the steps below.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Numbered Steps */}
                    {section.steps && section.steps.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <h4
                          style={{
                            margin: '0 0 14px',
                            fontSize: '14px',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            color: 'var(--text-primary, #ffffff)',
                          }}
                        >
                          Steps
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {section.steps.map(step => (
                            <div
                              key={step.number}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '32px 1fr',
                                gap: '12px',
                                alignItems: 'flex-start',
                              }}
                            >
                              {/* Red Badge */}
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: '#dc2626',
                                  border: '2px solid #ffffff',
                                  color: '#ffffff',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)',
                                }}
                              >
                                {step.number}
                              </div>
                              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--text-primary, #ffffff)' }}>
                                  {step.label}.{' '}
                                </strong>
                                <span style={{ color: 'var(--text-secondary, #cbd5e1)' }}>
                                  {step.instruction}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* "Good to know" Callout Box (matching reference manual) */}
                    {section.goodToKnow && section.goodToKnow.length > 0 && (
                      <div
                        style={{
                          background: 'rgba(254, 240, 138, 0.08)',
                          border: '1px solid rgba(250, 204, 21, 0.3)',
                          borderLeft: '4px solid #facc15',
                          borderRadius: '8px',
                          padding: '16px 20px',
                          marginTop: '20px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            color: '#facc15',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>💡</span>
                          <span>Good to know</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6 }}>
                          {section.goodToKnow.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}

          {/* Bottom Navigation (Prev / Next Section) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 0',
              borderTop: '1px solid var(--border-color, #27272a)',
            }}
          >
            {prevSection ? (
              <button
                type="button"
                onClick={() => handleSelectSection(prevSection.section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-surface, #18181b)',
                  border: '1px solid var(--border-color, #27272a)',
                  color: 'var(--text-primary, #ffffff)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <span>← Previous:</span>
                <span>{prevSection.section.sectionNumber} {prevSection.section.title}</span>
              </button>
            ) : <div />}

            {nextSection ? (
              <button
                type="button"
                onClick={() => handleSelectSection(nextSection.section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--primary-red, #8F000D)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <span>Next: {nextSection.section.sectionNumber} {nextSection.section.title}</span>
                <span>→</span>
              </button>
            ) : <div />}
          </div>
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .manual-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .manual-toc-sidebar {
            position: static !important;
            max-height: none !important;
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  )
}

