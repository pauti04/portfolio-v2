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
//
// Set as a printed strip: the hairline, the ruler under it, the build stamp
// in a hairline box, and one dot — which pulses in the route colour on the
// same terms as every provenance chip above it: only once a runner in this
// tab has actually reported mode "live". The words are unchanged; the ✓ on
// the count is still the thing that says "passing", never the dot.
// ----------------------------------------------------------------------------

import { useState } from "react";
import { useChecks } from "@/components/RunAllProvider";

const SOURCE = "https://github.com/pauti04/portfolio-v2";

export default function Colophon() {
  const { states, builtAt, passCount, total, observations, copySummary } = useChecks();
  const [copied, setCopied] = useState(false);
  const stamp = `${builtAt.replace("T", " ").slice(0, 16)} UTC`;

  // Live means live: something in this tab ran and came back mode "live".
  const live = Object.values(states).some((s) => s.ranByVisitor && s.result?.mode === "live");

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
      <div className="border-t border-rule">
        {/* the ruler under the hairline — the strip's printed edge */}
        <div className="ticks" aria-hidden="true" />

        <div className="pt-7 sm:pt-9">
          {/* the observations ledger — present only once there is something in it */}
          {observations.length > 0 && (
            <section
              aria-label="observations ledger"
              className="mb-8 border-b border-rule-soft pb-8"
            >
              <h2 className="eyebrow">Observations from this tab</h2>
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
              <span
                className="live-dot"
                data-mode={live ? "live" : "build"}
                aria-hidden="true"
              />
              <span className="build-stamp">
                Build{" "}
                <time dateTime={builtAt} className="text-ink-soft">
                  {stamp}
                </time>
              </span>
              <span aria-hidden="true"> · </span>
              <span className={`status-icon status-${passCount === total ? "pass" : "fail"}`}>
                {passCount}/{total} checks passing
              </span>
            </p>
            <p>
              <a className="quiet-link text-muted" href={SOURCE}>
                source: {SOURCE.replace("https://", "")}
              </a>
              <span aria-hidden="true"> · </span>
              set in Archivo and IBM Plex Mono
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
      </div>
    </footer>
  );
}
