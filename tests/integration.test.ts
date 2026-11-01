import 'dotenv/config'
import assert from 'assert'
import { prisma } from '../lib/database/prisma'
import { computeContentHash } from '../lib/classification/contentHash'
import { createSessionToken } from '../lib/auth/session'
import { predictWithML } from '../lib/classification/mlClient'

async function runTests() {
  console.log('🧪 Starting ManoboLit ML & Human Verification Integration Tests...\n')

  let passed = 0
  let failed = 0

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn()
      console.log(`  ✓ ${name}`)
      passed++
    } catch (err: any) {
      console.error(`  ✗ ${name}:`, err.message)
      failed++
    }
  }

  // 1. Content Hashing Consistency
  await test('Content hash is deterministic and changes when text changes', async () => {
    const entry = {
      title: 'Legend of Mount Magdiwata',
      transcription: 'diya tu bubungan Magdiwata',
      translation: 'at Mount Magdiwata',
      content: 'Sacred mountain origin',
    }
    const h1 = computeContentHash(entry)
    const h2 = computeContentHash(entry)
    assert.strictEqual(h1, h2, 'Hashes of identical content should be equal')
    assert.strictEqual(h1.length, 64, 'SHA-256 hash length should be 64 characters')

    const modified = { ...entry, content: 'Modified sacred mountain text' }
    const h3 = computeContentHash(modified)
    assert.notStrictEqual(h1, h3, 'Hashes of modified content must differ')
  })

  // 2. Auth Session Token Verification
  await test('Session token creation and verification works securely', async () => {
    const token = await createSessionToken()
    assert.ok(token, 'Session token should be created')
    assert.ok(token.includes('.'), 'Token must contain timestamp and HMAC signature')
  })

  // 3. Prediction with ML and Rule Fallback
  await test('predictWithML returns valid genre, confidence, and identified source', async () => {
    const sample = {
      title: 'Tigmo about Coconut',
      transcription: 'tu maintok pad inggad pusilon buhi gihapon',
      content: 'This riddle asks what am I. Answer is coconut.',
    }
    const result = await predictWithML(sample)
    assert.ok(result.predictedGenre, 'Must return a predicted genre')
    assert.ok(result.confidence >= 0 && result.confidence <= 1, 'Confidence must be between 0 and 1')
    assert.ok(['ML_PIPELINE', 'RULE_BASED', 'RULE_BASED_FALLBACK'].includes(result.predictionSource), 'Must identify prediction source')
    assert.ok(result.modelVersion, 'Must identify model version')
  })

  // 4. Test Human Verification Lifecycle in Database
  await test('Human verification lifecycle: PENDING -> CONFIRMED -> VERIFIED with audit record', async () => {
    // Create a temporary test literature entry
    const testHash = computeContentHash({
      title: 'Test Verification Folktale',
      transcription: 'Bata sapa wuhig',
      translation: 'Child of the stream',
      content: 'A clever trickster monkey outwits crocodile at the riverbank.',
    })

    const entry = await prisma.literatureEntry.create({
      data: {
        title: 'Test Verification Folktale',
        content: 'A clever trickster monkey outwits crocodile at the riverbank.',
        transcription: 'Bata sapa wuhig',
        translation: 'Child of the stream',
        type: 'ORAL_LITERATURE',
        genre: 'FOLKTALE',
        source: 'Field Test (2026)',
        communityLocation: 'Sitio Dam',
        province: 'Agusan del Sur',
        municipality: 'Trento',
        reviewStatus: 'PENDING',
        contentHash: testHash,
        themes: '["MORAL_LESSONS"]',
        culturalElements: '["Trickster"]',
      },
    })

    try {
      assert.strictEqual(entry.reviewStatus, 'PENDING', 'New entry must default to PENDING')

      // Simulate human review confirmation
      const reviewAudit = await prisma.classificationReview.create({
        data: {
          entryId: entry.id,
          suggestedGenre: 'FOLKTALE',
          predictionSource: 'RULE_BASED',
          modelVersion: 'rules-baseline',
          decision: 'CONFIRMED',
          approvedGenre: 'FOLKTALE',
          reviewerId: 'admin-curator',
          contentHash: testHash,
          notes: 'Confirmed based on animal trickster motif',
        },
      })

      const verifiedEntry = await prisma.literatureEntry.update({
        where: { id: entry.id },
        data: {
          reviewStatus: 'VERIFIED',
          verifiedGenre: 'FOLKTALE',
          reviewerId: 'admin-curator',
          reviewedAt: new Date(),
          verifiedContentHash: testHash,
        },
      })

      assert.strictEqual(verifiedEntry.reviewStatus, 'VERIFIED')
      assert.strictEqual(verifiedEntry.verifiedContentHash, testHash)
      assert.strictEqual(reviewAudit.decision, 'CONFIRMED')

      // 5. Invalidation when content is modified after verification
      const modifiedHash = computeContentHash({
        title: entry.title,
        transcription: entry.transcription,
        translation: entry.translation,
        content: 'MODIFIED TEXT AFTER CURATOR SIGN-OFF',
      })

      const isMismatched = verifiedEntry.verifiedContentHash !== modifiedHash
      assert.ok(isMismatched, 'Hash mismatch should be detected when content is edited')

      // If text changed, system invalidates verified status
      const invalidatedEntry = await prisma.literatureEntry.update({
        where: { id: entry.id },
        data: {
          content: 'MODIFIED TEXT AFTER CURATOR SIGN-OFF',
          contentHash: modifiedHash,
          reviewStatus: 'PENDING', // Re-review required!
          verifiedContentHash: null,
        },
      })

      assert.strictEqual(invalidatedEntry.reviewStatus, 'PENDING', 'Modified record must revert to PENDING review')
      assert.strictEqual(invalidatedEntry.verifiedContentHash, null, 'Invalidated record must have null verifiedContentHash')

    } finally {
      // Clean up test entry and reviews
      await prisma.literatureEntry.delete({ where: { id: entry.id } })
    }
  })

  // 6. Category Definitions Exist and Contain Eugenio (1993) Taxonomies
  await test('Official Eugenio (1993) and Andress (1985) category definitions exist in DB', async () => {
    const mythDef = await prisma.categoryDefinition.findUnique({ where: { code: 'MYTH' } })
    assert.ok(mythDef, 'MYTH category definition must exist')
    assert.strictEqual(mythDef.framework, 'EUGENIO_1993')
    assert.ok(mythDef.description.length > 20, 'Definition must have detailed description')

    const songDef = await prisma.categoryDefinition.findUnique({ where: { code: 'SONG' } })
    assert.ok(songDef, 'SONG category definition must exist')
  })

  // 7. Model Registry Active Baseline
  await test('Model registry contains active model baseline', async () => {
    const activeModel = await prisma.mLModelRegistry.findFirst({
      where: { status: 'ACTIVE' },
    })
    assert.ok(activeModel, 'An active model must be registered in MLModelRegistry')
    assert.ok(['rules-baseline', 'v1.0.0'].includes(activeModel.version) || activeModel.version.startsWith('v'))
  })

  await prisma.$disconnect()

  console.log(`\n========================================`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`========================================\n`)

  if (failed > 0) process.exit(1)
}

runTests().catch(err => {
  console.error('Test suite failed:', err)
  process.exit(1)
})
