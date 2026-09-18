'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ClassificationScore {
  genre: string
  confidence: number
}

interface ThemeScore {
  value: string
  confidence: number
  ruleId: string
}

interface ClassificationResult {
  genre: {
    value: string
    confidence: number
    rulesApplied: string[]
    allScores: ClassificationScore[]
  }
  themes: ThemeScore[]
  rulesApplied: string[]
  overallConfidence: number
}

interface Props {
  result: ClassificationResult
  onAccept?: (genre: string, themes: string[]) => void
  onClose?: () => void
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

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0' }}>
      <div style={{
        flex: 1,
        height: '8px',
        background: '#1e293b',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.round(value * 100)}%`,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: '12px', color: '#94a3b8', minWidth: '36px', textAlign: 'right' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}

export default function ClassificationViewer({ result, onAccept, onClose }: Props) {
  const topGenre = result.genre.value
  const genreColor = GENRE_COLORS[topGenre] || '#6366f1'
  const topThemes = result.themes.slice(0, 4)

  return (
    <div className="anim-scale-in" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '1px solid #334155',
      borderRadius: '16px',
      padding: '24px',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
            🧠 Classification Results
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Rule-Based Engine · Eugenio (1993) + Andress (1985)
          </p>
        </div>
        <div style={{
          background: genreColor + '22',
          border: `1px solid ${genreColor}44`,
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: 600,
          color: genreColor,
        }}>
          {Math.round(result.overallConfidence * 100)}% confidence
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Genre Panel */}
        <div style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#64748b', fontWeight: 600, marginBottom: '10px' }}>
            GENRE · EUGENIO (1993)
          </div>
          <div style={{
            display: 'inline-block',
            background: genreColor + '22',
            border: `1px solid ${genreColor}`,
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '13px',
            fontWeight: 700,
            color: genreColor,
            marginBottom: '14px',
          }}>
            {topGenre}
          </div>
          <div>
            {result.genre.allScores.slice(0, 5).map(s => (
              <div key={s.genre}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
                  <span>{s.genre}</span>
                </div>
                <ConfidenceBar value={s.confidence} color={GENRE_COLORS[s.genre] || '#6366f1'} />
              </div>
            ))}
          </div>
        </div>

        {/* Themes Panel */}
        <div style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '16px',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#64748b', fontWeight: 600, marginBottom: '10px' }}>
            THEMES · ANDRESS (1985)
          </div>
          {topThemes.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#64748b' }}>No themes detected above threshold.</p>
          ) : (
            topThemes.map(t => (
              <div key={t.value} style={{ marginBottom: '10px' }}>
                <div style={{
                  display: 'inline-block',
                  background: '#1e40af22',
                  border: '1px solid #3b82f655',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#60a5fa',
                  marginBottom: '4px',
                }}>
                  {t.value.replace(/_/g, ' ')}
                </div>
                <ConfidenceBar value={t.confidence} color="#3b82f6" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rules Applied */}
      <div style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>
          RULES APPLIED
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {result.rulesApplied.map(r => (
            <span key={r} style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              color: '#94a3b8',
              fontFamily: 'monospace',
            }}>
              {r}
            </span>
          ))}
          {result.rulesApplied.length === 0 && (
            <span style={{ fontSize: '12px', color: '#475569' }}>No specific rules matched</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {(onAccept || onClose) && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-anim"
              style={{
                padding: '8px 20px',
                background: 'transparent',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Discard
            </button>
          )}
          {onAccept && (
            <button
              onClick={() => onAccept(result.genre.value, result.themes.map(t => t.value))}
              className="btn-anim"
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ✓ Accept Classification
            </button>
          )}
        </div>
      )}
    </div>
  )
}
