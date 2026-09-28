import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — ManoboLit Archive',
  description: 'How the ManoboLit Archive collects, uses, and protects information, in line with the Data Privacy Act of 2012 (Republic Act No. 10173).',
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

export default function PrivacyPolicyPage() {
  return (
    <main className="anim-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 96px' }}>

        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
          Legal
        </span>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 700, fontFamily: 'Cormorant Garamond, Georgia, serif', color: 'var(--text-primary)', lineHeight: 1.15 }}>
          Privacy Policy
        </h1>
        <p style={{ margin: '0 0 40px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Last updated: September 28, 2026
        </p>

        <section style={sectionStyle}>
          <p style={pStyle}>
            The ManoboLit Archive (&ldquo;the Archive,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a scholarly, non-commercial project dedicated to
            preserving and classifying the oral literature and folk songs of the Agusan Manobo people. This Privacy Policy explains what
            information the Archive collects when you use this website, how it is used, and the rights available to you under the{' '}
            <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and its Implementing Rules and Regulations.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Information We Collect</h2>
          <p style={pStyle}>The Archive is built to be browsed without creating an account. Specifically:</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}><strong>Visitors browsing the public archive:</strong> we do not require registration, and we do not knowingly collect names, email addresses, or other personal identifiers from the general public. Our hosting and database providers (see Section 4) automatically log standard technical data — such as IP address, browser type, and request timestamps — for security and reliability purposes, consistent with normal web server operation.</li>
            <li style={liStyle}><strong>Administrator access:</strong> the Archive is maintained through a single, password-protected admin panel used only by its custodians. On login, a signed session cookie (<code>admin_session</code>) is issued to keep you authenticated; it contains no personal data beyond an expiry time and a cryptographic signature, and it expires automatically after 7 days.</li>
            <li style={liStyle}><strong>Archived cultural content:</strong> as part of its scholarly purpose, the Archive publishes information gathered through ethnographic research, which may include the names of narrators, singers, community sources, and general locations (e.g., municipality or barangay) associated with a piece of oral literature or a folk song. This information is included only where the underlying research secured appropriate consent from contributors and their community at the time of collection.</li>
            <li style={liStyle}><strong>Correspondence:</strong> if you email us at <a href="mailto:preservation@manobolit.org" style={{ color: 'var(--brand-accent)' }}>preservation@manobolit.org</a>, we receive whatever information you choose to include in that message.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. How We Use Information</h2>
          <p style={pStyle}>Information described above is used to:</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}>Operate, secure, and maintain the Archive and its rule-based classification system;</li>
            <li style={liStyle}>Preserve and present Agusan Manobo oral literature and folk songs for research, education, and cultural continuity;</li>
            <li style={liStyle}>Respond to inquiries, correction requests, or takedown requests sent to us; and</li>
            <li style={liStyle}>Comply with legal obligations where applicable.</li>
          </ul>
          <p style={pStyle}>We do not sell, rent, or use personal data for advertising purposes.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Cookies</h2>
          <p style={pStyle}>
            The Archive uses one functional cookie — <code>admin_session</code> — solely to keep an authenticated administrator signed in. A separate,
            non-identifying local preference (your light/dark theme choice) is stored in your browser&rsquo;s local storage, not as a cookie, and is
            never transmitted to our servers. We do not use third-party advertising or analytics tracking cookies.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Third-Party Service Providers</h2>
          <p style={pStyle}>
            The Archive is built on infrastructure operated by third parties acting as our data processors, currently:
          </p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}><strong>Vercel</strong> — application hosting and request delivery.</li>
            <li style={liStyle}><strong>Supabase</strong> — database and audio file storage.</li>
          </ul>
          <p style={pStyle}>
            These providers may process technical data (such as IP addresses) as part of delivering their infrastructure services, under their own
            security and privacy practices.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Data Sharing and Disclosure</h2>
          <p style={pStyle}>
            We do not share personal data with third parties for marketing purposes. We may disclose information where required by Philippine law,
            to protect the rights or safety of the Archive or others, or with the consent of the individual concerned.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Data Retention</h2>
          <p style={pStyle}>
            Archival content — including attributed narrator, singer, and source information — is retained as part of the Archive&rsquo;s long-term
            cultural preservation mission. If you are a named contributor, community representative, or rights-holder and wish to request a
            correction or removal of information about you, contact us and we will act on that request in good faith. Administrator session data
            expires automatically and is not retained beyond that period.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Data Security</h2>
          <p style={pStyle}>
            The site is served over HTTPS. Administrator authentication uses a cryptographically signed, time-limited session token rather than a
            reusable password stored client-side. Access to the administrative panel is restricted to authorized custodians of the Archive.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Your Rights Under the Data Privacy Act</h2>
          <p style={pStyle}>If personal data about you is held by the Archive, you have the right to:</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <li style={liStyle}>Be informed that your personal data is being processed;</li>
            <li style={liStyle}>Access a copy of that data;</li>
            <li style={liStyle}>Request correction of inaccurate data;</li>
            <li style={liStyle}>Object to or request the erasure or blocking of data, subject to the Archive&rsquo;s scholarly preservation purpose and applicable law;</li>
            <li style={liStyle}>Be indemnified for damages sustained due to inaccurate, incomplete, or unlawfully obtained data; and</li>
            <li style={liStyle}>Lodge a complaint with the <strong>National Privacy Commission (NPC)</strong> if you believe your rights have been violated.</li>
          </ul>
          <p style={pStyle}>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:preservation@manobolit.org" style={{ color: 'var(--brand-accent)' }}>preservation@manobolit.org</a>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Children&rsquo;s Privacy</h2>
          <p style={pStyle}>
            The Archive is not directed at children, and we do not knowingly collect personal data from children.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Changes to This Policy</h2>
          <p style={pStyle}>
            We may update this Privacy Policy from time to time to reflect changes in our practices or in applicable law. The &ldquo;Last
            updated&rdquo; date above will always reflect the most recent revision.
          </p>
        </section>

        <section style={{ ...sectionStyle, marginBottom: 0 }}>
          <h2 style={h2Style}>11. Contact Us</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Questions, corrections, or requests regarding this policy may be sent to{' '}
            <a href="mailto:preservation@manobolit.org" style={{ color: 'var(--brand-accent)' }}>preservation@manobolit.org</a>.
          </p>
        </section>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '48px', paddingTop: '24px' }}>
          <Link href="/terms" className="btn-anim" style={{ fontSize: '13px', color: 'var(--brand-accent)', fontWeight: 700, textDecoration: 'none' }}>
            Read our Terms of Service →
          </Link>
        </div>

      </div>
    </main>
  )
}
