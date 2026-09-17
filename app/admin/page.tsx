import Link from 'next/link'
import { prisma } from '@/lib/database/prisma'
import DeleteButton from '@/components/DeleteButton'
import LogoutButton from '@/components/LogoutButton'

const GENRE_COLORS: Record<string, string> = {
  MYTH: '#8b5cf6', LEGEND: '#3b82f6', FOLKTALE: '#10b981', EPIC: '#f59e0b',
  RIDDLE: '#ec4899', PROVERB: '#14b8a6', SONG: '#f97316', CHANT: '#6366f1',
  PRAYER: '#84cc16', INCANTATION: '#e11d48',
}

export default async function AdminPage() {
  const entries = await prisma.literatureEntry.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const parsed = entries.map(e => ({
    ...e,
    themes: JSON.parse(e.themes || '[]') as string[],
  }))

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingTop: '80px', fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center" style={{ marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
              🛠 Admin Panel
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Manage all {entries.length} literature entries
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link href="/admin/new" className="text-center sm:text-left" style={{
              padding: '10px 22px',
              background: 'linear-gradient(135deg, var(--primary-red), var(--primary-red-dark))',
              color: '#fff', textDecoration: 'none',
              borderRadius: '10px', fontWeight: 700, fontSize: '14px',
            }}>
              + New Entry
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: '28px' }}>
          {[
            { label: 'Total Entries', value: entries.length, icon: '📚' },
            { label: 'Oral Literature', value: entries.filter(e => e.type === 'ORAL_LITERATURE').length, icon: '📖' },
            { label: 'Folk Songs', value: entries.filter(e => e.type === 'FOLK_SONG').length, icon: '🎵' },
            { label: 'Unique Genres', value: new Set(entries.map(e => e.genre)).size, icon: '🏷' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Entry List */}
        {parsed.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: '16px',
            padding: '60px', textAlign: 'center', color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>No entries yet</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px' }}>Start by adding your first literature entry.</p>
            <Link href="/admin/new" style={{
              padding: '10px 22px', background: 'linear-gradient(135deg, var(--primary-red), var(--primary-red-dark))',
              color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
            }}>
              + Add First Entry
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {parsed.map(entry => {
              const color = GENRE_COLORS[entry.genre] || '#6366f1'
              return (
                <div key={entry.id} className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 justify-between sm:items-center" style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px',
                }}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      background: color + '22', border: `1px solid ${color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', flexShrink: 0,
                    }}>
                      {entry.type === 'FOLK_SONG' ? '🎵' : '📖'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.title}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ background: color + '22', color, border: `1px solid ${color}44`, padding: '1px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          {entry.genre}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {entry.municipality}, {entry.province}
                        </span>
                        {entry.yearCollected && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>· {entry.yearCollected}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-2.5 mt-2 sm:mt-0 justify-end flex-shrink-0">
                    <Link href={`/archive/${entry.id}`} style={{
                      padding: '6px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: '6px', fontSize: '12px',
                    }}>
                      View
                    </Link>
                    <Link href={`/admin/${entry.id}/edit`} style={{
                      padding: '6px 14px', background: 'rgba(196, 30, 58, 0.1)', border: '1px solid rgba(196, 30, 58, 0.3)',
                      color: 'var(--primary-red)', textDecoration: 'none', borderRadius: '6px', fontSize: '12px',
                    }}>
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
