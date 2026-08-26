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
// ----------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import type { Leg } from "@/lib/journey";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Deterministic on both sides of hydration — no locale in the render path. */
const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const COUNT_MS = 1200;

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
    let frame = 0;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Jumped clean past it? Put the real number back and stop.
          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            num.textContent = final;
            io.disconnect();
            continue;
          }
          if (!entry.isIntersecting) continue;
          io.disconnect();
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
        major ? "py-32 sm:py-48 lg:py-56" : "py-16 sm:py-20"
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
