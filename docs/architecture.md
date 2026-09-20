# Architecture

## What the app does

A single-purpose utility, deployed at `time-calculator.vercel.app`: the user
pastes lines of time ranges into a textarea, and on blur the app renders one
table row per line with the duration, optional "pause" rows for the gaps
between ranges, and a grand total.

Everything runs client-side. There is no backend, no database and no API route.

## Stack

- **Next.js 16** using the **Pages Router** (`pages/`, not `app/`)
- **React 19**
- **TypeScript 5.9** in `strict` mode, targeting `ES2022`
- **Tailwind CSS 4** via `@tailwindcss/postcss`; `tailwind.css` imports
  Tailwind and pulls in the legacy v3-style `tailwind.config.js` through
  `@config`, plus a v3 border-color compatibility layer
- **dayjs** for all time arithmetic
- **Sentry** (`@sentry/nextjs` + `@sentry/profiling-node`) for errors, tracing,
  profiling and session replay on error
- **Vercel** for hosting and preview deployments

## Directory layout

```
pages/                      Pages Router entry points
  _app.tsx                  Wraps every page in <Layout>, imports tailwind.css
  _error.jsx                Sentry-instrumented error page (only .jsx file)
  index.tsx                 Home — renders <TimeDifference>
  imprint.tsx               Legal: Impressum, language-switched
  privacy.tsx               Legal: Datenschutz, language-switched

components/
  layout.tsx                Shell: <main> + footer with legal links
  lib/                      Generic, domain-free UI primitives
    textarea/Textarea.tsx
  features/                 Domain code, one folder per feature
    time-difference/        The core feature (see domain-logic.md)
    languageSwitchTabs/     de-DE / en-EN switch, localStorage-backed
    legal/                  Static imprint + privacy texts, per language

e2e/                        Playwright end-to-end specs
test/setup.ts               Vitest global setup
vitest.config.mts           Vitest config (jsdom, coverage)
playwright.config.ts        Playwright config (builds and serves the app)

instrumentation.ts          Next.js server/edge Sentry bootstrap
instrumentation-client.ts   Browser Sentry init (DSN inline)
sentry.server.config.ts     Node runtime Sentry init
sentry.edge.config.ts       Edge runtime Sentry init

.agents/skills/             Vendored Sentry AI skills (see skills-lock.json)
.junie/                     JetBrains Junie agent config (gitignored)
```

The `lib/` vs `features/` split is the main structural convention: anything
reusable and domain-agnostic goes to `components/lib/`, everything else lives
under `components/features/<feature>/`. Features nest sub-folders
(`timeDiffResult/timeDiffTable/`) that mirror the component tree, with an
`index.tsx` as the folder's public entry point.

## Data flow

```
pages/index.tsx
  └── <TimeDifference>                        holds TimeDiffRow[] in useState
        ├── <Textarea onBlur>                 uncontrolled; fires on blur only
        │     └── parseTime(raw)              string  -> (ParsingResult | Error)[]
        │        └── normalizeSequence(...)    rolls days so nothing runs backwards
        │           └── timeDifference(...)    adds { hours, minutes } per range
        │                 └── calculatePauses(...) interleaves Pause rows
        └── <TimeDiffResult result>
              ├── aggregateTimeDifference()   twice: worked total, pause total
              ├── <TimeDiffTable>             filters pauses per config
              │     ├── <TimeDiffRow>         a parsed range
              │     ├── <PauseRow>            a gap between two ranges
              │     └── <TimeDiffErrorRow>    an unparsable line
              └── <TimeDiffConfig>            "Show Pauses" checkbox
```

The pipeline is deliberately a chain of pure functions
(`parseTime → normalizeSequence → timeDifference → calculatePauses →
aggregateTimeDifference`), wired together by the exported `calculateRows()`,
with React only holding the resulting array. Errors are values, not throws:
unparsable lines become `TimeParsingError` instances that travel through the
whole pipeline and are rendered as error rows.

## State management

There is no state library. Three mechanisms are in use:

1. **`useState` in `TimeDifference`** — the computed rows. Recomputed from
   scratch on every blur.
2. **`configStore.ts`** — the `{ showPauses }` config, read from
   `localStorage` key `TIME_DIFF_CONFIG` on first render and written back by a
   `useEffect` in `TimeDiffResult`.
3. **`useLanguageSwitch.ts`** — a hand-rolled external store consumed via
   `useSyncExternalStore`. The store seeds itself lazily from
   `localStorage` (key `TimeCalculator_Language`) and then `navigator.languages`,
   and its `getSnapshot` is the single source of truth — the value React sees
   and the value `setLanguage` deduplicates against are the same field. It
   returns `'en-EN'` as the server snapshot to keep hydration stable.

## Rendering / SSR notes

- Pages are statically rendered; all logic is client-side.
- `useLanguageSwitch` is the only real hydration hazard and handles it via a
  dedicated server snapshot. The `'use client'` directive at its top is inert
  under the Pages Router.
- `next.config.js` sets a `Document-Policy: js-profiling` header on `/` so that
  Sentry browser profiling works, and wraps the config in `withSentryConfig`
  with `tunnelRoute: '/monitoring'` to bypass ad-blockers.

## Testing

Unit and component tests sit next to their source as `*.test.ts(x)` and run on
Vitest with jsdom; end-to-end specs live in `e2e/` and run on Playwright
against a real production build. See [testing.md](./testing.md).
