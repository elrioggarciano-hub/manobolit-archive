'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface ManualMeta {
  fileName: string
  fileSize: number
  fileSizeBytes: string
  updatedAt: string
  url: string
  title: string
  subtitle: string
  pageCount: number
  authors: string
  institution: string
  source: string
  version: string
}

export default function ManualManagement() {
  const [meta, setMeta] = useState<ManualMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [versionInput, setVersionInput] = useState('1.0')
  const [titleInput, setTitleInput] = useState('ManoboLit Archive — Official User Manual')
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMeta = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/manual')
      if (res.ok) {
        const data = await res.json()
        setMeta(data)
        if (data.version) setVersionInput(data.version)
        if (data.title) setTitleInput(data.title)
      }
    } catch (err) {
      console.error('Failed to load manual metadata:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeta()
  }, [])

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setStatusMessage({ type: 'error', text: 'Error: Only PDF documents (.pdf) can be uploaded.' })
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Error: File size exceeds the 25MB limit.' })
      return
    }
    setSelectedFile(file)
    setStatusMessage(null)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setStatusMessage({ type: 'error', text: 'Please select a PDF file first.' })
      return
    }

    try {
      setUploading(true)
      setStatusMessage(null)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', titleInput)
      formData.append('version', versionInput)

      const res = await fetch('/api/admin/manual', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setStatusMessage({
        type: 'success',
        text: 'User Manual PDF updated and published successfully! Users can now print or save it as PDF.',
      })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchMeta()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload user manual.' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Heading */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📄</span>
              <span>Digital User Manual & Printable PDF Settings</span>
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '720px', lineHeight: 1.5 }}>
              Upload and manage the official PDF User Manual. When researchers, students, or visitors click{' '}
              <strong style={{ color: 'var(--text-primary)' }}>&quot;Print manual&quot;</strong> on the User Manual page, this exact PDF document is served so they can read, print, or click &quot;Save as PDF&quot;.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/manual"
              target="_blank"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>🌐</span>
              <span>Open /manual Page</span>
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: statusMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
            }}
          >
            <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Status & Upload, Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 5 Cols */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Active Manual Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Published Manual
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#15803d',
                  background: 'rgba(34, 197, 94, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                }}
              >
                ● Live & Active
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Loading manual details...
              </div>
            ) : meta ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 800,
                    }}
                  >
                    PDF
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={meta.fileName}
                    >
                      {meta.fileName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {meta.fileSizeBytes} • Version {meta.version} • {meta.pageCount} Pages
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Authors:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{meta.authors}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Institution:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>ADSSU CCIS</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Last Updated:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {new Date(meta.updatedAt).toLocaleDateString()} {new Date(meta.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href={meta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: '#0f3822',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <span>👁️</span>
                    <span>Preview PDF in New Tab</span>
                  </a>

                  <a
                    href={meta.url.includes('?') ? `${meta.url}&download=1` : `${meta.url}?download=1`}
                    download={meta.fileName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <span>⬇️</span>
                    <span>Download / Save as PDF</span>
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          {/* Upload New User Manual Form */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <h3
              style={{
                margin: '0 0 14px',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📤</span>
              <span>Upload New / Revised User Manual</span>
            </h3>

            <form onSubmit={handleUpload}>
              {/* Drag and Drop Zone */}
              <div
                onDragOver={e => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setIsDragOver(false)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0])
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragOver ? '2px dashed #0f3822' : '2px dashed var(--border-color)',
                  borderRadius: '10px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: isDragOver ? 'rgba(15, 56, 34, 0.05)' : 'var(--bg-main)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '16px',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0])
                    }
                  }}
                />

                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                {selectedFile ? (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px', fontWeight: 600 }}>
                      Ready to upload ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Click to choose a different PDF
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Drag and drop your PDF manual here
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      or click to browse from your computer (Max 25MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Version & Title fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                    placeholder="ManoboLit Archive — Official User Manual"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Version Tag
                  </label>
                  <input
                    type="text"
                    value={versionInput}
                    onChange={e => setVersionInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  background: !selectedFile || uploading
                    ? 'var(--border-color)'
                    : 'linear-gradient(135deg, var(--primary-red, #8F000D), var(--primary-red-dark, #5c000a))',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s ease',
                  boxShadow: '0 2px 6px rgba(143, 0, 13, 0.2)',
                }}
              >
                {uploading ? '⏳ Uploading and publishing...' : '📤 Upload & Publish User Manual'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: 7 Cols (Interactive Live PDF Viewer) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                📖 Live PDF Document Preview
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                This is the exact document presented when users click &quot;Print manual&quot; or save as PDF.
              </p>
            </div>
            {meta?.url && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={meta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                  }}
                >
                  ↗ Full Screen
                </a>
              </div>
            )}
          </div>

          <div
            style={{
              width: '100%',
              height: '680px',
              background: '#525659',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              position: 'relative',
            }}
          >
            {meta?.url ? (
              <iframe
                src={`${meta.url}#toolbar=1&navpanes=1`}
                title="Active User Manual PDF Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                No active PDF loaded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

