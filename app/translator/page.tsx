import TranslatorClient from './TranslatorClient'

export const metadata = {
  title: 'Word Translator — ManoboLit Archive',
  description: 'Word-level translation between Agusan Manobo, English, and Bisaya (Cebuano), using a lexicon stored in the archive database, the SIL Webonary dictionary, the Agusan Manobo Bible (Kasuyatan to Diyus) for word validation, and word translations learned from verified archive texts.',
}

export default function TranslatorPage() {
  return <TranslatorClient />
}
