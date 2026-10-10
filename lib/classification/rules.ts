// Rule-Based Classification Rules
// Genre: Eugenio (1993) | Theme: Andress (1985)

export interface ClassificationRule {
  id: string
  name: string
  type: 'GENRE' | 'THEME' | 'LOCATION'
  framework: 'EUGENIO_1993' | 'ANDRESS_1985' | 'PROVENANCE'
  value: string
  keywords: string[]
  phrases: string[]
  contextClues: string[]
  baseConfidence: number
}

export const genreRules: ClassificationRule[] = [
  {
    id: 'G001',
    name: 'Myth Detection',
    type: 'GENRE',
    framework: 'EUGENIO_1993',
    value: 'MYTH',
    keywords: [
      'creation', 'origin', 'beginning', 'first', 'god', 'gods', 'deity', 'deities',
      'universe', 'world', 'sky', 'earth', 'primordial', 'chaos', 'divine', 'spirit',
      'supernatural', 'formed', 'made the world', 'great spirit', 'creator',
      'myth', 'stars', 'birth', 'breath', 'darkness', 'ancient times', 'father sky',
      'origin myth', 'celestial', 'shaman', 'ancestral', 'cosmos'
    ],
    phrases: [
      'in the beginning', 'when the world was', 'the first people', 'long before time',
      'before humans existed', 'the great spirit', 'at the dawn of', 'how the world came to be',
      'origin of', 'the beginning of all things', 'born from the breath', 'give birth to',
      'father sky', 'sky father', 'ancient times'
    ],
    contextClues: [
      'cosmic', 'cosmological', 'creation narrative', 'genesis', 'primordial beings',
      'explains natural phenomena', 'first man', 'first woman', 'origin myth'
    ],
    baseConfidence: 0.85,
  },
  {
    id: 'G002',
    name: 'Legend Detection',
    type: 'GENRE',
    framework: 'EUGENIO_1993',
    value: 'LEGEND',
    keywords: [
      'hero', 'supernatural', 'mountain', 'lake', 'river', 'historical', 'ancient',
      'landmark', 'sacred', 'place', 'origin of place', 'guardian', 'spirit', 'blessed'
    ],
    phrases: [
      'it is said that', 'according to legend', 'the story goes', 'they say that',
      'long ago there was', 'it is believed', 'legend has it', 'the legend of',
      'it came to be known', 'to this day'
    ],
    contextClues: [
      'historical event', 'place name origin', 'natural feature explanation',
      'semi-historical', 'local belief', 'community memory'
    ],
    baseConfidence: 0.80,
  },
  {
    id: 'G003',
    name: 'Folktale Detection',
    type: 'GENRE',
    framework: 'EUGENIO_1993',
    value: 'FOLKTALE',
    keywords: [
      'animal', 'trickster', 'moral', 'lesson', 'clever', 'foolish', 'monkey', 'crocodile',
      'bird', 'fish', 'deer', 'turtle', 'rabbit', 'outwit', 'trick', 'deceive', 'cunning',
      'fairy', 'diwata', 'goddess', 'river goddess', 'native', 'tiger', 'horse',
      'folktale', 'stream', 'enchanted', 'magical', 'creature', 'spirit creature'
    ],
    phrases: [
      'once upon a time', 'long ago in a village', 'there lived a', 'in a faraway place',
      'and so it is said', 'let this be a lesson', 'the moral of this story',
      'and they lived', 'a long time ago', 'one day', 'in a village'
    ],
    contextClues: [
      'entertainment', 'moral lesson', 'talking animals', 'human-like animals',
      'trickster character', 'wisdom tale', 'fable'
    ],
    baseConfidence: 0.80,
  },
  {
    id: 'G004',
    name: 'Epic Detection',
    type: 'GENRE',
    framework: 'EUGENIO_1993',
    value: 'EPIC',
    keywords: [
      'warrior', 'battle', 'journey', 'quest', 'conquest', 'hero', 'brave', 'courageous',
      'sword', 'spear', 'enemy', 'victory', 'defeat', 'kingdom', 'tribe', 'champion',
      'invader', 'protect', 'defender', 'mighty', 'chieftain', 'fight', 'defend',
      'warrior tribe', 'epic', 'ulaging'
    ],
    phrases: [
      'the great warrior', 'embarked on a journey', 'set out to battle',
      'fought valiantly', 'to protect his people', 'faced many dangers',
      'his deeds are remembered', 'across many lands'
    ],
    contextClues: [
      'heroic narrative', 'cultural values', 'long narrative poem',
      'battle sequence', 'quest structure', 'tribal warfare', 'heroic deeds'
    ],
    baseConfidence: 0.82,
  },
  {
    id: 'G005',
    name: 'Riddle Detection',
    type: 'GENRE',
    framework: 'EUGENIO_1993',
    value: 'RIDDLE',
    keywords: [
      'riddle', 'what am i', 'guess', 'puzzle', 'answer', 'question', 'solve',
      'mystery', 'brain teaser', 'what is it'
    ],
    phrases: [
      'what has', 'i have no', 'i am always', 'you can see me but',
      'what goes up and never', 'what walks on'
    ],
    contextClues: ['puzzle form', 'question and answer', 'wordplay'],
    baseConfidence: 0.90,
  },
  {
    id: 'G006',
    name: 'Proverb Detection',
    type: 'GENRE',
    framework: 'EUGENIO_1993',
    value: 'PROVERB',
    keywords: [
      'proverb', 'saying', 'adage', 'wisdom', 'old saying', 'they say', 'it is wise',
      'one must', 'never', 'always remember', 'the wise say',
      'panultihon', 'integrity', 'temptation', 'trust', 'virtue', 'principled',
      'moral', 'lesson', 'inner beauty', 'character', 'behavior', 'attitude',
      'happiness', 'principled living', 'self-respect'
    ],
    phrases: [
      'as the elders say', 'it is said by the wise', 'remember always',
      'as the saying goes', 'a man who', 'no matter how hard', 'it is better to',
      'it is said', 'it emphasizes', 'this proverb'
    ],
    contextClues: ['short wisdom statement', 'moral instruction', 'traditional saying'],
    baseConfidence: 0.88,
  },
  {
    id: 'G007',
    name: 'Song Detection',
    type: 'GENRE',
    framework: 'EUGENIO_1993',
    value: 'SONG',
    keywords: [
      'sing', 'song', 'melody', 'rhythm', 'chorus', 'verse', 'dance', 'music',
      'chant', 'tune', 'lyric', 'refrain', 'we sing', 'let us sing',
      'folk song', 'manobo folk song', 'tribe', 'tribal', 'longing', 'sorrow',
      'loneliness', 'lament', 'voice', 'heart', 'tears', 'weep',
      'kadikiluman', 'panaw', 'sinugow', 'kapait'
    ],
    phrases: [
      'we sing together', 'sing this song', 'let our voices', 'with song and dance',
      'as we plant', 'as we work', 'come dance with me', 'our hearts sing',
      'the song captures', 'the song conveys', 'the song portrays', 'the song talks',
      'the night has come', 'i weep when', 'tears are falling'
    ],
    contextClues: ['lyrical structure', 'repetitive lines', 'musical context', 'communal singing'],
    baseConfidence: 0.85,
  },
  {
    id: 'G008',
    name: 'Chant Detection',
    type: 'GENRE',
    framework: 'EUGENIO_1993',
    value: 'CHANT',
    keywords: [
      'chant', 'ritual', 'ceremony', 'invoke', 'call upon', 'ancestors', 'spirits',
      'sacred words', 'incantation', 'prayer', 'blessing', 'invocation'
    ],
    phrases: [
      'we call upon', 'hear our voices', 'come to us', 'bless this place',
      'ancient words', 'sacred chant', 'ritual words'
    ],
    contextClues: ['ceremonial context', 'repetitive ritual phrases', 'spiritual invocation'],
    baseConfidence: 0.83,
  },
]

export const themeRules: ClassificationRule[] = [
  {
    id: 'T001',
    name: 'Creation Myths Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'CREATION_MYTHS',
    keywords: [
      'creation', 'created', 'formed', 'made', 'birth', 'emerged', 'origin', 'first',
      'world', 'universe', 'earth', 'sky', 'humans', 'beginning', 'genesis'
    ],
    phrases: ['in the beginning', 'how it came to be', 'origin of', 'created the world'],
    contextClues: ['cosmological', 'origin story', 'how things began'],
    baseConfidence: 0.85,
  },
  {
    id: 'T002',
    name: 'Heroic Deeds Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'HEROIC_DEEDS',
    keywords: [
      'brave', 'courageous', 'defeated', 'conquered', 'victory', 'hero', 'warrior',
      'protect', 'defend', 'sacrifice', 'strength', 'power', 'triumph', 'overcome'
    ],
    phrases: ['acts of bravery', 'fought for his people', 'overcame great obstacles'],
    contextClues: ['heroism', 'bravery narrative', 'overcoming adversity'],
    baseConfidence: 0.82,
  },
  {
    id: 'T003',
    name: 'Courtship and Marriage Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'COURTSHIP_AND_MARRIAGE',
    keywords: [
      'love', 'marry', 'wedding', 'courtship', 'betrothal', 'beloved', 'heart',
      'dance', 'woo', 'suitor', 'maiden', 'bride', 'romance', 'affection',
      'marriage', 'groom', 'celebrate', 'ceremony',
      'longing', 'departure', 'love story', 'farewell', 'remember',
      'leave', 'miss', 'away', 'wait', 'return', 'together'
    ],
    phrases: ['come dance with me', 'my love for you', 'will you marry me', 'courtship dance'],
    contextClues: ['romantic narrative', 'marriage customs', 'love story'],
    baseConfidence: 0.85,
  },
  {
    id: 'T004',
    name: 'Agricultural Cycles Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'AGRICULTURAL_CYCLES',
    keywords: [
      'harvest', 'planting', 'rice', 'crops', 'farming', 'field', 'seed', 'soil',
      'season', 'rain', 'grow', 'bountiful', 'fertile', 'cultivate', 'humay'
    ],
    phrases: ['rice planting', 'harvest season', 'bless our fields', 'as we plant'],
    contextClues: ['agricultural ritual', 'farming practices', 'seasonal cycle'],
    baseConfidence: 0.88,
  },
  {
    id: 'T005',
    name: 'Hunting and Fishing Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'HUNTING_AND_FISHING',
    keywords: [
      'hunt', 'fish', 'catch', 'trap', 'forest', 'river', 'prey', 'arrow', 'spear',
      'net', 'fisherman', 'hunter', 'wildlife', 'game', 'jungle'
    ],
    phrases: ['went hunting', 'set a trap', 'fishing in the river', 'into the forest'],
    contextClues: ['subsistence activities', 'traditional occupations', 'foraging'],
    baseConfidence: 0.87,
  },
  {
    id: 'T006',
    name: 'Death and Afterlife Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'DEATH_AND_AFTERLIFE',
    keywords: [
      'death', 'died', 'afterlife', 'spirit world', 'soul', 'departed', 'mourning',
      'burial', 'ancestor', 'memory', 'ghost', 'underworld', 'paradise', 'passed away',
      'hardship', 'suffering', 'sorrow', 'loneliness', 'grief', 'loss', 'pain',
      'despair', 'farewell', 'weep', 'cry', 'tears', 'darkness', 'night'
    ],
    phrases: ['when she died', 'to honor her memory', 'in the spirit world', 'after death'],
    contextClues: ['death ritual', 'afterlife belief', 'ancestral veneration'],
    baseConfidence: 0.87,
  },
  {
    id: 'T007',
    name: 'Spirit World Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'SPIRIT_WORLD',
    keywords: [
      'spirit', 'spirits', 'supernatural', 'deity', 'god', 'divine', 'sacred',
      'blessed', 'curse', 'enchanted', 'magical', 'mystical', 'invisible', 'apparition',
      'diwata', 'shaman', 'healer', 'ritual healing', 'invocation', 'ancestral spirits',
      'nature spirit', 'fairy', 'engkanto', 'animism'
    ],
    phrases: ['the spirits blessed', 'guarded by spirits', 'spirit world', 'with spirit help'],
    contextClues: ['animism', 'spirit belief', 'supernatural intervention'],
    baseConfidence: 0.83,
  },
  {
    id: 'T008',
    name: 'Nature and Environment Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'NATURE_AND_ENVIRONMENT',
    keywords: [
      'river', 'mountain', 'forest', 'lake', 'tree', 'animal', 'nature', 'environment',
      'sky', 'rain', 'sun', 'moon', 'wind', 'earth', 'water', 'flower', 'land',
      'stream', 'waves', 'mountains', 'barren', 'deforestation', 'fish', 'birds',
      'bubungan', 'sapa', 'guyangan', 'kayamanan'
    ],
    phrases: ['by the river', 'in the forest', 'under the moonlight', 'flows to the sea'],
    contextClues: ['natural setting', 'environment description', 'nature personification'],
    baseConfidence: 0.75,
  },
  {
    id: 'T009',
    name: 'Social Customs Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'SOCIAL_CUSTOMS',
    keywords: [
      'tradition', 'custom', 'ritual', 'ceremony', 'festival', 'celebration', 'community',
      'village', 'tribe', 'gathering', 'practice', 'culture', 'elders', 'council',
      'tribal', 'indigenous', 'manobo', 'neighbor', 'barangay', 'municipality',
      'government', 'people', 'indoctrination', 'colonialism', 'recognition', 'identity'
    ],
    phrases: ['community tradition', 'as is the custom', 'village gathering', 'tribal practice'],
    contextClues: ['social practice', 'cultural norm', 'community ritual'],
    baseConfidence: 0.78,
  },
  {
    id: 'T010',
    name: 'Moral Lessons Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'MORAL_LESSONS',
    keywords: [
      'lesson', 'moral', 'wisdom', 'learn', 'taught', 'foolish', 'wise', 'greed',
      'kindness', 'honesty', 'truth', 'justice', 'right', 'wrong', 'virtue',
      'integrity', 'temptation', 'principled', 'trust', 'character', 'inner beauty',
      'behavior', 'happiness', 'attitude', 'emphasizes', 'highlights', 'conveys',
      'self-respect', 'boundaries', 'personal growth', 'disappointment'
    ],
    phrases: ['the lesson here', 'let this be a lesson', 'it teaches us', 'the moral is'],
    contextClues: ['didactic purpose', 'wisdom teaching', 'ethical instruction'],
    baseConfidence: 0.82,
  },
  {
    id: 'T011',
    name: 'Historical Events Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'HISTORICAL_EVENTS',
    keywords: [
      'battle', 'war', 'invasion', 'invader', 'enemy', 'conquest', 'historical',
      'ancient', 'past', 'ancestors', 'remembered', 'recorded', 'era', 'generation',
      'spaniards', 'colonialism', 'exploitation', 'foreigners', 'century', 'history',
      'tribe history', 'land', 'lost land', 'displacement', 'mountain', 'resources',
      'kasaysayan', 'katribuhan'
    ],
    phrases: ['it is remembered', 'in the old days', 'during the time of', 'generations ago'],
    contextClues: ['historical reference', 'communal memory', 'past events'],
    baseConfidence: 0.80,
  },
  {
    id: 'T012',
    name: 'Supernatural Beings Theme',
    type: 'THEME',
    framework: 'ANDRESS_1985',
    value: 'SUPERNATURAL_BEINGS',
    keywords: [
      'creature', 'monster', 'giant', 'fairy', 'nymph', 'diwata', 'engkanto', 'aswang',
      'kapre', 'tikbalang', 'supernatural being', 'mythical creature', 'spirit creature',
      'tagbanwa', 'river fairy', 'stream fairy', 'enchanted', 'mystical being'
    ],
    phrases: ['mythical creature', 'supernatural being', 'spirit creature', 'magical being'],
    contextClues: ['mythical being', 'folklore creature', 'supernatural entity'],
    baseConfidence: 0.88,
  },
]

export const locationRules: ClassificationRule[] = [
  {
    id: 'L001',
    name: 'Trento Detection',
    type: 'LOCATION',
    framework: 'PROVENANCE',
    value: 'TRENTO',
    keywords: ['trento', 'tudela'],
    phrases: ['in trento', 'near trento', 'municipality of trento', 'barangay of tudela', 'brgy. tudela'],
    contextClues: ['agusan del sur', 'communityLocation', 'provincial'],
    baseConfidence: 0.90,
  },
  {
    id: 'L002',
    name: 'Sta. Maria Detection',
    type: 'LOCATION',
    framework: 'PROVENANCE',
    value: 'STA_MARIA',
    keywords: ['maria', 'santa maria', 'sta maria'],
    phrases: ['in sta maria', 'in sta. maria', 'in santa maria', 'brgy. sta maria'],
    contextClues: ['agusan del sur', 'communityLocation'],
    baseConfidence: 0.90,
  },
  {
    id: 'L003',
    name: 'Sitio Dam Detection',
    type: 'LOCATION',
    framework: 'PROVENANCE',
    value: 'SITIO_DAM',
    keywords: ['dam', 'sitio dam'],
    phrases: ['in sitio dam', 'near the dam', 'sitio dam, brgy. tudela'],
    contextClues: ['tudela', 'trento'],
    baseConfidence: 0.95,
  },
  {
    id: 'L004',
    name: 'Mt. Magdiwata Detection',
    type: 'LOCATION',
    framework: 'PROVENANCE',
    value: 'MT_MAGDIWATA',
    keywords: ['magdiwata', 'mountain'],
    phrases: ['mt magdiwata', 'mt. magdiwata', 'sacred mountain', 'mountain of magdiwata'],
    contextClues: ['trento', 'agusan del sur'],
    baseConfidence: 0.92,
  },
]
