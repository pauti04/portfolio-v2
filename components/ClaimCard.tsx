"use client";

// Full card anatomy: left rail (status + CHK-NN) · CLAIM · EVIDENCE (mono
// table + methodology + Limits) · VERIFY (figure-frame graft around the demo
// body, run button, log, provenance chip, device-vs-reference line).

import type { ReactNode } from "react";
import type { Claim } from "@/lib/claims";
import { useChecks, type CheckStatus } from "@/components/RunAllProvider";
import CheckLog from "@/components/CheckLog";

const statusClass: Record<CheckStatus, string> = {
  idle: "status-idle",
  running: "status-running",
  pass: "status-pass",
  fail: "status-fail",
};

const claimSize: Record<Claim["size"], string> = {
  xl: "text-2xl sm:text-3xl md:text-[2.5rem] md:leading-[1.15]",
  lg: "text-xl sm:text-2xl md:text-3xl",
  md: "text-lg sm:text-xl md:text-2xl",
  sm: "text-base sm:text-lg md:text-xl",
};

const modeLabel = { live: "live", recorded: "recorded", build: "build-time" } as const;
const originWord = { live: "your device", recorded: "recorded replay", build: "build machine" } as const;

export default function ClaimCard({ claim, children }: { claim: Claim; children: ReactNode }) {
  const { states, builtAt, runCheck, runningAll } = useChecks();
  const state = states[claim.slug];
  const result = state.result;

  const chipTime = state.ranByVisitor
    ? "this visit"
    : builtAt.replace("T", " ").slice(0, 16) + " UTC";

  const deviceLine = result
    ? `${originWord[result.mode]}: ${result.metrics[0]?.value ?? "—"} ${result.metrics[0]?.label ?? ""}`
    : "not yet run";

  return (
    <article
      id={claim.id.toLowerCase()}
      aria-labelledby={`${claim.id.toLowerCase()}-claim`}
      className="grid scroll-mt-16 gap-x-8 gap-y-4 border-t border-line py-10 md:grid-cols-[5.5rem_1fr] md:py-12"
    >
      {/* left rail */}
      <div className="flex items-baseline gap-4 md:flex-col md:items-start md:gap-2">
        <span className={`status-icon ${statusClass[state.status]} text-xs`}>{state.status}</span>
        <span className="mono text-xs text-muted">{claim.id}</span>
        <span className="mono text-xs text-ink-soft md:mt-1">{claim.name}</span>
      </div>

      <div className="min-w-0 space-y-6">
        {/* claim */}
        <h3
          id={`${claim.id.toLowerCase()}-claim`}
          className={`${claimSize[claim.size]} max-w-[36ch] font-bold tracking-tight text-ink`}
        >
          {claim.claim}
        </h3>

        {/* evidence */}
        <section aria-label={`${claim.id} evidence`}>
          <div className="mb-2.5 flex flex-wrap items-center gap-3">
            <h4 className="smallcaps text-muted">Evidence</h4>
            <span className="provenance" data-mode="recorded">
              recorded · repo benchmarks
            </span>
          </div>
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label={`Scrollable table: ${claim.id}`}
          >
            <table className="mono w-full border-collapse text-left text-xs">
              <tbody>
                {claim.evidence.map((row) => (
                  <tr key={row.metric} className="border-t border-line last:border-b">
                    <td className="whitespace-nowrap py-1.5 pr-4 align-top text-ink">{row.value}</td>
                    <td className="py-1.5 pr-4 align-top text-ink-soft">{row.metric}</td>
                    <td className="py-1.5 align-top text-muted">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-muted">{claim.methodology}</p>
          <p className="mt-1 text-xs italic leading-relaxed text-muted">Limits: {claim.limits}</p>
        </section>

        {/* verify */}
        <section aria-label={`${claim.id} verify`}>
          <div className="mb-2.5 flex flex-wrap items-center gap-3">
            <h4 className="smallcaps text-muted">Verify</h4>
            <button
              type="button"
              onClick={() => runCheck(claim.slug)}
              disabled={state.status === "running" || runningAll}
              className="border border-line px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:cursor-default disabled:opacity-40"
            >
              {state.status === "running" ? "Running…" : "Run check"}
            </button>
            {result && (
              <span className="provenance" data-mode={result.mode}>
                {modeLabel[result.mode]} · {chipTime}
              </span>
            )}
          </div>

          <figure className="figure-frame mt-4">
            <span className="fig-label" aria-hidden="true">
              Fig. {claim.figure.n}
            </span>
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={`Scrollable figure: ${claim.id}`}
            >
              {children}
            </div>
            <CheckLog logs={state.logs} />
            {result && (
              <div className="mono border-t border-line px-4 py-2 text-[0.6875rem] text-ink-soft">
                {deviceLine} <span className="text-muted">· {claim.reference}</span>
              </div>
            )}
            <figcaption className="border-t border-line px-4 py-2.5">
              <span className="smallcaps block text-muted">{claim.figure.caption}</span>
              <span className="mono mt-1.5 block text-[0.6875rem] text-muted">
                source:{" "}
                <a
                  href={claim.source}
                  className="underline decoration-line underline-offset-2 hover:text-ink"
                >
                  {claim.source.replace("https://", "")}
                </a>
              </span>
              <span className="mono mt-0.5 block text-[0.6875rem] text-muted">
                reproduce locally: <span className="text-ink-soft">{claim.reproduce}</span>
              </span>
            </figcaption>
          </figure>

          {result && (
            <p className="mono mt-2.5 text-xs text-ink-soft">
              <span className={statusClass[state.status] + " status-icon"}>{state.status}</span>{" "}
              <span className="text-muted">— {result.summary}</span>
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
