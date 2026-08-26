# NINE THOUSAND MILES — the journey portfolio (supersedes all earlier briefs)

**The subject of this site is Parth, not the software.** Every previous version made
the projects the subject and every one of them missed. This site is the arc of a
person: **Pune → Manipal → Charlotte**, and the things he built getting more
ambitious the further he travelled. The seven live demos are still here and still
run — but they are *milestones along a route*, planted where and when they were
made, not exhibits in a gallery.

The emotional payload, and the reason this works: a recipe assistant in Manipal;
a flight recorder for AI agents in Charlotte. **You can watch him level up by
scrolling.** No other portfolio has that, because it is nobody else's life.

## The route (verified facts — never invent, never embellish)
Distances are real great-circle, already computed: Pune→Manipal **362 mi**,
Manipal→Charlotte **8,720 mi**, total travelled **9,083 mi**.

**CHAPTER 1 · PUNE, INDIA — 2023**
- JEE Advanced 2023 — qualified, **top ~1.3% of 1.4M+ candidates** (India's
  national engineering entrance exam). This is the hardest thing on the page for a
  US reader to scale: state it plainly, let the number do the work, one short line
  of context. No melodrama.

**CHAPTER 2 · MANIPAL, KARNATAKA — Aug 2023 – May 2025 · 362 miles from home**
- Manipal Academy of Higher Education (MAHE), Computer Science, GPA 3.63 / 4.0.
- Smart India Hackathon 2024 — **3rd place**: IoT precision agriculture, ESP32
  sensor nodes, Firebase, ML irrigation recommendations, GSM/SMS alerts built
  specifically for low-connectivity villages. (Note the through-line: even the
  first real project was aimed at someone who needed it.)
- Undergraduate research: ML for medical imaging — multiclass brain-tumor
  classification on MRI; baselines in PyTorch/scikit-learn.
- IT Support Assistant — 500+ tier-1/2 helpdesk tickets.
- **Built: RasoiBot** — the small, deliberately humble one. Keep it humble; it is
  the "before" in the growth curve and it must read as honest, not weak.

**CHAPTER 3 · CHARLOTTE, NORTH CAROLINA — Aug 2025 → · 8,720 miles further**
- UNC Charlotte, B.S. Computer Science, GPA 3.7 / 4.0, graduating **December
  2026**. Chancellor's List (Spring 2026), Dean's List (Fall 2025).
- Oct 2025 – Apr 2026: **Starbucks barista → promoted to trainer ahead of tenure**,
  200+-transaction morning rushes, through a full CS course load. This belongs on
  the page and is not a joke — it is the texture of the year the serious work
  started. State it straight; let the reader draw the conclusion.
- Mar – Jun 2026: **Software Engineering Intern** (T-Infosystem, remote).
- May 2026 → : **Undergraduate ML Researcher, CharmLab**, advised by Prof. Minwoo
  Lee — LLM-judge failure modes. Also AV Technician, live event production.
- **Built, in this order, getting harder: ChainCheck → CostDNA → NetPulse →
  Bourse → Reflight** (flagship). Each carries its live demo.
- Ends on: available December 2026, contact, GitHub.

## Form
A single scrolling journey. Chronology is the spine and geography is the anchor —
the route line is drawn continuously down the page and the reader travels it.

1. **Opening** — the whole route at once: three cities on one line, name, one
   sentence, and the availability answer. A recruiter must have name / what /
   when inside the first screen without scrolling or waiting on an animation.
   Suggested spine line: *"Pune to Manipal to Charlotte. 9,083 miles, three cities,
   seven systems that run."* Then the route draws itself in.
2. **Three chapters**, each opening with its city, its dates, its distance marker,
   and the life facts above — then the projects built there, each in a panel with
   its **live demo** (reuse the working check runners; see Reuse below).
3. **Between chapters, the move itself is a beat** — the distance number is the
   transition. Manipal→Charlotte (8,720 mi) is the big one; give it room.
4. **Arrival** — Dec 2026, what he's looking for, email, GitHub, and a short
   honest closing line. Keep the "what this site does not claim" instinct: one
   compact honest note, not a wall.

## Reuse (do not rebuild working things)
- `components/checks/*` — the seven demo runners and their `run: CheckRunner`
  logic all work. **Keep every runner exactly as-is**; restyle visual bodies only.
- `lib/checks/types.ts`, `components/RunAllProvider.tsx`, `components/CheckLog.tsx`,
  `scripts/verify.mjs` + `lib/verification.json` (build-time verification),
  `lib/claims.ts` (project facts/numbers), `app/cv/resume.ts` (life facts).
- Keep the CI: Playwright + axe + Lighthouse, `output: "export"`,
  `NEXT_PUBLIC_BASE_PATH`, next/font.

## Look
**One colour theme, warm.** This is a journey that starts in India and ends in
Carolina — the palette should feel like that, not like a machine room. Warm dark
ground (deep ink-brown/charcoal, not blue-black), warm off-white ink, ONE accent
in the warm family (terracotta/saffron), used for the route line, the distance
markers, and live indicators — nowhere else. No light/dark toggle, no second hue.
The CV page keeps a print stylesheet only.

Type: one characterful display face for city names and the big numbers, one clean
sans for body, one mono for data and demo internals — all via `next/font/google`.

Motion: the route line draws as you scroll; chapters and milestones enter on
scroll; the distance numbers count as the move happens. Transform/opacity only
(CLS ≤ 0.1). Everything honors `prefers-reduced-motion` with a static path that
still looks intentional.

## Hard rules
- **Never invent or embellish a fact.** Everything above is audited. Forbidden
  forever: ChainCheck "79% F1" (use 94% precision at 64% recall); CostDNA "95%+
  team-attribution accuracy"; Bourse "45 µs p50 / 109 µs p99" (correct: p50 ~78 µs,
  p99 ~307 µs TCP, ~88k pipelined orders/sec; ~10M trades/sec is the matcher walk,
  a separate measurement). Job title is "Software Engineering Intern".
- Tone: warm but dry. No inspirational-poster language, no "chasing dreams", no
  hardship narration. The facts are remarkable on their own; let them be.
- WCAG 2.1 AA, zero axe violations, mobile-first, 60-second recruiter answer in
  viewport one.
- Do not resemble the earlier builds: no paper acceptance-report, no film-title
  sequence, no glass panels, no graph-paper grid, no terminal chrome.
