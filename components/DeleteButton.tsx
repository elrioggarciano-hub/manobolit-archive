'use client'

export default function DeleteButton({ id }: { id: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (!confirm('Delete this entry? This cannot be undone.')) return
        try {
          const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Delete failed')
          window.location.reload()
        } catch (err) {
          alert('Failed to delete entry')
        }
      }}
      style={{
        padding: '6px 14px',
        background: '#7f1d1d22',
        border: '1px solid #ef444455',
        color: '#f87171',
        cursor: 'pointer',
        borderRadius: '6px',
        fontSize: '12px',
      }}
    >
      Delete
    </button>
  )
}
