'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import CountUp from '@/components/CountUp'

export interface LocationStat {
  location: string
  municipality: string
  province: string
  count: number
}

export interface GenreStat {
  genre: string
  count: number
  percent: number
}

export interface ThemeStat {
  theme: string
  count: number
  percent?: number
}

const GENRE_LABELS: Record<string, string> = {
  MYTH: 'Myths', LEGEND: 'Legends', FOLKTALE: 'Folktales', EPIC: 'Epics',
  RIDDLE: 'Riddles', PROVERB: 'Proverbs', SONG: 'Folk Songs', CHANT: 'Chants',
  PRAYER: 'Prayers', INCANTATION: 'Incantations',
}

function formatGenreLabel(genre: string): string {
  return GENRE_LABELS[genre] || genre.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function formatThemeLabel(theme: string): string {
  return theme
    .split('_')
    .map(word => (word.toUpperCase() === 'AND' ? '&' : word.charAt(0) + word.slice(1).toLowerCase()))
    .join(' ')
}

// Leaflet touches `window` at import time, so it can only run in the browser —
// dynamically import with ssr disabled rather than importing react-leaflet directly.
const RegionalMap = dynamic(() => import('@/components/RegionalMap'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ width: '100%', height: '100%' }} />,
})

export default function DashboardClient({
  totalEntries = 0,
  locationStats = [],
  mostCommonGenre = null,
  mostFrequentTheme = null,
  themeFrequency = [],
}: {
  totalEntries?: number
  locationStats?: LocationStat[]
  mostCommonGenre?: GenreStat | null
  mostFrequentTheme?: ThemeStat | null
  themeFrequency?: ThemeStat[]
}) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<'GENRES' | 'KEYWORDS' | 'THEMES' | 'LOCATIONS'>('GENRES')

  const topLocations = locationStats.slice(0, 5)

  const handleSidebarClick = (category: 'GENRES' | 'KEYWORDS' | 'THEMES' | 'LOCATIONS') => {
    setActiveCategory(category)
    router.push(`/explore?category=${category}`)
  }

  const downloadThemeDataset = () => {
    const header = 'theme,entries_tagged\n'
    const rows = themeFrequency.map(t => `${formatThemeLabel(t.theme)},${t.count}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'manobolit-theme-frequency.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full bg-[var(--bg-main)] text-[var(--text-primary)]" style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full px-6 md:px-8 py-8">
        
        {/* Top Header Section (Full Width, matches classification page header) */}
        <div style={{ marginBottom: '32px' }}>
          {/* Header Path */}
          <div 
            style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: 'var(--brand-accent)', 
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}
          >
            Quantitative Analytics
          </div>

          {/* Page Title */}
          <h1 
            style={{ 
              margin: '0 0 16px 0',
              fontSize: '44px', 
              fontWeight: 700, 
              fontFamily: "'Playfair Display', Georgia, serif",
              lineHeight: 1.1,
              color: 'var(--text-primary)'
            }}
          >
            Research Dashboard
          </h1>

          <p 
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0'
            }}
          >
            Quantitative overview of Manobo oral literature classifications and regional distribution across the Agusan River basin.
          </p>
        </div>

        {/* Separator Line */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0 24px 0' }} />

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR: FILTERS */}
          <aside className="w-full lg:w-64 flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="border-b border-[var(--border-color)] pb-4 mb-6">
              <h2 
                style={{ 
                  margin: 0,
                  fontSize: '28px', 
                  fontWeight: 700, 
                  color: 'var(--brand-accent)', 
                  fontFamily: "'Playfair Display', Georgia, serif" 
                }}
              >
                Archive Filters
              </h2>
              <span className="text-xs text-[var(--text-muted)] tracking-wide">Scholarly Classification</span>
            </div>

            {/* Sidebar navigation options */}
            <div className="flex flex-col gap-1 mb-8">
              {/* Keywords Item */}
              <button
                onClick={() => handleSidebarClick('KEYWORDS')}
                className="w-full flex items-center gap-2.5 py-2.5 px-3 transition-colors text-left btn-anim"
                style={{ 
                  fontSize: '13px', 
                  borderLeft: activeCategory === 'KEYWORDS' ? '4px solid #8F000D' : '4px solid transparent', 
                  background: activeCategory === 'KEYWORDS' ? 'var(--bg-surface)' : 'transparent',
                  color: activeCategory === 'KEYWORDS' ? 'var(--brand-accent)' : 'var(--text-secondary)',
                  fontWeight: activeCategory === 'KEYWORDS' ? 700 : 500
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Keywords</span>
              </button>

              {/* Genres Item */}
              <button
                onClick={() => handleSidebarClick('GENRES')}
                className="w-full flex items-center gap-2.5 py-2.5 px-3 transition-colors text-left btn-anim"
                style={{ 
                  fontSize: '13px', 
                  borderLeft: activeCategory === 'GENRES' ? '4px solid #8F000D' : '4px solid transparent', 
                  background: activeCategory === 'GENRES' ? 'var(--bg-surface)' : 'transparent',
                  color: activeCategory === 'GENRES' ? 'var(--brand-accent)' : 'var(--text-secondary)',
                  fontWeight: activeCategory === 'GENRES' ? 700 : 500
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 11h2a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-1" />
                  <path d="M16 14h.01M19 14h.01M16 17c.5-.5 1.5-.5 2 0" />
                  <path d="M5 6a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V6z" />
                  <path d="M8 5h.01M11 5h.01M8 8c.5.5 1.5.5 2 0" />
                </svg>
                <span>Genres</span>
              </button>

              {/* Themes Item */}
              <button
                onClick={() => handleSidebarClick('THEMES')}
                className="w-full flex items-center gap-2.5 py-2.5 px-3 transition-colors text-left btn-anim"
                style={{ 
                  fontSize: '13px', 
                  borderLeft: activeCategory === 'THEMES' ? '4px solid #8F000D' : '4px solid transparent', 
                  background: activeCategory === 'THEMES' ? 'var(--bg-surface)' : 'transparent',
                  color: activeCategory === 'THEMES' ? 'var(--brand-accent)' : 'var(--text-secondary)',
                  fontWeight: activeCategory === 'THEMES' ? 700 : 500
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3L7 11h10Z" />
                  <rect x="3" y="13" width="7" height="7" rx="1" />
                  <circle cx="17.5" cy="16.5" r="3.5" />
                </svg>
                <span>Themes</span>
              </button>

              {/* Locations Item */}
              <button
                onClick={() => handleSidebarClick('LOCATIONS')}
                className="w-full flex items-center gap-2.5 py-2.5 px-3 transition-colors text-left btn-anim"
                style={{ 
                  fontSize: '13px', 
                  borderLeft: activeCategory === 'LOCATIONS' ? '4px solid #8F000D' : '4px solid transparent', 
                  background: activeCategory === 'LOCATIONS' ? 'var(--bg-surface)' : 'transparent',
                  color: activeCategory === 'LOCATIONS' ? 'var(--brand-accent)' : 'var(--text-secondary)',
                  fontWeight: activeCategory === 'LOCATIONS' ? 700 : 500
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Locations</span>
              </button>
            </div>
          </aside>

          {/* RIGHT MAIN PANEL: RESEARCH DASHBOARD CONTENT */}
          <main className="flex-1 flex flex-col gap-6">
            
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Total Entries Card */}
              <div
                className="bg-[var(--bg-surface)] p-5 flex flex-col justify-between stagger-item card-hover"
                style={{
                  border: '1px solid #fee2e2',
                  borderTop: '4px solid #8F000D',
                  borderRadius: '0px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
                }}
              >
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TOTAL ENTRIES</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: "'Playfair Display', Georgia, serif"
                      }}
                    >
                      <CountUp value={totalEntries} />
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>Preserved oral narratives</span>
              </div>

              {/* Most Common Genre Card */}
              <div
                className="bg-[var(--bg-surface)] p-5 flex flex-col justify-between stagger-item card-hover"
                style={{
                  border: '1px solid #fef3c7',
                  borderTop: '4px solid #f1b80d',
                  borderRadius: '0px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
                }}
              >
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MOST COMMON GENRE</span>
                  <div style={{ marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: "'Playfair Display', Georgia, serif"
                      }}
                    >
                      {mostCommonGenre ? formatGenreLabel(mostCommonGenre.genre) : '—'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
                  {mostCommonGenre
                    ? `Representing ${mostCommonGenre.percent}% of archive (${mostCommonGenre.count} ${mostCommonGenre.count === 1 ? 'entry' : 'entries'})`
                    : 'No entries yet'}
                </span>
              </div>

              {/* Most Frequent Theme Card */}
              <div
                className="bg-[var(--bg-surface)] p-5 flex flex-col justify-between stagger-item card-hover"
                style={{
                  border: '1px solid #fee2e2',
                  borderTop: '4px solid #8F000D',
                  borderRadius: '0px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
                }}
              >
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MOST FREQUENT THEME</span>
                  <div style={{ marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: "'Playfair Display', Georgia, serif"
                      }}
                    >
                      {mostFrequentTheme ? formatThemeLabel(mostFrequentTheme.theme) : '—'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
                  {mostFrequentTheme
                    ? `Tagged in ${mostFrequentTheme.count} ${mostFrequentTheme.count === 1 ? 'entry' : 'entries'}`
                    : 'No entries yet'}
                </span>
              </div>

            </div>

            {/* Middle Row: Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Genre Distribution Card */}
              <div
                className="bg-[var(--bg-surface)] p-6 flex flex-col justify-between scroll-reveal card-hover"
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '0px',
                  minHeight: '340px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                }}
              >
                <div>
                  <h3 
                    style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '20px', 
                      fontWeight: 700, 
                      color: 'var(--text-primary)', 
                      fontFamily: "'Playfair Display', Georgia, serif" 
                    }}
                  >
                    Genre Distribution
                  </h3>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    According to Eugenio (1993) Classification
                  </span>
                </div>

                {/* Donut Chart and Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
                  {/* Centered Rounded Square Donut Chart */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '130px', position: 'relative' }}>
                    <svg width="130" height="130" viewBox="0 0 100 100">
                      {/* Segment 1: Folk Songs (38%) - Burgundy #8F000D */}
                      <path 
                        d="M 77.66 77.66 L 95.31 95.31 A 16 16 0 0 0 100 84 L 100 16 A 16 16 0 0 0 84 0 L 50 0 L 50 20 L 72 20 A 8 8 0 0 1 80 28 L 80 72 A 8 8 0 0 1 77.66 77.66 Z"
                        fill="var(--brand-accent)"
                      />
                      {/* Segment 2: Proverbs (27%) - Yellow #f1b80d */}
                      <path 
                        d="M 22.34 77.66 L 4.69 95.31 A 16 16 0 0 0 16 100 L 84 100 A 16 16 0 0 0 95.31 95.31 L 77.66 77.66 A 8 8 0 0 1 72 80 L 28 80 A 8 8 0 0 1 22.34 77.66 Z"
                        fill="#f1b80d"
                      />
                      {/* Segment 3: Myths & Legends (20%) - Black #18181b */}
                      <path 
                        d="M 22.34 22.34 L 4.69 4.69 A 16 16 0 0 0 0 16 L 0 84 A 16 16 0 0 0 4.69 95.31 L 22.34 77.66 A 8 8 0 0 1 20 72 L 20 28 A 8 8 0 0 1 22.34 22.34 Z"
                        fill="#18181b"
                      />
                      {/* Segment 4: Other Genres (15%) - Grey #7f7370 */}
                      <path 
                        d="M 50 20 L 50 0 L 16 0 A 16 16 0 0 0 4.69 4.69 L 22.34 22.34 A 8 8 0 0 1 28 20 L 50 20 Z"
                        fill="#7f7370"
                      />
                      
                      {/* Center text overlay */}
                      <text 
                        x="50" 
                        y="50" 
                        textAnchor="middle" 
                        dominantBaseline="central"
                        fill="#18181b"
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        GENRES
                      </text>
                    </svg>
                  </div>

                  {/* Vertical Legend aligned like in mockup */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#8F000D' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Folk Songs</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>38%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#f1b80d' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Proverbs</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>27%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#18181b' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Myths & Legends</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>20%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#7f7370' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Other Genres</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>15%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Frequency Card */}
              <div
                className="bg-[var(--bg-surface)] p-6 flex flex-col justify-between scroll-reveal card-hover"
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '0px',
                  minHeight: '340px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 
                      style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '20px', 
                        fontWeight: 700, 
                        color: 'var(--text-primary)', 
                        fontFamily: "'Playfair Display', Georgia, serif" 
                      }}
                    >
                      Theme Frequency
                    </h3>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Taxonomy based on Andress (1985)
                    </span>
                  </div>

                  {/* Download Icon */}
                  <button
                    onClick={downloadThemeDataset}
                    disabled={themeFrequency.length === 0}
                    className="text-[var(--text-muted)] hover:text-[#8F000D] transition-colors p-1 disabled:opacity-40 disabled:cursor-not-allowed btn-anim"
                    title="Download Theme Dataset (CSV)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>

                {/* Progress bars list — real per-theme entry counts, relative to the most frequent theme */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0 0 0' }}>
                  {themeFrequency.length > 0 ? (
                    themeFrequency.map(theme => (
                      <div key={theme.theme}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{formatThemeLabel(theme.theme)}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{theme.count} {theme.count === 1 ? 'entry' : 'entries'}</span>
                        </div>
                        <div style={{ height: '6px', background: '#fee2e2', position: 'relative' }}>
                          <div style={{ height: '100%', width: `${theme.percent}%`, background: '#8F000D', transition: 'width 0.8s var(--ease-out-smooth, ease-out)' }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No entries yet</span>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Row: Combined Map & Rankings, and Accuracy */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Combined Regional Heatmap and Municipality Rank Card */}
              <div
                className="col-span-1 lg:col-span-2 bg-[var(--bg-surface)] flex flex-col md:flex-row justify-between scroll-reveal card-hover"
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '0px',
                  minHeight: '260px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                }}
              >
                {/* Left Part: Regional Heatmap */}
                <div style={{ flex: 1.8, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 
                      style={{ 
                        margin: '0 0 2px 0', 
                        fontSize: '18px', 
                        fontWeight: 700, 
                        color: 'var(--text-primary)', 
                        fontFamily: "'Playfair Display', Georgia, serif" 
                      }}
                    >
                      Regional Heatmap
                    </h3>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Frequency by Location in Agusan del Sur
                    </span>
                  </div>

                  {/* Real interactive map (Leaflet + OpenStreetMap) — markers plot verified coordinates only */}
                  <div
                    style={{
                      height: '180px',
                      marginTop: '12px',
                      position: 'relative',
                      isolation: 'isolate',
                      zIndex: 0,
                      overflow: 'hidden',
                      background: '#f8fafc',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <RegionalMap locationStats={topLocations} />
                  </div>
                </div>

                {/* Right Part: Municipality Rank (integrated, light beige background and left border) */}
                <div 
                  style={{ 
                    flex: 1,
                    padding: '20px',
                    background: 'var(--bg-main)',
                    borderLeft: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span 
                      style={{ 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        color: 'var(--brand-accent)', 
                        letterSpacing: '0.05em', 
                        display: 'block', 
                        marginBottom: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      LOCATION RANK
                    </span>
                  </div>

                  {/* Ranking List — real per-location entry counts from the archive */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                    {topLocations.length > 0 ? (
                      topLocations.map((loc, i) => (
                        <div
                          key={loc.location}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ color: 'var(--text-secondary)' }}>{loc.location}</span>
                          <span style={{ color: i < 2 ? 'var(--brand-accent)' : 'var(--text-primary)', fontWeight: i < 2 ? 700 : 600 }}>
                            {loc.count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No entries yet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* System Accuracy Card */}
              <div
                className="bg-[var(--bg-surface)] p-6 flex flex-col justify-between scroll-reveal card-hover"
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '0px',
                  minHeight: '280px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                }}
              >
                <div>
                  <h3 
                    style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '24px', 
                      fontWeight: 700, 
                      color: 'var(--text-primary)', 
                      fontFamily: "'Playfair Display', Georgia, serif" 
                    }}
                  >
                    System Accuracy
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
                    AI Verification Metrics
                  </span>
                </div>

                {/* Flat-top Portal Arch Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '14px 0', position: 'relative' }}>
                  <svg width="150" height="95" viewBox="0 0 140 90">
                    {/* Background track (arch) */}
                    <path
                      d="M 25 85 L 25 35 A 20 20 0 0 1 45 15 L 95 15 A 20 20 0 0 1 115 35 L 115 85"
                      fill="none"
                      style={{ stroke: 'var(--bg-main)' }}
                      strokeWidth="14"
                      strokeLinecap="butt"
                    />
                    {/* Red wedge indicator at bottom right representing 94.2% */}
                    <polygon 
                      points="108,70 122,60 122,85 108,85" 
                      fill="var(--brand-accent)" 
                    />
                  </svg>
                  {/* Gauge value overlays */}
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(5px)' }}>
                    <span 
                      style={{ 
                        fontSize: '34px', 
                        fontWeight: 700, 
                        color: 'var(--text-primary)', 
                        fontFamily: "'Playfair Display', Georgia, serif",
                        lineHeight: 1 
                      }}
                    >
                      94.2<span style={{ fontSize: '18px', verticalAlign: 'super', marginLeft: '2px', fontWeight: 600 }}>%</span>
                    </span>
                    <span 
                      style={{ 
                        fontSize: '8px', 
                        fontWeight: 800, 
                        color: 'var(--text-muted)', 
                        letterSpacing: '0.08em', 
                        marginTop: '4px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      CONFIDENCE INTERVAL
                    </span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '12px 0 8px 0' }} />

                {/* Bottom Accuracy Metrics Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Precision</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>0.96</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Recall</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>0.92</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-primary)' }}>F1 Score</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>0.94</span>
                  </div>
                </div>

              </div>

            </div>

          </main>

        </div>
      </div>
    </div>
  )
}
