import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/lib/claims";

export const metadata: Metadata = {
  title: "How a patricia trie made RPKI validation 500× faster",
  description:
    "A short writeup on the longest-prefix-match index that turned NetPulse from offline tool into a live detector.",
};

/** Inline code, ink on paper. */
function C({ children }: { children: React.ReactNode }) {
  return <code className="mono text-[0.85em] text-ink">{children}</code>;
}

/** Bolded key phrase — emphasis by ink weight, not color. */
function K({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-ink">{children}</span>;
}

/** Code excerpt as an ink-on-paper report block: figure frame, thin left rule. */
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
    <figure className="figure-frame my-8">
      <span className="fig-label" aria-hidden="true">
        Fig. {n}
      </span>
      <div className="overflow-x-auto px-4 py-4">
        <pre className="mono border-l-2 border-ink-soft pl-4 text-xs leading-[1.85] text-ink-soft">
          {code}
        </pre>
      </div>
      <figcaption className="border-t border-line px-4 py-2.5">
        <span className="smallcaps block text-muted">{caption}</span>
        <span className="mono mt-1.5 block text-[0.6875rem] text-muted">
          source:{" "}
          <a
            href="https://github.com/pauti04/netpulse"
            className="underline decoration-line underline-offset-2 hover:text-ink"
          >
            github.com/pauti04/netpulse
          </a>{" "}
          · {sourcePath}
        </span>
        <span className="mono mt-0.5 block text-[0.6875rem] text-muted">
          reproduce locally:{" "}
          <span className="text-ink-soft">
            git clone https://github.com/pauti04/netpulse — methodology in BENCHMARK.md
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

const Cm = ({ children }: { children: React.ReactNode }) => (
  <span className="italic text-muted">{children}</span>
);
const Kw = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold text-ink">{children}</span>
);

const H2 = "mt-10 text-xl font-bold tracking-tight text-ink";
const P = "text-[0.95rem] leading-[1.75] text-ink-soft";

export default function Post() {
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
        <Link
          href="/writing"
          className="text-muted underline decoration-line underline-offset-4 hover:text-ink-soft hover:decoration-current"
        >
          writing
        </Link>
      </nav>

      <header className="pt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
          <p className="smallcaps text-muted">Working notes · NetPulse · No. 01</p>
          <p className="mono text-xs text-muted">
            <time dateTime="2026-05-12">2026-05-12</time> · 5 min read
          </p>
        </div>
        <h1 className="mt-4 max-w-[24ch] text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          How a patricia trie made RPKI validation 500× faster.
        </h1>
        <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-ink-soft">
          The single change that took NetPulse from &ldquo;offline batch tool&rdquo; to &ldquo;live
          stream detector.&rdquo;
        </p>
      </header>

      <hr className="mt-10 border-line" aria-hidden="true" />

      <article className="mt-10 space-y-5">
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

        <div>
          <div className="mb-2.5 flex flex-wrap items-center gap-3">
            <span className="smallcaps text-muted">Measured</span>
            <span className="provenance" data-mode="recorded">
              recorded · BENCHMARK.md
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="mono w-full border-collapse text-left text-xs">
              <tbody>
                <tr className="border-t border-line">
                  <td className="whitespace-nowrap py-1.5 pr-4 align-top text-ink">43.2 ms / call</td>
                  <td className="py-1.5 pr-4 align-top text-ink-soft">linear scan</td>
                  <td className="py-1.5 align-top text-muted">the first cut</td>
                </tr>
                <tr className="border-t border-line">
                  <td className="whitespace-nowrap py-1.5 pr-4 align-top text-ink">86 µs / call</td>
                  <td className="py-1.5 pr-4 align-top text-ink-soft">patricia trie</td>
                  <td className="py-1.5 align-top text-muted">amortized, post warm-up</td>
                </tr>
                <tr className="border-y border-line">
                  <td className="whitespace-nowrap py-1.5 pr-4 align-top text-ink">43 µs / call</td>
                  <td className="py-1.5 pr-4 align-top text-ink-soft">after rust ext</td>
                  <td className="py-1.5 align-top text-muted">with native bitmap ops</td>
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

        <ol className="ml-5 list-decimal space-y-3 text-[0.95rem] leading-[1.7] text-ink-soft marker:text-muted">
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

        <hr className="border-line" aria-hidden="true" />

        <p className="text-sm leading-relaxed text-muted">
          The detector is open source at{" "}
          <a
            href="https://github.com/pauti04/netpulse"
            className="text-ink-soft underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current"
          >
            github.com/pauti04/netpulse
          </a>
          . The benchmark methodology is documented in{" "}
          <span className="mono text-[0.85em] text-ink-soft">BENCHMARK.md</span> in the repo —
          happy to walk through it if you&apos;re curious.
        </p>
      </article>

      <footer className="mono mt-16 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-t border-line pt-6 text-xs">
        <Link
          href="/writing"
          className="underline decoration-line underline-offset-4 hover:decoration-current"
        >
          ← all writing
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
