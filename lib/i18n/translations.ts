export type Language = 'en' | 'fil' | 'ceb' | 'msm'

export interface LanguageOption {
  code: Language
  label: string
  nativeLabel: string
  shortLabel: string
  flag?: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'EN' },
  { code: 'fil', label: 'Tagalog', nativeLabel: 'Filipino / Tagalog', shortLabel: 'FIL' },
  { code: 'ceb', label: 'Bisaya', nativeLabel: 'Sinugbuanong Binisaya', shortLabel: 'CEB' },
  { code: 'msm', label: 'Agusan Manobo', nativeLabel: 'Minanubu (Agusan)', shortLabel: 'MSM' },
]

export const translations = {
  en: {
    // Header & Navigation
    nav_explorer: 'EXPLORER',
    nav_classification: 'CLASSIFICATION',
    nav_translator: 'TRANSLATOR',
    nav_dashboard: 'DASHBOARD',
    nav_about: 'ABOUT',
    search_placeholder: 'Search archive...',
    appearance: 'APPEARANCE',
    admin_dashboard: 'Admin Dashboard',
    language: 'LANGUAGE',
    select_language: 'Select Language',

    // Footer
    footer_tagline: 'A digital sanctuary for the oral traditions of the Agusan Manobo people. Powered by scholarly research and cultural reverence.',
    footer_nav_heading: 'NAVIGATION',
    footer_nav_explorer: 'Archive Explorer',
    footer_nav_rules: 'Taxonomy Rules',
    footer_nav_about: 'About Archive',
    footer_nav_ethics: 'Cultural Ethics',
    footer_contact_heading: 'CONTACT',
    footer_location: 'Agusan del Sur, Philippines',
    footer_language_heading: 'SELECT LANGUAGE',
    footer_rights: 'All rights reserved.',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_ethical_access: 'Ethical Access Policy',

    // Home Hero & Stats
    hero_badge: 'SCHOLARLY PRESERVATION',
    hero_title_1: 'Preserving the Agusan Manobo',
    hero_title_2: 'Voice',
    hero_desc: 'A scholarly digital archive dedicated to the systematic classification, linguistic preservation, and cultural veneration of the indigenous oral literature and folk songs of the Agusan Manobo people of Agusan del Sur, Philippines.',
    hero_search_placeholder: 'Search by title, folk genre, or Manobo keyword...',
    btn_browse_archive: 'Browse Archive',
    btn_classification_rules: 'Rule-Based Classification',
    btn_system_taxonomy: 'System Architecture & Taxonomy',
    stat_preserved_entries: 'Preserved Entries',
    stat_oral_literature: 'Oral Literature',
    stat_folk_songs: 'Folk Songs',
    stat_municipalities: 'Municipalities',
    section_featured_title: 'Featured Literary Pieces',
    section_featured_subtitle: 'Authentic oral literature documented and validated from indigenous culture bearers.',
    listen_audio: 'Listen Audio',
    read_text: 'Read Text',
    view_details: 'View Details',

    // Translator Tool
    translator_title: 'Manobo Translator',
    translator_subtitle: 'Translate free-form text, sentences, or phrases between Agusan Manobo, English, Bisaya, and Tagalog. Translations are dynamically queried from verified literary entries and cultural lexicons.',
    translator_source_label: 'SOURCE LANGUAGE',
    translator_target_label: 'TARGET LANGUAGE',
    translator_input_placeholder: 'Enter text, word, or phrase to translate...',
    translator_btn_translate: 'Translate Now',
    translator_btn_translating: 'Translating...',
    translator_result_title: 'Translation Result',
    translator_copy: 'Copy',
    translator_copied: 'Copied!',
    translator_confidence: 'Confidence',
    translator_source_info: 'Identified Source',
    translator_swap: 'Swap Languages',
    translator_clear: 'Clear',
    translator_lexicon_title: 'Verified Literary Vocabulary',
    translator_lexicon_desc: 'Click any word to quickly translate it or view verified cultural definitions.',
    chars_count: 'characters',

    // Classification Page
    classification_title: 'Oral Literature Classification & Taxonomy',
    classification_subtitle: 'Hierarchical taxonomy framework based on Damiana Eugenio (1993) Folk Literature and E. Andress (1985) Ethnographic Field Systems.',
    classification_rules_heading: 'Classification Rules & Taxonomy',
    classification_search_placeholder: 'Search taxonomy, Eugenio categories, or Andress rules...',
    view_literature: 'View Literature',

    // Explorer Page
    explorer_title: 'Archive Explorer',
    explorer_subtitle: 'Browse documented folktales, folk songs, riddles, and proverbs.',
    explorer_search_placeholder: 'Search entries by title, content, themes, keywords...',
    filter_all: 'All',
    filter_genre: 'Genre',
    filter_municipality: 'Municipality',
    search_no_results: 'No literature entries found matching your query.',

    // Common UI
    current_language: 'Current Language',
    active: 'Active',
    ml_active_badge: 'ML Classification: Active (Webonary Lexicon v2.0.0)',
  },
  fil: {
    // Header & Navigation
    nav_explorer: 'ARKIBO',
    nav_classification: 'KLASIPIKASYON',
    nav_translator: 'TAGASALIN',
    nav_dashboard: 'DASHBOARD',
    nav_about: 'TUNGKOL',
    search_placeholder: 'Maghanap sa arkibo...',
    appearance: 'ANYO / TEMA',
    admin_dashboard: 'Admin Dashboard',
    language: 'WIKA',
    select_language: 'Pumili ng Wika',

    // Footer
    footer_tagline: 'Isang digital na kanlungan para sa mga pasalitang tradisyon ng mga Agusan Manobo. Pinapagana ng masusing pananaliksik at paggalang sa kultura.',
    footer_nav_heading: 'PAGLILIBOT',
    footer_nav_explorer: 'Galugarin ang Arkibo',
    footer_nav_rules: 'Mga Panuntunan sa Klasipikasyon',
    footer_nav_about: 'Tungkol sa Arkibo',
    footer_nav_ethics: 'Etika sa Kultura',
    footer_contact_heading: 'UGNAYAN',
    footer_location: 'Agusan del Sur, Pilipinas',
    footer_language_heading: 'PUMILI NG WIKA',
    footer_rights: 'Lahat ng karapatan ay nakalaan.',
    footer_privacy: 'Patakaran sa Pagkapribado',
    footer_terms: 'Mga Tuntunin ng Serbisyo',
    footer_ethical_access: 'Patakaran sa Etikal na Pag-access',

    // Home Hero & Stats
    hero_badge: 'PAG-IINGAT NG KARUNUNGAN',
    hero_title_1: 'Pag-iingat sa Tinig ng',
    hero_title_2: 'Agusan Manobo',
    hero_desc: 'Isang iskolarling digital na arkibo na nakalaan sa sistematikong klasipikasyon, lingguwistikong pag-iingat, at kultural na pagpaparangal sa katutubong pasalitang panitikan at mga awiting-bayan ng mga Agusan Manobo sa Agusan del Sur, Pilipinas.',
    hero_search_placeholder: 'Maghanap ayon sa pamagat, uri ng panitikan, o salitang Manobo...',
    btn_browse_archive: 'Galugarin ang Arkibo',
    btn_classification_rules: 'Klasipikasyon Batay sa Tuntunin',
    btn_system_taxonomy: 'Arkitektura at Taksonomiya ng Sistema',
    stat_preserved_entries: 'Naiingatang Tala',
    stat_oral_literature: 'Pasalitang Panitikan',
    stat_folk_songs: 'Mga Awiting-Bayan',
    stat_municipalities: 'Mga Munisipalidad',
    section_featured_title: 'Mga Tampok na Akdang Pampanitikan',
    section_featured_subtitle: 'Tunay na pasalitang panitikan na naitala at napatunayan mula sa mga katutubong tagapagdala ng kultura.',
    listen_audio: 'Pakinggan ang Audio',
    read_text: 'Basahin ang Teksto',
    view_details: 'Tingnan ang Detalye',

    // Translator Tool
    translator_title: 'Tagasalin ng Manobo',
    translator_subtitle: 'Magsalin ng malayang teksto, pangungusap, o parirala sa pagitan ng Agusan Manobo, Ingles, Bisaya, at Tagalog. Ang mga salin ay dinamikong kinukuha mula sa mga napatunayang tala at kultural na leksikon.',
    translator_source_label: 'PINAGMULANG WIKA',
    translator_target_label: 'PATUTUNGUHANG WIKA',
    translator_input_placeholder: 'Maglagay ng teksto, salita, o parirala na isasalin...',
    translator_btn_translate: 'Isalin Ngayon',
    translator_btn_translating: 'Nagsasalin...',
    translator_result_title: 'Kinalabasan ng Salin',
    translator_copy: 'Kopyahin',
    translator_copied: 'Nakopya na!',
    translator_confidence: 'Kumpyansa',
    translator_source_info: 'Pinagmulang Tala',
    translator_swap: 'Pagpalitin ang Wika',
    translator_clear: 'Linisin',
    translator_lexicon_title: 'Napatunayang Talasalitaan sa Panitikan',
    translator_lexicon_desc: 'Pindutin ang alinmang salita upang agad itong maisalin o makita ang kahulugang kultural.',
    chars_count: 'mga titik',

    // Classification Page
    classification_title: 'Klasipikasyon at Taksonomiya ng Pasalitang Panitikan',
    classification_subtitle: 'Balangkas ng hirarkiyang klasipikasyon batay sa Damiana Eugenio (1993) Folk Literature at E. Andress (1985) Ethnographic Field Systems.',
    classification_rules_heading: 'Mga Tuntunin sa Klasipikasyon at Taksonomiya',
    classification_search_placeholder: 'Maghanap sa taksonomiya, kategorya ni Eugenio, o tuntunin ni Andress...',
    view_literature: 'Tingnan ang Panitikan',

    // Explorer Page
    explorer_title: 'Galugarin ang Arkibo',
    explorer_subtitle: 'Tingnan ang mga naitalang kuwentong-bayan, awiting-bayan, bugtong, at salawikain.',
    filter_all: 'Lahat',
    filter_genre: 'Genre / Uri',
    filter_municipality: 'Munisipalidad',
    search_no_results: 'Walang nahanap na tala na tumutugma sa iyong paghahanap.',

    // Common UI
    current_language: 'Kasalukuyang Wika',
    active: 'Aktibo',
    ml_active_badge: 'ML Klasipikasyon: Aktibo (Webonary Lexicon v2.0.0)',
  },
  ceb: {
    // Header & Navigation
    nav_explorer: 'SUHIRON',
    nav_classification: 'KLASIPIKASYON',
    nav_translator: 'TAGHUBAD',
    nav_dashboard: 'DASHBOARD',
    nav_about: 'MAHITUNGOD',
    search_placeholder: 'Pangita sa arkibo...',
    appearance: 'PANAGWAY / TEMA',
    admin_dashboard: 'Admin Dashboard',
    language: 'PINULONGAN',
    select_language: 'Pili og Pinulongan',

    // Footer
    footer_tagline: 'Usa ka digital nga santuwaryo alang sa mga binaba nga tradisyon sa katawhang Agusan Manobo. Gipasiugdahan sa makugihong pagpanukiduki ug kultural nga pagtahod.',
    footer_nav_heading: 'NABIGASYON',
    footer_nav_explorer: 'Suhiron ang Arkibo',
    footer_nav_rules: 'Mga Balaod sa Klasipikasyon',
    footer_nav_about: 'Mahitungod sa Arkibo',
    footer_nav_ethics: 'Kultural nga Etika',
    footer_contact_heading: 'PAKIGKONEKTA',
    footer_location: 'Agusan del Sur, Pilipinas',
    footer_language_heading: 'PILI OG PINULONGAN',
    footer_rights: 'Tanan nga katungod gigahin.',
    footer_privacy: 'Polisiya sa Pribasiya',
    footer_terms: 'Kondisyon sa Serbisyo',
    footer_ethical_access: 'Polisiya sa Etikal nga Paggamit',

    // Home Hero & Stats
    hero_badge: 'PAGPANALIPOD SA KAALAM',
    hero_title_1: 'Pagpanalipod sa Tingog sa',
    hero_title_2: 'Agusan Manobo',
    hero_desc: 'Usa ka eskolar nga digital nga arkibo nga gipahinungod sa sistematikong klasipikasyon, lingguwistikong pagpanalipod, ug kultural nga pagpasidungog sa lumadnong binaba nga literatura ug mga awit-katawhan sa katawhang Agusan Manobo sa Agusan del Sur, Pilipinas.',
    hero_search_placeholder: 'Pangita pinaagi sa ulohan, matang sa literatura, o pulong nga Manobo...',
    btn_browse_archive: 'Suhira ang Arkibo',
    btn_classification_rules: 'Klasipikasyon Sumala sa Balaod',
    btn_system_taxonomy: 'Arkitektura ug Taksonomiya sa Sistema',
    stat_preserved_entries: 'Napanalipdang mga Rekord',
    stat_oral_literature: 'Binaba nga Literatura',
    stat_folk_songs: 'Mga Awit-Katawhan',
    stat_municipalities: 'Mga Munisipyo',
    section_featured_title: 'Mga Piniling Akdang Pampanitikan',
    section_featured_subtitle: 'Tinuod nga binaba nga literatura nga narekord ug napamatud-an gikan sa mga lumadnong nagkupot sa kultura.',
    listen_audio: 'Paminawa ang Audio',
    read_text: 'Basaha ang Teksto',
    view_details: 'Tan-awa ang Detalye',

    // Translator Tool
    translator_title: 'Taghubad sa Manobo',
    translator_subtitle: 'Maghubad og mga pulong, pahayag, o tudling-pulong tali sa Agusan Manobo, Iningles, Bisaya, ug Tagalog. Ang mga hubad gikuha gikan sa napanalipdang rekord ug kultural nga leksikon.',
    translator_source_label: 'GIGIKANANG PINULONGAN',
    translator_target_label: 'PADULNGANG PINULONGAN',
    translator_input_placeholder: 'Ibutang ang teksto, pulong, o pahayag nga hubaron...',
    translator_btn_translate: 'Hubara Karon',
    translator_btn_translating: 'Naghubad...',
    translator_result_title: 'Resulta sa Hubad',
    translator_copy: 'Kopyaha',
    translator_copied: 'Nakopya na!',
    translator_confidence: 'Kasaligan',
    translator_source_info: 'Gigikanang Rekord',
    translator_swap: 'Ilisi ang Pinulongan',
    translator_clear: 'Limpyohi',
    translator_lexicon_title: 'Napamatud-ang Bokabularyo sa Literatura',
    translator_lexicon_desc: 'Pindota ang bisan unsang pulong aron dali kining mahubad o makita ang kultural nga kahulogan.',
    chars_count: 'mga letra',

    // Classification Page
    classification_title: 'Klasipikasyon ug Taksonomiya sa Binaba nga Literatura',
    classification_subtitle: 'Balangkas sa klasipikasyon pinasikad sa Damiana Eugenio (1993) Folk Literature ug E. Andress (1985) Ethnographic Field Systems.',
    classification_rules_heading: 'Mga Balaod sa Klasipikasyon ug Taksonomiya',
    classification_search_placeholder: 'Pangita sa taksonomiya, kategorya ni Eugenio, o balaod ni Andress...',
    view_literature: 'Tan-awa ang Literatura',

    // Explorer Page
    explorer_title: 'Suhiron ang Arkibo',
    explorer_subtitle: 'Tan-awa ang mga narekord nga sugilanon, awit-katawhan, tigmo, ug panultihon.',
    filter_all: 'Tanan',
    filter_genre: 'Matang',
    filter_municipality: 'Munisipyo',
    search_no_results: 'Walay nakit-ang rekord nga motakdo sa imong gipangita.',

    // Common UI
    current_language: 'Kasamtangang Pinulongan',
    active: 'Aktibo',
    ml_active_badge: 'ML Klasipikasyon: Aktibo (Webonary Lexicon v2.0.0)',
  },
  msm: {
    // Header & Navigation
    nav_explorer: 'PAGSUSI',
    nav_classification: 'PAGBAHIN-BAHIN',
    nav_translator: 'TAGHUBAD',
    nav_dashboard: 'DASHBOARD',
    nav_about: 'BAHIN KANAMI',
    search_placeholder: 'Pamiling to arkibo...',
    appearance: 'KAY-AGAN / TEMA',
    admin_dashboard: 'Admin Dashboard',
    language: 'PULONG',
    select_language: 'Pili to Pulong',

    // Footer
    footer_tagline: 'Santuwaryo to batasan wey kagi to mgo Agusan Manobo. Igpatuman to pagsaliksik wey pagtahud to kultura.',
    footer_nav_heading: 'PAG-AGI',
    footer_nav_explorer: 'Pagsusi to Arkibo',
    footer_nav_rules: 'Mgo Balaod to Pagbahin-bahin',
    footer_nav_about: 'Bahin to Arkibo',
    footer_nav_ethics: 'Pagtahud to Batasan',
    footer_contact_heading: 'PAKIG-UBAY',
    footer_location: 'Agusan del Sur, Pilipinas',
    footer_language_heading: 'PILI TO PULONG',
    footer_rights: 'Tig-angkon to tanan nga katungod.',
    footer_privacy: 'Balaod to Pribado',
    footer_terms: 'Mgo Kasabutan to Serbisyo',
    footer_ethical_access: 'Balaod to Matarung nga Paggamit',

    // Home Hero & Stats
    hero_badge: 'PAGBANTAY TO KABILIN',
    hero_title_1: 'Pagbantay to Kagi to',
    hero_title_2: 'Agusan Manobo',
    hero_desc: 'Sabononganan to kabilin para to matarung no pagbahin-bahin, pag-amping to kagi, wey pagtahud to daan no batasan wey kanta to mgo Agusan Manobo dio to Agusan del Sur, Pilipinas.',
    hero_search_placeholder: 'Pamiling pinaagi to ngaran, matang to kagi, o pulong no Minanubu...',
    btn_browse_archive: 'Susia to Arkibo',
    btn_classification_rules: 'Pagbahin-bahin Sumala to Balaod',
    btn_system_taxonomy: 'Kay-agan wey Taksonomiya to Sistema',
    stat_preserved_entries: 'Naitago no mgo Kasulatan',
    stat_oral_literature: 'Pasalita no Kabilin',
    stat_folk_songs: 'Mgo Kanta to Tribu',
    stat_municipalities: 'Mgo Lungsod',
    section_featured_title: 'Mgo Pinili no Kasulatan wey Kanta',
    section_featured_subtitle: 'Tutuut no daan no kagi no nakasulat wey napamatud-an to mgo maabtik no magulang to tribu.',
    listen_audio: 'Paminug to Tingog',
    read_text: 'Basa to Kasulatan',
    view_details: 'Ahaha to Detalye',

    // Translator Tool
    translator_title: 'Taghubad to Kagi no Minanubu',
    translator_subtitle: 'Ighubad to mgo pulong wey tudling tali to Minanubu to Agusan, Iningles, Bisaya, wey Tagalog. Igkuha to mgo hubad dio to napamatud-an no kasulatan wey daan no diksiyonaryo.',
    translator_source_label: 'PUNOAN NO PULONG',
    translator_target_label: 'PADULNGAN NO PULONG',
    translator_input_placeholder: 'Isulat to pulong o tudling no ighubad...',
    translator_btn_translate: 'Ighubad Nointo',
    translator_btn_translating: 'Ighubad pad...',
    translator_result_title: 'Gawas to Hinubad',
    translator_copy: 'Kopyaha',
    translator_copied: 'Nakopya on!',
    translator_confidence: 'Pagsalig',
    translator_source_info: 'Punoan no Kasulatan',
    translator_swap: 'Ilisi to Pulong',
    translator_clear: 'Hawaa',
    translator_lexicon_title: 'Mgo Napamatud-an no Pulong to Kabilin',
    translator_lexicon_desc: 'Tuoka to bisan nokoy no pulong agon madali no mahubad o maahaw to kahulugan to batasan.',
    chars_count: 'mgo letra',

    // Classification Page
    classification_title: 'Pagbahin-bahin wey Batasan to Pasalitang Panitikan',
    classification_subtitle: 'Mgo balaod to pagbahin-bahin sumala ki Damiana Eugenio (1993) wey E. Andress (1985).',
    classification_rules_heading: 'Mgo Balaod to Pagbahin-bahin wey Taksonomiya',
    classification_search_placeholder: 'Pamiling to taksonomiya, kategorya ni Eugenio, o balaod ni Andress...',
    view_literature: 'Ahaha to Panitikan',

    // Explorer Page
    explorer_title: 'Pagsusi to Arkibo',
    explorer_subtitle: 'Ahaha to mgo naitago no gugud, kanta to tribu, antoka, wey panultihon.',
    filter_all: 'Tanan',
    filter_genre: 'Matang',
    filter_municipality: 'Lungsod',
    search_no_results: 'Warad nakita no kabilin sumala to impamiling nu.',

    // Common UI
    current_language: 'Pinalabi no Pulong',
    active: 'Aktibo',
    ml_active_badge: 'ML Pagbahin-bahin: Aktibo (Webonary Lexicon v2.0.0)',
  },
} as const

export type TranslationKey = keyof (typeof translations)['en']
