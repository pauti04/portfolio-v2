"use client";

// ----------------------------------------------------------------------------
// Scroll-entrance wrapper. The child markup renders visible by default —
// without JS (and under prefers-reduced-motion) the page simply reads.
// With JS, an IntersectionObserver adds an entrance-animation class the
// first time the element reaches ~25% visibility; `both` fill means the
// animation itself supplies the hidden start frame. Transform/opacity only.
// ----------------------------------------------------------------------------

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Variant = "lift" | "slam" | "dim";

const variantClass: Record<Variant, string> = {
  lift: "rv-lift",
  slam: "rv-slam",
  dim: "rv-dim",
};

export default function Reveal({
  children,
  variant = "lift",
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  variant?: Variant;
  /** seconds; staggers siblings without layout cost */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "header" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style =
    delay > 0 ? ({ "--rv-delay": `${delay}s` } as CSSProperties) : undefined;

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      style={style}
      className={[entered ? variantClass[variant] : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
