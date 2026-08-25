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
    <section className="grid gap-x-8 gap-y-2 border-t border-[#e4e4e4] pt-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] print:grid-cols-[7.5rem_minmax(0,1fr)]">
      <h2 className="smallcaps text-[#6c6c6c]">{label}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default function CvPage() {
  const generated = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-white text-[#151515]">
      <div className="mx-auto w-full max-w-[50rem] px-5 py-8 sm:px-8 print:max-w-none print:p-0">
        {/* controls — never printed */}
        <nav
          aria-label="cv controls"
          className="mono mb-10 flex items-baseline justify-between gap-4 text-xs print:hidden"
        >
          <Link
            href="/"
            className="text-[#464646] underline decoration-[#c9c9c9] underline-offset-4 hover:text-[#151515] hover:decoration-current"
          >
            ← Parth Auti — the checks
          </Link>
          <PdfButton />
        </nav>

        {/* sheet header */}
        <header className="mb-8 flex flex-col gap-4 border-b-2 border-[#151515] pb-5 sm:flex-row sm:items-end sm:justify-between print:flex-row print:items-end print:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{CONTACT.name}</h1>
            <p className="mt-1.5 text-sm text-[#464646]">{CONTACT.role}</p>
          </div>
          <ul className="mono space-y-0.5 text-xs leading-relaxed text-[#464646] sm:text-right print:text-right">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="underline decoration-[#c9c9c9] underline-offset-2">
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={CONTACT.github} className="underline decoration-[#c9c9c9] underline-offset-2">
                github.com/pauti04
              </a>
            </li>
            <li>
              <a
                href={`https://${CONTACT.linkedin}`}
                className="underline decoration-[#c9c9c9] underline-offset-2"
              >
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
                      <span className="text-[#464646]"> — {e.degree}</span>
                    </p>
                    <span className="mono shrink-0 text-[0.72rem] tabular-nums text-[#6c6c6c]">
                      {fmtMonth(e.start)} – {fmtMonth(e.end)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.8rem] text-[#464646]">
                    {[e.location, e.gpa && `GPA ${e.gpa}`, e.honors].filter(Boolean).join(" · ")}
                  </p>
                  {e.coursework && (
                    <p className="mt-0.5 text-[0.8rem] text-[#464646]">
                      <span className="font-medium text-[#151515]">Coursework:</span>{" "}
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
                      <span className="text-[#464646]"> — {x.role}</span>
                    </p>
                    <span className="mono shrink-0 text-[0.72rem] tabular-nums text-[#6c6c6c]">
                      {fmtMonth(x.start)} – {fmtMonth(x.end)}
                    </span>
                  </div>
                  {x.location && <p className="mt-0.5 text-[0.8rem] text-[#6c6c6c]">{x.location}</p>}
                  <ul className="mt-1.5 space-y-1">
                    {x.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2.5 text-[0.85rem] leading-relaxed">
                        <span aria-hidden="true" className="mono select-none text-[#9a9a9a]">
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
                      <span className="text-[#464646]"> — {p.tagline}</span>
                    </p>
                    <span className="mono shrink-0 text-[0.72rem] tabular-nums text-[#6c6c6c]">
                      {p.year}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.85rem] leading-relaxed">{p.blurb}</p>
                  <p className="mono mt-1 text-[0.7rem] leading-relaxed text-[#6c6c6c]">
                    {p.stack} ·{" "}
                    <a href={p.repo} className="underline decoration-[#c9c9c9] underline-offset-2">
                      {p.repo.replace("https://", "")}
                    </a>
                    {p.demo && (
                      <>
                        {" · "}
                        <a href={p.demo} className="underline decoration-[#c9c9c9] underline-offset-2">
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
                <div key={s.group} className="sm:grid sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-4 print:grid print:grid-cols-[7rem_minmax(0,1fr)] print:gap-x-4">
                  <dt className="font-medium capitalize text-[#464646]">{s.group}</dt>
                  <dd>{s.items}</dd>
                </div>
              ))}
              <div className="sm:grid sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-4 print:grid print:grid-cols-[7rem_minmax(0,1fr)] print:gap-x-4">
                <dt className="font-medium capitalize text-[#464646]">languages</dt>
                <dd>{CONTACT.languages}</dd>
              </div>
            </dl>
          </CvSection>

          <CvSection label="Certifications">
            <ul className="grid grid-cols-1 gap-x-8 gap-y-1 text-[0.85rem] sm:grid-cols-2 print:grid-cols-2">
              {CERTIFICATIONS.map((c) => (
                <li key={c.issuer + c.name} className="flex items-baseline gap-2.5">
                  <span className="mono w-[4.5rem] shrink-0 text-[0.7rem] text-[#6c6c6c]">
                    {c.issuer}
                  </span>
                  <span>
                    <span className="font-medium">{c.name}</span>
                    {c.code && <span className="mono text-[0.72rem] text-[#6c6c6c]"> · {c.code}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Awards & honors">
            <ul className="space-y-1 text-[0.85rem] leading-relaxed">
              {AWARDS.map((a) => (
                <li key={a.name} className="flex items-baseline gap-2.5">
                  <span className="mono w-10 shrink-0 text-[0.72rem] tabular-nums text-[#6c6c6c]">
                    {a.year}
                  </span>
                  <span>
                    <span className="font-medium">{a.name}</span>
                    {a.note && <span className="text-[#464646]"> — {a.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Looking for">
            <ul className="space-y-1">
              {LOOKING_FOR.map((line) => (
                <li key={line} className="flex gap-2.5 text-[0.85rem] leading-relaxed">
                  <span aria-hidden="true" className="mono select-none text-[#9a9a9a]">
                    —
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CvSection>

          <CvSection label="Contact">
            <p className="text-[0.85rem]">
              <a href={`mailto:${CONTACT.email}`} className="underline decoration-[#c9c9c9] underline-offset-2">
                {CONTACT.email}
              </a>{" "}
              ·{" "}
              <a href={CONTACT.github} className="underline decoration-[#c9c9c9] underline-offset-2">
                github.com/pauti04
              </a>
            </p>
          </CvSection>
        </div>

        <footer className="mono mt-10 flex flex-wrap items-baseline justify-between gap-2 border-t border-[#e4e4e4] pt-3 text-[0.68rem] text-[#6c6c6c]">
          <span>Web version: every project claim on the front page is executable.</span>
          <span>Generated {generated}</span>
        </footer>
      </div>

      <style>{`
        @page { size: A4; margin: 13mm; }
        @media print {
          html, body { background: #fff !important; }
        }
      `}</style>
    </main>
  );
}
