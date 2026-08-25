"use client";

// Report lines, not a console: mono ink on paper behind a thin left rule.
// Tone is carried by a glyph and ink weight — never by color alone, and
// never as colored text on a dark panel.

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
  err: "text-ink font-medium",
  default: "text-ink-soft",
};

export default function CheckLog({ logs }: { logs: LogLine[] }) {
  if (logs.length === 0) return null;
  return (
    <div role="log" aria-label="check report" className="border-t border-line px-4 py-2.5">
      <div className="mono max-h-32 space-y-0.5 overflow-y-auto border-l border-line pl-3 text-[0.6875rem] leading-relaxed">
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
