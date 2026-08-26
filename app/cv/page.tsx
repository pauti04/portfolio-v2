// ----------------------------------------------------------------------------
// CV — two renderings of one sheet.
//
// On screen it sits in the journey's warm theme with the same nav as every
// other page. On paper it is black ink on white, A4, no chrome: the whole
// palette is a handful of custom properties that swap inside @media print,
// so there is exactly one markup tree and no duplicated layout.
//
// Every fact comes from app/cv/resume.ts. Copy is ported verbatim.
// ----------------------------------------------------------------------------

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import PdfButton from "./PdfButton";
import {
  AWARDS,
  CERTIFICATIONS,
  CONTACT,
  EDUCATION,
  EXPERIENCE,
  LOOKING_FOR,
  PROJECTS,
  SKILLS,
  SUMMARY,
} from "./resume";

export const metadata: Metadata = {
  title: "CV — Parth Auti",
  description:
    "Parth Auti — CV. AI agent reliability & applied ML. CS new grad, December 2026. Reflight, ChainCheck (PyPI), CostDNA, Bourse.",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtMonth(s: string) {
  if (!s || s.startsWith("Expected") || s === "Present") return s;
  const [y, m] = s.split("-");
  if (!y || !m) return s;
  const name = MONTHS[parseInt(m, 10) - 1];
  return name ? `${name} ${y}` : s;
}

/** Section with a small-caps label rail on the left; stacks on narrow screens. */
function CvSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="cv-rule grid gap-x-8 gap-y-2 border-t pt-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] print:grid-cols-[7.5rem_minmax(0,1fr)]">
      <h2 className="smallcaps cv-mute">{label}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default function CvPage() {
  const generated = new Date().toISOString().slice(0, 10);

  return (
    <main className="cv-sheet min-h-screen">
      <div className="mx-auto w-full max-w-[50rem] px-5 py-8 sm:px-8 print:max-w-none print:p-0">
        {/* controls — never printed */}
        <nav
          aria-label="cv controls"
          className="cv-controls cv-rule mono mb-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b pb-4 text-[0.8125rem] print:hidden"
        >
          <span className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <Link href="/" className="cv-link">
              <span aria-hidden="true">← </span>the journey
            </Link>
            <Link href="/writing" className="cv-link cv-mute">
              writing
            </Link>
          </span>
          <PdfButton />
        </nav>

        {/* sheet header */}
        <header className="cv-hair mb-8 flex flex-col gap-4 border-b-2 pb-5 sm:flex-row sm:items-end sm:justify-between print:flex-row print:items-end print:justify-between">
          <div>
            <h1 className="city-type cv-ink text-[2.25rem] print:text-3xl">{CONTACT.name}</h1>
            <p className="cv-dim mt-2 text-sm">{CONTACT.role}</p>
          </div>
          <ul className="mono cv-dim space-y-0.5 text-xs leading-relaxed sm:text-right print:text-right">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="cv-link">
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={CONTACT.github} className="cv-link">
                github.com/pauti04
              </a>
            </li>
            <li>
              <a href={`https://${CONTACT.linkedin}`} className="cv-link">
                {CONTACT.linkedin}
              </a>
            </li>
            <li>{CONTACT.location}</li>
          </ul>
        </header>

        <div className="space-y-7">
          <CvSection label="Summary">
            <p className="text-sm leading-relaxed">{SUMMARY}</p>
          </CvSection>

          <CvSection label="Education">
            <ul className="space-y-3.5">
              {EDUCATION.map((e) => (
                <li key={e.school}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="text-sm">
                      <strong className="font-semibold">{e.school}</strong>
                      <span className="cv-dim"> — {e.degree}</span>
                    </p>
                    <span className="mono cv-mute shrink-0 text-[0.72rem] tabular-nums">
                      {fmtMonth(e.start)} – {fmtMonth(e.end)}
                    </span>
                  </div>
                  <p className="cv-dim mt-0.5 text-[0.8rem]">
                    {[e.location, e.gpa && `GPA ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                  </p>
                  {e.coursework && (
                    <p className="cv-dim mt-0.5 text-[0.8rem]">
                      <span className="cv-ink font-medium">Coursework:</span>{" "}
                      {e.coursework.join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Experience">
            <ul className="space-y-4">
              {EXPERIENCE.map((x) => (
                <li key={x.company + x.role}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="text-sm">
                      <strong className="font-semibold">{x.company}</strong>
                      <span className="cv-dim"> — {x.role}</span>
                    </p>
                    <span className="mono cv-mute shrink-0 text-[0.72rem] tabular-nums">
                      {fmtMonth(x.start)} – {fmtMonth(x.end)}
                    </span>
                  </div>
                  {x.location && <p className="cv-mute mt-0.5 text-[0.8rem]">{x.location}</p>}
                  <ul className="mt-1.5 space-y-1">
                    {x.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2.5 text-[0.85rem] leading-relaxed">
                        <span aria-hidden="true" className="mono cv-mute select-none">
                          —
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Selected projects">
            <ul className="space-y-3.5">
              {PROJECTS.map((p) => (
                <li key={p.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="text-sm">
                      <strong className="font-semibold">{p.name}</strong>
                      <span className="cv-dim"> — {p.tagline}</span>
                    </p>
                    <span className="mono cv-mute shrink-0 text-[0.72rem] tabular-nums">
                      {p.year}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.85rem] leading-relaxed">{p.blurb}</p>
                  <p className="mono cv-mute mt-1 text-[0.7rem] leading-relaxed">
                    {p.stack} ·{" "}
                    <a href={p.repo} className="cv-link">
                      {p.repo.replace("https://", "")}
                    </a>
                    {p.demo && (
                      <>
                        {" · "}
                        <a href={p.demo} className="cv-link">
                          live
                        </a>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Skills">
            <dl className="space-y-1.5 text-[0.85rem] leading-relaxed">
              {SKILLS.map((s) => (
                <div
                  key={s.group}
                  className="sm:grid sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-4 print:grid print:grid-cols-[7rem_minmax(0,1fr)] print:gap-x-4"
                >
                  <dt className="cv-dim font-medium capitalize">{s.group}</dt>
                  <dd>{s.items}</dd>
                </div>
              ))}
              <div className="sm:grid sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-4 print:grid print:grid-cols-[7rem_minmax(0,1fr)] print:gap-x-4">
                <dt className="cv-dim font-medium capitalize">languages</dt>
                <dd>{CONTACT.languages}</dd>
              </div>
            </dl>
          </CvSection>

          <CvSection label="Certifications">
            <ul className="grid grid-cols-1 gap-x-8 gap-y-1 text-[0.85rem] sm:grid-cols-2 print:grid-cols-2">
              {CERTIFICATIONS.map((c) => (
                <li key={c.issuer + c.name} className="flex items-baseline gap-2.5">
                  <span className="mono cv-mute w-[4.5rem] shrink-0 text-[0.7rem]">{c.issuer}</span>
                  <span>
                    <span className="font-medium">{c.name}</span>
                    {c.code && <span className="mono cv-mute text-[0.72rem]"> · {c.code}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Awards & honors">
            <ul className="space-y-1 text-[0.85rem] leading-relaxed">
              {AWARDS.map((a) => (
                <li key={a.name} className="flex items-baseline gap-2.5">
                  <span className="mono cv-mute w-10 shrink-0 text-[0.72rem] tabular-nums">
                    {a.year}
                  </span>
                  <span>
                    <span className="font-medium">{a.name}</span>
                    {a.note && <span className="cv-dim"> — {a.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Looking for">
            <ul className="space-y-1">
              {LOOKING_FOR.map((line) => (
                <li key={line} className="flex gap-2.5 text-[0.85rem] leading-relaxed">
                  <span aria-hidden="true" className="mono cv-mute select-none">
                    —
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Contact">
            <p className="text-[0.85rem]">
              <a href={`mailto:${CONTACT.email}`} className="cv-link">
                {CONTACT.email}
              </a>{" "}
              ·{" "}
              <a href={CONTACT.github} className="cv-link">
                github.com/pauti04
              </a>
            </p>
          </CvSection>
        </div>

        <footer className="mono cv-rule cv-mute mt-10 flex flex-wrap items-baseline justify-between gap-2 border-t pt-3 text-[0.68rem]">
          <span>Web version: every project claim on the front page is executable.</span>
          <span>Generated {generated}</span>
        </footer>

        <p className="mono mt-8 text-[0.8125rem] print:hidden">
          <Link href="/" className="cv-link cv-mute">
            <span aria-hidden="true">← </span>back to the journey
          </Link>
        </p>
      </div>

      <style>{`
        /* One markup tree, two palettes. Screen: the journey's warm theme.
           Print: black ink on white paper, and nothing else. */
        .cv-sheet {
          --cv-ink: var(--ink);
          --cv-dim: var(--ink-soft);
          --cv-mute: var(--muted);
          --cv-rule: var(--rule);
          --cv-hair: var(--ink-soft);
          background: var(--ground);
          color: var(--cv-ink);
        }
        .cv-ink { color: var(--cv-ink); }
        .cv-dim { color: var(--cv-dim); }
        .cv-mute { color: var(--cv-mute); }
        .cv-rule { border-color: var(--cv-rule); }
        .cv-hair { border-color: var(--cv-hair); }

        .cv-link {
          color: inherit;
          text-decoration: underline;
          text-decoration-color: var(--cv-rule);
          text-underline-offset: 0.22em;
          transition: text-decoration-color 180ms ease, color 180ms ease;
        }
        .cv-link:hover { color: var(--cv-ink); text-decoration-color: currentColor; }

        /* The Save-as-PDF control lives in PdfButton.tsx; it is skinned from
           here so that file stays untouched. Unlayered, so it wins over the
           utility layer. */
        .cv-controls button {
          background: transparent;
          color: var(--cv-dim);
          border: 1px solid var(--cv-rule);
          border-radius: 999px;
          padding: 0.4em 0.95em;
          font-family: var(--font-plex-mono), ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          transition: border-color 180ms ease, color 180ms ease;
        }
        .cv-controls button:hover {
          border-color: var(--route);
          color: var(--cv-ink);
        }

        @page { size: A4; margin: 13mm; }

        @media print {
          html, body { background: #fff !important; }
          .cv-sheet {
            --cv-ink: #151515;
            --cv-dim: #464646;
            --cv-mute: #6c6c6c;
            --cv-rule: #d8d8d8;
            --cv-hair: #151515;
            background: #fff !important;
            color: #151515 !important;
            min-height: 0;
          }
          .cv-link { text-decoration-color: #bdbdbd; }
        }
      `}</style>
    </main>
  );
}
