"use client";

// ----------------------------------------------------------------------------
// The one global control: run every check on the route, top to bottom. Wired
// to the existing RunAllProvider — the count, the sequencing and the polite
// announcements all already live there.
// ----------------------------------------------------------------------------

import { RUN_CONTROL_CLASS, useChecks } from "@/components/RunAllProvider";

export default function RunAll() {
  const { runAll, runningAll, passCount, total } = useChecks();

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <button
        type="button"
        className={RUN_CONTROL_CLASS}
        onClick={runAll}
        disabled={runningAll}
        aria-label={`Run all ${total} checks, top to bottom`}
      >
        {runningAll ? "running…" : `run all ${total}`}
      </button>
      <span className="mono text-[0.8125rem] text-muted">
        {passCount}/{total} passing
      </span>
    </div>
  );
}
