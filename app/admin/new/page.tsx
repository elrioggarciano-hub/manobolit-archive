import EntryForm from '@/components/EntryForm'
import Link from 'next/link'

export default function NewEntryPage() {
  return (
    <main className="anim-fade-in" style={{ minHeight: '100vh', background: '#020617', paddingTop: '80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Link href="/admin" className="btn-anim" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>
            ← Admin
          </Link>
          <span style={{ color: '#334155' }}>/</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
            New Entry
          </h1>
        </div>
        <EntryForm mode="create" />
      </div>
    </main>
  )
}
