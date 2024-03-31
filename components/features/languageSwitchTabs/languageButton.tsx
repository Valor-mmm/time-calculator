import { Language } from './useLanguageSwitch'
import { getHumanReadableLanguage } from './utils'

interface LanguageButtonProps {
  languageKey: Language
  isActive: boolean
  onSelect: (language: Language) => void
}

export const LanguageButton = ({
  languageKey,
  isActive,
  onSelect,
}: LanguageButtonProps) => (
  <button
    className={`p-5 ${isActive ? 'dark:bg-cyan-600' : 'dark:bg-gray-600'} rounded-md`}
    onClick={() => {
      onSelect(languageKey)
    }}
  >
    {getHumanReadableLanguage(languageKey)}
  </button>
)
