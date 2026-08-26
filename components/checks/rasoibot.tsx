"use client";

// ----------------------------------------------------------------------------
// CHK-07 RasoiBot — the smallest, politest check. Set-intersection over a
// hand-curated index of six recipes, running entirely in this tab. The check
// asserts three lookups: two that must find the right recipe (paneer +
// tomato → paneer butter masala; okra → bhindi do pyaza) and one that must
// decline honestly (rice alone matches nothing cleanly). Zero API calls,
// counted and reported.
// ----------------------------------------------------------------------------

import { useState } from "react";
import type { CheckRunner } from "@/lib/checks/types";

const INGREDIENTS = [
  "onion",
  "tomato",
  "paneer",
  "potato",
  "spinach",
  "chickpeas",
  "rice",
  "yogurt",
  "ginger",
  "garlic",
  "okra",
  "lentils",
];

type Recipe = { name: string; time: string; needs: string[] };

const INDEX: { match: string[]; recipe: Recipe }[] = [
  {
    match: ["paneer", "tomato"],
    recipe: {
      name: "paneer butter masala",
      time: "22 min",
      needs: ["cream (or soaked cashews)", "garam masala", "kasuri methi"],
    },
  },
  {
    match: ["potato", "onion"],
    recipe: {
      name: "aloo pyaaz sabzi",
      time: "18 min",
      needs: ["mustard seeds", "turmeric", "green chilli"],
    },
  },
  {
    match: ["chickpeas", "onion"],
    recipe: {
      name: "chana masala",
      time: "28 min",
      needs: ["amchur (or lemon)", "garam masala", "bay leaf"],
    },
  },
  {
    match: ["spinach", "paneer"],
    recipe: {
      name: "palak paneer",
      time: "24 min",
      needs: ["cream (small)", "garam masala", "kasuri methi"],
    },
  },
  {
    match: ["okra"],
    recipe: { name: "bhindi do pyaza", time: "20 min", needs: ["amchur", "coriander powder"] },
  },
  {
    match: ["lentils"],
    recipe: { name: "tadka dal", time: "30 min", needs: ["ghee", "asafoetida", "kashmiri chilli"] },
  },
];

// The whole system: score = |pantry ∩ match| / |match|, best score wins.
function findRecipe(pantry: string[]): Recipe | null {
  let best: { score: number; r: Recipe } | null = null;
  for (const { match, recipe } of INDEX) {
    const score = match.filter((m) => pantry.includes(m)).length / match.length;
    if (score > 0 && (!best || score > best.score)) best = { score, r: recipe };
  }
  return best?.r ?? null;
}

const CASES: { pantry: string[]; expect: string | null }[] = [
  { pantry: ["paneer", "tomato"], expect: "paneer butter masala" },
  { pantry: ["okra"], expect: "bhindi do pyaza" },
  { pantry: ["rice"], expect: null },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const run: CheckRunner = async ({ lite, signal, onLog }) => {
  const t0 = Date.now();
  const log = (text: string, tone?: "muted" | "ok" | "warn" | "err") =>
    onLog({ t: Date.now() - t0, text, tone });
  const pause = async (ms: number) => {
    if (!lite && !signal?.aborted) await sleep(ms);
  };

  let correct = 0;
  for (const c of CASES) {
    const found = findRecipe(c.pantry);
    const ok = (found?.name ?? null) === c.expect;
    if (ok) correct += 1;
    await pause(320);
    if (found) {
      log(
        `pantry: ${c.pantry.join(", ")} → ${found.name} · ${found.time}${ok ? "" : " (unexpected)"}`,
        ok ? "ok" : "err",
      );
    } else {
      log(
        `pantry: ${c.pantry.join(", ")} → nothing locks in cleanly — declined, politely${ok ? "" : " (unexpected)"}`,
        ok ? "muted" : "err",
      );
    }
  }

  const pass = correct === CASES.length;
  await pause(240);
  log(`${correct}/${CASES.length} lookups as expected · 0 API calls`, pass ? "ok" : "err");

  return {
    pass,
    mode: "live",
    metrics: [
      { label: "lookups correct", value: `${correct}/${CASES.length}` },
      { label: "recipes indexed", value: String(INDEX.length) },
      { label: "API calls", value: "0" },
    ],
    summary: pass
      ? "Pantry lookup returned the right recipe twice and declined a third honestly, in this tab. 0 API calls."
      : "At least one pantry lookup returned the wrong recipe.",
  };
};

// ---------------------------------------------------------------------------
// Figure body — toggle the pantry, watch the same set-intersection answer.
//
// This is the earliest thing on the route and it is dressed accordingly: two
// zones, one answer, no meters, no tables, and — alone among the seven — no
// accent anywhere. The route colour is earned further up the page. Small and
// honest is the point; the figure is not allowed to argue otherwise.
// ---------------------------------------------------------------------------

const LABEL = "text-[0.6875rem] uppercase tracking-[0.18em] text-muted";

export default function RasoiBotCheck() {
  const [picked, setPicked] = useState<string[]>(["paneer", "tomato"]);
  const found = findRecipe(picked);

  const toggle = (ing: string) =>
    setPicked((p) => (p.includes(ing) ? p.filter((x) => x !== ing) : [...p, ing]));

  return (
    <div className="mono p-4 sm:p-5">
      <p className={LABEL}>pantry</p>
      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label="pantry — toggle an ingredient"
      >
        {INGREDIENTS.map((ing) => {
          const on = picked.includes(ing);
          return (
            <button
              key={ing}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(ing)}
              className={`rounded-full border px-2.5 py-1 text-[0.6875rem] transition-colors ${
                on
                  ? "border-ink-soft bg-panel text-ink"
                  : "border-rule text-muted hover:border-ink-soft hover:text-ink-soft"
              }`}
            >
              {ing}
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-rule pt-4" aria-live="polite">
        <p className={LABEL}>what that makes</p>
        {found ? (
          <>
            <p className="mt-2.5 text-[0.875rem] text-ink">{found.name}</p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-muted">
              {found.time} · you&apos;ll also need {found.needs.join(", ")}
            </p>
          </>
        ) : (
          <>
            <p className="mt-2.5 text-[0.875rem] text-ink-soft">nothing locks in cleanly</p>
            <p className="mt-1.5 max-w-[52ch] text-[0.75rem] leading-relaxed text-muted">
              try tomato, paneer, or chickpeas. an honest miss beats a confident wrong answer.
            </p>
          </>
        )}
      </div>

      <p className="mt-5 max-w-[62ch] border-t border-rule pt-3 text-[0.6875rem] leading-relaxed text-muted">
        set-intersection over a hand-curated index of {INDEX.length} · 0 API calls · the
        &quot;streaming&quot; in the real app is sleep(14 ms), and the README says so
      </p>
    </div>
  );
}
