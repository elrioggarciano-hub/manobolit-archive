'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import LogoutButton from '@/components/LogoutButton'

export interface AdminEntry {
  id: string
  title: string
  type: string
  genre: string
  municipality: string
  province: string
  yearCollected: number | null
  createdAt: string | Date
}

const GENRE_COLORS: Record<string, string> = {
  MYTH: '#8b5cf6',
  LEGEND: '#3b82f6',
  FOLKTALE: '#10b981',
  EPIC: '#f59e0b',
  RIDDLE: '#ec4899',
  PROVERB: '#14b8a6',
  SONG: '#f97316',
  CHANT: '#6366f1',
  PRAYER: '#84cc16',
  INCANTATION: '#e11d48',
}

interface Props {
  initialEntries: AdminEntry[]
}

export default function AdminClient({ initialEntries }: Props) {
  const [filterType, setFilterType] = useState<'ALL' | 'ORAL_LITERATURE' | 'FOLK_SONG'>('ALL')
  const [filterGenre, setFilterGenre] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGenreDrawer, setShowGenreDrawer] = useState(false)

  // Compute genres and counts
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of initialEntries) {
      counts[e.genre] = (counts[e.genre] || 0) + 1
    }
    return counts
  }, [initialEntries])

  const uniqueGenres = useMemo(() => Object.keys(genreCounts), [genreCounts])

  const oralCount = useMemo(
    () => initialEntries.filter(e => e.type === 'ORAL_LITERATURE').length,
    [initialEntries]
  )

  const songCount = useMemo(
    () => initialEntries.filter(e => e.type === 'FOLK_SONG').length,
    [initialEntries]
  )

  // Filter entries based on active filters & search query
  const filteredEntries = useMemo(() => {
    return initialEntries.filter(entry => {
      // Type filter
      if (filterType !== 'ALL' && entry.type !== filterType) return false

      // Genre filter
      if (filterGenre !== 'ALL' && entry.genre !== filterGenre) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = entry.title.toLowerCase().includes(q)
        const matchesGenre = entry.genre.toLowerCase().includes(q)
        const matchesMuni = entry.municipality.toLowerCase().includes(q)
        const matchesProv = entry.province.toLowerCase().includes(q)
        if (!matchesTitle && !matchesGenre && !matchesMuni && !matchesProv) {
          return false
        }
      }

      return true
    })
  }, [initialEntries, filterType, filterGenre, searchQuery])

  const isFiltered = filterType !== 'ALL' || filterGenre !== 'ALL' || searchQuery.trim() !== ''

  const handleClearFilters = () => {
    setFilterType('ALL')
    setFilterGenre('ALL')
    setSearchQuery('')
    setShowGenreDrawer(false)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        paddingTop: '80px',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center"
          style={{ marginBottom: '32px' }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                letterSpacing: '-0.01em',
              }}
            >
              🛠 Admin Panel
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Manage all {initialEntries.length} literature entries • Click any card below to filter
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/admin/new"
              className="text-center sm:text-left btn-anim"
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, var(--primary-red, #8F000D), var(--primary-red-dark, #5c000a))',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '0 2px 6px rgba(143, 0, 13, 0.25)',
              }}
            >
              + New Entry
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Interactive Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5" style={{ marginBottom: '24px' }}>
          {/* Card 1: Total Entries */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="stagger-item btn-anim"
            style={{
              background: 'var(--bg-surface)',
              border: filterType === 'ALL' && filterGenre === 'ALL' && !searchQuery
                ? '2px solid #8F000D'
                : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '18px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: filterType === 'ALL' && filterGenre === 'ALL' && !searchQuery
                ? '0 4px 14px rgba(143, 0, 13, 0.12)'
                : 'none',
            }}
            title="Click to view all entries"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>📚</span>
              {filterType === 'ALL' && filterGenre === 'ALL' && !searchQuery && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#fff',
                    background: '#8F000D',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ACTIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {initialEntries.length}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Total Entries
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Show all archive items
            </div>
          </button>

          {/* Card 2: Oral Literature */}
          <button
            type="button"
            onClick={() => {
              if (filterType === 'ORAL_LITERATURE') {
                setFilterType('ALL')
              } else {
                setFilterType('ORAL_LITERATURE')
                setFilterGenre('ALL')
              }
            }}
            className="stagger-item btn-anim"
            style={{
              background: 'var(--bg-surface)',
              border: filterType === 'ORAL_LITERATURE'
                ? '2px solid #8F000D'
                : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '18px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: filterType === 'ORAL_LITERATURE'
                ? '0 4px 14px rgba(143, 0, 13, 0.12)'
                : 'none',
            }}
            title="Click to filter by Oral Literature"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>📖</span>
              {filterType === 'ORAL_LITERATURE' && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#fff',
                    background: '#8F000D',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ACTIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {oralCount}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Oral Literature
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Riddles, Folktales, Proverbs
            </div>
          </button>

          {/* Card 3: Folk Songs */}
          <button
            type="button"
            onClick={() => {
              if (filterType === 'FOLK_SONG') {
                setFilterType('ALL')
              } else {
                setFilterType('FOLK_SONG')
                setFilterGenre('ALL')
              }
            }}
            className="stagger-item btn-anim"
            style={{
              background: 'var(--bg-surface)',
              border: filterType === 'FOLK_SONG'
                ? '2px solid #8F000D'
                : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '18px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: filterType === 'FOLK_SONG'
                ? '0 4px 14px rgba(143, 0, 13, 0.12)'
                : 'none',
            }}
            title="Click to filter by Folk Songs"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>🎵</span>
              {filterType === 'FOLK_SONG' && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#fff',
                    background: '#8F000D',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  ACTIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {songCount}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Folk Songs
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Audio tracks & verses
            </div>
          </button>

          {/* Card 4: Unique Genres */}
          <button
            type="button"
            onClick={() => {
              setShowGenreDrawer(!showGenreDrawer)
            }}
            className="stagger-item btn-anim"
            style={{
              background: 'var(--bg-surface)',
              border: filterGenre !== 'ALL' || showGenreDrawer
                ? '2px solid #8F000D'
                : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '18px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: filterGenre !== 'ALL' || showGenreDrawer
                ? '0 4px 14px rgba(143, 0, 13, 0.12)'
                : 'none',
            }}
            title="Click to choose specific genre"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>🏷</span>
              {(filterGenre !== 'ALL' || showGenreDrawer) && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#fff',
                    background: '#8F000D',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {filterGenre !== 'ALL' ? filterGenre : 'PICK GENRE'}
                </span>
              )}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {uniqueGenres.length}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
              Unique Genres
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {showGenreDrawer ? '▲ Hide genre filter' : '▼ Click to filter by genre'}
            </div>
          </button>
        </div>

        {/* Collapsible / Expandable Genre Pills Bar */}
        {(showGenreDrawer || filterGenre !== 'ALL') && (
          <div
            className="anim-fade-in"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Filter by Literature Genre (Eugenio Taxonomy):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setFilterGenre('ALL')}
                className="btn-anim"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: filterGenre === 'ALL' ? '1px solid #8F000D' : '1px solid var(--border-color)',
                  background: filterGenre === 'ALL' ? '#8F000D' : 'var(--bg-input)',
                  color: filterGenre === 'ALL' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                All Genres ({initialEntries.length})
              </button>
              {uniqueGenres.map(genre => {
                const count = genreCounts[genre] || 0
                const isSelected = filterGenre === genre
                const color = GENRE_COLORS[genre] || '#6366f1'
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      if (filterGenre === genre) {
                        setFilterGenre('ALL')
                      } else {
                        setFilterGenre(genre)
                        setFilterType('ALL')
                      }
                    }}
                    className="btn-anim"
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${color}` : `1px solid ${color}44`,
                      background: isSelected ? color : `${color}18`,
                      color: isSelected ? '#ffffff' : color,
                      boxShadow: isSelected ? `0 2px 8px ${color}44` : 'none',
                    }}
                  >
                    {genre} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Search & Active Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 justify-between items-stretch">
          {/* Quick Search Input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search entries by title, genre, municipality..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-anim"
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Active Filter Info & Reset Button */}
          {isFiltered && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid #8F000D44',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>
                Showing <strong>{filteredEntries.length}</strong> of {initialEntries.length} entries
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-anim"
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  color: '#8F000D',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Reset ×
              </button>
            </div>
          )}
        </div>

        {/* Entry List */}
        {filteredEntries.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border-color)',
              borderRadius: '16px',
              padding: '60px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>No entries found</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px' }}>
              {isFiltered
                ? 'No items matched your active filter or search.'
                : 'Start by adding your first literature entry.'}
            </p>
            {isFiltered ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-anim"
                style={{
                  padding: '10px 22px',
                  background: '#8F000D',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Clear all filters
              </button>
            ) : (
              <Link
                href="/admin/new"
                style={{
                  padding: '10px 22px',
                  background: 'linear-gradient(135deg, var(--primary-red), var(--primary-red-dark))',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                + Add First Entry
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredEntries.map(entry => {
              const color = GENRE_COLORS[entry.genre] || '#6366f1'
              return (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 justify-between sm:items-center row-anim card-hover"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                  }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        background: color + '22',
                        border: `1px solid ${color}44`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0,
                      }}
                    >
                      {entry.type === 'FOLK_SONG' ? '🎵' : '📖'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.title}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span
                          style={{
                            background: color + '22',
                            color,
                            border: `1px solid ${color}44`,
                            padding: '1px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {entry.genre}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {entry.municipality}, {entry.province}
                        </span>
                        {entry.yearCollected && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            · {entry.yearCollected}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-2.5 mt-2 sm:mt-0 justify-end flex-shrink-0">
                    <Link
                      href={`/archive/${entry.id}`}
                      className="btn-anim"
                      style={{
                        padding: '6px 14px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/${entry.id}/edit`}
                      className="btn-anim"
                      style={{
                        padding: '6px 14px',
                        background: 'rgba(196, 30, 58, 0.1)',
                        border: '1px solid rgba(196, 30, 58, 0.3)',
                        color: 'var(--primary-red, #8F000D)',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      Edit
                    </Link>
                    <DeleteButton id={entry.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
