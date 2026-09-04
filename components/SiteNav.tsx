"use client";

// ---------------------------------------------------------------------------
// SITE NAV — the one piece of chrome that follows the reader.
//
// Fixed, exactly 3.25rem tall (published as --nav-h on <html> by
// app/layout.tsx). Over the opening of "/" it is not there: the hero already
// carries the name, the links and the email, and a bar on top of it would be
// saying everything twice. Once the reader has scrolled past ~80% of the
// viewport it slides in and stays. On every other route it is simply present,
// and it leaves a spacer of its own height in the flow so no page has to pad
// for it.
//
// Drawn from the theme tokens only: --ground at 85% behind it, a --rule
// hairline under it, the mono face. Motion is opacity + transform and is
// skipped entirely when the reader prefers reduced motion. While hidden it is
// visibility:hidden, so Tab never lands on an invisible link. It never prints.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

import { CONTACT } from "@/lib/claims";

/** Fraction of the viewport the reader must scroll past on "/" before the bar appears. */
const REVEAL_AT = 0.8;

const LINKS = [
  { href: "/#work", label: "work", route: null },
  { href: "/#journey", label: "journey", route: null },
  { href: "/cv", label: "cv", route: "/cv" },
  { href: "/writing", label: "writing", route: "/writing" },
] as const;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** "/cv/" and "/cv" are the same place; so are "/writing/foo" and "/writing". */
const normalise = (p: string | null) => (p ?? "/").replace(/\/+$/, "") || "/";

export default function SiteNav() {
  const pathname = normalise(usePathname());
  const isHome = pathname === "/";

  const [passedHero, setPassedHero] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      setPassedHero(window.scrollY > window.innerHeight * REVEAL_AT);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome]);

  const shown = !isHome || passedHero;

  const motion: CSSProperties = shown
    ? {
        opacity: 1,
        transform: "none",
        visibility: "visible",
        transition: reduceMotion
          ? "none"
          : `opacity 280ms ease, transform 420ms ${EASE}, visibility 0s`,
      }
    : {
        opacity: 0,
        transform: reduceMotion ? "none" : "translateY(-0.75rem)",
        visibility: "hidden",
        transition: reduceMotion
          ? "none"
          : "opacity 200ms ease, transform 200ms ease, visibility 0s linear 200ms",
      };

  return (
    <>
      {/* Flow spacer: on every route but "/", the page starts below the bar. */}
      {!isHome && (
        <div aria-hidden="true" className="print:hidden" style={{ height: "var(--nav-h)" }} />
      )}

      <div
        className="fixed inset-x-0 top-0 z-50 print:hidden"
        style={{ height: "var(--nav-h)", ...motion }}
      >
        <nav
          aria-label="Site"
          className="mono h-full border-b border-rule"
          style={{
            background: "color-mix(in srgb, var(--ground) 85%, transparent)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div className="mx-auto flex h-full w-full max-w-[var(--page-max)] items-center justify-between gap-x-3 pr-5 pl-[var(--content-x)] text-[0.75rem] sm:gap-x-8 sm:pr-10 sm:text-[0.8125rem] lg:pr-16">
            {/* the mark — the same route-blue node the favicon carries; on a
                phone the node stands alone so four links and the email fit */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-ink"
              aria-label="pauti04 — the journey, from the top"
              aria-current={isHome ? "page" : undefined}
            >
              <span aria-hidden="true" className="inline-block size-[7px] rounded-full bg-route" />
              <span className="hidden sm:inline">pauti04</span>
            </Link>

            <ul className="flex shrink-0 items-center gap-x-3 sm:gap-x-6 sm:tracking-[0.04em]">
              {LINKS.map((l) => {
                const current =
                  l.route !== null && (pathname === l.route || pathname.startsWith(`${l.route}/`));
                return (
                  <li key={l.href} className="flex">
                    <Link
                      href={l.href}
                      aria-current={current ? "page" : undefined}
                      className={`transition-colors duration-200 hover:text-ink ${
                        current ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* the quiet primary */}
            <a href={`mailto:${CONTACT.email}`} className="quiet-link shrink-0 text-ink">
              <span className="sm:hidden">email</span>
              <span className="hidden sm:inline">{CONTACT.email}</span>
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}
