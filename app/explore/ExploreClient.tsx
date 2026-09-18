'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAudio } from '@/lib/context/AudioContext'

interface Entry {
  id: string
  title: string
  manoboTitle?: string | null
  englishTitle?: string | null
  type: string // "ORAL_LITERATURE" | "FOLK_SONG"
  content: string
  genre: string
  themes: string[]
  culturalElements: string[]
  audioFile?: string | null
  confidence?: number
  communityLocation?: string | null
  municipality?: string | null
  barangay?: string | null
  province?: string | null
}

export default function ExploreClient({ initialEntries }: { initialEntries: Entry[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio()

  // Active category button (GENRES, KEYWORDS, THEMES, LOCATIONS)
  const [activeCategory, setActiveCategory] = useState<'GENRES' | 'KEYWORDS' | 'THEMES' | 'LOCATIONS'>('GENRES')
  
  // Interactive genre filters — start unchecked so "Apply Filters" only narrows
  // results the user actually selected, never a filter they never touched.
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  
  // Applied filters (empty on load so all items are shown by default)
  const [appliedGenres, setAppliedGenres] = useState<string[]>([])
  const [appliedThemes, setAppliedThemes] = useState<string[]>([])
  const [appliedLocations, setAppliedLocations] = useState<string[]>([])
  
  // Local page state
  const [page, setPage] = useState(1)
  
  // Sync page state with search input
  const search = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    const params = new URLSearchParams(window.location.search)
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    router.push(`/explore?${params.toString()}`, { scroll: false })
  }

  // Filter entries
  const filteredEntries = useMemo(() => {
    return initialEntries.filter(entry => {
      // 1. Search filter
      if (search) {
        const q = search.toLowerCase()
        const matchText = [
          entry.title,
          entry.content,
          entry.manoboTitle || '',
          entry.englishTitle || '',
          entry.genre,
          ...(entry.themes || []),
        ].join(' ').toLowerCase()
        if (!matchText.includes(q)) return false
      }

      // 2. Genre filter
      if (appliedGenres.length > 0) {
        const gNorm = entry.genre.toUpperCase()
        const match = appliedGenres.some(sel => {
          if (sel === 'MYTH') return gNorm === 'MYTH'
          if (sel === 'EPIC') return gNorm === 'EPIC'
          if (sel === 'LEGEND') return gNorm === 'LEGEND'
          return gNorm === sel
        })
        if (!match) return false
      }

      // 3. Theme filter with partial includes support
      if (appliedThemes.length > 0) {
        const matchTheme = appliedThemes.some(t => 
          entry.themes.some(et => {
            const etNorm = et.toUpperCase()
            const tNorm = t.toUpperCase()
            return etNorm === tNorm || etNorm.includes(tNorm) || tNorm.includes(etNorm)
          })
        )
        if (!matchTheme) return false
      }

      // 4. Location filter
      if (appliedLocations.length > 0) {
        const matchLocation = appliedLocations.some(loc => {
          const mNorm = (entry.municipality || '').toUpperCase()
          const bNorm = (entry.barangay || '').toUpperCase()
          const cNorm = (entry.communityLocation || '').toUpperCase()
          const tNorm = [entry.title, entry.content].join(' ').toUpperCase()

          if (loc === 'TRENTO') return mNorm.includes('TRENTO')
          if (loc === 'STA_MARIA') return bNorm.includes('MARIA') || cNorm.includes('MARIA')
          if (loc === 'SITIO_DAM') return cNorm.includes('DAM')
          if (loc === 'MT_MAGDIWATA') return tNorm.includes('MAGDIWATA')
          return false
        })
        if (!matchLocation) return false
      }

      return true
    })
  }, [initialEntries, search, appliedGenres, appliedThemes, appliedLocations])

  // Pagination calculations (5 per page to match mockup)
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage)
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredEntries.slice(start, start + itemsPerPage)
  }, [filteredEntries, page])

  const handlePlayClick = (e: React.MouseEvent, entry: Entry) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Fall back to a per-entry (nonexistent) path when there's no real recording —
    // AudioContext's error handler will catch the failed load and recite the text
    // via speech synthesis instead. Must be unique per entry, or switching between
    // two entries with no audio wrongly looks like "the same track" and just toggles.
    const audioPath = entry.audioFile || `/audio/${entry.id}.mp3`

    if (currentTrack?.audioFile === audioPath) {
      togglePlay()
    } else {
      playTrack({
        audioFile: audioPath,
        title: entry.title,
        singer: (entry as any).singer || entry.manoboTitle || 'Agusan Manobo Vocalist',
        narrator: entry.manoboTitle || 'Agusan Manobo',
        duration: 25,
        textToRecite: entry.content
      })
    }
  }

  const toggleGenre = (genreKey: string) => {
    setSelectedGenres(prev => {
      const next = prev.includes(genreKey) ? prev.filter(g => g !== genreKey) : [...prev, genreKey]
      setAppliedGenres(next)
      return next
    })
    setPage(1)
  }

  const toggleTheme = (themeKey: string) => {
    setSelectedThemes(prev => {
      const next = prev.includes(themeKey) ? prev.filter(t => t !== themeKey) : [...prev, themeKey]
      setAppliedThemes(next)
      return next
    })
    setPage(1)
  }

  const toggleLocation = (locKey: string) => {
    setSelectedLocations(prev => {
      const next = prev.includes(locKey) ? prev.filter(l => l !== locKey) : [...prev, locKey]
      setAppliedLocations(next)
      return next
    })
    setPage(1)
  }

  // Pre-seed search from global URL input updates if any
  useEffect(() => {
    setPage(1)
  }, [search])

  // Sync activeCategory with URL search parameters
  const categoryParam = searchParams.get('category')
  useEffect(() => {
    if (categoryParam) {
      const upper = categoryParam.toUpperCase()
      if (upper === 'GENRES' || upper === 'KEYWORDS' || upper === 'THEMES' || upper === 'LOCATIONS') {
        setActiveCategory(upper as any)
      }
    }
  }, [categoryParam])

  return (
    <div className="w-full bg-[#FAF9F6] text-[#1e293b]" style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full px-6 md:px-8 py-6 lg:h-[calc(100vh-64px-75px)] lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8 h-full">
          
          {/* LEFT SIDEBAR: FILTERS */}
          <aside className="w-full lg:w-64 flex-shrink-0 lg:h-full lg:overflow-y-auto pr-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h2 
                style={{ 
                  margin: 0,
                  fontSize: '28px', 
                  fontWeight: 700, 
                  color: '#8F000D', 
                  fontFamily: 'Cormorant Garamond, Georgia, serif' 
                }}
              >
                Archive Filters
              </h2>
              <span className="text-xs text-slate-500 tracking-wide">Scholarly Classification</span>
            </div>

            {/* Main Categories */}
            <div className="flex flex-col mb-4">
              <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">GENRES</div>
              <div className="flex flex-col gap-1">
                {/* Genres Item */}
                <button
                  onClick={() => setActiveCategory('GENRES')}
                  className="w-full flex items-center justify-between py-2 px-3 transition-colors text-left btn-anim"
                  style={{
                    borderRadius: '0px',
                    background: activeCategory === 'GENRES' ? '#ffffff' : 'transparent',
                    borderLeft: activeCategory === 'GENRES' ? '4px solid #8F000D' : '4px solid transparent',
                    color: activeCategory === 'GENRES' ? '#8F000D' : '#475569',
                    fontWeight: activeCategory === 'GENRES' ? 700 : 500,
                    fontSize: '13px',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 11h2a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-1" />
                      <path d="M16 14h.01M19 14h.01M16 17c.5-.5 1.5-.5 2 0" />
                      <path d="M5 6a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V6z" />
                      <path d="M8 5h.01M11 5h.01M8 8c.5.5 1.5.5 2 0" />
                    </svg>
                    <span>Genres</span>
                  </div>
                </button>

                {/* Keywords Item */}
                <button
                  onClick={() => setActiveCategory('KEYWORDS')}
                  className="w-full flex items-center justify-between py-2 px-3 transition-colors text-left btn-anim"
                  style={{
                    borderRadius: '0px',
                    background: activeCategory === 'KEYWORDS' ? '#ffffff' : 'transparent',
                    borderLeft: activeCategory === 'KEYWORDS' ? '4px solid #8F000D' : '4px solid transparent',
                    color: activeCategory === 'KEYWORDS' ? '#8F000D' : '#475569',
                    fontWeight: activeCategory === 'KEYWORDS' ? 700 : 500,
                    fontSize: '13px',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span>Keywords</span>
                  </div>
                </button>

                {/* Themes Item */}
                <button
                  onClick={() => setActiveCategory('THEMES')}
                  className="w-full flex items-center justify-between py-2 px-3 transition-colors text-left btn-anim"
                  style={{
                    borderRadius: '0px',
                    background: activeCategory === 'THEMES' ? '#ffffff' : 'transparent',
                    borderLeft: activeCategory === 'THEMES' ? '4px solid #8F000D' : '4px solid transparent',
                    color: activeCategory === 'THEMES' ? '#8F000D' : '#475569',
                    fontWeight: activeCategory === 'THEMES' ? 700 : 500,
                    fontSize: '13px',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3L7 11h10Z" />
                      <rect x="3" y="13" width="7" height="7" rx="1" />
                      <circle cx="17.5" cy="16.5" r="3.5" />
                    </svg>
                    <span>Themes</span>
                  </div>
                </button>

                {/* Locations Item */}
                <button
                  onClick={() => setActiveCategory('LOCATIONS')}
                  className="w-full flex items-center justify-between py-2 px-3 transition-colors text-left btn-anim"
                  style={{
                    borderRadius: '0px',
                    background: activeCategory === 'LOCATIONS' ? '#ffffff' : 'transparent',
                    borderLeft: activeCategory === 'LOCATIONS' ? '4px solid #8F000D' : '4px solid transparent',
                    color: activeCategory === 'LOCATIONS' ? '#8F000D' : '#475569',
                    fontWeight: activeCategory === 'LOCATIONS' ? 700 : 500,
                    fontSize: '13px',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Locations</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Keywords Search Input (only shown if Keywords is active) */}
            {activeCategory === 'KEYWORDS' && (
              <div className="mb-4 pl-7 pr-2 py-1 border-l border-slate-200 ml-3">
                <input
                  type="text"
                  placeholder="Enter keywords..."
                  value={searchInput}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-200 outline-none focus:border-[#8F000D] text-slate-800 placeholder-slate-400"
                  style={{ borderRadius: '0px' }}
                />
              </div>
            )}

            {/* Locations checkbox list (only shown if Locations is active) */}
            {activeCategory === 'LOCATIONS' && (
              <div className="mb-4 flex flex-col pl-7 pr-2 py-1 gap-1 border-l border-slate-200 ml-3">
                {[
                  { key: 'TRENTO', label: 'Trento' },
                  { key: 'STA_MARIA', label: 'Sta. Maria' },
                  { key: 'SITIO_DAM', label: 'Sitio Dam' },
                  { key: 'MT_MAGDIWATA', label: 'Mt. Magdiwata' }
                ].map(item => {
                  const isChecked = selectedLocations.includes(item.key)
                  return (
                    <label key={item.key} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleLocation(item.key)}
                        className="sr-only"
                      />
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          border: isChecked ? 'none' : '1px solid #cbd5e1',
                          background: isChecked ? '#8F000D' : 'transparent',
                          borderRadius: '0px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'background-color 0.15s ease, border-color 0.15s ease',
                        }}
                      >
                        {isChecked && (
                          <svg className="check-pop" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span>{item.label}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* ACTIVE GENRES Section - ALWAYS SHOWN to match screenshot! */}
            <div className="mb-4">
              <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">ACTIVE GENRES</div>
              <div className="flex flex-col gap-1.5 pl-1">
                {[
                  { key: 'MYTH', label: 'Myth (Oggayam)' },
                  { key: 'LEGEND', label: 'Legend (Tudtul)' },
                  { key: 'EPIC', label: 'Epic (Ulaging)' },
                  { key: 'FOLKTALE', label: 'Folktale' },
                  { key: 'RIDDLE', label: 'Riddle' },
                  { key: 'PROVERB', label: 'Proverb' },
                  { key: 'SONG', label: 'Song' },
                  { key: 'CHANT', label: 'Chant' }
                ].map(item => {
                  const isChecked = selectedGenres.includes(item.key)
                  return (
                    <label key={item.key} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleGenre(item.key)}
                        className="sr-only"
                      />
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          border: isChecked ? 'none' : '1px solid #cbd5e1',
                          background: isChecked ? '#8F000D' : 'transparent',
                          borderRadius: '0px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'background-color 0.15s ease, border-color 0.15s ease',
                        }}
                      >
                        {isChecked && (
                          <svg className="check-pop" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span>{item.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* PRIMARY THEMES Section - ALWAYS SHOWN to match screenshot! */}
            <div className="mb-5">
              <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">PRIMARY THEMES</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'CREATION', label: 'CREATION' },
                  { key: 'HEROIC', label: 'HEROIC JOURNEY' },
                  { key: 'COURTSHIP', label: 'COURTSHIP' },
                  { key: 'ANCESTRY', label: 'ANCESTRY' }
                ].map(item => {
                  const isChecked = selectedThemes.includes(item.key)
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleTheme(item.key)}
                      className="text-[9px] font-bold py-1 px-2.5 tracking-wider transition-colors btn-anim"
                      style={{
                        borderRadius: '0px',
                        background: isChecked ? '#8F000D' : '#e2e8f0',
                        color: isChecked ? '#ffffff' : '#475569',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={() => {
                setAppliedGenres(selectedGenres)
                setAppliedThemes(selectedThemes)
                setAppliedLocations(selectedLocations)
                setPage(1)
              }}
              className="w-full text-center text-white py-2.5 font-bold text-xs transition-colors btn-anim"
              style={{
                background: '#8F000D',
                borderRadius: '0px',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#B22222'}
              onMouseLeave={e => e.currentTarget.style.background = '#8F000D'}
            >
              Apply Filters
            </button>
          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <main className="flex-1 lg:h-full lg:overflow-y-auto pr-2">
            
            {/* Provenance Banner */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8F000D] mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l1.7 1.7 2.4.2.5 2.4 2.1 1.2-1 2.2 1.7 1.7-1.7 1.7 1 2.2-2.1 1.2-.5 2.4-2.4.2-1.7 1.7-1.7-1.7-2.4-.2-.5-2.4-2.1-1.2 1-2.2-1.7-1.7 1.7-1.7-1-2.2 2.1-1.2.5-2.4 2.4-.2z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>Provenance: Agusan Manobo, Mindanao</span>
            </div>

            {/* Main Page Headers */}
            <div className="border-b border-slate-200 pb-6 mb-8">
              <h1
                style={{
                  margin: 0,
                  fontSize: '44px',
                  fontWeight: 700,
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  lineHeight: 1.1,
                  color: '#1e293b'
                }}
              >
                Archive Explorer
              </h1>
              <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                Navigating the digital weave of Agusan Manobo oral literature. Currently{"\n"}displaying {filteredEntries.length} entries from the scholarly collection.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="mb-6 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search entries by title, content, themes, keywords..."
                className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8F000D] input-anim shadow-sm"
                style={{
                  borderRadius: '0px',
                  fontSize: '14px',
                }}
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors btn-anim anim-scale-in"
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* CARDS GRID */}
            <div key={page} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {paginatedEntries.map((entry, index) => {
                const isFeatured = index === 0 && page === 1
                const isFolkSong = entry.type === 'FOLK_SONG'
                const borderColor = isFolkSong ? '#f1b80d' : '#8F000D'

                if (isFeatured) {
                  // FEATURED 2-COLUMN HORIZONTAL CARD ("The Ascension of Agyu")
                  return (
                    <div
                      key={entry.id}
                      className="col-span-1 md:col-span-2 bg-white flex flex-col sm:flex-row justify-between shadow-sm stagger-item card-hover"
                      style={{
                        borderTop: '4px solid #8F000D',
                        borderLeft: '1px solid #8F000D',
                        borderRight: '1px solid #8F000D',
                        borderBottom: '1px solid #8F000D',
                        borderRadius: '0px',
                      }}
                    >
                      {/* Left side details */}
                      <div className="p-6 flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          {/* Badges */}
                          <div className="flex gap-2 mb-4">
                            <span className="text-[9px] font-bold bg-[#18181b] text-white px-2.5 py-1" style={{ borderRadius: '0px' }}>
                              {entry.genre} ({entry.type === 'FOLK_SONG' ? 'FOLK SONG' : 'ULAGING'})
                            </span>
                            {entry.themes.map(theme => (
                              <span key={theme} className="text-[9px] font-bold bg-[#fee2e2] text-[#8F000D] px-2.5 py-1" style={{ borderRadius: '0px' }}>
                                {theme}
                              </span>
                            ))}
                          </div>

                          {/* Title */}
                          <Link href={`/archive/${entry.id}`} style={{ textDecoration: 'none', color: '#1e293b' }}>
                            <h3 
                              style={{ 
                                margin: 0,
                                fontSize: '28px', 
                                fontWeight: 700, 
                                color: 'inherit',
                                fontFamily: 'Cormorant Garamond, Georgia, serif',
                                lineHeight: 1.15,
                                cursor: 'pointer'
                              }}
                              className="hover:text-[#8F000D] transition-colors"
                            >
                              {entry.title}
                            </h3>
                          </Link>

                          {/* Subtitle */}
                          {entry.manoboTitle && (
                            <p 
                              style={{ 
                                fontFamily: 'Cormorant Garamond, Georgia, serif',
                                fontStyle: 'italic',
                                color: '#8F000D',
                                fontSize: '16px',
                                margin: '4px 0 16px 0'
                              }}
                            >
                              {entry.manoboTitle}
                            </p>
                          )}

                          {/* Description */}
                          <p className="text-slate-600 text-xs leading-relaxed mb-6" style={{ whiteSpace: 'pre-line' }}>
                            {entry.content}
                          </p>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center gap-6 mt-auto">
                          <button
                            onClick={(e) => handlePlayClick(e, entry)}
                            className="flex items-center gap-2 text-white font-bold text-xs py-2.5 px-4 transition-colors btn-anim"
                            style={{
                              background: '#8F000D',
                              borderRadius: '0px',
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>LISTEN TO ORAL TEXT</span>
                          </button>

                          <div className="flex items-center gap-3">
                            {/* Custom progress line */}
                            <div className="w-16 h-[2px] bg-slate-200 relative" style={{ minWidth: '64px' }}>
                              <div
                                className="absolute left-0 top-0 h-full bg-[#8F000D]"
                                style={{ width: `${entry.confidence ?? 0}%` }}
                              />
                            </div>
                            <div className="flex flex-col text-[9px] font-bold text-slate-500 leading-none" style={{ letterSpacing: '0.05em' }}>
                              <span style={{ fontSize: '10px', color: '#1e293b' }}>{entry.confidence ?? 0}%</span>
                              <span style={{ fontSize: '8px', color: '#64748b' }}>CONFIDENCE</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side weave graphic */}
                      <div className="w-full sm:w-44 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-100">
                        <img 
                          src="/weave.png" 
                          alt="Agusan Manobo Weave" 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    </div>
                  )
                }

                // VERTICAL 1-COLUMN CARDS
                return (
                  <div
                    key={entry.id}
                    className="bg-white flex flex-col justify-between p-6 shadow-sm stagger-item card-hover"
                    style={{
                      borderTop: `4px solid ${borderColor}`,
                      borderLeft: `1px solid ${borderColor}`,
                      borderRight: `1px solid ${borderColor}`,
                      borderBottom: `1px solid ${borderColor}`,
                      borderRadius: '0px',
                    }}
                  >
                    <div>
                      {/* Badges */}
                      <div className="flex gap-2 mb-4">
                        <span className="text-[9px] font-bold bg-[#18181b] text-white px-2.5 py-1" style={{ borderRadius: '0px' }}>
                          {entry.type === 'FOLK_SONG' ? 'FOLK SONG' : entry.genre}
                        </span>
                        {entry.themes.slice(0, 1).map(theme => (
                          <span key={theme} className="text-[9px] font-bold bg-[#fee2e2] text-[#8F000D] px-2.5 py-1" style={{ borderRadius: '0px' }}>
                            {theme}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <Link href={`/archive/${entry.id}`} style={{ textDecoration: 'none', color: '#1e293b' }}>
                        <h3 
                          style={{ 
                            margin: 0,
                            fontSize: '22px', 
                            fontWeight: 700, 
                            color: 'inherit',
                            fontFamily: 'Cormorant Garamond, Georgia, serif',
                            lineHeight: 1.2,
                            cursor: 'pointer'
                          }}
                          className="hover:text-[#8F000D] transition-colors"
                        >
                          {entry.title}
                        </h3>
                      </Link>

                      {/* Subtitle */}
                      {entry.manoboTitle && (
                        <p 
                          style={{ 
                            fontFamily: 'Cormorant Garamond, Georgia, serif',
                            fontStyle: 'italic',
                            color: '#8F000D',
                            fontSize: '14px',
                            margin: '4px 0 16px 0'
                          }}
                        >
                          {entry.manoboTitle}
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-slate-600 text-xs leading-relaxed mb-6" style={{ whiteSpace: 'pre-line' }}>
                        {entry.content}
                      </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center mt-auto pt-4 border-t border-slate-100">
                      <button
                        onClick={(e) => handlePlayClick(e, entry)}
                        className="flex items-center gap-1.5 font-bold text-xs transition-colors btn-anim"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#8F000D',
                          padding: 0,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>PLAY RECORDING</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                {/* Prev page button */}
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-600 transition-colors disabled:opacity-50 btn-anim"
                  style={{ borderRadius: '0px', background: '#f1f5f9' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {/* Page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                  const isCurrent = page === pageNum
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className="h-8 flex items-center justify-center font-bold text-xs transition-colors px-3 btn-anim"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: isCurrent ? '2px solid #8F000D' : '2px solid transparent',
                        color: isCurrent ? '#8F000D' : '#64748b',
                        borderRadius: '0px',
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                {/* Next page button */}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-600 transition-colors disabled:opacity-50 btn-anim"
                  style={{ borderRadius: '0px', background: '#f1f5f9' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}
