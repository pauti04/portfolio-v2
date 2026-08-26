// ----------------------------------------------------------------------------
// WRITING — a short branch off the route.
//
// Same warm ground, same rail, same type as the journey. Each post is a stop
// on a short line: eyebrow, display-face title, summary. No panels here —
// panels are reserved for excerpts and demo bodies.
//
// Every word of copy is ported verbatim from the previous build and from
// lib/claims.ts. Nothing is authored here except the chrome.
// ----------------------------------------------------------------------------

import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CONTACT, WRITING } from "@/lib/claims";

export const metadata: Metadata = {
  title: "Writing — Parth Auti",
  description:
    "Working notes from Parth Auti — short technical writeups on systems, networking, and ML infrastructure. Every number in them is reproducible from the repos.",
};

/** The static rail. Same geometry as the journey spine, drawn in full. */
function Rail() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 bottom-0 left-0 w-[var(--rail-w)] rounded-full"
      style={{
        background:
          "linear-gradient(to bottom, transparent 0%, var(--rule) 4%, var(--rule) 94%, transparent 100%)",
      }}
    />
  );
}

export default function WritingIndex() {
  return (
    <main className="relative mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8">
      <nav
        aria-label="site"
        className="mono flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule pt-8 pb-4 text-[0.8125rem]"
      >
        <Link href="/" className="quiet-link">
          <span aria-hidden="true">← </span>the journey
        </Link>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <a href={CONTACT.github} className="quiet-link text-muted">
            github
          </a>
          <span aria-current="page" className="text-ink-soft">
            writing
          </span>
          <Link href={CONTACT.resumeHref} className="quiet-link text-muted">
            cv
          </Link>
        </div>
      </nav>

      <header className="pt-16">
        <p className="eyebrow">Working notes</p>
        <h1 className="city-type mt-6 text-[clamp(3rem,11vw,5.5rem)]">Writing.</h1>
        <p className="mt-7 max-w-[54ch] text-[1.0625rem] leading-[1.75] text-ink-soft">
          Short technical writeups on the systems from the checks ledger — the decisions that
          mattered and the numbers behind them. Every figure quoted is reproducible from the
          repos.
        </p>
      </header>

      <div className="relative mt-16 pl-[var(--rail-gap)]">
        <Rail />

        <ol className="space-y-14">
          {WRITING.map((post, i) => (
            <li
              key={post.slug}
              className="on-rail on-rail-stop"
              style={{ "--node-top": "0.55rem" } as CSSProperties}
            >
              <p className="mono flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[0.8125rem] tracking-[0.14em] text-muted uppercase">
                <span>No. {String(WRITING.length - i).padStart(2, "0")}</span>
                <time dateTime={post.date}>{post.date}</time>
                <span>{post.minutes} min read</span>
              </p>

              <h2 className="city-type mt-4 text-[clamp(1.65rem,4.6vw,2.375rem)]">
                <Link href={post.href} className="quiet-link">
                  {post.title}
                </Link>
              </h2>

              <p className="mt-4 max-w-[62ch] text-[0.9688rem] leading-[1.75] text-ink-soft">
                {post.summary}
              </p>

              <p className="mono mt-5 text-[0.8125rem]">
                <Link href={post.href} className="quiet-link">
                  read it ({post.minutes} min) <span aria-hidden="true">→</span>
                </Link>
              </p>
            </li>
          ))}
        </ol>
      </div>

      <footer className="mono mt-20 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-rule pt-6 text-[0.8125rem]">
        <Link href="/" className="quiet-link text-muted">
          <span aria-hidden="true">← </span>back to the journey
        </Link>
        <a href={`mailto:${CONTACT.email}`} className="quiet-link text-muted">
          {CONTACT.email}
        </a>
      </footer>
    </main>
  );
}
