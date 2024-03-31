import { useEffect, useState } from 'react'

export const languages = ['de-DE', 'en-EN'] as const
export type Language = (typeof languages)[number]

const languageStorageKey = 'TimeCalculator_Language'

export const useLanguageSwitch = (): [Language, (lang: Language) => void] => {
  const [language, setLanguage] = useState<Language>('en-EN')

  useEffect(() => {
    const storedLanguage: Language | null = window.localStorage.getItem(
      languageStorageKey,
    ) as Language | null

    if (storedLanguage) {
      setLanguage(storedLanguage)
      return
    }

    const browserLanguages: Readonly<Language> | Readonly<Language[]> =
      navigator.languages as Readonly<Language> | Readonly<Language[]>

    if (Array.isArray(browserLanguages)) {
      const firstMatchedLang = browserLanguages.find((language) =>
        languages.includes(language),
      )
      setLanguage(firstMatchedLang ?? 'en-EN')
    } else {
      const languageString = browserLanguages as Readonly<Language>
      setLanguage(languages.includes(languageString) ? languageString : 'en-EN')
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language)
  }, [language])

  return [language, setLanguage]
}
