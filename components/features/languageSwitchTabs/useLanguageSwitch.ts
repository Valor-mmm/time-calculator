'use client'

import { useSyncExternalStore } from 'react'

export const languages = ['de-DE', 'en-EN'] as const
export type Language = (typeof languages)[number]

const languageStorageKey = 'TimeCalculator_Language'

const getLanguageFromBrowser = (): Language => {
  const storedLanguage = window.localStorage.getItem(
    languageStorageKey,
  ) as Language | null

  if (storedLanguage && languages.includes(storedLanguage)) {
    return storedLanguage
  }

  const browserLanguages = navigator.languages as
    | Readonly<Language>
    | Readonly<Language[]>

  if (Array.isArray(browserLanguages)) {
    const firstMatchedLang = browserLanguages.find((language) =>
      languages.includes(language as Language),
    )
    return (firstMatchedLang as Language) ?? 'en-EN'
  }

  const languageString = browserLanguages as Readonly<Language>
  return languages.includes(languageString) ? languageString : 'en-EN'
}

// Create a store for language
const createLanguageStore = () => {
  let currentLanguage = 'en-EN' as Language

  const subscribers = new Set<() => void>()

  return {
    subscribe: (callback: () => void) => {
      subscribers.add(callback)
      return () => subscribers.delete(callback)
    },
    getSnapshot: () => currentLanguage,
    setLanguage: (newLanguage: Language) => {
      if (currentLanguage === newLanguage) return

      currentLanguage = newLanguage
      window.localStorage.setItem(languageStorageKey, newLanguage)
      subscribers.forEach((callback) => callback())
    },
  }
}

const languageStore = createLanguageStore()

export const useLanguageSwitch = (): [Language, (lang: Language) => void] => {
  const language = useSyncExternalStore<Language>(
    languageStore.subscribe,
    () => {
      try {
        return getLanguageFromBrowser()
      } catch {
        return 'en-EN'
      }
    },
    () => 'en-EN', // Server-side snapshot
  )

  return [language, languageStore.setLanguage]
}
