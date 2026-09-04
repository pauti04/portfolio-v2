"use client";

// ----------------------------------------------------------------------------
// The colophon — the last thing on the page. When the page was built and
// verified, what is passing in this tab, where the source lives, what it is
// set in; and, once the visitor has run anything, the ledger of what they ran
// with a plain-text copy of the whole attestation.
//
// Every figure here is the same seeded state the rest of the page reads
// (lib/verification.json via RunAllProvider). Nothing is authored here except
// the three facts about the page itself.
// ----------------------------------------------------------------------------

import { useState } from "react";
import { useChecks } from "@/components/RunAllProvider";

const SOURCE = "https://github.com/pauti04/portfolio-v2";

export default function Colophon() {
  const { builtAt, passCount, total, observations, copySummary } = useChecks();
  const [copied, setCopied] = useState(false);
  const stamp = `${builtAt.replace("T", " ").slice(0, 16)} UTC`;

  const copy = async () => {
    const ok = await copySummary();
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2500);
  };

  return (
    <footer
      aria-label="colophon"
      className="mono mx-auto w-full max-w-[var(--page-max)] pr-5 pb-10 pl-[var(--content-x)] text-[0.8125rem] leading-relaxed text-muted sm:pr-10 sm:pb-12 lg:pr-16"
    >
      <div className="border-t border-rule pt-8 sm:pt-10">
        {/* the observations ledger — present only once there is something in it */}
        {observations.length > 0 && (
          <section
            aria-label="observations ledger"
            className="mb-8 border-b border-rule-soft pb-8"
          >
            <h2 className="eyebrow">Observations · this tab</h2>
            <ol className="mt-4 space-y-1 text-[0.75rem]">
              {observations.map((o, i) => (
                <li key={i} className="text-ink-soft">
                  <span className="text-muted">OBSERVED {o.time}</span> · {o.chk} ·{" "}
                  {o.metric} · <span className="text-muted">{o.origin}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
          <p>
            Build{" "}
            <time dateTime={builtAt} className="text-ink-soft">
              {stamp}
            </time>
            <span aria-hidden="true"> · </span>
            <span className={`status-icon status-${passCount === total ? "pass" : "fail"}`}>
              {passCount}/{total} checks passing
            </span>
          </p>
          <p>
            <a className="quiet-link text-muted" href={SOURCE}>
              source · {SOURCE.replace("https://", "")}
            </a>
            <span aria-hidden="true"> · </span>
            typeset in Archivo + IBM Plex Mono
          </p>
        </div>

        <p className="mt-3">
          <button
            type="button"
            onClick={copy}
            className="quiet-link mono cursor-pointer border-0 bg-transparent p-0 text-[0.8125rem] text-muted transition-colors hover:text-ink-soft"
          >
            {copied ? "copied" : "copy verification summary"}
          </button>
        </p>
      </div>
    </footer>
  );
}
