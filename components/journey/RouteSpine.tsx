"use client";

// ----------------------------------------------------------------------------
// THE ROUTE LINE.
//
// One continuous line down the whole page, drawn to a point a little below the
// reader's eye line and no further. Scroll progress is written to two custom
// properties; the paint is a scaleY on the fill and a translateY on the head —
// compositor transforms only, so the line costs nothing and shifts nothing.
//
// Under prefers-reduced-motion the effect returns immediately and CSS pins the
// fill to scaleY(1): the whole route, drawn, static, still intentional.
// ----------------------------------------------------------------------------

import { useEffect, useRef } from "react";

/** How far down the viewport the drawn end of the line sits. */
const EYE_LINE = 0.72;

export default function RouteSpine() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const paint = () => {
      frame = 0;
      const total = el.offsetHeight;
      if (total <= 0) return;
      const top = el.getBoundingClientRect().top;
      const drawn = Math.min(
        Math.max(window.innerHeight * EYE_LINE - top, 0),
        total,
      );
      el.style.setProperty("--route-p", (drawn / total).toFixed(4));
      el.style.setProperty("--route-head", `${Math.round(drawn)}px`);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    // The page grows as fonts land and demos render themselves out.
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(document.body);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="route-spine">
      <span className="route-track" />
      <span className="route-fill" />
      <span className="route-head" />
    </div>
  );
}
