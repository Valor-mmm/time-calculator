import Head from 'next/head'
import { FC } from 'react'
import { TimeDifference } from '../components/features/time-difference'

const Home: FC = () => {
  return (
    <>
      <Head>
        <title>Time Calculator</title>
      </Head>

      <TimeDifference />
    </>
  )
}

export default Home
