'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Language, SUPPORTED_LANGUAGES, translations, TranslationKey, LanguageOption } from '@/lib/i18n/translations'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
  languages: LanguageOption[]
  currentOption: LanguageOption
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'manobolit_language'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null
      if (stored && (stored === 'en' || stored === 'fil' || stored === 'ceb' || stored === 'msm')) {
        setLanguageState(stored)
        document.documentElement.setAttribute('lang', stored)
      }
    } catch {
      // Ignore localStorage access errors (e.g. private mode)
    }
  }, [])

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
      document.documentElement.setAttribute('lang', newLang)
    } catch {
      // Ignore
    }
  }

  const t = (key: TranslationKey): string => {
    const langDict = translations[language] || translations.en
    return (langDict as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key
  }

  const currentOption = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0]

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentOption,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
