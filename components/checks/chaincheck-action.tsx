"use client";

// ----------------------------------------------------------------------------
// CHK-06 ChainCheck Action. The merge gate: per-claim scores from the same
// detection core as CHK-05 (recorded), gate decision computed in-tab. The
// check runs the gate at fail-threshold 0.80 over three sample PRs and
// asserts pr #142 is blocked while #189 and #207 pass.
// The figure lets the visitor move the threshold and watch the exit codes
// follow; the check itself always runs at 0.80.
// ----------------------------------------------------------------------------

import { useState } from "react";
import type { CheckRunner } from "@/lib/checks/types";

type PrClaim = { id: number; text: string; score: number };
type Sample = { label: string; claims: PrClaim[]; expectExit: 0 | 1 };

const SAMPLES: Sample[] = [
  {
    label: "pr #142",
    expectExit: 1,
    claims: [
      { id: 1, text: '"refactor cache eviction"', score: 0.04 },
      { id: 2, text: '"adds rate limiting to /v2/predict"', score: 0.91 },
      { id: 3, text: '"bumps tokio to 1.40"', score: 0.07 },
    ],
  },
  {
    label: "pr #189",
    expectExit: 0,
    claims: [
      { id: 1, text: '"adds retry logic to outbound webhook"', score: 0.12 },
      { id: 2, text: '"fixes off-by-one in pagination"', score: 0.18 },
      { id: 3, text: '"closes #284"', score: 0.05 },
    ],
  },
  {
    label: "pr #207",
    expectExit: 0,
    claims: [
      { id: 1, text: '"adds observability across services"', score: 0.76 },
      { id: 2, text: '"removes deprecated `legacy_auth` flag"', score: 0.09 },
      { id: 3, text: '"updates docs"', score: 0.62 },
    ],
  },
];

const FAIL_THRESHOLD = 0.8;

// The gate — the same arithmetic the Action runs in CI.
function gate(claims: PrClaim[], threshold: number) {
  const failed = claims.filter((c) => c.score >= threshold);
  const top = Math.max(...claims.map((c) => c.score));
  return { failed, top, exit: (failed.length > 0 ? 1 : 0) as 0 | 1 };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const run: CheckRunner = async ({ lite, signal, onLog }) => {
  const t0 = Date.now();
  const log = (text: string, tone?: "muted" | "ok" | "warn" | "err") =>
    onLog({ t: Date.now() - t0, text, tone });
  const pause = async (ms: number) => {
    if (!lite && !signal?.aborted) await sleep(ms);
  };

  await pause(240);
  log(`uses: pauti04/chaincheck-action@v1 · fail-threshold: ${FAIL_THRESHOLD.toFixed(2)}`, "muted");

  const decisions = SAMPLES.map((s) => ({ ...s, ...gate(s.claims, FAIL_THRESHOLD) }));
  for (const d of decisions) {
    await pause(400);
    log(
      d.exit === 1
        ? `${d.label} · top claim ${d.top.toFixed(2)} ≥ ${FAIL_THRESHOLD.toFixed(2)} → exit 1 · merge blocked`
        : `${d.label} · top claim ${d.top.toFixed(2)} < ${FAIL_THRESHOLD.toFixed(2)} → exit 0`,
      d.exit === 1 ? "err" : "ok",
    );
  }

  const correct = decisions.filter((d) => d.exit === d.expectExit).length;
  const pass = correct === SAMPLES.length;
  await pause(300);
  log(
    pass
      ? `assert: bad blocked, good pass — ${correct}/${SAMPLES.length} gate decisions correct`
      : `assert: bad blocked, good pass — fails (${correct}/${SAMPLES.length} correct)`,
    pass ? "ok" : "err",
  );

  return {
    pass,
    mode: "recorded",
    metrics: [
      { label: "gate decisions correct", value: `${correct}/${SAMPLES.length}` },
      { label: "fail-threshold", value: FAIL_THRESHOLD.toFixed(2) },
      ...decisions.map((d) => ({ label: d.label, value: `exit ${d.exit}` })),
    ],
    summary: pass
      ? `Gate at ${FAIL_THRESHOLD.toFixed(2)} blocked pr #142 (top score 0.91) and passed pr #189 and pr #207.`
      : "The gate misjudged at least one PR.",
  };
};

// ---------------------------------------------------------------------------
// Figure body — the workflow step, a movable threshold, three sample PRs,
// and the exit code that follows.
//
// Accent discipline: the threshold is the one live, visitor-driven thing in
// this figure, so the route colour marks it and only it — in the workflow
// snippet, on the slider, and as the tick every claim bar is measured against.
// A blocked claim is a failure state and wears --fail, never the accent.
// ---------------------------------------------------------------------------

const LABEL = "text-[0.6875rem] uppercase tracking-[0.18em] text-muted";

export default function ChainCheckActionCheck() {
  const [pick, setPick] = useState(0);
  const [threshold, setThreshold] = useState(FAIL_THRESHOLD);
  const sample = SAMPLES[pick];
  const decision = gate(sample.claims, threshold);

  return (
    <div className="mono p-4 sm:p-5">
      <p className={LABEL}>the workflow step</p>
      <pre className="mt-3 border-l border-rule pl-3.5 text-[0.75rem] leading-relaxed text-ink-soft">
        <span className="text-muted">- uses: </span>pauti04/chaincheck-action@v1{"\n"}
        <span className="text-muted">  with:</span>
        {"\n"}
        <span className="text-muted">    fail-threshold: </span>
        <span className="proj-ink">{threshold.toFixed(2)}</span>
      </pre>

      <div className="mt-5 border-t border-rule pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <label htmlFor="chk06-threshold" className={LABEL}>
            threshold
          </label>
          <input
            id="chk06-threshold"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="proj-accent max-w-[10rem] min-w-[7rem] flex-1"
          />
          <span className="proj-ink text-[0.8125rem]">{threshold.toFixed(2)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="sample PR picker">
          {SAMPLES.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-pressed={i === pick}
              onClick={() => setPick(i)}
              className={`rounded-full border px-2.5 py-1 text-[0.6875rem] transition-colors ${
                i === pick
                  ? "border-ink-soft bg-panel text-ink"
                  : "border-rule text-muted hover:border-ink-soft hover:text-ink-soft"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <p className={LABEL}>claims in the description</p>
        <div className="mt-3 space-y-2">
          {sample.claims.map((c) => {
            const blocked = c.score >= threshold;
            return (
              <div
                key={c.id}
                className="flex flex-col gap-1 sm:grid sm:grid-cols-[1rem_minmax(0,1fr)_6rem_auto] sm:items-center sm:gap-x-3"
              >
                <div className="flex items-baseline gap-x-2 sm:contents">
                  <span
                    aria-hidden="true"
                    className={`text-[0.75rem] ${blocked ? "text-fail" : "text-muted"}`}
                  >
                    {blocked ? "✗" : "✓"}
                  </span>
                  <span
                    className={`min-w-0 text-[0.75rem] break-words ${blocked ? "text-ink" : "text-ink-soft"}`}
                  >
                    {c.text}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className="relative hidden h-1 rounded-full bg-rule sm:block"
                >
                  <span
                    className={`block h-1 rounded-full ${blocked ? "bg-fail" : "bg-ink-soft"}`}
                    style={{ width: `${Math.max(3, c.score * 100)}%` }}
                  />
                  <span
                    className="proj-fill absolute -top-1 -bottom-1 w-px"
                    style={{ left: `${threshold * 100}%` }}
                  />
                </span>
                <span
                  className={`pl-[1.5rem] text-[0.75rem] sm:pl-0 sm:text-right ${
                    blocked ? "text-ink" : "text-muted"
                  }`}
                >
                  {c.score.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-rule pt-4" aria-live="polite">
        <p className={LABEL}>gate decision</p>
        {decision.exit === 1 ? (
          <p className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[0.9375rem] text-fail">
              <span aria-hidden="true">✗ </span>exit 1
            </span>
            <span className="text-[0.75rem] text-muted">
              {decision.failed.length} claim{decision.failed.length > 1 ? "s" : ""} at or above{" "}
              {threshold.toFixed(2)}, merge blocked
            </span>
          </p>
        ) : (
          <p className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[0.9375rem] text-ink">
              <span aria-hidden="true">✓ </span>exit 0
            </span>
            <span className="text-[0.75rem] text-muted">
              all claims below {threshold.toFixed(2)}, merge allowed
            </span>
          </p>
        )}
      </div>

      <p className="mt-5 max-w-[62ch] border-t border-rule pt-3 text-[0.6875rem] leading-relaxed text-muted">
        Per-claim scores come from the same detection core as CHK-05, recorded. The gate arithmetic
        runs here. Move the threshold and the exit code follows.
      </p>
    </div>
  );
}
