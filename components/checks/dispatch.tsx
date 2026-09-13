"use client";

// ----------------------------------------------------------------------------
// CHK-07 · Dispatch — the recorded sample edition, replayed as the real
// Server-Sent Events stream the app uses (server/server.js /api/brief/stream):
// one "start", many "delta" chunks, one "complete". The edition is serialized,
// chunked, and fed back through an incremental parser that catches the first
// headline before the stream closes; then the reassembled object is compared
// deep-equal with the committed fixture and the edition's own bookkeeping is
// asserted — every story carries a why-it-matters line, an Editor's Take
// exists, and the candidate pool is larger than what was chosen.
//
// The fixture is lib/checks/fixtures/dispatch-edition.json — the same file
// scripts/verify.mjs replays at build time, so the build-verified figures and
// the ones computed here come from one edition. Mode is "recorded": nothing
// here calls the model or the app; the repo's own timing (~800 ms to first
// headline) is reported as the repo's, never measured here.
// ----------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import type { CheckResult, CheckRunner, LogLine } from "@/lib/checks/types";
import fixtureFile from "@/lib/checks/fixtures/dispatch-edition.json";
import verification from "@/lib/verification.json";
import Reveal from "@/components/motion/Reveal";

/* ---------------------------------------------------------------- fixture */

type Story = {
  ref: string;
  title: string;
  tldr: string;
  why_it_matters: string;
  source: string;
  url: string;
};
type Section = { topic: string; stories: Story[] };
type Edition = {
  headline: string;
  editor_note: string;
  editor_pick: string;
  pull_quote: string;
  take: string;
  generated_at: string;
  role: string;
  skill_level: string;
  domains: string[];
  depth: string;
  sections: Section[];
  counts: Record<string, number>;
};
type DispatchFixture = {
  source: { repo: string; path: string; commit: string; note: string };
  protocol: { endpoint: string; events: string[]; note: string };
  tests: { count: number; files: number; passed?: boolean; passedOn: string; command: string };
  reported: {
    firstHeadlineMs: number;
    lighthouseBestPractices: number;
    a11yViolations: number;
    where: string;
    note: string;
  };
  edition: Edition;
};

const FIXTURE = fixtureFile as unknown as DispatchFixture;
const EDITION = FIXTURE.edition;

/* --------------------------------------------------- the stream, as replayed */

// The wire: the edition serialized compact, cut every CHUNK characters. In
// production each delta is one token-chunk of the model's raw JSON; the cut
// here is fixed so the build and the tab replay the identical event list.
const CHUNK = 48;
const WIRE = JSON.stringify(EDITION);
const DELTAS = Math.ceil(WIRE.length / CHUNK);
const EVENTS = DELTAS + 2; // start + deltas + complete
const CADENCE_MS = 35;

// "headline" is the edition's first key, so a closed string value for it can
// be read off the accumulated text long before the JSON is parseable.
const HEADLINE_RE = /"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/;

/** Structural equality over JSON values — key order is irrelevant. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every(
      (k) =>
        Object.prototype.hasOwnProperty.call(b, k) &&
        deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    );
  }
  return false;
}

/* ------------------------------------------------------ edition bookkeeping */

const STORIES: Story[] = EDITION.sections.flatMap((s) => s.stories);
const STORY_COUNT = STORIES.length;
const WHY_COUNT = STORIES.filter(
  (s) => typeof s.why_it_matters === "string" && s.why_it_matters.trim().length > 0,
).length;
const TAKE_PRESENT = typeof EDITION.take === "string" && EDITION.take.trim().length > 0;
// The candidate pool is the story sources summed — hn, gh, lobsters, reddit,
// arxiv, show_hn. Left out, as server/brief.js leaves them out: whos_hiring
// and layoffs (summarized into a hiring-signal block that informs the editor
// and never competes for a slot), and clusters (the de-duplicated grouping of
// the same pool, not a source).
const NOT_A_SOURCE = new Set(["clusters", "whos_hiring", "layoffs"]);
const POOL = Object.entries(EDITION.counts)
  .filter(([k]) => !NOT_A_SOURCE.has(k))
  .reduce((sum, [, v]) => sum + v, 0);

/* ------------------------------------------------------------------- store */

type ReplayView = {
  ran: boolean;
  headlineDelta: number; // 1-based delta index at which the headline closed
  headlineMs: number; // replay clock, this device
  replayMs: number;
  identical: boolean;
};

const IDLE_VIEW: ReplayView = {
  ran: false,
  headlineDelta: 0,
  headlineMs: 0,
  replayMs: 0,
  identical: false,
};

let viewState: ReplayView = IDLE_VIEW;
const viewSubs = new Set<() => void>();
const setView = (v: ReplayView) => {
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

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const fmtMs = (ms: number) => (ms < 1 ? "<1 ms" : `${Math.round(ms)} ms`);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-05-19T22:59:11.445Z" → "19 May 2026, 22:59 UTC", read off the string. */
function fmtGeneratedAt(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d, hh, mm] = m;
  return `${parseInt(d, 10)} ${MONTHS[parseInt(mo, 10) - 1]} ${y}, ${hh}:${mm} UTC`;
}

/* --------------------------------------------------------------------- run */

export const run: CheckRunner = async ({ lite, signal, onLog }) => {
  const t0 = performance.now();
  const log = (text: string, tone?: LogLine["tone"]) =>
    onLog({ t: Math.round(performance.now() - t0), text, tone });
  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException("check aborted", "AbortError");
  };
  const pause = async (ms: number) => {
    if (!lite && !signal?.aborted) await sleep(ms);
  };

  log(
    `replaying the sample edition · ${FIXTURE.source.path} @ ${FIXTURE.source.commit} · ${EVENTS} SSE events · network never touched`,
    "muted",
  );

  const started = performance.now();
  let replayed = 0;

  // event: start
  await pause(240);
  throwIfAborted();
  replayed++;
  log(`event: start · replay clock 0 ms`, "muted");

  // event: delta × DELTAS — accumulate, and watch for the first headline
  let acc = "";
  let headline: string | null = null;
  let headlineDelta = 0;
  let headlineMs = 0;
  for (let i = 0; i < DELTAS; i++) {
    await pause(CADENCE_MS);
    throwIfAborted();
    acc += WIRE.slice(i * CHUNK, (i + 1) * CHUNK);
    replayed++;
    if (headline === null) {
      const m = HEADLINE_RE.exec(acc);
      if (m) {
        headline = m[1];
        headlineDelta = i + 1;
        headlineMs = performance.now() - started;
        log(
          `event: delta ${headlineDelta}/${DELTAS} · first headline parsed from the accumulated text · "${headline}"`,
          "warn",
        );
        log(
          `${fmtMs(headlineMs)} on the replay clock, this device — not the repo's ~${FIXTURE.reported.firstHeadlineMs} ms, which is submit-to-first-headline measured server-side`,
          "muted",
        );
      }
    }
  }

  // event: complete — the reassembled object
  await pause(240);
  throwIfAborted();
  let reassembled: unknown = null;
  try {
    reassembled = JSON.parse(acc);
  } catch {
    reassembled = null;
  }
  replayed++;
  const replayMs = performance.now() - started;
  log(`event: complete · ${DELTAS} deltas · ${acc.length} chars reassembled`, "muted");

  // assertions
  const identical = reassembled !== null && deepEqual(reassembled, EDITION);
  const headlineOk =
    headline !== null && headline === EDITION.headline && headlineDelta < DELTAS + 1;
  const storiesOk = STORY_COUNT > 0 && WHY_COUNT === STORY_COUNT;
  const poolOk = POOL > STORY_COUNT;
  const eventsOk = replayed === EVENTS;
  const pass = identical && headlineOk && storiesOk && TAKE_PRESENT && poolOk && eventsOk;

  log(
    `assert reassembled edition deep-equals the fixture — ${identical ? "identical" : "DIVERGES"}`,
    identical ? "ok" : "err",
  );
  log(
    `assert first headline read before "complete" and equal to the edition's — ${headlineOk ? `delta ${headlineDelta}/${DELTAS}` : "not found"}`,
    headlineOk ? "ok" : "err",
  );
  log(
    `assert every story carries a why-it-matters line — ${WHY_COUNT}/${STORY_COUNT}`,
    storiesOk ? "ok" : "err",
  );
  log(`assert an Editor's Take exists — ${TAKE_PRESENT ? "present" : "missing"}`, TAKE_PRESENT ? "ok" : "err");
  log(
    `assert candidates pooled > stories chosen — ${POOL} → ${STORY_COUNT} (hn + gh + lobsters + reddit + arxiv + show_hn)`,
    poolOk ? "ok" : "err",
  );
  log(
    `replayed ${replayed}/${EVENTS} events in ${fmtMs(replayMs)} on this device · $0.00`,
    pass ? "ok" : "err",
  );

  setView({ ran: true, headlineDelta, headlineMs, replayMs, identical });

  const result: CheckResult = {
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
  return result;
};

/* ------------------------------------------------------------------ visual */

// The figure is the edition itself, set the way the app sets it — masthead,
// sections, the Editor's Take — every word read from the fixture. There is no
// issue number in the recording, so the masthead is the headline and the
// generation stamp, not a "Vol. I · No." line the data would not support.
// Accent discipline: ink throughout, until the stream has been replayed in
// this tab; then one hairline mark takes --proj to show where in the stream
// the headline was read.

type VerificationFile = {
  builtAt: string;
  results: Record<string, { pass: boolean; metrics: { label: string; value: string }[] }>;
};
const BUILD = (verification as VerificationFile).results["dispatch"];
const buildField = (label: string) =>
  BUILD?.metrics.find((m) => m.label === label)?.value ?? "—";

const LABEL = "mono text-[0.625rem] tracking-[0.18em] text-muted uppercase";

/** Where in the stream the headline closed: a hairline, the read point in --proj. */
function StreamMark({ at, of }: { at: number; of: number }) {
  const pct = Math.min(100, Math.max(1, (at / of) * 100));
  return (
    <div className="h-1 w-full max-w-[9rem] rounded-full bg-rule" aria-hidden="true">
      <div className="proj-fill h-1 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DispatchCheck() {
  const view = useSyncExternalStore(subscribeView, getView, getView);
  const tests = FIXTURE.tests;
  const reported = FIXTURE.reported;

  return (
    <div className="p-5 sm:p-6">
      {/* THE MASTHEAD — headline and stamp, as the recording has them */}
      <section aria-label="the recorded edition, masthead">
        <Reveal variant="dim">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
            <span className="mono text-[0.75rem] text-ink">sample edition</span>
            <span className="mono text-[0.6875rem] text-muted">
              recorded {fmtGeneratedAt(EDITION.generated_at)}, $0.00
            </span>
          </div>
        </Reveal>
        <Reveal variant="lift" delay={0.05}>
          <h4 className="font-display mt-5 max-w-[30ch] text-[clamp(1.375rem,3.2vw,1.875rem)] leading-tight tracking-tight text-ink">
            {EDITION.headline}
          </h4>
          <p className="mono mt-3 text-[0.6875rem] leading-relaxed text-muted">
            {EDITION.role.replace(/_/g, " ")}, {EDITION.skill_level}, {EDITION.depth},{" "}
            {EDITION.domains.length} domains. {STORY_COUNT} stories from {POOL} candidates.
          </p>
        </Reveal>
      </section>

      {/* THE SECTIONS — every story with the line that earned it a slot */}
      <section aria-label="sections and stories" className="mt-7">
        {EDITION.sections.map((sec, si) => (
          <Reveal key={sec.topic} variant="lift" delay={0.08 + 0.06 * si}>
            <div className={si === 0 ? "" : "mt-6"}>
              <p className={LABEL}>{sec.topic}</p>
              <ol className="mt-3 list-none space-y-4">
                {sec.stories.map((st) => (
                  <li key={st.ref} className="grid grid-cols-[2.25rem_1fr] items-baseline gap-x-3">
                    <span className="mono text-[0.6875rem] tabular-nums text-muted">{st.ref}</span>
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] leading-snug text-ink">{st.title}</p>
                      <p className="mt-1.5 max-w-[60ch] text-[0.8125rem] leading-relaxed text-ink-soft">
                        <span className="text-muted">why it matters — </span>
                        {st.why_it_matters}
                      </p>
                      <p className="mono mt-1.5 text-[0.625rem] tracking-[0.14em] text-muted uppercase">
                        {st.source.replace(/_/g, " ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        ))}
      </section>

      {/* THE EDITOR'S TAKE */}
      <section aria-label="editor's take" className="mt-7 border-t border-rule pt-5">
        <Reveal variant="dim" delay={0.1}>
          <p className={LABEL}>editor&apos;s take</p>
          <p className="mt-3 max-w-[54ch] text-[1rem] leading-relaxed text-ink">{EDITION.take}</p>
          <p className="mono mt-2.5 text-[0.6875rem] leading-relaxed text-muted">
            pick {EDITION.editor_pick}. Pull quote: &ldquo;{EDITION.pull_quote}&rdquo;
          </p>
        </Reveal>
      </section>

      {/* THE LEDGER — the stream replayed in this tab, against the build run */}
      <section
        aria-label="stream replay against the build-verification run"
        className="mt-9 border-t border-rule pt-7"
      >
        <Reveal variant="dim">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="mono text-[0.75rem] text-ink">
              {FIXTURE.protocol.endpoint.split(" (")[0]}, replayed as {EVENTS} events
            </span>
            <span className="mono text-[0.6875rem] text-muted">
              start, delta ×{DELTAS}, complete
            </span>
          </div>
        </Reveal>

        <Reveal variant="lift" delay={0.1}>
          <ol className="mono mt-4 space-y-2">
            <li className="grid grid-cols-[1.25rem_1rem_minmax(0,1fr)] gap-x-2">
              <span className="text-[0.75rem] text-muted">1.</span>
              <span aria-hidden="true" className={`text-[0.75rem] ${view.ran && !view.identical ? "text-fail" : "text-ink"}`}>
                {view.ran ? (view.identical ? "✓" : "✗") : "→"}
              </span>
              <span className="text-[0.75rem] leading-relaxed text-ink-soft">
                assert the {DELTAS} deltas reassemble deep-equal to the committed edition
                {view.ran ? (view.identical ? " (holds)" : " (violated)") : ""}
              </span>
            </li>
            <li className="grid grid-cols-[1.25rem_1rem_minmax(0,1fr)] gap-x-2">
              <span className="text-[0.75rem] text-muted">2.</span>
              <span aria-hidden="true" className="text-[0.75rem] text-ink">
                {view.ran && view.headlineDelta > 0 ? "✓" : "→"}
              </span>
              <span className="text-[0.75rem] leading-relaxed text-ink-soft">
                {view.ran && view.headlineDelta > 0 ? (
                  <>
                    first headline read at delta{" "}
                    <span className="proj-ink">
                      {view.headlineDelta}/{DELTAS}
                    </span>
                    , {fmtMs(view.headlineMs)} on the replay clock, this device
                    <span className="mt-1.5 block">
                      <StreamMark at={view.headlineDelta} of={DELTAS} />
                    </span>
                  </>
                ) : (
                  "observe the first headline parsed before “complete”"
                )}
              </span>
            </li>
            <li className="grid grid-cols-[1.25rem_1rem_minmax(0,1fr)] gap-x-2">
              <span className="text-[0.75rem] text-muted">3.</span>
              <span aria-hidden="true" className="text-[0.75rem] text-ink">
                {view.ran ? "✓" : "→"}
              </span>
              <span className="text-[0.75rem] leading-relaxed text-ink-soft">
                assert {WHY_COUNT}/{STORY_COUNT} why-it-matters lines, Editor&apos;s Take{" "}
                {TAKE_PRESENT ? "present" : "missing"}, {POOL} candidates → {STORY_COUNT} chosen
              </span>
            </li>
          </ol>
        </Reveal>

        <Reveal variant="dim" delay={0.2}>
          <div className="mt-5 border-t border-rule pt-4">
            <p className={LABEL}>verified at build</p>
            <p className="mono mt-3 text-[0.6875rem] leading-relaxed text-muted">
              {BUILD ? (
                <>
                  <span className="text-ink-soft">events replayed</span> {buildField("stream events replayed")},{" "}
                  <span className="text-ink-soft">deep-equal</span> {buildField("deep-equal replay")},{" "}
                  <span className="text-ink-soft">why-it-matters</span> {buildField("why-it-matters lines")}
                </>
              ) : (
                "not in this build's verification.json"
              )}
            </p>
          </div>
        </Reveal>

        <Reveal variant="dim" delay={0.25}>
          <p className="mono mt-4 max-w-[62ch] border-t border-rule-soft pt-3 text-[0.6875rem] leading-relaxed text-muted">
            {tests.passed
              ? `${tests.count} tests, reproduced locally on ${tests.passedOn} (${tests.command})`
              : `${tests.count} tests in the repo's CI`}
            {". "}
            The repo&apos;s own report, not measured here: ~{reported.firstHeadlineMs} ms
            submit-to-first-headline, Lighthouse best practices {reported.lighthouseBestPractices},{" "}
            {reported.a11yViolations} a11y violations ({reported.where}).
          </p>
        </Reveal>
      </section>
    </div>
  );
}
