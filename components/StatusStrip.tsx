"use client";

// ----------------------------------------------------------------------------
// The verification chip in the Opening. The fold makes a claim — "every one of
// them runs right here" — and this is the receipt, one line under it: how many
// of the checks are passing and when the page was built and verified.
//
// It renders nothing of its own. The count and the stamp are the same seeded
// state the Arrival's RunAll and colophon read (lib/verification.json via
// RunAllProvider), so the number here can never disagree with the number
// there, and it moves live if the visitor runs a check. Status is never
// colour-only: the glyph is drawn by .status-icon.
// ----------------------------------------------------------------------------

import { useChecks } from "@/components/RunAllProvider";

export default function StatusStrip({ className }: { className?: string }) {
  const { builtAt, passCount, total, runningAll } = useChecks();
  const stamp = `${builtAt.replace("T", " ").slice(0, 16)} UTC`;
  const state = runningAll ? "running" : passCount === total ? "pass" : "fail";

  return (
    <p
      className={`mono inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-full border border-rule px-3.5 py-1.5 text-[0.8125rem] leading-snug text-ink-soft ${
        className ?? ""
      }`}
    >
      <span className={`status-icon status-${state}`}>
        {passCount}/{total} checks passing
      </span>
      <span aria-hidden="true" className="text-muted">
        ·
      </span>
      <span className="text-muted">
        built{" "}
        <time dateTime={builtAt} className="text-ink-soft">
          {stamp}
        </time>
      </span>
    </p>
  );
}
