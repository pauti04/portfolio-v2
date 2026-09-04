"use client";

// ----------------------------------------------------------------------------
// CHK-05 ChainCheck. Ensembles the five detectors over two fixed fixtures —
// the known hallucinated claim (pr #142) and a supported one (pr #143) — and
// asserts both verdicts land correctly. Detector scores are the shipped
// detector's recorded outputs (no live model calls in a browser tab); the
// ensemble vote is computed here.
// The figure carries a third fixture (a partially-wrong LLM answer) for
// inspection; the check itself always scores the same two.
// ----------------------------------------------------------------------------

import { useState } from "react";
import type { CheckRunner } from "@/lib/checks/types";

type Expect = "halluc" | "ok" | "partial";

type Preset = {
  label: string;
  claim: string;
  source: string;
  expect: Expect;
};

const PRESETS: Preset[] = [
  {
    label: "pr #142 ✗",
    claim: "This PR adds rate limiting to /v2/predict",
    source:
      'app/v2/predict.py\n+ result = await model.run(req)\n+ log.info("predicted", req_id=req.id)\n+ return result',
    expect: "halluc",
  },
  {
    label: "pr #143 ✓",
    claim: "Bumps tokio to 1.40 and runs cargo update",
    source:
      'Cargo.toml\n- tokio = "1.39"\n+ tokio = "1.40"\nCargo.lock (regenerated, 217 lines)',
    expect: "ok",
  },
  {
    label: "llm answer →",
    claim: "The Eiffel Tower was built in 1889 by Gustave Eiffel for the 1900 World's Fair.",
    source:
      "Wikipedia: Eiffel Tower was constructed from 1887 to 1889 for the 1889 World's Fair (Exposition Universelle), commemorating the centennial of the French Revolution.",
    expect: "partial",
  },
];

const DETECTORS = [
  { id: "nli", name: "nli entailment" },
  { id: "judge", name: "llm-as-judge" },
  { id: "consistency", name: "self-consistency" },
  { id: "logprob", name: "token logprobs" },
  { id: "qa", name: "qa cross-check" },
] as const;

type DetectorId = (typeof DETECTORS)[number]["id"];
type Score = { label: string; score: number; bad: boolean };

// Recorded per-detector outputs from the shipped detector, per fixture.
const SCORES: Record<Expect, Record<DetectorId, Score>> = {
  halluc: {
    nli: { label: "contradicts", score: 0.94, bad: true },
    judge: { label: "disagrees", score: 0.91, bad: true },
    consistency: { label: "5/5 disagree", score: 1.0, bad: true },
    logprob: { label: "2.1σ anomaly", score: 0.83, bad: true },
    qa: { label: "no support", score: 0.88, bad: true },
  },
  ok: {
    nli: { label: "entails", score: 0.04, bad: false },
    judge: { label: "agrees", score: 0.06, bad: false },
    consistency: { label: "5/5 agree", score: 0.0, bad: false },
    logprob: { label: "nominal", score: 0.09, bad: false },
    qa: { label: "supported", score: 0.07, bad: false },
  },
  partial: {
    nli: { label: "mixed", score: 0.52, bad: false },
    judge: { label: "partial", score: 0.61, bad: true },
    consistency: { label: "3/5 agree", score: 0.4, bad: false },
    logprob: { label: "1.1σ", score: 0.47, bad: false },
    qa: { label: "dated 1889 ≠ 1900", score: 0.78, bad: true },
  },
};

// Ensemble vote — computed in-tab. 4-of-5 required to call hallucination.
function ensemble(expect: Expect) {
  const rows = DETECTORS.map((d) => ({ name: d.name, ...SCORES[expect][d.id] }));
  const badCount = rows.filter((r) => r.bad).length;
  const verdict = badCount >= 4 ? "hallucination" : badCount === 0 ? "supported" : "partial";
  const score = badCount >= 4 ? 0.91 : badCount === 0 ? 0.05 : 0.62;
  return { rows, badCount, verdict, score };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const run: CheckRunner = async ({ lite, signal, onLog }) => {
  const t0 = Date.now();
  const log = (text: string, tone?: "muted" | "ok" | "warn" | "err") =>
    onLog({ t: Date.now() - t0, text, tone });
  const pause = async (ms: number) => {
    if (!lite && !signal?.aborted) await sleep(ms);
  };

  const bad = ensemble("halluc");
  const good = ensemble("ok");

  await pause(240);
  log('claim: "adds rate limiting to /v2/predict" · diff touches app/v2/predict.py — no limiter', "muted");
  await pause(400);
  log(
    `${bad.badCount}/5 detectors flag · ensemble ${bad.score.toFixed(2)} · verdict ${bad.verdict}`,
    bad.verdict === "hallucination" ? "err" : "warn",
  );
  await pause(400);
  log('counter-claim: "bumps tokio to 1.40" · Cargo.toml shows the bump', "muted");
  await pause(400);
  log(
    `${good.badCount}/5 detectors flag · ensemble ${good.score.toFixed(2)} · verdict ${good.verdict}`,
    good.verdict === "supported" ? "ok" : "warn",
  );

  const pass = bad.verdict === "hallucination" && good.verdict === "supported";
  await pause(300);
  log(
    pass ? "assert: both verdicts correct — holds" : "assert: both verdicts correct — fails",
    pass ? "ok" : "err",
  );

  return {
    pass,
    mode: "recorded",
    metrics: [
      { label: "verdicts correct", value: pass ? "2/2" : "≠2/2" },
      { label: "hallucinated claim", value: `${bad.score.toFixed(2)} · ${bad.badCount}/5 flag` },
      { label: "supported claim", value: `${good.score.toFixed(2)} · ${good.badCount}/5 flag` },
      { label: "ensemble rule", value: "4-of-5 to flag" },
    ],
    summary: pass
      ? `Hallucinated claim scored ${bad.score.toFixed(2)} (${bad.badCount}/5 detectors); supported claim ${good.score.toFixed(2)}. Both verdicts correct.`
      : "At least one fixture was classified incorrectly.",
  };
};

// ---------------------------------------------------------------------------
// Figure body — pick a fixture, read the claim against its ground truth,
// see each detector's line and the ensemble verdict.
//
// Accent discipline: the detector scores are recorded, so they are ink. The
// one thing this tab actually computes is the ensemble verdict, and that is
// the only place the route colour appears.
// ---------------------------------------------------------------------------

const LABEL = "text-[0.6875rem] uppercase tracking-[0.18em] text-muted";

export default function ChainCheckCheck() {
  const [active, setActive] = useState(0);
  const preset = PRESETS[active];
  const result = ensemble(preset.expect);

  return (
    <div className="mono p-4 sm:p-5">
      <p className={LABEL}>fixture</p>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="fixture picker">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`rounded-full border px-2.5 py-1 text-[0.6875rem] transition-colors ${
              i === active
                ? "border-ink-soft bg-panel text-ink"
                : "border-rule text-muted hover:border-ink-soft hover:text-ink-soft"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <p className={LABEL}>claim</p>
        <p className="mt-2.5 max-w-[68ch] text-[0.8125rem] leading-relaxed text-ink">
          &quot;{preset.claim}&quot;
        </p>
        <p className={`${LABEL} mt-4`}>checked against</p>
        <pre className="mt-2.5 max-w-[72ch] border-l border-rule pl-3.5 text-[0.75rem] leading-relaxed break-words whitespace-pre-wrap text-muted">
          {preset.source}
        </pre>
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <p className={LABEL}>five detectors, recorded</p>
        <div className="mt-3 space-y-2">
          {result.rows.map((r) => (
            <div
              key={r.name}
              className="flex flex-col gap-1 sm:grid sm:grid-cols-[1rem_8.5rem_minmax(3rem,1fr)_auto] sm:items-center sm:gap-x-3"
            >
              <div className="flex items-baseline gap-x-2 sm:contents">
                <span
                  aria-hidden="true"
                  className={`text-[0.75rem] ${r.bad ? "text-fail" : "text-muted"}`}
                >
                  {r.bad ? "✗" : "✓"}
                </span>
                <span className="text-[0.75rem] text-ink-soft">{r.name}</span>
              </div>
              <span aria-hidden="true" className="hidden h-1 rounded-full bg-rule sm:block">
                <span
                  className="block h-1 rounded-full bg-ink-soft"
                  style={{ width: `${Math.max(3, r.score * 100)}%` }}
                />
              </span>
              <span
                className={`pl-[1.5rem] text-[0.75rem] sm:pl-0 sm:text-right ${
                  r.bad ? "text-ink" : "text-muted"
                }`}
              >
                {r.label} {r.score.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-rule pt-4">
        <p className={LABEL}>ensemble verdict, computed here</p>
        <p className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="proj-ink text-[0.9375rem]">{result.verdict}</span>
          <span className="text-[0.8125rem] text-ink-soft">{result.score.toFixed(2)}</span>
          <span className="text-[0.75rem] text-muted">
            {result.badCount}/5 detectors flag · 4-of-5 required
          </span>
        </p>
      </div>

      <p className="mt-5 max-w-[62ch] border-t border-rule pt-3 text-[0.6875rem] leading-relaxed text-muted">
        detector scores are the shipped detector&apos;s recorded outputs — no model calls from a
        browser tab. The vote itself runs here.
      </p>
    </div>
  );
}
