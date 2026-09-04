"use client";

// The run log — mono lines behind a thin left rule, so it reads as a margin
// note on the demo above it. Tone is carried by a glyph plus ink weight, never
// by colour alone; every colour used holds AA on the Blueprint ground. The
// scrolling list is keyboard-reachable (a scroll region that cannot take
// focus is unreachable without a mouse) and takes the site focus ring.
// Contract unchanged: renders the LogLine[] a runner emits, nothing else.

import type { LogLine } from "@/lib/checks/types";

const glyph: Record<NonNullable<LogLine["tone"]> | "default", string> = {
  muted: "·",
  ok: "✓",
  warn: "→",
  err: "✗",
  default: "·",
};

const inkWeight: Record<NonNullable<LogLine["tone"]> | "default", string> = {
  muted: "text-muted",
  ok: "text-ink",
  warn: "text-ink-soft",
  err: "text-fail font-medium",
  default: "text-ink-soft",
};

export default function CheckLog({ logs }: { logs: LogLine[] }) {
  if (logs.length === 0) return null;
  return (
    <div role="log" aria-label="run log" className="border-t border-rule-soft px-4 py-3 sm:px-5">
      <div
        className="mono max-h-32 space-y-1 overflow-y-auto border-l border-rule pl-3.5 text-[0.6875rem] leading-relaxed"
        tabIndex={0}
        role="region"
        aria-label="run log lines, scrollable"
      >
        {logs.map((l, i) => {
          const tone = l.tone ?? "default";
          return (
            <div key={i} className="grid grid-cols-[1rem_1fr_auto] gap-x-2">
              <span aria-hidden="true" className="text-muted">
                {glyph[tone]}
              </span>
              <span className={inkWeight[tone]}>{l.text}</span>
              <span className="text-muted">+{l.t}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
