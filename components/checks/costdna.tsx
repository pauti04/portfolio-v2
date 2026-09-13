"use client";

// CHK-06 · CostDNA — attribution over a synthetic CloudTrail window,
// generated and reconciled in this tab. run() produces N events with a
// seeded PRNG over the selected service graph, walks each event from its leaf
// resource back to the owning team, and passes only when the attributed
// totals reconcile with the ledger (shares sum to 100% ± ε).
//
// Two windows live in lib/checks/fixtures/costdna-windows.json — the same
// file scripts/verify.mjs reconciles at build time, so the "verified at
// build" figures and the numbers computed here come from one graph each.
// The visitor picks a window; run() reconciles whichever is selected.

import { useSyncExternalStore } from "react";
import type { CheckResult, CheckRunner, LogLine } from "@/lib/checks/types";
import windowsFile from "@/lib/checks/fixtures/costdna-windows.json";
import verification from "@/lib/verification.json";

/* ------------------------------------------------- service graphs (fixture) */

type GraphNode = { id: string; label: string; team: string; layer: number };
type Edge = { from: string; to: string };
type WindowSpec = {
  label: string;
  blurb: string;
  seed: number;
  teams: string[];
  nodes: GraphNode[];
  edges: Edge[];
  costPerCall: Record<string, number>;
  dominantPath: Record<string, string>;
  reference?: { note: string; rows: { team: string; share: string; pct: number }[] };
};

const WINDOWS = windowsFile.windows as unknown as Record<string, WindowSpec>;
export type WindowId = keyof typeof windowsFile.windows;
export const WINDOW_IDS = Object.keys(windowsFile.windows) as WindowId[];

type Graph = {
  id: WindowId;
  spec: WindowSpec;
  nodeMap: Map<string, GraphNode>;
  // reverse edges: child → callers, for the leaf-to-root walk
  parents: Map<string, string[]>;
};

function buildGraph(id: WindowId): Graph {
  const spec = WINDOWS[id];
  const nodeMap = new Map(spec.nodes.map((n) => [n.id, n]));
  const parents = new Map<string, string[]>();
  for (const e of spec.edges) {
    if (!parents.has(e.to)) parents.set(e.to, []);
    parents.get(e.to)!.push(e.from);
  }
  return { id, spec, nodeMap, parents };
}

const GRAPHS = Object.fromEntries(WINDOW_IDS.map((id) => [id, buildGraph(id)])) as Record<
  WindowId,
  Graph
>;

/** Walk from a node up the call graph until a layer-0 root is reached. */
function rootOf(g: Graph, id: string): GraphNode {
  let cur = g.nodeMap.get(id)!;
  let guard = 0;
  while (cur.layer !== 0 && guard++ < 8) {
    const parents = g.parents.get(cur.id);
    if (!parents || parents.length === 0) break;
    cur = g.nodeMap.get(parents[0])!;
  }
  return cur;
}

/* ------------------------------------------------------------------- PRNG */

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

type TeamRow = { team: string; events: number; usd: number; sharePct: number };
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

// One view per window, so switching windows after a run keeps each result.
let viewState: Record<WindowId, CostView> = Object.fromEntries(
  WINDOW_IDS.map((id) => [id, IDLE_VIEW]),
) as Record<WindowId, CostView>;
const viewSubs = new Set<() => void>();
const setView = (id: WindowId, v: CostView) => {
  viewState = { ...viewState, [id]: v };
  viewSubs.forEach((f) => f());
};
const subscribeView = (f: () => void) => {
  viewSubs.add(f);
  return () => {
    viewSubs.delete(f);
  };
};
const getView = () => viewState;

// The selected window lives outside React so run() — invoked by the
// RunAllProvider, not by this component — reconciles what the visitor picked.
let selectedWindow: WindowId = WINDOW_IDS[0];
const selectSubs = new Set<() => void>();
const setSelectedWindow = (id: WindowId) => {
  selectedWindow = id;
  selectSubs.forEach((f) => f());
};
const subscribeSelected = (f: () => void) => {
  selectSubs.add(f);
  return () => {
    selectSubs.delete(f);
  };
};
const getSelected = () => selectedWindow;

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

  const windowId = getSelected();
  const g = GRAPHS[windowId];
  const { edges: EDGES, costPerCall: COST_PER_CALL, teams: TEAMS, seed: SEED } = g.spec;

  const total = lite ? 5_000 : 20_000;
  const CHUNK = 4_000;
  const rnd = mulberry32(SEED);

  log(
    `synthetic CloudTrail window "${g.spec.label}" · ${fmtInt(total)} events · seeded PRNG (0x${SEED.toString(16)})`,
    "muted",
  );
  log("walking each event from its leaf resource back to the owning team", "muted");

  let ledgerUsd = 0;
  const teamUsd: Record<string, number> = Object.fromEntries(TEAMS.map((t) => [t, 0]));
  const teamEvents: Record<string, number> = Object.fromEntries(TEAMS.map((t) => [t, 0]));
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

      const root = rootOf(g, edge.from);
      teamUsd[root.team] += cost;
      teamEvents[root.team] += 1;
      // the walked root must agree with the graph's own team labeling
      if (root.team !== g.nodeMap.get(edge.from)!.team) walkConsistent = false;
    }
    workMs += performance.now() - c0;
    generated += n;
    await yieldToBrowser();
  }

  const attributedUsd = TEAMS.reduce((sum, t) => sum + teamUsd[t], 0);
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

  setView(windowId, {
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
      { label: "window", value: g.spec.label },
      { label: "attribution pass", value: `${fmtK(total)} events in ${workMs.toFixed(0)} ms` },
      { label: "ledger total", value: fmtUsd(ledgerUsd) },
      { label: "attributed", value: fmtUsd(attributedUsd) },
      { label: "unexplained", value: fmtUsd(Math.abs(unexplainedUsd)) },
    ],
    summary: pass
      ? `${fmtInt(total)} synthetic CloudTrail events (${g.spec.label} window) attributed to ${TEAMS.length} teams in this tab; totals reconcile to the cent.`
      : `Attribution over ${fmtInt(total)} events (${g.spec.label} window) failed to reconcile — see the report lines.`,
  };
  return result;
};

/* ------------------------------------------------------------------ visual */

// Accent discipline: before the run this figure shows reference shares and is
// entirely ink. The moment the window is generated and reconciled in this tab,
// the share bars take the route colour — that switch is the only thing on the
// figure that says "this number was just computed on your device".

type VerificationFile = {
  builtAt: string;
  results: Record<string, { pass: boolean; metrics: { label: string; value: string }[] }>;
};
const BUILD = (verification as VerificationFile).results.costdna;

/**
 * Build-verified reconciliation for one window, read from verification.json.
 * verify.mjs labels the ecommerce window's metrics plainly ("ledger total",
 * "attributed", "unexplained") and prefixes any other window's with its id
 * ("data-platform ledger total", …). Missing labels render as "—" rather than
 * a made-up figure.
 */
function buildFigures(id: WindowId) {
  const prefix = id === WINDOW_IDS[0] ? "" : `${id} `;
  const pick = (label: string) =>
    BUILD?.metrics.find((m) => m.label === `${prefix}${label}`)?.value ?? "—";
  return {
    ledger: pick("ledger total"),
    attributed: pick("attributed"),
    unexplained: pick("unexplained"),
    known: BUILD?.metrics.some((m) => m.label === `${prefix}ledger total`) ?? false,
  };
}

/**
 * Pre-run reference shares. The ecommerce window carries the repo's own
 * recorded shares; a window without a recorded run shows what the graph's
 * per-call costs imply (every edge equiprobable, spikes team-neutral) and
 * says so.
 */
function referenceRows(g: Graph) {
  const { spec } = g;
  if (spec.reference) {
    return {
      note: spec.reference.note,
      rows: spec.reference.rows.map((r) => ({ ...r, driver: spec.dominantPath[r.team] })),
    };
  }
  const perTeam: Record<string, number> = Object.fromEntries(spec.teams.map((t) => [t, 0]));
  for (const e of spec.edges) perTeam[rootOf(g, e.from).team] += spec.costPerCall[e.to];
  const sum = Object.values(perTeam).reduce((a, b) => a + b, 0);
  return {
    note: "expected from the graph's per-call costs — no recorded run for this window",
    rows: spec.teams
      .map((t) => {
        const pct = (perTeam[t] / sum) * 100;
        return { team: t, share: `≈${Math.round(pct)}%`, pct, driver: spec.dominantPath[t] };
      })
      .sort((a, b) => b.pct - a.pct),
  };
}

const LABEL = "text-[0.6875rem] uppercase tracking-[0.18em] text-muted";

function ShareBar({ pct, live = false }: { pct: number; live?: boolean }) {
  return (
    <div className="h-1 w-full max-w-[7rem] rounded-full bg-rule" aria-hidden="true">
      <div
        className={`h-1 rounded-full ${live ? "proj-fill" : "bg-ink-soft"}`}
        style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
      />
    </div>
  );
}

function WindowPicker({ selected }: { selected: WindowId }) {
  return (
    <>
      <p className={LABEL}>window</p>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="synthetic window picker">
        {WINDOW_IDS.map((id) => {
          const on = id === selected;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setSelectedWindow(id)}
              className={`rounded-full border px-2.5 py-1 text-[0.6875rem] transition-colors ${
                on
                  ? "border-ink-soft bg-panel text-ink"
                  : "border-rule text-muted hover:border-ink-soft hover:text-ink-soft"
              }`}
            >
              {WINDOWS[id].label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted">
        {WINDOWS[selected].blurb} · {WINDOWS[selected].teams.length} teams ·{" "}
        {WINDOWS[selected].nodes.length} resources · synthetic by design
      </p>
    </>
  );
}

function BuildStrip() {
  return (
    <div className="mt-5 border-t border-rule pt-4">
      <p className={LABEL}>verified at build, both windows</p>
      <div className="mt-3 space-y-1.5">
        {WINDOW_IDS.map((id) => {
          const f = buildFigures(id);
          return (
            <p key={id} className="text-[0.6875rem] leading-relaxed text-muted">
              <span className="text-ink-soft">{WINDOWS[id].label}</span> · ledger {f.ledger} ·
              attributed {f.attributed} · unexplained {f.unexplained}
              {f.known ? "" : " · not in this build's verification.json"}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function CostDNACheck() {
  const views = useSyncExternalStore(subscribeView, getView, getView);
  const selected = useSyncExternalStore(subscribeSelected, getSelected, getSelected);
  const g = GRAPHS[selected];
  const view = views[selected];
  const reconciles = Math.abs(view.unexplainedUsd) < EPSILON_USD;

  if (!view.ran) {
    const ref = referenceRows(g);
    return (
      <div className="mono p-4 sm:p-5">
        <WindowPicker selected={selected} />

        <div className="mt-5 border-t border-rule pt-4">
          <p className={LABEL}>reference shares · {g.spec.label}</p>
          <div className="mt-3 space-y-2.5">
            {ref.rows.map((t) => (
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
          <p className="mt-3 max-w-[62ch] text-[0.6875rem] leading-relaxed text-muted">
            {ref.note}. Run the check and this window is generated and reconciled here, on your
            device.
          </p>
        </div>

        <BuildStrip />
      </div>
    );
  }

  return (
    <div className="mono p-4 sm:p-5">
      <WindowPicker selected={selected} />

      <p className={`${LABEL} mt-5 border-t border-rule pt-4`}>attributed in this tab · {g.spec.label}</p>
      <table className="mt-3 w-full border-collapse text-left">
        <caption className="sr-only">
          Per-team spend attributed from the {g.spec.label} synthetic CloudTrail window
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

      <BuildStrip />

      <p className="mt-5 max-w-[62ch] border-t border-rule pt-3 text-[0.6875rem] leading-relaxed text-muted">
        attribution walks spend from leaf resources back to owning teams · the totals have to
        reconcile or the check fails
      </p>
    </div>
  );
}
