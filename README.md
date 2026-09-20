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

Paste your notes as they are. One entry per line; hour and minute may be
separated by `:`, `.` or `,`, and the dash is optional:

```
Freitag:
08.00 - 16.30
auf Mittwoch gebucht

Samstag:
09.00 - 11.00
```

- A line ending in a **colon** starts a new work day (`Samstag:`). Each day
  gets its own subtotal, and the gap between two days is not counted as a
  break.
- **Prose lines** are kept as notes, not reported as errors.
- **Leaving out the end time** (`09.00`) means "still running" — the entry
  lasts until now. A start that has not happened yet is flagged instead.
- **Crossing midnight** (`22.00 - 02.00`) is a night shift and counts as 4
  hours. So is a shift that stops before midnight and resumes after it
  (`20.00 - 23.00` then `01.00 - 04.00`) — the gap in between stays a break,
  because that is one work day, not two.
- A time that goes **backwards** is read as the clock having passed midnight,
  not as a mistake. Use a day header to say where a work day actually ends.
- **Out-of-range times** (`24.00`, `12.60`), digit runs that cannot be a time
  (`123.45`), and lines holding something time-shaped that was not understood
  (`1x.00 - 12.00`, or two ranges on one line) are reported as error rows
  rather than silently changing the total.
- Text around the times is ignored, so `Mo 09.00 - 12.30 lunch` works.

The "Show Pauses" toggle adds a row for each gap within a day plus a separate
pause total. The choice is remembered in `localStorage`.

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
