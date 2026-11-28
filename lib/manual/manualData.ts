export interface ManualStep {
  number: number
  label: string
  instruction: string
}

export interface ManualSection {
  id: string
  sectionNumber: string
  title: string
  role: 'ALL' | 'PUBLIC' | 'ADMIN'
  whoUsesIt: string
  capabilities?: string[]
  menuLocation?: string[]
  description: string
  figureNumber?: number
  figureTitle?: string
  figureImage?: string
  figureAlt?: string
  steps?: ManualStep[]
  goodToKnow?: string[]
  contentHtml?: string
}

export interface ManualChapter {
  id: string
  chapterNumber: number
  title: string
  subtitle: string
  role: 'ALL' | 'PUBLIC' | 'ADMIN'
  summary: string
  sections: ManualSection[]
}

export const MANUAL_METADATA = {
  institution: 'AGUSAN DEL SUR STATE UNIVERSITY',
  college: 'College of Computing and Information Sciences',
  title: 'MANOBOLIT ARCHIVE: A RULE-BASED DIGITAL CLASSIFICATION AND RETRIEVAL SYSTEM FOR AGUSAN MANOBO ORAL LITERATURE AND FOLK SONG',
  shortTitle: 'ManoboLit Archive',
  subtitle: 'A Complete Step-by-Step User Manual and Operational Field Guide for Researchers, Students, and Cultural Administrators',
  version: '1.0',
  date: 'November 2026',
  authors: 'Research Team, ADSSU College of Computing and Information Sciences',
  beneficiary: 'Agusan Manobo Indigenous Communities & Agusan del Sur State University',
  language: 'English (with Filipino, Bisaya, and Agusan Manobo parallel documentation)',
  format: 'A4 Portrait, Modern Sans (Inter / Cormorant Garamond)',
  systemUrl: 'http://localhost:3000',
  corpusBaseline: '17 Oral Literature Selections (Catipay & Curato, 2024) and 5 Folk Songs (Maravilla, 2024)',
  taxonomies: 'Damiana L. Eugenio (1993) & George C. Andress (1985)',
  lexiconCorpus: 'SIL International Webonary (ISO 639-3: msm), ManoboLit Archive Lexicon & Agusan Manobo Bible (Kasuyatan to Diyus, 7,825 verses)',
}

export const MANUAL_CHAPTERS: ManualChapter[] = [
  {
    id: 'ch1',
    chapterNumber: 1,
    title: 'Introduction & System Framework',
    subtitle: 'Purpose, scope, research foundations, and user roles',
    role: 'ALL',
    summary: 'An introductory overview of the ManoboLit Archive system, its cultural and academic mandate, research origins, user roles, and how to utilize this manual.',
    sections: [
      {
        id: '1.1',
        sectionNumber: '1.1',
        title: 'Purpose of this Manual',
        role: 'ALL',
        whoUsesIt: 'Every visitor, researcher, student, cultural worker, and administrator.',
        capabilities: [
          'Understand the scientific and cultural mandate of the ManoboLit Archive',
          'Learn the features and workflows available to each user account role',
          'Follow step-by-step instructions accompanied by authentic system screenshots',
          'Navigate between digital exploration and computational research tools',
        ],
        description: 'This user manual is the definitive operational reference for the ManoboLit Archive system. It provides clear, role-appropriate, and step-by-step guidance on every feature—from searching bilingual folklore to performing computational morphological validation and executing administrator reviews.',
        goodToKnow: [
          'This system was designed under the principle of Free, Prior, and Informed Consent (FPIC) and the Indigenous Peoples Rights Act (IPRA / RA 8371).',
          'All instructions and screenshots correspond directly to the live, operational web application.',
        ],
      },
      {
        id: '1.2',
        sectionNumber: '1.2',
        title: 'About the ManoboLit Archive System',
        role: 'ALL',
        whoUsesIt: 'All users.',
        description: 'The ManoboLit Archive is an advanced digital repository and computational linguistics platform dedicated to the preservation, classification, and retrieval of the oral literature and folk songs of the Agusan Manobo people of Agusan del Sur, Philippines. Genres (Eugenio, 1993) and themes (Andress, 1985) are classified by a rule-based engine whose rule base is stored in the database and grows through rule terms discovered from verified entries, combined 50/50 with machine-learning models that learn from human-verified entries (a Logistic Regression classifier trained in Google Colab, and a k-nearest-neighbour memory for themes). Translation and lexical validation combine a database lexicon, finite-state morphological validation against the SIL International Webonary dictionary, and word translations learned from verified texts.',
        goodToKnow: [
          'Baseline corpus: 17 authentic oral literature pieces collected by Catipay & Curato (2024) and 5 folk songs collected by Maravilla (2024).',
          'Geographic provenance of the baseline corpus: Bunawan (Brgy. San Andres) and Trento (Brgy. Tudela and Sta. Maria), Agusan del Sur.',
        ],
      },
      {
        id: '1.3',
        sectionNumber: '1.3',
        title: 'User Roles & Access Hierarchy',
        role: 'ALL',
        whoUsesIt: 'All users.',
        description: 'The system implements two distinct user tiers to balance open cultural education with institutional governance:',
        goodToKnow: [
          'Public Visitor / Cultural Researcher: Unauthenticated open access to all exploratory, analytical, classification, and translation modules with CSV/JSON exports.',
          'Cultural Archive Administrator: Authenticated access via master credentials, granting entry curation, audio ingestion, ML review, and model retraining privileges.',
        ],
      },
      {
        id: '1.4',
        sectionNumber: '1.4',
        title: 'How to Read the Figures and Steps',
        role: 'ALL',
        whoUsesIt: 'All users.',
        description: 'Every chapter contains authentic system screenshots annotated with bright red numbered circles (❶, ❷, ❸). Each circle corresponds to the numbered step directly beneath the picture.',
        goodToKnow: [
          'Red circled numbers in figures match the numbered step titles below.',
          'Bold text in steps indicates an exact button, field, or menu name visible on screen.',
          'Yellow "Good to know" callout boxes highlight important tips, cultural protocols, and edge cases.',
        ],
      },
      {
        id: '1.5',
        sectionNumber: '1.5',
        title: 'System Requirements & Technical Support',
        role: 'ALL',
        whoUsesIt: 'All users.',
        description: 'The ManoboLit Archive is a responsive, web-based platform. It operates seamlessly on any modern web browser without requiring external software installations.',
        goodToKnow: [
          'Recommended desktop browsers: Google Chrome 100+, Mozilla Firefox 100+, Apple Safari 15+, or Microsoft Edge.',
          'Mobile compatibility: Fully responsive on iOS Safari and Android Chrome with adaptive touch drawer menus.',
          'Audio requirements: HTML5 Audio compliant browser with stereo speakers or headphones for high-fidelity cultural field recordings.',
          'Technical support email: preservation@manobolit.org',
        ],
      },
    ],
  },
  {
    id: 'ch2',
    chapterNumber: 2,
    title: 'Getting Started: Portal Navigation & Overview',
    subtitle: 'Navigating the top bar, appearance settings, language options, and mobile access',
    role: 'ALL',
    summary: 'Detailed instructions on exploring the user portal, using the global header, switching languages, toggling dark/light mode, and understanding mobile drawers.',
    sections: [
      {
        id: '2.1',
        sectionNumber: '2.1',
        title: 'Global Header and Main Navigation Bar',
        role: 'ALL',
        whoUsesIt: 'Every visitor and administrator.',
        capabilities: [
          'Navigate instantly to any core module from any page in the system',
          'Execute quick searches across titles and keywords from the header bar',
          'Switch interface language between English, Tagalog, Bisaya, and Agusan Manobo',
          'Toggle between High-Contrast Dark Mode and Academic Light Mode',
          'Access the Administrator sign-in portal',
        ],
        menuLocation: ['Top navigation bar on every page'],
        description: 'The global navigation header is pinned to the top of every screen. It provides persistent access to the system logo, primary module links, quick search, appearance controls, and the administrative gateway.',
        figureNumber: 1,
        figureTitle: 'The ManoboLit Archive Home Page and Global Navigation Header',
        figureImage: '/manual/screenshots/fig1_home.png',
        figureAlt: 'System home page showing header, search, theme toggles, and hero section',
        steps: [
          {
            number: 1,
            label: 'ManoboLit Archive Brand Logo',
            instruction: 'Click the serif title "ManoboLit Archive" from any page to return immediately to the portal homepage.',
          },
          {
            number: 2,
            label: 'Primary Module Navigation Links',
            instruction: 'Click on EXPLORER, CLASSIFICATION, TRANSLATOR, DASHBOARD, ABOUT, or USER MANUAL to navigate directly to that functional area.',
          },
          {
            number: 3,
            label: 'Quick Search & Language Selector',
            instruction: 'Type keywords into the search box and press Enter to search the archive, or click the language pill to switch interface languages.',
          },
          {
            number: 4,
            label: 'Administrator Gateway Circle',
            instruction: 'Click the circular user icon with the red border to open the secure Administrator Authentication portal.',
          },
          {
            number: 5,
            label: 'Hero Exploration Action',
            instruction: 'Click "Explore Archive" on the homepage banner to instantly launch the full multidimensional archive collection.',
          },
        ],
        goodToKnow: [
          'On mobile screens, the menu items condense into a responsive hamburger drawer (☰) at the top right.',
          'Your preferred theme (Dark or Light) and selected language are saved in your browser localStorage and persist across sessions.',
        ],
      },
      {
        id: '2.2',
        sectionNumber: '2.2',
        title: 'Switching Languages and Visual Themes',
        role: 'ALL',
        whoUsesIt: 'All users.',
        description: 'The ManoboLit Archive supports four localized linguistic interfaces and dual academic color themes to accommodate diverse research environments.',
        goodToKnow: [
          'Supported Languages: English (EN), Filipino / Tagalog (FIL), Sinugbuanong Binisaya (CEB), and Minanubu / Agusan Manobo (MSM).',
          'Light Mode features high-contrast ivory backgrounds with deep crimson accents for scholarly reading.',
          'Dark Mode utilizes low-glare slate and obsidian surfaces for comfortable archival analysis.',
        ],
      },
    ],
  },
  {
    id: 'ch3',
    chapterNumber: 3,
    title: 'Cultural Archive & Multidimensional Discovery',
    subtitle: 'Browsing, searching, filtering, audio playback, and reading parallel texts',
    role: 'PUBLIC',
    summary: 'Learn how to explore the archived Agusan Manobo oral literature and folk songs, apply multi-criteria filters, search full transcriptions, and listen to the field audio recordings.',
    sections: [
      {
        id: '3.1',
        sectionNumber: '3.1',
        title: 'Multidimensional Archive Explorer & Filtering',
        role: 'PUBLIC',
        whoUsesIt: 'Cultural researchers, students, educators, and the public.',
        capabilities: [
          'Filter entries by Literary Form (Oral Literature vs Folk Song)',
          'Filter by Eugenio (1993) and Andress (1985) Genres (Myth, Legend, Folktale, Epic, Song, etc.)',
          'Filter by geographic provenance (the municipalities and barangays recorded in the archive)',
          'Search across titles, storytellers, collectors, and keywords in real time',
          'Launch audio playback directly from entry cards',
        ],
        menuLocation: ['Header -> EXPLORER (/explore)'],
        description: 'The Explorer module (/explore) provides an interactive catalog of all archived entries. It features multidimensional facets enabling researchers to pinpoint specific cultural forms and regional variants.',
        figureNumber: 2,
        figureTitle: 'The Multidimensional Archive Explorer with Search and Faceted Filters',
        figureImage: '/manual/screenshots/fig2_explore.png',
        figureAlt: 'Archive Explorer page showing search field, genre chips, provenance dropdown, and entry cards',
        steps: [
          {
            number: 1,
            label: 'Search Archive Field',
            instruction: 'Enter a keyword, title (e.g., "Pilanduk", "Baybayanon"), storyteller, or theme into the search box. The catalog updates instantly.',
          },
          {
            number: 2,
            label: 'Literary Form Selector',
            instruction: 'Toggle between "All Works", "Oral Literature", and "Folk Song".',
          },
          {
            number: 3,
            label: 'Genre Taxonomy Filter Chips',
            instruction: 'Click any genre chip (Myth, Legend, Folktale, Epic, Song, Chant) to filter the entries based on Eugenio and Andress criteria.',
          },
          {
            number: 4,
            label: 'Geographic Provenance Dropdown',
            instruction: 'Select a municipality or barangay (listed from the places recorded in the archive) to view folklore native to that community.',
          },
          {
            number: 5,
            label: 'Archival Entry Card & Audio Trigger',
            instruction: 'Click on any card title to open its full tri-lingual detail page, or click the audio icon to begin immediate audio playback.',
          },
        ],
        goodToKnow: [
          'Multiple filters can be combined simultaneously (e.g., Folk Songs from one barangay).',
          'Click the "Clear All Filters" button whenever you wish to restore the full catalog view.',
        ],
      },
      {
        id: '3.2',
        sectionNumber: '3.2',
        title: 'Entry Detail View, Audio Playback & Tri-Lingual Transcriptions',
        role: 'PUBLIC',
        whoUsesIt: 'Linguists, cultural researchers, and students.',
        capabilities: [
          'Listen to high-fidelity audio recordings captured during field fieldwork',
          'Read original Agusan Manobo field transcriptions line-by-line',
          'Compare parallel translations in English and Sinugbuanong Binisaya',
          'Inspect provenance metadata, storyteller attribution, and collector details',
          'Review computational classification metrics and AI confidence scores',
        ],
        menuLocation: ['Explorer -> Click on any literature card (/archive/[id])'],
        description: 'The Entry Detail page displays the complete cultural and linguistic record for an individual selection. It features an audio player accompanied by the full transcription and side-by-side parallel columns.',
        figureNumber: 3,
        figureTitle: 'Literary Entry Detail View with Audio Playback and Parallel Transcriptions',
        figureImage: '/manual/screenshots/fig3_detail.png',
        figureAlt: 'Detail page showing audio player, Agusan Manobo text, and English/Bisaya parallel columns',
        steps: [
          {
            number: 1,
            label: 'Title & Geographic Provenance Header',
            instruction: 'Review the primary title, native alternative title, and verified provenance badge (Municipality, Barangay, and Province).',
          },
          {
            number: 2,
            label: 'Interactive Audio Player Bar',
            instruction: 'Click the Play/Pause button to listen to the field recording. Drag the waveform scrubber to jump to specific stanzas or adjust playback speed.',
          },
          {
            number: 3,
            label: 'Agusan Manobo Original Transcription',
            instruction: 'Examine the authentic phonetic transcription of the oral literature as recited by the indigenous informant.',
          },
          {
            number: 4,
            label: 'Parallel English and Bisaya Translation Columns',
            instruction: 'Read verified parallel translations verified against the SIL Agusan Manobo linguistic corpus and academic fieldwork notes.',
          },
          {
            number: 5,
            label: 'Linguistic & Taxonomic Metadata Panel',
            instruction: 'Inspect the classification provenance, including the assigned Eugenio/Andress genre, confidence score, and model verification status.',
          },
        ],
        goodToKnow: [
          'The persistent bottom audio player remains active as you browse between different pages.',
          'Audio recordings preserve authentic vocal intonations, melodic contours, and native dialectal phonology.',
        ],
      },
    ],
  },
  {
    id: 'ch4',
    chapterNumber: 4,
    title: 'Hybrid Classification Engine Workbench',
    subtitle: 'Pattern-based rules, supervised machine learning, and semantic LLM inference',
    role: 'ALL',
    summary: 'A complete guide to the classification module: the rule-based engine (Eugenio and Andress) combined with machine learning, the individual rule and model views shown for comparison, and how to interpret model diagnostics.',
    sections: [
      {
        id: '4.1',
        sectionNumber: '4.1',
        title: 'Running Classifications in the Interactive Workbench',
        role: 'ALL',
        whoUsesIt: 'Linguistics researchers, folklore scholars, students, and administrators.',
        capabilities: [
          'Paste or type any Agusan Manobo oral narrative or song lyric for instant classification',
          'Load pre-populated sample literature selections from the baseline corpus',
          'Compare the rule-based scores with the machine-learning models',
          'View predicted Genre, Primary Theme, and statistical Confidence percentage',
          'Inspect exact pattern rule triggers, morphological markers, and TF-IDF term weights',
        ],
        menuLocation: ['Header -> CLASSIFICATION (/classification)'],
        description: 'The Hybrid Classification Workbench (/classification) is an experimental and analytical tool that tests raw text against computational taxonomic models based on Damiana Eugenio (1993) and George Andress (1985).',
        figureNumber: 4,
        figureTitle: 'Hybrid Classification Engine Workbench with Model Selector and Evidence Breakdown',
        figureImage: '/manual/screenshots/fig4_classification.png',
        figureAlt: 'Classification workbench showing text area, mode tabs, classify button, and prediction cards',
        steps: [
          {
            number: 1,
            label: 'Literature Text Input Area',
            instruction: 'Paste the Agusan Manobo transcription into the text area, or click "Load Sample Entry" to test an authenticated archive record.',
          },
          {
            number: 2,
            label: 'Classification Engine Mode Selector',
            instruction: 'Choose which view to inspect: Rule-Based + ML (default, the system decision), the rule scores alone, or an individual learned model (Naive Bayes, TF-IDF, Character N-gram, k-NN).',
          },
          {
            number: 3,
            label: 'Classify Literary Entry Action',
            instruction: 'Click the crimson "Classify Entry" button to initiate lexical tokenization and classification.',
          },
          {
            number: 4,
            label: 'Prediction Output Cards',
            instruction: 'Review the predicted primary Genre badge (e.g., FOLKTALE, SONG), primary Thematic tag, and calculated Confidence Score.',
          },
          {
            number: 5,
            label: 'Diagnostic Reasoning & Feature Weights',
            instruction: 'Expand the explanation drawer to examine matched pattern rules, morphological affix indicators, and top TF-IDF vocabulary weights.',
          },
        ],
        goodToKnow: [
          'Pattern-Based mode relies strictly on deterministic lexical and syntactic indicators formulated from Eugenio (1993).',
          'Supervised ML mode calculates term frequencies normalized by inverse document frequency over the human-verified training entries.',
          'Neural Semantic mode performs deep zero-shot contextual analysis using neural linguistic models with full prompt transparency.',
        ],
      },
    ],
  },
  {
    id: 'ch5',
    chapterNumber: 5,
    title: 'Computational Lexicon & Translation Workbench',
    subtitle: 'Dynamic bidirectional translation, finite-state affix decomposition, and corpus cross-referencing',
    role: 'ALL',
    summary: 'Instructions on utilizing the dynamic translation engine, performing word-level morphological validation using finite-state decomposition, and verifying tokens against the SIL Webonary dictionary.',
    sections: [
      {
        id: '5.1',
        sectionNumber: '5.1',
        title: 'Executing Translations & Morphological Validation',
        role: 'ALL',
        whoUsesIt: 'Linguists, Agusan Manobo speakers, students, and cultural translators.',
        capabilities: [
          'Translate text between Agusan Manobo, English, and Sinugbuanong Binisaya',
          'Execute word-by-word Finite-State Affix Decomposition for morphological analysis',
          'Cross-reference tokens with the official SIL International Webonary (ISO 639-3: msm) dictionary',
          'Validate words against the archive lexicon, the SIL Webonary entries and the Agusan Manobo Bible',
          'Copy translations with one click for research documentation',
        ],
        menuLocation: ['Header -> TRANSLATOR (/translator)'],
        description: 'The Translation Workbench (/translator) provides intelligent bi-directional translation coupled with an authentic morphological validation engine. It dissects complex agglutinative Manobo words into prefixes, infixes, roots, and suffixes.',
        figureNumber: 5,
        figureTitle: 'Dynamic Translator and Word-Level Morphological Affix Decomposition Workbench',
        figureImage: '/manual/screenshots/fig5_translator.png',
        figureAlt: 'Translator page showing source box, translation output, and morphological analysis table',
        steps: [
          {
            number: 1,
            label: 'Language Direction Switcher',
            instruction: 'Select your translation direction: Agusan Manobo → English, Agusan Manobo → Bisaya, or English → Agusan Manobo.',
          },
          {
            number: 2,
            label: 'Source Text Input Box',
            instruction: 'Type or paste the sentence or verse to translate. The system displays word and character metrics.',
          },
          {
            number: 3,
            label: 'Translate & Validate Button',
            instruction: 'Click the crimson "Translate & Validate" button. The engine parses lexical tokens through the database dictionary.',
          },
          {
            number: 4,
            label: 'Parallel Translation Output',
            instruction: 'Read the translated text. Click the copy icon to copy the verified translation to your clipboard.',
          },
          {
            number: 5,
            label: 'Morphological Affix Decomposition Table',
            instruction: 'Inspect the decomposed words below the output. Review identified prefixes (e.g., mig-, og-, ka-), infixes (-in-, -um-), root words, and SIL Webonary validation status.',
          },
        ],
        goodToKnow: [
          'Green "Verified Corpus" badges indicate the word was directly matched against the Webonary and archive lexicon records in the database.',
          'Blue "Morphologically Validated" badges indicate the word root was successfully isolated via Finite-State Affix rules.',
        ],
      },
    ],
  },
  {
    id: 'ch6',
    chapterNumber: 6,
    title: 'Interactive Analytics Dashboard & Data Export',
    subtitle: 'Corpus distribution charts, geographic provenance mapping, and CSV/JSON downloads',
    role: 'PUBLIC',
    summary: 'How to utilize the analytics dashboard, explore statistical visualizations of genres and themes across Agusan del Sur municipalities, and export cultural data.',
    sections: [
      {
        id: '6.1',
        sectionNumber: '6.1',
        title: 'Corpus Statistics, Provenance Map & Data Export',
        role: 'PUBLIC',
        whoUsesIt: 'Cultural researchers, statisticians, university faculty, and students.',
        capabilities: [
          'View aggregate metrics (Total Works, Oral Literature, Folk Songs, Municipalities)',
          'Analyze dynamic distribution charts for Genres and Themes',
          'Explore geographic distribution across Agusan del Sur municipalities',
          'Export complete archive metadata in CSV format for spreadsheet analysis',
          'Export structured datasets in JSON format for computational linguistics research',
        ],
        menuLocation: ['Header -> DASHBOARD (/dashboard)'],
        description: 'The Analytics Dashboard (/dashboard) offers high-level empirical views into the archival holdings. It provides real-time aggregations and open-data export capabilities for cultural preservation.',
        figureNumber: 6,
        figureTitle: 'Interactive Analytics Dashboard with Frequency Charts and Data Export Controls',
        figureImage: '/manual/screenshots/fig6_dashboard.png',
        figureAlt: 'Analytics Dashboard showing summary statistics, distribution charts, and export buttons',
        steps: [
          {
            number: 1,
            label: 'Archive Corpus Aggregate Metrics',
            instruction: 'Review the high-level summary cards showing total cataloged works, oral literature count, folk songs, and surveyed municipalities (computed live from the archive).',
          },
          {
            number: 2,
            label: 'Export to CSV & JSON Buttons',
            instruction: 'Click "Export CSV" to download spreadsheet-ready tabular data, or "Export JSON" to download machine-readable structured records.',
          },
          {
            number: 3,
            label: 'Genre Frequency Distribution Chart',
            instruction: 'Hover over chart bars to view exact frequency counts and percentages for Folktales, Songs, Riddles, Epics, and Proverbs.',
          },
          {
            number: 4,
            label: 'Thematic Distribution Visualization',
            instruction: 'Examine common cultural motifs (e.g., Cleverness, Nature Spirits, Courtship, Agrarian Life) represented across the corpus.',
          },
          {
            number: 5,
            label: 'Municipal Provenance Geographic Breakdown',
            instruction: 'Study the distribution of folklore across the Agusan del Sur municipalities and barangays recorded in the archive.',
          },
        ],
        goodToKnow: [
          'Exports include comprehensive metadata: IDs, titles, genres, municipalities, collectors, informants, and parallel text snippets.',
          'Export files are formatted using standard UTF-8 encoding to preserve native orthographic diacritics and glottal stops.',
        ],
      },
    ],
  },
  {
    id: 'ch7',
    chapterNumber: 7,
    title: 'Administrator Portal & Content Governance',
    subtitle: 'Curator authentication, entry management, audio uploads, ML review, and retraining',
    role: 'ADMIN',
    summary: 'A comprehensive operational guide for archive administrators and cultural curators: managing records, uploading field audio, conducting classification audits, and executing ML retraining.',
    sections: [
      {
        id: '7.1',
        sectionNumber: '7.1',
        title: 'Administrator Authentication & Security',
        role: 'ADMIN',
        whoUsesIt: 'Authorized Cultural Curators and Academic Project Leads.',
        capabilities: [
          'Authenticate securely using the institutional master administrator credentials',
          'Receive cryptographically signed HMAC SHA-256 session tokens',
          'Maintain authorized administrative session for 7 days with automatic expiration',
        ],
        menuLocation: ['Header -> Circular Admin Icon (/admin/login)'],
        description: 'Access to administrative operations is restricted to authorized curators. The authentication gateway validates credentials against system environment secrets and issues an encrypted cookie session.',
        figureNumber: 7,
        figureTitle: 'Administrator Authentication Portal and Session Gateway',
        figureImage: '/manual/screenshots/fig7_admin_login.png',
        figureAlt: 'Admin login page with password field, sign in button, and security notice',
        steps: [
          {
            number: 1,
            label: 'Authentication Card Header',
            instruction: 'Confirm you are accessing the authorized administrative gateway for the ManoboLit Archive.',
          },
          {
            number: 2,
            label: 'Master Password Input Field',
            instruction: 'Enter the master administrator password assigned to your institutional role.',
          },
          {
            number: 3,
            label: 'Sign In as Curator Action',
            instruction: 'Click the crimson "Sign In as Curator" button to verify credentials and access the dashboard.',
          },
          {
            number: 4,
            label: 'Security & Audit Trail Notice',
            instruction: 'Note that all administrative actions, data edits, and retraining runs are permanently logged for institutional accountability.',
          },
        ],
        goodToKnow: [
          'Only authorized cultural curators possess administrative credentials.',
          'Sessions automatically expire after 7 days of inactivity, requiring re-authentication.',
        ],
      },
      {
        id: '7.2',
        sectionNumber: '7.2',
        title: 'Archive Inventory Management & Controls',
        role: 'ADMIN',
        whoUsesIt: 'Archive Administrators.',
        capabilities: [
          'Manage the full cultural literature inventory in a centralized dashboard',
          'Filter entries by form, genre, or search across municipalities',
          'Initiate new entry creation via the "+ New Entry" action',
          'Edit existing metadata, transcriptions, translations, and audio links',
          'Safely delete obsolete or unverified drafts with confirmation modals',
        ],
        menuLocation: ['/admin -> Archive Entries tab'],
        description: 'The Archive Entries tab (/admin) is the primary content control center. Administrators can oversee all archive records, inspect their verification state, and perform real-time updates.',
        figureNumber: 8,
        figureTitle: 'Administrator Management Dashboard and Archive Inventory Table',
        figureImage: '/manual/screenshots/fig8_admin_entries.png',
        figureAlt: 'Admin dashboard showing entries table, tabs, action buttons, and filters',
        steps: [
          {
            number: 1,
            label: 'Administrative Navigation Tabs',
            instruction: 'Switch between "Archive Entries", "Review Queue", "ML Pipeline", and "Dataset Management".',
          },
          {
            number: 2,
            label: '+ New Entry Action Button',
            instruction: 'Click the crimson "+ New Entry" button to launch the cultural cataloging form.',
          },
          {
            number: 3,
            label: 'Search and Filter Bar',
            instruction: 'Filter the inventory by Literary Type (Oral Literature / Folk Song) or search by title or municipality.',
          },
          {
            number: 4,
            label: 'Row Action Buttons (Edit / Delete)',
            instruction: 'Click "Edit" to modify an existing entry\'s text and audio, or click "Delete" to open the confirmation modal.',
          },
          {
            number: 5,
            label: 'Sign Out Action',
            instruction: 'Click "Sign Out" at the top right to safely terminate your administrative session.',
          },
        ],
        goodToKnow: [
          'Deleting an entry is permanent and requires explicit confirmation in the pop-up modal.',
          'Always verify audio file URLs before publishing new entries to ensure streaming playback functions.',
        ],
      },
      {
        id: '7.3',
        sectionNumber: '7.3',
        title: 'Cataloging New Literature & Folk Song Entries',
        role: 'ADMIN',
        whoUsesIt: 'Archive Administrators and Curators.',
        capabilities: [
          'Record comprehensive cultural metadata (Title, Native Title, Form, Genre, Themes)',
          'Assign precise geographic provenance down to the Agusan del Sur Barangay',
          'Attribute the indigenous storyteller/informant and field collector (Catipay, Curato, Maravilla)',
          'Ingest MP3 audio recording URLs or upload files',
          'Input parallel Agusan Manobo transcription, English translation, and Bisaya translation',
        ],
        menuLocation: ['/admin -> Click "+ New Entry" (/admin/new)'],
        description: 'The Archival Entry Creation form (/admin/new) captures rigorous ethnographic metadata conforming to international folklore archiving standards and IPRA ethical guidelines.',
        figureNumber: 9,
        figureTitle: 'Archival Entry Creation Form with Provenance and Audio Upload Fields',
        figureImage: '/manual/screenshots/fig9_admin_new.png',
        figureAlt: 'New entry form showing fields for title, genre, municipality, audio URL, and translations',
        steps: [
          {
            number: 1,
            label: 'Title and Native Alternative Title',
            instruction: 'Enter the recognized title and native Agusan Manobo dialectal name of the piece.',
          },
          {
            number: 2,
            label: 'Literary Form and Genre Classification',
            instruction: 'Select whether the work is Oral Literature or Folk Song, then choose the Eugenio/Andress genre.',
          },
          {
            number: 3,
            label: 'Geographic Provenance Fields',
            instruction: 'Specify the Agusan del Sur municipality and barangay provenance.',
          },
          {
            number: 4,
            label: 'Storyteller Attribution & Audio File URL',
            instruction: 'Document the name of the elder or singer who provided the narrative, and paste the audio file URL.',
          },
          {
            number: 5,
            label: 'Save to Cultural Archive Action',
            instruction: 'Enter the parallel transcriptions and click "Save to Cultural Archive" to publish the record immediately.',
          },
        ],
        goodToKnow: [
          'Every field entry is validated against Prisma schema constraints before committing to PostgreSQL.',
          'Newly saved entries become instantly available in the public Explorer and Analytics Dashboard.',
        ],
      },
      {
        id: '7.4',
        sectionNumber: '7.4',
        title: 'ML Classification Review Queue & Provenance Audit',
        role: 'ADMIN',
        whoUsesIt: 'Archive Administrators and Cultural Curators.',
        capabilities: [
          'Audit machine-predicted genres against human indigenous knowledge',
          'Review prediction confidence scores, rule explanations, and feature weights',
          'Click "Verify" to lock in approved classifications with timestamps',
          'Override machine predictions with curator-assigned correct genres',
        ],
        menuLocation: ['/admin -> Review Queue tab'],
        description: 'The Review Queue enables human-in-the-loop governance over automated AI classifications. Curators can review pending entries, inspect machine reasoning, and certify predictions.',
        goodToKnow: [
          'Verified entries are marked with a green verification badge in the public detail view.',
          'Human-verified records automatically feed into the training corpus for future model retraining snapshots.',
        ],
      },
      {
        id: '7.5',
        sectionNumber: '7.5',
        title: 'Machine Learning Retraining & Snapshot Versioning',
        role: 'ADMIN',
        whoUsesIt: 'System Administrators and Project Leads.',
        capabilities: [
          'Inspect active Naive Bayes vocabulary size and TF-IDF feature distributions',
          'Trigger model retraining across updated authenticated database records',
          'Generate timestamped model snapshots with version identifiers',
          'Audit training accuracy and cross-validation diagnostics',
        ],
        menuLocation: ['/admin -> ML Pipeline & Dataset tabs'],
        description: 'The ML Pipeline monitoring console enables continuous improvement of classification accuracy. Administrators can retrain the Naive Bayes model when new verified entries are cataloged.',
        goodToKnow: [
          'Retraining runs asynchronously and does not interrupt public search or audio playback.',
          'Active snapshot versions are permanently recorded in the database audit log.',
        ],
      },
    ],
  },
  {
    id: 'ch8',
    chapterNumber: 8,
    title: 'Appendix A: Cultural & Computational Glossary',
    subtitle: 'Taxonomic genres, linguistic terms, and machine learning definitions',
    role: 'ALL',
    summary: 'A reference glossary defining indigenous Agusan Manobo literary genres, grammatical affixes, morphological concepts, and machine learning metrics.',
    sections: [
      {
        id: '8.1',
        sectionNumber: '8.1',
        title: 'Taxonomic and Indigenous Literary Genres',
        role: 'ALL',
        whoUsesIt: 'All users.',
        description: 'Key genres defined by Damiana L. Eugenio (1993) and George C. Andress (1985) as represented in the Agusan del Sur baseline corpus:',
        goodToKnow: [
          'Folktale (Kuwit / Sugilanun): Prose narratives recounting adventures of clever characters (e.g., Pilanduk), animal tricksters, or everyday moral lessons.',
          'Folk Song (Gakit / Baybayanon): Traditional vocal melodies sung during community gatherings, courtship, harvest, or river navigation.',
          'Riddle (Antukey / Titigoon): Metaphorical interrogative oral puzzles used for intellectual entertainment and youth education.',
          'Epic (Tulalang / Ulahingan): Extended chanted poetic narratives detailing legendary ancestral heroes, spiritual journeys, and cosmic battles.',
          'Proverb (Panultihon): Concise traditional axioms conveying communal wisdom, ethical conduct, and respect for nature.',
        ],
      },
      {
        id: '8.2',
        sectionNumber: '8.2',
        title: 'Linguistic & Computational Terminology',
        role: 'ALL',
        whoUsesIt: 'All users.',
        description: 'Core computational and linguistic terms utilized across the system modules:',
        goodToKnow: [
          'Finite-State Affix Decomposition: A morphological parsing algorithm that peels off verbal prefixes (mig-, og-), infixes (-in-), and suffixes (-an, -on) to reveal root lexemes.',
          'ISO 639-3: msm: The international linguistic standard code designating the Agusan Manobo language.',
          'TF-IDF (Term Frequency - Inverse Document Frequency): A statistical measure evaluating how important a word is to a folklore entry relative to the entire archive.',
          'Multinomial Naive Bayes: A supervised probabilistic machine learning classifier that predicts genre based on term distribution probabilities.',
          'Semantic Classification: Using advanced neural language models to analyze deep cultural metaphors, contextual pragmatics, and implicit folklore themes.',
        ],
      },
    ],
  },
  {
    id: 'ch9',
    chapterNumber: 9,
    title: 'Appendix B: Troubleshooting & Frequently Asked Questions',
    subtitle: 'Solutions to common questions regarding audio playback, translation, and access',
    role: 'ALL',
    summary: 'Answers to frequently encountered questions and step-by-step troubleshooting procedures for audio streaming, translation queries, and administrator credentials.',
    sections: [
      {
        id: '9.1',
        sectionNumber: '9.1',
        title: 'Frequently Encountered Issues & Solutions',
        role: 'ALL',
        whoUsesIt: 'All users.',
        description: 'Common technical queries and their immediate solutions:',
        goodToKnow: [
          'Q: The audio does not play when I click the Play button. What should I do?\nA: Ensure your device volume is turned up. Verify your browser allows audio autoplay. If using mobile, tap the play icon a second time to initialize the audio context.',
          'Q: A specific Agusan Manobo word shows as "Morphologically Inferred" instead of "Verified Corpus". Why?\nA: The word is grammatically valid under finite-state affix rules, but does not yet exist verbatim in the 257 seeded Webonary records. It will be added during subsequent corpus updates.',
          'Q: Can I download the complete database for my thesis or research paper?\nA: Yes. Navigate to the Dashboard (/dashboard) and click "Export CSV" for Excel or "Export JSON" for computational linguistics processing.',
          'Q: I forgot the Administrator Master Password. How can I reset it?\nA: For institutional security, passwords cannot be recovered via public reset forms. Contact the ADSSU Project Lead or Lead System Administrator directly.',
        ],
      },
    ],
  },
  {
    id: 'ch10',
    chapterNumber: 10,
    title: 'Appendix C: System Menu & Route Quick Reference',
    subtitle: 'Directory of all active system URLs, actions, and authorized access tiers',
    role: 'ALL',
    summary: 'A fast lookup directory mapping every system URL route, menu label, and authorized user tier.',
    sections: [
      {
        id: '10.1',
        sectionNumber: '10.1',
        title: 'System Route Directory & Access Map',
        role: 'ALL',
        whoUsesIt: 'All users and developers.',
        description: 'Complete directory of operational routes in the ManoboLit Archive system:',
        goodToKnow: [
          '/ (Home): Portal overview, quick statistics, audio highlights, hero exploration. (Public)',
          '/explore: Multidimensional faceted archive search, genre filters, provenance selector. (Public)',
          '/archive/[id]: Full entry details, audio player, parallel translations. (Public)',
          '/classification: Interactive hybrid classification workbench (Rule, ML, LLM). (Public)',
          '/translator: Bidirectional translation with Finite-State Affix Decomposition. (Public)',
          '/dashboard: Statistical frequency charts, provenance map, CSV/JSON data export. (Public)',
          '/about: Scholarly research background, Catipay & Curato (2024), Maravilla (2024). (Public)',
          '/ethics: Indigenous Cultural Ethics, IPRA (RA 8371), FPIC compliance charter. (Public)',
          '/manual: Complete Digital User Manual and Interactive Help Center. (Public & Admin)',
          '/manual/print: High-fidelity printable and PDF export view. (Public & Admin)',
          '/admin/login: Secure master password authentication portal. (Public Gateway)',
          '/admin: Archive content management, entry list, review queue, retraining. (Admin Only)',
          '/admin/new: Ingest new oral literature or folk song with audio and parallel text. (Admin Only)',
          '/admin/[id]/edit: Modify existing archival records, audio URLs, and provenance. (Admin Only)',
        ],
      },
    ],
  },
]

