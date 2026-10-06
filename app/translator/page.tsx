import TranslatorClient from './TranslatorClient'

export const metadata = {
  title: 'Word Translator — ManoboLit Archive',
  description: 'Word-level translation between Agusan Manobo, English, and Bisaya (Cebuano), powered by ManoboLit’s curated reference lexicon.',
}

export default function TranslatorPage() {
  return <TranslatorClient />
}
