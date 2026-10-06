'use client'

import dynamic from 'next/dynamic'
import * as XLSX from 'xlsx-js-style'
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

export interface AccuracyMetrics {
  accuracy: number
  precision: number
  recall: number
  f1: number
  sampleSize: number
}

export interface ExportRecord {
  id: string
  title: string
  manoboTitle: string
  englishTitle: string
  type: string
  genre: string
  themes: string
  culturalElements: string
  transcription: string
  translation: string
  bisayaTranslation: string
  source: string
  yearCollected: number | string
  narrator: string
  communityLocation: string
  province: string
  municipality: string
  barangay: string
  audioFile: string
}

const TYPE_LABELS: Record<string, string> = {
  ORAL_LITERATURE: 'Oral Literature',
  FOLK_SONG: 'Folk Song',
}

// Singular, per-entry genre labels for the records export — GENRE_LABELS
// below is aggregate/plural phrasing meant for dashboard chart legends
// ("Riddles: 8"), which reads oddly on a single record's own row. Matches
// the same Eugenio (1993) genre names already shown in Explore/Classification.
const EXPORT_GENRE_LABELS: Record<string, string> = {
  MYTH: 'Myth (Oggayam)', LEGEND: 'Legend (Tudtul)', EPIC: 'Epic (Ulaging)', FOLKTALE: 'Folktale',
  RIDDLE: 'Riddle', PROVERB: 'Proverb', SONG: 'Folk Song', CHANT: 'Chant',
  PRAYER: 'Prayer', INCANTATION: 'Incantation',
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
  genreDistribution = [],
  mostFrequentTheme = null,
  themeFrequency = [],
  accuracyMetrics = { accuracy: 0, precision: 0, recall: 0, f1: 0, sampleSize: 0 },
  exportRecords = [],
}: {
  totalEntries?: number
  locationStats?: LocationStat[]
  mostCommonGenre?: GenreStat | null
  genreDistribution?: GenreStat[]
  mostFrequentTheme?: ThemeStat | null
  themeFrequency?: ThemeStat[]
  accuracyMetrics?: AccuracyMetrics
  exportRecords?: ExportRecord[]
}) {
  // Same brand palette as the rest of the dashboard, cycled if there are ever
  // more genres archived than colors — never a hardcoded set of genres/shares.
  const GENRE_COLORS = ['#8F000D', '#f1b80d', '#18181b', '#7f7370', '#0ea5e9', '#16a34a']
  const genreConicGradient = (() => {
    if (genreDistribution.length === 0) return 'conic-gradient(#e5e7eb 0% 100%)'
    let cursor = 0
    const stops = genreDistribution.map((g, i) => {
      const start = cursor
      cursor += g.percent
      return `${GENRE_COLORS[i % GENRE_COLORS.length]} ${start}% ${i === genreDistribution.length - 1 ? 100 : cursor}%`
    })
    return `conic-gradient(${stops.join(', ')})`
  })()
  const topLocations = locationStats.slice(0, 5)

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

  // Human-readable headers, in a logical reading order (identity →
  // classification → content → provenance → location → media → internal
  // reference last), rather than the raw camelCase field names.
  const EXPORT_HEADERS = [
    'No.', 'Title', 'Manobo Title', 'English Title', 'Type', 'Genre (Eugenio 1993)',
    'Themes (ManoboLit Framework)', 'Cultural Elements',
    'Transcription (Manobo)', 'Translation (English)', 'Translation (Bisaya/Cebuano)',
    'Source', 'Year Collected', 'Narrator',
    'Community/Sitio', 'Barangay', 'Municipality', 'Province',
    'Audio Recording URL', 'Record ID',
  ]

  const buildExportRow = (record: ExportRecord, index: number): (string | number)[] => [
    index + 1,
    record.title,
    record.manoboTitle,
    record.englishTitle,
    TYPE_LABELS[record.type] || record.type,
    EXPORT_GENRE_LABELS[record.genre] || formatGenreLabel(record.genre),
    record.themes.split('; ').filter(Boolean).map(formatThemeLabel).join('; '),
    record.culturalElements,
    record.transcription,
    record.translation,
    record.bisayaTranslation,
    record.source,
    record.yearCollected,
    record.narrator,
    record.communityLocation,
    record.barangay,
    record.municipality,
    record.province,
    record.audioFile,
    record.id,
  ]

  // Column widths tuned per field — narrow for short codes/dates, wide for
  // free text (transcription/translation), in character-width units.
  const EXPORT_COLUMN_WIDTHS = [5, 26, 16, 18, 14, 16, 26, 28, 38, 38, 38, 20, 10, 16, 16, 14, 14, 16, 30, 24]

  const thinBorder = { style: 'thin', color: { rgb: 'D9D9D9' } } as const
  const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }

  // A plain CSV can't carry any formatting, so a 20-column sheet with long
  // transcription/translation text reads as a wall of raw text in Excel. A
  // real .xlsx with a styled header, sized columns, wrapped long cells, and
  // borders is what actually renders as a clean, presentable spreadsheet.
  const downloadCulturalHeritageRecords = () => {
    if (exportRecords.length === 0) return

    const aoa = [EXPORT_HEADERS, ...exportRecords.map((record, i) => buildExportRow(record, i))]
    const worksheet = XLSX.utils.aoa_to_sheet(aoa)

    worksheet['!cols'] = EXPORT_COLUMN_WIDTHS.map(wch => ({ wch }))
    worksheet['!rows'] = [{ hpt: 24 }, ...exportRecords.map(() => ({ hpt: 60 }))]

    const range = XLSX.utils.decode_range(worksheet['!ref']!)
    for (let r = range.s.r; r <= range.e.r; r++) {
      const isHeader = r === 0
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        const cell = worksheet[addr]
        if (!cell) continue
        cell.s = isHeader
          ? {
              font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
              fill: { fgColor: { rgb: '8F000D' } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: allBorders,
            }
          : {
              font: { sz: 10 },
              fill: { fgColor: { rgb: r % 2 === 0 ? 'FFF5F5' : 'FFFFFF' } },
              alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
              border: allBorders,
            }
      }
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cultural Heritage Records')
    const wbout: ArrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `manobolit-cultural-heritage-records-${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full bg-[var(--bg-main)] text-[var(--text-primary)]" style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full px-6 md:px-8 py-8">
        
        {/* Top Header Section (Full Width, matches classification page header) */}
        <div style={{ marginBottom: '32px' }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
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

            <button
              onClick={downloadCulturalHeritageRecords}
              disabled={exportRecords.length === 0}
              className="btn-anim flex-shrink-0"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 18px',
                background: 'var(--brand-accent)',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                cursor: exportRecords.length === 0 ? 'not-allowed' : 'pointer',
                opacity: exportRecords.length === 0 ? 0.5 : 1,
              }}
              title="Export the full archive as a formatted Excel workbook of cultural heritage records"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              EXPORT CULTURAL HERITAGE RECORDS
            </button>
          </div>
        </div>

        {/* Separator Line */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0 24px 0' }} />

        <div className="flex flex-col lg:flex-row gap-8">

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

                {/* Donut Chart and Legend — built from the real per-genre counts
                    passed in as genreDistribution, not a fixed set of shares */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
                  {/* Donut built with a CSS conic-gradient so its slices always
                      match genreDistribution exactly, however many genres exist */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '130px', position: 'relative' }}>
                    <div
                      style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '28px',
                        background: genreConicGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '66px',
                          height: '66px',
                          borderRadius: '16px',
                          background: 'var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          color: '#18181b',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        GENRES
                      </div>
                    </div>
                  </div>

                  {/* Vertical Legend — one row per genre actually present in the archive */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    {genreDistribution.length > 0 ? (
                      genreDistribution.map((g, i) => (
                        <div key={g.genre} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', background: GENRE_COLORS[i % GENRE_COLORS.length] }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{formatGenreLabel(g.genre)}</span>
                          </div>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{g.percent}% ({g.count})</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No entries classified yet.</div>
                    )}
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
                      ManoboLit Thematic Framework
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
                    Rule-Based Classifier Metrics
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
                    {/* Wedge indicator — a stylized marker rather than a
                        literal needle, since this arch isn't a simple
                        circular gauge; the number beside it is the exact,
                        freshly-computed figure. */}
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
                      {(accuracyMetrics.accuracy * 100).toFixed(1)}<span style={{ fontSize: '18px', verticalAlign: 'super', marginLeft: '2px', fontWeight: 600 }}>%</span>
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
                      CLASSIFIER ACCURACY
                    </span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '12px 0 8px 0' }} />

                {/* Bottom Accuracy Metrics Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Precision</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{accuracyMetrics.precision.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Recall</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{accuracyMetrics.recall.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-primary)' }}>F1 Score</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{accuracyMetrics.f1.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    Computed live from the classifier&rsquo;s agreement with the curated genre of all {accuracyMetrics.sampleSize} archived entries.
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
