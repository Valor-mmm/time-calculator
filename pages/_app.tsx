import '../tailwind.css'
import { FC, ElementType } from 'react'
import { Layout } from '../components/layout'

type PageProps = Record<string, unknown>

interface MyAppProps {
  Component: ElementType
  pagePops: PageProps
}

const MyApp: FC<MyAppProps> = ({ Component, pagePops }) => {
  return (
    <Layout>
      <Component {...pagePops} />
    </Layout>
  )
}

export default MyApp
