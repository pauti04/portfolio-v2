import RunAllProvider from "@/components/RunAllProvider";
import StatusStrip from "@/components/StatusStrip";
import ClaimCard from "@/components/ClaimCard";
import Colophon from "@/components/Colophon";
import ReflightCheck from "@/components/checks/reflight";
import BourseCheck from "@/components/checks/bourse";
import NetPulseCheck from "@/components/checks/netpulse";
import CostDNACheck from "@/components/checks/costdna";
import ChainCheckCheck from "@/components/checks/chaincheck";
import ChainCheckActionCheck from "@/components/checks/chaincheck-action";
import RasoiBotCheck from "@/components/checks/rasoibot";
import {
  CLAIMS,
  CONTACT,
  DOES_NOT_CLAIM,
  WRITING,
  WRITING_CLAIM,
  type CheckSlug,
} from "@/lib/claims";
import type { ComponentType } from "react";

const CHECK_BODY: Record<CheckSlug, ComponentType> = {
  reflight: ReflightCheck,
  bourse: BourseCheck,
  netpulse: NetPulseCheck,
  costdna: CostDNACheck,
  chaincheck: ChainCheckCheck,
  "chaincheck-action": ChainCheckActionCheck,
  rasoibot: RasoiBotCheck,
};

export default function Home() {
  return (
    <RunAllProvider>
      <main className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        {/* ------------------------------------------------ viewport 1 */}
        <header className="flex min-h-[78svh] flex-col justify-between pt-16 sm:pt-24">
          <div>
            <p className="smallcaps text-muted">{CONTACT.smallcaps}</p>
            <h1 className="mt-6 max-w-[16ch] text-4xl font-bold tracking-tight text-ink sm:text-5xl md:text-6xl">
              {CONTACT.headline}
            </h1>
            <p className="mono mt-6 text-xs text-ink-soft sm:text-sm">{CONTACT.monoLine}</p>
            <nav aria-label="contact" className="mono mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <a
                href={CONTACT.github}
                className="underline decoration-line underline-offset-4 hover:decoration-current"
              >
                GitHub
              </a>
              <a
                href={CONTACT.resumeHref}
                className="underline decoration-line underline-offset-4 hover:decoration-current"
              >
                Resume
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="underline decoration-line underline-offset-4 hover:decoration-current"
              >
                {CONTACT.email}
              </a>
            </nav>
          </div>
          <div className="pb-6 pt-12">
            <StatusStrip />
          </div>
        </header>

        {/* ------------------------------------------------ claims ledger */}
        <section aria-label="claims ledger" className="pt-6">
          <h2 className="sr-only">Claims</h2>
          {CLAIMS.filter((c) => c.size !== "sm").map((claim) => {
            const Body = CHECK_BODY[claim.slug];
            return (
              <ClaimCard key={claim.id} claim={claim}>
                <Body />
              </ClaimCard>
            );
          })}
          {/* the two smallest cards share a row on wide screens */}
          <div className="grid lg:grid-cols-2 lg:gap-x-10">
            {CLAIMS.filter((c) => c.size === "sm").map((claim) => {
              const Body = CHECK_BODY[claim.slug];
              return (
                <ClaimCard key={claim.id} claim={claim}>
                  <Body />
                </ClaimCard>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------ writing */}
        <section aria-labelledby="writing-heading" className="border-t border-line py-12">
          <h2 id="writing-heading" className="smallcaps text-muted">
            Writing
          </h2>
          <p className="mt-4 max-w-[40ch] text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {WRITING_CLAIM}
          </p>
          <ul className="mt-8 space-y-8">
            {WRITING.map((post) => (
              <li key={post.slug} className="max-w-2xl">
                <h3 className="text-base font-semibold text-ink">{post.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{post.summary}</p>
                <p className="mono mt-2 text-xs text-muted">
                  <time dateTime={post.date}>{post.date}</time> ·{" "}
                  <a
                    href={post.href}
                    className="underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current"
                  >
                    read it ({post.minutes} min)
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------ footer */}
        <footer className="border-t border-line py-12">
          <section aria-labelledby="not-claimed-heading">
            <h2 id="not-claimed-heading" className="smallcaps text-muted">
              What this site does not claim
            </h2>
            <ul className="mt-4 max-w-2xl space-y-2">
              {DOES_NOT_CLAIM.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <span aria-hidden="true" className="mono text-muted">
                    —
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <p className="mono mt-10 text-xs text-ink-soft">
            {CONTACT.monoLine} ·{" "}
            <a
              href={`mailto:${CONTACT.email}`}
              className="underline decoration-line underline-offset-4 hover:decoration-current"
            >
              {CONTACT.email}
            </a>
          </p>

          <div className="mt-10 border-t border-line pt-8">
            <Colophon />
          </div>
        </footer>
      </main>
    </RunAllProvider>
  );
}
