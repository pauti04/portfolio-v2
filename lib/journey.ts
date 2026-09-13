// ----------------------------------------------------------------------------
// THE ROUTE — the single source for the arc of the page.
//
// Pune (2023) → Manipal (Aug 2023 – May 2025, 362 mi) → Charlotte (Aug 2025 →,
// 8,720 mi further; 9,083 mi travelled). Three chapters, the life facts that
// happened in each, and the project slugs built there.
//
// FACT POLICY — nothing is invented in this file.
//   · life facts come from app/cv/resume.ts (EDUCATION / EXPERIENCE / AWARDS)
//   · project facts and numbers come from lib/claims.ts
//   · the four facts that live only in BUILD_BRIEF.md are marked `// BRIEF`
//   · distances are the great-circle figures given in BUILD_BRIEF.md
// ----------------------------------------------------------------------------

import { CHECK_SLUGS, claimBySlug, type CheckSlug, type EvidenceRow } from "@/lib/claims";
import { AWARDS, EDUCATION, EXPERIENCE, PROJECTS } from "@/app/cv/resume";

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2023-08" → "Aug 2023". Anything else passes through. */
export function fmtMonth(s: string): string {
  if (!s) return s;
  if (s.startsWith("Expected")) return s.replace(/^Expected\s+/, "");
  if (s === "Present") return "present";
  const [y, m] = s.split("-");
  if (!y || !m) return s;
  const name = MONTHS[parseInt(m, 10) - 1];
  return name ? `${name} ${y}` : s;
}

const span = (start: string, end: string) => `${fmtMonth(start)} – ${fmtMonth(end)}`;

// ---------------------------------------------------------------------------
// Lookups into the audited records. A missing record is a build-time bug, not
// a runtime branch — the `!` is deliberate, same convention as claimBySlug.
// ---------------------------------------------------------------------------

const school = (needle: string) => EDUCATION.find((e) => e.school.includes(needle))!;
const job = (needle: string) => EXPERIENCE.find((x) => x.company.includes(needle))!;
const award = (needle: string) => AWARDS.find((a) => a.name.includes(needle))!;

const mahe = school("Manipal");
const uncc = school("North Carolina");
const charmlab = job("CharmLab");
const tinfo = job("T-Infosystem");
const starbucks = job("Starbucks");
const av = EXPERIENCE.find((x) => x.role === "AV Technician")!;
const jee = award("JEE Advanced");
const sih = award("Smart India Hackathon");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MilestoneKind = "study" | "award" | "research" | "work";

export type Milestone = {
  id: string;
  kind: MilestoneKind;
  /** mono date range, already formatted */
  when: string;
  title: string;
  /** one line, plain */
  detail: string;
  /** optional second line, quieter */
  note?: string;
};

export type ProjectStopSpec = {
  slug: CheckSlug;
  /** Shown inside the same stop — same core, different surface. */
  companions?: CheckSlug[];
};

export type Chapter = {
  id: string;
  /** "One" | "Two" | "Three" */
  ordinal: string;
  city: string;
  region: string;
  /** display date range for the chapter opener */
  dates: string;
  /** mono distance marker printed under the city */
  marker: string;
  /** one short, non-claiming line */
  standfirst: string;
  milestones: Milestone[];
  /** built here, in the order they were built */
  projects: ProjectStopSpec[];
};

export type Leg = {
  id: string;
  from: string;
  to: string;
  miles: number;
  /** the dry line that sits under the number */
  note: string;
  /** the Manipal → Charlotte move gets the room */
  major: boolean;
};

// ---------------------------------------------------------------------------
// The route
// ---------------------------------------------------------------------------

export const JOURNEY = {
  totalMiles: 9083,
  cities: 3,
  systems: CHECK_SLUGS.length,
  route: "Pune → Manipal → Charlotte",
  /** the same route without arrow glyphs, for assistive technology */
  routeSpoken: "Pune to Manipal to Charlotte",
  spine: "Pune to Manipal to Charlotte. 9,083 miles, three cities, eight systems that run.",
  distanceNote: "Great-circle distances, city to city.",
} as const;

export const CHAPTERS: Chapter[] = [
  {
    id: "pune",
    ordinal: "One",
    city: "Pune",
    region: "Maharashtra, India",
    dates: "2023",
    marker: "mile zero",
    standfirst: "Where the route starts.",
    milestones: [
      {
        id: "jee",
        kind: "award",
        when: jee.year,
        title: "JEE Advanced — qualified",
        detail: jee.note!,
      },
    ],
    projects: [],
  },
  {
    id: "manipal",
    ordinal: "Two",
    city: "Manipal",
    region: "Karnataka, India",
    dates: span(mahe.start, mahe.end),
    marker: "362 miles from home",
    standfirst: "Three hundred and sixty-two miles from home, for two years.",
    milestones: [
      {
        id: "mahe",
        kind: "study",
        when: span(mahe.start, mahe.end),
        title: mahe.school,
        detail: `Computer Science, GPA ${mahe.gpa}`,
      },
      {
        id: "sih",
        kind: "award",
        when: sih.year,
        title: "Smart India Hackathon 2024 — 3rd place",
        detail: sih.note!,
        note: "The first real project was already built for someone who needed it.",
      },
      {
        id: "medical-imaging",
        kind: "research",
        when: "2024 – 2025",
        title: "Undergraduate research — ML for medical imaging",
        // BRIEF: multiclass brain-tumor classification on MRI; PyTorch / scikit-learn baselines.
        detail:
          "Multiclass brain-tumor classification on MRI, with baselines in PyTorch and scikit-learn.",
      },
      {
        id: "it-support",
        kind: "work",
        when: span(mahe.start, mahe.end),
        title: "IT Support Assistant",
        // BRIEF: 500+ tier-1/2 helpdesk tickets.
        detail: "500+ tier-1 and tier-2 helpdesk tickets.",
      },
    ],
    projects: [{ slug: "rasoibot" }],
  },
  {
    id: "charlotte",
    ordinal: "Three",
    city: "Charlotte",
    region: "North Carolina, USA",
    dates: `${fmtMonth(uncc.start)} – present`,
    marker: "8,720 miles further, 9,083 travelled",
    standfirst: "Eight thousand seven hundred and twenty miles further. The work got harder here.",
    milestones: [
      {
        id: "uncc",
        kind: "study",
        when: span(uncc.start, uncc.end),
        title: uncc.school,
        detail: `${uncc.degree}, GPA ${uncc.gpa}, graduating December 2026`,
        note: uncc.honors,
      },
      {
        id: "starbucks",
        kind: "work",
        when: span(starbucks.start, starbucks.end),
        title: `${starbucks.company} — barista, then barista trainer`,
        detail: starbucks.bullets[0],
        note: starbucks.bullets[1],
      },
      {
        id: "tinfosystem",
        kind: "work",
        when: span(tinfo.start, tinfo.end),
        title: `${tinfo.company} — ${tinfo.role}`,
        detail: tinfo.bullets[0],
        note: tinfo.bullets[2],
      },
      {
        id: "charmlab",
        kind: "research",
        when: span(charmlab.start, charmlab.end),
        title: `${charmlab.company} — ${charmlab.role}`,
        detail: "LLM-judge failure modes, advised by Prof. Minwoo Lee.",
        note: charmlab.bullets[1],
      },
      {
        id: "av",
        kind: "work",
        when: span(av.start, av.end),
        title: `${av.company} — ${av.role}`,
        detail: av.bullets[0],
      },
    ],
    // Ascending difficulty, as built. ChainCheck carries its GitHub Action.
    projects: [
      { slug: "chaincheck", companions: ["chaincheck-action"] },
      { slug: "costdna" },
      { slug: "netpulse" },
      { slug: "bourse" },
      { slug: "reflight" },
    ],
  },
];

export const LEGS: Leg[] = [
  {
    id: "pune-manipal",
    from: "Pune, Maharashtra",
    to: "Manipal, Karnataka",
    miles: 362,
    note: "The first move. Same country, different state, two years.",
    major: false,
  },
  {
    id: "manipal-charlotte",
    from: "Manipal, Karnataka",
    to: "Charlotte, North Carolina",
    miles: 8720,
    note: "Two years in, transferred. Everything after this line was built on the other side of it.",
    major: true,
  },
];

export const chapterById = (id: string): Chapter => CHAPTERS.find((c) => c.id === id)!;

// ---------------------------------------------------------------------------
// Project facts — thin readers over lib/claims.ts / resume.ts. No duplication.
// ---------------------------------------------------------------------------

/** One line on what the thing is. Prefers the CV tagline, falls back to the claim. */
export function taglineFor(slug: CheckSlug): string {
  const claim = claimBySlug(slug);
  return PROJECTS.find((p) => p.name === claim.name)?.tagline ?? claim.claim;
}

/** The headline numbers for a stop — the top rows of the audited evidence table. */
export function headlineEvidence(slug: CheckSlug, count = 3): EvidenceRow[] {
  return claimBySlug(slug).evidence.slice(0, count);
}

/** Every slug planted somewhere on the route, in route order. */
export const ROUTE_SLUGS: CheckSlug[] = CHAPTERS.flatMap((c) =>
  c.projects.flatMap((p) => [p.slug, ...(p.companions ?? [])]),
);
