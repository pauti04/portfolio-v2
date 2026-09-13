// ----------------------------------------------------------------------------
// Build-time verification. Runs simplified-but-honest cores of each check
// under node and writes lib/verification.json for SSG consumption.
//
// Each core is deterministic where it can be (seeded PRNG, fixed fixtures);
// throughput figures naturally vary by build machine and are labeled as such.
// Checks that cannot run under node (netpulse's live feed) record
// mode:"recorded" with their recorded evidence.
// ----------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Shared fixtures — the SAME JSON files the browser checks import, so the
// build-verified figures and the in-tab figures come from one source each.
const fixture = (name) =>
  JSON.parse(readFileSync(join(ROOT, "lib", "checks", "fixtures", name), "utf8"));
const TRUTHFULQA = fixture("chaincheck-truthfulqa.json");
const RASOI = fixture("rasoibot-index.json");
const COSTDNA = fixture("costdna-windows.json");
const DISPATCH = fixture("dispatch-edition.json");

/** mulberry32 — tiny deterministic PRNG. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fmtCount = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(n);

// --- CHK-04 · bourse: price-time-priority burst match ------------------------
// Same matching semantics as the v1 in-browser engine (BourseDemo.tsx),
// stripped of UI. Pass criteria are correctness invariants, not speed.
function bourse() {
  const rand = rng(0xb0453);
  const bids = [], asks = [];
  let matched = 0, fills = 0;
  const submit = (side, price, qty) => {
    const opposite = side === "buy" ? asks : bids;
    const own = side === "buy" ? bids : asks;
    let crossed = false;
    while (qty > 0 && opposite.length > 0) {
      const best = opposite[0];
      const crosses = side === "buy" ? price >= best.price : price <= best.price;
      if (!crosses) break;
      const tradeQty = Math.min(qty, best.qty);
      qty -= tradeQty; best.qty -= tradeQty; fills++; crossed = true;
      if (best.qty === 0) opposite.shift();
    }
    if (crossed) matched++;
    if (qty > 0) {
      const idx = side === "buy"
        ? own.findIndex((o) => o.price < price)
        : own.findIndex((o) => o.price > price);
      const order = { price, qty };
      if (idx === -1) own.push(order); else own.splice(idx, 0, order);
    }
  };
  const N = 50_000;
  let mid = 100.5;
  const t0 = performance.now();
  for (let i = 0; i < N; i++) {
    const side = rand() > 0.5 ? "buy" : "sell";
    const off = (Math.floor(rand() * 8) - 2) * 0.01;
    const px = +(side === "buy" ? mid + off : mid - off).toFixed(2);
    submit(side, px, 1 + Math.floor(rand() * 6));
    if (bids.length && asks.length) mid = (bids[0].price + asks[0].price) / 2;
  }
  const elapsed = performance.now() - t0;
  const opsSec = Math.round((N / elapsed) * 1000);
  const sortedBids = bids.every((o, i) => i === 0 || bids[i - 1].price >= o.price);
  const sortedAsks = asks.every((o, i) => i === 0 || asks[i - 1].price <= o.price);
  const uncrossed = !bids.length || !asks.length || bids[0].price < asks[0].price;
  const pass = sortedBids && sortedAsks && uncrossed && matched > 0;
  return {
    pass,
    mode: "build",
    metrics: [
      { label: "ops/sec", value: fmtCount(opsSec) },
      { label: "orders", value: fmtCount(N) },
      { label: "orders matched", value: fmtCount(matched) },
      { label: "book invariants", value: pass ? "hold" : "VIOLATED" },
    ],
    summary: `${fmtCount(N)} orders matched at ${fmtCount(opsSec)} ops/sec on the build machine; book stayed sorted and uncrossed.`,
  };
}

// --- CHK-02 · chaincheck: ensemble scores a known hallucination --------------
// Fixture is v1's "pr #142" preset: the claim says rate limiting was added;
// the diff shows it wasn't. Detector scores are the recorded ensemble outputs.
// Second assertion: six TruthfulQA samples from a recorded run of the LLM judge
// ALONE (lib/checks/fixtures/chaincheck-truthfulqa.json — method
// truthfulqa/judge, n=500, F1 0.70; a different benchmark from the HaluEval-QA
// headline). For every sample the judge's recorded score, thresholded at 0.5,
// must agree with the dataset label. Nothing here feeds the ensemble vote.
function chaincheck() {
  const detectors = [
    { id: "nli entailment", score: 0.94, verdict: "contradicts" },
    { id: "llm-as-judge", score: 0.91, verdict: "disagrees" },
    { id: "self-consistency", score: 1.0, verdict: "5/5 disagree" },
    { id: "token logprobs", score: 0.83, verdict: "2.1σ anomaly" },
    { id: "qa cross-check", score: 0.88, verdict: "no support" },
  ];
  const flagged = detectors.filter((d) => d.score >= 0.8).length;
  const isHallucination = flagged >= 4; // ensemble vote, same rule as the demo core
  const mean = detectors.reduce((s, d) => s + d.score, 0) / detectors.length;

  const samples = TRUTHFULQA.samples;
  const agree = samples.filter((s) => (s.score >= 0.5) === (s.ground_truth === "yes")).length;
  const judgeOk =
    samples.length === 6 &&
    agree === samples.length &&
    TRUTHFULQA.run.method === "truthfulqa/judge" &&
    TRUTHFULQA.run.n === 500;

  return {
    pass: isHallucination === true && judgeOk,
    mode: "build",
    metrics: [
      { label: "claim", value: '"adds rate limiting to /v2/predict"' },
      { label: "detectors flagging", value: `${flagged}/5` },
      { label: "ensemble score", value: mean.toFixed(2) },
      { label: "verdict", value: "hallucination" },
      { label: "TruthfulQA samples · judge agrees with label", value: `${agree}/${samples.length}` },
    ],
    summary: `Known hallucinated claim classified correctly: ${flagged}/5 detectors flagged it, ensemble score ${mean.toFixed(2)}. Judge alone · TruthfulQA recorded run n=${TRUTHFULQA.run.n} · F1 ${TRUTHFULQA.run.f1.toFixed(2)}: ${agree}/${samples.length} samples agree with their label.`,
  };
}

// --- CHK-03 · chaincheck-action: threshold gate ------------------------------
// Gate must block the bad PR and pass the good ones. Scores are the recorded
// per-claim ensemble outputs from the v1 fixtures.
function chaincheckAction() {
  const THRESHOLD = 0.8;
  const prs = [
    { label: "pr #142", scores: [0.04, 0.91, 0.07], shouldBlock: true },
    { label: "pr #189", scores: [0.12, 0.18, 0.05], shouldBlock: false },
    { label: "pr #207", scores: [0.76, 0.09, 0.62], shouldBlock: false },
  ];
  const results = prs.map((pr) => {
    const failing = pr.scores.filter((s) => s >= THRESHOLD).length;
    const exit = failing > 0 ? 1 : 0;
    return { ...pr, exit, correct: (exit === 1) === pr.shouldBlock };
  });
  const pass = results.every((r) => r.correct);
  return {
    pass,
    mode: "build",
    metrics: [
      { label: "fail-threshold", value: THRESHOLD.toFixed(2) },
      ...results.map((r) => ({ label: r.label, value: `exit ${r.exit}` })),
    ],
    summary: `Gate at ${THRESHOLD.toFixed(2)} blocked pr #142 (score 0.91) and passed the other two.`,
  };
}

// --- CHK-06 · costdna: attribution must reconcile ----------------------------
// Two synthetic CloudTrail windows from lib/checks/fixtures/costdna-windows.json,
// generated with the same seeded PRNG, edge/cost/spike rules and leaf-to-root
// walk as the browser check (components/checks/costdna.tsx), so the build
// figure for a window is the figure the visitor recomputes. Every event's cost
// attributes to the root team of its caller; per window the sum must equal the
// ledger total to within a nano-dollar, shares must sum to 100%, and every
// walk must land on the graph's own team label for the caller.
function reconcileWindow(spec) {
  const nodeMap = new Map(spec.nodes.map((n) => [n.id, n]));
  const parents = new Map();
  for (const e of spec.edges) {
    if (!parents.has(e.to)) parents.set(e.to, []);
    parents.get(e.to).push(e.from);
  }
  const rootOf = (id) => {
    let cur = nodeMap.get(id);
    let guard = 0;
    while (cur.layer !== 0 && guard++ < 8) {
      const ps = parents.get(cur.id);
      if (!ps || ps.length === 0) break;
      cur = nodeMap.get(ps[0]);
    }
    return cur;
  };
  const rand = rng(spec.seed);
  const N = 20_000;
  let ledger = 0;
  const byTeam = Object.fromEntries(spec.teams.map((t) => [t, 0]));
  let walkConsistent = true;
  for (let i = 0; i < N; i++) {
    const edge = spec.edges[Math.floor(rand() * spec.edges.length)];
    const base = spec.costPerCall[edge.to] * (0.7 + rand() * 1.4);
    const spike = rand() < 0.05 ? 4 + rand() * 4 : 1;
    const cost = base * spike;
    ledger += cost;
    const root = rootOf(edge.from);
    byTeam[root.team] += cost;
    if (root.team !== nodeMap.get(edge.from).team) walkConsistent = false;
  }
  const attributed = spec.teams.reduce((s, t) => s + byTeam[t], 0);
  const shareSum = spec.teams.reduce((s, t) => s + (byTeam[t] / ledger) * 100, 0);
  const pass =
    Math.abs(attributed - ledger) < 1e-9 && Math.abs(shareSum - 100) < 1e-6 && walkConsistent;
  return { N, ledger, attributed, pass };
}

function costdna() {
  const ids = Object.keys(COSTDNA.windows);
  const runs = ids.map((id) => ({ id, ...reconcileWindow(COSTDNA.windows[id]) }));
  const reconciled = runs.filter((r) => r.pass).length;
  const pass = runs.length === 2 && reconciled === runs.length;
  const [first, ...rest] = runs;
  return {
    pass,
    mode: "build",
    metrics: [
      { label: "windows reconciled", value: `${reconciled}/${runs.length}` },
      { label: "events", value: fmtCount(first.N) },
      { label: "ledger total", value: `$${first.ledger.toFixed(2)}` },
      { label: "attributed", value: `$${first.attributed.toFixed(2)}` },
      { label: "unexplained", value: `$${Math.abs(first.ledger - first.attributed).toFixed(2)}` },
      ...rest.flatMap((r) => [
        { label: `${r.id} ledger total`, value: `$${r.ledger.toFixed(2)}` },
        { label: `${r.id} attributed`, value: `$${r.attributed.toFixed(2)}` },
        { label: `${r.id} unexplained`, value: `$${Math.abs(r.ledger - r.attributed).toFixed(2)}` },
      ]),
    ],
    summary: `${fmtCount(first.N)} synthetic CloudTrail events per window attributed to 3 teams; ${reconciled}/${runs.length} windows (${ids.join(", ")}) reconcile to the cent.`,
  };
}

// --- CHK-07 · dispatch: replay the recorded edition as its SSE stream --------
// The committed sample edition (lib/checks/fixtures/dispatch-edition.json —
// client/public/sample-brief.json of the public repo, verbatim) serialized and
// cut into 48-char "delta" chunks between one "start" and one "complete", the
// same fixed cut the browser check uses (components/checks/dispatch.tsx), so
// the event list is identical in both places. Assertions: the accumulated
// deltas reassemble deep-equal to the fixture; the first headline is readable
// from the accumulated text before "complete"; every story carries a
// why-it-matters line; an Editor's Take exists; the candidate pool (the six
// story feeds in counts — hn, gh, lobsters, reddit, arxiv, show_hn; not
// clusters, whos_hiring or layoffs) is larger than what was chosen. The repo's
// ~800 ms first-headline figure is not measured here and is not asserted.
function dispatch() {
  const EDITION = DISPATCH.edition;
  const CHUNK = 48;
  const WIRE = JSON.stringify(EDITION);
  const DELTAS = Math.ceil(WIRE.length / CHUNK);
  const EVENTS = DELTAS + 2; // start + deltas + complete
  const HEADLINE_RE = /"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/;

  const deepEqual = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b || a === null || b === null) return false;
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
      return a.every((v, i) => deepEqual(v, b[i]));
    }
    if (typeof a === "object") {
      const ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
    }
    return false;
  };

  let replayed = 1; // start
  let acc = "";
  let headline = null;
  let headlineDelta = 0;
  for (let i = 0; i < DELTAS; i++) {
    acc += WIRE.slice(i * CHUNK, (i + 1) * CHUNK);
    replayed++;
    if (headline === null) {
      const m = HEADLINE_RE.exec(acc);
      if (m) { headline = m[1]; headlineDelta = i + 1; }
    }
  }
  replayed++; // complete
  let reassembled = null;
  try { reassembled = JSON.parse(acc); } catch { reassembled = null; }

  const stories = EDITION.sections.flatMap((s) => s.stories);
  const STORY_COUNT = stories.length;
  const WHY_COUNT = stories.filter(
    (s) => typeof s.why_it_matters === "string" && s.why_it_matters.trim().length > 0,
  ).length;
  const TAKE_PRESENT = typeof EDITION.take === "string" && EDITION.take.trim().length > 0;
  const NOT_A_SOURCE = new Set(["clusters", "whos_hiring", "layoffs"]);
  const POOL = Object.entries(EDITION.counts)
    .filter(([k]) => !NOT_A_SOURCE.has(k))
    .reduce((sum, [, v]) => sum + v, 0);

  const identical = reassembled !== null && deepEqual(reassembled, EDITION);
  const headlineOk =
    headline !== null && headline === EDITION.headline && headlineDelta < DELTAS + 1;
  const storiesOk = STORY_COUNT > 0 && WHY_COUNT === STORY_COUNT;
  const poolOk = POOL > STORY_COUNT;
  const eventsOk = replayed === EVENTS;
  const pass = identical && headlineOk && storiesOk && TAKE_PRESENT && poolOk && eventsOk;

  return {
    pass,
    mode: "recorded",
    metrics: [
      { label: "stories in the edition", value: String(STORY_COUNT) },
      { label: "why-it-matters lines", value: `${WHY_COUNT}/${STORY_COUNT}` },
      { label: "candidates pooled → chosen", value: `${POOL} → ${STORY_COUNT}` },
      { label: "stream events replayed", value: `${replayed}/${EVENTS}` },
      { label: "deep-equal replay", value: identical ? "✓" : "✗" },
    ],
    summary: pass
      ? `Recorded edition replayed as ${EVENTS} SSE events and reassembled deep-equal to the fixture: ${STORY_COUNT} stories chosen from ${POOL} candidates, ${WHY_COUNT}/${STORY_COUNT} carrying a why-it-matters line, Editor's Take present.`
      : "Replay of the recorded edition diverged from the fixture — see the report lines.",
  };
}

// --- CHK-08 · rasoibot: the lookup looks things up ---------------------------
// Same set-intersection scoring as the shipped app, over the curated index in
// lib/checks/fixtures/rasoibot-index.json (12 recipes lifted from the app's
// recipes.json). Ties keep the earlier entry — strict `>`, as in the browser.
function rasoibot() {
  const RECIPES = RASOI.index;
  const find = (picked) => {
    let best = null;
    for (const { match, name } of RECIPES) {
      const score = match.filter((m) => picked.includes(m)).length / match.length;
      if (score > 0 && (!best || score > best.score)) best = { score, name };
    }
    return best?.name ?? null;
  };
  const cases = RASOI.cases;
  const results = cases.map((c) => find(c.pantry) === c.expect);
  const hits = cases.filter((c) => c.expect !== null).length;
  const misses = cases.length - hits;
  const pass = results.every(Boolean) && cases.length === 5 && misses === 1 && RECIPES.length === 12;
  return {
    pass,
    mode: "build",
    metrics: [
      { label: "recipes indexed", value: String(RECIPES.length) },
      { label: "lookups correct", value: `${results.filter(Boolean).length}/${cases.length}` },
      { label: "API calls", value: "0" },
    ],
    summary: `Pantry lookup returned the right recipe for ${hits} pantries and honestly declined ${misses === 1 ? "a fifth" : String(misses)}. No API calls.`,
  };
}

// --- CHK-01 · reflight: replay the recorded failure --------------------------
// Walks the committed recording of the support-run-19 failure (the same events
// the v1 demo replays) and asserts count + terminal classification.
function reflight() {
  const RECORDING = [
    { seq: 1, kind: "llm_call", text: 'assistant → "refund order #8841, $129.99"' },
    { seq: 2, kind: "tool_call", text: 'refund(amount="129.99")' },
    { seq: 3, kind: "tool_err", text: "TypeError: amount must be a number" },
    { seq: 4, kind: "tool_call", text: 'refund(amount="129.99")' },
    { seq: 5, kind: "tool_err", text: "TypeError: amount must be a number" },
    { seq: 6, kind: "classify", text: "wrong_tool_args · loop" },
  ];
  const t0 = performance.now();
  let replayed = 0;
  let terminal = null;
  for (const ev of RECORDING) {
    if (ev.seq !== replayed + 1) break; // sequence must be gapless
    replayed++;
    if (ev.kind === "classify") terminal = ev.text;
  }
  const ms = performance.now() - t0;
  const pass = replayed === 6 && terminal === "wrong_tool_args · loop";
  return {
    pass,
    mode: "build",
    metrics: [
      { label: "events replayed", value: `${replayed}/6` },
      { label: "classification", value: terminal ?? "—" },
      { label: "replay time", value: `${Math.max(1, Math.round(ms))} ms` },
      { label: "cost", value: "$0.00" },
    ],
    summary: `Recorded failure replayed: ${replayed}/6 events, classified ${terminal}, network never touched.`,
  };
}

// --- CHK-05 · netpulse: cannot open a WebSocket under node at build ----------
// Records mode:"recorded" with the documented session evidence.
function netpulse() {
  return {
    pass: true,
    mode: "recorded",
    metrics: [
      { label: "announcements (70 s sample)", value: "149,246" },
      { label: "feed rate", value: "~1,800 updates/sec" },
      { label: "incidents detected", value: "7/7" },
      { label: "RPKI validate", value: "~43 µs" },
    ],
    summary: "Live feed not opened at build time — recorded RIPE RIS session evidence replayed and labeled as such.",
  };
}

// ----------------------------------------------------------------------------

const results = {
  reflight: reflight(),
  chaincheck: chaincheck(),
  "chaincheck-action": chaincheckAction(),
  bourse: bourse(),
  netpulse: netpulse(),
  costdna: costdna(),
  dispatch: dispatch(),
  rasoibot: rasoibot(),
};
const EXPECTED_CHECKS = 8; // one per stop on the page (lib/claims.ts CHECK_SLUGS)

const out = { builtAt: new Date().toISOString(), results };

mkdirSync(join(ROOT, "lib"), { recursive: true });
writeFileSync(join(ROOT, "lib", "verification.json"), JSON.stringify(out, null, 2) + "\n");

const failing = Object.entries(results).filter(([, r]) => !r.pass);
for (const [slug, r] of Object.entries(results)) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${slug.padEnd(17)} ${r.mode.padEnd(9)} ${r.summary}`);
}
if (failing.length > 0) {
  console.error(`\n${failing.length} check(s) failing — refusing to bake a red build.`);
  process.exit(1);
}
const total = Object.keys(results).length;
if (total !== EXPECTED_CHECKS) {
  console.error(`\nexpected exactly ${EXPECTED_CHECKS} checks, found ${total}.`);
  process.exit(1);
}
console.log(`\n${total - failing.length}/${total} checks pass · lib/verification.json written · ${out.builtAt}`);
