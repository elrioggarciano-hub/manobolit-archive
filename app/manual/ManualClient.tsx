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

  const filteredTopics = TOPICS.filter(t => {
    if (selectedRole === 'PUBLIC' && t.role === 'ADMIN') return false
    return true
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f6f5',
        color: '#111827',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '32px 16px 80px',
      }}
    >
      <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
        
        {/* Top Header Block matching the user's reference photo */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span>ManoboLit Archive</span>
              <span style={{ fontWeight: 400, color: '#6b7280' }}>—</span>
              <span>User Manual</span>
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              Digital Classification and Retrieval System for Agusan Manobo Oral Literature · Agusan del Sur State University
            </p>
          </div>

          {/* Top-Right "Print manual" Pill Button matching the user's reference photo */}
          <Link
            href="/manual/print"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 20px',
              borderRadius: '9999px',
              border: '1.5px solid #2d6a4f',
              background: '#ffffff',
              color: '#2d6a4f',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#2d6a4f'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff'
              e.currentTarget.style.color = '#2d6a4f'
            }}
            title="Open complete printable manual and export to PDF"
          >
            Print manual
          </Link>
        </div>

        {/* Clean White Contents Card matching the user's reference photo */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '24px 32px',
            marginBottom: '40px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '1px solid #f3f4f6',
              paddingBottom: '12px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: '#1e3a2f',
                letterSpacing: '-0.01em',
              }}
            >
              Contents
            </h2>

            {/* Subtle Role Toggle */}
            <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
              {[
                { id: 'ALL', label: 'All Roles' },
                { id: 'PUBLIC', label: 'Researcher / Public' },
                { id: 'ADMIN', label: 'Administrator' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRole(tab.id as any)}
                  type="button"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: selectedRole === tab.id ? '1px solid #2d6a4f' : '1px solid #e5e7eb',
                    background: selectedRole === tab.id ? '#ecfdf5' : 'transparent',
                    color: selectedRole === tab.id ? '#065f46' : '#6b7280',
                    cursor: 'pointer',
                    fontWeight: selectedRole === tab.id ? 700 : 500,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Numbered Table of Contents matching the photo */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              columnGap: '40px',
              rowGap: '10px',
            }}
          >
            {filteredTopics.map(topic => (
              <a
                key={topic.id}
                href={`#${topic.id}`}
                style={{
                  fontSize: '13px',
                  color: '#374151',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 0',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#2d6a4f'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#374151'
                }}
              >
                <span style={{ fontWeight: 600, color: '#1f2937', minWidth: '22px' }}>
                  {topic.num}.
                </span>
                <span style={{ flex: 1 }}>{topic.title}</span>
                {topic.role === 'ADMIN' && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      background: '#fee2e2',
                      color: '#b91c1c',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Section Contents with Clean Cards, Screenshots, and Red Callouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {filteredTopics.map(topic => (
            <section
              key={topic.id}
              id={topic.id}
              style={{
                scrollMarginTop: '80px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                padding: '32px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              }}
            >
              {/* Section Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '16px',
                  borderBottom: '1px solid #f3f4f6',
                  paddingBottom: '12px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '19px',
                    fontWeight: 700,
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: '#2d6a4f' }}>{topic.num}.</span>
                  <span>{topic.title}</span>
                </h2>
                <a
                  href="#"
                  style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    textDecoration: 'none',
                  }}
                >
                  Back to top ↑
                </a>
              </div>

              {/* Who uses it & Role Context */}
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#4b5563',
                  marginBottom: '14px',
                }}
              >
                <strong style={{ color: '#111827' }}>Who uses it. </strong>
                <span>{topic.whoUsesIt}</span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: '#374151',
                  margin: '0 0 20px',
                }}
              >
                {topic.desc}
              </p>

              {/* Screenshot Figure with Red Number Callouts */}
              {topic.figureImg && topic.figureNum && (
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
                      src={topic.figureImg}
                      alt={topic.figureTitle || topic.title}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: '#4b5563',
                      textAlign: 'center',
                    }}
                  >
                    <strong style={{ color: '#dc2626' }}>Figure {topic.figureNum}. </strong>
                    <span>{topic.figureTitle}. </span>
                    <span style={{ fontStyle: 'italic', color: '#6b7280' }}>
                      The red numbers match the steps below.
                    </span>
                  </div>
                </div>
              )}

              {/* Numbered Steps */}
              {topic.steps && topic.steps.length > 0 && (
                <div style={{ margin: '20px 0' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#111827',
                      marginBottom: '10px',
                    }}
                  >
                    Steps
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topic.steps.map(step => (
                      <div
                        key={step.num}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
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

              {/* Good to know yellow callout box */}
              {topic.goodToKnow && topic.goodToKnow.length > 0 && (
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
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '18px',
                      fontSize: '12.5px',
                      color: '#713f12',
                      lineHeight: 1.55,
                    }}
                  >
                    {topic.goodToKnow.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
