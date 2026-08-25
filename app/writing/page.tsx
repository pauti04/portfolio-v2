import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, WRITING } from "@/lib/claims";

export const metadata: Metadata = {
  title: "Writing — Parth Auti",
  description:
    "Working notes from Parth Auti — short technical writeups on systems, networking, and ML infrastructure. Every number in them is reproducible from the repos.",
};

export default function WritingIndex() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 sm:px-8">
      <nav
        aria-label="site"
        className="mono flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-b border-line pb-4 pt-8 text-xs"
      >
        <Link
          href="/"
          className="underline decoration-line underline-offset-4 hover:decoration-current"
        >
          ← Parth Auti — the checks
        </Link>
        <span className="text-muted">writing</span>
      </nav>

      <header className="pt-14">
        <p className="smallcaps text-muted">Working notes</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Writing.</h1>
        <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
          Short technical writeups on the systems from the checks ledger — the decisions that
          mattered and the numbers behind them. Every figure quoted is reproducible from the repos.
        </p>
      </header>

      <ol className="mt-12">
        {WRITING.map((post, i) => (
          <li key={post.slug} className="border-t border-line py-8 last:border-b">
            <p className="mono flex flex-wrap items-baseline gap-x-4 text-xs text-muted">
              <span>No. {String(WRITING.length - i).padStart(2, "0")}</span>
              <time dateTime={post.date}>{post.date}</time>
              <span>{post.minutes} min read</span>
            </p>
            <h2 className="mt-2.5 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              <Link href={post.href} className="hover:underline hover:decoration-line hover:underline-offset-4">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">{post.summary}</p>
            <p className="mono mt-3 text-xs">
              <Link
                href={post.href}
                className="underline decoration-line underline-offset-4 hover:decoration-current"
              >
                read it ({post.minutes} min)
              </Link>
            </p>
          </li>
        ))}
      </ol>

      <footer className="mono mt-16 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-t border-line pt-6 text-xs">
        <Link
          href="/"
          className="underline decoration-line underline-offset-4 hover:decoration-current"
        >
          ← back to the checks
        </Link>
        <a
          href={`mailto:${CONTACT.email}`}
          className="underline decoration-line underline-offset-4 hover:decoration-current"
        >
          {CONTACT.email}
        </a>
      </footer>
    </main>
  );
}
