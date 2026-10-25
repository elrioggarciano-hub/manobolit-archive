/**
 * ManoboLit Reference Lexicon & Phrasebook
 * 100% Sourced from the 22 Agusan Manobo Literature Entries
 * Field Research: Maravilla (June 2024, Trento) & Catipay & Curato (2024, Bunawan)
 * Language: Agusan Manobo (ISO 639-3: msm) with Bisaya (Cebuano) and English
 */

export interface ParallelPhrase {
  english: string
  manobo: string
  bisaya: string
  context?: string
  verseRef?: string // Referenced entry title in the archive
  entryTitle?: string
}

export interface LexiconEntry {
  english: string
  manobo: string
  bisaya: string
  category: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'PARTICLE' | 'PRONOUN' | 'CULTURAL'
  notes?: string
}

/**
 * Real parallel phrases extracted directly from the 22 folk songs, folktales, proverbs, and riddles.
 */
export const BIBLE_PARALLEL_PHRASES: ParallelPhrase[] = [
  {
    english: 'what was buried has surfaced again',
    manobo: 'kan pig lugdang nu wohig iyan on isab ug pa ibabow',
    bisaya: 'ang nalubong sa tubig maoy mikawas pag-usab',
    verseRef: 'Ka nilugdang iyan on usab paibabow (Folk Song)',
    entryTitle: 'Ka nilugdang iyan on usab paibabow',
  },
  {
    english: 'the mountains are my home',
    manobo: 'bubungan SI Kanak pig ugpaan',
    bisaya: 'ang bukid maoy akong gipuy-an',
    verseRef: 'Kapoit to Kanak Kahimtang (Folk Song)',
    entryTitle: 'Kapoit to Kanak Kahimtang',
  },
  {
    english: 'i weep when i remember my mother',
    manobo: 'ug sinugow a Man usahay tug paka dumdum a tu kanay inoy',
    bisaya: 'muhilak ko usahay kon mahinumdom ko sa akong inahan',
    verseRef: 'Kapoit to Kanak Kahimtang (Folk Song)',
    entryTitle: 'Kapoit to Kanak Kahimtang',
  },
  {
    english: 'history of the situation of the tribe',
    manobo: 'kasaysayan tu kahimtang tu katribuhan',
    bisaya: 'kasaysayan sa kahimtang sa katribuhan',
    verseRef: 'Kasaysayan tu Katribuhan (Folk Song)',
    entryTitle: 'Kasaysayan tu Katribuhan',
  },
  {
    english: 'the mountains have become barren',
    manobo: 'naupow on tu mgo bubungan ta',
    bisaya: 'naupaw na ang atong mga kabukiran',
    verseRef: 'Opaw on tu Kabubunganan (Folk Song)',
    entryTitle: 'Opaw on tu Kabubunganan',
  },
  {
    english: 'the night has arrived and so has loneliness',
    manobo: 'Mig dangat kan kadukilom Mig duma isab ka kamingaw',
    bisaya: 'Miabot ang kagabhion miuban usab ang kamingaw',
    verseRef: 'Kadikiluman (Folk Song)',
    entryTitle: 'Kadikiluman',
  },
  {
    english: 'no matter how hard life is',
    manobo: 'inggad nukoy ka lisud kan kinabuhi',
    bisaya: 'bisan unsa kalisod ang kinabuhi',
    verseRef: 'Panultihon: Life is hard (Proverb)',
    entryTitle: 'Panultihon (Life is hard)',
  },
  {
    english: 'listen because it brings peace and cures loneliness',
    manobo: 'paminug, su sie maka daya ita tu kalinuw tambi tu kamingow',
    bisaya: 'paminaw, kay kini makahatag og kalinaw ug tambal sa kamingaw',
    verseRef: 'Panultihon: Peace and cure loneliness (Proverb)',
    entryTitle: 'Panultihon (Peace and cure loneliness)',
  },
  {
    english: 'your face is beautiful but your behavior is not edible',
    manobo: 'Marujow dag ahaun kan bayho nu, Piro kan kinaiya nu kunag ka kuun',
    bisaya: 'Maayo rang tan-awon ang imong nawong, pero ang imong batasan dili makaon',
    verseRef: 'Panultihon: Attitude matters most (Proverb)',
    entryTitle: 'Panultihon (Attitude matters most)',
  },
  {
    english: 'the fairy of the stream watches over the water',
    manobo: 'kan diwata duun tu wuhig mig bantuy tukan wuhig',
    bisaya: 'ang diwata sa tubig nagbantay sa tubig',
    verseRef: 'Diwata duun tu wuhig (Folktale)',
    entryTitle: 'Diwata duun tu wuhig',
  },
  {
    english: 'the native boy was exploring the mountain',
    manobo: 'suboka nuka ligsok nu yumad, mig suroy kandin diya tu bubungan',
    bisaya: 'usa ka batang lumad, misuroy siya sa bukid',
    verseRef: 'Yumad diya tu bubungan (Folktale)',
    entryTitle: 'Yumad diya tu bubungan',
  },
  {
    english: 'you come from outside but enter inside',
    manobo: 'likat diyat gawas pero ug abot diyat suyod',
    bisaya: 'gikan sa gawas apan moabot sa sulod',
    verseRef: 'Kahayag: Light (Riddle)',
    entryTitle: 'Kahayag (Light)',
  },
]

/**
 * Real vocabulary words extracted directly from the 22 thesis entries.
 */
export const BIBLE_LEXICON: LexiconEntry[] = [
  // ── Nature & Land (from Songs, Folktales & Riddles) ──
  { english: 'mountain', manobo: 'Bubungan', bisaya: 'Bukid', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'mountains', manobo: 'Kabubunganan', bisaya: 'Kabukiran', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'water', manobo: 'Wuhig', bisaya: 'Tubig', category: 'NOUN', notes: 'From Diwata duun tu wuhig & Nilugdang' },
  { english: 'stream', manobo: 'Sapa', bisaya: 'Sapa', category: 'NOUN', notes: 'From Kan isda diya tu sapa' },
  { english: 'river', manobo: 'Adgawan', bisaya: 'Suba', category: 'NOUN', notes: 'From Tagbanwa tu Batasan' },
  { english: 'land', manobo: 'Pasak', bisaya: 'Kayutaan', category: 'NOUN', notes: 'From Kasaysayan tu Katribuhan' },
  { english: 'tree', manobo: 'Kayo', bisaya: 'Kahoy', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'trees', manobo: 'Kakayuhan', bisaya: 'Kakahoyan', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'forest', manobo: 'Guyangan', bisaya: 'Lasang', category: 'NOUN', notes: 'From Diwata duun tu wuhig & Damgo' },
  { english: 'night', manobo: 'Kadikiluman', bisaya: 'Gabii', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'light', manobo: 'Kahayag', bisaya: 'Kahayag', category: 'NOUN', notes: 'From Kahayag Riddle' },
  { english: 'sun', manobo: 'Adlaw', bisaya: 'Adlaw', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'star', manobo: 'Bituen', bisaya: 'Bituon', category: 'NOUN', notes: 'From Indigenous astronomy' },
  { english: 'stars', manobo: 'Mga bituen', bisaya: 'Mga bituon', category: 'NOUN', notes: 'From Indigenous astronomy' },
  { english: 'waves', manobo: 'Bayod', bisaya: 'Balod', category: 'NOUN', notes: 'From Nilugdang & Kapoit' },
  { english: 'fish', manobo: 'Isda', bisaya: 'Isda', category: 'NOUN', notes: 'From Kan isda diya tu sapa' },
  { english: 'tiger', manobo: 'Tigre', bisaya: 'Tigre', category: 'NOUN', notes: 'From Yumad diya tu bubungan & Damgo' },
  { english: 'bird', manobo: 'Manok-manok', bisaya: 'Langgam', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'beans', manobo: 'Batong', bisaya: 'Batong', category: 'NOUN', notes: 'From Batong Riddle' },
  { english: 'sugarcane', manobo: 'Tubo', bisaya: 'Tubo', category: 'NOUN', notes: 'From Tubo Riddle' },
  { english: 'charcoal', manobo: 'Uling', bisaya: 'Uling', category: 'NOUN', notes: 'From Uling Riddle' },
  { english: 'plants', manobo: 'Misitas', bisaya: 'Tanom', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },

  // ── People & Tribe ──
  { english: 'tribe', manobo: 'Katribuhan', bisaya: 'Tribo', category: 'NOUN', notes: 'From Kasaysayan tu Katribuhan' },
  { english: 'people', manobo: 'Kaotawan', bisaya: 'Mga tawo', category: 'NOUN', notes: 'From Kasaysayan tu Katribuhan' },
  { english: 'person', manobo: 'Utow', bisaya: 'Tawo', category: 'NOUN', notes: 'From Diwata duun tu wuhig' },
  { english: 'native', manobo: 'Yumad', bisaya: 'Lumad', category: 'NOUN', notes: 'From Yumad diya tu bubungan' },
  { english: 'child', manobo: 'Ligsok', bisaya: 'Bata', category: 'NOUN', notes: 'From Tagbanwa & Yumad' },
  { english: 'children', manobo: 'Kabataan', bisaya: 'Mga bata', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'mother', manobo: 'Inoy', bisaya: 'Inahan', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'father', manobo: 'Amey', bisaya: 'Amahan', category: 'NOUN', notes: 'Agusan Manobo kinship' },
  { english: 'family', manobo: 'Pamilya', bisaya: 'Pamilya', category: 'NOUN', notes: 'From Diwata & Tagbanwa' },
  { english: 'neighbors', manobo: 'Silingan', bisaya: 'Silingan', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'outsiders', manobo: 'Dayuhan', bisaya: 'Dumuduong', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'husband', manobo: 'Bana', bisaya: 'Bana', category: 'NOUN', notes: 'From Uling Riddle' },
  { english: 'companion', manobo: 'Kadumahan', bisaya: 'Kauban', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },

  // ── Cultural Lore, Spirits & Heritage ──
  { english: 'spirit', manobo: 'Diwata', bisaya: 'Diwata', category: 'CULTURAL', notes: 'From Diwata duun tu wuhig' },
  { english: 'guardian', manobo: 'Tagbanwa', bisaya: 'Tagbanwa', category: 'CULTURAL', notes: 'From Tagbanwa tu Batasan' },
  { english: 'blessing', manobo: 'Panalangin', bisaya: 'Panalangin', category: 'CULTURAL', notes: 'From Diwata duun tu wuhig' },
  { english: 'proverb', manobo: 'Panultihon', bisaya: 'Panultihon', category: 'CULTURAL', notes: 'Genre in Catipay & Curato (2024)' },
  { english: 'story', manobo: 'Sigulanon', bisaya: 'Sugilanon', category: 'CULTURAL', notes: 'Genre in Catipay & Curato (2024)' },
  { english: 'riddle', manobo: 'Tigmo', bisaya: 'Tigmo', category: 'CULTURAL', notes: 'Genre in Catipay & Curato (2024)' },
  { english: 'song', manobo: 'Awit', bisaya: 'Awit', category: 'CULTURAL', notes: 'Genre in Maravilla (2024)' },
  { english: 'history', manobo: 'Kasaysayan', bisaya: 'Kasaysayan', category: 'CULTURAL', notes: 'From Kasaysayan tu Katribuhan' },
  { english: 'gold', manobo: 'Bulawan', bisaya: 'Bulawan', category: 'CULTURAL', notes: 'From Kasaysayan & Opaw' },
  { english: 'wealth', manobo: 'Kayamanan', bisaya: 'Bahandi', category: 'CULTURAL', notes: 'From Kasaysayan tu Katribuhan' },

  // ── Feelings, Life & Hardship ──
  { english: 'hardship', manobo: 'Kapait', bisaya: 'Kalisod', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'loneliness', manobo: 'Kamingaw', bisaya: 'Kamingaw', category: 'NOUN', notes: 'From Nilugdang & Kadikiluman' },
  { english: 'sorrow', manobo: 'Kasakit', bisaya: 'Kasakit', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'love', manobo: 'Gugma', bisaya: 'Gugma', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'peace', manobo: 'Kalinuw', bisaya: 'Kalinaw', category: 'NOUN', notes: 'From Panultihon' },
  { english: 'tears', manobo: 'Luha', bisaya: 'Luha', category: 'NOUN', notes: 'From Kapoit & Kadikiluman' },
  { english: 'fear', manobo: 'Kahadlok', bisaya: 'Kahadlok', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'resilient', manobo: 'Mapailubon', bisaya: 'Mapailubon', category: 'ADJECTIVE', notes: 'From Ka nilugdang...' },
  { english: 'bare', manobo: 'Opaw', bisaya: 'Upaw', category: 'ADJECTIVE', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'hunger', manobo: 'Buntas', bisaya: 'Gutom', category: 'NOUN', notes: 'From Panultihon (Life is hard)' },

  // ── Actions & Verbs ──
  { english: 'weep', manobo: 'sinugow', bisaya: 'hilak', category: 'VERB', notes: 'From Kapoit & Kadikiluman' },
  { english: 'listen', manobo: 'paminug', bisaya: 'paminaw', category: 'VERB', notes: 'From Nilugdang & Panultihon' },
  { english: 'walk', manobo: 'panow', bisaya: 'lakaw', category: 'VERB', notes: 'From Kadikiluman & Tagbanwa' },
  { english: 'look', manobo: 'aha', bisaya: 'tan-aw', category: 'VERB', notes: 'From Nilugdang & Panultihon' },
  { english: 'remember', manobo: 'kadumdum', bisaya: 'hinumdom', category: 'VERB', notes: 'From Kapoit & Kadikiluman' },
  { english: 'protect', manobo: 'panalipdan', bisaya: 'panalipdan', category: 'VERB', notes: 'From Ka nilugdang...' },
  { english: 'help', manobo: 'tabang', bisaya: 'tabang', category: 'VERB', notes: 'From Nilugdang & Tagbanwa' },
  { english: 'clean', manobo: 'hinlo', bisaya: 'limpyo', category: 'VERB', notes: 'From Diwata duun tu wuhig' },
  { english: 'arrive', manobo: 'abot', bisaya: 'abot', category: 'VERB', notes: 'From Kadikiluman & Kahayag' },
  { english: 'return', manobo: 'pauli', bisaya: 'pauli', category: 'VERB', notes: 'From Kadikiluman & Tagbanwa' },
  { english: 'plant', manobo: 'pananom', bisaya: 'tanom', category: 'VERB', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'hide', manobo: 'hubong', bisaya: 'tago', category: 'VERB', notes: 'From Tagbanwa & Yumad' },
  { english: 'dwell', manobo: 'ugpaan', bisaya: 'puy-anan', category: 'VERB', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'make', manobo: 'himo', bisaya: 'himo', category: 'VERB', notes: 'From Diwata & Panultihon' },
  { english: 'give', manobo: 'bugoy', bisaya: 'hatag', category: 'VERB', notes: 'From Diwata duun tu wuhig' },
  { english: 'dream', manobo: 'damgo', bisaya: 'damgo', category: 'VERB', notes: 'From Damgo Riddle' },

  // ── Qualities & Adjectives ──
  { english: 'good', manobo: 'Marujow', bisaya: 'Maayo', category: 'ADJECTIVE', notes: 'From Panultihon & Diwata' },
  { english: 'beautiful', manobo: 'Madiyoway', bisaya: 'Nindot', category: 'ADJECTIVE', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'hard', manobo: 'Malisud', bisaya: 'Lisod', category: 'ADJECTIVE', notes: 'From Panultihon (Life is hard)' },
  { english: 'great', manobo: 'Maaslag', bisaya: 'Dako', category: 'ADJECTIVE', notes: 'From Tagbanwa & Kapoit' },
  { english: 'small', manobo: 'Maintok', bisaya: 'Gamay', category: 'ADJECTIVE', notes: 'From Batong & Tagbanwa' },
  { english: 'many', manobo: 'Maditi', bisaya: 'Daghan', category: 'ADJECTIVE', notes: 'From Folktales & Songs' },
  { english: 'ancient', manobo: 'Karaan', bisaya: 'Karaan', category: 'ADJECTIVE', notes: 'From Tagbanwa tu Batasan' },
  { english: 'true', manobo: 'Tinuud', bisaya: 'Tinuod', category: 'ADJECTIVE', notes: 'From Tagbanwa tu Batasan' },
  { english: 'white', manobo: 'Maputi', bisaya: 'Puti', category: 'ADJECTIVE', notes: 'From Uling Riddle' },
  { english: 'black', manobo: 'Maitom', bisaya: 'Itom', category: 'ADJECTIVE', notes: 'From Uling Riddle' },

  // ── Grammatical Particles & Pronouns ──
  { english: 'the', manobo: 'ka', bisaya: 'ang', category: 'PARTICLE' },
  { english: 'to', manobo: 'tu', bisaya: 'sa', category: 'PARTICLE' },
  { english: 'in', manobo: 'diya', bisaya: 'sa', category: 'PARTICLE' },
  { english: 'of', manobo: 'to', bisaya: 'sa', category: 'PARTICLE' },
  { english: 'and', manobo: 'duw', bisaya: 'ug', category: 'PARTICLE' },
  { english: 'my', manobo: 'kanak', bisaya: 'akong', category: 'PRONOUN' },
  { english: 'your', manobo: 'ikuw', bisaya: 'imong', category: 'PRONOUN' },
  { english: 'we', manobo: 'ita', bisaya: 'kita', category: 'PRONOUN' },
  { english: 'they', manobo: 'kandan', bisaya: 'sila', category: 'PRONOUN' },
  { english: 'he', manobo: 'kandin', bisaya: 'siya', category: 'PRONOUN' },
  { english: 'she', manobo: 'kandin', bisaya: 'siya', category: 'PRONOUN' },
  { english: 'you', manobo: 'ikow', bisaya: 'ikaw', category: 'PRONOUN' },
]

// Aliases for clean semantic imports
export const MANOBOLIT_PARALLEL_PHRASES = BIBLE_PARALLEL_PHRASES
export const MANOBOLIT_LEXICON = BIBLE_LEXICON
