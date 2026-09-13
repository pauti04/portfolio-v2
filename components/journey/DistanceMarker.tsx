"use client";

// ----------------------------------------------------------------------------
// The beat between chapters, where the mileage lands. The number is rendered
// in the markup at its final value — it is correct without JavaScript, correct
// for a screen reader, and correct under prefers-reduced-motion.
//
// When motion IS allowed and the marker is still below the fold, the digits
// are set to zero before first paint and counted up on arrival by writing
// textContent directly: no React re-render per frame, no hydration seam. The
// numeral reserves its final width in `ch`, so counting shifts nothing.
//
// Beside the number, the leg itself: a thin arc from departure to arrival,
// stroked route-deep → route like the spine — a pen loading with ink. It is
// decorative and aria-hidden (the sentence "N miles" carries the fact), and
// it reserves its box with width/height attributes so nothing shifts when a
// stylesheet lands. It draws itself in on arrival under exactly the
// conditions the digits count, via one data attribute written next to them;
// otherwise it is simply drawn.
// ----------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import type { Leg } from "@/lib/journey";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Deterministic on both sides of hydration — no locale in the render path. */
const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const COUNT_MS = 1200;

// The arc's geometry, in its own user units. Departure and arrival sit on the
// same line (the flex row's baseline) and the curve rises between them; the
// major leg gets the wider hop. Not to scale — the numeral is the measure.
const ARC = {
  major: { w: 132, h: 60, d: "M 8 52 C 38 -4, 94 -4, 124 52", from: [8, 52], to: [124, 52] },
  minor: { w: 84, h: 44, d: "M 8 36 C 28 2, 56 2, 76 36", from: [8, 36], to: [76, 36] },
} as const;

/** The leg, drawn: route-deep at departure, the route blue at arrival. */
function LegArc({ id, major }: { id: string; major: boolean }) {
  const a = major ? ARC.major : ARC.minor;
  const gradient = `dm-arc-${id}`;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="dm-arc"
      width={a.w}
      height={a.h}
      viewBox={`0 0 ${a.w} ${a.h}`}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--route-deep)" }} />
          <stop offset="1" style={{ stopColor: "var(--route)" }} />
        </linearGradient>
      </defs>
      <path
        className="dm-arc-path"
        d={a.d}
        pathLength={1}
        fill="none"
        stroke={`url(#${gradient})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={a.from[0]} cy={a.from[1]} r="3" style={{ fill: "var(--route-deep)" }} />
      <g className="dm-arc-arrival">
        <circle cx={a.to[0]} cy={a.to[1]} r="7" style={{ fill: "var(--route-ghost)" }} />
        <circle cx={a.to[0]} cy={a.to[1]} r="3.5" style={{ fill: "var(--route)" }} />
      </g>
    </svg>
  );
}

export default function DistanceMarker({ leg }: { leg: Leg }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);
  const final = group(leg.miles);

  useIsoLayoutEffect(() => {
    const root = ref.current;
    const num = numRef.current;
    if (!root || !num) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen: the number is already right. Leave it.
    if (root.getBoundingClientRect().top < window.innerHeight) return;

    num.textContent = "0";
    root.dataset.count = "primed";
    let frame = 0;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Jumped clean past it? Put the real number back and stop.
          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            num.textContent = final;
            delete root.dataset.count;
            io.disconnect();
            continue;
          }
          if (!entry.isIntersecting) continue;
          io.disconnect();
          root.dataset.count = "in";
          const started = performance.now();
          const step = (now: number) => {
            const p = Math.min(1, (now - started) / COUNT_MS);
            const eased = 1 - Math.pow(1 - p, 3);
            num.textContent = group(Math.round(leg.miles * eased));
            frame = p < 1 ? requestAnimationFrame(step) : 0;
          };
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [leg.miles, final]);

  const major = leg.major;

  return (
    <div
      ref={ref}
      className={`on-rail on-rail-marker ${
        major ? "py-24 sm:py-32" : "py-16 sm:py-20"
      }`}
      style={{ "--node-top": "0.1rem" } as CSSProperties}
    >
      <p className="eyebrow">{major ? "The move" : "The first move"}</p>

      <p className="mono mt-5 text-[0.8125rem] tracking-[0.08em] text-muted">
        {leg.from} <span aria-hidden="true">→</span>
        <span className="sr-only"> to </span> {leg.to}
      </p>

      <p
        className={`mt-6 flex flex-wrap items-baseline gap-y-1 ${
          major ? "gap-x-6 sm:mt-8 sm:gap-x-10" : "gap-x-4 sm:gap-x-5"
        }`}
      >
        {/* The invisible copy holds the final width; the counting digits are
            painted on top of it. Nothing moves while the number climbs. */}
        <span
          aria-hidden="true"
          className={`numeral relative inline-block ${
            major
              ? "text-[clamp(4.5rem,20vw,12rem)]"
              : "text-[clamp(2.75rem,11vw,6rem)]"
          }`}
        >
          <span className="invisible">{final}</span>
          <span ref={numRef} className="absolute top-0 left-0 whitespace-nowrap">
            {final}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="mono text-sm tracking-[0.26em] text-route uppercase"
        >
          miles
        </span>
        <span className="sr-only">{final} miles</span>
        {/* the leg, drawn — sits on the row's baseline beside the numeral */}
        <LegArc id={leg.id} major={major} />
      </p>

      <p
        className={`mt-6 max-w-[44ch] leading-relaxed text-ink-soft ${
          major ? "text-lg sm:text-xl" : "text-[1.0625rem]"
        }`}
      >
        {leg.note}
      </p>
    </div>
  );
}
