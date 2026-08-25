import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/lib/claims";

export const metadata: Metadata = {
  title: "Fifteen green runs booked a meeting on a Sunday",
  description:
    "A live scheduling agent passed every tool-level check fifteen times in a row — and was wrong every time. What caught it, what didn't, and why pass rates lie.",
};

/** Inline code, ink on paper. */
function C({ children }: { children: React.ReactNode }) {
  return <code className="mono text-[0.85em] text-ink">{children}</code>;
}

/** Bolded key phrase — emphasis by ink weight, not color. */
function K({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-ink">{children}</span>;
}

/** One numbered line of a report block. */
function ReportLine({
  n,
  tag,
  children,
}: {
  n: string;
  tag: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 whitespace-nowrap">
      <span className="w-5 shrink-0 select-none text-right text-muted">{n}</span>
      <span className="w-9 shrink-0 text-muted">{tag}</span>
      <span className="text-ink-soft">{children}</span>
    </div>
  );
}

const H2 = "mt-10 text-xl font-bold tracking-tight text-ink";
const P = "text-[0.95rem] leading-[1.75] text-ink-soft";

export default function Post() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 sm:px-8">
      <nav
        aria-label="site"
        className="mono flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-b border-line pb-4 pt-8 text-xs"
      >
        <Link
          href="/"
          className="underline decoration-line underline-offset-4 hover:decoration-current"
        >
          ← Parth Auti — the checks
        </Link>
        <Link
          href="/writing"
          className="text-muted underline decoration-line underline-offset-4 hover:text-ink-soft hover:decoration-current"
        >
          writing
        </Link>
      </nav>

      <header className="pt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
          <p className="smallcaps text-muted">Working notes · Reflight · No. 02</p>
          <p className="mono text-xs text-muted">
            <time dateTime="2026-08-11">2026-08-11</time> · 6 min read
          </p>
        </div>
        <h1 className="mt-4 max-w-[22ch] text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Fifteen green runs booked a meeting on a Sunday.
        </h1>
        <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-ink-soft">
          A live agent passed every tool-level check, fifteen times in a row — and was wrong every
          single time. Pass rates lied. The recordings didn&apos;t.
        </p>
      </header>

      <hr className="mt-10 border-line" aria-hidden="true" />

      <article className="mt-10 space-y-5">
        <p className={P}>
          Everything below actually happened, against a live API, on July 10, 2026. The recordings
          are committed to the{" "}
          <a
            href="https://github.com/pauti04/reflight"
            className="text-ink underline decoration-line underline-offset-4 hover:decoration-current"
          >
            Reflight repo
          </a>{" "}
          — every run in this post replays offline, byte-identical, for $0.00.
        </p>

        <p className={P}>
          The setup: a scheduling agent (gpt-4o-mini, function calling) with three tools —{" "}
          <C>get_today</C>, <C>check_availability</C>, <C>book_meeting</C> — and one honest task:
          book a 45-minute design sync <em>next Wednesday at 3:30pm</em>, and if that slot
          conflicts, take the next free slot that afternoon. The calendar fixture anchors
          &ldquo;today&rdquo; at Friday, July 10 — so next Wednesday is the 15th, the requested
          15:30 conflicts, and the only correct answer is 17:15.
        </p>

        <p className={P}>
          I ran it five times through Reflight&apos;s N-run executor. Then, because the result was
          hard to believe, ten more. Total spend for fifteen live runs: under a cent.
        </p>

        <h2 className={H2}>What happened</h2>

        <p className={P}>
          <K>
            Fifteen out of fifteen runs booked July 12 — a Sunday — at 15:30, and confirmed it to
            the user as &ldquo;Wednesday, July 12th.&rdquo;
          </K>{" "}
          The recorded transcript makes the failure exact. The agent <em>did</em> call{" "}
          <C>get_today</C> first, <em>did</em> receive the correct date — and computed &ldquo;next
          Wednesday&rdquo; as July 12 anyway:
        </p>

        <figure className="figure-frame my-8">
          <span className="fig-label" aria-hidden="true">
            Fig. 1
          </span>
          <div className="flex items-center gap-3 px-4 pt-4">
            <span className="provenance" data-mode="recorded">
              recorded · 2026-07-10
            </span>
          </div>
          <div
            className="overflow-x-auto px-4 py-4"
            tabIndex={0}
            role="region"
            aria-label="Recorded run transcript"
          >
            <div className="mono border-l-2 border-ink-soft pl-4 text-xs leading-[1.9]">
              <ReportLine n="01" tag="TOOL">
                get_today {"{}"} → {"{"}date: 2026-07-10, weekday: Friday{"}"}
              </ReportLine>
              <ReportLine n="02" tag="TOOL">
                check_availability {"{"}date:{" "}
                <strong className="font-semibold text-fail">2026-07-12</strong>, start: 15:30{"}"} →
                available <span className="text-muted">(empty day)</span>
              </ReportLine>
              <ReportLine n="03" tag="TOOL">
                book_meeting {"{"}date:{" "}
                <strong className="font-semibold text-fail">2026-07-12</strong>, start: 15:30{"}"} →
                booked
              </ReportLine>
              <ReportLine n="04" tag="LLM">
                &quot;…successfully booked for{" "}
                <strong className="font-semibold text-fail">Wednesday, July 12th</strong> at
                15:30.&quot;
              </ReportLine>
            </div>
          </div>
          <figcaption className="border-t border-line px-4 py-2.5">
            <span className="smallcaps block text-muted">
              One of fifteen recorded runs — identical wrong answer in every one
            </span>
            <span className="mono mt-1.5 block text-[0.6875rem] text-muted">
              source:{" "}
              <a
                href="https://github.com/pauti04/reflight"
                className="underline decoration-line underline-offset-2 hover:text-ink"
              >
                github.com/pauti04/reflight
              </a>{" "}
              · docs/case-study.md
            </span>
            <span className="mono mt-0.5 block text-[0.6875rem] text-muted">
              reproduce locally:{" "}
              <span className="text-ink-soft">
                git clone https://github.com/pauti04/reflight &amp;&amp; cd reflight &amp;&amp;
                pytest
              </span>
            </span>
          </figcaption>
        </figure>

        <p className={P}>
          Here is the uncomfortable part: <K>every tool-level check passed.</K> The wrong day has an
          empty calendar, so availability said yes. The booking succeeded. No tool errored, no loop,
          no crash. The rule classifiers — correctly — found nothing. Fifteen green verdicts, 100%
          pass rate, one distinct answer. The agent isn&apos;t flaky. It is{" "}
          <em>consistently, confidently wrong</em>, which no amount of retry-and-compare can
          surface.
        </p>

        <h2 className={H2}>What caught it — and what almost didn&apos;t</h2>

        <p className={P}>
          Two layers, both run on the recordings after the fact — no re-execution, no additional
          agent spend.
        </p>

        <p className={P}>
          <K>The LLM judge</K> (gpt-4o-mini judging itself) read the transcripts and flagged the
          failure at 0.90 confidence — &ldquo;the agent incorrectly stated the date of the meeting
          as Wednesday, July 12, 2026, when it is actually a Sunday.&rdquo; Impressive. Except
          across three batches of the same failure, the same judge caught{" "}
          <span className="mono text-ink">5 of 5</span>, then{" "}
          <span className="mono text-ink">3 of 5</span>, then{" "}
          <span className="mono font-semibold text-fail">1 of 5</span>. A judge is a probabilistic
          net — cheap, useful, and exactly as nondeterministic as the agents it judges. Measuring
          that variance took thirty seconds precisely <em>because</em> the runs were recordings:
          re-judging is free re-reading, not re-running.
        </p>

        <p className={P}>
          <K>A deterministic assertion</K> — fifteen lines of Python that read each recording and
          check the booked slot against ground truth — caught{" "}
          <span className="mono text-ink">every run in every batch</span>, and folded the verdicts
          under one shared failure signature: <C>wrong_slot ×15</C>, same bug, every run. Encode
          ground truth once, and every future recording — CI runs included — gets checked against
          it for $0.00.
        </p>

        <h2 className={H2}>Why this needed a flight recorder</h2>

        <ol className="ml-5 list-decimal space-y-3 text-[0.95rem] leading-[1.7] text-ink-soft marker:text-muted">
          <li>
            <K>The failure would otherwise be a support ticket.</K> &ldquo;Agent booked the wrong
            day,&rdquo; from a user, days later, with nothing to inspect. Instead it&apos;s fifteen
            committed recordings that reproduce the exact moment, offline, with the network
            hard-blocked.
          </li>
          <li>
            <K>Pass rates lied; the recording didn&apos;t.</K> Every metric short of reading the
            transcript said this agent works. The transcript is the only place the bug exists —
            which is an argument for keeping every transcript.
          </li>
          <li>
            <K>Recurrence turned fifteen anecdotes into one bug.</K> A shared fingerprint groups
            every run under a single finding. One defect, not fifteen incidents.
          </li>
        </ol>

        <p className={P}>
          The layering is the actual thesis of Reflight: the judge and the assertion are both just{" "}
          <em>consumers of the same recording</em>. An open, replayable format is the substrate;
          detectors, evals, and regression tests are things you run on top of it — as many times as
          you like, for free.
        </p>

        <h2 className={H2}>Footnote: what the microscope caught in itself</h2>

        <p className={P}>
          Running this study also surfaced two real bugs in Reflight: the pricing table had no
          OpenAI models, and cost computation didn&apos;t read OpenAI&apos;s usage keys — so the
          first batch of live runs ingested at $0.0000. Both fixed in the same commit. A case study
          that finds bugs in the microscope too is a good day.
        </p>

        <hr className="border-line" aria-hidden="true" />

        <p className="text-sm leading-relaxed text-muted">
          Reflight is open source at{" "}
          <a
            href="https://github.com/pauti04/reflight"
            className="text-ink-soft underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current"
          >
            github.com/pauti04/reflight
          </a>
          , with the full case study, recordings, and the 15-line assertion in the repo. The{" "}
          <a
            href="https://pauti04.github.io/reflight-demo/"
            className="text-ink-soft underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current"
          >
            hosted demo
          </a>{" "}
          replays real recorded runs in your browser.
        </p>
      </article>

      <footer className="mono mt-16 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-t border-line pt-6 text-xs">
        <Link
          href="/writing"
          className="underline decoration-line underline-offset-4 hover:decoration-current"
        >
          ← all writing
        </Link>
        <a
          href={`mailto:${CONTACT.email}`}
          className="underline decoration-line underline-offset-4 hover:decoration-current"
        >
          {CONTACT.email}
        </a>
      </footer>
    </main>
  );
}
