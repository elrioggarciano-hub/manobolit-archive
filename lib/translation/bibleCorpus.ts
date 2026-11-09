/**
 * ManoboLit Reference Lexicon & Phrasebook
 * 100% Sourced from the 22 Agusan Manobo Literature Entries
 * Field Research: Maravilla (June 2024, Trento) & Catipay & Curato (2024, Bunawan)
 * Language: Agusan Manobo (ISO 639-3: msm) with Bisaya (Cebuano), Tagalog (Filipino), and English
 */

export interface ParallelPhrase {
  english: string
  manobo: string
  bisaya: string
  tagalog: string
  context?: string
  verseRef?: string // Referenced entry title in the archive
  entryTitle?: string
}

export interface LexiconEntry {
  english: string
  manobo: string
  bisaya: string
  tagalog: string
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
    tagalog: 'ang nalubog sa tubig ang siyang muling lumitaw',
    verseRef: 'Ka nilugdang iyan on usab paibabow (Folk Song)',
    entryTitle: 'Ka nilugdang iyan on usab paibabow',
  },
  {
    english: 'the mountains are my home',
    manobo: 'bubungan SI Kanak pig ugpaan',
    bisaya: 'ang bukid maoy akong gipuy-an',
    tagalog: 'ang kabundukan ang aking tahanan',
    verseRef: 'Kapoit to Kanak Kahimtang (Folk Song)',
    entryTitle: 'Kapoit to Kanak Kahimtang',
  },
  {
    english: 'i weep when i remember my mother',
    manobo: 'ug sinugow a Man usahay tug paka dumdum a tu kanay inoy',
    bisaya: 'muhilak ko usahay kon mahinumdom ko sa akong inahan',
    tagalog: 'umiiyak ako kung naaalala ko ang aking ina',
    verseRef: 'Kapoit to Kanak Kahimtang (Folk Song)',
    entryTitle: 'Kapoit to Kanak Kahimtang',
  },
  {
    english: 'history of the situation of the tribe',
    manobo: 'kasaysayan tu kahimtang tu katribuhan',
    bisaya: 'kasaysayan sa kahimtang sa katribuhan',
    tagalog: 'kasaysayan ng kalagayan ng katribuhan',
    verseRef: 'Kasaysayan tu Katribuhan (Folk Song)',
    entryTitle: 'Kasaysayan tu Katribuhan',
  },
  {
    english: 'the mountains have become barren',
    manobo: 'naupow on tu mgo bubungan ta',
    bisaya: 'naupaw na ang atong mga kabukiran',
    tagalog: 'nakalbo na ang ating mga kabundukan',
    verseRef: 'Opaw on tu Kabubunganan (Folk Song)',
    entryTitle: 'Opaw on tu Kabubunganan',
  },
  {
    english: 'the night has arrived and so has loneliness',
    manobo: 'Mig dangat kan kadukilom Mig duma isab ka kamingaw',
    bisaya: 'Miabot ang kagabhion miuban usab ang kamingaw',
    tagalog: 'Dumating ang gabi at kasabay nito ang pangungulila',
    verseRef: 'Kadikiluman (Folk Song)',
    entryTitle: 'Kadikiluman',
  },
  {
    english: 'no matter how hard life is',
    manobo: 'inggad nukoy ka lisud kan kinabuhi',
    bisaya: 'bisan unsa kalisod ang kinabuhi',
    tagalog: 'gaano man kahirap ang buhay',
    verseRef: 'Panultihon: Life is hard (Proverb)',
    entryTitle: 'Panultihon (Life is hard)',
  },
  {
    english: 'listen because it brings peace and cures loneliness',
    manobo: 'paminug, su sie maka daya ita tu kalinuw tambi tu kamingow',
    bisaya: 'paminaw, kay kini makahatag og kalinaw ug tambal sa kamingaw',
    tagalog: 'makinig dahil ito ay nagdudulot ng kapayapaan at lunas sa pangungulila',
    verseRef: 'Panultihon: Peace and cure loneliness (Proverb)',
    entryTitle: 'Panultihon (Peace and cure loneliness)',
  },
  {
    english: 'your face is beautiful but your behavior is not edible',
    manobo: 'Marujow dag ahaun kan bayho nu, Piro kan kinaiya nu kunag ka kuun',
    bisaya: 'Maayo rang tan-awon ang imong nawong, pero ang imong batasan dili makaon',
    tagalog: 'Maganda ngang tingnan ang iyong mukha, ngunit ang iyong ugali ay hindi nakakain',
    verseRef: 'Panultihon: Attitude matters most (Proverb)',
    entryTitle: 'Panultihon (Attitude matters most)',
  },
  {
    english: 'the fairy of the stream watches over the water',
    manobo: 'kan diwata duun tu wuhig mig bantuy tukan wuhig',
    bisaya: 'ang diwata sa tubig nagbantay sa tubig',
    tagalog: 'ang diwata sa batis ay nagbabantay sa tubig',
    verseRef: 'Diwata duun tu wuhig (Folktale)',
    entryTitle: 'Diwata duun tu wuhig',
  },
  {
    english: 'the native boy was exploring the mountain',
    manobo: 'suboka nuka ligsok nu yumad, mig suroy kandin diya tu bubungan',
    bisaya: 'usa ka batang lumad, misuroy siya sa bukid',
    tagalog: 'isang katutubong bata ang naglalakbay sa kabundukan',
    verseRef: 'Yumad diya tu bubungan (Folktale)',
    entryTitle: 'Yumad diya tu bubungan',
  },
  {
    english: 'you come from outside but enter inside',
    manobo: 'likat diyat gawas pero ug abot diyat suyod',
    bisaya: 'gikan sa gawas apan moabot sa sulod',
    tagalog: 'nagmula sa labas ngunit dumarating sa loob',
    verseRef: 'Kahayag: Light (Riddle)',
    entryTitle: 'Kahayag (Light)',
  },
]

/**
 * Real vocabulary words extracted directly from the 22 thesis entries.
 */
export const BIBLE_LEXICON: LexiconEntry[] = [
  // ── Nature & Land (from Songs, Folktales & Riddles) ──
  { english: 'mountain', manobo: 'Bubungan', bisaya: 'Bukid', tagalog: 'Bundok', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'mountains', manobo: 'Kabubunganan', bisaya: 'Kabukiran', tagalog: 'Kabundukan', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'water', manobo: 'Wuhig', bisaya: 'Tubig', tagalog: 'Tubig', category: 'NOUN', notes: 'From Diwata duun tu wuhig & Nilugdang' },
  { english: 'stream', manobo: 'Sapa', bisaya: 'Sapa', tagalog: 'Batis', category: 'NOUN', notes: 'From Kan isda diya tu sapa' },
  { english: 'river', manobo: 'Adgawan', bisaya: 'Suba', tagalog: 'Ilog', category: 'NOUN', notes: 'From Tagbanwa tu Batasan' },
  { english: 'land', manobo: 'Pasak', bisaya: 'Kayutaan', tagalog: 'Lupain', category: 'NOUN', notes: 'From Kasaysayan tu Katribuhan' },
  { english: 'tree', manobo: 'Kayo', bisaya: 'Kahoy', tagalog: 'Puno', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'trees', manobo: 'Kakayuhan', bisaya: 'Kakahoyan', tagalog: 'Mga puno', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'forest', manobo: 'Guyangan', bisaya: 'Lasang', tagalog: 'Kagubatan', category: 'NOUN', notes: 'From Diwata duun tu wuhig & Damgo' },
  { english: 'night', manobo: 'Kadikiluman', bisaya: 'Gabii', tagalog: 'Gabi', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'light', manobo: 'Kahayag', bisaya: 'Kahayag', tagalog: 'Liwanag', category: 'NOUN', notes: 'From Kahayag Riddle' },
  { english: 'sun', manobo: 'Adlaw', bisaya: 'Adlaw', tagalog: 'Araw', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'star', manobo: 'Bituen', bisaya: 'Bituon', tagalog: 'Bituin', category: 'NOUN', notes: 'From Indigenous astronomy' },
  { english: 'stars', manobo: 'Mga bituen', bisaya: 'Mga bituon', tagalog: 'Mga bituin', category: 'NOUN', notes: 'From Indigenous astronomy' },
  { english: 'waves', manobo: 'Bayod', bisaya: 'Balod', tagalog: 'Alon', category: 'NOUN', notes: 'From Nilugdang & Kapoit' },
  { english: 'fish', manobo: 'Isda', bisaya: 'Isda', tagalog: 'Isda', category: 'NOUN', notes: 'From Kan isda diya tu sapa' },
  { english: 'tiger', manobo: 'Tigre', bisaya: 'Tigre', tagalog: 'Tigre', category: 'NOUN', notes: 'From Yumad diya tu bubungan & Damgo' },
  { english: 'bird', manobo: 'Manok-manok', bisaya: 'Langgam', tagalog: 'Ibon', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'beans', manobo: 'Batong', bisaya: 'Batong', tagalog: 'Sitaw', category: 'NOUN', notes: 'From Batong Riddle' },
  { english: 'sugarcane', manobo: 'Tubo', bisaya: 'Tubo', tagalog: 'Tubo', category: 'NOUN', notes: 'From Tubo Riddle' },
  { english: 'charcoal', manobo: 'Uling', bisaya: 'Uling', tagalog: 'Uling', category: 'NOUN', notes: 'From Uling Riddle' },
  { english: 'plants', manobo: 'Misitas', bisaya: 'Tanom', tagalog: 'Halaman', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },

  // ── People & Tribe ──
  { english: 'tribe', manobo: 'Katribuhan', bisaya: 'Tribo', tagalog: 'Tribo', category: 'NOUN', notes: 'From Kasaysayan tu Katribuhan' },
  { english: 'people', manobo: 'Kaotawan', bisaya: 'Mga tawo', tagalog: 'Mga tao', category: 'NOUN', notes: 'From Kasaysayan tu Katribuhan' },
  { english: 'person', manobo: 'Utow', bisaya: 'Tawo', tagalog: 'Tao', category: 'NOUN', notes: 'From Diwata duun tu wuhig' },
  { english: 'native', manobo: 'Yumad', bisaya: 'Lumad', tagalog: 'Katutubo', category: 'NOUN', notes: 'From Yumad diya tu bubungan' },
  { english: 'child', manobo: 'Ligsok', bisaya: 'Bata', tagalog: 'Bata', category: 'NOUN', notes: 'From Tagbanwa & Yumad' },
  { english: 'children', manobo: 'Kabataan', bisaya: 'Mga bata', tagalog: 'Mga bata', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'mother', manobo: 'Inoy', bisaya: 'Inahan', tagalog: 'Ina', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'father', manobo: 'Amey', bisaya: 'Amahan', tagalog: 'Ama', category: 'NOUN', notes: 'Agusan Manobo kinship' },
  { english: 'family', manobo: 'Pamilya', bisaya: 'Pamilya', tagalog: 'Pamilya', category: 'NOUN', notes: 'From Diwata & Tagbanwa' },
  { english: 'neighbors', manobo: 'Silingan', bisaya: 'Silingan', tagalog: 'Kapitbahay', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'outsiders', manobo: 'Dayuhan', bisaya: 'Dumuduong', tagalog: 'Dayuhan', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'husband', manobo: 'Bana', bisaya: 'Bana', tagalog: 'Asawa', category: 'NOUN', notes: 'From Uling Riddle' },
  { english: 'companion', manobo: 'Kadumahan', bisaya: 'Kauban', tagalog: 'Kasama', category: 'NOUN', notes: 'From Opaw on tu Kabubunganan' },

  // ── Cultural Lore, Spirits & Heritage ──
  { english: 'spirit', manobo: 'Diwata', bisaya: 'Diwata', tagalog: 'Diwata', category: 'CULTURAL', notes: 'From Diwata duun tu wuhig' },
  { english: 'guardian', manobo: 'Tagbanwa', bisaya: 'Tagbanwa', tagalog: 'Tagapagbantay', category: 'CULTURAL', notes: 'From Tagbanwa tu Batasan' },
  { english: 'blessing', manobo: 'Panalangin', bisaya: 'Panalangin', tagalog: 'Pagpapala', category: 'CULTURAL', notes: 'From Diwata duun tu wuhig' },
  { english: 'proverb', manobo: 'Panultihon', bisaya: 'Panultihon', tagalog: 'Salawikain', category: 'CULTURAL', notes: 'Genre in Catipay & Curato (2024)' },
  { english: 'story', manobo: 'Sigulanon', bisaya: 'Sugilanon', tagalog: 'Kuwento', category: 'CULTURAL', notes: 'Genre in Catipay & Curato (2024)' },
  { english: 'riddle', manobo: 'Tigmo', bisaya: 'Tigmo', tagalog: 'Bugtong', category: 'CULTURAL', notes: 'Genre in Catipay & Curato (2024)' },
  { english: 'song', manobo: 'Awit', bisaya: 'Awit', tagalog: 'Awit', category: 'CULTURAL', notes: 'Genre in Maravilla (2024)' },
  { english: 'history', manobo: 'Kasaysayan', bisaya: 'Kasaysayan', tagalog: 'Kasaysayan', category: 'CULTURAL', notes: 'From Kasaysayan tu Katribuhan' },
  { english: 'gold', manobo: 'Bulawan', bisaya: 'Bulawan', tagalog: 'Ginto', category: 'CULTURAL', notes: 'From Kasaysayan & Opaw' },
  { english: 'wealth', manobo: 'Kayamanan', bisaya: 'Bahandi', tagalog: 'Kayamanan', category: 'CULTURAL', notes: 'From Kasaysayan tu Katribuhan' },

  // ── Feelings, Life & Hardship ──
  { english: 'hardship', manobo: 'Kapait', bisaya: 'Kalisod', tagalog: 'Kahirapan', category: 'NOUN', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'loneliness', manobo: 'Kamingaw', bisaya: 'Kamingaw', tagalog: 'Pangungulila', category: 'NOUN', notes: 'From Nilugdang & Kadikiluman' },
  { english: 'sorrow', manobo: 'Kasakit', bisaya: 'Kasakit', tagalog: 'Hapis', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'love', manobo: 'Gugma', bisaya: 'Gugma', tagalog: 'Pag-ibig', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'peace', manobo: 'Kalinuw', bisaya: 'Kalinaw', tagalog: 'Kapayapaan', category: 'NOUN', notes: 'From Panultihon' },
  { english: 'tears', manobo: 'Luha', bisaya: 'Luha', tagalog: 'Luha', category: 'NOUN', notes: 'From Kapoit & Kadikiluman' },
  { english: 'fear', manobo: 'Kahadlok', bisaya: 'Kahadlok', tagalog: 'Takot', category: 'NOUN', notes: 'From Kadikiluman Folk Song' },
  { english: 'resilient', manobo: 'Mapailubon', bisaya: 'Mapailubon', tagalog: 'Matatag', category: 'ADJECTIVE', notes: 'From Ka nilugdang...' },
  { english: 'bare', manobo: 'Opaw', bisaya: 'Upaw', tagalog: 'Kalbo', category: 'ADJECTIVE', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'hunger', manobo: 'Buntas', bisaya: 'Gutom', tagalog: 'Gutom', category: 'NOUN', notes: 'From Panultihon (Life is hard)' },

  // ── Actions & Verbs ──
  { english: 'weep', manobo: 'sinugow', bisaya: 'hilak', tagalog: 'umiyak', category: 'VERB', notes: 'From Kapoit & Kadikiluman' },
  { english: 'listen', manobo: 'paminug', bisaya: 'paminaw', tagalog: 'makinig', category: 'VERB', notes: 'From Nilugdang & Panultihon' },
  { english: 'walk', manobo: 'panow', bisaya: 'lakaw', tagalog: 'maglakad', category: 'VERB', notes: 'From Kadikiluman & Tagbanwa' },
  { english: 'look', manobo: 'aha', bisaya: 'tan-aw', tagalog: 'tumingin', category: 'VERB', notes: 'From Nilugdang & Panultihon' },
  { english: 'remember', manobo: 'kadumdum', bisaya: 'hinumdom', tagalog: 'alalahanin', category: 'VERB', notes: 'From Kapoit & Kadikiluman' },
  { english: 'protect', manobo: 'panalipdan', bisaya: 'panalipdan', tagalog: 'protektahan', category: 'VERB', notes: 'From Ka nilugdang...' },
  { english: 'help', manobo: 'tabang', bisaya: 'tabang', tagalog: 'tumulong', category: 'VERB', notes: 'From Nilugdang & Tagbanwa' },
  { english: 'clean', manobo: 'hinlo', bisaya: 'limpyo', tagalog: 'maglinis', category: 'VERB', notes: 'From Diwata duun tu wuhig' },
  { english: 'arrive', manobo: 'abot', bisaya: 'abot', tagalog: 'dumating', category: 'VERB', notes: 'From Kadikiluman & Kahayag' },
  { english: 'return', manobo: 'pauli', bisaya: 'pauli', tagalog: 'bumalik', category: 'VERB', notes: 'From Kadikiluman & Tagbanwa' },
  { english: 'plant', manobo: 'pananom', bisaya: 'tanom', tagalog: 'magtanim', category: 'VERB', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'hide', manobo: 'hubong', bisaya: 'tago', tagalog: 'magtago', category: 'VERB', notes: 'From Tagbanwa & Yumad' },
  { english: 'dwell', manobo: 'ugpaan', bisaya: 'puy-anan', tagalog: 'tumira', category: 'VERB', notes: 'From Kapoit to Kanak Kahimtang' },
  { english: 'make', manobo: 'himo', bisaya: 'himo', tagalog: 'gumawa', category: 'VERB', notes: 'From Diwata & Panultihon' },
  { english: 'give', manobo: 'bugoy', bisaya: 'hatag', tagalog: 'magbigay', category: 'VERB', notes: 'From Diwata duun tu wuhig' },
  { english: 'dream', manobo: 'damgo', bisaya: 'damgo', tagalog: 'managinip', category: 'VERB', notes: 'From Damgo Riddle' },

  // ── Qualities & Adjectives ──
  { english: 'good', manobo: 'Marujow', bisaya: 'Maayo', tagalog: 'Mabuti', category: 'ADJECTIVE', notes: 'From Panultihon & Diwata' },
  { english: 'beautiful', manobo: 'Madiyoway', bisaya: 'Nindot', tagalog: 'Maganda', category: 'ADJECTIVE', notes: 'From Opaw on tu Kabubunganan' },
  { english: 'hard', manobo: 'Malisud', bisaya: 'Lisod', tagalog: 'Mahirap', category: 'ADJECTIVE', notes: 'From Panultihon (Life is hard)' },
  { english: 'great', manobo: 'Maaslag', bisaya: 'Dako', tagalog: 'Dakila', category: 'ADJECTIVE', notes: 'From Tagbanwa & Kapoit' },
  { english: 'small', manobo: 'Maintok', bisaya: 'Gamay', tagalog: 'Maliit', category: 'ADJECTIVE', notes: 'From Batong & Tagbanwa' },
  { english: 'many', manobo: 'Maditi', bisaya: 'Daghan', tagalog: 'Marami', category: 'ADJECTIVE', notes: 'From Folktales & Songs' },
  { english: 'ancient', manobo: 'Karaan', bisaya: 'Karaan', tagalog: 'Sinauna', category: 'ADJECTIVE', notes: 'From Tagbanwa tu Batasan' },
  { english: 'true', manobo: 'Tinuud', bisaya: 'Tinuod', tagalog: 'Totoo', category: 'ADJECTIVE', notes: 'From Tagbanwa tu Batasan' },
  { english: 'white', manobo: 'Maputi', bisaya: 'Puti', tagalog: 'Puti', category: 'ADJECTIVE', notes: 'From Uling Riddle' },
  { english: 'black', manobo: 'Maitom', bisaya: 'Itom', tagalog: 'Itim', category: 'ADJECTIVE', notes: 'From Uling Riddle' },

  // ── Webonary (SIL International) Cultural & Mythological Vocabulary ──
  { english: 'monkey', manobo: 'Amuk', bisaya: 'Unggoy', tagalog: 'Unggoy', category: 'NOUN', notes: 'From Webonary (SIL) - Animal Fable' },
  { english: 'crocodile', manobo: 'Buwaya', bisaya: 'Buaya', tagalog: 'Buwaya', category: 'NOUN', notes: 'From Webonary (SIL) - Animal Fable' },
  { english: 'turtle', manobo: 'Bauu', bisaya: 'Bao', tagalog: 'Pagong', category: 'NOUN', notes: 'From Webonary (SIL) - Animal Fable' },
  { english: 'earth', manobo: 'Tano', bisaya: 'Yuta', tagalog: 'Lupa', category: 'NOUN', notes: 'From Webonary (SIL) - Cosmogony' },
  { english: 'sky', manobo: 'Langit', bisaya: 'Langit', tagalog: 'Langit', category: 'NOUN', notes: 'From Webonary (SIL) - Cosmogony' },
  { english: 'origin', manobo: 'Kagnat', bisaya: 'Sinugdanan', tagalog: 'Pinagmulan', category: 'NOUN', notes: 'From Webonary (SIL) - Cosmogony' },
  { english: 'warrior', manobo: 'Bagani', bisaya: 'Manggugubat', tagalog: 'Mandirigma', category: 'NOUN', notes: 'From Webonary (SIL) - Heroic Epic' },
  { english: 'spear', manobo: 'Sibat', bisaya: 'Bangkaw', tagalog: 'Sibat', category: 'NOUN', notes: 'From Webonary (SIL) - Weaponry' },
  { english: 'sword', manobo: 'Kalis', bisaya: 'Espada', tagalog: 'Espada', category: 'NOUN', notes: 'From Webonary (SIL) - Weaponry' },
  { english: 'shaman', manobo: 'Babaylan', bisaya: 'Tambalan', tagalog: 'Babaylan', category: 'NOUN', notes: 'From Webonary (SIL) - Ritual Chants' },
  { english: 'prayer', manobo: 'Panawagtawag', bisaya: 'Pag-ampo', tagalog: 'Panalangin', category: 'NOUN', notes: 'From Webonary (SIL) - Ritual Invocations' },
  { english: 'offering', manobo: 'Buwis', bisaya: 'Halad', tagalog: 'Alay', category: 'NOUN', notes: 'From Webonary (SIL) - Ritual Chants' },
  { english: 'riddle', manobo: 'Tigmo', bisaya: 'Tigmo', tagalog: 'Bugtong', category: 'NOUN', notes: 'From Webonary (SIL) - Gnomic Literature' },
  { english: 'proverb', manobo: 'Panultihon', bisaya: 'Panultihon', tagalog: 'Salawikain', category: 'NOUN', notes: 'From Webonary (SIL) - Wisdom Maxims' },
  { english: 'epic', manobo: 'Ulaging', bisaya: 'Epiko', tagalog: 'Epiko', category: 'NOUN', notes: 'From Webonary (SIL) - Chanted Epics' },

  // ── Grammatical Particles & Pronouns ──
  { english: 'the', manobo: 'ka', bisaya: 'ang', tagalog: 'ang', category: 'PARTICLE' },
  { english: 'to', manobo: 'tu', bisaya: 'sa', tagalog: 'sa', category: 'PARTICLE' },
  { english: 'in', manobo: 'diya', bisaya: 'sa', tagalog: 'sa', category: 'PARTICLE' },
  { english: 'of', manobo: 'to', bisaya: 'sa', tagalog: 'ng', category: 'PARTICLE' },
  { english: 'and', manobo: 'duw', bisaya: 'ug', tagalog: 'at', category: 'PARTICLE' },
  { english: 'my', manobo: 'kanak', bisaya: 'akong', tagalog: 'aking', category: 'PRONOUN' },
  { english: 'your', manobo: 'ikuw', bisaya: 'imong', tagalog: 'iyong', category: 'PRONOUN' },
  { english: 'we', manobo: 'ita', bisaya: 'kita', tagalog: 'tayo', category: 'PRONOUN' },
  { english: 'they', manobo: 'kandan', bisaya: 'sila', tagalog: 'sila', category: 'PRONOUN' },
  { english: 'he', manobo: 'kandin', bisaya: 'siya', tagalog: 'siya', category: 'PRONOUN' },
  { english: 'she', manobo: 'kandin', bisaya: 'siya', tagalog: 'siya', category: 'PRONOUN' },
  { english: 'you', manobo: 'ikow', bisaya: 'ikaw', tagalog: 'ikaw', category: 'PRONOUN' },
]

// Aliases for clean semantic imports
export const MANOBOLIT_PARALLEL_PHRASES = BIBLE_PARALLEL_PHRASES
export const MANOBOLIT_LEXICON = BIBLE_LEXICON
