"use client";

// ----------------------------------------------------------------------------
// CHK-07 RasoiBot — the smallest, politest check. Set-intersection over a
// curated index of twelve recipes lifted from the real app's recipes.json
// (lib/checks/fixtures/rasoibot-index.json — the same file scripts/verify.mjs
// reads at build time), running entirely in this tab. The check asserts five
// lookups: three that must find the right recipe (paneer + tomato → paneer
// butter masala; okra → bhindi masala; chicken + tomato → butter chicken,
// beating paneer butter masala's half-match), one deterministic tie-break
// (lentils alone ties three dals at 0.50 — first in index order wins: tadka
// dal) and one that must decline honestly (rice alone matches nothing; no
// indexed recipe is keyed on rice). Zero API calls, counted and reported.
// ----------------------------------------------------------------------------

import { useState } from "react";
import type { CheckRunner } from "@/lib/checks/types";
import fixture from "@/lib/checks/fixtures/rasoibot-index.json";

type Recipe = { id: string; name: string; time?: string; match: string[]; needs: string[] };
type Case = { pantry: string[]; expect: string | null; why: string };

const INGREDIENTS: string[] = fixture.ingredients;
const INDEX: Recipe[] = fixture.index;
const CASES: Case[] = fixture.cases;

// The whole system: score = |pantry ∩ match| / |match|, best score wins.
// Ties keep the earlier entry — strict `>`, so an equal score never replaces
// the first-seen best. `tied` names the entries that scored the same and lost,
// so the figure and the log can say so out loud.
function rank(pantry: string[]): { best: Recipe | null; score: number; tied: string[] } {
  let best: { score: number; r: Recipe } | null = null;
  const scores: { score: number; r: Recipe }[] = [];
  for (const r of INDEX) {
    const score = r.match.filter((m) => pantry.includes(m)).length / r.match.length;
    scores.push({ score, r });
    if (score > 0 && (!best || score > best.score)) best = { score, r };
  }
  if (!best) return { best: null, score: 0, tied: [] };
  const top = best;
  const tied = scores.filter((s) => s.score === top.score && s.r !== top.r).map((s) => s.r.name);
  return { best: top.r, score: top.score, tied };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const run: CheckRunner = async ({ lite, signal, onLog }) => {
  const t0 = Date.now();
  const log = (text: string, tone?: "muted" | "ok" | "warn" | "err") =>
    onLog({ t: Date.now() - t0, text, tone });
  const pause = async (ms: number) => {
    if (!lite && !signal?.aborted) await sleep(ms);
  };

  await pause(200);
  log(`index: ${INDEX.length} recipes from the app's recipes.json · score = |pantry ∩ match| / |match|`, "muted");

  let correct = 0;
  for (const c of CASES) {
    const { best, score, tied } = rank(c.pantry);
    const ok = (best?.name ?? null) === c.expect;
    if (ok) correct += 1;
    await pause(320);
    if (best) {
      const tie =
        tied.length > 0
          ? ` · tie at ${score.toFixed(2)} with ${tied.join(", ")} — first in index wins`
          : "";
      log(
        `pantry: ${c.pantry.join(", ")} → ${best.name}${best.time ? ` · ${best.time}` : ""}${tie}${ok ? "" : " (unexpected)"}`,
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
      ? "Pantry lookup returned the right recipe for four pantries — one by a deterministic tie-break — and declined a fifth honestly, in this tab. 0 API calls."
      : "At least one pantry lookup returned the wrong recipe.",
  };
};

// ---------------------------------------------------------------------------
// Figure body — toggle the pantry, watch the same set-intersection answer.
//
// This is the earliest thing on the route and it is dressed accordingly: two
// zones, one answer, no meters, no tables, and — alone among the seven — no
// accent anywhere. The route colour is earned further up the page. Small and
// honest is the point; the figure is not allowed to argue otherwise. The five
// lookups the check asserts are listed underneath so the visitor can try them.
// ---------------------------------------------------------------------------

const LABEL = "text-[0.6875rem] uppercase tracking-[0.18em] text-muted";

export default function RasoiBotCheck() {
  const [picked, setPicked] = useState<string[]>(CASES[0].pantry);
  const { best: found, score, tied } = rank(picked);

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
              {found.time ? `${found.time} · ` : ""}you&apos;ll also need {found.needs.join(", ")}
            </p>
            {tied.length > 0 && (
              <p className="mt-1.5 max-w-[52ch] text-[0.75rem] leading-relaxed text-muted">
                {tied.join(", ")} also scored {score.toFixed(2)} — a tie keeps the first in the
                index. add an ingredient to break it.
              </p>
            )}
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

      <div className="mt-5 border-t border-rule pt-4">
        <p className={LABEL}>the {CASES.length} lookups the check asserts</p>
        <ul className="mt-2.5 space-y-1 text-[0.75rem] leading-relaxed text-muted">
          {CASES.map((c) => (
            <li key={c.pantry.join("+")}>
              <span className="text-ink-soft">{c.pantry.join(" + ")}</span>
              {" → "}
              {c.expect ?? "declines"}
              {c.expect === null || rank(c.pantry).tied.length > 0 ? (
                <span> · {c.expect === null ? "honest miss" : "tie — first in index wins"}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 max-w-[62ch] border-t border-rule pt-3 text-[0.6875rem] leading-relaxed text-muted">
        set-intersection over a curated index of {INDEX.length} recipes lifted from the
        app&apos;s recipes.json — this is the index, not the app · 0 API calls · the
        &quot;streaming&quot; in the real app is sleep(14 ms), and the README says so
      </p>
    </div>
  );
}
