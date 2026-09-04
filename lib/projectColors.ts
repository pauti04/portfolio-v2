// ----------------------------------------------------------------------------
// PROJECT ACCENTS — one hue per system, so the seven stops stop blurring
// together. This is a presentation file, not a content file: it never touches
// lib/claims.ts, and no number or word on the page is read from here.
//
// ProjectStop publishes the value as the CSS custom property --proj on the
// project root; everything inside reads `var(--proj, var(--route))`, so a check
// rendered outside a ProjectStop falls back to route blue and nothing breaks.
//
// The hex values are measured (sRGB, WCAG 2.1) against all three surfaces —
// the table lives in the header of app/themes/a.css, under PROJECT ACCENTS.
// Lowest ratio anywhere is reflight on --panel at 5.32:1, a full stop clear of
// the 4.5:1 text floor. Hues are spread so no accent neighbours --fail red,
// and chaincheck-action shares chaincheck's amber on purpose: it is the
// companion, and the shared hue says so.
// ----------------------------------------------------------------------------

import type { CheckSlug } from "@/lib/claims";

export const PROJECT_ACCENT: Record<CheckSlug, string> = {
  reflight: "#4C86FF", // blue   220°  — the flagship keeps the house blue
  bourse: "#A78BFA", // violet 260°
  netpulse: "#22D3EE", // cyan   190°
  costdna: "#4ADE80", // green  140°
  chaincheck: "#F5B544", // amber   40°
  "chaincheck-action": "#F5B544", // amber   40°  — companion, same hue
  rasoibot: "#A3E635", // lime    80°
};

/** The accent for a project, as a CSS colour string. */
export function projectAccent(slug: CheckSlug): string {
  return PROJECT_ACCENT[slug];
}
