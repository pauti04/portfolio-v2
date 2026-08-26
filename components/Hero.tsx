// ----------------------------------------------------------------------------
// Title sequence — the approved artboard, responsive. Server-rendered; the
// 60-second recruiter answer (name, what, when, links) is in the markup
// before any JS runs. All motion is CSS entrance/loop animation, killed
// globally under prefers-reduced-motion.
// ----------------------------------------------------------------------------

import { CONTACT } from "@/lib/claims";

const EASE = "cubic-bezier(0.22,1,0.36,1)";

type StarringPanel = {
  label: string;
  labelClass: string;
  line: string;
  float: string;
  tilt: string;
  delay: string;
};

const PANELS: StarringPanel[] = [
  {
    label: "REFLIGHT",
    labelClass: "text-accent-violet",
    line: "A flight recorder for AI agents — replay any run, byte-identical",
    float: "float-a 9s ease-in-out infinite",
    tilt: "rotate-[-2.5deg]",
    delay: "1.35s",
  },
  {
    label: "BOURSE",
    labelClass: "text-accent-cyan",
    line: "A Rust order book, matching live in this tab",
    float: "float-b 11s ease-in-out 0.8s infinite",
    tilt: "rotate-[1.5deg]",
    delay: "1.5s",
  },
  {
    label: "NETPULSE",
    labelClass: "text-accent-teal",
    line: "Listening to the live global BGP feed",
    float: "float-c 10s ease-in-out 1.6s infinite",
    tilt: "rotate-[-1deg]",
    delay: "1.65s",
  },
];

function PanelFooter({ label }: { label: string }) {
  if (label === "BOURSE") {
    return (
      <div aria-hidden="true" className="mt-3.5 flex h-8 items-end gap-1.5">
        {[
          ["45%", "#4ade80"],
          ["80%", "#4ade80"],
          ["58%", "#4ade80"],
          ["92%", "#f87171"],
          ["64%", "#f87171"],
          ["40%", "#f87171"],
        ].map(([h, c], i) => (
          <div
            key={i}
            className="w-2 rounded-[2px]"
            style={{ height: h, background: c }}
          />
        ))}
      </div>
    );
  }
  if (label === "NETPULSE") {
    return (
      <div className="mono mt-3.5 text-[0.6875rem] text-ink-soft">
        149,246 msgs / 70 s · ris-live · recorded
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className="mt-3.5 h-1 rounded-sm"
      style={{ background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)" }}
    />
  );
}

export default function Hero() {
  return (
    <header className="relative flex min-h-svh flex-col overflow-hidden">
      {/* scenography: spotlight beam + aurora depth */}
      <div aria-hidden="true" className="stage-beam" />
      <div
        aria-hidden="true"
        className="aurora-blob aurora-violet -bottom-[300px] -left-[220px] h-[820px] w-[820px]"
      />
      <div
        aria-hidden="true"
        className="aurora-blob aurora-cyan -bottom-[340px] -right-[200px] h-[860px] w-[860px]"
      />

      {/* top bar: overline credit + minimal nav */}
      <div className="relative z-10 flex flex-col gap-6 px-6 pt-8 sm:px-12 lg:px-18">
        <nav
          aria-label="primary"
          className="mono flex justify-end gap-x-6 text-xs tracking-[0.18em] uppercase"
          style={{ animation: `dim-in 1.2s ease 0.1s both` }}
        >
          <a href={CONTACT.github} className="text-ink-soft hover:text-ink">
            github
          </a>
          <a href="/writing" className="text-ink-soft hover:text-ink">
            writing
          </a>
          <a href={CONTACT.resumeHref} className="text-ink-soft hover:text-ink">
            resume
          </a>
        </nav>
        <p
          className="credit-line text-center"
          style={{ animation: "dim-in 1.4s ease 0.2s both" }}
        >
          A&nbsp;portfolio&nbsp;in&nbsp;seven&nbsp;working&nbsp;systems
        </p>
      </div>

      {/* the name */}
      <div className="relative z-10 mt-10 px-4 text-center sm:mt-12">
        <h1
          className="scene-title name-sweep mx-auto text-[clamp(3.5rem,12vw,11rem)]"
        >
          Parth&nbsp;Auti
        </h1>
        <p
          className="mt-4 text-[1.0625rem] tracking-[0.04em] text-ink-soft"
          style={{ animation: "dim-in 1.2s ease 1s both" }}
        >
          builds systems and measures them
        </p>
      </div>

      {/* STARRING row */}
      <div className="relative z-10 mt-12 flex-1 sm:mt-14">
        <p
          className="credit-line text-center tracking-[0.38em]"
          style={{ animation: "dim-in 1.2s ease 1.2s both" }}
        >
          Starring
        </p>
        <div className="mx-auto mt-10 flex w-full max-w-[1180px] flex-col items-center justify-center gap-8 px-6 lg:flex-row lg:items-stretch lg:gap-9">
          {PANELS.map((p) => (
            <div
              key={p.label}
              className={`glass-panel w-full max-w-[340px] px-7 py-6 ${p.tilt}`}
              style={{
                animation: `${p.float}, lift 1s ${EASE} ${p.delay} both`,
              }}
            >
              <div
                className={`mono text-[0.6875rem] tracking-[0.2em] ${p.labelClass}`}
              >
                {p.label}
              </div>
              <div className="mt-2.5 text-[1.03rem] font-medium leading-[1.45] text-ink">
                {p.line}
              </div>
              <PanelFooter label={p.label} />
            </div>
          ))}
        </div>
      </div>

      {/* bottom credits bar */}
      <div
        className="relative z-10 mx-6 mt-14 mb-11 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-rule pt-5 sm:mx-12 lg:mx-18"
        style={{ animation: "dim-in 1.2s ease 1.9s both" }}
      >
        <span className="credit-line tracking-[0.24em]">
          New-grad&nbsp;SWE&nbsp;/&nbsp;ML-infra&nbsp;&nbsp;·&nbsp;&nbsp;premieres&nbsp;Dec&nbsp;2026
        </span>
        <a
          href="#scenes"
          className="credit-line inline-flex items-center gap-2.5 tracking-[0.24em] text-ink hover:text-white"
        >
          Enter
          <svg
            aria-hidden="true"
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M8 3v10M4 9l4 4 4-4" />
          </svg>
        </a>
      </div>
    </header>
  );
}
