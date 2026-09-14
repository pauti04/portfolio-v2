// ----------------------------------------------------------------------------
// Working notes · NetPulse · No. 01
//
// Blueprint ground, journey type, under the site's fixed nav with a --route
// reading-progress hairline along the top edge. Code excerpts sit in a lifted
// panel with a thin route rule — not a terminal, not a sheet.
//
// Every word of the article is ported verbatim from the previous build.
// ----------------------------------------------------------------------------

import type { Metadata } from "next";
import Link from "next/link";
import ReadingProgress from "@/components/motion/ReadingProgress";
import { CONTACT } from "@/lib/claims";

export const metadata: Metadata = {
  title: "How a patricia trie made RPKI validation 500× faster",
  description:
    "A short writeup on the longest-prefix-match index that turned NetPulse from offline tool into a live detector.",
};

/** Inline code, warm ink. */
function C({ children }: { children: React.ReactNode }) {
  return <code className="mono text-[0.85em] text-ink">{children}</code>;
}

/** Bolded key phrase — emphasis by ink weight, not colour. */
function K({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-ink">{children}</span>;
}

/** Code excerpt: warm panel, thin accent rule down the left of the listing. */
function CodeFigure({
  n,
  code,
  caption,
  sourcePath,
}: {
  n: number;
  code: React.ReactNode;
  caption: string;
  sourcePath: string;
}) {
  return (
    <figure className="warm-panel my-9">
      <figcaption className="sr-only">{caption}</figcaption>
      <p className="mono border-b border-rule-soft px-4 py-2.5 text-[0.6875rem] tracking-[0.16em] text-muted uppercase sm:px-5">
        Fig. {n}
      </p>
      <div
        className="demo-well overflow-x-auto px-4 py-4 sm:px-5"
        tabIndex={0}
        role="region"
        aria-label={caption}
      >
        <pre className="mono border-l-2 border-route pl-4 text-xs leading-[1.85] text-ink-soft">
          {code}
        </pre>
      </div>
      <div className="px-4 py-3 sm:px-5">
        <span className="mono block text-[0.6875rem] leading-relaxed text-ink-soft">
          {caption}
        </span>
        <span className="mono mt-1.5 block text-[0.6875rem] leading-relaxed text-muted">
          source:{" "}
          <a href="https://github.com/pauti04/netpulse" className="quiet-link text-muted">
            github.com/pauti04/netpulse
          </a>{" "}
          · {sourcePath}
        </span>
        <span className="mono mt-0.5 block text-[0.6875rem] leading-relaxed text-muted">
          reproduce locally:{" "}
          <span className="text-ink-soft">
            git clone https://github.com/pauti04/netpulse — methodology in BENCHMARK.md
          </span>
        </span>
      </div>
    </figure>
  );
}

const Cm = ({ children }: { children: React.ReactNode }) => (
  <span className="text-muted italic">{children}</span>
);
const Kw = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold text-ink">{children}</span>
);

const H2 = "city-type mt-12 text-[clamp(1.5rem,4vw,2rem)]";
const P = "mt-5 text-[0.9688rem] leading-[1.8] text-ink-soft";

export default function Post() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8">
      <ReadingProgress />

      {/* Running head under the fixed nav: the way back, top and bottom. */}
      <nav
        aria-label="breadcrumb"
        className="mono flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pt-8 text-[0.8125rem] text-muted"
      >
        <Link href="/" className="quiet-link text-muted">
          <span aria-hidden="true">← </span>the journey
        </Link>
        <Link href="/writing" className="quiet-link text-muted">
          writing
        </Link>
      </nav>

      <header className="pt-[var(--sect-gap-1)]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="eyebrow">Working notes · NetPulse · No. 01</p>
          <p className="mono text-[0.8125rem] text-muted">
            <time dateTime="2026-05-12">2026-05-12</time> · 5 min read
          </p>
        </div>
        <h1 className="city-type mt-6 max-w-[24ch] text-[clamp(2.125rem,6.4vw,3.5rem)]">
          How a patricia trie made RPKI validation 500× faster.
        </h1>
        <p className="mt-6 max-w-[56ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          The single change that took NetPulse from &ldquo;offline batch tool&rdquo; to &ldquo;live
          stream detector.&rdquo;
        </p>
      </header>

      <hr className="mt-12 border-rule" aria-hidden="true" />

      <article className="mt-10 max-w-[68ch]">
        <p className={P}>
          RPKI — the Resource Public Key Infrastructure — is the closest thing the Internet has to a
          source of truth about who&apos;s allowed to announce which prefixes. The TAL files publish
          hundreds of thousands of signed ROAs (Route Origin Authorizations). Each ROA says:{" "}
          <em>this origin ASN is allowed to announce this prefix, up to this length.</em> If a BGP
          announcement&apos;s (origin, prefix) pair doesn&apos;t match any covering ROA, it&apos;s{" "}
          <K>RPKI invalid</K> — and a hijack is suddenly very loud.
        </p>

        <p className={P}>
          NetPulse&apos;s job is to listen to a BGP feed (the RIPE RIS live stream) and, for each
          UPDATE, decide if the announcement is a hijack or a leak. The detector ensembles three
          signals; <C>rpki_invalid</C> is the cheapest and most informative one. So that signal has
          to be <em>fast</em> — line-rate fast.
        </p>

        <h2 className={H2}>The slow version</h2>

        <p className={P}>
          My first cut was the obvious one. Load all 859,043 VRPs into a flat list. For each
          announcement, linear-scan the list looking for any ROA that covered the prefix and matched
          the origin. Roughly:
        </p>

        <CodeFigure
          n={1}
          caption="The linear scan — correct, and useless at line rate"
          sourcePath="the first cut, since replaced"
          code={
            <>
              <Cm># the slow version</Cm>
              {"\n"}
              <Kw>def</Kw> validate(announce, vrps):{"\n"}
              {"    "}
              <Kw>for</Kw> vrp <Kw>in</Kw> vrps:{"\n"}
              {"        "}
              <Kw>if</Kw> announce.prefix.subnet_of(vrp.prefix) \{"\n"}
              {"           "}
              <Kw>and</Kw> announce.prefix.prefixlen &lt;= vrp.maxlen \{"\n"}
              {"           "}
              <Kw>and</Kw> announce.origin == vrp.asn:{"\n"}
              {"            "}
              <Kw>return</Kw> Validation.VALID{"\n"}
              {"    "}
              <Kw>return</Kw> Validation.UNKNOWN
            </>
          }
        />

        <p className={P}>
          The benchmark on my laptop: <span className="mono text-ink">43.2 ms / call</span>{" "}
          <span className="provenance align-middle" data-mode="recorded">
            recorded · BENCHMARK.md
          </span>
          . Fine for offline analysis. Useless at line rate — RIPE RIS pushes BGP UPDATEs faster
          than that, and you can&apos;t miss any.
        </p>

        <h2 className={H2}>The insight</h2>

        <p className={P}>
          VRPs are <em>prefixes</em>. The natural lookup over prefixes is <K>longest-prefix-match</K>{" "}
          — exactly what every Internet router does for forwarding decisions. The data structure
          that&apos;s been doing this in routing tables for forty years is a <K>patricia trie</K>: a
          binary trie keyed on network bits, compressed to skip identical stretches.
        </p>

        <p className={P}>
          Build once. Walk it bit-by-bit on lookup. O(prefix_length) — roughly 32 hops for IPv4.
          The trie is also a perfect fit for &ldquo;is there a covering ROA at any length up to
          maxlen?&rdquo; — the trie walk naturally surfaces every ancestor.
        </p>

        <h2 className={H2}>The fix</h2>

        <CodeFigure
          n={2}
          caption="The same class wired into the live detector — validate() is the hot path on every UPDATE"
          sourcePath="netpulse/rpki.py"
          code={
            <>
              <Cm># longest-prefix-match index: 500× faster than linear</Cm>
              {"\n"}
              <Kw>class</Kw> RPKIIndex:{"\n"}
              {"    "}
              <Kw>def</Kw> __init__(self, vrps: Iterable[VRP]):{"\n"}
              {"        "}self.trie = PatriciaTrie(){"\n"}
              {"        "}
              <Kw>for</Kw> vrp <Kw>in</Kw> vrps:{"\n"}
              {"            "}self.trie.insert(vrp.prefix, vrp){"\n"}
              {"\n"}
              {"    "}
              <Kw>def</Kw> validate(self, a: Announce) -&gt; Validation:{"\n"}
              {"        "}cov = self.trie.longest_prefix(a.prefix){"\n"}
              {"        "}
              <Kw>if not</Kw> cov: <Kw>return</Kw> Validation.UNKNOWN{"\n"}
              {"        "}
              <Kw>if</Kw> a.origin <Kw>in</Kw> cov.allowed_origins:{"\n"}
              {"            "}
              <Kw>return</Kw> Validation.VALID{"\n"}
              {"        "}
              <Kw>return</Kw> Validation.INVALID
            </>
          }
        />

        <h2 className={H2}>The numbers</h2>

        <p className={P}>
          New benchmark, same machine, same 859k-VRP dataset, same 1,000-call workload:
        </p>

        <div className="warm-panel mt-6 px-4 py-4 sm:px-5">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="eyebrow text-[0.6875rem] tracking-[0.16em]">Measured</span>
            <span className="provenance" data-mode="recorded">
              recorded · BENCHMARK.md
            </span>
          </div>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Measured results">
            <table className="mono w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="text-muted">
                    <th scope="col" className="py-1 pr-4 font-normal">approach</th>
                    <th scope="col" className="py-1 pr-4 font-normal">per call</th>
                    <th scope="col" className="py-1 font-normal">note</th>
                  </tr>
                </thead>
                <tbody>
                <tr className="border-t border-rule">
                  <td className="py-2 pr-4 align-top whitespace-nowrap text-ink">43.2 ms / call</td>
                  <td className="py-2 pr-4 align-top text-ink-soft">linear scan</td>
                  <td className="py-2 align-top text-muted">the first cut</td>
                </tr>
                <tr className="border-t border-rule">
                  <td className="py-2 pr-4 align-top whitespace-nowrap text-ink">86 µs / call</td>
                  <td className="py-2 pr-4 align-top text-ink-soft">patricia trie</td>
                  <td className="py-2 align-top text-muted">amortized, post warm-up</td>
                </tr>
                <tr className="border-y border-rule">
                  <td className="py-2 pr-4 align-top whitespace-nowrap text-ink">43 µs / call</td>
                  <td className="py-2 pr-4 align-top text-ink-soft">after rust ext</td>
                  <td className="py-2 align-top text-muted">with native bitmap ops</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className={P}>
          500× speedup. Suddenly RPKI validation isn&apos;t a bottleneck; it&apos;s free. The
          detector can run live against the RIS Live WebSocket and still have ~99.99% of its time
          budget left for the other two signals.
        </p>

        <h2 className={H2}>Lessons I keep relearning</h2>

        <ol className="mt-6 ml-5 list-decimal space-y-3 text-[0.9688rem] leading-[1.75] text-ink-soft marker:text-muted">
          <li>
            <K>Data structures matter more than language.</K> Rewriting the linear scan in Rust
            would have bought maybe 5×. The trie bought 500× in Python.
          </li>
          <li>
            <K>The right structure is often the boring one.</K> A patricia trie isn&apos;t novel —
            routers have used them since the eighties. The novelty was admitting that this lookup
            was equivalent to BGP forwarding and that the same tool applied.
          </li>
          <li>
            <K>Profile before optimising, then again after.</K> After the trie, RPKI dropped off the
            flamegraph entirely and a previously-invisible path-validation step became the new hot
            spot. Optimisation reshapes the bottleneck list.
          </li>
        </ol>

        <hr className="mt-12 border-rule" aria-hidden="true" />

        <p className="mt-6 text-[0.9375rem] leading-relaxed text-muted">
          The detector is open source at{" "}
          <a href="https://github.com/pauti04/netpulse" className="quiet-link text-ink-soft">
            github.com/pauti04/netpulse
          </a>
          . The benchmark methodology is documented in{" "}
          <span className="mono text-[0.85em] text-ink-soft">BENCHMARK.md</span> in the repo —
          happy to walk through it if you&apos;re curious.
        </p>
      </article>

      <footer className="mono mt-[var(--sect-gap-2)] flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-rule pt-6 text-[0.8125rem]">
        <span className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/writing" className="quiet-link">
            <span aria-hidden="true">← </span>all writing
          </Link>
          <Link href="/" className="quiet-link text-muted">
            back to the journey
          </Link>
        </span>
        <a href={`mailto:${CONTACT.email}`} className="quiet-link text-muted">
          {CONTACT.email}
        </a>
      </footer>
    </main>
  );
}
