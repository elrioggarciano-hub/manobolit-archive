'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface StepItem {
  num: number
  title: string
  desc: string
}

interface ManualTopic {
  id: string
  num: number
  title: string
  role?: 'ALL' | 'PUBLIC' | 'ADMIN'
  desc: string
  whoUsesIt: string
  figureNum?: number
  figureTitle?: string
  figureImg?: string
  steps?: StepItem[]
  goodToKnow?: string[]
}

const TOPICS: ManualTopic[] = [
  {
    id: 'sec-1',
    num: 1,
    title: 'Getting started',
    role: 'ALL',
    whoUsesIt: 'Every visitor, researcher, student, cultural worker, and administrator.',
    desc: 'The ManoboLit Archive is an online platform for the systematic classification, linguistic preservation, and retrieval of the oral literature and folk songs of the Agusan Manobo people of Agusan del Sur, Philippines. It operates directly in any modern desktop or mobile browser.',
    figureNum: 1,
    figureTitle: 'The ManoboLit Archive Home Page and Global Navigation Bar',
    figureImg: '/manual/screenshots/fig1_home.png',
    steps: [
      { num: 1, title: 'Brand Logo', desc: 'Click "ManoboLit Archive" at any time from any page to return to the home page.' },
      { num: 2, title: 'Navigation Menu', desc: 'Click EXPLORER, CLASSIFICATION, TRANSLATOR, DASHBOARD, ABOUT, or USER MANUAL to navigate to that feature.' },
      { num: 3, title: 'Search & Language', desc: 'Type keywords to quickly find literature, or switch interface language (English, Bisaya, Tagalog, Agusan Manobo).' },
      { num: 4, title: 'Admin Gateway', desc: 'Click the circular user icon at the top right to access the Administrator authentication portal.' },
      { num: 5, title: 'Explore Archive', desc: 'Click the primary "Explore Archive" button on the hero banner to view all 22 archived works.' },
    ],
    goodToKnow: [
      'The archive preserves 17 authentic oral literature selections (Catipay & Curato, 2024) and 5 folk songs (Maravilla, 2024).',
      'The platform complies with Free, Prior, and Informed Consent (FPIC) and the Indigenous Peoples Rights Act (IPRA / RA 8371).',
      'Your theme (Dark or Light) and selected language are remembered automatically across visits.',
    ],
  },
  {
    id: 'sec-2',
    num: 2,
    title: 'Roles & what each can do',
    role: 'ALL',
    whoUsesIt: 'All users.',
    desc: 'The system has two distinct account tiers designed for open educational research and secure cultural curation:',
    goodToKnow: [
      'Public Visitor / Cultural Researcher: Unauthenticated open access. Can search, filter, listen to field audio, read parallel Agusan Manobo, Bisaya, and English texts, run the classifier, translate with affix validation, view charts, and export CSV/JSON data.',
      'Cultural Archive Administrator: Authenticated via master credentials. Can catalog new literature, upload audio recordings, edit records, verify machine learning predictions, and retrain classification models.',
    ],
  },
  {
    id: 'sec-3',
    num: 3,
    title: 'The archival workflow at a glance',
    role: 'ALL',
    whoUsesIt: 'All users.',
    desc: 'The system connects oral tradition fieldwork with computational linguistics through an integrated pipeline:',
    goodToKnow: [
      '1. Field Ingestion: Authentic oral narratives and songs recorded in Agusan del Sur municipalities.',
      '2. Computational Classification: Literary entries classified by Eugenio (1993) and Andress (1985) taxonomies via Rule-Based, Naive Bayes ML, and Gemini LLM.',
      '3. Lexical Validation: Words cross-referenced against 257 SIL Webonary (ISO 639-3: msm) and Bible records with Finite-State Affix Decomposition.',
      '4. Public Retrieval & Preservation: Multidimensional faceted exploration with open CSV and JSON data exports.',
    ],
  },
  {
    id: 'sec-4',
    num: 4,
    title: 'Step 1 - Multidimensional search & filter',
    role: 'PUBLIC',
    whoUsesIt: 'Cultural researchers, students, and educators.',
    desc: 'The Explorer module (/explore) allows multidimensional filtering across literary forms, genres, and geographic provenance across Agusan del Sur.',
    figureNum: 2,
    figureTitle: 'Archive Explorer with Multidimensional Faceted Filters',
    figureImg: '/manual/screenshots/fig2_explore.png',
    steps: [
      { num: 1, title: 'Search Query', desc: 'Type any keyword, title, character (e.g., "Pilanduk"), or storyteller name into the search bar.' },
      { num: 2, title: 'Literary Form', desc: 'Filter between "All Works", "Oral Literature" (17 entries), or "Folk Song" (5 entries).' },
      { num: 3, title: 'Genre Taxonomy Chips', desc: 'Click a genre chip (Folktale, Song, Riddle, Epic, Proverb, Myth, Legend) to isolate entries by Eugenio/Andress criteria.' },
      { num: 4, title: 'Provenance Dropdown', desc: 'Select an Agusan del Sur municipality (Bayugan, Prosperidad, San Francisco, Esperanza) to view regional folklore.' },
      { num: 5, title: 'Entry Card', desc: 'Click on any literature card to view its complete tri-lingual parallel text and audio player.' },
    ],
    goodToKnow: [
      'You can combine multiple filters at once (e.g., Folk Songs in Bayugan).',
      'Click "Clear All Filters" at any time to reset the list to all 22 works.',
    ],
  },
  {
    id: 'sec-5',
    num: 5,
    title: 'Step 2 - Synchronized audio playback & transcripts',
    role: 'PUBLIC',
    whoUsesIt: 'Linguists, educators, students, and the community.',
    desc: 'Each literary entry page (/archive/[id]) features field audio playback synchronized with side-by-side parallel columns.',
    figureNum: 3,
    figureTitle: 'Literary Entry Detail View with Audio Playback and Parallel Columns',
    figureImg: '/manual/screenshots/fig3_detail.png',
    steps: [
      { num: 1, title: 'Provenance & Title Header', desc: 'Review the primary title, native alternative title, and community provenance badge.' },
      { num: 2, title: 'Audio Player Bar', desc: 'Press Play to listen to the field recording. Use the timeline scrubber to jump to specific stanzas.' },
      { num: 3, title: 'Original Transcription', desc: 'Read the Agusan Manobo phonetic field transcription as recorded from the native informant.' },
      { num: 4, title: 'Parallel Translations', desc: 'Compare side-by-side parallel translations in English and Sinugbuanong Binisaya.' },
      { num: 5, title: 'Cultural Metadata', desc: 'Inspect storyteller attribution, collector notes (Catipay & Curato 2024 / Maravilla 2024), and classification confidence.' },
    ],
    goodToKnow: [
      'The audio player persists at the bottom of the screen as you explore other pages.',
      'Field recordings retain authentic melodic contours and dialectal vocalizations.',
    ],
  },
  {
    id: 'sec-6',
    num: 6,
    title: 'Step 3 - Hybrid classification (rules, ML, & LLM)',
    role: 'ALL',
    whoUsesIt: 'Linguistics scholars, students, and curators.',
    desc: 'The Classification Workbench (/classification) evaluates any Agusan Manobo text using a three-tier hybrid engine.',
    figureNum: 4,
    figureTitle: 'Hybrid Classification Workbench with Mode Selector and Reasoning Output',
    figureImg: '/manual/screenshots/fig4_classification.png',
    steps: [
      { num: 1, title: 'Input Textarea', desc: 'Paste or type raw Agusan Manobo text, or click "Load Sample Entry" to test an authenticated archive record.' },
      { num: 2, title: 'Engine Mode Selector', desc: 'Choose between: (a) Pattern-Based Rules, (b) Supervised Machine Learning (TF-IDF + Naive Bayes), or (c) Gemini Semantic LLM.' },
      { num: 3, title: 'Classify Entry', desc: 'Click the crimson "Classify Entry" button to run the classification model.' },
      { num: 4, title: 'Genre & Theme Cards', desc: 'View the predicted Eugenio (1993) genre, primary theme, and statistical confidence percentage.' },
      { num: 5, title: 'Feature Weights & Rules', desc: 'Examine top TF-IDF vocabulary weights and matched linguistic rule triggers.' },
    ],
    goodToKnow: [
      'Rule-Based mode uses deterministic pattern matching from Eugenio and Andress research.',
      'Supervised ML mode uses Multinomial Naive Bayes trained on the 22-record corpus.',
      'Gemini LLM mode performs deep semantic contextual reasoning for implicit metaphors.',
    ],
  },
  {
    id: 'sec-7',
    num: 7,
    title: 'Step 4 - Dynamic translation & affix validation',
    role: 'ALL',
    whoUsesIt: 'Translators, researchers, and students.',
    desc: 'The Translator module (/translator) provides bi-directional translation coupled with word-level Finite-State Affix Decomposition.',
    figureNum: 5,
    figureTitle: 'Dynamic Translator and Finite-State Affix Decomposition Workbench',
    figureImg: '/manual/screenshots/fig5_translator.png',
    steps: [
      { num: 1, title: 'Language Direction', desc: 'Select direction: Agusan Manobo → English, Agusan Manobo → Bisaya, or English → Agusan Manobo.' },
      { num: 2, title: 'Source Input', desc: 'Type or paste the sentence or verse to translate.' },
      { num: 3, title: 'Translate & Validate', desc: 'Click "Translate & Validate" to process through the lexical database.' },
      { num: 4, title: 'Translation Result', desc: 'Read the translated text. Click the copy icon to copy to clipboard.' },
      { num: 5, title: 'Morphological Table', desc: 'Inspect broken-down prefixes (mig-, og-), infixes (-in-), root words, and SIL Webonary verification badges.' },
    ],
    goodToKnow: [
      'Green "Verified Corpus" badge indicates direct match against the 257 PostgreSQL Webonary/Bible entries.',
      'Blue "Morphologically Validated" badge indicates root was isolated via finite-state affix grammar rules.',
    ],
  },
  {
    id: 'sec-8',
    num: 8,
    title: 'Step 5 - Analytics dashboard & statistical charts',
    role: 'PUBLIC',
    whoUsesIt: 'Statisticians, faculty, cultural workers, and researchers.',
    desc: 'The Analytics Dashboard (/dashboard) visualizes corpus distributions and geographic representation across Agusan del Sur municipalities.',
    figureNum: 6,
    figureTitle: 'Interactive Analytics Dashboard with Frequency Charts',
    figureImg: '/manual/screenshots/fig6_dashboard.png',
    steps: [
      { num: 1, title: 'Corpus Metrics', desc: 'View summary numbers: Total Works (22), Oral Literature (17), Folk Songs (5), and surveyed municipalities.' },
      { num: 2, title: 'Export Buttons', desc: 'Quick-access buttons for CSV and JSON data export.' },
      { num: 3, title: 'Genre Chart', desc: 'Interactive bar chart showing frequency distribution across folktales, songs, riddles, epics, and proverbs.' },
      { num: 4, title: 'Thematic Distribution', desc: 'Visualization of core cultural themes (Cleverness, Nature Spirits, Courtship, Agrarian Life).' },
      { num: 5, title: 'Geographic Breakdown', desc: 'Distribution across Bayugan, Prosperidad, San Francisco, and Esperanza communities.' },
    ],
    goodToKnow: [
      'Charts update dynamically whenever new verified records are cataloged in the system.',
    ],
  },
  {
    id: 'sec-9',
    num: 9,
    title: 'Step 6 - Exporting data (CSV & JSON)',
    role: 'PUBLIC',
    whoUsesIt: 'Researchers, thesis students, and computational linguists.',
    desc: 'The system supports one-click open-data exports for academic research and cultural archiving.',
    steps: [
      { num: 1, title: 'Export CSV', desc: 'Click "Export CSV" on the Dashboard to download a spreadsheet containing titles, genres, municipalities, storytellers, collectors, and text excerpts.' },
      { num: 2, title: 'Export JSON', desc: 'Click "Export JSON" to download machine-readable structured records formatted for NLP and computational analysis.' },
    ],
    goodToKnow: [
      'Export files use standard UTF-8 encoding to preserve native orthographic glottal stops and accents.',
      'Exports strictly respect community attribution and academic citation requirements.',
    ],
  },
  {
    id: 'sec-10',
    num: 10,
    title: 'Step 7 - Administrator login & security',
    role: 'ADMIN',
    whoUsesIt: 'Authorized Cultural Curators and Project Leads.',
    desc: 'Administrative actions are protected by secure password authentication and HMAC SHA-256 signed session cookies.',
    figureNum: 7,
    figureTitle: 'Administrator Authentication Portal and Session Gateway',
    figureImg: '/manual/screenshots/fig7_admin_login.png',
    steps: [
      { num: 1, title: 'Login Gateway', desc: 'Open /admin/login or click the user circle icon at the top right of any page.' },
      { num: 2, title: 'Master Password', desc: 'Enter the master administrator password assigned to your institutional role.' },
      { num: 3, title: 'Sign In Action', desc: 'Click "Sign In as Curator" to verify credentials and enter the admin dashboard.' },
      { num: 4, title: 'Audit Trail Notice', desc: 'Every administrative edit, deletion, and retraining trigger is permanently logged.' },
    ],
    goodToKnow: [
      'Administrator sessions remain active for 7 days before requiring re-authentication.',
      'Only institutional curators possess credentials; there is no public sign-up.',
    ],
  },
  {
    id: 'sec-11',
    num: 11,
    title: 'Step 8 - Adding new oral literature & folk songs',
    role: 'ADMIN',
    whoUsesIt: 'Archive Administrators.',
    desc: 'The Archival Entry Creation form (/admin/new) captures rigorous ethnographic metadata conforming to international folklore standards.',
    figureNum: 9,
    figureTitle: 'Archival Entry Creation Form with Provenance and Audio Upload Fields',
    figureImg: '/manual/screenshots/fig9_admin_new.png',
    steps: [
      { num: 1, title: 'Title & Native Title', desc: 'Enter the primary title and Agusan Manobo native title of the piece.' },
      { num: 2, title: 'Form & Genre', desc: 'Select Oral Literature or Folk Song, then choose the Eugenio/Andress genre.' },
      { num: 3, title: 'Geographic Provenance', desc: 'Specify the Agusan del Sur Municipality (Bayugan, Prosperidad, etc.) and Barangay.' },
      { num: 4, title: 'Storyteller & Audio', desc: 'Document the name of the elder/singer and provide the MP3 audio file URL.' },
      { num: 5, title: 'Save to Archive', desc: 'Enter parallel transcriptions and click "Save to Cultural Archive" to publish immediately.' },
    ],
    goodToKnow: [
      'New entries are immediately indexed in the public Explorer and Analytics Dashboard.',
      'Audio links should be direct streaming MP3 URLs or cloud storage links.',
    ],
  },
  {
    id: 'sec-12',
    num: 12,
    title: 'Step 9 - Reviewing & verifying classifications',
    role: 'ADMIN',
    whoUsesIt: 'Archive Administrators and Curators.',
    desc: 'The Review Queue (/admin -> Review Queue) provides human-in-the-loop oversight to audit machine-predicted classifications.',
    figureNum: 8,
    figureTitle: 'Administrator Dashboard and Archive Inventory Table',
    figureImg: '/manual/screenshots/fig8_admin_entries.png',
    steps: [
      { num: 1, title: 'Review Queue Tab', desc: 'Click the "Review Queue" tab on the Administrator dashboard.' },
      { num: 2, title: 'Audit Prediction', desc: 'Review the machine\'s predicted genre against the indigenous narrative context.' },
      { num: 3, title: 'Verify Action', desc: 'Click "Verify" to certify the classification and timestamp the curation audit.' },
      { num: 4, title: 'Override if Needed', desc: 'Curators can override the machine prediction with the correct customary genre.' },
    ],
    goodToKnow: [
      'Human-verified entries automatically feed into the training corpus for model retraining.',
      'Verified entries display a green badge in the public detail view.',
    ],
  },
  {
    id: 'sec-13',
    num: 13,
    title: 'Step 10 - Model retraining & dataset management',
    role: 'ADMIN',
    whoUsesIt: 'System Administrators and Project Leads.',
    desc: 'Administrators can retrain the Naive Bayes machine learning classifier when new verified entries are cataloged.',
    steps: [
      { num: 1, title: 'ML Pipeline Tab', desc: 'Navigate to the "ML Pipeline" tab in /admin to inspect vocabulary size and accuracy.' },
      { num: 2, title: 'Retrain Model', desc: 'Click "Retrain Classifier" to re-calculate TF-IDF vectors across all active database entries.' },
      { num: 3, title: 'Snapshot Activation', desc: 'Review the generated snapshot version and confirm activation.' },
    ],
    goodToKnow: [
      'Retraining runs asynchronously without interrupting public search or audio playback.',
      'Snapshots can be inspected or rolled back if needed.',
    ],
  },
  {
    id: 'sec-14',
    num: 14,
    title: 'Using a phone or tablet',
    role: 'ALL',
    whoUsesIt: 'All mobile and tablet users.',
    desc: 'The ManoboLit Archive is fully responsive and optimized for touch devices in the field.',
    goodToKnow: [
      'Tap the hamburger icon (☰) at the top right to open the mobile drawer menu.',
      'Waveform audio scrubber is touch-friendly: tap or drag along the bar to navigate playback.',
      'Parallel transcriptions stack gracefully into easy-to-read vertical cards on small screens.',
    ],
  },
  {
    id: 'sec-15',
    num: 15,
    title: 'Ethical access & indigenous knowledge (FPIC)',
    role: 'ALL',
    whoUsesIt: 'All researchers, educators, and visitors.',
    desc: 'Guidelines for respectful engagement with Agusan Manobo cultural property:',
    goodToKnow: [
      'All materials are published under customary Free, Prior, and Informed Consent (FPIC).',
      'Users must acknowledge the Agusan Manobo community, storyteller, and field collector in any publication.',
      'Commercial exploitation without prior tribal council consent is strictly prohibited pursuant to IPRA (RA 8371).',
      'For academic permissions, contact: preservation@manobolit.org.',
    ],
  },
  {
    id: 'sec-16',
    num: 16,
    title: 'Troubleshooting & FAQ',
    role: 'ALL',
    whoUsesIt: 'All users.',
    desc: 'Quick solutions to common questions:',
    goodToKnow: [
      'Audio doesn\'t play: Check your device volume. On mobile browsers, tap the play icon twice to grant audio permission.',
      'Word shows "Inferred" instead of "Verified": The word follows grammatical affix rules but is not yet in the 257 Webonary dictionary baseline.',
      'Forgot Admin Password: For security, passwords cannot be recovered via email. Contact the ADSSU Project Lead directly.',
    ],
  },
]

interface Props {
  initialRole?: string
}

export default function ManualClient({ initialRole }: Props) {
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'PUBLIC' | 'ADMIN'>(
    initialRole === 'admin' ? 'ADMIN' : 'ALL'
  )
  const [activeModalTopic, setActiveModalTopic] = useState<ManualTopic | null>(null)
  const [manualPdfUrl, setManualPdfUrl] = useState<string>('/api/manual/pdf')

  React.useEffect(() => {
    fetch('/api/admin/manual')
      .then(r => r.json())
      .then(data => {
        if (data?.url) {
          setManualPdfUrl(data.url)
        }
      })
      .catch(() => { })
  }, [])

  // Filter topics based on role pill selection
  const filteredTopics = TOPICS.filter(t => {
    if (selectedRole === 'PUBLIC' && t.role === 'ADMIN') return false
    if (selectedRole === 'ADMIN' && t.role === 'PUBLIC') return true
    return true
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8faf9',
        color: '#111827',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: 'clamp(20px, 4vw, 48px) clamp(12px, 3.5vw, 24px) 120px',
      }}
    >
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>

        {/* Top Header matching reference photo */}
        <div
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"
          style={{
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(22px, 4vw, 34px)',
                fontWeight: 700,
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                letterSpacing: '-0.02em',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                lineHeight: 1.2,
              }}
            >
              <span>ManoboLit Archive</span>
              <span style={{ fontWeight: 400, color: '#9ca3af' }}>—</span>
              <span>User Manual</span>
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 'clamp(11.5px, 2.5vw, 13px)',
                color: '#6b7280',
                lineHeight: 1.4,
              }}
            >
              Digital Classification and Retrieval System for Agusan Manobo Oral Literature · Agusan del Sur State University
            </p>
          </div>

          {/* Top-Right "Print manual" Pill Button */}
          <a
            href={manualPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-auto"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 20px',
              borderRadius: '9999px',
              border: '1.5px solid #2d6a4f',
              background: '#ffffff',
              color: '#2d6a4f',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#2d6a4f'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.color = '#2d6a4f'
            }}
            title="Open official PDF manual to print or save"
          >
            Print manual
          </a>
        </div>

        {/* Clean White Contents Card - Exactly as in the photo */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: 'clamp(18px, 3.5vw, 36px) clamp(16px, 3.5vw, 40px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          }}
        >
          {/* Card Header: "Contents" + Role Pills */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              marginBottom: '24px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(17px, 3vw, 19px)',
                fontWeight: 700,
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                color: '#1e3a2f',
                letterSpacing: '-0.01em',
              }}
            >
              Contents
            </h2>

            {/* Role Filter Pills on the Right (Scrollable/Wrap on small mobile) */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                maxWidth: '100%',
              }}
            >
              {[
                { id: 'ALL', label: 'All Roles' },
                { id: 'PUBLIC', label: 'Researcher / Public' },
                { id: 'ADMIN', label: 'Administrator' },
              ].map(tab => {
                const isActive = selectedRole === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedRole(tab.id as any)}
                    type="button"
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      border: isActive ? '1.5px solid #059669' : '1px solid #e5e7eb',
                      background: isActive ? '#ecfdf5' : '#ffffff',
                      color: isActive ? '#065f46' : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: isActive ? 700 : 500,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Responsive Table of Contents Grid: 1 column on mobile, 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 lg:gap-x-14 gap-y-3.5">
            {filteredTopics.map(topic => (
              <div
                key={topic.id}
                onClick={() => setActiveModalTopic(topic)}
                className="flex items-center justify-between gap-3 py-1 cursor-pointer transition-colors group"
                style={{
                  fontSize: 'clamp(12.5px, 2.5vw, 13.5px)',
                  color: '#374151',
                  minHeight: '32px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#059669'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#374151'
                }}
                title="Click to view instructions & screenshot"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    style={{
                      fontWeight: 600,
                      color: '#111827',
                      minWidth: '22px',
                      flexShrink: 0,
                    }}
                  >
                    {topic.num}.
                  </span>
                  <span
                    style={{
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: 1.35,
                    }}
                  >
                    {topic.title}
                  </span>
                </div>
                {topic.role === 'ADMIN' && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      background: '#fee2e2',
                      color: '#dc2626',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Popup (Opens only when a user clicks an item for quick inspection) */}
        {activeModalTopic && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(8px, 3vw, 24px)',
            }}
            onClick={() => setActiveModalTopic(null)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                maxWidth: '850px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                padding: 'clamp(18px, 4vw, 32px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Close Button */}
              <button
                type="button"
                onClick={() => setActiveModalTopic(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#4b5563',
                }}
              >
                ✕
              </button>

              {/* Topic Title */}
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#059669',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Topic {activeModalTopic.num}
              </div>
              <h2
                style={{
                  margin: '0 0 12px',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{activeModalTopic.title}</span>
                {activeModalTopic.role === 'ADMIN' && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: '#fee2e2',
                      color: '#dc2626',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    ADMIN ONLY
                  </span>
                )}
              </h2>

              <div style={{ fontSize: '12.5px', color: '#4b5563', marginBottom: '14px' }}>
                <strong style={{ color: '#111827' }}>Who uses it. </strong>
                <span>{activeModalTopic.whoUsesIt}</span>
              </div>

              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#374151', marginBottom: '20px' }}>
                {activeModalTopic.desc}
              </p>

              {/* Screenshot Figure */}
              {activeModalTopic.figureImg && activeModalTopic.figureNum && (
                <div style={{ margin: '20px 0' }}>
                  <div
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#f9fafb',
                    }}
                  >
                    <img
                      src={activeModalTopic.figureImg}
                      alt={activeModalTopic.figureTitle || activeModalTopic.title}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#4b5563', textAlign: 'center' }}>
                    <strong style={{ color: '#dc2626' }}>Figure {activeModalTopic.figureNum}. </strong>
                    <span>{activeModalTopic.figureTitle}. </span>
                    <span style={{ fontStyle: 'italic', color: '#6b7280' }}>
                      The red numbers match the steps below.
                    </span>
                  </div>
                </div>
              )}

              {/* Steps */}
              {activeModalTopic.steps && activeModalTopic.steps.length > 0 && (
                <div style={{ margin: '20px 0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                    Steps
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeModalTopic.steps.map(step => (
                      <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            minWidth: '22px',
                            borderRadius: '50%',
                            background: '#dc2626',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '1px',
                          }}
                        >
                          {step.num}
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#1f2937' }}>
                          <strong>{step.title}. </strong>
                          <span>{step.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Good to know */}
              {activeModalTopic.goodToKnow && activeModalTopic.goodToKnow.length > 0 && (
                <div
                  style={{
                    background: '#fef9c3',
                    border: '1px solid #fde047',
                    borderLeft: '4px solid #eab308',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginTop: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: '#854d0e',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>💡</span>
                    <span>Good to know</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#713f12', lineHeight: 1.55 }}>
                    {activeModalTopic.goodToKnow.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modal Bottom Actions */}
              <div
                style={{
                  marginTop: '28px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveModalTopic(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <Link
                  href="/manual/print"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Open Full Printable PDF →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
