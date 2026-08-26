"use client";

// ----------------------------------------------------------------------------
// Scroll entrance, the honest way.
//
// The markup renders VISIBLE. An element is only ever hidden if all three are
// true: JavaScript ran, motion is allowed, and the element is still below the
// fold — so no reader ever loses content to an observer that didn't fire, and
// nothing the reader can already see is snatched back to animate.
//
// Priming happens in a layout effect (before paint), so there is no flash.
// Transform and opacity only; the animation supplies its own start frame.
// ----------------------------------------------------------------------------

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type EnterVariant = "up" | "fade";

/** Attach to any element to give it the entrance behaviour. */
export function useEnterRef<T extends HTMLElement>(variant: EnterVariant = "up") {
  const ref = useRef<T | null>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already on screen (or scrolled past): leave it exactly as it is.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    if (variant === "fade") el.dataset.enterVariant = "fade";
    el.dataset.enter = "primed";

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Reveal on arrival — or immediately if the reader jumped straight
          // past it (anchor link, scroll restoration). Nothing stays hidden.
          const passed = entry.boundingClientRect.top < 0;
          if (!entry.isIntersecting && !passed) continue;
          el.dataset.enter = "in";
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant]);

  return ref;
}

/** Entrance delay plus any custom properties, typed as a style object. */
export function enterStyle(delay = 0, vars?: Record<string, string>): CSSProperties {
  return {
    ...(delay ? { "--enter-delay": `${delay}s` } : {}),
    ...vars,
  } as CSSProperties;
}

export default function Enter({
  children,
  delay = 0,
  variant = "up",
  className,
  style,
  as: Tag = "div",
}: {
  children: ReactNode;
  /** seconds — staggers siblings with no layout cost */
  delay?: number;
  variant?: EnterVariant;
  className?: string;
  /** custom properties merged into the style attribute */
  style?: Record<string, string>;
  as?: "div" | "section" | "header" | "footer" | "ul";
}) {
  const ref = useEnterRef<HTMLElement>(variant);
  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={className}
      style={enterStyle(delay, style)}
    >
      {children}
    </Tag>
  );
}
