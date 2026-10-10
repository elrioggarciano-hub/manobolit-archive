'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { classifyEntry, genreRules, themeRules, locationRules } from '@/lib/classification'

export interface DBEntry {
  id: string
  title: string
  manoboTitle?: string | null
  englishTitle?: string | null
  type: string
  content: string
  transcription?: string | null
  translation?: string | null
  bisayaTranslation?: string | null
  genre: string
  themes: string[]
  culturalElements: string[]
}

interface ClassificationClientProps {
  dbEntries?: DBEntry[]
}

const fallbackEntries: DBEntry[] = [
  {
    id: "fb-stars",
    title: "The Creation of the Stars",
    manoboTitle: "Kagnat ne mga Bituen",
    englishTitle: "The Creation of the Stars",
    type: "ORAL_LITERATURE",
    content: "System classified as Origin Myth based on lexical frequency of \"Father Sky\" and \"Birth\" within the introductory markers.",
    transcription: "d-anak te meogingon so mga bituen te amay\nhe langit. Su kagi te meembon, amey ne\nlangit ne og-ilaan ne kandin ne mga bata.\n\nNe so kani ne timpu, wadad pa bituen te\nlangit. Madalumon pa so kapa-an te tano. Ne\nmig-iling so amey ne langit, \"Og-paka-anak\nki te mga bituen.\"",
    translation: "The stars were born from the breath of the\nFather Sky. According to the elders, the Sky\nFather wanted to give light to his children.\n\nIn those ancient times, there were no stars in\nthe heavens. The surface of the earth was\nstill in deep darkness. Then Father Sky said,\n\"We shall give birth to the stars.\"",
    genre: "MYTH",
    themes: ["COSMOGONY","ORIGINS"],
    culturalElements: ["Stars","Cosmogony","Origins","Myth"]
  },
  {
    id: "fb-buried",
    title: "Ka nilugdang iyan on usab paibabow",
    manoboTitle: "Ka nilugdang iyan on usab paibabow",
    englishTitle: "What Was Buried Has Surfaced Again",
    type: "FOLK_SONG",
    content: "The song captures the journey of the Manobo tribe, who have long felt invisible and neglected, burdened by a heavy sense of abandonment.",
    transcription: "Lantawod diya lawod nig duma kan bayod soe tribu ko no daog-daog mahawig no katuigan, niglubong on tu kamingaw kunag pakabarog so wara ka silungan musombong sa kagamhanan Kuna intawon ug paminugon pasahan to resolution kandan gayod pag palisudlisuron Kuna nog paluapon kandan pagyud palugoylugoyuntribu mapailubon paubus nalang intawon uhaw tu pag mahal kuwang tu pag pangga uhaw tu pagtabang tu katribuhan wara lamang dahuma tu mgo katuigan presidente Ramos ka Ipra Law kandin pig amidahan tuig 1997 Gloria Arroyo kandin Tig segundahan buyan tu of October 29. Kandin soe Tig permahan.  Tig maduan tu INCP tu Ipra Law panalipdan 8371 kinahanglan dudusunan Aron matabangan mga katribuhan Kay duon tu kalisdanan lantawa ka duma now tu kabus tu pag aha- aha Kun wuhig pad lamang malubog matin ow wara lamang dahuma nu mgo katuigan kan pig lugdang nu wohig iyan op isab ug pa ibabow.",
    translation: "What Was Buried Has Surfaced Again",
    genre: "SONG",
    themes: ["NATURE_AND_ENVIRONMENT","HEROIC_DEEDS"],
    culturalElements: ["Tribal Recognition","Cultural Identity","Resilience","Manobo Folk Song"]
  },
  {
    id: "fb-hardship",
    title: "Kapoit to Kanak Kahimtang",
    manoboTitle: "Kapoit to Kanak Kahimtang",
    englishTitle: "The Hardship of My Situation",
    type: "FOLK_SONG",
    content: "The song conveys a profound sense of emotional struggle, loneliness, and longing. The mountains symbolize the burdens and hardships faced by the narrator, reinforcing their feelings of being trapped in a difficult situation.",
    transcription: "Kapait soe Kanak kahimtang bubungan SI Kanak pig ugpaan ug sinugow a Man usahay tug paka dumdum a tu kanay inoy, labi on tu mgo silingan Kay Kandan amana tamayan sinugow a tug kadumduman tu kandan pagtamay.Oh a dios on lang iyo tibu Kay kani a man tu tikang, ug Tambo duon tu bintana Dahun tu misitas na Puno on tu mgo luha.",
    translation: "How hardship my situation is, For the mountains are my home. I weep when I remember my mother. But, because of these neighbors, For they have scorned me. I sometimes cry when I recall your disdain. Oh, farewell to all of you, For I am about to leave. I will look out the window, Leaves of the misitas, Full of tears. Here I am, far away, Facing the great waves. I sometimes cry when I remember your disdain. I sometimes cry when I think of my mother.",
    genre: "SONG",
    themes: ["SOCIAL_CUSTOMS","DEATH_AND_AFTERLIFE"],
    culturalElements: ["Family Life","Social Isolation","Grief and Loss","Manobo Folk Song"]
  }
]

// Fallback text for the Logic Engine simulator when the archive has no
// entries at all to default to (see initialEntry below).
const DEFAULT_SIMULATOR_TEXT = "The stars were born from the breath of the Father Sky in the beginning of all things."

function formatName(val: string): string {
  if (!val) return 'None'
  if (val === 'MYTH') return 'Myth (Oggayam)'
  if (val === 'LEGEND') return 'Legend (Tudtul)'
  if (val === 'EPIC') return 'Epic (Ulaging)'
  return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

type ConfidenceTier = 'weak' | 'moderate' | 'strong'

function getConfidenceTier(pct: number): { tier: ConfidenceTier; color: string; label: string } {
  if (pct < 30) return { tier: 'weak', color: '#ef4444', label: 'Needs Review' }
  if (pct < 65) return { tier: 'moderate', color: '#f59e0b', label: 'Moderate' }
  return { tier: 'strong', color: '#f1b80d', label: 'Confirmed' }
}

export default function ClassificationClient({ dbEntries = [] }: ClassificationClientProps) {
  const router = useRouter()
  
  const entriesList = dbEntries.length > 0 ? dbEntries : fallbackEntries
  const initialEntry = entriesList.find(e => e.title.includes("Creation of the Stars")) || entriesList[0]

  // Combine content + translation for richer classification matching
  const getEntryClassificationText = (entry: DBEntry) => {
    const parts = [entry.content, entry.translation].filter(Boolean)
    return parts.join(' ')
  }

  const [selectedEntryId, setSelectedEntryId] = useState<string>(initialEntry?.id || 'fb-stars')
  const [inputText, setInputText] = useState(initialEntry ? getEntryClassificationText(initialEntry) : DEFAULT_SIMULATOR_TEXT)
  const [inputTranscription, setInputTranscription] = useState(initialEntry ? (initialEntry.transcription || '') : '')
  const [selectedTranslation, setSelectedTranslation] = useState(initialEntry?.translation || '')
  const [selectedBisayaTranslation, setSelectedBisayaTranslation] = useState(initialEntry?.bisayaTranslation || '')
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('ALL')

  const classificationResult = classifyEntry(inputText, inputTranscription, selectedGenreFilter)

  const filteredEntriesList = selectedGenreFilter === 'ALL'
    ? entriesList
    : entriesList.filter(entry => entry.genre === selectedGenreFilter)

  useEffect(() => {
    if (selectedEntryId !== 'custom' && !filteredEntriesList.some(e => e.id === selectedEntryId)) {
      if (filteredEntriesList.length > 0) {
        const nextEntry = filteredEntriesList[0]
        setSelectedEntryId(nextEntry.id)
        setInputText(getEntryClassificationText(nextEntry))
        setInputTranscription(nextEntry.transcription || '')
        setSelectedTranslation(nextEntry.translation || '')
        setSelectedBisayaTranslation(nextEntry.bisayaTranslation || '')
      } else {
        setSelectedEntryId('custom')
        setInputText('')
        setInputTranscription('')
        setSelectedTranslation('')
        setSelectedBisayaTranslation('')
      }
    }
  }, [selectedGenreFilter, entriesList, selectedEntryId, filteredEntriesList])

  const eugenioCards = [
    {
      id: 'EUG-01',
      title: 'Myths',
      description: <>Narratives concerning the origins of the world,<br className="hidden md:inline" /> gods, and religious beliefs.</>,
      tags: ['CREATION', 'DEITY', 'CELESTIAL'],
    },
    {
      id: 'EUG-04',
      title: 'Epics',
      description: <>Long narrative poems centered on a hero&apos;s exploits<br className="hidden md:inline" /> and supernatural journeys.</>,
      tags: ['HERO', 'QUEST', 'ANCESTORS'],
    },
    {
      id: 'EUG-03',
      title: 'Folktales',
      description: <>Fictional narratives involving common folk, animals,<br className="hidden md:inline" /> or magical elements.</>,
      tags: ['ANIMAL', 'TRICKSTER', 'FABLE'],
    },
    {
      id: 'EUG-05',
      title: 'Gnomics',
      description: <>Short, pithy statements or metaphorical questions<br className="hidden md:inline" /> expressing cultural wisdom.</>,
      tags: ['METAPHOR', 'WIT', 'ADVICE'],
    },
  ]

  const andressCards = [
    {
      num: '01',
      title: 'Creation Myths',
      description: <>The shaping of the earth, the first<br className="hidden md:inline" /> humans, and the separation of sky<br className="hidden md:inline" /> and soil.</>,
    },
    {
      num: '02',
      title: 'Heroic Deeds',
      description: <>Historical and mythic battles,<br className="hidden md:inline" /> defense of territory, and tests of<br className="hidden md:inline" /> strength.</>,
    },
    {
      num: '03',
      title: 'Courtship',
      description: <>Complex rituals of marriage<br className="hidden md:inline" /> negotiation, dowry, and romantic<br className="hidden md:inline" /> pursuit.</>,
    },
    {
      num: '04',
      title: 'Sickness & Healing',
      description: <>The relationship between human<br className="hidden md:inline" /> spiritual health and the unseen<br className="hidden md:inline" /> spirits.</>,
    },
    {
      num: '05',
      title: 'Farming Cycles',
      description: <>Agricultural rites, planting seasons,<br className="hidden md:inline" /> and the importance of rice (Oma).</>,
    },
    {
      num: '06',
      title: 'Displacement',
      description: <>Narratives of migration, loss of land,<br className="hidden md:inline" /> and the seeking of ancestral homes.</>,
    },
  ]

  return (
    <div className="w-full bg-[var(--bg-main)] text-[var(--text-primary)]" style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full px-6 md:px-8 py-8">
        
        {/* Top Header Section (Full Width, matches sidebar left edge) */}
        <div style={{ marginBottom: '32px' }}>
          {/* Header Path */}
          <div 
            style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: 'var(--brand-accent)', 
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}
          >
            Methodology & Frameworks
          </div>

          {/* Page Title */}
          <h1 
            style={{ 
              margin: '0 0 16px 0',
              fontSize: '44px', 
              fontWeight: 700, 
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              lineHeight: 1.1,
              color: 'var(--text-primary)'
            }}
          >
            Classification Frameworks
          </h1>

          <p 
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0'
            }}
          >
            The ManoboLit Archive employs a dual-framework approach to ensure academic rigor<br className="hidden md:inline" /> and cultural fidelity. We synthesize the pan-Philippine taxonomy of Damiana Eugenio with<br className="hidden md:inline" /> the specific thematic categories of Agusan Manobo tradition documented by Thomas<br className="hidden md:inline" /> Andress.
          </p>
        </div>

        {/* Separator Line */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0 24px 0' }} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* RIGHT MAIN PANEL */}
          <main className="flex-1 pb-24">
            
            {/* Pink Divider Indicator */}
            <div 
              style={{ 
                width: '32px', 
                height: '4px', 
                background: '#db2777', 
                margin: '0 auto 24px auto'
              }} 
            />

            {/* SECTION 1: EUGENIO TAXONOMY */}
            <section style={{ marginBottom: '60px', textAlign: 'center' }}>
              <h2 
                style={{ 
                  margin: '0 0 12px 0',
                  fontSize: '32px', 
                  fontWeight: 700, 
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  color: 'var(--text-primary)'
                }}
              >
                Eugenio (1993) Taxonomy
              </h2>
              <p 
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: '0 auto 32px auto',
                  textAlign: 'center'
                }}
              >
                Philippine Folk Literature: An Anthology (1993) provides the foundational structural taxonomy for classifying oral<br className="hidden md:inline" /> traditions across the archipelago.
              </p>

              {/* Grid of Eugenio Cards */}
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                style={{
                  textAlign: 'left',
                  maxWidth: '1000px',
                  margin: '0 auto'
                }}
              >
                {eugenioCards.map(card => (
                  <div
                    key={card.id}
                    className="stagger-item card-hover"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid #8F000D',
                      borderRadius: '0px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '160px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div>
                      {/* Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 
                          style={{
                            margin: 0,
                            fontSize: '22px',
                            fontWeight: 700,
                            fontFamily: 'Cormorant Garamond, Georgia, serif',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {card.title}
                        </h3>
                        <span 
                          style={{
                            background: '#18181b',
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontFamily: 'monospace'
                          }}
                        >
                          {card.id}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <p 
                        style={{
                          margin: '0 0 16px 0',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          fontStyle: 'italic',
                          maxWidth: 'none'
                        }}
                      >
                        {card.description}
                      </p>
                    </div>

                    {/* Tag Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {card.tags.map(tag => (
                        <span 
                          key={tag}
                          style={{
                            background: '#fee2e2',
                            color: 'var(--brand-accent)',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '2px',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 2: ANDRESS THEMATIC GRID */}
            <section style={{ marginBottom: '60px' }}>
              
              {/* Header with Horizontal Lines */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 12px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <h2 
                  style={{ 
                    margin: '0 24px',
                    fontSize: '32px', 
                    fontWeight: 700, 
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    color: 'var(--text-primary)',
                    textAlign: 'center'
                  }}
                >
                  Andress (1985) Thematic Grid
                </h2>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>

              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: '0 auto 32px auto',
                  textAlign: 'center'
                }}
              >
                Derived from the <em style={{ fontStyle: 'italic' }}>Agusan Manobo Bible Corpus</em>, Thomas Andress identified 12 specific thematic clusters that define the<br className="hidden md:inline" /> Manobo cognitive and cultural universe.
              </p>

              {/* Grid of Andress Cards */}
              <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {andressCards.map(card => (
                  <div
                    key={card.num}
                    className="stagger-item card-hover"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderLeft: '4px solid #f1b80d',
                      borderRadius: '0px',
                      padding: '20px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <h3 
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--brand-accent)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {card.num}: {card.title}
                    </h3>
                    <p 
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5
                      }}
                    >
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 3: THE LOGIC ENGINE */}
            <section
              style={{
                background: '#18181b',
                color: '#e2e8f0',
                padding: '40px',
                borderRadius: '0px',
                marginBottom: '60px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h2 
                style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '32px', 
                  fontWeight: 700, 
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  color: '#ffffff'
                }}
              >
                The Logic Engine (Eugenio & Andress Rules)
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#a1a1aa',
                  lineHeight: 1.6,
                  maxWidth: '750px',
                  margin: '0 0 32px 0'
                }}
              >
                Our system runs the Eugenio & Andress Rule-Based Classification Engine, which performs a real-time semantic scan of Manobo transcriptions, identifying structural markers to assign genre and theme with verifiable accuracy.
              </p>

              {/* Diagram Flow Container */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '24px',
                  background: '#121214',
                  border: '1px solid #2d2d34',
                  padding: '32px 24px',
                  borderRadius: '8px'
                }}
              >
                {/* 1. Raw Input Block */}
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    flex: '1 1 200px',
                    textAlign: 'center'
                  }}
                >
                  {/* Gold Document Icon */}
                  <div 
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      background: '#2a2a30', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '10px' 
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1b80d" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>Raw Input</div>
                    <div style={{ fontSize: '9px', color: '#71717a', fontWeight: 800, letterSpacing: '0.05em' }}>ORAL TRANSCRIPTION ML-421</div>
                  </div>

                  {/* Choose Genre to Classify Dropdown */}
                  <div style={{ width: '100%', maxWidth: '220px', textAlign: 'left' }}>
                    <label style={{ fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      CLASSIFICATION GENRE TARGET
                    </label>
                    <select
                      value={selectedGenreFilter}
                      onChange={(e) => setSelectedGenreFilter(e.target.value)}
                      className="input-anim"
                      style={{
                        width: '100%',
                        background: '#09090b',
                        border: '1px solid #1e1e24',
                        color: '#e2e8f0',
                        fontSize: '11px',
                        padding: '6px 10px',
                        outline: 'none',
                        borderRadius: '4px',
                        fontFamily: 'Inter, sans-serif',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">All Genres (Auto-Detect)</option>
                      {entriesList.some(e => e.genre === 'MYTH') && <option value="MYTH">Myth (Oggayam)</option>}
                      {entriesList.some(e => e.genre === 'LEGEND') && <option value="LEGEND">Legend (Tudtul)</option>}
                      {entriesList.some(e => e.genre === 'FOLKTALE') && <option value="FOLKTALE">Folktale</option>}
                      {entriesList.some(e => e.genre === 'EPIC') && <option value="EPIC">Epic (Ulaging)</option>}
                      {entriesList.some(e => e.genre === 'RIDDLE') && <option value="RIDDLE">Riddle</option>}
                      {entriesList.some(e => e.genre === 'PROVERB') && <option value="PROVERB">Proverb</option>}
                      {entriesList.some(e => e.genre === 'SONG') && <option value="SONG">Song</option>}
                      {entriesList.some(e => e.genre === 'CHANT') && <option value="CHANT">Chant</option>}
                    </select>
                  </div>
                  
                  {/* Select Narrative Entry Dropdown */}
                  <div style={{ width: '100%', maxWidth: '220px', textAlign: 'left' }}>
                    <label style={{ fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      SELECT ARCHIVE DATA ENTRY
                    </label>
                    <select
                      value={selectedEntryId}
                      onChange={(e) => {
                        const entryId = e.target.value
                        setSelectedEntryId(entryId)
                        if (entryId === 'custom') {
                          // Keep current text or reset
                        } else {
                          const found = entriesList.find(entry => entry.id === entryId)
                          if (found) {
                            setInputText(getEntryClassificationText(found))
                            setInputTranscription(found.transcription || '')
                            setSelectedTranslation(found.translation || '')
                            setSelectedBisayaTranslation(found.bisayaTranslation || '')
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        background: '#09090b',
                        border: '1px solid #1e1e24',
                        color: '#e2e8f0',
                        fontSize: '11px',
                        padding: '6px 10px',
                        outline: 'none',
                        borderRadius: '4px',
                        fontFamily: 'Inter, sans-serif',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="custom">-- Custom / Sidebar Preset --</option>
                      {filteredEntriesList.map(entry => (
                        <option key={entry.id} value={entry.id}>
                          {entry.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Entry Text Display Box */}
                  <div
                    style={{
                      background: '#09090b',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      border: '1px solid #1e1e24',
                      width: '100%',
                      maxWidth: '220px',
                      minHeight: '120px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      textAlign: 'left',
                      fontSize: '11px',
                      lineHeight: '1.4'
                    }}
                  >
                    {inputTranscription && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '8px', color: '#71717a', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '4px' }}>
                          MANOBO TRANSCRIPTION
                        </div>
                        <div style={{ color: '#f1b80d', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {inputTranscription}
                        </div>
                      </div>
                    )}
                    {!inputTranscription && (
                      <div style={{ color: '#71717a', fontStyle: 'italic', textAlign: 'center', marginTop: '30px' }}>
                        No text loaded
                      </div>
                    )}
                  </div>

                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3f3f46', fontSize: '22px' }}>
                  →
                </div>

                {/* 2. Rule Matcher Block */}
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    flex: '1 1 200px',
                    textAlign: 'center'
                  }}
                >
                  {/* Red Rule Chart Icon */}
                  <div 
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      background: '#361416', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '10px' 
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="9" x2="15" y2="9" />
                      <line x1="9" y1="13" x2="15" y2="13" />
                      <line x1="9" y1="17" x2="13" y2="17" />
                    </svg>
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>Rule Matcher</div>
                    <div style={{ fontSize: '9px', color: '#71717a', fontWeight: 800, letterSpacing: '0.05em' }}>FRAMEWORK SYNTHESIS</div>
                  </div>

                  {/* Rules list with confidence-tiered indicators + matched evidence */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '220px', minHeight: '80px', justifyContent: 'center' }}>
                    {classificationResult.rulesApplied.length > 0 ? (
                      classificationResult.rulesApplied.map(ruleId => {
                        const rule = [...genreRules, ...themeRules, ...locationRules].find(r => r.id === ruleId)
                        const detail = classificationResult.ruleDetails[ruleId]
                        const pct = Math.round((detail?.confidence || 0) * 100)
                        const { tier, color } = getConfidenceTier(pct)
                        const evidence = (detail?.matched || []).slice(0, 2).map(m => m.term).join(', ')
                        return (
                          <div
                            key={ruleId}
                            style={{
                              background: '#1e1e24',
                              padding: '8px 12px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 500,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#a1a1aa', textAlign: 'left' }}>
                                {rule ? rule.name : ruleId}
                              </span>
                              <div
                                title={`${pct}% confidence`}
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  background: tier === 'weak' ? 'transparent' : color,
                                  border: tier === 'weak' ? `1.5px dashed ${color}` : 'none',
                                  display: 'flex',
                                  flexShrink: 0,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {tier !== 'weak' && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#121214" strokeWidth="4">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            {evidence && (
                              <div style={{ marginTop: '4px', fontSize: '9.5px', color: '#52525b', textAlign: 'left', fontStyle: 'italic' }}>
                                matched: &ldquo;{evidence}&rdquo;
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div style={{ fontSize: '11px', color: '#71717a', fontStyle: 'italic', textAlign: 'center' }}>
                        No matching rules applied
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3f3f46', fontSize: '22px' }}>
                  →
                </div>

                {/* 3. Identified Result Panel */}
                <div 
                  style={{
                    flex: '1.2 1 240px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    minWidth: '220px'
                  }}
                >
                  {/* Genre Identified — always shown, since a top genre always exists */}
                  {(() => {
                    const pct = Math.round(classificationResult.genre.confidence * 100)
                    const { color, label } = getConfidenceTier(pct)
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.08em', marginBottom: '6px' }}>
                          <span>→</span>
                          <span>GENRE IDENTIFIED</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                            {formatName(classificationResult.genre.value)}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 700, color }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 700, color, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
                      </div>
                    )
                  })()}

                  {/* Theme Identified — collapses to a muted state when nothing confidently matched */}
                  {classificationResult.themes.length > 0 ? (() => {
                    const pct = Math.round(classificationResult.themes[0].confidence * 100)
                    const { color, label } = getConfidenceTier(pct)
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.08em', marginBottom: '6px' }}>
                          <span>→</span>
                          <span>THEME IDENTIFIED</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                            {formatName(classificationResult.themes[0].value)}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 700, color }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 700, color, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
                      </div>
                    )
                  })() : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        <span>→</span>
                        <span>THEME IDENTIFIED</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#52525b', fontStyle: 'italic' }}>
                        No confident theme match
                      </div>
                    </div>
                  )}

                  {/* Location Identified — collapses to a muted state when nothing confidently matched */}
                  {classificationResult.location ? (() => {
                    const pct = Math.round(classificationResult.location!.confidence * 100)
                    const { color, label } = getConfidenceTier(pct)
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.08em', marginBottom: '6px' }}>
                          <span>→</span>
                          <span>LOCATION IDENTIFIED</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                            {formatName(classificationResult.location!.value)}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 700, color }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: '4px', background: '#27272a', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 700, color, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
                      </div>
                    )
                  })() : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 800, color: '#71717a', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        <span>→</span>
                        <span>LOCATION IDENTIFIED</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#52525b', fontStyle: 'italic' }}>
                        No location markers detected
                      </div>
                    </div>
                  )}
                </div>


              </div>
            </section>

            {/* SECTION 4: ENTRY TRANSLATIONS */}
            {selectedEntryId !== 'custom' && (selectedTranslation || selectedBisayaTranslation) && (
              <section style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 24px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <h2
                    style={{
                      margin: '0 24px',
                      fontSize: '26px',
                      fontWeight: 700,
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      color: 'var(--text-primary)',
                      textAlign: 'center'
                    }}
                  >
                    Entry Translations
                  </h2>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 auto 24px auto', textAlign: 'center' }}>
                  English and Bisaya (Cebuano) translations for the selected archive entry are provided here as a scholarly reference for the classification framework.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                  <div
                    className="stagger-item card-hover"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0px',
                      padding: '20px',
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 12px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--brand-accent)',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '8px'
                      }}
                    >
                      TRANSLATION (ENGLISH)
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-line',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {selectedTranslation || 'No translation available.'}
                    </p>
                  </div>

                  <div
                    className="stagger-item card-hover"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0px',
                      padding: '20px',
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 12px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--brand-accent)',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '8px'
                      }}
                    >
                      TRANSLATION (BISAYA/CEBUANO)
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-line',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {selectedBisayaTranslation || 'No translation available.'}
                    </p>
                  </div>
                </div>
              </section>
            )}

          </main>

        </div>
      </div>
    </div>
  )
}
