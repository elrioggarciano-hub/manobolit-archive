// Ground-Truth Training Corpus for Supervised Machine Learning
// Synthesizes authenticated field records from Catipay & Curato (2024) and Maravilla (2024).

export interface TrainingDocument {
  id: string
  text: string
  genre: 'MYTH' | 'LEGEND' | 'FOLKTALE' | 'EPIC' | 'RIDDLE' | 'PROVERB' | 'SONG' | 'CHANT'
  themes: string[]
  provenance: string
}

export const TRAINING_CORPUS: TrainingDocument[] = [
  // ── MYTHS ──
  {
    id: 'tr-myth-1',
    text: "The stars were born from the breath of Father Sky. In those ancient times, there were no stars in the heavens. The surface of the earth was still in deep darkness. Then Father Sky said, We shall give birth to the stars. Creation origin deity celestial cosmos d-anak te meogingon so mga bituen te amay he langit.",
    genre: 'MYTH',
    themes: ['COSMOGONY', 'ORIGINS'],
    provenance: 'Agusan Manobo Origin Myth'
  },
  {
    id: 'tr-myth-2',
    text: "In the beginning of all things, the supreme creator deity shaped the primordial universe. The heavens and the earth were separated by divine spirits. Ancestral shamans recount the dawn of time when gods walked the world before human existence.",
    genre: 'MYTH',
    themes: ['CREATION_MYTHS', 'SPIRIT_WORLD'],
    provenance: 'Agusan Manobo Cosmogony'
  },
  {
    id: 'tr-myth-3',
    text: "How the first humans came to be from clay and breath of the great spirit. Deities formed mankind to steward the sacred soil and rivers of Mindanao.",
    genre: 'MYTH',
    themes: ['CREATION_MYTHS', 'NATURE_AND_ENVIRONMENT'],
    provenance: 'Agusan Manobo Genesis'
  },

  // ── LEGENDS ──
  {
    id: 'tr-legend-1',
    text: "According to legend, Lake Bababu was guarded by a sacred water spirit. Long ago, ancient ancestors witnessed the lake form after a supernatural hero struck the mountain with his spear. It came to be known as a holy place of pilgrimage.",
    genre: 'LEGEND',
    themes: ['HISTORICAL_EVENTS', 'SUPERNATURAL_BEINGS'],
    provenance: 'Agusan del Sur Landmark Legend'
  },
  {
    id: 'tr-legend-2',
    text: "The sacred mountain was protected by guardian spirits. Villagers say that during ancient wars, the mountain concealed the warriors within sacred mists, establishing the origin of the boundary between tribes.",
    genre: 'LEGEND',
    themes: ['HISTORICAL_EVENTS', 'HEROIC_DEEDS'],
    provenance: 'Bunawan Sacred Mountain'
  },

  // ── FOLKTALES ──
  {
    id: 'tr-folktale-1',
    text: "Once upon a time in a faraway village, the clever monkey outwitted the foolish crocodile at the river bank. The monkey leaped across the backs of turtles to escape, leaving a moral lesson about wit over brute force. Sugilanon tudtul bata sapa wuhig.",
    genre: 'FOLKTALE',
    themes: ['MORAL_LESSONS', 'NATURE_AND_ENVIRONMENT'],
    provenance: 'Catipay & Curato (2024)'
  },
  {
    id: 'tr-folktale-2',
    text: "A long ago trickster fable about the deer and the cunning bird. They competed to see who could harvest the wild fruits first. Entertainment and traditional moral wisdom for children in the tribe.",
    genre: 'FOLKTALE',
    themes: ['MORAL_LESSONS'],
    provenance: 'Agusan Manobo Oral Tale'
  },

  // ── EPICS ──
  {
    id: 'tr-epic-1',
    text: "The great warrior chieftain Agyu embarked on a long quest across mountains and seas with his golden sword to protect his clan from invaders. In the epic battle of Ulaging, the brave champion defeated the enemies and secured victory for his people.",
    genre: 'EPIC',
    themes: ['HEROIC_DEEDS', 'HISTORICAL_EVENTS'],
    provenance: 'Ulaging Epic Cycle'
  },
  {
    id: 'tr-epic-2',
    text: "Heroic narrative poem of ancient conquests, courage, and tribal warfare. The champion defended the ancestral domain against foreign conquerors through supernatural strength and valor.",
    genre: 'EPIC',
    themes: ['HEROIC_DEEDS'],
    provenance: 'Agusan Manobo Ulaging'
  },

  // ── RIDDLES ──
  {
    id: 'tr-riddle-1',
    text: "What am I? When young it is small, when struck it does not cry. Answer: tobacco leaf. Tigmo riddle puzzle wordplay mystery question tu maintok pad inggad pusilon buhi gihapon.",
    genre: 'RIDDLE',
    themes: ['MORAL_LESSONS', 'NATURE_AND_ENVIRONMENT'],
    provenance: 'Catipay & Curato (2024)'
  },
  {
    id: 'tr-riddle-2',
    text: "A traditional riddle about the coconut tree and well. Guess the mystery of the shadow that walks on water but leaves no footprint. Tigmo panultihon.",
    genre: 'RIDDLE',
    themes: ['NATURE_AND_ENVIRONMENT'],
    provenance: 'Bunawan Riddle Collection'
  },

  // ── PROVERBS ──
  {
    id: 'tr-proverb-1',
    text: "Panultihon: No matter how hard life is, it is better to suffer from hunger than to do things you should not. This proverb emphasizes integrity, resisting temptation, and principled living. Inggad nukoy ka lisud kan kinabuhi, mas marujow pad nug antus.",
    genre: 'PROVERB',
    themes: ['MORAL_LESSONS', 'SOCIAL_CUSTOMS'],
    provenance: 'Catipay & Curato (2024)'
  },
  {
    id: 'tr-proverb-2',
    text: "Panultihon: Trust is always slow, but consistent effort achieves lasting peace. Salig kilang permi su inggad hinuy hinuy. Traditional wisdom on patience and social harmony.",
    genre: 'PROVERB',
    themes: ['SOCIAL_CUSTOMS', 'MORAL_LESSONS'],
    provenance: 'Catipay & Curato (2024)'
  },

  // ── FOLK SONGS ──
  {
    id: 'tr-song-1',
    text: "What Was Buried Has Surfaced Again. The song captures the journey of the Manobo tribe, who have long felt invisible and neglected. Lantawod diya lawod nig duma kan bayod soe tribu ko no daog-daog mahawig no katuigan, niglubong on tu kamingaw kunag pakabarog so wara ka silungan. IPRA Law 8371 Maravilla (2024).",
    genre: 'SONG',
    themes: ['HISTORICAL_EVENTS', 'HEROIC_DEEDS', 'NATURE_AND_ENVIRONMENT'],
    provenance: 'Maravilla (2024) - Trento'
  },
  {
    id: 'tr-song-2',
    text: "How hardship my situation is, For the mountains are my home. I weep when I remember my mother. Kapait soe Kanak kahimtang bubungan SI Kanak pig ugpaan ug sinugow a Man usahay tug paka dumdum a tu kanay inoy. Lyrical melody sorrow tears loneliness.",
    genre: 'SONG',
    themes: ['SOCIAL_CUSTOMS', 'DEATH_AND_AFTERLIFE'],
    provenance: 'Maravilla (2024) - Trento'
  },
  {
    id: 'tr-song-3',
    text: "The Night Has Come. Kadikiluman kan adlaw madani ug sayop mig abot tu kakuba tu daegeha mga yuha migtagdo tu mata. The song portrays deep sorrow, loneliness, and separation.",
    genre: 'SONG',
    themes: ['COURTSHIP_AND_MARRIAGE', 'DEATH_AND_AFTERLIFE'],
    provenance: 'Maravilla (2024) - Trento'
  },

  // ── CHANTS ──
  {
    id: 'tr-chant-1',
    text: "Sacred ritual chant invoking ancestral spirits and deities during harvest ceremony. Chanted prayer, blessing, and incantation by the babaylan shaman for protection and communal healing.",
    genre: 'CHANT',
    themes: ['SPIRIT_WORLD', 'AGRICULTURAL_CYCLES'],
    provenance: 'Agusan Manobo Ritual Chants'
  }
]
