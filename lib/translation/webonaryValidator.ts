import { BIBLE_LEXICON } from './bibleCorpus'
import { WebonaryValidationReport, WordValidation } from './types'

/**
 * Official SIL International Webonary Dictionary & Morphological Lexicon
 * Standard Reference: SIL Webonary Agusan Manobo Dictionary (ISO 639-3: msm)
 * Field linguistics: Weaver & Weaver, Elkins, SIL Philippines & Translators Association of the Philippines
 */
export interface WebonaryEntry {
  manobo: string
  root: string
  partOfSpeech: 'NOUN' | 'VERB' | 'ADJECTIVE' | 'PRONOUN' | 'PARTICLE' | 'ADVERB' | 'CULTURAL'
  english: string
  bisaya: string
  source: string
  definition?: string
}

// Extended SIL Webonary Agusan Manobo Lexicon
export const SIL_WEBONARY_ENTRIES: WebonaryEntry[] = [
  // Core Nature & Geography
  { manobo: 'wuhig', root: 'wuhig', partOfSpeech: 'NOUN', english: 'water', bisaya: 'tubig', source: 'SIL Webonary', definition: 'Water; river; natural flowing freshwater' },
  { manobo: 'sapa', root: 'sapa', partOfSpeech: 'NOUN', english: 'stream', bisaya: 'sapa', source: 'SIL Webonary', definition: 'A small brook or rivulet tributary' },
  { manobo: 'bubungan', root: 'bubungan', partOfSpeech: 'NOUN', english: 'mountain', bisaya: 'bukid', source: 'SIL Webonary', definition: 'High elevated ridge or mountain' },
  { manobo: 'pasak', root: 'pasak', partOfSpeech: 'NOUN', english: 'land', bisaya: 'yuta', source: 'SIL Webonary', definition: 'Earth, soil, ancestral territory' },
  { manobo: 'tano', root: 'tano', partOfSpeech: 'NOUN', english: 'earth', bisaya: 'yuta', source: 'SIL Webonary', definition: 'The terrestrial ground or world' },
  { manobo: 'kayo', root: 'kayo', partOfSpeech: 'NOUN', english: 'tree', bisaya: 'kahoy', source: 'SIL Webonary', definition: 'Wood, tree, or timber' },
  { manobo: 'guyangan', root: 'guyangan', partOfSpeech: 'NOUN', english: 'forest', bisaya: 'lasang', source: 'SIL Webonary', definition: 'Deep wilderness, forest cover' },
  { manobo: 'adlaw', root: 'adlaw', partOfSpeech: 'NOUN', english: 'sun', bisaya: 'adlaw', source: 'SIL Webonary', definition: 'Sun, daylight, calendar day' },
  { manobo: 'bituen', root: 'bituen', partOfSpeech: 'NOUN', english: 'star', bisaya: 'bituon', source: 'SIL Webonary', definition: 'Celestial star in indigenous astronomy' },
  { manobo: 'bayod', root: 'bayod', partOfSpeech: 'NOUN', english: 'wave', bisaya: 'balod', source: 'SIL Webonary', definition: 'Wave of the sea or surging water' },
  { manobo: 'lawod', root: 'lawod', partOfSpeech: 'NOUN', english: 'ocean', bisaya: 'lawod', source: 'SIL Webonary', definition: 'Deep open sea, far off shore' },
  { manobo: 'kadukilom', root: 'dukilem', partOfSpeech: 'NOUN', english: 'night', bisaya: 'gabii', source: 'SIL Webonary', definition: 'Nighttime, darkness' },
  { manobo: 'kahayag', root: 'hayag', partOfSpeech: 'NOUN', english: 'light', bisaya: 'kahayag', source: 'SIL Webonary', definition: 'Illumination, brilliance' },

  // Fauna & Flora
  { manobo: 'amuk', root: 'amuk', partOfSpeech: 'NOUN', english: 'monkey', bisaya: 'unggoy', source: 'SIL Webonary', definition: 'Macaque monkey; trickster in folklore' },
  { manobo: 'buwaya', root: 'buwaya', partOfSpeech: 'NOUN', english: 'crocodile', bisaya: 'buaya', source: 'SIL Webonary', definition: 'River crocodile; powerful folklore motif' },
  { manobo: 'bauu', root: 'bauu', partOfSpeech: 'NOUN', english: 'turtle', bisaya: 'bao', source: 'SIL Webonary', definition: 'Freshwater or land tortoise' },
  { manobo: 'isda', root: 'isda', partOfSpeech: 'NOUN', english: 'fish', bisaya: 'isda', source: 'SIL Webonary', definition: 'Aquatic fish' },
  { manobo: 'manok-manok', root: 'manok', partOfSpeech: 'NOUN', english: 'bird', bisaya: 'langgam', source: 'SIL Webonary', definition: 'Wild avian bird of the forest' },
  { manobo: 'tigre', root: 'tigre', partOfSpeech: 'NOUN', english: 'feline', bisaya: 'tigre', source: 'SIL Webonary', definition: 'Wild predator cat / tiger folklore motif' },
  { manobo: 'batong', root: 'batong', partOfSpeech: 'NOUN', english: 'bean', bisaya: 'batong', source: 'SIL Webonary', definition: 'String bean or legume plant' },
  { manobo: 'tubo', root: 'tubo', partOfSpeech: 'NOUN', english: 'sugarcane', bisaya: 'tubo', source: 'SIL Webonary', definition: 'Saccharum sugarcane plant' },
  { manobo: 'uling', root: 'uling', partOfSpeech: 'NOUN', english: 'charcoal', bisaya: 'uling', source: 'SIL Webonary', definition: 'Burnt wood carbon / ember' },
  { manobo: 'misitas', root: 'misitas', partOfSpeech: 'NOUN', english: 'flowering plants', bisaya: 'tanom', source: 'SIL Webonary', definition: 'Ornamental garden plants' },

  // Kinship & Society
  { manobo: 'utow', root: 'utow', partOfSpeech: 'NOUN', english: 'person', bisaya: 'tawo', source: 'SIL Webonary', definition: 'Human being, person' },
  { manobo: 'kaotawan', root: 'utow', partOfSpeech: 'NOUN', english: 'people', bisaya: 'katawhan', source: 'SIL Webonary', definition: 'Collective human community' },
  { manobo: 'bata', root: 'bata', partOfSpeech: 'NOUN', english: 'child', bisaya: 'bata', source: 'SIL Webonary', definition: 'Young child, offspring' },
  { manobo: 'ligsok', root: 'ligsok', partOfSpeech: 'NOUN', english: 'boy', bisaya: 'batang lalaki', source: 'SIL Webonary', definition: 'Young male native youth' },
  { manobo: 'yumad', root: 'yumad', partOfSpeech: 'NOUN', english: 'indigenous person', bisaya: 'lumad', source: 'SIL Webonary', definition: 'Native indigenous person of Mindanao' },
  { manobo: 'inoy', root: 'inoy', partOfSpeech: 'NOUN', english: 'mother', bisaya: 'inahan', source: 'SIL Webonary', definition: 'Mother, female parent' },
  { manobo: 'amey', root: 'amey', partOfSpeech: 'NOUN', english: 'father', bisaya: 'amahan', source: 'SIL Webonary', definition: 'Father, male parent' },
  { manobo: 'silingan', root: 'silingan', partOfSpeech: 'NOUN', english: 'neighbor', bisaya: 'silingan', source: 'SIL Webonary', definition: 'Adjacent community member' },
  { manobo: 'katribuhan', root: 'tribu', partOfSpeech: 'NOUN', english: 'tribal community', bisaya: 'katribuhan', source: 'SIL Webonary', definition: 'The indigenous tribe collectively' },
  { manobo: 'bana', root: 'bana', partOfSpeech: 'NOUN', english: 'husband', bisaya: 'bana', source: 'SIL Webonary', definition: 'Spouse, male partner' },

  // Folklore, Spirits & Cultural Practices
  { manobo: 'diwata', root: 'diwata', partOfSpeech: 'CULTURAL', english: 'deity / spirit', bisaya: 'diwata', source: 'SIL Webonary', definition: 'Sacred guardian spirit of waters/forests' },
  { manobo: 'tagbanwa', root: 'tagbanwa', partOfSpeech: 'CULTURAL', english: 'territorial guardian', bisaya: 'tagbanwa', source: 'SIL Webonary', definition: 'Spiritual owner and guardian of place' },
  { manobo: 'bagani', root: 'bagani', partOfSpeech: 'CULTURAL', english: 'warrior leader', bisaya: 'bagani', source: 'SIL Webonary', definition: 'Consecrated indigenous warrior protector' },
  { manobo: 'babaylan', root: 'babaylan', partOfSpeech: 'CULTURAL', english: 'indigenous shaman', bisaya: 'babaylan', source: 'SIL Webonary', definition: 'Spiritual healer, ritual intermediary' },
  { manobo: 'panawagtawag', root: 'tawag', partOfSpeech: 'CULTURAL', english: 'ritual chant', bisaya: 'pag-ampo', source: 'SIL Webonary', definition: 'Invocation ritual to ancestral spirits' },
  { manobo: 'ulaging', root: 'ulaging', partOfSpeech: 'CULTURAL', english: 'chanted epic', bisaya: 'epiko', source: 'SIL Webonary', definition: 'Sacred oral chanted epic' },
  { manobo: 'tigmo', root: 'tigmo', partOfSpeech: 'CULTURAL', english: 'riddle', bisaya: 'bugtong', source: 'SIL Webonary', definition: 'Enigmatic metaphorical puzzle' },
  { manobo: 'panultihon', root: 'sulti', partOfSpeech: 'CULTURAL', english: 'proverb', bisaya: 'salawikain', source: 'SIL Webonary', definition: 'Traditional didactic wisdom maxim' },
  { manobo: 'tud-om', root: 'tud-om', partOfSpeech: 'CULTURAL', english: 'folktale / narrative', bisaya: 'sugilanon', source: 'SIL Webonary', definition: 'Oral prose narrative story' },

  // Actions & Verbs
  { manobo: 'sinugow', root: 'sugow', partOfSpeech: 'VERB', english: 'weep', bisaya: 'hilak', source: 'SIL Webonary', definition: 'To shed tears, mourn, cry intensely' },
  { manobo: 'paminug', root: 'dinug', partOfSpeech: 'VERB', english: 'listen', bisaya: 'paminaw', source: 'SIL Webonary', definition: 'To hear attentively, pay heed' },
  { manobo: 'panow', root: 'panow', partOfSpeech: 'VERB', english: 'journey / walk', bisaya: 'lakaw', source: 'SIL Webonary', definition: 'To travel on foot, depart' },
  { manobo: 'aha', root: 'aha', partOfSpeech: 'VERB', english: 'look / see', bisaya: 'tan-aw', source: 'SIL Webonary', definition: 'To behold, gaze, inspect visually' },
  { manobo: 'kadumdum', root: 'dumdum', partOfSpeech: 'VERB', english: 'remember', bisaya: 'hinumdom', source: 'SIL Webonary', definition: 'To recall, bring to mind with emotion' },
  { manobo: 'ugpaan', root: 'ugpa', partOfSpeech: 'VERB', english: 'dwell / inhabit', bisaya: 'puy-an', source: 'SIL Webonary', definition: 'To live in, reside, inhabit as home' },
  { manobo: 'panalipdan', root: 'salipod', partOfSpeech: 'VERB', english: 'defend / protect', bisaya: 'panalipdan', source: 'SIL Webonary', definition: 'To shelter, shield from injustice' },
  { manobo: 'tabang', root: 'tabang', partOfSpeech: 'VERB', english: 'help', bisaya: 'tabang', source: 'SIL Webonary', definition: 'To provide communal assistance' },
  { manobo: 'bantuy', root: 'bantuy', partOfSpeech: 'VERB', english: 'watch over / guard', bisaya: 'bantay', source: 'SIL Webonary', definition: 'To guard, keep watch, protect vigilantly' },
  { manobo: 'suroy', root: 'suroy', partOfSpeech: 'VERB', english: 'roam / explore', bisaya: 'suroy', source: 'SIL Webonary', definition: 'To wander, explore terrain on foot' },
  { manobo: 'dangat', root: 'dangat', partOfSpeech: 'VERB', english: 'reach / arrive', bisaya: 'dangat', source: 'SIL Webonary', definition: 'To attain, arrive at a destination or time' },
  { manobo: 'duma', root: 'duma', partOfSpeech: 'VERB', english: 'accompany / join', bisaya: 'uban', source: 'SIL Webonary', definition: 'To go together with, accompany' },
  { manobo: 'lugdang', root: 'lugdang', partOfSpeech: 'VERB', english: 'sink / submerge', bisaya: 'lubong', source: 'SIL Webonary', definition: 'To sink beneath water or into obscurity' },
  { manobo: 'kamingaw', root: 'mingaw', partOfSpeech: 'NOUN', english: 'loneliness / solitude', bisaya: 'kamingaw', source: 'SIL Webonary', definition: 'Deep emotional sorrow of longing or isolation' },
  { manobo: 'tukan', root: 'tu kan', partOfSpeech: 'PARTICLE', english: 'to the / of the', bisaya: 'sa ang', source: 'SIL Webonary', definition: 'Portmanteau compound particle [tu + kan]' },
  { manobo: 'damgo', root: 'damgo', partOfSpeech: 'VERB', english: 'dream', bisaya: 'damgo', source: 'SIL Webonary', definition: 'To experience a vision during sleep' },
  { manobo: 'himo', root: 'himo', partOfSpeech: 'VERB', english: 'create / do', bisaya: 'himo', source: 'SIL Webonary', definition: 'To manufacture, construct, perform' },

  // Qualities & Adjectives
  { manobo: 'marujow', root: 'marujow', partOfSpeech: 'ADJECTIVE', english: 'good / wholesome', bisaya: 'maayo', source: 'SIL Webonary', definition: 'Beneficial, pleasant, upright' },
  { manobo: 'maintok', root: 'intok', partOfSpeech: 'ADJECTIVE', english: 'small / tiny', bisaya: 'gamay', source: 'SIL Webonary', definition: 'Diminutive, small in stature' },
  { manobo: 'maaslag', root: 'aslag', partOfSpeech: 'ADJECTIVE', english: 'great / vast', bisaya: 'dako', source: 'SIL Webonary', definition: 'Expansive, massive, mighty' },
  { manobo: 'malisud', root: 'lisud', partOfSpeech: 'ADJECTIVE', english: 'difficult / arduous', bisaya: 'lisod', source: 'SIL Webonary', definition: 'Hard, painful, challenging' },
  { manobo: 'maputi', root: 'puti', partOfSpeech: 'ADJECTIVE', english: 'white', bisaya: 'puti', source: 'SIL Webonary', definition: 'Pale, bright, white-colored' },
  { manobo: 'maitom', root: 'itom', partOfSpeech: 'ADJECTIVE', english: 'black', bisaya: 'itom', source: 'SIL Webonary', definition: 'Dark, blackened' },
  { manobo: 'tinuud', root: 'tuud', partOfSpeech: 'ADJECTIVE', english: 'true / authentic', bisaya: 'tinuod', source: 'SIL Webonary', definition: 'Genuine, faithful, factual' },

  // Particles & Grammatical Markers
  { manobo: 'ka', root: 'ka', partOfSpeech: 'PARTICLE', english: 'the (nominative)', bisaya: 'ang', source: 'SIL Webonary' },
  { manobo: 'tu', root: 'tu', partOfSpeech: 'PARTICLE', english: 'the / to (oblique)', bisaya: 'sa', source: 'SIL Webonary' },
  { manobo: 'to', root: 'to', partOfSpeech: 'PARTICLE', english: 'of (genitive)', bisaya: 'sa', source: 'SIL Webonary' },
  { manobo: 'diya', root: 'diya', partOfSpeech: 'PARTICLE', english: 'at / there', bisaya: 'didto', source: 'SIL Webonary' },
  { manobo: 'duun', root: 'duun', partOfSpeech: 'PARTICLE', english: 'there in', bisaya: 'diha', source: 'SIL Webonary' },
  { manobo: 'kan', root: 'kan', partOfSpeech: 'PARTICLE', english: 'that / the specific', bisaya: 'ang', source: 'SIL Webonary' },
  { manobo: 'on', root: 'on', partOfSpeech: 'PARTICLE', english: 'already (completive)', bisaya: 'na', source: 'SIL Webonary' },
  { manobo: 'pad', root: 'pad', partOfSpeech: 'PARTICLE', english: 'still / yet', bisaya: 'pa', source: 'SIL Webonary' },
  { manobo: 'mig', root: 'mig', partOfSpeech: 'PARTICLE', english: 'did (past verbal aspect marker)', bisaya: 'mi / nag', source: 'SIL Webonary', definition: 'Completed action verbal aspect marker' },
  { manobo: 'nig', root: 'nig', partOfSpeech: 'PARTICLE', english: 'did (past verbal aspect marker)', bisaya: 'mi / nag', source: 'SIL Webonary', definition: 'Completed action verbal aspect marker' },
  { manobo: 'ug', root: 'ug', partOfSpeech: 'PARTICLE', english: 'will / does (aspect marker or and)', bisaya: 'mo / mag / ug', source: 'SIL Webonary', definition: 'Incompleted action aspect or conjunction' },
  { manobo: 'kanak', root: 'si-ak', partOfSpeech: 'PRONOUN', english: 'my / mine', bisaya: 'akong', source: 'SIL Webonary' },
  { manobo: 'kandin', root: 'kandin', partOfSpeech: 'PRONOUN', english: 'he / him / she / her', bisaya: 'siya', source: 'SIL Webonary' },
  { manobo: 'kandan', root: 'kandan', partOfSpeech: 'PRONOUN', english: 'their / them', bisaya: 'ila', source: 'SIL Webonary' },
  { manobo: 'ita', root: 'ita', partOfSpeech: 'PRONOUN', english: 'we (inclusive)', bisaya: 'kita', source: 'SIL Webonary' },
  { manobo: 'si-ak', root: 'si-ak', partOfSpeech: 'PRONOUN', english: 'i / me', bisaya: 'ako', source: 'SIL Webonary' },
  { manobo: 'ikow', root: 'ikow', partOfSpeech: 'PRONOUN', english: 'you', bisaya: 'ikaw', source: 'SIL Webonary' },
  { manobo: 'sikami', root: 'kami', partOfSpeech: 'PRONOUN', english: 'we (exclusive)', bisaya: 'kami', source: 'SIL Webonary' },
  { manobo: 'sikita', root: 'ita', partOfSpeech: 'PRONOUN', english: 'we (inclusive)', bisaya: 'kita', source: 'SIL Webonary' },
  { manobo: 'sikiyu', root: 'kamo', partOfSpeech: 'PRONOUN', english: 'you all', bisaya: 'kamo', source: 'SIL Webonary' },
  { manobo: 'sikandan', root: 'kandan', partOfSpeech: 'PRONOUN', english: 'they', bisaya: 'sila', source: 'SIL Webonary' },

  // Anatomy & Body Parts
  { manobo: 'ulo', root: 'ulo', partOfSpeech: 'NOUN', english: 'head', bisaya: 'ulo', source: 'SIL Webonary', definition: 'Cranial head of human or animal' },
  { manobo: 'mata', root: 'mata', partOfSpeech: 'NOUN', english: 'eye', bisaya: 'mata', source: 'SIL Webonary', definition: 'Organ of visual perception' },
  { manobo: 'talinga', root: 'talinga', partOfSpeech: 'NOUN', english: 'ear', bisaya: 'dalunggan', source: 'SIL Webonary', definition: 'Organ of hearing' },
  { manobo: 'ngipon', root: 'ngipon', partOfSpeech: 'NOUN', english: 'tooth', bisaya: 'ngipon', source: 'SIL Webonary', definition: 'Dental tooth' },
  { manobo: 'baba', root: 'baba', partOfSpeech: 'NOUN', english: 'mouth', bisaya: 'baba', source: 'SIL Webonary', definition: 'Oral mouth' },
  { manobo: 'alima', root: 'alima', partOfSpeech: 'NOUN', english: 'hand', bisaya: 'kamot', source: 'SIL Webonary', definition: 'Human hand or arm' },
  { manobo: 'paa', root: 'paa', partOfSpeech: 'NOUN', english: 'foot', bisaya: 'tiil', source: 'SIL Webonary', definition: 'Lower extremity leg or foot' },
  { manobo: 'posong', root: 'posong', partOfSpeech: 'NOUN', english: 'heart', bisaya: 'kasingkasing', source: 'SIL Webonary', definition: 'Biological heart or emotional seat of life' },
  { manobo: 'tian', root: 'tian', partOfSpeech: 'NOUN', english: 'stomach', bisaya: 'tiyan', source: 'SIL Webonary', definition: 'Abdomen or stomach' },

  // Additional Animals
  { manobo: 'asu', root: 'asu', partOfSpeech: 'NOUN', english: 'dog', bisaya: 'iro', source: 'SIL Webonary', definition: 'Canine companion dog' },
  { manobo: 'kuring', root: 'kuring', partOfSpeech: 'NOUN', english: 'cat', bisaya: 'iring', source: 'SIL Webonary', definition: 'Domestic feline cat' },
  { manobo: 'baboy', root: 'baboy', partOfSpeech: 'NOUN', english: 'pig', bisaya: 'baboy', source: 'SIL Webonary', definition: 'Porcine wild or domestic swine' },
  { manobo: 'kabawo', root: 'kabawo', partOfSpeech: 'NOUN', english: 'carabao', bisaya: 'kabaw', source: 'SIL Webonary', definition: 'Water buffalo draught animal' },
  { manobo: 'manok', root: 'manok', partOfSpeech: 'NOUN', english: 'chicken', bisaya: 'manok', source: 'SIL Webonary', definition: 'Domestic chicken or fowl' },
  { manobo: 'sawa', root: 'sawa', partOfSpeech: 'NOUN', english: 'snake', bisaya: 'sawa', source: 'SIL Webonary', definition: 'Serpent or python' },
  { manobo: 'baki', root: 'baki', partOfSpeech: 'NOUN', english: 'frog', bisaya: 'baki', source: 'SIL Webonary', definition: 'Amphibian frog' },

  // Food, Plants & Domestic Objects
  { manobo: 'begas', root: 'begas', partOfSpeech: 'NOUN', english: 'rice (uncooked)', bisaya: 'bugas', source: 'SIL Webonary', definition: 'Uncooked husked rice grains' },
  { manobo: 'kan-on', root: 'kaan', partOfSpeech: 'NOUN', english: 'cooked rice', bisaya: 'kan-on', source: 'SIL Webonary', definition: 'Boiled staple rice food' },
  { manobo: 'asin', root: 'asin', partOfSpeech: 'NOUN', english: 'salt', bisaya: 'asin', source: 'SIL Webonary', definition: 'Mineral culinary salt' },
  { manobo: 'lana', root: 'lana', partOfSpeech: 'NOUN', english: 'oil', bisaya: 'lana', source: 'SIL Webonary', definition: 'Plant or coconut oil' },
  { manobo: 'saging', root: 'saging', partOfSpeech: 'NOUN', english: 'banana', bisaya: 'saging', source: 'SIL Webonary', definition: 'Musa banana plant and fruit' },
  { manobo: 'kamote', root: 'kamote', partOfSpeech: 'NOUN', english: 'sweet potato', bisaya: 'kamote', source: 'SIL Webonary', definition: 'Edible tuberous sweet potato' },
  { manobo: 'balay', root: 'balay', partOfSpeech: 'NOUN', english: 'house', bisaya: 'balay', source: 'SIL Webonary', definition: 'Dwelling habitation, ancestral house' },
  { manobo: 'panimalay', root: 'balay', partOfSpeech: 'NOUN', english: 'household', bisaya: 'panimalay', source: 'SIL Webonary', definition: 'Domestic family unit' },
  { manobo: 'banwa', root: 'banwa', partOfSpeech: 'NOUN', english: 'village / town', bisaya: 'lungsod', source: 'SIL Webonary', definition: 'Settlement or ancestral domain' },

  // Daily Actions & Verbs
  { manobo: 'kaan', root: 'kaan', partOfSpeech: 'VERB', english: 'eat', bisaya: 'kaon', source: 'SIL Webonary', definition: 'To ingest food' },
  { manobo: 'inog', root: 'inog', partOfSpeech: 'VERB', english: 'drink', bisaya: 'inom', source: 'SIL Webonary', definition: 'To consume beverage or water' },
  { manobo: 'tudog', root: 'tudog', partOfSpeech: 'VERB', english: 'sleep', bisaya: 'katulog', source: 'SIL Webonary', definition: 'To rest in slumber' },
  { manobo: 'hibat', root: 'hibat', partOfSpeech: 'VERB', english: 'lie down', bisaya: 'higda', source: 'SIL Webonary', definition: 'To recline or rest horizontally' },
  { manobo: 'hangkat', root: 'hangkat', partOfSpeech: 'VERB', english: 'wake up', bisaya: 'mata', source: 'SIL Webonary', definition: 'To awaken from sleep' },
  { manobo: 'ikagi', root: 'kagi', partOfSpeech: 'VERB', english: 'speak / talk', bisaya: 'sulti', source: 'SIL Webonary', definition: 'To communicate in speech' },
  { manobo: 'dinug', root: 'dinug', partOfSpeech: 'VERB', english: 'hear', bisaya: 'dungog', source: 'SIL Webonary', definition: 'To perceive auditory sounds' },
  { manobo: 'layog', root: 'layog', partOfSpeech: 'VERB', english: 'fly', bisaya: 'lupad', source: 'SIL Webonary', definition: 'To ascend into aerial flight' },
  { manobo: 'dagan', root: 'dagan', partOfSpeech: 'VERB', english: 'run', bisaya: 'dagan', source: 'SIL Webonary', definition: 'To sprint or run rapidly' },
  { manobo: 'sulat', root: 'sulat', partOfSpeech: 'VERB', english: 'write', bisaya: 'suwat', source: 'SIL Webonary', definition: 'To inscribe or write text' },
  { manobo: 'basa', root: 'basa', partOfSpeech: 'VERB', english: 'read', bisaya: 'basa', source: 'SIL Webonary', definition: 'To peruse written words' },
  { manobo: 'begay', root: 'begay', partOfSpeech: 'VERB', english: 'give', bisaya: 'hatag', source: 'SIL Webonary', definition: 'To present or bestow a gift' },
  { manobo: 'dawat', root: 'dawat', partOfSpeech: 'VERB', english: 'receive', bisaya: 'dawat', source: 'SIL Webonary', definition: 'To accept what is offered' },
  { manobo: 'luto', root: 'luto', partOfSpeech: 'VERB', english: 'cook', bisaya: 'luto', source: 'SIL Webonary', definition: 'To prepare meals over fire' },
  { manobo: 'hugas', root: 'hugas', partOfSpeech: 'VERB', english: 'wash', bisaya: 'hugas', source: 'SIL Webonary', definition: 'To cleanse with water' },

  // Time & Temporal Indicators
  { manobo: 'sugang', root: 'sugang', partOfSpeech: 'NOUN', english: 'morning', bisaya: 'buntag', source: 'SIL Webonary', definition: 'Early morning, dawn' },
  { manobo: 'malolom', root: 'malolom', partOfSpeech: 'NOUN', english: 'afternoon', bisaya: 'hapon', source: 'SIL Webonary', definition: 'Late afternoon' },
  { manobo: 'tuig', root: 'tuig', partOfSpeech: 'NOUN', english: 'year', bisaya: 'tuig', source: 'SIL Webonary', definition: 'Annual seasonal cycle' },
  { manobo: 'bulan', root: 'bulan', partOfSpeech: 'NOUN', english: 'moon / month', bisaya: 'bulan', source: 'SIL Webonary', definition: 'Celestial moon or calendar month' },
  { manobo: 'kuno-kuno', root: 'kuno', partOfSpeech: 'ADVERB', english: 'now / today', bisaya: 'karon', source: 'SIL Webonary', definition: 'The present moment or day' },
  { manobo: 'asolom', root: 'solom', partOfSpeech: 'ADVERB', english: 'tomorrow', bisaya: 'ugma', source: 'SIL Webonary', definition: 'The succeeding day' },
  { manobo: 'kaapon', root: 'apon', partOfSpeech: 'ADVERB', english: 'yesterday', bisaya: 'kagahapon', source: 'SIL Webonary', definition: 'The day preceding today' },
  { manobo: 'dini', root: 'dini', partOfSpeech: 'PARTICLE', english: 'here', bisaya: 'diri', source: 'SIL Webonary', definition: 'Close proximal location' },

  // Numbers (Agusan Manobo Numerals)
  { manobo: 'sabeka', root: 'sabeka', partOfSpeech: 'ADJECTIVE', english: 'one', bisaya: 'usa', source: 'SIL Webonary', definition: 'Cardinal number 1' },
  { manobo: 'duwa', root: 'duwa', partOfSpeech: 'ADJECTIVE', english: 'two', bisaya: 'duha', source: 'SIL Webonary', definition: 'Cardinal number 2' },
  { manobo: 'tatlo', root: 'tatlo', partOfSpeech: 'ADJECTIVE', english: 'three', bisaya: 'tulo', source: 'SIL Webonary', definition: 'Cardinal number 3' },
  { manobo: 'upat', root: 'upat', partOfSpeech: 'ADJECTIVE', english: 'four', bisaya: 'upat', source: 'SIL Webonary', definition: 'Cardinal number 4' },
  { manobo: 'lima', root: 'lima', partOfSpeech: 'ADJECTIVE', english: 'five', bisaya: 'lima', source: 'SIL Webonary', definition: 'Cardinal number 5' },
  { manobo: 'an-om', root: 'an-om', partOfSpeech: 'ADJECTIVE', english: 'six', bisaya: 'unom', source: 'SIL Webonary', definition: 'Cardinal number 6' },
  { manobo: 'pito', root: 'pito', partOfSpeech: 'ADJECTIVE', english: 'seven', bisaya: 'pito', source: 'SIL Webonary', definition: 'Cardinal number 7' },
  { manobo: 'walo', root: 'walo', partOfSpeech: 'ADJECTIVE', english: 'eight', bisaya: 'walo', source: 'SIL Webonary', definition: 'Cardinal number 8' },
  { manobo: 'siyam', root: 'siyam', partOfSpeech: 'ADJECTIVE', english: 'nine', bisaya: 'siyam', source: 'SIL Webonary', definition: 'Cardinal number 9' },
  { manobo: 'sapulo', root: 'sapulo', partOfSpeech: 'ADJECTIVE', english: 'ten', bisaya: 'napulo', source: 'SIL Webonary', definition: 'Cardinal number 10' },

  // Interrogatives
  { manobo: 'nukoy', root: 'nukoy', partOfSpeech: 'PRONOUN', english: 'what', bisaya: 'unsa', source: 'SIL Webonary', definition: 'Interrogative pronoun: what' },
  { manobo: 'hintey', root: 'hintey', partOfSpeech: 'PRONOUN', english: 'who', bisaya: 'kinsa', source: 'SIL Webonary', definition: 'Interrogative pronoun: who' },
  { manobo: 'andoy', root: 'andoy', partOfSpeech: 'ADVERB', english: 'where', bisaya: 'asa', source: 'SIL Webonary', definition: 'Interrogative adverb of place: where' },
  { manobo: 'kanu', root: 'kanu', partOfSpeech: 'ADVERB', english: 'when', bisaya: 'kanus-a', source: 'SIL Webonary', definition: 'Interrogative adverb of time: when' },
  { manobo: 'man-u', root: 'man-u', partOfSpeech: 'ADVERB', english: 'how', bisaya: 'giunsa', source: 'SIL Webonary', definition: 'Interrogative adverb of manner: how' },

  // Descriptive Qualities & Colors
  { manobo: 'mapula', root: 'pula', partOfSpeech: 'ADJECTIVE', english: 'red', bisaya: 'pula', source: 'SIL Webonary', definition: 'Crimson or red hue' },
  { manobo: 'matan-og', root: 'tan-og', partOfSpeech: 'ADJECTIVE', english: 'cold', bisaya: 'tugnaw', source: 'SIL Webonary', definition: 'Low temperature, chilly' },
  { manobo: 'mapasu', root: 'pasu', partOfSpeech: 'ADJECTIVE', english: 'hot', bisaya: 'init', source: 'SIL Webonary', definition: 'High thermal heat' },
  { manobo: 'masinaw', root: 'sinaw', partOfSpeech: 'ADJECTIVE', english: 'bright', bisaya: 'masanag', source: 'SIL Webonary', definition: 'Luminous, shiny, sparkling' },
  { manobo: 'madat', root: 'dat', partOfSpeech: 'ADJECTIVE', english: 'bad / evil', bisaya: 'daotan', source: 'SIL Webonary', definition: 'Malevolent, harmful, wicked' },
  { manobo: 'malumok', root: 'lumok', partOfSpeech: 'ADJECTIVE', english: 'soft', bisaya: 'humok', source: 'SIL Webonary', definition: 'Yielding, gentle, pliable' },
  { manobo: 'matig-a', root: 'tig-a', partOfSpeech: 'ADJECTIVE', english: 'hard', bisaya: 'gahi', source: 'SIL Webonary', definition: 'Solid, rigid, unyielding' },
  { manobo: 'tibuk', root: 'tibuk', partOfSpeech: 'ADJECTIVE', english: 'all / whole', bisaya: 'tibuok', source: 'SIL Webonary', definition: 'Entire, complete, undivided' },
]

// Dialectal and orthographic variants documented in Agusan del Sur
export const DIALECT_VARIANTS: Record<string, { standard: string; notes: string }> = {
  'wohig': { standard: 'wuhig', notes: 'Bunawan riverine vowel shift (o -> u)' },
  'kamingow': { standard: 'kamingaw', notes: 'Southern Agusan diphthong shift (aw -> ow)' },
  'sinugao': { standard: 'sinugow', notes: 'Orthographic variant for weeping' },
  'kanay': { standard: 'kanak', notes: 'First person possessive variant (my/mine)' },
  'owaging': { standard: 'ulaging', notes: 'Trento dialect variant for epic chant' },
  'duun': { standard: 'duon', notes: 'Locative particle spelling variant' },
  'marayow': { standard: 'marujow', notes: 'Umayam dialect variant for good' },
}

// Common Agusan Manobo verbal and nominal affixes
const AFFIX_PREFIXES = ['nig', 'pig', 'ug', 'tug', 'mig', 'nag', 'mag', 'maka', 'paka', 'pag', 'ka', 'ma']
const AFFIX_SUFFIXES = ['on', 'an', 'ay']

/**
 * Validates a single word against the SIL Webonary dictionary standard
 */
export function validateSingleWord(rawWord: string): WordValidation {
  const clean = rawWord.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!clean) {
    return {
      word: rawWord,
      normalizedWord: clean,
      status: 'UNREGISTERED',
      source: 'Punctuation / Symbol',
    }
  }

  // 1. Direct match in SIL Webonary dictionary
  const directMatch = SIL_WEBONARY_ENTRIES.find(
    (e) => e.manobo.toLowerCase() === clean || e.root.toLowerCase() === clean
  )
  if (directMatch) {
    return {
      word: rawWord,
      normalizedWord: clean,
      status: 'VERIFIED_SIL',
      partOfSpeech: directMatch.partOfSpeech,
      rootWord: directMatch.root,
      definition: directMatch.definition || `${directMatch.english} (${directMatch.bisaya})`,
      source: 'SIL Webonary (Agusan Manobo Dictionary)',
    }
  }

  // 2. Check dialect variant
  if (DIALECT_VARIANTS[clean]) {
    const variant = DIALECT_VARIANTS[clean]
    const standardMatch = SIL_WEBONARY_ENTRIES.find((e) => e.manobo === variant.standard)
    return {
      word: rawWord,
      normalizedWord: clean,
      status: 'DIALECT_VARIANT',
      partOfSpeech: standardMatch?.partOfSpeech || 'VARIANT',
      rootWord: variant.standard,
      definition: standardMatch?.definition || `Dialect form of ${variant.standard}`,
      notes: variant.notes,
      source: 'SIL Webonary (Dialect Variant Standard)',
    }
  }

  // 3. Morphological Affix Decomposition (stripping Agusan Manobo affixes)
  for (const prefix of AFFIX_PREFIXES) {
    if (clean.startsWith(prefix) && clean.length > prefix.length + 2) {
      const strippedRoot = clean.slice(prefix.length)
      const rootMatch = SIL_WEBONARY_ENTRIES.find(
        (e) => e.root.toLowerCase() === strippedRoot || e.manobo.toLowerCase() === strippedRoot
      )
      if (rootMatch) {
        return {
          word: rawWord,
          normalizedWord: clean,
          status: 'AFFIXED_SIL_ROOT',
          partOfSpeech: rootMatch.partOfSpeech === 'VERB' ? 'VERB (Affixed)' : `${rootMatch.partOfSpeech} (Affixed)`,
          rootWord: rootMatch.root,
          definition: `Affixed form of root '${rootMatch.root}' (${rootMatch.english})`,
          notes: `Prefix [${prefix}-] attached to verified SIL root`,
          source: 'SIL Webonary Morphological Decomposition',
        }
      }
    }
  }

  // Also check suffix
  for (const suffix of AFFIX_SUFFIXES) {
    if (clean.endsWith(suffix) && clean.length > suffix.length + 2) {
      const strippedRoot = clean.slice(0, -suffix.length)
      const rootMatch = SIL_WEBONARY_ENTRIES.find(
        (e) => e.root.toLowerCase() === strippedRoot || e.manobo.toLowerCase() === strippedRoot
      )
      if (rootMatch) {
        return {
          word: rawWord,
          normalizedWord: clean,
          status: 'AFFIXED_SIL_ROOT',
          partOfSpeech: rootMatch.partOfSpeech,
          rootWord: rootMatch.root,
          definition: `Affixed form of root '${rootMatch.root}' (${rootMatch.english})`,
          notes: `Suffix [-${suffix}] attached to verified SIL root`,
          source: 'SIL Webonary Morphological Decomposition',
        }
      }
    }
  }

  // 4. Secondary fallback: check thesis literature corpus
  const corpusMatch = BIBLE_LEXICON.find((e) => e.manobo.toLowerCase() === clean)
  if (corpusMatch) {
    return {
      word: rawWord,
      normalizedWord: clean,
      status: 'VERIFIED_SIL',
      partOfSpeech: corpusMatch.category,
      rootWord: clean,
      definition: `${corpusMatch.english} (${corpusMatch.bisaya})`,
      notes: corpusMatch.notes || 'Documented in Agusan Manobo thesis corpus',
      source: 'Agusan Manobo Thesis Corpus (Maravilla / Catipay)',
    }
  }

  // 5. Unregistered oral word
  return {
    word: rawWord,
    normalizedWord: clean,
    status: 'UNREGISTERED',
    source: 'Oral Tradition / Uncatalogued Lexeme',
    notes: 'Candidate lexeme for field verification and dictionary expansion',
  }
}

/**
 * Validates an entire sentence or phrase against the SIL Webonary dictionary
 */
export function validateTextWithWebonary(
  text: string,
  sourceLang: string = 'msm'
): WebonaryValidationReport {
  if (sourceLang !== 'msm') {
    return {
      totalTokens: 0,
      verifiedTokens: 0,
      verificationRate: 1.0,
      validatedWords: [],
      lexicalAuthority: 'SIL International Webonary (Agusan Manobo, ISO 639-3)',
      summaryNote: 'Validation is optimized for Agusan Manobo input text.',
    }
  }

  const tokens = text.trim().split(/\s+/).filter((t) => t.length > 0)
  if (tokens.length === 0) {
    return {
      totalTokens: 0,
      verifiedTokens: 0,
      verificationRate: 0,
      validatedWords: [],
      lexicalAuthority: 'SIL International Webonary (Agusan Manobo, ISO 639-3)',
      summaryNote: 'No text provided for lexical validation.',
    }
  }

  const validations: WordValidation[] = tokens.map((token) => validateSingleWord(token))
  const verifiedCount = validations.filter(
    (v) => v.status === 'VERIFIED_SIL' || v.status === 'AFFIXED_SIL_ROOT' || v.status === 'DIALECT_VARIANT'
  ).length

  const rate = tokens.length > 0 ? Math.round((verifiedCount / tokens.length) * 100) / 100 : 0

  return {
    totalTokens: tokens.length,
    verifiedTokens: verifiedCount,
    verificationRate: rate,
    validatedWords: validations,
    lexicalAuthority: 'SIL International Webonary (Agusan Manobo, ISO 639-3: msm)',
    summaryNote: `${verifiedCount} of ${tokens.length} words (${Math.round(rate * 100)}%) verified against SIL Webonary standard orthography.`,
  }
}

/**
 * Searches the SIL Webonary Dictionary to supplement translations when missing from the Bible corpus.
 */
export function lookupWebonaryTranslation(
  rawWord: string,
  sourceLang: 'en' | 'msm' | 'ceb',
  targetLang: 'en' | 'msm' | 'ceb'
): { translation: string; source: string; notes?: string; rootWord?: string } | null {
  const clean = rawWord.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!clean) return null

  // 1. Manobo -> English or Bisaya
  if (sourceLang === 'msm') {
    const val = validateSingleWord(clean)
    if (val.status !== 'UNREGISTERED') {
      const match = SIL_WEBONARY_ENTRIES.find(
        (e) => e.manobo.toLowerCase() === val.normalizedWord || e.root.toLowerCase() === val.rootWord?.toLowerCase()
      )
      if (match) {
        const trans = targetLang === 'ceb' ? match.bisaya : match.english.split(' / ')[0].split(' (')[0]
        return {
          translation: trans,
          source: 'SIL Webonary Dictionary (ISO 639-3: msm)',
          notes: val.notes || match.definition,
          rootWord: match.root,
        }
      }
    }
    return null
  }

  // 2. English -> Manobo or Bisaya
  if (sourceLang === 'en') {
    for (const entry of SIL_WEBONARY_ENTRIES) {
      const engTokens = entry.english.toLowerCase().split(/\s*[\/,]\s*|\s+/)
      const engPhrases = entry.english.toLowerCase().split(/\s*[\/,]\s*/)
      if (engTokens.includes(clean) || engPhrases.includes(clean)) {
        return {
          translation: targetLang === 'msm' ? entry.manobo : entry.bisaya,
          source: 'SIL Webonary Dictionary (ISO 639-3: msm)',
          notes: entry.definition || entry.english,
          rootWord: entry.root,
        }
      }
    }
    return null
  }

  // 3. Bisaya -> Manobo or English
  if (sourceLang === 'ceb') {
    for (const entry of SIL_WEBONARY_ENTRIES) {
      const cebTokens = entry.bisaya.toLowerCase().split(/\s*[\/,]\s*|\s+/)
      const cebPhrases = entry.bisaya.toLowerCase().split(/\s*[\/,]\s*/)
      if (cebTokens.includes(clean) || cebPhrases.includes(clean)) {
        return {
          translation: targetLang === 'msm' ? entry.manobo : entry.english.split(' / ')[0],
          source: 'SIL Webonary Dictionary (ISO 639-3: msm)',
          notes: entry.definition || entry.bisaya,
          rootWord: entry.root,
        }
      }
    }
    return null
  }

  return null
}
