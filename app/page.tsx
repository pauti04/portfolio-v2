// ----------------------------------------------------------------------------
// NINE THOUSAND MILES — the whole journey, on one line.
//
// Pune → 362 mi → Manipal → 8,720 mi → Charlotte, and the things he built
// getting harder the further he went. The eight demos still run; they are
// planted where and when they were made.
//
// Every fact on this page comes from lib/journey.ts (which reads app/cv/
// resume.ts), lib/claims.ts, or lib/verification.json. Nothing is authored
// here except the connective tissue between them.
// ----------------------------------------------------------------------------

import Link from "next/link";

import Colophon from "@/components/Colophon";
import RunAllProvider from "@/components/RunAllProvider";
import StatusStrip from "@/components/StatusStrip";
import Chapter from "@/components/journey/Chapter";
import DistanceMarker from "@/components/journey/DistanceMarker";
import Enter from "@/components/journey/Enter";
import ProjectStop from "@/components/journey/ProjectStop";
import RouteMasthead from "@/components/journey/RouteMasthead";
import RouteSpine from "@/components/journey/RouteSpine";
import RunAll from "@/components/journey/RunAll";

import ReflightCheck from "@/components/checks/reflight";
import BourseCheck from "@/components/checks/bourse";
import NetPulseCheck from "@/components/checks/netpulse";
import CostDNACheck from "@/components/checks/costdna";
import DispatchCheck from "@/components/checks/dispatch";
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
//
// Natural height, not a forced viewport: the fold ends where the words end,
// and the work begins one section-gap later on every screen.
// ---------------------------------------------------------------------------

function Opening() {
  return (
    <header className="pt-24 sm:pt-32">
      <p className="eyebrow">Software engineer, systems and ML</p>

      <h1 className="city-type mt-6 text-[clamp(3.25rem,12vw,9rem)]">
        {CONTACT.name}
      </h1>

      <p className="mt-8 max-w-[26ch] text-[clamp(1.375rem,4.4vw,2.125rem)] leading-[1.22] text-ink">
        <span className="text-route">Eight systems</span> that run, and every
        one of them runs right here.
      </p>

      {/* the route, drawn: the same three nodes the social card carries */}
      <RouteMasthead className="mt-8" />

      {/* the receipt for that sentence — same data the Arrival reads */}
      <div className="mt-5">
        <StatusStrip />
      </div>

      <p className="mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-ink-soft">
        Most of my work is AI agent reliability and applied ML. There is a
        flight recorder for agents here, a matching engine, and a detector on
        the live global BGP feed. Each runs live where it can and from a
        labelled recording where it can&apos;t.
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

      <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 sm:mt-14">
        <a
          className="group mono inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-[0.8125rem] text-ink transition-[border-color,background-color,transform] duration-150 hover:border-ink-soft active:translate-y-px active:bg-panel"
          href="#work"
        >
          Start with the work{" "}
          <span
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:translate-y-0.5"
          >
            ↓
          </span>
        </a>
        <a
          className="quiet-link mono text-[0.8125rem] tracking-[0.14em] text-muted"
          href="#journey"
        >
          <span aria-hidden="true">{JOURNEY.route}</span>
          <span className="sr-only">{JOURNEY.routeSpoken}</span>
        </a>
      </div>
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
        <div className="sect-head mt-6">
          <span aria-hidden="true" className="sect-index">03</span>
          <h2
            id="arrival-title"
            className="city-type min-w-0 text-[clamp(2.75rem,10vw,5.5rem)]"
          >
            December 2026
          </h2>
          <span aria-hidden="true" className="sect-rule" />
        </div>
        <div aria-hidden="true" className="ticks mt-3" />
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
          I graduate from UNC Charlotte then, and I&apos;m looking for the next place
          to build things and measure them.
        </p>
      </Enter>

      <Enter delay={0.06} className="mt-12 sm:mt-14">
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

      <Enter delay={0.1} className="mt-12 sm:mt-14">
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

      <Enter delay={0.14} className="mt-12 sm:mt-14">
        <h3 className="eyebrow">Every demo above runs</h3>
        <p className="mt-5 max-w-[56ch] text-[0.9375rem] leading-relaxed text-ink-soft">
          Every figure on this page was checked when the site was built, before
          you touched anything. Run the demos yourself and those build numbers
          are replaced with ones from your own machine.
        </p>
        <div className="mt-6">
          <RunAll />
        </div>
      </Enter>

      <Enter delay={0.18} variant="fade" className="mt-12 border-t border-rule pt-8 sm:mt-14">
        <p className="max-w-[64ch] text-[0.875rem] leading-relaxed text-muted">
          <span className="text-ink-soft">What this page does not claim:</span>{" "}
          {DOES_NOT_CLAIM[0]} {DOES_NOT_CLAIM[1]} {DOES_NOT_CLAIM[3]}
        </p>
        <p className="mono mt-8 text-[0.75rem] tracking-[0.16em] text-muted uppercase">
          Built and verified {builtStamp}.{" "}
          {JOURNEY.distanceNote}
        </p>
      </Enter>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The work — the bulk of the page. Flagship first, weakest last, each one
// running. No route line here; these stand on their own.
// ---------------------------------------------------------------------------

function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="scroll-mt-16 pt-24 sm:pt-32"
    >
      <p className="eyebrow">The work</p>
      <div className="sect-head mt-4">
        <span aria-hidden="true" className="sect-index">01</span>
        <h2
          id="work-title"
          className="city-type min-w-0 text-[clamp(2.25rem,7vw,4rem)]"
        >
          Eight systems
        </h2>
        <span aria-hidden="true" className="sect-rule" />
      </div>
      <div aria-hidden="true" className="ticks mt-3" />
      <p className="mt-6 max-w-[58ch] text-[1.0625rem] leading-relaxed text-ink-soft">
        Every one of them executes on this page. The figures below were measured
        when the site was built. Press <span className="text-ink">run it</span> on
        any of them and they&apos;re replaced by numbers from your own machine.
      </p>

      <ProjectStop slug="reflight" onRail={false}>
        <ReflightCheck />
      </ProjectStop>

      <ProjectStop slug="chaincheck" onRail={false}>
        <ChainCheckCheck />
      </ProjectStop>
      <ProjectStop slug="chaincheck-action" variant="companion">
        <ChainCheckActionCheck />
      </ProjectStop>

      <ProjectStop slug="bourse" onRail={false}>
        <BourseCheck />
      </ProjectStop>

      <ProjectStop slug="netpulse" onRail={false}>
        <NetPulseCheck />
      </ProjectStop>

      <ProjectStop slug="costdna" onRail={false}>
        <CostDNACheck />
      </ProjectStop>

      <ProjectStop slug="dispatch" onRail={false}>
        <DispatchCheck />
      </ProjectStop>

      <ProjectStop slug="rasoibot" onRail={false}>
        <RasoiBotCheck />
      </ProjectStop>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The road here — one section, self-contained. The route line lives only
// inside it: Pune → 362 mi → Manipal → 8,720 mi → Charlotte.
// ---------------------------------------------------------------------------

function Journey() {
  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="relative scroll-mt-16 pt-24 sm:pt-32"
      style={{
        marginLeft: "calc(var(--content-x) * -1)",
        paddingLeft: "var(--content-x)",
      }}
    >
      <RouteSpine />

      <p className="eyebrow">
        <span aria-hidden="true">{JOURNEY.route}</span>
        <span className="sr-only">{JOURNEY.routeSpoken}</span>
      </p>
      <div className="sect-head mt-4">
        <span aria-hidden="true" className="sect-index">02</span>
        <h2
          id="journey-title"
          className="city-type min-w-0 text-[clamp(2.25rem,7vw,4rem)]"
        >
          The road here
        </h2>
        <span aria-hidden="true" className="sect-rule" />
      </div>
      <div aria-hidden="true" className="ticks mt-3" />
      <p className="mt-6 max-w-[56ch] text-[1.0625rem] leading-relaxed text-ink-soft">
        Three cities and <span className="text-route">9,083 miles</span>, in the
        order they happened.
      </p>

      <Chapter chapter={pune} />
      <DistanceMarker leg={LEGS[0]} />
      <Chapter chapter={manipal} />
      <DistanceMarker leg={LEGS[1]} />
      <Chapter chapter={charlotte} />
    </section>
  );
}

export default function Home() {
  return (
    <RunAllProvider>
      <main className="relative mx-auto w-full max-w-[var(--page-max)] pr-5 pl-[var(--content-x)] sm:pr-10 lg:pr-16">
        <Opening />
        <Work />
        <Journey />
        <Arrival />
      </main>
      <Colophon />
    </RunAllProvider>
  );
}
