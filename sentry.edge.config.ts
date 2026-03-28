import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://13eb1abf9e2cc0362ecd63ca7dc7b61a@o4507004395651072.ingest.us.sentry.io/4507005091774464',
  tracesSampleRate: 1,
  debug: false,
})
