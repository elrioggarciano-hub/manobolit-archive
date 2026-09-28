import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — ManoboLit Archive',
  description: 'The terms governing use of the ManoboLit Archive, including cultural respect guidelines, intellectual property, and content accuracy.',
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

export default function TermsOfServicePage() {
  return (
    <main className="anim-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 96px' }}>

        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
          Legal
        </span>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 700, fontFamily: 'Cormorant Garamond, Georgia, serif', color: 'var(--text-primary)', lineHeight: 1.15 }}>
          Terms of Service
        </h1>
        <p style={{ margin: '0 0 40px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Last updated: September 28, 2026
        </p>

        <section style={sectionStyle}>
          <p style={pStyle}>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the ManoboLit Archive (&ldquo;the Archive&rdquo;), a
            scholarly, non-commercial digital archive dedicated to preserving and classifying the oral literature and folk songs of the Agusan
            Manobo people. By using this website, you agree to these Terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Purpose of the Archive</h2>
          <p style={pStyle}>
            The Archive exists to document, classify, and make accessible the oral traditions of the Agusan Manobo people for research,
            education, and cultural continuity, drawing on the taxonomic frameworks of Eugenio (1993) and Andress (1985).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Cultural Respect and Ethical Use</h2>
          <p style={pStyle}>
            The material in this Archive represents the living cultural heritage of the Agusan Manobo people, entrusted to this project through
            scholarly research. By using the Archive, you agree to:
          </p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}>Engage with this material respectfully and in good faith;</li>
            <li style={liStyle}>Not misrepresent, mock, or use the content in a manner that disparages the Agusan Manobo community or its traditions;</li>
            <li style={liStyle}>Attribute the Archive and, where identified, the originating community or narrator when citing or reproducing content; and</li>
            <li style={liStyle}>Seek prior written permission from us before any commercial use, republication at scale, or adaptation of archived material.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Intellectual Property</h2>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}><strong>Archived oral literature and translations:</strong> made available for personal, educational, and research use with attribution to the Archive and its cited sources, unless otherwise noted. This does not transfer any underlying rights the Agusan Manobo community or original contributors hold in their own cultural heritage.</li>
            <li style={liStyle}><strong>Photography:</strong> select images are used under Creative Commons licenses (e.g., CC BY-SA 4.0), as credited beside each image. If you reuse a credited image, you must preserve that attribution and license notice.</li>
            <li style={liStyle}><strong>Site design, code, and the rule-based classification system:</strong> belong to the ManoboLit Archive project.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. AI-Generated Audio Disclosure</h2>
          <p style={pStyle}>
            Where a folk song entry has no documented original vocalist on record, its audio is labeled &ldquo;AI Generated&rdquo; in the player.
            Such recordings are illustrative and should not be cited or presented as an authentic ethnographic field recording. Entries with a
            documented narrator or source display that attribution instead.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Acceptable Use</h2>
          <p style={pStyle}>You agree not to:</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}>Attempt to access the administrative panel or any account without authorization;</li>
            <li style={liStyle}>Scrape, bulk-download, or redistribute the Archive&rsquo;s content without our prior written permission;</li>
            <li style={liStyle}>Interfere with, disrupt, or attempt to compromise the security of the Archive; or</li>
            <li style={liStyle}>Use the Archive for any unlawful purpose under Philippine law.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Administrator Accounts</h2>
          <p style={pStyle}>
            Access to add, edit, or remove archive entries is restricted to authorized custodians of the Archive and is not available to the
            general public.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Accuracy of Information</h2>
          <p style={pStyle}>
            We make a good-faith, scholarly effort to ensure the accuracy of transcriptions, translations, and classifications. However, genre and
            theme classifications are generated by a rule-based system and, like any classification method, may not always be complete or precise.
            The Archive is provided for research and educational reference and should not be treated as an infallible or exhaustive source.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Third-Party Services</h2>
          <p style={pStyle}>
            The Archive relies on third-party infrastructure, including Vercel (hosting) and Supabase (database and file storage), to operate.
            Their availability may affect the Archive&rsquo;s own availability from time to time.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Disclaimer and Limitation of Liability</h2>
          <p style={pStyle}>
            The Archive is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any kind, express or
            implied. To the fullest extent permitted by Philippine law, the ManoboLit Archive and its custodians shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of, or inability to use, the Archive.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Governing Law</h2>
          <p style={pStyle}>
            These Terms are governed by the laws of the Republic of the Philippines, including the Data Privacy Act of 2012 (RA 10173), the
            Intellectual Property Code (RA 8293), and the Indigenous Peoples&rsquo; Rights Act of 1997 (RA 8371) as applicable to the Archive&rsquo;s
            content and operations.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Changes to These Terms</h2>
          <p style={pStyle}>
            We may revise these Terms from time to time. The &ldquo;Last updated&rdquo; date above will always reflect the most recent revision.
            Continued use of the Archive after changes take effect constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section style={{ ...sectionStyle, marginBottom: 0 }}>
          <h2 style={h2Style}>12. Contact Us</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Questions about these Terms may be sent to{' '}
            <a href="mailto:preservation@manobolit.org" style={{ color: 'var(--brand-accent)' }}>preservation@manobolit.org</a>.
          </p>
        </section>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '48px', paddingTop: '24px' }}>
          <Link href="/privacy" className="btn-anim" style={{ fontSize: '13px', color: 'var(--brand-accent)', fontWeight: 700, textDecoration: 'none' }}>
            Read our Privacy Policy →
          </Link>
        </div>

      </div>
    </main>
  )
}
