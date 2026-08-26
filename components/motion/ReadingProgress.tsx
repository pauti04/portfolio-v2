"use client";

// ----------------------------------------------------------------------------
// Reading-progress hairline for the writing pages. A fixed 2px bar at the
// very top of the viewport, scaled horizontally with scroll position —
// transform-only (zero CLS), rAF-throttled, cyan (the one accent hue).
// Scroll-driven state rather than an animation, so it behaves identically
// under prefers-reduced-motion; purely decorative, hidden from AT.
// ----------------------------------------------------------------------------

import { useEffect, useRef } from "react";

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-accent-cyan"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
