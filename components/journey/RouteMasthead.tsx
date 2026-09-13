// ----------------------------------------------------------------------------
// THE MASTHEAD ROUTE — the journey on one horizontal line, under the name.
//
// The same motif the social card draws (app/opengraph-image.tsx): three nodes,
// PUNE · MANIPAL · CHARLOTTE, on one blue line. Here it is inline SVG at
// content width, with the two leg distances set beside their segments and the
// last node pulsing, the way the live dot does.
//
// Every string on it is read from lib/journey.ts — the city names from
// CHAPTERS, the mileage from LEGS, the spoken sentence from JOURNEY.spine.
// Nothing is authored here.
//
// Geometry is fixed by the viewBox (0 0 1000 120) and the width/height
// attributes, so the block reserves its height before paint: no layout shift.
// Below 640px the distance labels are dropped and the city labels are set
// larger, via the two contract groups .masthead-wide / .masthead-narrow
// (display swapped in app/globals.css).
//
// Accessibility: every drawn part is aria-hidden; the sr-only sentence carries
// the meaning. The three nodes are real links (<a> in SVG) so the route is
// keyboard-navigable — they are NOT under aria-hidden, because a focusable
// element inside a hidden subtree is an axe violation.
//
// Colour: the line is --route-deep → --route (the spine's gradient, turned
// sideways); nodes and the pulse are --route; the track and labels are the
// rule and soft ink. Tokens only.
// ----------------------------------------------------------------------------

import type { CSSProperties } from "react";
import { CHAPTERS, JOURNEY, LEGS } from "@/lib/journey";

/** Deterministic on both sides of hydration — no locale in the render path. */
const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// -- geometry (viewBox units) -------------------------------------------------

const W = 1000;
const H = 120;
const LINE_Y = 46;
const NODE_X = [40, 380, 960] as const;
const NODE_R = 7;
const HIT_R = 22;
const ANCHOR = ["start", "middle", "end"] as const;

const GRADIENT_ID = "masthead-route-line";

/** The existing route-pulse keyframes (globals.css), applied inline so the
 *  global reduced-motion kill switch (animation-duration !important) stops it. */
const PULSE: CSSProperties = {
  animation: "route-pulse 2.4s ease-in-out infinite",
  transformOrigin: "center",
  transformBox: "fill-box",
};

const STOP_DEEP: CSSProperties = { stopColor: "var(--route-deep)" };
const STOP_ROUTE: CSSProperties = { stopColor: "var(--route)" };
/** --route-ghost is not a Tailwind colour (theme-owned, non-text), so it is read inline. */
const GHOST: CSSProperties = { fill: "var(--route-ghost)" };

type RouteNode = { id: string; city: string; x: number; anchor: (typeof ANCHOR)[number] };

const NODES: RouteNode[] = CHAPTERS.map((c, i) => ({
  id: c.id,
  city: c.city,
  x: NODE_X[i] ?? NODE_X[NODE_X.length - 1],
  anchor: ANCHOR[i] ?? "middle",
}));

/** A leg's label sits at the midpoint of its segment. */
const LEG_LABELS = LEGS.map((leg, i) => ({
  id: leg.id,
  x: (NODE_X[i] + NODE_X[i + 1]) / 2,
  text: `${group(leg.miles)} mi`,
}));

const LAST = NODES.length - 1;

export default function RouteMasthead({ className }: { className?: string }) {
  return (
    <div className={`masthead-route ${className ?? ""}`}>
      <p className="sr-only">{JOURNEY.spine}</p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block h-auto w-full"
        overflow="visible"
      >
        <defs>
          <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={STOP_DEEP} />
            <stop offset="0.6" style={STOP_ROUTE} />
            <stop offset="1" style={STOP_ROUTE} />
          </linearGradient>
        </defs>

        {/* the line: a faint track edge to edge, the route drawn over it */}
        <g aria-hidden="true">
          <line
            x1={0}
            x2={W}
            y1={LINE_Y}
            y2={LINE_Y}
            className="stroke-rule"
            strokeWidth={1}
          />
          <line
            x1={NODE_X[0]}
            x2={NODE_X[LAST]}
            y1={LINE_Y}
            y2={LINE_Y}
            stroke={`url(#${GRADIENT_ID})`}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>

        {/* leg distances, above their segments — wide layouts only */}
        <g aria-hidden="true" className="masthead-wide">
          {LEG_LABELS.map((l) => (
            <text
              key={l.id}
              x={l.x}
              y={LINE_Y - 16}
              textAnchor="middle"
              fontSize={18}
              className="mono fill-ink-soft tracking-[0.12em]"
            >
              {l.text}
            </text>
          ))}
        </g>

        {/* city labels, under the nodes — one size for wide, one for narrow */}
        <g aria-hidden="true" className="masthead-wide">
          {NODES.map((n) => (
            <text
              key={n.id}
              x={n.x}
              y={LINE_Y + 40}
              textAnchor={n.anchor}
              fontSize={18}
              className="mono fill-ink-soft tracking-[0.22em] uppercase"
            >
              {n.city}
            </text>
          ))}
        </g>
        <g aria-hidden="true" className="masthead-narrow">
          {NODES.map((n) => (
            <text
              key={n.id}
              x={n.x}
              y={LINE_Y + 48}
              textAnchor={n.anchor}
              fontSize={32}
              className="mono fill-ink-soft tracking-[0.14em] uppercase"
            >
              {n.city}
            </text>
          ))}
        </g>

        {/* the nodes — links to their chapters; the last one is where he is */}
        {NODES.map((n, i) => (
          <a key={n.id} href={`#chapter-${n.id}`} aria-label={`Go to ${n.city}`}>
            {/* generous, invisible hit area */}
            <circle cx={n.x} cy={LINE_Y} r={HIT_R} fill="transparent" />
            {i === LAST && (
              <>
                <circle
                  cx={n.x}
                  cy={LINE_Y}
                  r={NODE_R + 5}
                  style={GHOST}
                  aria-hidden="true"
                />
                <circle
                  cx={n.x}
                  cy={LINE_Y}
                  r={NODE_R}
                  fill="none"
                  className="stroke-route"
                  strokeWidth={1.5}
                  style={PULSE}
                  aria-hidden="true"
                />
              </>
            )}
            <circle
              cx={n.x}
              cy={LINE_Y}
              r={NODE_R}
              className="fill-route"
              aria-hidden="true"
            />
          </a>
        ))}
      </svg>
    </div>
  );
}
