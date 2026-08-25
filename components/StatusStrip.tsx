"use client";

// 7 labeled circles + RUN ALL + verified-at line. Green here is earned:
// the circles are seeded from the build-time verification, not styling.
// Status is never color-only: each circle carries a glyph, a title, and
// screen-reader text.

import { CLAIMS } from "@/lib/claims";
import { useChecks, type CheckStatus } from "@/components/RunAllProvider";

const statusColor: Record<CheckStatus, string> = {
  idle: "text-muted",
  running: "text-running",
  pass: "text-pass",
  fail: "text-fail",
};

const statusGlyph: Record<CheckStatus, string> = {
  idle: "",
  running: "→",
  pass: "✓",
  fail: "✗",
};

const statusWord: Record<CheckStatus, string> = {
  idle: "idle",
  running: "running",
  pass: "pass",
  fail: "fail",
};

export default function StatusStrip() {
  const { states, builtAt, runAll, runningAll, total } = useChecks();
  const stamp = builtAt.replace("T", " ").slice(0, 16) + " UTC";

  return (
    <section aria-label="verification status" className="border-y border-line">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
        <span className="mono text-xs text-ink-soft">
          {total} checks · verified at build{" "}
          <time dateTime={builtAt} className="text-ink">
            {stamp}
          </time>
        </span>
        <button
          type="button"
          onClick={runAll}
          disabled={runningAll}
          className="border border-ink px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-40"
        >
          {runningAll ? "Running…" : "Run all checks"}
        </button>
      </div>
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line py-2.5">
        {CLAIMS.map((c) => {
          const st = states[c.slug].status;
          return (
            <li key={c.id}>
              <a
                href={`#${c.id.toLowerCase()}`}
                title={`${c.id} · ${c.name} · ${statusWord[st]}`}
                className={`inline-flex items-center gap-1.5 no-underline hover:underline ${statusColor[st]}`}
              >
                <span
                  aria-hidden="true"
                  className="mono inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[0.625rem] leading-none"
                >
                  {statusGlyph[st]}
                </span>
                <span className="mono text-xs">{c.id.replace("CHK-", "")}</span>
                <span className="sr-only">
                  {c.name}: {statusWord[st]}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
