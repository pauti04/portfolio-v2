// ----------------------------------------------------------------------------
// NINE THOUSAND MILES — the whole journey, on one line.
//
// Pune → 362 mi → Manipal → 8,720 mi → Charlotte, and the things he built
// getting harder the further he went. The seven demos still run; they are
// planted where and when they were made.
//
// Every fact on this page comes from lib/journey.ts (which reads app/cv/
// resume.ts), lib/claims.ts, or lib/verification.json. Nothing is authored
// here except the connective tissue between them.
// ----------------------------------------------------------------------------

import Link from "next/link";

import RunAllProvider from "@/components/RunAllProvider";
import Chapter from "@/components/journey/Chapter";
import DistanceMarker from "@/components/journey/DistanceMarker";
import Enter from "@/components/journey/Enter";
import ProjectStop from "@/components/journey/ProjectStop";
import RouteSpine from "@/components/journey/RouteSpine";
import RunAll from "@/components/journey/RunAll";

import ReflightCheck from "@/components/checks/reflight";
import BourseCheck from "@/components/checks/bourse";
import NetPulseCheck from "@/components/checks/netpulse";
import CostDNACheck from "@/components/checks/costdna";
import ChainCheckCheck from "@/components/checks/chaincheck";
import ChainCheckActionCheck from "@/components/checks/chaincheck-action";
import RasoiBotCheck from "@/components/checks/rasoibot";

import { CONTACT, DOES_NOT_CLAIM } from "@/lib/claims";
import { JOURNEY, LEGS, chapterById } from "@/lib/journey";
import { CONTACT as CV_CONTACT, LOOKING_FOR } from "@/app/cv/resume";
import verification from "@/lib/verification.json";

const builtAt = (verification as { builtAt: string }).builtAt;
const builtStamp = `${builtAt.replace("T", " ").slice(0, 16)} UTC`;

const pune = chapterById("pune");
const manipal = chapterById("manipal");
const charlotte = chapterById("charlotte");

// ---------------------------------------------------------------------------
// Opening — name, one sentence, the route, and the availability answer, all
// present in the markup before a single frame of animation runs.
// ---------------------------------------------------------------------------

function Opening() {
  return (
    <header className="flex min-h-[100svh] flex-col justify-center py-20">
      <p className="eyebrow">
        <span aria-hidden="true">{JOURNEY.route}</span>
        <span className="sr-only">{JOURNEY.routeSpoken}</span>
      </p>

      <h1 className="city-type mt-6 text-[clamp(3.25rem,12vw,9rem)]">
        {CONTACT.name}
      </h1>

      <p className="mt-8 max-w-[26ch] text-[clamp(1.375rem,4.4vw,2.125rem)] leading-[1.22] text-ink">
        Pune to Manipal to Charlotte.{" "}
        <span className="text-route">9,083 miles</span>, three cities, seven
        systems that run.
      </p>

      <p className="mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-ink-soft">
        Software engineer — AI agent reliability and applied ML. Every system
        below runs on this page: live where it can, from a labelled recording
        where it cannot.
      </p>

      <p className="mono mt-9 max-w-[46ch] text-[0.8125rem] leading-relaxed text-ink-soft">
        {CONTACT.monoLine}
      </p>

      <nav
        aria-label="contact and elsewhere"
        className="mono mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 text-[0.8125rem]"
      >
        <a className="quiet-link" href={`mailto:${CONTACT.email}`}>
          {CONTACT.email}
        </a>
        <a className="quiet-link" href={CONTACT.github}>
          github.com/pauti04
        </a>
        <Link className="quiet-link" href="/cv">
          cv
        </Link>
        <Link className="quiet-link" href="/writing">
          writing
        </Link>
      </nav>

      <p className="mono mt-14 text-[0.8125rem] tracking-[0.14em] text-muted">
        <a className="quiet-link text-muted" href="#chapter-pune">
          Follow the line <span aria-hidden="true">↓</span>
        </a>
      </p>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Arrival — December 2026, what he wants, how to reach him, one honest note.
// ---------------------------------------------------------------------------

function Arrival() {
  return (
    <section
      id="arrival"
      aria-labelledby="arrival-title"
      className="scroll-mt-16 border-t border-rule py-24 sm:py-32"
    >
      <Enter className="on-rail on-rail-marker" style={{ "--node-top": "0.1rem" }}>
        <p className="eyebrow">Arrival</p>
        <h2
          id="arrival-title"
          className="city-type mt-6 text-[clamp(2.75rem,10vw,5.5rem)]"
        >
          December 2026
        </h2>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
          Graduating from UNC Charlotte, and looking for the next place to build
          things and measure them.
        </p>
      </Enter>

      <Enter delay={0.06} className="mt-14">
        <h3 className="eyebrow">Looking for</h3>
        <ul className="mt-6 max-w-[62ch] space-y-3">
          {LOOKING_FOR.map((line) => (
            <li key={line} className="flex gap-3 text-[1rem] leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-[0.62em] h-px w-4 flex-none bg-rule" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Enter>

      <Enter delay={0.1} className="mt-14">
        <h3 className="eyebrow">Get in touch</h3>
        <div className="mt-6 flex flex-col gap-4">
          <a
            className="quiet-link city-type text-[clamp(1.5rem,5vw,2.5rem)]"
            href={`mailto:${CONTACT.email}`}
          >
            {CONTACT.email}
          </a>
          <a
            className="quiet-link city-type text-[clamp(1.5rem,5vw,2.5rem)]"
            href={CONTACT.github}
          >
            github.com/pauti04
          </a>
        </div>
        <p className="mono mt-6 text-[0.8125rem] text-muted">
          {CV_CONTACT.location}
          <span aria-hidden="true"> · </span>
          <Link className="quiet-link text-muted" href="/cv">
            full cv
          </Link>
          <span aria-hidden="true"> · </span>
          <Link className="quiet-link text-muted" href="/writing">
            writing
          </Link>
        </p>
      </Enter>

      <Enter delay={0.14} className="mt-16">
        <h3 className="eyebrow">Every demo above runs</h3>
        <p className="mt-5 max-w-[56ch] text-[0.9375rem] leading-relaxed text-ink-soft">
          The page is pre-verified at build time, so it is honest before you
          touch it. Running them yourself replaces the build numbers with your
          own.
        </p>
        <div className="mt-6">
          <RunAll />
        </div>
      </Enter>

      <Enter delay={0.18} variant="fade" className="mt-16 border-t border-rule pt-8">
        <p className="max-w-[64ch] text-[0.875rem] leading-relaxed text-muted">
          <span className="text-ink-soft">What this page does not claim:</span>{" "}
          {DOES_NOT_CLAIM[0]} {DOES_NOT_CLAIM[1]} {DOES_NOT_CLAIM[3]}
        </p>
        <p className="mono mt-8 text-[0.75rem] tracking-[0.16em] text-muted uppercase">
          Built and verified {builtStamp}
          <span aria-hidden="true"> · </span>
          {JOURNEY.distanceNote}
        </p>
      </Enter>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The journey
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <RunAllProvider>
      <main className="relative mx-auto w-full max-w-[var(--page-max)] pr-5 pb-8 pl-[var(--content-x)] sm:pr-10 lg:pr-16">
        <RouteSpine />

        <Opening />

        {/* ------------------------------------------------ chapter one */}
        <Chapter chapter={pune} />

        {/* 362 miles */}
        <DistanceMarker leg={LEGS[0]} />

        {/* ------------------------------------------------ chapter two */}
        <Chapter chapter={manipal}>
          <ProjectStop slug="rasoibot">
            <RasoiBotCheck />
          </ProjectStop>
        </Chapter>

        {/* 8,720 miles — the big one */}
        <DistanceMarker leg={LEGS[1]} />

        {/* ---------------------------------------------- chapter three */}
        <Chapter chapter={charlotte}>
          <div>
            <ProjectStop slug="chaincheck">
              <ChainCheckCheck />
            </ProjectStop>
            <ProjectStop slug="chaincheck-action" variant="companion">
              <ChainCheckActionCheck />
            </ProjectStop>
          </div>

          <ProjectStop slug="costdna">
            <CostDNACheck />
          </ProjectStop>

          <ProjectStop slug="netpulse">
            <NetPulseCheck />
          </ProjectStop>

          <ProjectStop slug="bourse">
            <BourseCheck />
          </ProjectStop>

          <ProjectStop slug="reflight">
            <ReflightCheck />
          </ProjectStop>
        </Chapter>

        <Arrival />
      </main>
    </RunAllProvider>
  );
}
