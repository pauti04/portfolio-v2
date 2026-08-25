# RUNS GREEN — The Executable Résumé (portfolio v2 build brief)

The site is a **verification suite**: every claim carries a VERIFY control that executes
the real system in the visitor's browser and flips a check green with numbers measured
on their hardware. Proof, not prose. Page ships pre-verified at build time (SSG-baked
results + timestamp); interaction is pure upside, never a gate.

Reference material (READ-ONLY — never edit v1): /Users/pauti/portfolio
- demos: app/components/{Bourse,NetPulse,CostDNA,ChainCheck,ChainCheckAction,RasoiBot,Reflight}Demo.tsx
- content/facts: lib/data.ts, lib/resume.ts, lib/project-pages.ts, lib/writing.ts
- writeups: app/writing/*/page.tsx

## Identity
- Aesthetic: a beautifully typeset acceptance-test report. Calm paper, earned green.
- Type via next/font (NEVER a Google Fonts <link> — CLS): Archivo (headings/claims,
  variable), JetBrains Mono (evidence, logs, numbers), system sans body optional.
- Tokens (globals.css @theme, light default + `.dark` class overrides):
  --paper #faf8f4 · --ink #16181c · --ink-soft #3d434d · --muted #6b7280 ·
  --line #e3ded4 · --pass #178a4c · --running #2563eb · --fail #d9481f
  Dark: paper #101216 · ink #f0efec · line #262b33 (accents AA-checked both themes).
- Green is EARNED: only ever on a verified check. Never decorative. Status icons always
  paired with text (color never sole signal). Copy tone: bone-dry, factual, zero triumph.

## Anatomy
1. **Viewport 1** — headline "Parth Auti builds systems and measures them." · mono line
   "New-grad SWE / ML-infra · B.S. CS, UNC Charlotte · available December 2026 · US" ·
   links GitHub(github.com/pauti04) / Resume(/cv) / Email(parth.auti@gmail.com) ·
   small caps "EVERY CLAIM ON THIS PAGE IS EXECUTABLE" · status strip: "7 checks ·
   verified at build {timestamp} · [RUN ALL CHECKS]" + 7 labeled circles (green from
   build data).
2. **Claims ledger** — one ClaimCard per project, anatomy: left rail (status + CHK-NN);
   CLAIM (one bold sentence); EVIDENCE (mono table: reference numbers + methodology
   one-liner + italic "Limits:" line); VERIFY (lazy demo island + run button + log +
   "your device: X · reference (M3): Y").
   - CHK-01 Reflight (flagship, largest card): claim "Fifteen consecutive green replay
     runs booked a real meeting on a Sunday, unattended." Verify = replay the recorded
     failure then the green run. GRAFT: frame it as replaying the site's own
     build-verification run.
   - CHK-02 Bourse: "This order book matches real orders, in this tab, at high
     throughput on your laptop." Verify = burst-match benchmark → ops/sec.
   - CHK-03 NetPulse: "This detector is listening to the live global BGP feed right
     now." Verify = live RIPE RIS WebSocket heartbeat; honest labeled fallback:
     "feed unreachable — replaying recorded session".
   - CHK-04 CostDNA: attribution over synthetic CloudTrail window → totals match.
   - CHK-05 ChainCheck: classifies a known hallucinated claim correctly.
   - CHK-06 ChainCheck Action: threshold gate blocks the bad claim, passes good ones.
   - CHK-07 RasoiBot (smallest card): "A small recipe assistant that does one thing
     politely." — calibrated modesty as evidence.
3. **Writing** — claims about communication; evidence = the two writeups (ported);
   verify = "read it (N min)".
4. **Footer** — "What this site does not claim": 4 honest bullets (no production
   traffic at scale; single-machine benchmarks; detector is heuristic; browser numbers
   vary by device). Availability + email restated. GRAFT colophon manifest: build hash,
   check count, verification timestamp, Lighthouse scores — the site measuring itself.

## Grafts (mandatory)
1. Figure-frame chrome around every VERIFY demo: hairline rule box, "Fig. N" label,
   small-caps caption, "source: github.com/pauti04/…" line, "reproduce locally:" exact
   command in mono.
2. Manifest colophon in footer (above).
3. Observations ledger: every check a visitor runs appends
   "OBSERVED 14:32:07 · CHK-02 · 1.18M ops/sec · your device" to a small log feeding
   [copy summary] (plain-text attestation). Every number on the page carries a
   provenance chip: `live` / `recorded` / `build-time` + timestamp.

## Check contract (lib/checks/types.ts — the spine defines it; everyone conforms)
```ts
export type LogLine = { t: number; text: string; tone?: "muted"|"ok"|"warn"|"err" };
export type CheckResult = {
  pass: boolean;
  mode: "live" | "recorded" | "build";
  metrics: { label: string; value: string }[];   // e.g. {label:"ops/sec", value:"1.18M"}
  summary: string;                                // one dry sentence
};
export type CheckRunner = (opts: { lite?: boolean; signal?: AbortSignal;
  onLog: (l: LogLine) => void }) => Promise<CheckResult>;
```
Each check lives in `components/checks/<slug>.tsx`: exports `run: CheckRunner` +
default visual component (the demo body, fed by the shared card chrome). RUN ALL
executes sequentially top-to-bottom with the sticky mini-bar "N/7 passing…".

## Hard rules
- Reduced motion: no auto-scroll, cascade, or count-ups; results simply appear;
  aria-live="polite" announcements for every state change.
- Progressive tiers: no-JS page fully informative from SSG build data; demos
  lazy-hydrate on approach/press; `lite` preset on constrained devices.
- WCAG 2.1 AA: zero axe violations (CI-gated). Mobile-first responsive.
- Static-exportable: `output: "export"` compatible (no server-only features;
  GitHub Pages preview deploy; basePath via env NEXT_PUBLIC_BASE_PATH).
- All copy: dry and factual. Reference numbers come from v1's lib/data.ts +
  lib/project-pages.ts benchmarks — never invent numbers.
- Build-time verification: scripts/verify.mjs runs the node-runnable check cores,
  writes lib/verification.json (results + ISO timestamp) consumed by SSG. Checks that
  can't run under node record mode:"recorded" with their recorded evidence.

## CLEAN BREAK (user directive — overrides everything above where they conflict)
NOTHING in v2 may visually resemble the v1 site or its demos. v1 is a source of
LOGIC AND FACTS ONLY — port behavior and numbers, never look-and-feel.

Banned visual patterns (all are v1 DNA — do not reproduce):
- dark terminal panels / black console boxes of any kind, incl. demo bodies
- `$` shell-prompt framing or terminal-window chrome (traffic dots, title bars)
- the c-*/artifact color scheme; colored console text on dark
- uppercase letter-spaced mono micro-labels as the dominant chrome voice
- graph-paper/grid backgrounds; amber/gold accents; serif display faces
- registration marks, crosshairs, HUD widgets, ruler ticks
- count-up numeral animations as a signature gesture

Check/demo bodies are PAPER-NATIVE instruments instead — a typeset test report:
- numbered assertion lines with checkbox glyphs (✓ ✗ →), ink on paper
- ledger tables with hairline rules; small inline ink-drawn bar/spark plots
- the "log" is report lines: mono ink text with a thin left rule, tones from
  ink weight + glyphs, never colored console-on-dark
- interaction language is "run check / assert / observe", not shell commands;
  controls look like document affordances, not terminal buttons

Litmus test for every element: "would this look at home on the old site?"
If yes, redesign it before shipping.
