import TranslatorClient from './TranslatorClient'

export const metadata = {
  title: 'Word Translator — ManoboLit Archive',
  description: 'Word-level translation between Agusan Manobo, English, and Bisaya (Cebuano), validated against the Agusan Manobo Bible corpus.',
}

export default function TranslatorPage() {
  return <TranslatorClient />
}
