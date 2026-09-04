// ----------------------------------------------------------------------------
// 404 — an address that is not on the route.
//
// Same rail, same tokens, same three utilities the rest of the site is set in
// (eyebrow, city-type, mono). On a static export this is written out as
// out/404.html, which GitHub Pages serves for every unknown path.
// ----------------------------------------------------------------------------

import Link from "next/link";

import { JOURNEY } from "@/lib/journey";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[var(--page-max)] flex-1 flex-col justify-center pr-5 pb-24 pl-[var(--content-x)] pt-16 sm:pr-10 sm:pt-24 lg:pr-16">
      <p className="eyebrow">404 · off the route</p>

      <h1 className="city-type mt-6 text-[clamp(2.75rem,10vw,6.5rem)]">Not a stop.</h1>

      <p className="mono mt-8 max-w-[46ch] text-[0.8125rem] leading-relaxed text-ink-soft">
        The line runs <span aria-hidden="true">{JOURNEY.route}</span>
        <span className="sr-only">{JOURNEY.routeSpoken}</span>. This address is not on it.
      </p>

      <nav
        aria-label="back on the route"
        className="mono mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[0.8125rem]"
      >
        <Link href="/" className="quiet-link">
          <span aria-hidden="true">← </span>back to the journey
        </Link>
        <Link href="/#work" className="quiet-link text-muted">
          the work
        </Link>
        <Link href="/cv" className="quiet-link text-muted">
          cv
        </Link>
      </nav>
    </main>
  );
}
