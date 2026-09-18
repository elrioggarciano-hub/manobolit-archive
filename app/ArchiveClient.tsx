'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAudio } from '@/lib/context/AudioContext'
import CountUp from '@/components/CountUp'

interface Entry {
  id: string
  title: string
  manoboTitle?: string | null
  englishTitle?: string | null
  type: string
  content: string
  source: string
  narrator?: string | null
  province: string
  municipality: string
  genre: string
  themes: string[]
  culturalElements: string[]
  audioFile?: string | null
  yearCollected?: number | null
}

const GENRE_COLORS: Record<string, string> = {
  MYTH: '#B22222',
  LEGEND: '#d97706',
  FOLKTALE: '#16a34a',
  EPIC: '#4f46e5',
  RIDDLE: '#db2777',
  PROVERB: '#0d9488',
  SONG: '#ea580c',
  CHANT: '#9333ea',
  PRAYER: '#65a30d',
  INCANTATION: '#e11d48',
}

const ALL_GENRES = ['MYTH', 'LEGEND', 'FOLKTALE', 'EPIC', 'RIDDLE', 'PROVERB', 'SONG', 'CHANT', 'PRAYER', 'INCANTATION']
const ALL_TYPES = ['ORAL_LITERATURE', 'FOLK_SONG']

export default function ArchiveClient({ entries }: { entries: Entry[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio()

  const totalEntries = entries.length
  const oralLit = entries.filter(e => e.type === 'ORAL_LITERATURE').length
  const folkSongs = entries.filter(e => e.type === 'FOLK_SONG').length

  const handlePlayClick = (e: React.MouseEvent, entry: Entry) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (entry.audioFile) {
      if (currentTrack?.audioFile === entry.audioFile) {
        togglePlay()
      } else {
        playTrack({
          audioFile: entry.audioFile,
          title: entry.title,
          narrator: entry.narrator || entry.source || 'Agusan Manobo',
          duration: null
        })
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* 1. HERO SECTION */}
      <section
        className="anim-fade-in"
        style={{
          background: 'linear-gradient(135deg, var(--primary-red) 0%, var(--primary-red-dark) 100%)',
          padding: '100px 20px 80px',
          textAlign: 'center',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div 
            style={{
              display: 'inline-block',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '0px',
              padding: '6px 18px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.1em',
              marginBottom: '28px',
              textTransform: 'uppercase',
            }}
          >
            SCHOLARLY PRESERVATION
          </div>
          
          <h1 
            style={{
              fontSize: 'clamp(36px, 5.5vw, 56px)',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.15,
              margin: '0 0 24px',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
            }}
          >
            Preserving the Agusan Manobo<br />Voice
          </h1>

          <p 
            style={{ 
              color: 'rgba(255, 255, 255, 0.85)', 
              fontSize: '16px', 
              maxWidth: '650px', 
              margin: '0 auto 40px', 
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            A rule-based classification and retrieval system for oral literature and folk<br />songs, maintaining cultural integrity through scientific precision.
          </p>

          {/* Search container */}
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              router.push(`/explore?search=${encodeURIComponent(search)}`)
            }}
            style={{
              display: 'flex',
              maxWidth: '640px',
              margin: '0 auto',
              background: '#ffffff',
              borderRadius: '0px',
              padding: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, paddingLeft: '16px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Explore the Archive..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  padding: '12px 14px',
                  fontSize: '14px',
                  color: '#1e293b',
                  background: 'transparent',
                }}
              />
            </div>
            <button
              type="submit"
              className="btn-anim"
              style={{
                background: '#8F000D',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0px',
                padding: '12px 28px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#70000a'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8F000D'}
            >
              SEARCH
            </button>
          </form>
        </div>
      </section>

      {/* 2. ARCHIVE AT A GLANCE SECTION */}
      <section className="scroll-reveal" style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 60px' }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end', 
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px',
            marginBottom: '40px' 
          }}
        >
          <div style={{ position: 'relative' }}>
            <h2 
              style={{ 
                margin: 0, 
                fontSize: '28px', 
                fontWeight: 700, 
                color: 'var(--text-primary)', 
                fontFamily: 'Cormorant Garamond, Georgia, serif' 
              }}
            >
              Archive at a Glance
            </h2>
            <div style={{ position: 'absolute', bottom: '-9px', left: 0, width: '90px', height: '4px', background: '#8F000D' }} />
          </div>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            REAL-TIME DATA
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Card A */}
          <div
            className="stagger-item"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '0px',
              borderTop: '5px solid #8F000D',
              padding: '40px 32px 36px 32px',
              boxShadow: '0 20px 40px -15px rgba(143, 0, 13, 0.08), 0 15px 30px -10px rgba(0, 0, 0, 0.05)',
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 30px 50px -15px rgba(143, 0, 13, 0.12), 0 20px 40px -10px rgba(0, 0, 0, 0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(143, 0, 13, 0.08), 0 15px 30px -10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                <path d="M12 21V7l3.5-3.5v14z" fill="var(--brand-accent)" stroke="var(--brand-accent)" strokeWidth="1" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', fontFamily: "'Montserrat', 'Inter', sans-serif" }}>CATALOGUE A</span>
            </div>
            <div style={{ marginTop: '28px' }}>
              <div style={{ fontSize: '64px', fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, Georgia, serif', lineHeight: 1 }}><CountUp value={oralLit} /></div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", marginTop: '2px', letterSpacing: '0.01em' }}>Oral Literature Pieces</div>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", lineHeight: 1.6, marginTop: '16px' }}>
              Classified myths, legends, and epics from Agusan regions.
            </p>
          </div>

          {/* Card B */}
          <div
            className="stagger-item"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '0px',
              borderTop: '5px solid #f1b80d',
              padding: '40px 32px 36px 32px', 
              boxShadow: '0 20px 40px -15px rgba(241, 184, 13, 0.12), 0 15px 30px -10px rgba(0, 0, 0, 0.05)', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 30px 50px -15px rgba(241, 184, 13, 0.18), 0 20px 40px -10px rgba(0, 0, 0, 0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(241, 184, 13, 0.12), 0 15px 30px -10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f1b80d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                <circle cx="8" cy="18" r="4" fill="#f1b80d" />
                <path d="M12 18V2l7 4" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', fontFamily: "'Montserrat', 'Inter', sans-serif" }}>CATALOGUE B</span>
            </div>
            <div style={{ marginTop: '28px' }}>
              <div style={{ fontSize: '64px', fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, Georgia, serif', lineHeight: 1 }}><CountUp value={folkSongs} /></div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", marginTop: '2px', letterSpacing: '0.01em' }}>Folk Songs</div>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", lineHeight: 1.6, marginTop: '16px' }}>
              Authentic rhythmic recordings with melodic annotations.
            </p>
          </div>

          {/* Card C */}
          <div
            className="stagger-item"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '0px',
              borderTop: '5px solid #8F000D',
              padding: '40px 32px 36px 32px',
              boxShadow: '0 20px 40px -15px rgba(143, 0, 13, 0.08), 0 15px 30px -10px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 30px 50px -15px rgba(143, 0, 13, 0.12), 0 20px 40px -10px rgba(0, 0, 0, 0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(143, 0, 13, 0.08), 0 15px 30px -10px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                <path d="M4 10v4M8 6v12M12 3v18M16 6v12M20 10v4" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', fontFamily: "'Montserrat', 'Inter', sans-serif" }}>CATALOGUE C</span>
            </div>
            <div style={{ marginTop: '28px' }}>
              <div style={{ fontSize: '64px', fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, Georgia, serif', lineHeight: 1 }}><CountUp value={totalEntries} /></div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", marginTop: '2px', letterSpacing: '0.01em' }}>Audio Transcriptions</div>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", lineHeight: 1.6, marginTop: '16px' }}>
              High-fidelity linguistic records with morphological tagging.
            </p>
          </div>
        </div>
      </section>

      {/* 3. SCIENTIFIC APPROACH SECTION */}
      <section id="about" className="scroll-reveal" style={{ background: 'var(--bg-surface)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          {/* Left: Manobo Chanter Photo with Since overlay */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '550px' }}>
            <div style={{ borderRadius: '0px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(15,23,42,0.1)' }}>
              <img
                src="/manobo-chanter.jpg"
                alt="Abina Tawide Coguit, a Manobo chanter, baylan, and master weaver from La Paz, Agusan del Sur, at work on traditional beadwork"
                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', objectPosition: '50% 10%', display: 'block' }}
              />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-24px',
              right: '-24px',
              background: '#8F000D',
              color: '#ffffff',
              padding: '20px 32px',
              textAlign: 'center',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              borderRadius: '0px',
              boxShadow: '0 8px 24px rgba(143, 0, 13, 0.2)',
              zIndex: 5,
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.15em', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>SINCE</div>
              <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '4px', lineHeight: 1 }}>1985</div>
            </div>
            {/* Required CC BY-SA 4.0 attribution */}
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '9px', color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.8)', zIndex: 5 }}>
              Photo: Valenzuela400 /{' '}
              <a
                href="https://commons.wikimedia.org/wiki/File:Abina_Tawide_Coguit_weaving.jpg"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                Wikimedia Commons
              </a>{' '}
              (CC BY-SA 4.0)
            </div>
          </div>

          {/* Right: Scientific details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-accent)', letterSpacing: '0.1em' }}>CLASSIFICATION FRAMEWORKS</span>
            
            <h2 style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, Georgia, serif', lineHeight: 1.2 }}>
              A Scientific Approach to Oral Tradition
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '10px' }}>
              {/* Bullet 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', border: '1.5px solid #8F000D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-accent)', fontWeight: 700, borderRadius: '0px', fontSize: '13px' }}>1</div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>Eugenio (1993)</h3>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                  Focuses on the categorization of Philippine folk literature into myths, legends, fables, and fantastic stories, providing a taxonomic framework for structural analysis.
                </p>
              </div>

              {/* Bullet 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', border: '1.5px solid #8F000D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-accent)', fontWeight: 700, borderRadius: '0px', fontSize: '13px' }}>2</div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>Andress (1985)</h3>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                  The foundational linguistic framework for Agusan Manobo, offering deep phonological and morphological rules essential for accurate transcription.
                </p>
              </div>
            </div>

            {/* Quote block */}
            <div style={{ borderLeft: '4px solid #f1b80d', background: 'var(--bg-main)', padding: '20px 24px', marginTop: '24px', borderRadius: '0px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                &ldquo;By combining these frameworks, ManoboLit ensures that every piece of recorded history is placed within its rightful cultural and linguistic context.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXPERIENCE THE LIVING HERITAGE SECTION */}
      <section className="scroll-reveal" style={{ padding: '80px 24px', background: 'var(--bg-main)' }}>
        <div 
          style={{ 
            maxWidth: '1000px',
            margin: '0 auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '80px 40px',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '24px',
            textAlign: 'center',
            borderRadius: '0px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '42px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            Experience the Living Heritage
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", lineHeight: 1.6, maxWidth: '650px' }}>
            Dive into the rich tapestry of the Agusan Manobo. Use our rule-based search<br />to find specific themes, genres, or locations.
          </p>
          <button 
            onClick={() => router.push('/explore')}
            style={{
              background: '#f1b80d',
              color: '#1e293b',
              border: 'none',
              borderRadius: '0px',
              padding: '16px 36px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              marginTop: '8px',
              boxShadow: '0 4px 12px rgba(241,184,13,0.2)',
              transition: 'transform 0.2s, background-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#d4a007'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f1b80d'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            START EXPLORING &rarr;
          </button>
        </div>
      </section>


    </div>
  )
}
