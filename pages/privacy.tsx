import Head from 'next/head'
import { FC } from 'react'
import { LanguageSwitchTabs } from '../components/features/languageSwitchTabs'
import { useLanguageSwitch } from '../components/features/languageSwitchTabs/useLanguageSwitch'
import { EnglishPrivacyPolicy } from '../components/features/legal/privacy/englishPrivacyPolicy'
import { GermanPrivacyPolicy } from '../components/features/legal/privacy/germanPrivacyPolicy'

const Privacy: FC = () => {
  const [lang, setLang] = useLanguageSwitch()
  return (
    <>
      <Head>
        <title>Time Calculator - Imprint</title>
      </Head>

      <LanguageSwitchTabs currentLanguage={lang} setCurrentLanguage={setLang} />
      {lang === 'de-DE' ? <GermanPrivacyPolicy /> : <EnglishPrivacyPolicy />}
    </>
  )
}

export default Privacy
