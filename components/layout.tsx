import { PropsWithChildren } from 'react'

export const Layout = ({ children }: PropsWithChildren) => (
  <div className="min-h-screen flex flex-col dark:text-white">
    <main className="flex-grow bg-gray-200 dark:bg-gray-800 py-6 sm:py-12">
      {children}
    </main>
    <footer className="bg-gray-600 dark:bg-gray-500 p-4"></footer>
  </div>
)
