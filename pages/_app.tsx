import '../tailwind.css'
import { FC, ElementType } from 'react'

type PageProps = Record<string, unknown>

interface MyAppProps {
  Component: ElementType
  pagePops: PageProps
}

const MyApp: FC<MyAppProps> = ({ Component, pagePops }) => {
  return (
    <>
      <Component {...pagePops} />
    </>
  )
}

export default MyApp
