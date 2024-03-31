import Head from 'next/head'
import { FC } from 'react'
import { LanguageSwitchTabs } from '../components/features/languageSwitchTabs'
import { useLanguageSwitch } from '../components/features/languageSwitchTabs/useLanguageSwitch'
import { GermanImprint } from '../components/features/legal/imprint/germanImprint'
import { EnglishImprint } from '../components/features/legal/imprint/englishImprint'

const Imprint: FC = () => {
  const [lang, setLang] = useLanguageSwitch()
  return (
    <>
      <Head>
        <title>Time Calculator - Imprint</title>
      </Head>

      <LanguageSwitchTabs currentLanguage={lang} setCurrentLanguage={setLang} />
      {lang === 'de-DE' ? <GermanImprint /> : <EnglishImprint />}
    </>
  )
}

export default Imprint
