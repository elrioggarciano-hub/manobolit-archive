import { NextRequest, NextResponse } from 'next/server'
import { translateText, TranslationLang } from '@/lib/translation'

const VALID_LANGS: TranslationLang[] = ['en', 'msm', 'ceb']

// POST /api/translate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = body.text || ''
    const sourceLang: TranslationLang = VALID_LANGS.includes(body.sourceLang) ? body.sourceLang : 'en'
    const targetLang: TranslationLang = VALID_LANGS.includes(body.targetLang) ? body.targetLang : 'msm'

    if (!text) {
      return NextResponse.json({ error: 'Text is required for translation' }, { status: 400 })
    }

    const result = translateText(text, sourceLang, targetLang)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('POST /api/translate error:', error)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
