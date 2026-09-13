# nine thousand miles — a portfolio you travel

Portfolio site for Parth Auti, built as one scrolling journey: Pune → Manipal →
Charlotte, 9,083 great-circle miles in three chapters, with the seven live demos
planted where and when they were made — a recipe assistant in Manipal, a flight
recorder for AI agents in Charlotte — so the growth curve is something you read
by scrolling rather than something the page claims. The opening screen answers
who / what / when (name, the route, available December 2026, GitHub, resume,
email) in viewport one with zero JavaScript; each chapter opens on its city,
dates and distance marker, the move between chapters is its own beat with the
mileage counting up, and the page arrives on December 2026 and contact. The
demos are the previous build's check runners — `scripts/verify.mjs` executes the
node-runnable cores before every build and bakes results plus an ISO timestamp
into `lib/verification.json`, so the static page ships pre-verified and every
number on it is measured, labeled live / recorded / build-verified. Motion is
transform/opacity only (zero CLS) and fully disabled under
`prefers-reduced-motion`.

Each check is a `CheckRunner` (`lib/checks/types.ts`) living in
`components/checks/<slug>.tsx`. Checks that cannot run under node record
`mode: "recorded"` with their recorded evidence, and say so on the page.

The route itself — chapters, cities, dates, distances, milestones and which
project was built where — is `lib/journey.ts`, a thin reader over the audited
records in `app/cv/resume.ts` and `lib/claims.ts`. Facts are edited there, never
in a page.

## Stack

Next.js (App Router, `output: "export"`), TypeScript, Tailwind v4. No server.

## Commands

```bash
npm run dev        # dev server
npm run verify     # run the check cores, write lib/verification.json
npm run build      # verify (prebuild) + static export to out/
npm run start      # serve out/ on :3000 — what the test suite runs against
npm run test:e2e   # Playwright: smoke + axe WCAG 2.1 A/AA (zero violations)
npx lhci autorun   # Lighthouse budgets: CLS ≤ 0.1, a11y/SEO ≥ 0.95 (error), perf ≥ 0.9 (warn)
```

Playwright starts `npm run start` itself; run `npm run build` first so `out/`
exists. First run: `npx playwright install chromium`.

## CI

`.github/workflows/site-ci.yml`: build → Playwright (desktop project) →
Lighthouse CI. The build step re-runs verification, so a red check core fails
the pipeline before a browser ever opens.

## Deploy

Static export; anything that serves files works.

- **GitHub Pages** (custom domain https://pauti.dev): leave `NEXT_PUBLIC_BASE_PATH` unset — the site is served from the domain root. `public/CNAME` carries the domain into the export; DNS at the registrar points the apex A/AAAA records at GitHub Pages and `www` at `pauti04.github.io`.
- **Vercel**: import the repo, leave `NEXT_PUBLIC_BASE_PATH` unset. Defaults
  work; the export output is detected.
