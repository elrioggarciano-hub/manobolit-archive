'use client'

import Link from 'next/link'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

export default function AboutClient() {
  const isMobile = useIsMobile(860)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── SECTION 1: CULTURAL MISSION ── */}
      <section className="anim-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '48px 20px 40px' : '80px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 420px', gap: isMobile ? '40px' : '64px', alignItems: 'start' }}>

          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Mission block */}
            <div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#8F000D',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '16px',
              }}>
                CULTURAL MISSION
              </span>

              <h1 style={{
                margin: '0 0 20px',
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                fontWeight: 700,
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                lineHeight: 1.2,
                color: 'var(--text-primary)',
              }}>
                Dedicated to the Preservation of Agusan Manobo Oral Traditions
              </h1>

              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '520px' }}>
                Our mission is rooted in the reverence of heritage. We provide a scientific and
                digital framework to archive the rich oral literature and folk songs of the
                Manobo people, ensuring their voices endure through the precision of modern
                archival technology.
              </p>
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0' }} />

            {/* Retrieval System block */}
            <div>
              <h2 style={{
                margin: '0 0 12px',
                fontSize: '22px',
                fontWeight: 700,
                color: '#8F000D',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
              }}>
                The Retrieval System
              </h2>

              <p style={{ margin: '0 0 28px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '520px' }}>
                The ManoboLit Archive serves as a responsive retrieval system, housing a curated collection of
                17 oral literature pieces and 5 folk songs. This digital repository is built upon rigorous scholarly
                research, primarily backed by the 2024 studies of Catipay &amp; Curato and Maravilla, focusing on
                the intersection of cultural linguistics and digital archival sciences.
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '40px' }}>
                <div>
                  <div style={{
                    fontSize: '52px',
                    fontWeight: 400,
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}>
                    17
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#8F000D', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Oral Literature Pieces
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '52px',
                    fontWeight: 400,
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    color: '#f1b80d',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}>
                    05
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f1b80d', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Sacred Folk Songs
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Main photo */}
            <div style={{
              position: 'relative',
              borderRadius: '0px',
              overflow: 'hidden',
              aspectRatio: '4/3',
              background: '#1e293b',
            }}>
              <img
                src="/manobo-weave-pattern.jpg"
                alt="Suyam embroidery pattern on a traditional Manobo blouse by master weaver Abina Tawide Coguit, La Paz, Agusan del Sur"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%', display: 'block' }}
              />
              {/* Required CC BY-SA 4.0 attribution */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px 10px 6px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                fontSize: '9px',
                color: 'rgba(255,255,255,0.8)',
              }}>
                Photo: Valenzuela400 /{' '}
                <a
                  href="https://commons.wikimedia.org/wiki/File:Suyam_Abina_Tawide_Coguit_La_Paz_Agusan_del_Sur_Manobo_folk_dressB.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,0.95)' }}
                >
                  Wikimedia Commons
                </a>{' '}
                (CC BY-SA 4.0)
              </div>
            </div>

            {/* Scientific Taxonomy card — dark charcoal matching Figma */}
            <div style={{
              background: '#1A1A1A',
              color: '#ffffff',
              padding: '40px 39px 40px 61px',
              borderRadius: '0px',
              borderTop: '4px solid #B22222',
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#f1b80d',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                marginBottom: '14px',
              }}>
                Scientific Taxonomy
              </div>
              <p style={{ margin: '0 0 24px', fontSize: '13px', lineHeight: 1.65, color: 'rgba(255,255,255,0.82)' }}>
                To ensure the highest archival integrity, we
                utilize rule-based classification models
                derived from established folkloric frameworks:
              </p>

              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1b80d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {/* Triangle on top */}
                      <polygon points="12,3 19,12 5,12" fill="none" stroke="#f1b80d" strokeWidth="2" />
                      {/* Two squares below */}
                      <rect x="4" y="14" width="6" height="6" stroke="#f1b80d" fill="#f1b80d" />
                      <rect x="14" y="14" width="6" height="6" stroke="#f1b80d" fill="none" />
                    </svg>
                  ),
                  label: 'Eugenio (1993)',
                  desc: 'Philippine Folk Literature classification system.',
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1b80d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {/* Compass / divider tool */}
                      <line x1="12" y1="2" x2="6" y2="20" />
                      <line x1="12" y1="2" x2="18" y2="20" />
                      <path d="M6 20 Q12 16 18 20" fill="none" />
                      <circle cx="12" cy="5" r="1.5" fill="#f1b80d" />
                    </svg>
                  ),
                  label: 'Andress (1985)',
                  desc: 'Linguistic and structural taxonomies of oral tradition.',
                },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: '#ffffff' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: COMMUNITY & STEWARDSHIP ── */}
      <section className="scroll-reveal" style={{ padding: '0 0 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '0',
            border: '1px solid #e2e8f0',
          }}>

            {/* Left: landscape image with overlay */}
            <div style={{ position: 'relative', minHeight: isMobile ? '280px' : '420px', overflow: 'hidden' }}>
              <img
                src="/agusan-river.jpg"
                alt="Children on a bamboo raft on the Agusan River, near the Agusan Marsh Wildlife Sanctuary, Agusan del Sur"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 75%', display: 'block', position: 'absolute', inset: 0 }}
              />
              {/* Dark overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
              }} />
              {/* Labels */}
              <div style={{ position: 'absolute', bottom: '28px', left: '28px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1b80d', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  AGUSAN DEL SUR
                </div>
                <div style={{ fontSize: '36px', fontWeight: 600, color: '#ffffff', fontFamily: 'Cormorant Garamond, Georgia, serif', lineHeight: 1.2 }}>
                  Ancestral Domain
                </div>
              </div>
              {/* Required CC BY-SA 4.0 attribution */}
              <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '9px', color: 'rgba(255,255,255,0.55)' }}>
                Photo: Herbert Kikoy /{' '}
                <a
                  href="https://commons.wikimedia.org/wiki/File:Agusan_River_Chronicles.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Wikimedia Commons
                </a>{' '}
                (CC BY-SA 4.0)
              </div>
            </div>

            {/* Right: text content */}
            <div style={{
              padding: isMobile ? '32px 24px' : '56px 48px',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '20px',
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: 700,
                fontFamily: 'Playfair Display, Georgia, serif',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}>
                Community &amp; Stewardship
              </h2>

              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Digital archiving is not merely a technical task; it is a collaborative<br />
                act of cultural stewardship. Every entry in this archive is cross-<br />
                referenced for cultural accuracy with community elders and<br />
                practitioners in Agusan del Sur.
              </p>

              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                By maintaining close ties with the Manobo community, we ensure<br />
                that the digital representation of their oral literature respects<br />
                traditional protocols and intellectual property rights, fostering a<br />
                space where technology serves tradition.
              </p>

              <div style={{ marginTop: '8px' }}>
                <Link
                  href="/ethics"
                  className="btn-anim"
                  style={{
                    display: 'inline-block',
                    padding: '11px 24px',
                    border: '1.5px solid #8F000D',
                    color: '#8F000D',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#8F000D'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#8F000D'
                  }}
                >
                  Ethical Access Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: RESEARCH & PRESERVATION PARTNERS ── */}
      <section className="scroll-reveal" style={{
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        padding: '56px 24px',
        background: '#ffffff',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>
              RESEARCH &amp; PRESERVATION PARTNERS
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            alignItems: 'center',
          }}>
            {[
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                ),
                label: 'ACADEMIC RESEARCH COUNCIL',
              },
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                ),
                label: 'MANOBO CULTURAL OFFICE',
              },
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                ),
                label: 'DIGITAL ARCHIVAL INSTITUTE',
              },
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                label: 'COMMUNITY ELDERS BOARD',
              },
            ].map((partner) => (
              <div
                key={partner.label}
                className="stagger-item"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                {partner.icon}
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.08em',
                  lineHeight: 1.5,
                }}>
                  {partner.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
