// Imports the Agusan Manobo New Testament ("Kasuyatan to Diyus", © 1999 Wycliffe Bible Translators, Inc.,
// CC BY-NC-ND 4.0) from eBible.org into the BibleVerse table, for lexical validation.
// The verse text is stored unchanged (format conversion only). Safe to re-run: existing verses are skipped.
// Usage: npm run import:bible            (downloads from eBible.org)
//        npm run import:bible -- <zip>    (uses a downloaded msmNT_usfm.zip)
import 'dotenv/config'
import fs from 'fs'
import zlib from 'zlib'
import { prisma } from '../lib/database/prisma'
import { BIBLE_USFM_URL, BIBLE_ATTRIBUTION, parseUsfmBook, ParsedVerse } from '../lib/translation/bible'

/** Minimal ZIP reader (central directory + deflate/stored entries). */
function readZip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>()
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Not a zip file')
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Corrupt zip directory')
    const method = buf.readUInt16LE(p + 10)
    const compSize = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOffset = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen)
    const lNameLen = buf.readUInt16LE(localOffset + 26)
    const lExtraLen = buf.readUInt16LE(localOffset + 28)
    const start = localOffset + 30 + lNameLen + lExtraLen
    const data = buf.subarray(start, start + compSize)
    if (method === 0) files.set(name, Buffer.from(data))
    else if (method === 8) files.set(name, zlib.inflateRawSync(data))
    p += 46 + nameLen + extraLen + commentLen
  }
  return files
}

async function importBible() {
  const localZip = process.argv[2]
  let zipBuf: Buffer
  if (localZip) {
    zipBuf = fs.readFileSync(localZip)
  } else {
    console.log(`Downloading ${BIBLE_USFM_URL} ...`)
    const res = await fetch(BIBLE_USFM_URL)
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`)
    zipBuf = Buffer.from(await res.arrayBuffer())
  }

  const verses: ParsedVerse[] = []
  for (const [name, data] of readZip(zipBuf)) {
    if (name.toLowerCase().endsWith('.usfm')) verses.push(...parseUsfmBook(data.toString('utf8')))
  }
  if (verses.length < 5000) throw new Error(`Only ${verses.length} verses parsed — the download does not look like the full New Testament`)

  let inserted = 0
  for (let i = 0; i < verses.length; i += 1000) {
    const r = await prisma.bibleVerse.createMany({ data: verses.slice(i, i + 1000), skipDuplicates: true })
    inserted += r.count
  }
  console.log(`Parsed ${verses.length} verses; inserted ${inserted}; total in table: ${await prisma.bibleVerse.count()}`)
  console.log(BIBLE_ATTRIBUTION)
}

importBible()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Import failed:', err.message)
    process.exit(1)
  })
