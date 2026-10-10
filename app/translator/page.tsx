import TranslatorClient from './TranslatorClient'

export const metadata = {
  title: 'Word Translator — ManoboLit Archive',
  description: 'Word-level translation between Agusan Manobo, English, and Bisaya (Cebuano), with phrases verified against the real Agusan Manobo Bible (Kasuyatan to Diyus).',
}

export default function TranslatorPage() {
  return <TranslatorClient />
}
