import { Language, languages } from './useLanguageSwitch'
import { LanguageButton } from './languageButton'

interface LanguageSwitchTabsProps {
  currentLanguage: Language
  setCurrentLanguage: (lang: Language) => void
}

export const LanguageSwitchTabs = ({
  currentLanguage,
  setCurrentLanguage,
}: LanguageSwitchTabsProps) => {
  return (
    <section className="flex justify-evenly">
      {languages.map((lang) => (
        <LanguageButton
          key={lang}
          languageKey={lang}
          isActive={currentLanguage === lang}
          onSelect={setCurrentLanguage}
        />
      ))}
    </section>
  )
}
