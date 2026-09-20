# Time Calculator

A small, entirely client-side web app for adding up worked hours. Paste lines
of time ranges, get per-entry durations, the gaps between them and a total.

Live at **[time-calculator.vercel.app](https://time-calculator.vercel.app)**.

```
09.00 - 12.30      09.00 - 12.30 : 3h 30m
13.00 - 17.00  ->  13.00 - 17.00 : 4h 0m
                   ───────────────────────
                      7 Hours 30 Minutes
```

## Input format

One entry per line. Hour and minute may be separated by `:`, `.` or `,`, and
the dash between start and end is optional:

```
09:00 - 12:30
9.00-12.30
9,00 12,30
```

- **Leaving out the end time** (`09.00`) means "still running" — the entry
  lasts until now. A start that has not happened yet is flagged instead.
- **Crossing midnight** (`22.00 - 02.00`) is understood as a night shift and
  counts as 4 hours, not minus 20. A shift that stops before midnight and
  resumes after it (`20.00 - 23.00` then `01.00 - 04.00`) is understood too.
- **An entry that starts implausibly far before the previous one ended** is
  flagged as an error row rather than silently subtracting from the total.
  The cut-off is a 12-hour gap, which is what separates a shift resuming after
  midnight from a typo.
- **Out-of-range times** (`24.00`, `12.60`) and digit runs that cannot be a
  time (`123.45`) are rejected with an error row.
- Text around the times is ignored, so `Mo 09.00 - 12.30 lunch` works.

The app models a single day of times. Two separate days entered as consecutive
lines will exceed the 12-hour gap and be reported as an ordering error.

The "Show Pauses" toggle adds a row for each gap between entries plus a
separate pause total. The choice is remembered in `localStorage`.

## Development

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command                 | What it does                                               |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | Development server                                         |
| `npm run build`         | Production build                                           |
| `npm run lint`          | Prettier check, ESLint and `tsc` — the CI gate             |
| `npm run fix`           | Apply Prettier and ESLint fixes                            |
| `npm run test`          | Unit and component tests (Vitest)                          |
| `npm run test:watch`    | Vitest in watch mode                                       |
| `npm run test:coverage` | Tests with a coverage report                               |
| `npm run test:e2e`      | End-to-end tests (Playwright, needs `npm run build` first) |
| `npm run verify`        | Lint, test and build in one go                             |

## Stack

Next.js (Pages Router) · React · TypeScript · Tailwind CSS · dayjs · Sentry ·
deployed on Vercel.

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — working agreements, also for AI agents
- [`docs/`](./docs/README.md) — architecture, domain logic, testing, tooling and CI
