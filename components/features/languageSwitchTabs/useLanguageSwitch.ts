'use client'

import { useSyncExternalStore } from 'react'

export const languages = ['de-DE', 'en-EN'] as const
export type Language = (typeof languages)[number]

const defaultLanguage: Language = 'en-EN'
const languageStorageKey = 'TimeCalculator_Language'

const isSupported = (value: string): value is Language =>
  (languages as readonly string[]).includes(value)

const getLanguageFromBrowser = (): Language => {
  const storedLanguage = window.localStorage.getItem(languageStorageKey)

  if (storedLanguage && isSupported(storedLanguage)) {
    return storedLanguage
  }

  const browserLanguages: unknown = navigator.languages

  if (Array.isArray(browserLanguages)) {
    return browserLanguages.find(isSupported) ?? defaultLanguage
  }

  return typeof browserLanguages === 'string' && isSupported(browserLanguages)
    ? browserLanguages
    : defaultLanguage
}

/**
 * The store is the single source of truth for the active language. It seeds
 * itself lazily from localStorage / the browser on first read, so the value
 * handed to React and the value compared against in `setLanguage` can never
 * drift apart.
 */
const createLanguageStore = () => {
  let currentLanguage: Language | undefined
  const subscribers = new Set<() => void>()

  const getSnapshot = (): Language => {
    if (currentLanguage === undefined) {
      try {
        currentLanguage = getLanguageFromBrowser()
      } catch {
        currentLanguage = defaultLanguage
      }
    }

    return currentLanguage
  }

  return {
    subscribe: (callback: () => void) => {
      subscribers.add(callback)
      return () => {
        subscribers.delete(callback)
      }
    },
    getSnapshot,
    getServerSnapshot: () => defaultLanguage,
    setLanguage: (newLanguage: Language) => {
      if (getSnapshot() === newLanguage) {
        return
      }

      currentLanguage = newLanguage

      try {
        window.localStorage.setItem(languageStorageKey, newLanguage)
      } catch {
        // Persisting the choice is best effort; the session still switches.
      }

      subscribers.forEach((callback) => {
        callback()
      })
    },
  }
}

const languageStore = createLanguageStore()

export const useLanguageSwitch = (): [Language, (lang: Language) => void] => {
  const language = useSyncExternalStore<Language>(
    languageStore.subscribe,
    languageStore.getSnapshot,
    languageStore.getServerSnapshot,
  )

  return [language, languageStore.setLanguage]
}
