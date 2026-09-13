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
      { metric: "full-run replay", value: "~7 ms", note: "byte-identical, network hard-blocked, $0.00" },
      { metric: "to instrument an agent", value: "3 lines", note: "wrap the client, wrap the tools, end the session" },
      { metric: "case-study catch rate", value: "15/15", note: "one 15-line promoted assertion, every time" },
      { metric: "what the LLM judge caught", value: "1–5", note: "same failures, same recordings — depends on prompt wording" },
    ],
    methodology:
      "Replay timing is the repo's own example suite on a laptop; the 15/15 case study is documented in docs/case-study.md with the recordings included.",
    limits:
      "Replay is deterministic for the recorded path. It is not time travel for arbitrary code changes.",
    reference: "reference (M3): full-run replay ~7 ms · $0.00",
    figure: {
      n: 1,
      caption:
        "Replaying this site's own build-verification run: the recorded failure first, then the green run.",
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
      { metric: "precision on HaluEval-QA", value: "94%", note: "judge P=0.936, R=0.644, F1=0.763 · n=500, balanced 50/50" },
      { metric: "latency cut by the NLI pre-filter", value: "19×", note: "clear-cut inputs served in 60 ms locally, no judge call" },
      { metric: "client-code changes", value: "0", note: "drop-in OpenAI proxy — swap the base URL" },
      { metric: "distribution", value: "PyPI", note: "pip install chaincheck; GitHub Action wraps the same core" },
    ],
    methodology:
      "HaluEval-QA restricted to n=500 with a balanced 50/50 split, judged by gpt-4o-mini; the eval harness and the four-method comparison are in the repo.",
    limits:
      "Recall is 64% — roughly a third of hallucinations get through. This browser check replays the ensemble's recorded scores, not live model calls.",
    reference: "reference: NLI pre-filter 60 ms local · judge escalation only when ambiguous",
    figure: { n: 2, caption: "Five-detector ensemble scoring a known hallucinated claim, plus six TruthfulQA samples with recorded judge scores." },
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
      { metric: "pr #142", value: "exit 1", note: '"adds rate limiting to /v2/predict" scored 0.91 — blocked' },
      { metric: "pr #189", value: "exit 0", note: "all three claims supported; highest score 0.18" },
    ],
    methodology:
      "Same detection core as CHK-02, wired to a GitHub Actions step that reads the PR description and the diff and fails when any claim clears the threshold.",
    limits:
      "The threshold is a policy choice; 0.80 favors not blocking legitimate PRs over catching every hallucination.",
    reference: "reference: threshold 0.80 · gate decision is deterministic",
    figure: { n: 3, caption: "Threshold gate over per-claim scores for three sample PRs." },
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
      { metric: "TCP RTT loopback p50 / p99", value: "~78 µs / ~307 µs", note: "same setup; a separate measurement from the walk rate" },
      { metric: "matcher walks 1000 price levels", value: "~94 µs", note: "~10M trades/sec on the matcher alone; TCP-bounded end-to-end ~88k orders/sec" },
      { metric: "group commit vs fsync-per-record", value: "187–245×", note: "batch=256 on the WAL; byte-exact replay + snapshot recovery" },
    ],
    methodology:
      "Release-build Rust on M-series against the repo's own bench harness; the matcher rate and the TCP end-to-end rate are two different measurements and are not merged.",
    limits:
      "The engine running in this tab is a TypeScript port for demonstration. Browser ops/sec is not the Rust number.",
    reference: "reference (M3): ~225 ns in-process · 1000-level walk ~94 µs",
    figure: { n: 4, caption: "Price-time-priority burst match, executed in this tab." },
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
      { metric: "labeled historical incidents detected", value: "7 / 7", note: "0 false negatives on the public benchmark; runs in ~1 s, no API keys" },
      { metric: "RPKI validate per call", value: "~43 µs", note: "859k VRPs, warm cache — ~23k calls/sec" },
      { metric: "speedup shipped on RPKI", value: "500×", note: "linear scan → patricia trie; same machine, dataset, workload" },
      { metric: "announcements in a 70-second sample", value: "149,246", note: "live RIPE RIS global feed, ~1,800 updates/sec" },
    ],
    methodology:
      "Measured on an M3 (16 GB) against the RIPE RIS dump from 2024-01-12; each number is the median of 1,000 runs with the cache pre-warmed. Methodology in BENCHMARK.md.",
    limits:
      "Cold-cache numbers are 1.5–3× slower, and the live check depends on the RIPE RIS feed being reachable — when it isn't, the fallback is labeled, not hidden.",
    reference: "reference (M3): RPKI validate ~43 µs · benchmark ~1 s",
    figure: { n: 5, caption: "RIPE RIS live-feed heartbeat; labeled recorded fallback if unreachable." },
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
      { metric: "raw cost report → per-team breakdown", value: "90 s", note: "end to end; no data leaves the account" },
      { metric: "the leakage-audit correction", value: "97% → 6.9%", note: "honest post-audit accuracy published next to the inflated first cut" },
    ],
    methodology:
      "Behavioral accuracy is measured on the Azure Public Dataset (2.6M VMs) with leakage-audit passes run to strip trivially-predictable features.",
    limits:
      "The honest post-audit behavioral accuracy is 6.9%; the 97% first-cut number was label leakage, and both are published in the repo.",
    reference: "reference (M3): full attribution pass 90 s end to end",
    figure: { n: 6, caption: "Attribution over two synthetic CloudTrail windows; totals must reconcile." },
    source: "https://github.com/pauti04/CostDNA",
    reproduce: "git clone https://github.com/pauti04/CostDNA",
  },
  {
    id: "CHK-07",
    slug: "rasoibot",
    name: "RasoiBot",
    size: "sm",
    claim: "A small recipe assistant that does one thing politely.",
    evidence: [
      { metric: "Indian recipes indexed", value: "12", note: "paneer butter masala, aloo gobi, chole, bhindi masala, tadka dal, masoor dal, sambar, butter chicken, rajma masala, cucumber raita, kadhi pakora, gobi manchurian" },
      { metric: "API calls per query", value: "0", note: "entirely local; streaming is sleep(14ms) between characters" },
    ],
    methodology:
      "Set-intersection over a hand-curated recipe index. There is no benchmark to report; it's a recipe lookup, not a system.",
    limits:
      "The streaming feel is a UX trick, and the README says so out loud.",
    reference: "reference: lookup is O(recipes × ingredients) over an index of 12",
    figure: { n: 7, caption: "Pantry → recipe lookup; the smallest thing on this page." },
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
  "Every benchmark is a single-machine measurement, documented and reproducible — not a distributed-systems claim.",
  "The hallucination detector is a heuristic ensemble. It misses things; the recall number says how often.",
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
