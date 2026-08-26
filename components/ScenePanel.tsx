// ----------------------------------------------------------------------------
// The glass panel chrome every scene demo renders inside. Slots:
//   label       — accent mono micro-line (the system's name)
//   provenance  — honest origin label: live / recorded / build-verified
//   children    — the demo body (scrolls horizontally in its own region)
//   credits     — "performance credits" footer: measured numbers, mono, dry
// Pure chrome; no state. Scene agents replace the body, not this frame.
// ----------------------------------------------------------------------------

import type { ReactNode } from "react";

export type SceneAccent = "violet" | "cyan" | "teal" | "ivory";
export type SceneProvenance = "live" | "recorded" | "build-verified";

const accentClass: Record<SceneAccent, string> = {
  violet: "text-accent-violet",
  cyan: "text-accent-cyan",
  teal: "text-accent-teal",
  ivory: "text-ink-soft",
};

export default function ScenePanel({
  label,
  accent = "ivory",
  provenance,
  credits,
  children,
  className,
}: {
  label: string;
  accent?: SceneAccent;
  provenance?: SceneProvenance;
  credits?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-panel overflow-hidden ${className ?? ""}`}>
      {/* header rail */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-5 py-3.5 sm:px-6">
        <span
          className={`mono text-[0.6875rem] tracking-[0.2em] uppercase ${accentClass[accent]}`}
        >
          {label}
        </span>
        {provenance && (
          <span className="provenance" data-mode={provenance}>
            {provenance}
          </span>
        )}
      </div>

      {/* body */}
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={`${label} demo`}
      >
        {children}
      </div>

      {/* performance credits */}
      {credits && (
        <div className="mono border-t border-rule px-5 py-3 text-[0.6875rem] leading-relaxed text-ink-soft sm:px-6">
          <span className="credit-line mr-3 text-[0.625rem] tracking-[0.24em]">
            Performance&nbsp;credits
          </span>
          <span className="text-muted">{credits}</span>
        </div>
      )}
    </div>
  );
}
