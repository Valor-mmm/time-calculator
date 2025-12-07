import next from 'eslint-config-next'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      'node_modules/',
      '.next/',
      'public/',
      '.eslintrc.js',
      'next.config.js',
      'tailwind.config.js',
      'postcss.config.js',
    ],
  },
]

export default config
