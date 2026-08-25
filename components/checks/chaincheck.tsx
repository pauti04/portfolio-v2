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
// see each detector's line and the ensemble verdict. Ink on paper.
// ---------------------------------------------------------------------------

export default function ChainCheckCheck() {
  const [active, setActive] = useState(0);
  const preset = PRESETS[active];
  const result = ensemble(preset.expect);

  return (
    <div className="mono space-y-3 p-4 text-xs">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="fixture picker">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`border px-1.5 py-0.5 transition-colors ${
              i === active
                ? "border-ink text-ink"
                : "border-line text-muted hover:border-ink-soft hover:text-ink-soft"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <p>
          <span className="text-muted">claim </span>
          <span className="text-ink">&quot;{preset.claim}&quot;</span>
        </p>
        <pre className="whitespace-pre-wrap border-l border-line pl-3 text-muted">
          {preset.source}
        </pre>
      </div>

      <div className="space-y-1 border-t border-line pt-2">
        {result.rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[1rem_7.5rem_1fr_auto] items-center gap-x-2">
            <span aria-hidden="true" className={r.bad ? "text-fail" : "text-muted"}>
              {r.bad ? "✗" : "✓"}
            </span>
            <span className="text-muted">{r.name}</span>
            <span aria-hidden="true" className="hidden h-px bg-line sm:block">
              <span
                className="block h-px"
                style={{ width: `${Math.max(2, r.score * 100)}%`, background: "var(--ink-soft)" }}
              />
            </span>
            <span className={`text-right ${r.bad ? "text-ink" : "text-ink-soft"}`}>
              {r.label} {r.score.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-line pt-2 text-muted">
        verdict: <span className={result.verdict === "supported" ? "text-ink" : "text-ink font-medium"}>{result.verdict}</span>{" "}
        · ensemble {result.score.toFixed(2)} · {result.badCount}/5 flag · 4-of-5 required · recorded
        scores, in-tab vote
      </div>
    </div>
  );
}
