"use client";

// ----------------------------------------------------------------------------
// A PROJECT STOP — one thing he built, planted on the route where he built it.
//
// Name, one line on what it is, the audited headline numbers, the live demo
// body, and a run control wired straight into the existing RunAllProvider.
// Every number and every word of framing is read from lib/claims.ts via
// lib/journey.ts; nothing is authored here.
//
// The demo body is passed in as children — this component is the frame, the
// check components are the picture, and they are restyled on their own stage.
//
// Colour: the root publishes --proj (lib/projectColors.ts) so the block and
// everything inside it carry one accent. It lands in exactly five places —
// the eyebrow, the headline VALUES, the 2px tab, the "Figure N —" prefix, and
// (via globals.css) the live dot / running state / run control — and nowhere
// else. Name, tagline, labels, notes and copy stay ink. Nothing here is
// colour-only: every accented value sits next to its label.
// ----------------------------------------------------------------------------

import type { ReactNode } from "react";
import CheckLog from "@/components/CheckLog";
import { RUN_CONTROL_CLASS, useChecks } from "@/components/RunAllProvider";
import { claimBySlug, type CheckSlug } from "@/lib/claims";
import { headlineEvidence, taglineFor } from "@/lib/journey";
import { projectAccent } from "@/lib/projectColors";
import { enterStyle, useEnterRef } from "./Enter";

type Variant = "stop" | "companion";

const NAME_SIZE: Record<string, string> = {
  xl: "text-[clamp(2.5rem,8vw,4.75rem)]",
  lg: "text-[clamp(2.125rem,6.5vw,3.5rem)]",
  md: "text-[clamp(1.875rem,5.5vw,2.875rem)]",
  sm: "text-[clamp(1.75rem,5vw,2.5rem)]",
};

/** verification.json seeds these, so the label is honest before anyone clicks. */
function provenanceOf(mode: "live" | "recorded" | "build" | undefined) {
  if (mode === "live") return { key: "live", label: "live in this tab" };
  if (mode === "recorded") return { key: "recorded", label: "recorded replay" };
  return { key: "build-verified", label: "verified at build" };
}

export default function ProjectStop({
  slug,
  children,
  variant = "stop",
  delay = 0,
  onRail = true,
}: {
  slug: CheckSlug;
  /** the live demo body */
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  /** false outside the journey section, where there is no route line to hang off */
  onRail?: boolean;
}) {
  const claim = claimBySlug(slug);
  const { states, runCheck } = useChecks();
  const state = states[slug];
  const ref = useEnterRef<HTMLElement>();

  const companion = variant === "companion";
  const evidence = headlineEvidence(slug, companion ? 2 : 3);
  const provenance = provenanceOf(state.result?.mode);
  const running = state.status === "running";

  const statusLabel =
    state.status === "running"
      ? "running"
      : state.status === "fail"
        ? "fail"
        : state.status === "pass"
          ? state.ranByVisitor
            ? "pass, in your browser"
            : `pass, ${provenance.label}`
          : "not run yet";

  const headingId = `stop-${slug}-name`;

  return (
    <article
      ref={ref}
      id={`stop-${slug}`}
      aria-labelledby={headingId}
      className={`scroll-mt-16 proj-tab ${
        companion
          ? "proj-tab-short mt-12 sm:mt-14"
          : onRail
            ? "on-rail on-rail-stop"
            : "mt-16 border-t border-rule-soft pt-16 sm:mt-20 sm:pt-20 [--proj-tab-top:4rem] sm:[--proj-tab-top:5rem]"
      }`}
      style={enterStyle(delay, { "--node-top": "0.3rem", "--proj": projectAccent(slug) })}
    >
      <p className="eyebrow proj-ink">
        {companion
          ? "Shares the core above"
          : onRail
            ? "Built here"
            : "System"}
        <span aria-hidden="true">, </span>
        {claim.id}
      </p>

      <h3
        id={headingId}
        className={`city-type mt-4 ${NAME_SIZE[companion ? "sm" : claim.size]}`}
      >
        {claim.name}
      </h3>

      <p
        className={`mt-4 max-w-[54ch] leading-relaxed text-ink-soft ${
          companion ? "text-[1rem]" : "text-[1.0625rem] sm:text-lg"
        }`}
      >
        {taglineFor(slug)}
      </p>

      {/* the audited headline numbers */}
      <dl
        className={`mt-8 grid gap-x-10 gap-y-6 ${
          companion ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {evidence.map((row) => (
          <div key={row.metric} className="min-w-0">
            <dt className="mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
              {row.metric}
            </dt>
            <dd className="proj-ink font-display mt-2 text-[1.75rem] leading-none tracking-tight tabular-nums">
              {row.value}
            </dd>
            <dd className="mt-2 text-[0.8125rem] leading-snug text-muted">{row.note}</dd>
          </div>
        ))}
      </dl>

      {/* what the demo below is doing */}
      <p className="mt-9 max-w-[60ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        {claim.figure.caption}
      </p>

      {/* the live demo, in a warm panel */}
      <div className="warm-panel mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="mono text-[0.6875rem] tracking-[0.18em] text-ink-soft uppercase">
              <span className="proj-ink">Figure {claim.figure.n} —</span> {claim.name}
            </span>
            <span className="provenance" data-mode={provenance.key}>
              {provenance.label}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`status-icon status-${state.status} text-[0.6875rem]`}
              aria-hidden="true"
            >
              {statusLabel}
            </span>
            <button
              type="button"
              className={RUN_CONTROL_CLASS}
              onClick={() => runCheck(slug)}
              disabled={running}
              aria-label={`Run the ${claim.name} check — currently ${statusLabel}`}
            >
              {running ? "running…" : state.ranByVisitor ? "run again" : "run it"}
            </button>
          </div>
        </div>

        <div
          className="demo-well overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label={`${claim.name} demo`}
        >
          {children}
        </div>

        <CheckLog logs={state.logs} />

        <p className="mono px-4 py-3 text-[0.6875rem] leading-relaxed text-muted sm:px-5">
          {claim.reference}
        </p>
      </div>

      {/* the honest footer */}
      <p className="mt-5 max-w-[62ch] text-[0.875rem] leading-relaxed text-muted">
        <span className="text-ink-soft">Limits:</span> <em>{claim.limits}</em>
      </p>
      <p className="mt-3">
        <a className="quiet-link mono text-[0.8125rem]" href={claim.source}>
          {claim.source.replace("https://", "")}
        </a>
      </p>
    </article>
  );
}
