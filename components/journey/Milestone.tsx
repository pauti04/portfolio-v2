"use client";

// ----------------------------------------------------------------------------
// One life event, planted on the route line. The node is drawn by `.on-rail`,
// positioned against the rail rather than against this element, so it lands on
// the line at every breakpoint. Facts arrive already assembled by lib/journey.
// ----------------------------------------------------------------------------

import { enterStyle, useEnterRef } from "./Enter";
import type { Milestone as MilestoneItem } from "@/lib/journey";

export default function Milestone({
  item,
  delay = 0,
}: {
  item: MilestoneItem;
  delay?: number;
}) {
  const ref = useEnterRef<HTMLLIElement>();

  return (
    <li
      ref={ref}
      className="on-rail"
      style={enterStyle(delay, { "--node-top": "0.28rem" })}
    >
      <p className="mono text-xs tracking-[0.14em] text-muted uppercase">{item.when}</p>
      <h3 className="mt-2 text-lg leading-snug font-medium text-ink sm:text-xl">
        {item.title}
      </h3>
      <p className="mt-2 max-w-[58ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        {item.detail}
      </p>
      {item.note && (
        <p className="mt-2 max-w-[58ch] text-[0.875rem] leading-relaxed text-muted">
          {item.note}
        </p>
      )}
    </li>
  );
}
