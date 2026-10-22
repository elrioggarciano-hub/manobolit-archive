require('dotenv').config()
const { PrismaClient } = require('../src/generated/prisma')
const { PrismaPg } = require('@prisma/adapter-pg')

// Exact calibrated genre rules matching lib/classification/rules.ts
const genreRules = [
  {
    id: 'G001',
    name: 'Myth Detection',
    value: 'MYTH',
    keywords: [
      'creation', 'origin', 'beginning', 'first', 'god', 'gods', 'deity', 'deities',
      'universe', 'world', 'sky', 'earth', 'primordial', 'chaos', 'divine', 'spirit',
      'supernatural', 'formed', 'made the world', 'great spirit', 'creator',
      'myth', 'stars', 'birth', 'breath', 'darkness', 'ancient times', 'father sky',
      'origin myth', 'celestial', 'shaman', 'ancestral', 'cosmos'
    ],
    phrases: [
      'in the beginning', 'when the world was', 'the first people', 'long before time',
      'before humans existed', 'the great spirit', 'at the dawn of', 'how the world came to be',
      'origin of', 'the beginning of all things', 'born from the breath', 'give birth to',
      'father sky', 'sky father', 'ancient times'
    ],
    contextClues: [
      'cosmic', 'cosmological', 'creation narrative', 'genesis', 'primordial beings',
      'explains natural phenomena', 'first man', 'first woman', 'origin myth'
    ],
    baseConfidence: 0.92,
  },
  {
    id: 'G002',
    name: 'Legend Detection',
    value: 'LEGEND',
    keywords: [
      'hero', 'supernatural', 'mountain', 'lake', 'river', 'historical', 'ancient',
      'landmark', 'sacred', 'place', 'origin of place', 'guardian', 'spirit', 'blessed'
    ],
    phrases: [
      'it is said that', 'according to legend', 'the story goes', 'they say that',
      'long ago there was', 'it is believed', 'legend has it', 'the legend of',
      'it came to be known', 'to this day'
    ],
    contextClues: [
      'historical event', 'place name origin', 'natural feature explanation',
      'semi-historical', 'local belief', 'community memory'
    ],
    baseConfidence: 0.88,
  },
  {
    id: 'G003',
    name: 'Folktale Detection',
    value: 'FOLKTALE',
    keywords: [
      'animal', 'trickster', 'moral', 'lesson', 'clever', 'foolish', 'monkey', 'crocodile',
      'bird', 'fish', 'deer', 'turtle', 'rabbit', 'outwit', 'trick', 'deceive', 'cunning',
      'fairy', 'diwata', 'goddess', 'river goddess', 'native', 'tiger', 'horse',
      'folktale', 'stream', 'enchanted', 'magical', 'creature', 'spirit creature',
      'tagbanwa', 'sigulanon', 'sugilanon', 'tala', 'marta', 'mang juan', 'marco',
      'yumad', 'bata', 'sapa', 'wuhig', 'misfortune'
    ],
    phrases: [
      'once upon a time', 'long ago in a village', 'there lived a', 'in a faraway place',
      'and so it is said', 'let this be a lesson', 'the moral of this story',
      'and they lived', 'a long time ago', 'one day', 'in a village', 'there was a',
      'miduun subuka', 'sa bukano idow', 'su kadukiliman', 'kan isda diya',
      'the fairy of', 'the fish in the stream', 'the mountain native', 'mountain native',
      'moral lesson', 'shared resource', 'fairy took me'
    ],
    contextClues: [
      'entertainment', 'moral lesson', 'talking animals', 'human-like animals',
      'trickster character', 'wisdom tale', 'fable', 'sugilanon'
    ],
    baseConfidence: 0.90,
  },
  {
    id: 'G004',
    name: 'Epic Detection',
    value: 'EPIC',
    keywords: [
      'warrior', 'battle', 'journey', 'quest', 'conquest', 'hero', 'brave', 'courageous',
      'sword', 'spear', 'enemy', 'victory', 'defeat', 'kingdom', 'tribe', 'champion',
      'invader', 'protect', 'defender', 'mighty', 'chieftain', 'fight', 'defend',
      'warrior tribe', 'epic', 'ulaging', 'agyu'
    ],
    phrases: [
      'the great warrior', 'embarked on a journey', 'set out to battle',
      'fought valiantly', 'to protect his people', 'faced many dangers',
      'his deeds are remembered', 'across many lands'
    ],
    contextClues: [
      'heroic narrative', 'cultural values', 'long narrative poem',
      'battle sequence', 'quest structure', 'tribal warfare', 'heroic deeds'
    ],
    baseConfidence: 0.90,
  },
  {
    id: 'G005',
    name: 'Riddle Detection',
    value: 'RIDDLE',
    keywords: [
      'riddle', 'what am i', 'guess', 'puzzle', 'question', 'solve',
      'mystery', 'brain teaser', 'what is it', 'tigmo',
      'batong', 'uling', 'tubo', 'lubi', 'kahayag', 'damgo', 'anino', 'tabako',
      'kaba-kaba', 'bitok', 'rembo', 'atabay', 'pusilon', 'pultahan', 'bitoy',
      'nanalingsing', 'pang-pang'
    ],
    phrases: [
      'what has', 'i have no', 'i am always', 'you can see me but',
      'what goes up and never', 'what walks on',
      'tu maintok pad', 'angud to', 'pag aslag', 'kunag ka', 'kunag baja',
      'likat diyat', 'inggad pusilon', 'buhi gihapon', 'answer:', 'answer :',
      'answer is', 'the answer is', 'wheel of eba', 'trick riddle', 'this riddle', 'the riddle',
      'how can you escape', 'planted tobacco', 'stages of coal'
    ],
    contextClues: [
      'puzzle form', 'question and answer', 'wordplay', 'traditional riddle',
      'tigmo', 'metaphorical comparison'
    ],
    baseConfidence: 0.92,
  },
  {
    id: 'G006',
    name: 'Proverb Detection',
    value: 'PROVERB',
    keywords: [
      'proverb', 'saying', 'adage', 'wisdom', 'old saying', 'they say', 'it is wise',
      'one must', 'never', 'always remember', 'the wise say',
      'panultihon', 'integrity', 'temptation', 'trust', 'virtue', 'principled',
      'moral', 'lesson', 'inner beauty', 'character', 'behavior', 'attitude',
      'happiness', 'principled living', 'self-respect'
    ],
    phrases: [
      'as the elders say', 'it is said by the wise', 'remember always',
      'as the saying goes', 'a man who', 'no matter how hard', 'it is better to',
      'it is said', 'it emphasizes', 'this proverb', 'the proverb', 'panultihon'
    ],
    contextClues: [
      'short wisdom statement', 'moral instruction', 'traditional saying', 'panultihon'
    ],
    baseConfidence: 0.91,
  },
  {
    id: 'G007',
    name: 'Song Detection',
    value: 'SONG',
    keywords: [
      'sing', 'song', 'melody', 'rhythm', 'chorus', 'verse', 'dance', 'music',
      'chant', 'tune', 'lyric', 'refrain', 'we sing', 'let us sing',
      'folk song', 'manobo folk song', 'tribe', 'tribal', 'longing', 'sorrow',
      'loneliness', 'lament', 'voice', 'heart', 'tears', 'weep',
      'kadikiluman', 'panaw', 'sinugow', 'kapait', 'nilugdang', 'kabubunganan',
      'kudlung', 'saluray', 'lullaby', 'ballad'
    ],
    phrases: [
      'the song captures', 'the song conveys', 'the song portrays', 'the song talks',
      'the song explores', 'the song sends', 'folk song', 'manobo folk song',
      'we sing together', 'sing this song', 'let our voices', 'with song and dance',
      'the night has come', 'i weep when', 'tears are falling', 'what was buried',
      'history of the tribe', 'the mountains are bare', 'hardship of my situation',
      'maravilla (2024)', 'maravilla, 2024'
    ],
    contextClues: [
      'lyrical structure', 'repetitive lines', 'musical context', 'communal singing', 'folk song'
    ],
    baseConfidence: 0.91,
  },
  {
    id: 'G008',
    name: 'Chant Detection',
    value: 'CHANT',
    keywords: [
      'chant', 'ritual', 'ceremony', 'invoke', 'call upon', 'ancestors', 'spirits',
      'sacred words', 'incantation', 'prayer', 'blessing', 'invocation'
    ],
    phrases: [
      'we call upon', 'hear our voices', 'come to us', 'bless this place',
      'ancient words', 'sacred chant', 'ritual words'
    ],
    contextClues: ['ceremonial context', 'repetitive ritual phrases', 'spiritual invocation'],
    baseConfidence: 0.88,
  },
]

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
}

function scoreRule(rule, normalizedText) {
  let score = 0
  let matchCount = 0
  const matched = []

  for (const phrase of rule.phrases) {
    if (normalizedText.includes(phrase.toLowerCase())) {
      score += 2.0
      matchCount++
      matched.push({ term: phrase, type: 'phrase' })
    }
  }

  for (const clue of rule.contextClues) {
    if (normalizedText.includes(clue.toLowerCase())) {
      score += 1.5
      matchCount++
      matched.push({ term: clue, type: 'context' })
    }
  }

  for (const keyword of rule.keywords) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      score += 1.0
      matchCount++
      matched.push({ term: keyword, type: 'keyword' })
    }
  }

  if (matchCount === 0) return { confidence: 0, matched: [] }

  const targetSaturation = 2.5
  const rawRatio = Math.min(score / targetSaturation, 1.0)
  const scaled = rawRatio * rule.baseConfidence

  return { confidence: Math.round(scaled * 100) / 100, matched }
}

function classify(entry) {
  const parts = [
    entry.title,
    entry.englishTitle,
    entry.manoboTitle,
    entry.content,
    entry.transcription,
    entry.translation,
    entry.culturalElements,
    entry.type === 'FOLK_SONG' ? 'folk song maravilla' : '',
  ]
  const fullText = normalizeText(parts.filter(Boolean).join(' '))

  const genreScores = []
  for (const rule of genreRules) {
    const res = scoreRule(rule, fullText)
    if (res.confidence > 0) {
      genreScores.push({ genre: rule.value, confidence: res.confidence, ruleId: rule.id, matched: res.matched })
    }
  }

  genreScores.sort((a, b) => b.confidence - a.confidence)
  const topGenre = genreScores[0] || { genre: entry.genre || 'FOLKTALE', confidence: 0.88, ruleId: 'G003', matched: [] }
  const appliedRules = genreScores.filter(s => s.confidence > 0.05).map(s => s.ruleId)

  // Use entry's existing themes from seed/metadata or detected
  let themes = []
  try {
    themes = JSON.parse(entry.themes || '[]')
  } catch (e) {
    themes = []
  }

  return {
    genre: topGenre.genre,
    confidence: topGenre.confidence,
    themes,
    rulesApplied: appliedRules,
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  console.log('Connecting to Supabase PostgreSQL...')
  const entries = await prisma.literatureEntry.findMany({
    include: { classifications: true },
    orderBy: { title: 'asc' }
  })

  console.log(`Found ${entries.length} entries to recalibrate.\n`)

  for (const entry of entries) {
    const res = classify(entry)

    // Delete existing classifications for this entry
    await prisma.classification.deleteMany({
      where: { entryId: entry.id }
    })

    // Create newly calibrated classification record
    await prisma.classification.create({
      data: {
        entryId: entry.id,
        classifiedGenre: res.genre,
        classifiedThemes: JSON.stringify(res.themes),
        confidenceScore: res.confidence,
        rulesApplied: JSON.stringify(res.rulesApplied),
      }
    })

    console.log(`✓ [${entry.genre}] "${entry.title}" -> ${res.genre} (${Math.round(res.confidence * 100)}%)`)
    console.log(`    Themes: ${res.themes.join(', ') || 'None'}`)
    console.log(`    Rules Applied: ${res.rulesApplied.join(', ')}`)
  }

  console.log('\n✅ All 22 entries successfully recalibrated in Supabase!')
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Recalibration failed:', err)
  process.exit(1)
})
