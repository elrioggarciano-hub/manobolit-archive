// Multilingual and Low-Resource Dialect Tokenizer for Agusan Manobo Literature
// Handles English, Bisaya (Cebuano), and Agusan Manobo stopwords, lemmatization normalization, and N-gram generation.

// Multi-lingual stopword list across English, Cebuano/Bisaya, and Manobo functional particles
export const STOPWORDS = new Set<string>([
  // English common functional stop words
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',

  // Bisaya / Cebuano functional particles & pronouns
  'ang', 'mga', 'sa', 'ug', 'og', 'nga', 'ni', 'kang', 'kay', 'si', 'niya', 'ila', 'kamo', 'kami',
  'ako', 'ikaw', 'siya', 'adto', 'kini', 'kana', 'didto', 'dinhi', 'diin', 'unya', 'aron', 'bisan',
  'apan', 'kay', 'tungod', 'alang', 'bahin', 'mahitungod', 'kaniya', 'kanako', 'kaninyo', 'kanila',

  // Agusan Manobo functional grammatical markers, ligatures, and pronouns
  'te', 'ne', 'so', 'su', 'se', 'to', 'ta', 'ki', 'ka', 'ku', 'ko', 'kan', 'si', 'diya', 'kandin',
  'kandan', 'silan', 'sikan', 'kani', 'ini', 'iyan', 'on', 'pad', 'pa', 'man', 'na', 'isab', 'usab',
  'inton', 'no', 'nu', 'mig', 'og', 'ogpaka', 'pig', 'nig', 'wo', 'we'
])

/**
 * Normalizes text: lowercases, removes non-alphanumeric punctuation except internal hyphens/apostrophes,
 * and collapses consecutive whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'") // replace curly quotes with straight
    .replace(/[^a-z0-9'\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Tokenizes text into unigrams, filtering out numbers, short tokens, and multi-lingual stopwords.
 */
export function tokenizeUnigrams(text: string, filterStopwords: boolean = true): string[] {
  const normalized = normalizeText(text)
  if (!normalized) return []

  const rawTokens = normalized.split(/\s+/)
  const cleaned: string[] = []

  for (const token of rawTokens) {
    const stripped = token.replace(/^['-]+|['-]+$/g, '')
    if (stripped.length <= 1) continue
    if (/^\d+$/.test(stripped)) continue // filter out pure digits
    if (filterStopwords && STOPWORDS.has(stripped)) continue
    cleaned.push(stripped)
  }

  return cleaned
}

/**
 * Generates contiguous character or word N-grams.
 * Word n-grams capture compound cultural concepts like "father sky", "origin myth", "moral lesson".
 */
export function generateWordBigrams(tokens: string[]): string[] {
  const bigrams: string[] = []
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`)
  }
  return bigrams
}

/**
 * Character N-Grams for orthographic / dialectal fuzzy matching.
 * E.g., "wuhig" -> ["wu", "uh", "hi", "ig"]
 */
export function generateCharNgrams(str: string, n: number = 2): string[] {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (clean.length < n) return [clean]
  const ngrams: string[] = []
  for (let i = 0; i <= clean.length - n; i++) {
    ngrams.push(clean.substring(i, i + n))
  }
  return ngrams
}
