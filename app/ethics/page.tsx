import Link from 'next/link'

export const metadata = {
  title: 'Ethical Access Policy — ManoboLit Archive',
  description: 'How the ManoboLit Archive honors Agusan Manobo community consent, cultural protocols, and intellectual property rights over its oral literature and folk songs.',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '36px',
}

const h2Style: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '20px',
  fontWeight: 700,
  fontFamily: 'Cormorant Garamond, Georgia, serif',
  color: 'var(--text-primary)',
  borderLeft: '3px solid var(--brand-accent)',
  paddingLeft: '12px',
}

const pStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '14px',
  lineHeight: 1.75,
  color: 'var(--text-secondary)',
}

const liStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.75,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
}

export default function EthicalAccessPolicyPage() {
  return (
    <main className="anim-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 96px' }}>

        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
          Community & Stewardship
        </span>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 700, fontFamily: 'Cormorant Garamond, Georgia, serif', color: 'var(--text-primary)', lineHeight: 1.15 }}>
          Ethical Access Policy
        </h1>
        <p style={{ margin: '0 0 40px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Last updated: September 30, 2026
        </p>

        <section style={sectionStyle}>
          <p style={pStyle}>
            The oral literature and folk songs in this Archive belong first to the Agusan Manobo community of Agusan del Sur, not to the
            Archive itself. Digitizing them is an act of cultural stewardship, not ownership. This policy explains the principles and
            protocols we follow in gathering, presenting, and permitting access to this material, grounded in the{' '}
            <strong>Indigenous Peoples&rsquo; Rights Act of 1997 (Republic Act No. 8371, &ldquo;IPRA&rdquo;)</strong>, which protects the rights
            of Indigenous Cultural Communities/Indigenous Peoples (ICCs/IPs) to their cultural heritage and traditional knowledge.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Free, Prior, and Informed Consent (FPIC)</h2>
          <p style={pStyle}>
            Every entry published in this Archive is drawn from research that secured the consent of the community, narrators, singers, and
            elders involved at the time of documentation, consistent with the FPIC principle recognized under IPRA and the National
            Commission on Indigenous Peoples (NCIP) guidelines. No oral tradition is added to this Archive without that underlying consent.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Community Ownership, Not Archive Ownership</h2>
          <p style={pStyle}>
            The Archive does not claim ownership, copyright, or exclusive rights over the Manobo oral literature, folk songs, transcriptions,
            or translations it hosts. Cultural and intellectual property rights over this heritage remain with the Agusan Manobo community
            and its individual knowledge-holders, in line with IPRA&rsquo;s recognition of community intellectual property rights over
            indigenous knowledge systems and practices.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Attribution to Narrators, Singers, and Community Sources</h2>
          <p style={pStyle}>
            Where consent allows, each entry credits its narrator, singer, or community source, along with the general community location
            (barangay, municipality, and province) where it was documented. This attribution is a matter of respect, not decoration — it
            keeps the connection between a piece of oral tradition and the people who kept it alive visible to every visitor.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Permitted Use</h2>
          <p style={pStyle}>Material in this Archive may be viewed, listened to, cited, and referenced for:</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}>Education and academic research, with proper attribution to the Agusan Manobo community and, where named, the specific narrator or singer;</li>
            <li style={liStyle}>Cultural preservation, revitalization, and intergenerational transmission within the Manobo community itself; and</li>
            <li style={liStyle}>Non-commercial scholarly publication, provided the cultural context and community attribution are preserved intact.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Prohibited Use</h2>
          <p style={pStyle}>Out of respect for the community&rsquo;s rights under IPRA, the following are not permitted without separate, explicit consent from the community and, where applicable, the NCIP:</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}>Commercial use of any transcription, translation, audio recording, or derivative work (e.g., selling recordings, incorporating lyrics into a commercial product, or monetized redistribution);</li>
            <li style={liStyle}>Presenting this material stripped of its cultural context, community attribution, or in a way that misrepresents its meaning or origin; and</li>
            <li style={liStyle}>Any use that a reasonable member of the Agusan Manobo community would regard as disrespectful of the sacred, ceremonial, or otherwise sensitive character of a given tradition.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Audio Recordings</h2>
          <p style={pStyle}>
            Folk song recordings hosted on the Archive are performed to preserve the lyrical and thematic content documented from the
            community; where a recording is not a field-recorded performance by the original singer, this is disclosed transparently on
            its listing (e.g., labeled &ldquo;AI Generated&rdquo;) rather than presented as if it were an authentic original recording.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Community Review, Correction, and Withdrawal</h2>
          <p style={pStyle}>
            Community elders, narrators, singers, or their designated representatives may at any time request that an entry be corrected,
            re-contextualized, or withdrawn from public access if it was documented inaccurately, attributed incorrectly, or if the
            community reconsiders its earlier consent. We act on such requests as a matter of course, not as an exception.
          </p>
        </section>

        <section style={{ ...sectionStyle, marginBottom: 0 }}>
          <h2 style={h2Style}>8. Contact & Community Inquiries</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Members of the Agusan Manobo community, cultural bearers, or researchers with questions, corrections, or concerns about how a
            specific entry is presented may reach the Archive&rsquo;s custodians at{' '}
            <a href="mailto:preservation@manobolit.org" style={{ color: 'var(--brand-accent)' }}>preservation@manobolit.org</a>.
          </p>
        </section>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '48px', paddingTop: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/privacy" className="btn-anim" style={{ fontSize: '13px', color: 'var(--brand-accent)', fontWeight: 700, textDecoration: 'none' }}>
            Read our Privacy Policy →
          </Link>
          <Link href="/terms" className="btn-anim" style={{ fontSize: '13px', color: 'var(--brand-accent)', fontWeight: 700, textDecoration: 'none' }}>
            Read our Terms of Service →
          </Link>
        </div>

      </div>
    </main>
  )
}
