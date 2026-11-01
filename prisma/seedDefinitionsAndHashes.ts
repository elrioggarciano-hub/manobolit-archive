require('dotenv/config')
const { PrismaClient } = require('../src/generated/prisma')
const { PrismaPg } = require('@prisma/adapter-pg')
const crypto = require('crypto')

function computeHash(entry: any) {
  const normalized = [
    (entry.title || '').trim().toLowerCase(),
    (entry.transcription || '').trim().toLowerCase(),
    (entry.translation || '').trim().toLowerCase(),
    (entry.content || '').trim().toLowerCase(),
  ].join('\n---\n')
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
}

const GENRE_DEFINITIONS = [
  {
    code: 'MYTH',
    type: 'GENRE',
    title: 'Myth (Oggayam / Origin Narratives)',
    framework: 'EUGENIO_1993',
    description: 'Sacred traditional narratives explaining the creation of the cosmos, world origins, actions of supreme deities (e.g. Father Sky, Great Spirit), celestial bodies, and primordial humankind. Distinct from historical accounts by setting in primordial mythical time.',
    isDraft: false,
    approvedBy: 'curator-eugenio-1993',
    approvedAt: new Date(),
  },
  {
    code: 'LEGEND',
    type: 'GENRE',
    title: 'Legend (Tudtul)',
    framework: 'EUGENIO_1993',
    description: 'Traditional semi-historical narratives tied to specific Agusan landmarks (rivers, mountains like Mt. Magdiwata, Lake Bababu), heroic personages, or cultural origins regarded as historical truth by the community.',
    isDraft: false,
    approvedBy: 'curator-eugenio-1993',
    approvedAt: new Date(),
  },
  {
    code: 'FOLKTALE',
    type: 'GENRE',
    title: 'Folktale (Sugilanon)',
    framework: 'EUGENIO_1993',
    description: 'Prose narratives told primarily for entertainment and moral instruction, featuring talking animals, tricksters (e.g. monkey and crocodile), encounters with spirits/fairies (diwata, tagbanwa), and human wit over brute strength.',
    isDraft: false,
    approvedBy: 'curator-eugenio-1993',
    approvedAt: new Date(),
  },
  {
    code: 'EPIC',
    type: 'GENRE',
    title: 'Epic (Ulaging Cycle)',
    framework: 'EUGENIO_1993',
    description: 'Chanted or recited heroic narrative poetry recounting the heroic journeys, conquests, and supernatural battles of ancestral heroes like Agyu to protect the ancestral domain and tribal people.',
    isDraft: false,
    approvedBy: 'curator-eugenio-1993',
    approvedAt: new Date(),
  },
  {
    code: 'RIDDLE',
    type: 'GENRE',
    title: 'Riddle (Tigmo)',
    framework: 'EUGENIO_1993',
    description: 'Short metaphorical puzzles and brain-teasers in question-and-answer format drawing analogies to flora, fauna, tools, and elements of daily life (e.g., coconut, charcoal, tobacco, light).',
    isDraft: false,
    approvedBy: 'curator-eugenio-1993',
    approvedAt: new Date(),
  },
  {
    code: 'PROVERB',
    type: 'GENRE',
    title: 'Proverb (Panultihon)',
    framework: 'EUGENIO_1993',
    description: 'Succinct traditional maxims and didactic expressions embodying communal philosophy, ethical conduct, moral integrity, patience, and ancestral wisdom.',
    isDraft: false,
    approvedBy: 'curator-eugenio-1993',
    approvedAt: new Date(),
  },
  {
    code: 'SONG',
    type: 'GENRE',
    title: 'Folk Song (Lyrical Tradition)',
    framework: 'EUGENIO_1993',
    description: 'Lyrical vocal compositions expressing personal and communal emotion, longing, sorrow, historical grievances, deforestation, ancestral land struggles, and love.',
    isDraft: false,
    approvedBy: 'curator-eugenio-1993',
    approvedAt: new Date(),
  },
  {
    code: 'CHANT',
    type: 'GENRE',
    title: 'Ritual Chant (Babaylan Invocation)',
    framework: 'EUGENIO_1993',
    description: 'Rhythmic, sacred ceremonial recitations performed during agricultural rites, healing rituals, and spirit appeasement invoking ancestral deities and diwata.',
    isDraft: false,
    approvedBy: 'curator-eugenio-1993',
    approvedAt: new Date(),
  },
]

const THEME_DEFINITIONS = [
  {
    code: 'CREATION_MYTHS',
    type: 'THEME',
    title: 'Creation Myths',
    framework: 'ANDRESS_1985',
    description: 'Themes centered on the cosmological emergence of the earth, celestial bodies, and the genesis of human life.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'HEROIC_DEEDS',
    type: 'THEME',
    title: 'Heroic Deeds',
    framework: 'ANDRESS_1985',
    description: 'Themes highlighting valor, martial strength, defending clan territory, and self-sacrifice for the community.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'NATURE_AND_ENVIRONMENT',
    type: 'THEME',
    title: 'Nature & Environment',
    framework: 'ANDRESS_1985',
    description: 'Themes of ecological harmony, reverence for mountains and rivers, as well as mourning deforestation and land destruction.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'HISTORICAL_EVENTS',
    type: 'THEME',
    title: 'Historical Events',
    framework: 'ANDRESS_1985',
    description: 'Reflections on colonial encounters, Spanish and modern governmental intervention, tribal displacement, and legislative milestones like IPRA Law 8371.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'SOCIAL_CUSTOMS',
    type: 'THEME',
    title: 'Social Customs',
    framework: 'ANDRESS_1985',
    description: 'Tribal governance, communal solidarity, marriage rituals, hospitality, and respect for elder councils.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'MORAL_LESSONS',
    type: 'THEME',
    title: 'Moral Lessons',
    framework: 'ANDRESS_1985',
    description: 'Instructive principles on honest living, avoiding greed, valuing inner dignity over material status, and patience.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'SPIRIT_WORLD',
    type: 'THEME',
    title: 'Spirit World',
    framework: 'ANDRESS_1985',
    description: 'Animistic beliefs in diwata, guardian spirits of the waters and forests, and ancestral presence.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'DEATH_AND_AFTERLIFE',
    type: 'THEME',
    title: 'Death & Afterlife',
    framework: 'ANDRESS_1985',
    description: 'Elegiac reflections on mortality, departure, grief, ancestral journey, and solace.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'IDENTITY_AND_SELF_DISCOVERY',
    type: 'THEME',
    title: 'Identity & Self-Discovery',
    framework: 'ANDRESS_1985',
    description: 'Cultural persistence, asserting indigenous dignity, self-realization, and overcoming feeling invisible.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
  {
    code: 'SOCIAL_JUSTICE_AND_INEQUALITY',
    type: 'THEME',
    title: 'Social Justice & Inequality',
    framework: 'ANDRESS_1985',
    description: 'Critique of marginalization, resource exploitation by outsiders, and advocating for indigenous rights and equity.',
    isDraft: false,
    approvedBy: 'curator-andress-1985',
    approvedAt: new Date(),
  },
]

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  console.log('Seeding official category definitions...')
  for (const def of [...GENRE_DEFINITIONS, ...THEME_DEFINITIONS]) {
    await prisma.categoryDefinition.upsert({
      where: { code: def.code },
      update: {
        title: def.title,
        framework: def.framework,
        description: def.description,
        isDraft: def.isDraft,
      },
      create: def,
    })
  }
  console.log('Category definitions seeded.')

  console.log('Checking and hashing existing literature entries...')
  const entries = await prisma.literatureEntry.findMany()
  for (const entry of entries) {
    const hash = computeHash(entry)
    await prisma.literatureEntry.update({
      where: { id: entry.id },
      data: {
        contentHash: hash,
        // Existing records preserve their classifications as suggestions, but start as PENDING review
        reviewStatus: entry.reviewStatus || 'PENDING',
      },
    })
  }
  console.log(`Updated content hashes for ${entries.length} entries.`)

  // Ensure initial fallback ML model registry entry exists
  const existingBaseline = await prisma.mLModelRegistry.findFirst({
    where: { version: 'rules-baseline' }
  })
  if (!existingBaseline) {
    await prisma.mLModelRegistry.create({
      data: {
        version: 'rules-baseline',
        algorithm: 'RuleBasedBaseline',
        status: 'ACTIVE',
        metrics: JSON.stringify({
          source: 'Domain Expert System (Eugenio 1993 & Andress 1985 Taxonomies)',
          note: 'Active rule-based baseline pending sufficient human-verified training data'
        }),
        datasetSize: 0,
        verifiedCounts: JSON.stringify({}),
        promotionReason: 'Initial operational baseline for archive deployment',
        activatedAt: new Date(),
      }
    })
    console.log('Created rules-baseline model registry record.')
  }

  await prisma.$disconnect()
  console.log('Initialization completed successfully.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

export {}

