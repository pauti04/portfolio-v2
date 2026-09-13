// ----------------------------------------------------------------------------
// All page content. Numbers are ported from v1 (/Users/pauti/portfolio,
// lib/data.ts + lib/project-pages.ts) — never invented here.
// ----------------------------------------------------------------------------

export const CHECK_SLUGS = [
  "reflight",
  "chaincheck",
  "chaincheck-action",
  "bourse",
  "netpulse",
  "costdna",
  "dispatch",
  "rasoibot",
] as const;

export type CheckSlug = (typeof CHECK_SLUGS)[number];

export type EvidenceRow = { metric: string; value: string; note: string };

export type Claim = {
  /** "CHK-01" … "CHK-07" */
  id: string;
  slug: CheckSlug;
  name: string;
  /** Card prominence — CHK-01 largest, CHK-07 smallest. */
  size: "xl" | "lg" | "md" | "sm";
  /** The one bold sentence. */
  claim: string;
  evidence: EvidenceRow[];
  /** One dry line on how the reference numbers were measured. */
  methodology: string;
  /** Rendered italic after "Limits:". */
  limits: string;
  /** Footer of the VERIFY section: "your device: X · reference (M3): Y". */
  reference: string;
  /** Figure-frame chrome. */
  figure: { n: number; caption: string };
  source: string;
  reproduce: string;
};

export const CLAIMS: Claim[] = [
  {
    id: "CHK-01",
    slug: "reflight",
    name: "Reflight",
    size: "xl",
    claim:
      "Fifteen consecutive green replay runs booked a real meeting on a Sunday, unattended.",
    evidence: [
      { metric: "full-run replay", value: "~7 ms", note: "byte-identical, with the network hard-blocked, for $0.00" },
      { metric: "to instrument an agent", value: "3 lines", note: "wrap the client, wrap the tools, end the session" },
      { metric: "case-study catch rate", value: "15/15", note: "one 15-line promoted assertion, every time" },
      { metric: "what the LLM judge caught", value: "1–5", note: "same failures, same recordings, depending on prompt wording" },
    ],
    methodology:
      "Replay timing is the repo's own example suite on a laptop. The 15/15 case study is documented in docs/case-study.md with the recordings included.",
    limits:
      "Replay is deterministic for the recorded path. It is not time travel for arbitrary code changes.",
    reference: "Reference on an M3: a full-run replay takes ~7 ms and costs $0.00.",
    figure: {
      n: 1,
      caption:
        "This replays the site's own build-verification run. The recorded failure comes first, then the green run.",
    },
    source: "https://github.com/pauti04/reflight",
    reproduce: "git clone https://github.com/pauti04/reflight && cd reflight && pytest",
  },
  {
    id: "CHK-02",
    slug: "chaincheck",
    name: "ChainCheck",
    size: "lg",
    claim:
      "A known hallucinated claim is flagged at the exact sentence, not scored as a vague whole.",
    evidence: [
      { metric: "precision on HaluEval-QA", value: "94%", note: "judge P=0.936, R=0.644, F1=0.763 on n=500, balanced 50/50" },
      { metric: "latency cut by the NLI pre-filter", value: "19×", note: "clear-cut inputs served in 60 ms locally, no judge call" },
      { metric: "client-code changes", value: "0", note: "a drop-in OpenAI proxy, so you only swap the base URL" },
      { metric: "distribution", value: "PyPI", note: "pip install chaincheck. A GitHub Action wraps the same core" },
    ],
    methodology:
      "HaluEval-QA restricted to n=500 with a balanced 50/50 split, judged by gpt-4o-mini. The eval harness and the four-method comparison are in the repo.",
    limits:
      "Recall is 64%, so roughly a third of hallucinations get through. This browser check replays the ensemble's recorded scores rather than making live model calls.",
    reference: "Reference: the NLI pre-filter answers in 60 ms locally. The judge is only called when the input is ambiguous.",
    figure: { n: 2, caption: "A five-detector ensemble scores a known hallucinated claim. Six TruthfulQA samples with recorded judge scores sit alongside it." },
    source: "https://github.com/pauti04/chaincheck",
    reproduce: "pip install chaincheck",
  },
  {
    id: "CHK-03",
    slug: "chaincheck-action",
    name: "ChainCheck Action",
    size: "lg",
    claim:
      "The merge gate blocks the PR whose description doesn't match its diff, and passes the ones that do.",
    evidence: [
      { metric: "fail-threshold", value: "0.80", note: "any claim scoring above it fails the workflow step" },
      { metric: "pr #142", value: "exit 1", note: '"adds rate limiting to /v2/predict" scored 0.91, so it was blocked' },
      { metric: "pr #189", value: "exit 0", note: "all three claims supported, highest score 0.18" },
    ],
    methodology:
      "Same detection core as CHK-02, wired to a GitHub Actions step that reads the PR description and the diff and fails when any claim clears the threshold.",
    limits:
      "The threshold is a policy choice. At 0.80 it favors letting legitimate PRs through over catching every hallucination.",
    reference: "Reference: the threshold is 0.80 and the gate decision is deterministic.",
    figure: { n: 3, caption: "The threshold gate, run over per-claim scores for three sample PRs." },
    source: "https://github.com/pauti04/chaincheck-action",
    reproduce: "uses: pauti04/chaincheck-action@v1",
  },
  {
    id: "CHK-04",
    slug: "bourse",
    name: "Bourse",
    size: "md",
    claim:
      "This order book matches real orders, in this tab, at high throughput on your laptop.",
    evidence: [
      { metric: "in-process round-trip", value: "~225 ns", note: "M-series, release build, multi-tenant Hub" },
      { metric: "TCP RTT loopback p50 / p99", value: "~78 µs / ~307 µs", note: "same setup, measured separately from the walk rate" },
      { metric: "matcher walks 1000 price levels", value: "~94 µs", note: "~10M trades/sec on the matcher alone. TCP-bounded end-to-end, ~88k orders/sec" },
      { metric: "group commit vs fsync-per-record", value: "187–245×", note: "batch=256 on the WAL, with byte-exact replay and snapshot recovery" },
    ],
    methodology:
      "Release-build Rust on M-series against the repo's own bench harness. The matcher rate and the TCP end-to-end rate are two different measurements and are not merged.",
    limits:
      "The engine running in this tab is a TypeScript port for demonstration. Browser ops/sec is not the Rust number.",
    reference: "Reference on an M3: ~225 ns in-process, and a 1000-level walk in ~94 µs.",
    figure: { n: 4, caption: "A price-time-priority burst match, executed in this tab." },
    source: "https://github.com/pauti04/bourse",
    reproduce: "git clone https://github.com/pauti04/bourse && cd bourse && cargo bench",
  },
  {
    id: "CHK-05",
    slug: "netpulse",
    name: "NetPulse",
    size: "md",
    claim: "This detector is listening to the live global BGP feed right now.",
    evidence: [
      { metric: "labeled historical incidents detected", value: "7 / 7", note: "0 false negatives on the public benchmark. Runs in ~1 s with no API keys" },
      { metric: "RPKI validate per call", value: "~43 µs", note: "859k VRPs with a warm cache, ~23k calls/sec" },
      { metric: "speedup shipped on RPKI", value: "500×", note: "linear scan → patricia trie, on the same machine, dataset and workload" },
      { metric: "announcements in a 70-second sample", value: "149,246", note: "live RIPE RIS global feed, ~1,800 updates/sec" },
    ],
    methodology:
      "Measured on an M3 (16 GB) against the RIPE RIS dump from 2024-01-12. Each number is the median of 1,000 runs with the cache pre-warmed. Methodology in BENCHMARK.md.",
    limits:
      "Cold-cache numbers are 1.5–3× slower. The live check depends on the RIPE RIS feed being reachable, and when it isn't, the fallback is labeled as a recording.",
    reference: "Reference on an M3: an RPKI validate takes ~43 µs and the benchmark runs in ~1 s.",
    figure: { n: 5, caption: "A heartbeat on the RIPE RIS live feed. If the feed can't be reached, it falls back to a labeled recording." },
    source: "https://github.com/pauti04/netpulse",
    reproduce: "git clone https://github.com/pauti04/netpulse  # methodology in BENCHMARK.md",
  },
  {
    id: "CHK-06",
    slug: "costdna",
    name: "CostDNA",
    size: "sm",
    claim:
      "Per-team attribution over a synthetic CloudTrail window reconciles with the ledger, cent for cent.",
    evidence: [
      { metric: "AWS spend that's typically untagged", value: "40–60%", note: "the gap CostDNA closes" },
      { metric: "bill coverage after inference", value: "~95%", note: "up from the ~half that tags alone explain" },
      { metric: "raw cost report → per-team breakdown", value: "90 s", note: "end to end, and no data leaves the account" },
      { metric: "the leakage-audit correction", value: "97% → 6.9%", note: "post-audit accuracy, published next to the inflated first cut" },
    ],
    methodology:
      "Behavioral accuracy is measured on the Azure Public Dataset (2.6M VMs) with leakage-audit passes run to strip trivially-predictable features.",
    limits:
      "The post-audit behavioral accuracy is 6.9%. The 97% first-cut number was label leakage, and both are published in the repo.",
    reference: "Reference on an M3: a full attribution pass takes 90 s end to end.",
    figure: { n: 6, caption: "Attribution over two synthetic CloudTrail windows. The totals have to reconcile." },
    source: "https://github.com/pauti04/CostDNA",
    reproduce: "git clone https://github.com/pauti04/CostDNA",
  },
  {
    id: "CHK-07",
    slug: "dispatch",
    name: "Dispatch",
    size: "md",
    claim: "An AI-curated morning brief for developers.",
    evidence: [
      { metric: "stories in the sample edition", value: "4", note: "three sections, and every story carries its why-it-matters line. Counted from the committed edition, client/public/sample-brief.json" },
      { metric: "story candidates pooled for it", value: "118", note: "hn 30 + gh 18 + lobsters 20 + reddit 20 + arxiv 15 + show hn 15, from the edition's own counts. Clustered and pre-filtered to 30 before the model chose 4. The hiring feeds brief the editor and don't compete" },
      { metric: "tests in the server suite", value: "41", note: "vitest, reproduced locally 2026-09-13. The repo runs them in CI" },
    ],
    methodology:
      "Solo-built end to end: React + Vite client, Express + Postgres (Neon) server, gpt-4o-mini generation, Resend for delivery, Sentry and PostHog for observability, Expo for the mobile shell. Onboarding is role-first, the brief streams over Server-Sent Events, and the surface is a newspaper redrawn for software — ink on cream, gold accents, double-ruled masthead, issue numbering. Every count above is read from the committed sample edition. The test count is the server's vitest suite, run here.",
    limits:
      "The panel replays a committed real edition at a simulated cadence. It does not generate one. The ~800 ms first-headline figure and the Lighthouse / a11y audits are the repo's own reports, and were not measured here.",
    reference: "The repo's own report: first headline in ~800 ms server-side, Lighthouse Best Practices 100, 0 a11y violations. Live at dispatch-six-rho.vercel.app/demo.",
    figure: { n: 7, caption: "A real edition, replayed as the server streams it: start, deltas, complete." },
    source: "https://github.com/pauti04/dispatch",
    reproduce: "git clone https://github.com/pauti04/dispatch && cd dispatch/server && npx vitest run",
  },
  {
    id: "CHK-08",
    slug: "rasoibot",
    name: "RasoiBot",
    size: "sm",
    claim: "A small recipe assistant that does one thing politely.",
    evidence: [
      { metric: "Indian recipes indexed", value: "12", note: "paneer butter masala, aloo gobi, chole, bhindi masala, tadka dal, masoor dal, sambar, butter chicken, rajma masala, cucumber raita, kadhi pakora, gobi manchurian" },
      { metric: "API calls per query", value: "0", note: "entirely local. The streaming is sleep(14ms) between characters" },
    ],
    methodology:
      "Set-intersection over a hand-curated recipe index. There is no benchmark to report. It's a recipe lookup, not a system.",
    limits:
      "The streaming feel is a UX trick, and the README says so out loud.",
    reference: "Reference: the lookup is O(recipes × ingredients) over an index of 12.",
    figure: { n: 8, caption: "A pantry-to-recipe lookup. The smallest thing on this page." },
    source: "https://github.com/pauti04/RasoiBot-clean",
    reproduce: "git clone https://github.com/pauti04/RasoiBot-clean && npm install && npm run dev",
  },
];

export const claimBySlug = (slug: CheckSlug): Claim =>
  CLAIMS.find((c) => c.slug === slug)!;

// ----------------------------------------------------------------------------
// Writing — claims about communication. Titles/minutes ported from v1
// lib/writing.ts. Routes are owned by a later stage.
// ----------------------------------------------------------------------------

export type WritingEntry = {
  slug: string;
  href: string;
  title: string;
  summary: string;
  date: string;
  minutes: number;
};

export const WRITING: WritingEntry[] = [
  {
    slug: "fifteen-green-runs",
    href: "/writing/fifteen-green-runs",
    title: "Fifteen green runs booked a meeting on a Sunday",
    summary:
      "A live scheduling agent passed every tool-level check fifteen times in a row — and was wrong every time. Why pass rates lie, LLM judges flake, and a 15-line assertion on a recording beats both.",
    date: "2026-08-11",
    minutes: 6,
  },
  {
    slug: "netpulse-rpki-trie",
    href: "/writing/netpulse-rpki-trie",
    title: "How a patricia trie made RPKI validation 500× faster",
    summary:
      "The single change that took NetPulse from offline batch tool to live stream detector. A worked example of data-structure choice mattering more than language.",
    date: "2026-05-12",
    minutes: 5,
  },
];

export const WRITING_CLAIM =
  "The systems above survive being written about at length.";

// ----------------------------------------------------------------------------
// Footer
// ----------------------------------------------------------------------------

export const DOES_NOT_CLAIM = [
  "No production traffic at scale. Nothing here has been hardened by strangers' load.",
  "Every benchmark is a single-machine measurement, documented and reproducible. None of it is a distributed-systems claim.",
  "The hallucination detector is a heuristic ensemble. It misses things, and the recall number says how often.",
  "Numbers measured in your browser vary by device, load, and thermals. That is why every figure is labeled with where it came from.",
];

export const CONTACT = {
  name: "Parth Auti",
  headline: "Parth Auti builds systems and measures them.",
  monoLine: "New-grad SWE / ML-infra · B.S. CS, UNC Charlotte · available December 2026 · US",
  smallcaps: "Every claim on this page is executable",
  github: "https://github.com/pauti04",
  email: "parth.auti@gmail.com",
  resumeHref: "/cv",
};
