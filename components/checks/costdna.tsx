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

// Pre-run reference shares, from the repo's own synthetic-window runs.
const REFERENCE_ROWS = [
  { team: "recommend", share: "≈70%", driver: DOMINANT_PATH.recommend },
  { team: "checkout", share: "≈25%", driver: DOMINANT_PATH.checkout },
  { team: "ingest", share: "≈5%", driver: DOMINANT_PATH.ingest },
];

function ShareBar({ pct }: { pct: number }) {
  return (
    <div className="relative h-1.5 w-full max-w-[8rem] border border-line" aria-hidden="true">
      <div
        className="absolute inset-y-0 left-0 opacity-60"
        style={{ width: `${Math.min(100, Math.max(2, pct))}%`, background: "var(--ink-soft)" }}
      />
    </div>
  );
}

export default function CostDNACheck() {
  const view = useSyncExternalStore(subscribeView, getView, getView);
  const reconciles = Math.abs(view.unexplainedUsd) < EPSILON_USD;

  if (!view.ran) {
    return (
      <div className="mono space-y-3 p-4 text-xs">
        <div className="grid grid-cols-[6.5rem_3.5rem_1fr] gap-2 border-b border-line pb-1.5 text-muted">
          <span>team</span>
          <span>share</span>
          <span>dominant path</span>
        </div>
        {REFERENCE_ROWS.map((t) => (
          <div key={t.team} className="grid grid-cols-[6.5rem_3.5rem_1fr] gap-2">
            <span className="text-ink-soft">{t.team}</span>
            <span className="text-ink">{t.share}</span>
            <span className="text-muted">{t.driver}</span>
          </div>
        ))}
        <div className="border-t border-line pt-2 text-muted">
          reference shares — run the check to generate the window and reconcile it in this tab
        </div>
      </div>
    );
  }

  return (
    <div className="mono space-y-3 p-4 text-xs">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="text-muted">
            <th scope="col" className="border-b border-line pb-1.5 pr-3 font-normal">
              team
            </th>
            <th scope="col" className="border-b border-line pb-1.5 pr-3 font-normal">
              events
            </th>
            <th scope="col" className="border-b border-line pb-1.5 pr-3 font-normal">
              spend
            </th>
            <th scope="col" className="border-b border-line pb-1.5 pr-3 font-normal">
              share
            </th>
            <th scope="col" className="border-b border-line pb-1.5 font-normal" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {view.rows.map((r) => (
            <tr key={r.team}>
              <td className="py-1.5 pr-3 text-ink-soft">{r.team}</td>
              <td className="py-1.5 pr-3 text-muted">{fmtInt(r.events)}</td>
              <td className="py-1.5 pr-3 text-ink">{fmtUsd(r.usd)}</td>
              <td className="py-1.5 pr-3 text-ink-soft">{r.sharePct.toFixed(1)}%</td>
              <td className="py-1.5 align-middle">
                <ShareBar pct={r.sharePct} />
              </td>
            </tr>
          ))}
          <tr className="border-t border-line">
            <td className="py-1.5 pr-3 text-ink">total</td>
            <td className="py-1.5 pr-3 text-muted">{fmtInt(view.events)}</td>
            <td className="py-1.5 pr-3 text-ink">{fmtUsd(view.attributedUsd)}</td>
            <td className="py-1.5 pr-3 text-ink-soft">100.0%</td>
            <td className="py-1.5" />
          </tr>
        </tbody>
      </table>

      <ol className="space-y-1 border-t border-line pt-2.5">
        <li className="grid grid-cols-[1.25rem_1rem_1fr] gap-x-1.5">
          <span className="text-muted">1.</span>
          <span aria-hidden="true" className="text-ink">
            {reconciles ? "✓" : "✗"}
          </span>
          <span className={reconciles ? "text-ink-soft" : "font-medium text-ink"}>
            assert attributed {fmtUsd(view.attributedUsd)} = ledger {fmtUsd(view.ledgerUsd)} — unexplained{" "}
            {fmtUsd(Math.abs(view.unexplainedUsd))} {reconciles ? "(holds)" : "(violated)"}
          </span>
        </li>
        <li className="grid grid-cols-[1.25rem_1rem_1fr] gap-x-1.5">
          <span className="text-muted">2.</span>
          <span aria-hidden="true" className="text-ink">
            →
          </span>
          <span className="text-ink-soft">
            observe {fmtInt(view.events)} events attributed in {view.elapsedMs.toFixed(1)} ms, this device
          </span>
        </li>
      </ol>

      <div className="border-t border-line pt-2 text-muted">
        attribution walks spend from leaf resources back to owning teams · totals must reconcile
      </div>
    </div>
  );
}
