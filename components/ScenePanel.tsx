// ----------------------------------------------------------------------------
// The panel chrome a scene demo renders inside. Slots:
//   label       — mono micro-line (the system's name)
//   provenance  — honest origin label: live / recorded / build-verified
//   children    — the demo body (scrolls horizontally in its own region)
//   credits     — "performance credits" footer: measured numbers, mono, dry
// Pure chrome; no state. Written against the token contract only — the label
// is ink, never the route: --route means the route, and nothing else. The
// one accent here is the provenance chip's live dot, which globals.css draws
// in var(--proj, var(--route)) — the project's colour inside a ProjectStop,
// the route blue anywhere else.
// ----------------------------------------------------------------------------

import type { ReactNode } from "react";

export type SceneProvenance = "live" | "recorded" | "build-verified";

export default function ScenePanel({
  label,
  provenance,
  credits,
  children,
  className,
}: {
  label: string;
  provenance?: SceneProvenance;
  credits?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`warm-panel overflow-hidden ${className ?? ""}`}>
      {/* header rail — same measure as the ProjectStop panel header */}
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5">
        <span className="mono text-[0.6875rem] tracking-[0.18em] text-ink-soft uppercase">
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
        className="demo-well overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={`${label} demo`}
      >
        {children}
      </div>

      {/* performance credits */}
      {credits && (
        <div className="mono px-4 py-3 text-[0.6875rem] leading-relaxed text-ink-soft sm:px-5">
          <span className="credit-line mr-3 text-[0.625rem] tracking-[0.24em]">
            Performance&nbsp;credits
          </span>
          <span className="text-muted">{credits}</span>
        </div>
      )}
    </div>
  );
}
