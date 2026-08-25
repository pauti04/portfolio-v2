# runs green — the executable résumé

Portfolio site for Parth Auti. Every claim on the page carries a check that
executes the real system in the visitor's browser and reports numbers measured
on their hardware. The page ships pre-verified: `scripts/verify.mjs` runs the
node-runnable check cores before every build and bakes the results (plus an ISO
timestamp) into `lib/verification.json`, which the static build consumes.
Interaction is upside, never a gate — the no-JS page is fully informative from
build data.

Seven checks (CHK-01 … CHK-07), one per project. Each is a `CheckRunner`
(`lib/checks/types.ts`) living in `components/checks/<slug>.tsx`. Checks that
cannot run under node record `mode: "recorded"` with their recorded evidence,
and say so on the page.

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

- **GitHub Pages**: set `NEXT_PUBLIC_BASE_PATH=/<repo-name>` in the build
  environment (wired to `basePath`/`assetPrefix` in `next.config.ts`), build,
  publish `out/`.
- **Vercel**: import the repo, leave `NEXT_PUBLIC_BASE_PATH` unset. Defaults
  work; the export output is detected.
