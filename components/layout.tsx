import { PropsWithChildren } from 'react'
import Link from 'next/link'
import {
  Language,
  useLanguageSwitch,
} from './features/languageSwitchTabs/useLanguageSwitch'

const getPrivacyPolicyName = (language: Language) => {
  switch (language) {
    case 'de-DE':
      return 'Datenschutzerklärung'
    case 'en-EN':
      return 'Privacy Policy'
  }
}

const getImprintName = (language: Language) => {
  switch (language) {
    case 'de-DE':
      return 'Impressum'
    case 'en-EN':
      return 'Imprint'
  }
}

export const Layout = ({ children }: PropsWithChildren) => {
  const [lang] = useLanguageSwitch()

  return (
    <div className="min-h-screen flex flex-col dark:text-white">
      <main className="grow bg-gray-200 dark:bg-gray-800 py-6 sm:py-12">
        {children}
      </main>
      <footer className="bg-gray-300 dark:bg-gray-500 p-4 flex flex-row justify-center gap-1.5">
        <Link
          className="p-2 underline text-blue-500 dark:text-blue-200"
          href={'/privacy'}
        >
          {getPrivacyPolicyName(lang)}
        </Link>
        <Link
          className="p-2 underline text-blue-500 dark:text-blue-200"
          href={'/imprint'}
        >
          {getImprintName(lang)}
        </Link>
      </footer>
    </div>
  )
}
