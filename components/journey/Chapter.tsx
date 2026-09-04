// ----------------------------------------------------------------------------
// A chapter opener: the city in display type, where and when, the distance
// marker, and the life that happened there — each milestone entering on the
// line as the reader reaches it. Projects built in this chapter are passed in
// as children so they sit inside the chapter, not beside it.
// ----------------------------------------------------------------------------

import type { ReactNode } from "react";
import Enter from "./Enter";
import Milestone from "./Milestone";
import type { Chapter as ChapterData } from "@/lib/journey";

export default function Chapter({
  chapter,
  children,
}: {
  chapter: ChapterData;
  children?: ReactNode;
}) {
  const titleId = `chapter-${chapter.id}-city`;

  return (
    <section
      id={`chapter-${chapter.id}`}
      aria-labelledby={titleId}
      className="scroll-mt-16 py-16 sm:py-20"
    >
      <Enter
        className="on-rail on-rail-city"
        style={{ "--node-top": "0.1rem" }}
      >
        <p className="eyebrow">Chapter {chapter.ordinal}</p>

        <h2
          id={titleId}
          className="city-type mt-5 text-[clamp(3.25rem,13vw,7rem)]"
        >
          {chapter.city}
        </h2>

        <p className="mt-4 text-lg text-ink-soft sm:text-xl">{chapter.region}</p>

        <p className="mono mt-3 text-[0.8125rem] tracking-[0.1em] text-muted">
          {chapter.dates}
          <span aria-hidden="true"> · </span>
          <span className="text-route">{chapter.marker}</span>
        </p>

        <p className="mt-7 max-w-[42ch] text-[1.0625rem] leading-relaxed text-ink sm:text-lg">
          {chapter.standfirst}
        </p>
      </Enter>

      <ul className="mt-12 space-y-11 sm:mt-14">
        {chapter.milestones.map((m, i) => (
          <Milestone key={m.id} item={m} delay={Math.min(i, 3) * 0.06} />
        ))}
      </ul>

      {children && (
        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">{children}</div>
      )}
    </section>
  );
}
