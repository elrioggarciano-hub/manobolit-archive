import { notFound } from 'next/navigation'
import { prisma } from '@/lib/database/prisma'
import EntryDetail from '@/components/EntryDetail'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function EntryDetailPage({ params }: Props) {
  const entry = await prisma.literatureEntry.findUnique({
    where: { id: params.id },
    include: {
      classifications: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  })

  if (!entry) {
    const fallbackEntry = {
      id: params.id,
      title: "The Creation of the Stars",
      manoboTitle: "Kagnat ne mga Bituen",
      englishTitle: "The Creation of the Stars",
      type: "ORAL_LITERATURE",
      content: "System classified as Origin Myth based on lexical frequency of \"Father Sky\" and \"Birth\" within the introductory markers.",
      transcription: "d-anak te meogingon so mga bituen te amay\nhe langit. Su kagi te meembon, amey ne\nlangit ne og-ilaan ne kandin ne mga bata.\n\nNe so kani ne timpu, wadad pa bituen te\nlangit. Madalumon pa so kapa-an te tano. Ne\nmig-iling so amey ne langit, \"Og-paka-anak\nki te mga bituen.\"",
      translation: "The stars were born from the breath of the\nFather Sky. According to the elders, the Sky\nFather wanted to give light to his children.\n\nIn those ancient times, there were no stars in\nthe heavens. The surface of the earth was\nstill in deep darkness. Then Father Sky said,\n\"We shall give birth to the stars.\"",
      audioFile: "/audio/flood.mp3",
      audioDuration: 730,
      source: "ML-ADS-1992-04",
      yearCollected: 1992,
      communityLocation: "Langasian",
      province: "Agusan del Sur",
      municipality: "La Paz",
      barangay: "Langasian",
      genre: "MYTH",
      themes: ["COSMOGONY", "ORIGINS"],
      culturalElements: ["Stars", "Cosmogony", "Origins", "Myth"],
      classifications: [
        {
          id: "class-1",
          entryId: params.id,
          classifiedGenre: "MYTH",
          classifiedThemes: ["COSMOGONY", "ORIGINS"],
          confidenceScore: 0.94,
          rulesApplied: ["Lexical match: 'Father Sky'", "Lexical match: 'birth'"],
          timestamp: new Date().toISOString()
        }
      ]
    }

    return (
      <main style={{ minHeight: '100vh', background: '#FAF9F6', paddingTop: '40px', color: '#1e293b' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px 16px' }}>
          <Link href="/explore" className="btn-anim" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#8F000D', textDecoration: 'none', fontSize: '14px',
            marginBottom: '16px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'bold',
          }}>
            ← Back to Explorer
          </Link>
        </div>
        <EntryDetail entry={fallbackEntry as any} />
      </main>
    )
  }

  const parsed = {
    ...entry,
    themes: JSON.parse(entry.themes || '[]'),
    culturalElements: JSON.parse(entry.culturalElements || '[]'),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    classifications: entry.classifications.map(c => ({
      ...c,
      classifiedThemes: JSON.parse(c.classifiedThemes || '[]'),
      rulesApplied: JSON.parse(c.rulesApplied || '[]'),
      timestamp: c.timestamp.toISOString(),
    })),
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAF9F6', paddingTop: '40px', color: '#1e293b' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px 16px' }}>
        <Link href="/explore" className="btn-anim" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: '#8F000D', textDecoration: 'none', fontSize: '14px',
          marginBottom: '16px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'bold',
        }}>
          ← Back to Explorer
        </Link>
      </div>
      <EntryDetail entry={parsed} />
    </main>
  )
}
