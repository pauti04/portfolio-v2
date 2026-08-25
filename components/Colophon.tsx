"use client";

// Manifest colophon graft: the site measuring itself. Also renders the
// Observations ledger (every check a visitor runs appends a line) and the
// [copy summary] plain-text attestation.

import { useState } from "react";
import { useChecks } from "@/components/RunAllProvider";

export default function Colophon() {
  const { builtAt, passCount, total, observations, copySummary } = useChecks();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copySummary();
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mono space-y-6 text-xs">
      {/* observations ledger */}
      <section aria-label="observations ledger">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="smallcaps text-muted">Observations</h3>
          <button
            type="button"
            onClick={copy}
            className="border border-line px-2 py-0.5 text-[0.6875rem] text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            {copied ? "copied" : "[copy summary]"}
          </button>
        </div>
        <div className="mt-2.5 space-y-0.5 text-[0.6875rem]">
          {observations.length === 0 ? (
            <p className="text-muted">
              — none yet. Checks you run in this tab are logged here.
            </p>
          ) : (
            observations.map((o, i) => (
              <p key={i} className="text-ink-soft">
                <span className="text-muted">OBSERVED {o.time}</span> · {o.chk} · {o.metric} ·{" "}
                <span className="text-muted">{o.origin}</span>
              </p>
            ))
          )}
        </div>
      </section>

      {/* manifest */}
      <section aria-label="site manifest" className="border-t border-line pt-5">
        <h3 className="smallcaps text-muted">Colophon</h3>
        <dl className="mt-2.5 grid grid-cols-[7rem_1fr] gap-y-1 text-[0.6875rem]">
          <dt className="text-muted">built</dt>
          <dd className="text-ink-soft">
            <time dateTime={builtAt}>{builtAt}</time>
          </dd>
          <dt className="text-muted">commit</dt>
          <dd className="text-ink-soft">{process.env.NEXT_PUBLIC_COMMIT_SHA ?? "local"}</dd>
          <dt className="text-muted">checks</dt>
          <dd className="text-ink-soft">
            {total} declared · {passCount}/{total} passing on this page
          </dd>
          <dt className="text-muted">lighthouse</dt>
          <dd className="text-muted">pending first CI run — scores will be printed here, not claimed</dd>
        </dl>
      </section>
    </div>
  );
}
