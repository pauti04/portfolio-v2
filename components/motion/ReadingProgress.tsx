"use client";

// ----------------------------------------------------------------------------
// Reading-progress hairline for the writing pages. A fixed 2px bar along the
// very top edge of the viewport, scaled horizontally with scroll position —
// transform-only (zero CLS), rAF-throttled. Drawn in --route: it is the route
// through the post, the same way .route-fill is the route down the page.
// Scroll-driven state rather than an animation, so it behaves identically
// under prefers-reduced-motion; purely decorative, hidden from AT. Sits above
// the fixed nav so it is never covered by the nav's own top edge.
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
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 print:hidden"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-route"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
