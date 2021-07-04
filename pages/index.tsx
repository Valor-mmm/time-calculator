import Head from 'next/head'
import { FC } from 'react'
import { TimeDifference } from '../components/features/time-difference'

const Home: FC = () => {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-200 py-6 sm:py-12">
        <TimeDifference />
      </main>
    </>
  )
}

export default Home
