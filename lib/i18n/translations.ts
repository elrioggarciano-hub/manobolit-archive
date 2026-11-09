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
    footer_language_heading: 'LANGUAGE / WIKA',
    footer_rights: 'All rights reserved.',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_ethical_access: 'Ethical Access Policy',

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

    // Common UI
    current_language: 'Pinalabi no Pulong',
    active: 'Aktibo',
    ml_active_badge: 'ML Pagbahin-bahin: Aktibo (Webonary Lexicon v2.0.0)',
  },
} as const

export type TranslationKey = keyof (typeof translations)['en']
