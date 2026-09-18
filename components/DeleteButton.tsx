'use client'

import { useState } from 'react'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/lib/context/ToastContext'

export default function DeleteButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      showToast('success', 'Entry deleted successfully.')
      window.location.reload()
    } catch {
      setDeleting(false)
      setOpen(false)
      showToast('error', 'Failed to delete entry. Please try again.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-anim"
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
      <ConfirmModal
        open={open}
        title="Delete this entry?"
        message="This action cannot be undone. The entry and its associated data will be permanently removed."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
