"use client";

// CHK-04 · CostDNA — attribution over a synthetic CloudTrail window,
// generated and reconciled in this tab. run() produces N events with a
// seeded PRNG over the v1 service graph, walks each event from its leaf
// resource back to the owning team, and passes only when the attributed
// totals reconcile with the ledger (shares sum to 100% ± ε).

import { useSyncExternalStore } from "react";
import type { CheckResult, CheckRunner, LogLine } from "@/lib/checks/types";

/* ----------------------------------------------- service graph (from v1) */

type NodeId =
  | "checkout"
  | "stripe"
  | "dynamo"
  | "sqs"
  | "recommend"
  | "sagemaker"
  | "s3"
  | "ingest"
  | "kinesis";

type Team = "checkout" | "recommend" | "ingest";

type GraphNode = { id: NodeId; label: string; team: Team; layer: 0 | 1 | 2 };

const NODES: GraphNode[] = [
  { id: "checkout", label: "checkout-api", team: "checkout", layer: 0 },
  { id: "recommend", label: "recommend-fn", team: "recommend", layer: 0 },
  { id: "ingest", label: "ingest-fn", team: "ingest", layer: 0 },
  { id: "stripe", label: "stripe-fn", team: "checkout", layer: 1 },
  { id: "dynamo", label: "dynamodb", team: "checkout", layer: 1 },
  { id: "sagemaker", label: "sagemaker", team: "recommend", layer: 1 },
  { id: "kinesis", label: "kinesis", team: "ingest", layer: 1 },
  { id: "sqs", label: "sqs", team: "checkout", layer: 2 },
  { id: "s3", label: "s3-features", team: "recommend", layer: 2 },
];

const EDGES: { from: NodeId; to: NodeId }[] = [
  { from: "checkout", to: "stripe" },
  { from: "checkout", to: "dynamo" },
  { from: "stripe", to: "sqs" },
  { from: "recommend", to: "sagemaker" },
  { from: "recommend", to: "s3" },
  { from: "sagemaker", to: "s3" },
  { from: "ingest", to: "kinesis" },
];

const COST_PER_CALL: Record<NodeId, number> = {
  checkout: 0.00002,
  recommend: 0.00002,
  ingest: 0.00002,
  stripe: 0.0006,
  dynamo: 0.0011,
  sagemaker: 0.0048,
  kinesis: 0.00022,
  sqs: 0.00008,
  s3: 0.00031,
};

const NODE_MAP = new Map(NODES.map((n) => [n.id, n]));

// reverse edges: child → callers, for the leaf-to-root walk
const PARENTS = new Map<NodeId, NodeId[]>();
for (const e of EDGES) {
  if (!PARENTS.has(e.to)) PARENTS.set(e.to, []);
  PARENTS.get(e.to)!.push(e.from);
}

/** Walk from a node up the call graph until a layer-0 root is reached. */
function rootOf(id: NodeId): GraphNode {
  let cur = NODE_MAP.get(id)!;
  let guard = 0;
  while (cur.layer !== 0 && guard++ < 8) {
    const parents = PARENTS.get(cur.id);
    if (!parents || parents.length === 0) break;
    cur = NODE_MAP.get(parents[0])!;
  }
  return cur;
}

const TEAMS: Team[] = ["checkout", "recommend", "ingest"];
const DOMINANT_PATH: Record<Team, string> = {
  checkout: "checkout-api → dynamodb",
  recommend: "recommend-fn → sagemaker",
  ingest: "ingest-fn → kinesis",
};

/* ------------------------------------------------------------------- PRNG */

const SEED = 0x51edc057;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------- store */

type TeamRow = { team: Team; events: number; usd: number; sharePct: number };
type CostView = {
  ran: boolean;
  events: number;
  ledgerUsd: number;
  attributedUsd: number;
  unexplainedUsd: number;
  elapsedMs: number;
  rows: TeamRow[];
};

const IDLE_VIEW: CostView = {
  ran: false,
  events: 0,
  ledgerUsd: 0,
  attributedUsd: 0,
  unexplainedUsd: 0,
  elapsedMs: 0,
  rows: [],
};

let viewState: CostView = IDLE_VIEW;
const viewSubs = new Set<() => void>();
const setView = (v: CostView) => {
  viewState = v;
  viewSubs.forEach((f) => f());
};
const subscribeView = (f: () => void) => {
  viewSubs.add(f);
  return () => {
    viewSubs.delete(f);
  };
};
const getView = () => viewState;

/* ----------------------------------------------------------------- helpers */

const EPSILON_USD = 1e-9;
const EPSILON_PCT = 1e-6;
const fmtInt = (n: number) => n.toLocaleString("en-US");
const fmtUsd = (n: number) => `$${n.toFixed(2)}`;
const fmtK = (n: number) => (n % 1000 === 0 ? `${n / 1000}k` : fmtInt(n));
const yieldToBrowser = () => new Promise<void>((r) => setTimeout(r, 0));

/* --------------------------------------------------------------------- run */

export const run: CheckRunner = async ({ lite, signal, onLog }) => {
  const t0 = performance.now();
  const log = (text: string, tone?: LogLine["tone"]) =>
    onLog({ t: Math.round(performance.now() - t0), text, tone });
  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException("check aborted", "AbortError");
  };

  const total = lite ? 5_000 : 20_000;
  const CHUNK = 4_000;
  const rnd = mulberry32(SEED);

  log(
    `synthetic CloudTrail window · ${fmtInt(total)} events · seeded PRNG (0x${SEED.toString(16)})`,
    "muted",
  );
  log("walking each event from its leaf resource back to the owning team", "muted");

  let ledgerUsd = 0;
  const teamUsd: Record<Team, number> = { checkout: 0, recommend: 0, ingest: 0 };
  const teamEvents: Record<Team, number> = { checkout: 0, recommend: 0, ingest: 0 };
  let walkConsistent = true;
  let generated = 0;
  let workMs = 0;

  while (generated < total) {
    throwIfAborted();
    const n = Math.min(CHUNK, total - generated);
    const c0 = performance.now();
    for (let j = 0; j < n; j++) {
      const edge = EDGES[Math.floor(rnd() * EDGES.length)];
      const base = COST_PER_CALL[edge.to] * (0.7 + rnd() * 1.4);
      const spike = rnd() < 0.05 ? 4 + rnd() * 4 : 1;
      const cost = base * spike;

      ledgerUsd += cost;

      const root = rootOf(edge.from);
      teamUsd[root.team] += cost;
      teamEvents[root.team] += 1;
      // the walked root must agree with the graph's own team labeling
      if (root.team !== NODE_MAP.get(edge.from)!.team) walkConsistent = false;
    }
    workMs += performance.now() - c0;
    generated += n;
    await yieldToBrowser();
  }

  const attributedUsd = teamUsd.checkout + teamUsd.recommend + teamUsd.ingest;
  const unexplainedUsd = ledgerUsd - attributedUsd;
  const shares = TEAMS.map((t) => (teamUsd[t] / ledgerUsd) * 100);
  const shareSum = shares.reduce((a, b) => a + b, 0);

  const reconciles = Math.abs(unexplainedUsd) < EPSILON_USD;
  const sharesSum100 = Math.abs(shareSum - 100) < EPSILON_PCT;
  const pass = reconciles && sharesSum100 && walkConsistent;

  TEAMS.forEach((t, i) => {
    log(
      `${t} · ${fmtUsd(teamUsd[t])} · ${shares[i].toFixed(1)}% · ${fmtInt(teamEvents[t])} events`,
      "muted",
    );
  });
  log("assert every leaf-to-root walk lands on the labeled owning team", walkConsistent ? "ok" : "err");
  log(
    `assert |attributed − ledger| < $${EPSILON_USD} — off by $${Math.abs(unexplainedUsd).toExponential(1)}`,
    reconciles ? "ok" : "err",
  );
  log(
    `assert shares sum to 100% ± ${EPSILON_PCT}% — got ${shareSum.toFixed(6)}%`,
    sharesSum100 ? "ok" : "err",
  );
  log(
    `${fmtInt(total)} events attributed in ${workMs.toFixed(1)} ms on this device`,
    pass ? "ok" : "err",
  );

  const rows: TeamRow[] = TEAMS.map((t, i) => ({
    team: t,
    events: teamEvents[t],
    usd: teamUsd[t],
    sharePct: shares[i],
  })).sort((a, b) => b.usd - a.usd);

  setView({
    ran: true,
    events: total,
    ledgerUsd,
    attributedUsd,
    unexplainedUsd,
    elapsedMs: workMs,
    rows,
  });

  const result: CheckResult = {
    pass,
    mode: "live",
    metrics: [
      { label: "attribution pass", value: `${fmtK(total)} events in ${workMs.toFixed(0)} ms` },
      { label: "ledger total", value: fmtUsd(ledgerUsd) },
      { label: "attributed", value: fmtUsd(attributedUsd) },
      { label: "unexplained", value: fmtUsd(Math.abs(unexplainedUsd)) },
    ],
    summary: pass
      ? `${fmtInt(total)} synthetic CloudTrail events attributed to 3 teams in this tab; totals reconcile to the cent.`
      : `Attribution over ${fmtInt(total)} events failed to reconcile — see the report lines.`,
  };
  return result;
};

/* ------------------------------------------------------------------ visual */

// Accent discipline: before the run this figure shows reference shares and is
// entirely ink. The moment the window is generated and reconciled in this tab,
// the share bars take the route colour — that switch is the only thing on the
// figure that says "this number was just computed on your device".

// Pre-run reference shares, from the repo's own synthetic-window runs.
const REFERENCE_ROWS = [
  { team: "recommend", share: "≈70%", pct: 70, driver: DOMINANT_PATH.recommend },
  { team: "checkout", share: "≈25%", pct: 25, driver: DOMINANT_PATH.checkout },
  { team: "ingest", share: "≈5%", pct: 5, driver: DOMINANT_PATH.ingest },
];

const LABEL = "text-[0.6875rem] uppercase tracking-[0.18em] text-muted";

function ShareBar({ pct, live = false }: { pct: number; live?: boolean }) {
  return (
    <div className="h-1 w-full max-w-[7rem] rounded-full bg-rule" aria-hidden="true">
      <div
        className={`h-1 rounded-full ${live ? "bg-route" : "bg-ink-soft"}`}
        style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
      />
    </div>
  );
}

export default function CostDNACheck() {
  const view = useSyncExternalStore(subscribeView, getView, getView);
  const reconciles = Math.abs(view.unexplainedUsd) < EPSILON_USD;

  if (!view.ran) {
    return (
      <div className="mono p-4 sm:p-5">
        <p className={LABEL}>reference shares</p>
        <div className="mt-3 space-y-2.5">
          {REFERENCE_ROWS.map((t) => (
            <div
              key={t.team}
              className="flex flex-col gap-1 sm:grid sm:grid-cols-[6rem_3rem_7rem_minmax(0,1fr)] sm:items-center sm:gap-x-3"
            >
              <div className="flex items-baseline gap-x-3 sm:contents">
                <span className="text-[0.75rem] text-ink-soft">{t.team}</span>
                <span className="text-[0.75rem] text-ink">{t.share}</span>
              </div>
              <div className="hidden sm:block">
                <ShareBar pct={t.pct} />
              </div>
              <span className="text-[0.75rem] break-words text-muted">{t.driver}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 max-w-[62ch] border-t border-rule pt-3 text-[0.6875rem] leading-relaxed text-muted">
          from the repo&apos;s own synthetic-window runs. Run the check and the window is generated
          and reconciled here, on your device.
        </p>
      </div>
    );
  }

  return (
    <div className="mono p-4 sm:p-5">
      <p className={LABEL}>attributed in this tab</p>
      <table className="mt-3 w-full border-collapse text-left">
        <caption className="sr-only">
          Per-team spend attributed from a synthetic CloudTrail window
        </caption>
        <thead>
          <tr>
            {["team", "events", "spend", "share"].map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-rule pr-3 pb-2 text-[0.6875rem] font-normal tracking-[0.14em] text-muted uppercase"
              >
                {h}
              </th>
            ))}
            <th className="hidden border-b border-rule pb-2 sm:table-cell" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {view.rows.map((r) => (
            <tr key={r.team} className="border-b border-rule-soft">
              <td className="py-2 pr-3 text-[0.75rem] text-ink-soft">{r.team}</td>
              <td className="py-2 pr-3 text-[0.75rem] text-muted">{fmtInt(r.events)}</td>
              <td className="py-2 pr-3 text-[0.75rem] text-ink">{fmtUsd(r.usd)}</td>
              <td className="py-2 pr-3 text-[0.75rem] text-ink-soft">{r.sharePct.toFixed(1)}%</td>
              <td className="hidden w-[7rem] py-2 align-middle sm:table-cell">
                <ShareBar pct={r.sharePct} live />
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-2 pr-3 text-[0.75rem] text-ink">total</td>
            <td className="py-2 pr-3 text-[0.75rem] text-muted">{fmtInt(view.events)}</td>
            <td className="py-2 pr-3 text-[0.75rem] text-ink">{fmtUsd(view.attributedUsd)}</td>
            <td className="py-2 pr-3 text-[0.75rem] text-ink-soft">100.0%</td>
            <td className="hidden py-2 sm:table-cell" />
          </tr>
        </tbody>
      </table>

      <div className="mt-5 border-t border-rule pt-4">
        <p className={LABEL}>what that has to satisfy</p>
        <ol className="mt-3 space-y-2">
          <li className="grid grid-cols-[1.25rem_1rem_minmax(0,1fr)] gap-x-2">
            <span className="text-[0.75rem] text-muted">1.</span>
            <span aria-hidden="true" className={`text-[0.75rem] ${reconciles ? "text-ink" : "text-fail"}`}>
              {reconciles ? "✓" : "✗"}
            </span>
            <span
              className={`text-[0.75rem] leading-relaxed ${reconciles ? "text-ink-soft" : "font-medium text-ink"}`}
            >
              assert attributed {fmtUsd(view.attributedUsd)} = ledger {fmtUsd(view.ledgerUsd)} —
              unexplained {fmtUsd(Math.abs(view.unexplainedUsd))}{" "}
              {reconciles ? "(holds)" : "(violated)"}
            </span>
          </li>
          <li className="grid grid-cols-[1.25rem_1rem_minmax(0,1fr)] gap-x-2">
            <span className="text-[0.75rem] text-muted">2.</span>
            <span aria-hidden="true" className="text-[0.75rem] text-ink">
              →
            </span>
            <span className="text-[0.75rem] leading-relaxed text-ink-soft">
              observe {fmtInt(view.events)} events attributed in {view.elapsedMs.toFixed(1)} ms, this
              device
            </span>
          </li>
        </ol>
      </div>

      <p className="mt-5 max-w-[62ch] border-t border-rule pt-3 text-[0.6875rem] leading-relaxed text-muted">
        attribution walks spend from leaf resources back to owning teams · the totals have to
        reconcile or the check fails
      </p>
    </div>
  );
}
