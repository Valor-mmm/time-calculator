import { Language } from './useLanguageSwitch'

export const getHumanReadableLanguage = (language: Language) => {
  switch (language) {
    case 'de-DE':
      return 'Deutsch'
    case 'en-EN':
      return 'English'
  }
}
