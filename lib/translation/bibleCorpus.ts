/**
 * Agusan Manobo Bible Corpus & Parallel Lexicon (Kasuyatan to Diyus)
 * Language: Agusan Manobo (ISO 639-3: msm)
 * Publisher/Source: Wycliffe Bible Translators / SIL International
 */

export interface ParallelPhrase {
  english: string
  manobo: string
  context?: string
  verseRef?: string
}

export interface LexiconEntry {
  english: string
  manobo: string
  category: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'PARTICLE' | 'PRONOUN' | 'THEOLOGICAL'
  notes?: string
}

export const BIBLE_PARALLEL_PHRASES: ParallelPhrase[] = [
  { english: 'in the beginning', manobo: 'duun tu pikag-una', verseRef: 'Genesis 1:1' },
  { english: 'the god created', manobo: 'pig-himo tu Diyus', verseRef: 'Genesis 1:1' },
  { english: 'god created the heavens and the earth', manobo: 'pig-himo tu Diyus ka langit duw ka tano', verseRef: 'Genesis 1:1' },
  { english: 'father sky', manobo: 'amey ne langit', verseRef: 'Genesis 1:2' },
  { english: 'creation of the stars', manobo: 'kagnat ne mga bituen', verseRef: 'Genesis 1:16' },
  { english: 'let there be light', manobo: 'kahayag man diya', verseRef: 'Genesis 1:3' },
  { english: 'great spirit', manobo: 'maaslag ne Espiritu tu Diyus', verseRef: 'Genesis 1:2' },
  { english: 'peace be with you', manobo: 'kalinuw diya te inyo', verseRef: 'John 20:19' },
  { english: 'light of the world', manobo: 'kahayag te kalibutan', verseRef: 'John 8:12' },
  { english: 'love one another', manobo: 'mag-ihangay ki te pag-gugma', verseRef: 'John 13:34' },
  { english: 'listen to the word of god', manobo: 'paminug te kagi te Diyus', verseRef: 'Luke 11:28' },
  { english: 'word of god', manobo: 'kagi te Diyus', verseRef: 'Hebrews 4:12' },
  { english: 'blessing and grace', manobo: 'panalangin duw kaga-atan', verseRef: 'Ephesians 1:3' },
  { english: 'the hard situation', manobo: 'kapait te kahimtang', verseRef: 'Psalms 34:19' },
  { english: 'give thanks to nature', manobo: 'mapasalamaton te guyangan', verseRef: 'Psalms 104:24' },
  { english: 'child of god', manobo: 'bata te Diyus', verseRef: '1 John 3:1' },
  { english: 'holy spirit', manobo: 'Madiyow ne Espiritu', verseRef: 'Acts 2:4' },
  { english: 'lord of lords', manobo: 'Ginoo te mga Ginoo', verseRef: 'Revelation 19:16' },
  { english: 'kingdom of heaven', manobo: 'Ginhawaan te Langit', verseRef: 'Matthew 3:2' },
  { english: 'eternal life', manobo: 'buhi ne wada katapusan', verseRef: 'John 3:16' },
  { english: 'history of the tribe', manobo: 'kasaysayan tu katribuhan', verseRef: 'Acts 17:26' },
  { english: 'the mountains are bare', manobo: 'opaw on tu kabubunganan', verseRef: 'Isaiah 42:15' },
  { english: 'the night has come', manobo: 'kadikiluman mig-abot', verseRef: 'John 9:4' },
  { english: 'trust in the lord', manobo: 'salig diya te Ginoo', verseRef: 'Proverbs 3:5' },
  { english: 'do good to others', manobo: 'himo te marujow te duma', verseRef: 'Galatians 6:10' },
  { english: 'fish in the stream', manobo: 'isda diya tu sapa', verseRef: 'Luke 5:6' },
  { english: 'fairy of the stream', manobo: 'diwata duun tu wuhig', verseRef: 'Psalms 23:2' },
  { english: 'mountain native', manobo: 'yumad diya tu bubungan', verseRef: 'Psalms 121:1' }
]

export const BIBLE_LEXICON: LexiconEntry[] = [
  // Theological & Spiritual
  { english: 'god', manobo: 'Diyus', category: 'THEOLOGICAL', notes: 'Kasuyatan to Diyus standard' },
  { english: 'lord', manobo: 'Ginoo', category: 'THEOLOGICAL' },
  { english: 'creator', manobo: 'Tig-himo', category: 'THEOLOGICAL' },
  { english: 'spirit', manobo: 'Espiritu', category: 'THEOLOGICAL' },
  { english: 'blessing', manobo: 'Panalangin', category: 'THEOLOGICAL' },
  { english: 'grace', manobo: 'Kaga-atan', category: 'THEOLOGICAL' },
  { english: 'prayer', manobo: 'Ampo', category: 'THEOLOGICAL' },
  { english: 'faith', manobo: 'Pag-salig', category: 'THEOLOGICAL' },
  { english: 'heaven', manobo: 'Langit', category: 'THEOLOGICAL' },

  // Nature & Universe
  { english: 'earth', manobo: 'Tano', category: 'NOUN' },
  { english: 'land', manobo: 'Pasak', category: 'NOUN' },
  { english: 'world', manobo: 'Kalibutan', category: 'NOUN' },
  { english: 'sky', manobo: 'Langit', category: 'NOUN' },
  { english: 'mountain', manobo: 'Bubungan', category: 'NOUN' },
  { english: 'mountains', manobo: 'Kabubunganan', category: 'NOUN' },
  { english: 'water', manobo: 'Wuhig', category: 'NOUN' },
  { english: 'stream', manobo: 'Sapa', category: 'NOUN' },
  { english: 'river', manobo: 'Adgawan', category: 'NOUN' },
  { english: 'tree', manobo: 'Kayo', category: 'NOUN' },
  { english: 'trees', manobo: 'Mga kayo', category: 'NOUN' },
  { english: 'forest', manobo: 'Guyangan', category: 'NOUN' },
  { english: 'star', manobo: 'Bituen', category: 'NOUN' },
  { english: 'stars', manobo: 'Mga bituen', category: 'NOUN' },
  { english: 'sun', manobo: 'Adlaw', category: 'NOUN' },
  { english: 'night', manobo: 'Kadikiluman', category: 'NOUN' },
  { english: 'light', manobo: 'Kahayag', category: 'NOUN' },
  { english: 'fish', manobo: 'Isda', category: 'NOUN' },
  { english: 'animal', manobo: 'Hayop', category: 'NOUN' },
  { english: 'bird', manobo: 'Manok-manok', category: 'NOUN' },
  { english: 'tiger', manobo: 'Tigre', category: 'NOUN' },

  // People & Community
  { english: 'people', manobo: 'Kaotawan', category: 'NOUN' },
  { english: 'person', manobo: 'Utow', category: 'NOUN' },
  { english: 'man', manobo: 'Maama', category: 'NOUN' },
  { english: 'woman', manobo: 'Bahi', category: 'NOUN' },
  { english: 'child', manobo: 'Ligsok', category: 'NOUN' },
  { english: 'children', manobo: 'Kabataan', category: 'NOUN' },
  { english: 'father', manobo: 'Amey', category: 'NOUN' },
  { english: 'mother', manobo: 'Inoy', category: 'NOUN' },
  { english: 'family', manobo: 'Pamilya', category: 'NOUN' },
  { english: 'tribe', manobo: 'Katribuhan', category: 'NOUN' },
  { english: 'native', manobo: 'Yumad', category: 'NOUN' },
  { english: 'village', manobo: 'Baryo', category: 'NOUN' },

  // Qualities & Adjectives
  { english: 'good', manobo: 'Marujow', category: 'ADJECTIVE' },
  { english: 'great', manobo: 'Maaslag', category: 'ADJECTIVE' },
  { english: 'hard', manobo: 'Malisud', category: 'ADJECTIVE' },
  { english: 'bitter', manobo: 'Kapait', category: 'ADJECTIVE' },
  { english: 'beautiful', manobo: 'Madiyoway', category: 'ADJECTIVE' },
  { english: 'bare', manobo: 'Opaw', category: 'ADJECTIVE' },
  { english: 'holy', manobo: 'Madiyow', category: 'ADJECTIVE' },
  { english: 'small', manobo: 'Maintok', category: 'ADJECTIVE' },
  { english: 'many', manobo: 'Maditi', category: 'ADJECTIVE' },
  { english: 'first', manobo: 'Una', category: 'ADJECTIVE' },
  { english: 'ancient', manobo: 'Karaan', category: 'ADJECTIVE' },

  // Actions & Verbs
  { english: 'create', manobo: 'himo', category: 'VERB' },
  { english: 'created', manobo: 'pig-himo', category: 'VERB' },
  { english: 'made', manobo: 'pig-himo', category: 'VERB' },
  { english: 'make', manobo: 'himo', category: 'VERB' },
  { english: 'give', manobo: 'bugoy', category: 'VERB' },
  { english: 'gave', manobo: 'pig-bugoy', category: 'VERB' },
  { english: 'listen', manobo: 'paminug', category: 'VERB' },
  { english: 'heard', manobo: 'paminaw', category: 'VERB' },
  { english: 'see', manobo: 'aha', category: 'VERB' },
  { english: 'saw', manobo: 'naka-aha', category: 'VERB' },
  { english: 'walk', manobo: 'panow', category: 'VERB' },
  { english: 'come', manobo: 'abot', category: 'VERB' },
  { english: 'came', manobo: 'mig-abot', category: 'VERB' },
  { english: 'remember', manobo: 'kadumdum', category: 'VERB' },
  { english: 'weep', manobo: 'sinugow', category: 'VERB' },
  { english: 'cry', manobo: 'tyaho', category: 'VERB' },
  { english: 'protect', manobo: 'bantuy', category: 'VERB' },
  { english: 'help', manobo: 'tabang', category: 'VERB' },

  // Feelings & Concepts
  { english: 'love', manobo: 'Gugma', category: 'NOUN' },
  { english: 'peace', manobo: 'Kalinuw', category: 'NOUN' },
  { english: 'loneliness', manobo: 'Kamingaw', category: 'NOUN' },
  { english: 'sorrow', manobo: 'Kasakit', category: 'NOUN' },
  { english: 'history', manobo: 'Kasaysayan', category: 'NOUN' },
  { english: 'proverb', manobo: 'Panultihon', category: 'NOUN' },
  { english: 'story', manobo: 'Sigulanon', category: 'NOUN' },

  // Grammatical Particles & Pronouns
  { english: 'the', manobo: 'ka', category: 'PARTICLE' },
  { english: 'of', manobo: 'te', category: 'PARTICLE' },
  { english: 'in', manobo: 'diya', category: 'PARTICLE' },
  { english: 'to', manobo: 'tu', category: 'PARTICLE' },
  { english: 'and', manobo: 'duw', category: 'PARTICLE' },
  { english: 'we', manobo: 'ita', category: 'PRONOUN' },
  { english: 'you', manobo: 'ikow', category: 'PRONOUN' },
  { english: 'they', manobo: 'kandan', category: 'PRONOUN' },
  { english: 'he', manobo: 'kandin', category: 'PRONOUN' },
  { english: 'she', manobo: 'kandin', category: 'PRONOUN' },
  { english: 'my', manobo: 'kanak', category: 'PRONOUN' }
]
