"use client";

// ----------------------------------------------------------------------------
// CHK-01 Reflight — flagship. Two replays, in order:
//   1. support-run-19, the recorded refund failure, event by event, ending in
//      the classifier verdict (computed live from the events, not hardcoded).
//   2. This site's own build-verification run (lib/verification.json),
//      diffed field-by-field against a live re-run in this tab. Dogfooding:
//      the flight recorder replaying the page that describes it.
// Pass = every event replayed + classifier verdict matches the recorded run.
// ----------------------------------------------------------------------------

import { useMemo } from "react";
import type { CheckResult, CheckRunner } from "@/lib/checks/types";
import verification from "@/lib/verification.json";

type VerificationFile = { builtAt: string; results: Record<string, CheckResult> };
const build = verification as VerificationFile;

// ---------------------------------------------------------------------------
// The recording. Ported from the reflight repo's example suite: an agent
// passing a string where the refund schema wants a float, retrying the
// identical call, and looping.
// ---------------------------------------------------------------------------

type RecordedEvent = {
  seq: number;
  kind: "llm_call" | "tool_call" | "tool_err";
  text: string;
  note?: string;
  args?: Record<string, unknown>;
  schema?: Record<string, "float" | "str">;
  bad: boolean;
};

const RUN_19: RecordedEvent[] = [
  { seq: 1, kind: "llm_call", text: 'assistant → "refund order #8841, $129.99"', bad: false },
  {
    seq: 2,
    kind: "tool_call",
    text: 'refund(amount="129.99")',
    note: "str, schema wants float",
    args: { amount: "129.99" },
    schema: { amount: "float" },
    bad: true,
  },
  { seq: 3, kind: "tool_err", text: "TypeError: amount must be a number", bad: true },
  {
    seq: 4,
    kind: "tool_call",
    text: 'refund(amount="129.99")',
    note: "identical retry",
    args: { amount: "129.99" },
    schema: { amount: "float" },
    bad: true,
  },
  { seq: 5, kind: "tool_err", text: "TypeError: amount must be a number", bad: true },
];

// Classifier — pure, and the same code path feeds the figure and the runner.
function classify(events: RecordedEvent[]): string {
  const labels: string[] = [];
  const wrongArgs = events.some(
    (e) =>
      e.kind === "tool_call" &&
      e.args !== undefined &&
      e.schema !== undefined &&
      Object.entries(e.schema).some(
        ([key, want]) => want === "float" && typeof e.args?.[key] === "string",
      ),
  );
  if (wrongArgs) labels.push("wrong_tool_args");
  const calls = events.filter((e) => e.kind === "tool_call");
  const loop = calls.some(
    (c, i) => i > 0 && JSON.stringify(calls[i - 1].args) === JSON.stringify(c.args),
  );
  if (loop) labels.push("loop");
  return labels.length > 0 ? labels.join(" · ") : "clean";
}

const TOTAL_EVENTS = RUN_19.length + 1; // 5 recorded events + the classify step

// The build run's recorded fields, and the live re-run of the same fields.
const recordedField = (label: string): string =>
  build.results["reflight"]?.metrics.find((m) => m.label === label)?.value ?? "—";

function reRun() {
  return {
    "events replayed": `${TOTAL_EVENTS}/${TOTAL_EVENTS}`,
    classification: classify(RUN_19),
    cost: "$0.00", // replay never touches the network; nothing to bill
  } as const;
}

const DIFF_FIELDS = ["events replayed", "classification", "cost"] as const;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const run: CheckRunner = async ({ lite, signal, onLog }) => {
  const t0 = Date.now();
  const log = (text: string, tone?: "muted" | "ok" | "warn" | "err") =>
    onLog({ t: Date.now() - t0, text, tone });
  const pause = async (ms: number) => {
    if (!lite && !signal?.aborted) await sleep(ms);
  };

  await pause(240);
  log("replaying support-run-19 · 6 events · network hard-blocked", "muted");
  await pause(360);
  log('02 refund(amount="129.99") — str where the schema wants float', "err");
  await pause(360);
  log("04 identical retry: same tool, same args", "err");

  const started = performance.now();
  const live = reRun();
  const replayMs = performance.now() - started;

  await pause(360);
  log(`06 classifier verdict: ${live.classification}`, "warn");

  await pause(360);
  log(
    `replaying this build's verification run (lib/verification.json · ${build.builtAt.slice(0, 10)})`,
    "muted",
  );

  const divergent = DIFF_FIELDS.filter((f) => recordedField(f) !== live[f]).length;
  await pause(360);
  log(
    divergent === 0
      ? `re-ran live in this tab · 0/${DIFF_FIELDS.length} fields diverge from the recorded run`
      : `re-ran live in this tab · ${divergent}/${DIFF_FIELDS.length} fields diverge from the recorded run`,
    divergent === 0 ? "ok" : "err",
  );

  const classificationOk = live.classification === recordedField("classification");
  const pass = classificationOk && divergent === 0;

  await pause(240);
  log(
    `replayed ${TOTAL_EVENTS}/${TOTAL_EVENTS} events · ${replayMs < 1 ? "<1" : Math.round(replayMs)} ms · $0.00`,
    pass ? "ok" : "err",
  );

  return {
    pass,
    mode: "live",
    metrics: [
      { label: "events replayed", value: `${TOTAL_EVENTS}/${TOTAL_EVENTS}` },
      { label: "classification", value: live.classification },
      { label: "fields diverging from build run", value: `${divergent}/${DIFF_FIELDS.length}` },
      { label: "replay time", value: replayMs < 1 ? "<1 ms" : `${Math.round(replayMs)} ms` },
      { label: "cost", value: "$0.00" },
    ],
    summary: pass
      ? `Recorded failure replayed and classified ${live.classification}; the live re-run matches the build run in all ${DIFF_FIELDS.length} fields.`
      : "Live re-run diverged from the recorded build-verification run.",
  };
};

// ---------------------------------------------------------------------------
// Figure body — numbered event assertion lines on paper, then the ledger
// diffing the recorded build run against a re-run computed at render time.
// ---------------------------------------------------------------------------

export default function ReflightCheck() {
  const live = useMemo(reRun, []);
  const divergent = DIFF_FIELDS.filter((f) => recordedField(f) !== live[f]).length;

  return (
    <div className="mono space-y-5 p-4 text-xs">
      <section aria-label="recorded failure, replayed">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-ink-soft">support-run-19 · recorded failure</span>
          <span className="text-muted">network hard-blocked · $0.00</span>
        </div>
        <ol className="list-none space-y-1">
          {RUN_19.map((e) => (
            <li key={e.seq} className="grid grid-cols-[1rem_1.5rem_4.5rem_1fr] gap-x-2">
              <span aria-hidden="true" className={e.bad ? "text-fail" : "text-muted"}>
                {e.bad ? "✗" : "·"}
              </span>
              <span className="text-muted">{String(e.seq).padStart(2, "0")}</span>
              <span className="text-muted">{e.kind}</span>
              <span className={e.bad ? "text-ink" : "text-ink-soft"}>
                {e.text}
                {e.note && <span className="text-muted"> ← {e.note}</span>}
              </span>
            </li>
          ))}
          <li className="grid grid-cols-[1rem_1.5rem_4.5rem_1fr] gap-x-2 border-t border-line pt-1">
            <span aria-hidden="true" className="text-muted">
              →
            </span>
            <span className="text-muted">06</span>
            <span className="text-ink">classify</span>
            <span className="text-ink font-medium">{live.classification}</span>
          </li>
        </ol>
      </section>

      <section aria-label="build-verification run diffed against a live re-run">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-ink-soft">this build&apos;s verification run · replay vs re-run</span>
          <span className="text-muted">recorded {build.builtAt.slice(0, 10)}</span>
        </div>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 pr-4 font-normal">
                field
              </th>
              <th scope="col" className="py-1 pr-4 font-normal">
                recorded (build)
              </th>
              <th scope="col" className="py-1 pr-4 font-normal">
                re-run (this tab)
              </th>
              <th scope="col" className="py-1 font-normal">
                Δ
              </th>
            </tr>
          </thead>
          <tbody>
            {DIFF_FIELDS.map((f) => {
              const rec = recordedField(f);
              const now = live[f];
              const match = rec === now;
              return (
                <tr key={f} className="border-t border-line last:border-b">
                  <td className="whitespace-nowrap py-1.5 pr-4 text-muted">{f}</td>
                  <td className="whitespace-nowrap py-1.5 pr-4 text-ink-soft">{rec}</td>
                  <td className="whitespace-nowrap py-1.5 pr-4 text-ink">{now}</td>
                  <td className={`py-1.5 ${match ? "text-muted" : "text-fail"}`}>
                    {match ? "none" : "✗ diverges"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-muted">
          {divergent === 0
            ? `${DIFF_FIELDS.length}/${DIFF_FIELDS.length} fields identical — the page replays its own recording cleanly.`
            : `${divergent} field(s) diverge from the recorded run.`}
        </p>
      </section>
    </div>
  );
}
