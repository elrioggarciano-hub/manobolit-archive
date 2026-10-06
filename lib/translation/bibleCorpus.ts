/**
 * ManoboLit Reference Lexicon & Phrasebook
 * Language: Agusan Manobo (ISO 639-3: msm)
 *
 * A curated word-and-phrase list compiled for the Translator feature.
 * Word choices are informed by common Agusan Manobo usage, not a verified
 * transcription of any specific published text — no verse-level source is
 * claimed for any entry.
 *
 * Bisaya (Cebuano) glosses are added alongside the English ones so the
 * same lexicon can support Manobo <-> Bisaya word-level translation, not
 * only Manobo <-> English.
 */

export interface ParallelPhrase {
  english: string
  manobo: string
  bisaya: string
  context?: string
}

export interface LexiconEntry {
  english: string
  manobo: string
  bisaya: string
  category: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'PARTICLE' | 'PRONOUN' | 'THEOLOGICAL'
  notes?: string
}

export const BIBLE_PARALLEL_PHRASES: ParallelPhrase[] = [
  { english: 'in the beginning', manobo: 'duun tu pikag-una', bisaya: 'sa sinugdanan' },
  { english: 'the god created', manobo: 'pig-himo tu Diyus', bisaya: 'gibuhat sa Dios' },
  { english: 'god created the heavens and the earth', manobo: 'pig-himo tu Diyus ka langit duw ka tano', bisaya: 'gibuhat sa Dios ang langit ug ang yuta' },
  { english: 'father sky', manobo: 'amey ne langit', bisaya: 'amahan nga langit' },
  { english: 'creation of the stars', manobo: 'kagnat ne mga bituen', bisaya: 'paghimo sa mga bituon' },
  { english: 'let there be light', manobo: 'kahayag man diya', bisaya: 'unta adunay kahayag' },
  { english: 'great spirit', manobo: 'maaslag ne Espiritu tu Diyus', bisaya: 'gamhanan nga espiritu' },
  { english: 'peace be with you', manobo: 'kalinuw diya te inyo', bisaya: 'ang kalinaw magauban kaninyo' },
  { english: 'light of the world', manobo: 'kahayag te kalibutan', bisaya: 'kahayag sa kalibutan' },
  { english: 'love one another', manobo: 'mag-ihangay ki te pag-gugma', bisaya: 'paghigugmaay kamo sa usag usa' },
  { english: 'listen to the word of god', manobo: 'paminug te kagi te Diyus', bisaya: 'paminawa ang pulong sa Dios' },
  { english: 'word of god', manobo: 'kagi te Diyus', bisaya: 'pulong sa Dios' },
  { english: 'blessing and grace', manobo: 'panalangin duw kaga-atan', bisaya: 'panalangin ug grasya' },
  { english: 'the hard situation', manobo: 'kapait te kahimtang', bisaya: 'ang lisod nga kahimtang' },
  { english: 'give thanks to nature', manobo: 'mapasalamaton te guyangan', bisaya: 'pagpasalamat sa kinaiyahan' },
  { english: 'child of god', manobo: 'bata te Diyus', bisaya: 'anak sa Dios' },
  { english: 'holy spirit', manobo: 'Madiyow ne Espiritu', bisaya: 'balaang espiritu' },
  { english: 'lord of lords', manobo: 'Ginoo te mga Ginoo', bisaya: 'Ginoo sa mga ginoo' },
  { english: 'kingdom of heaven', manobo: 'Ginhawaan te Langit', bisaya: 'gingharian sa langit' },
  { english: 'eternal life', manobo: 'buhi ne wada katapusan', bisaya: 'kinabuhing walay kataposan' },
  { english: 'history of the tribe', manobo: 'kasaysayan tu katribuhan', bisaya: 'kasaysayan sa tribo' },
  { english: 'the mountains are bare', manobo: 'opaw on tu kabubunganan', bisaya: 'hubo ang kabukiran' },
  { english: 'the night has come', manobo: 'kadikiluman mig-abot', bisaya: 'miabot na ang kagabhion' },
  { english: 'trust in the lord', manobo: 'salig diya te Ginoo', bisaya: 'salig sa Ginoo' },
  { english: 'do good to others', manobo: 'himo te marujow te duma', bisaya: 'pagbuhat og maayo sa uban' },
  { english: 'fish in the stream', manobo: 'isda diya tu sapa', bisaya: 'isda sa sapa' },
  { english: 'fairy of the stream', manobo: 'diwata duun tu wuhig', bisaya: 'diwata sa sapa' },
  { english: 'mountain native', manobo: 'yumad diya tu bubungan', bisaya: 'lumad sa bukid' }
]

export const BIBLE_LEXICON: LexiconEntry[] = [
  // Theological & Spiritual
  { english: 'god', manobo: 'Diyus', bisaya: 'Dios', category: 'THEOLOGICAL' },
  { english: 'lord', manobo: 'Ginoo', bisaya: 'Ginoo', category: 'THEOLOGICAL' },
  { english: 'creator', manobo: 'Tig-himo', bisaya: 'Maglalalang', category: 'THEOLOGICAL' },
  { english: 'spirit', manobo: 'Espiritu', bisaya: 'Espiritu', category: 'THEOLOGICAL' },
  { english: 'blessing', manobo: 'Panalangin', bisaya: 'Panalangin', category: 'THEOLOGICAL' },
  { english: 'grace', manobo: 'Kaga-atan', bisaya: 'Grasya', category: 'THEOLOGICAL' },
  { english: 'prayer', manobo: 'Ampo', bisaya: 'Pag-ampo', category: 'THEOLOGICAL' },
  { english: 'faith', manobo: 'Pag-salig', bisaya: 'Pagtuo', category: 'THEOLOGICAL' },
  { english: 'heaven', manobo: 'Langit', bisaya: 'Langit', category: 'THEOLOGICAL' },

  // Nature & Universe
  { english: 'earth', manobo: 'Tano', bisaya: 'Yuta', category: 'NOUN' },
  { english: 'land', manobo: 'Pasak', bisaya: 'Kayutaan', category: 'NOUN' },
  { english: 'world', manobo: 'Kalibutan', bisaya: 'Kalibutan', category: 'NOUN' },
  { english: 'sky', manobo: 'Langit', bisaya: 'Langit', category: 'NOUN' },
  { english: 'mountain', manobo: 'Bubungan', bisaya: 'Bukid', category: 'NOUN' },
  { english: 'mountains', manobo: 'Kabubunganan', bisaya: 'Kabukiran', category: 'NOUN' },
  { english: 'water', manobo: 'Wuhig', bisaya: 'Tubig', category: 'NOUN' },
  { english: 'stream', manobo: 'Sapa', bisaya: 'Sapa', category: 'NOUN' },
  { english: 'river', manobo: 'Adgawan', bisaya: 'Suba', category: 'NOUN' },
  { english: 'tree', manobo: 'Kayo', bisaya: 'Kahoy', category: 'NOUN' },
  { english: 'trees', manobo: 'Mga kayo', bisaya: 'Mga kahoy', category: 'NOUN' },
  { english: 'forest', manobo: 'Guyangan', bisaya: 'Lasang', category: 'NOUN' },
  { english: 'star', manobo: 'Bituen', bisaya: 'Bituon', category: 'NOUN' },
  { english: 'stars', manobo: 'Mga bituen', bisaya: 'Mga bituon', category: 'NOUN' },
  { english: 'sun', manobo: 'Adlaw', bisaya: 'Adlaw', category: 'NOUN' },
  { english: 'night', manobo: 'Kadikiluman', bisaya: 'Gabii', category: 'NOUN' },
  { english: 'light', manobo: 'Kahayag', bisaya: 'Kahayag', category: 'NOUN' },
  { english: 'fish', manobo: 'Isda', bisaya: 'Isda', category: 'NOUN' },
  { english: 'animal', manobo: 'Hayop', bisaya: 'Hayop', category: 'NOUN' },
  { english: 'bird', manobo: 'Manok-manok', bisaya: 'Langgam', category: 'NOUN' },
  { english: 'tiger', manobo: 'Tigre', bisaya: 'Tigre', category: 'NOUN' },

  // People & Community
  { english: 'people', manobo: 'Kaotawan', bisaya: 'Mga tawo', category: 'NOUN' },
  { english: 'person', manobo: 'Utow', bisaya: 'Tawo', category: 'NOUN' },
  { english: 'man', manobo: 'Maama', bisaya: 'Lalaki', category: 'NOUN' },
  { english: 'woman', manobo: 'Bahi', bisaya: 'Babaye', category: 'NOUN' },
  { english: 'child', manobo: 'Ligsok', bisaya: 'Bata', category: 'NOUN' },
  { english: 'children', manobo: 'Kabataan', bisaya: 'Mga bata', category: 'NOUN' },
  { english: 'father', manobo: 'Amey', bisaya: 'Amahan', category: 'NOUN' },
  { english: 'mother', manobo: 'Inoy', bisaya: 'Inahan', category: 'NOUN' },
  { english: 'family', manobo: 'Pamilya', bisaya: 'Pamilya', category: 'NOUN' },
  { english: 'tribe', manobo: 'Katribuhan', bisaya: 'Tribo', category: 'NOUN' },
  { english: 'native', manobo: 'Yumad', bisaya: 'Lumad', category: 'NOUN' },
  { english: 'village', manobo: 'Baryo', bisaya: 'Baryo', category: 'NOUN' },

  // Qualities & Adjectives
  { english: 'good', manobo: 'Marujow', bisaya: 'Maayo', category: 'ADJECTIVE' },
  { english: 'great', manobo: 'Maaslag', bisaya: 'Gamhanan', category: 'ADJECTIVE' },
  { english: 'hard', manobo: 'Malisud', bisaya: 'Lisod', category: 'ADJECTIVE' },
  { english: 'bitter', manobo: 'Kapait', bisaya: 'Pait', category: 'ADJECTIVE' },
  { english: 'beautiful', manobo: 'Madiyoway', bisaya: 'Nindot', category: 'ADJECTIVE' },
  { english: 'bare', manobo: 'Opaw', bisaya: 'Hubo', category: 'ADJECTIVE' },
  { english: 'holy', manobo: 'Madiyow', bisaya: 'Balaan', category: 'ADJECTIVE' },
  { english: 'small', manobo: 'Maintok', bisaya: 'Gamay', category: 'ADJECTIVE' },
  { english: 'many', manobo: 'Maditi', bisaya: 'Daghan', category: 'ADJECTIVE' },
  { english: 'first', manobo: 'Una', bisaya: 'Una', category: 'ADJECTIVE' },
  { english: 'ancient', manobo: 'Karaan', bisaya: 'Karaan', category: 'ADJECTIVE' },

  // Actions & Verbs
  { english: 'create', manobo: 'himo', bisaya: 'maghimo', category: 'VERB' },
  { english: 'created', manobo: 'pig-himo', bisaya: 'gihimo', category: 'VERB' },
  { english: 'made', manobo: 'pig-himo', bisaya: 'gihimo', category: 'VERB' },
  { english: 'make', manobo: 'himo', bisaya: 'himoon', category: 'VERB' },
  { english: 'give', manobo: 'bugoy', bisaya: 'mohatag', category: 'VERB' },
  { english: 'gave', manobo: 'pig-bugoy', bisaya: 'gihatag', category: 'VERB' },
  { english: 'listen', manobo: 'paminug', bisaya: 'paminaw', category: 'VERB' },
  { english: 'heard', manobo: 'paminaw', bisaya: 'nadungog', category: 'VERB' },
  { english: 'see', manobo: 'aha', bisaya: 'makakita', category: 'VERB' },
  { english: 'saw', manobo: 'naka-aha', bisaya: 'nakakita', category: 'VERB' },
  { english: 'walk', manobo: 'panow', bisaya: 'maglakaw', category: 'VERB' },
  { english: 'come', manobo: 'abot', bisaya: 'moabot', category: 'VERB' },
  { english: 'came', manobo: 'mig-abot', bisaya: 'miabot', category: 'VERB' },
  { english: 'remember', manobo: 'kadumdum', bisaya: 'mahinumdom', category: 'VERB' },
  { english: 'weep', manobo: 'sinugow', bisaya: 'mohilak', category: 'VERB' },
  { english: 'cry', manobo: 'tyaho', bisaya: 'mohilak', category: 'VERB' },
  { english: 'protect', manobo: 'bantuy', bisaya: 'mopanalipod', category: 'VERB' },
  { english: 'help', manobo: 'tabang', bisaya: 'motabang', category: 'VERB' },

  // Feelings & Concepts
  { english: 'love', manobo: 'Gugma', bisaya: 'Gugma', category: 'NOUN' },
  { english: 'peace', manobo: 'Kalinuw', bisaya: 'Kalinaw', category: 'NOUN' },
  { english: 'loneliness', manobo: 'Kamingaw', bisaya: 'Kamingaw', category: 'NOUN' },
  { english: 'sorrow', manobo: 'Kasakit', bisaya: 'Kasubo', category: 'NOUN' },
  { english: 'history', manobo: 'Kasaysayan', bisaya: 'Kasaysayan', category: 'NOUN' },
  { english: 'proverb', manobo: 'Panultihon', bisaya: 'Panultihon', category: 'NOUN' },
  { english: 'story', manobo: 'Sigulanon', bisaya: 'Sugilanon', category: 'NOUN' },

  // Grammatical Particles & Pronouns
  { english: 'the', manobo: 'ka', bisaya: 'ang', category: 'PARTICLE' },
  { english: 'of', manobo: 'te', bisaya: 'sa', category: 'PARTICLE' },
  { english: 'in', manobo: 'diya', bisaya: 'sa', category: 'PARTICLE' },
  { english: 'to', manobo: 'tu', bisaya: 'sa', category: 'PARTICLE' },
  { english: 'and', manobo: 'duw', bisaya: 'ug', category: 'PARTICLE' },
  { english: 'we', manobo: 'ita', bisaya: 'kita', category: 'PRONOUN' },
  { english: 'you', manobo: 'ikow', bisaya: 'ikaw', category: 'PRONOUN' },
  { english: 'they', manobo: 'kandan', bisaya: 'sila', category: 'PRONOUN' },
  { english: 'he', manobo: 'kandin', bisaya: 'siya', category: 'PRONOUN' },
  { english: 'she', manobo: 'kandin', bisaya: 'siya', category: 'PRONOUN' },
  { english: 'my', manobo: 'kanak', bisaya: 'akong', category: 'PRONOUN' }
]
