"use client";

// ----------------------------------------------------------------------------
// The client spine. Per-check state machine (idle → running → pass/fail),
// sequential RUN ALL with a sticky "N/7 passing…" mini-bar, the Observations
// ledger + [copy summary] attestation, and aria-live announcements.
//
// States are seeded from lib/verification.json so the page is green before
// any JS runs a check — interaction is upside, never a gate.
// ----------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CheckResult, LogLine } from "@/lib/checks/types";
import { CLAIMS, CHECK_SLUGS, type CheckSlug } from "@/lib/claims";
import verification from "@/lib/verification.json";
import { loadRunner } from "@/components/checks";

export type CheckStatus = "idle" | "running" | "pass" | "fail";

export type CheckState = {
  status: CheckStatus;
  /** Latest result — seeded from the build run, replaced when a visitor runs it. */
  result?: CheckResult;
  logs: LogLine[];
  /** true once the visitor has executed this check in their own tab. */
  ranByVisitor: boolean;
};

export type Observation = {
  time: string; // HH:MM:SS
  chk: string; // "CHK-02"
  metric: string; // "1.18M ops/sec"
  origin: string; // "your device" | "recorded replay"
};

type Ctx = {
  states: Record<CheckSlug, CheckState>;
  builtAt: string;
  runCheck: (slug: CheckSlug) => Promise<void>;
  runAll: () => void;
  runningAll: boolean;
  passCount: number;
  total: number;
  observations: Observation[];
  copySummary: () => Promise<boolean>;
  /** Reduced-motion / constrained preset — results appear without animation. */
  lite: boolean;
};

const RunAllContext = createContext<Ctx | null>(null);

/**
 * The one control style. Every run button on the page — "run it", "run again",
 * "run all 7" — wears exactly this string, so they can never drift apart.
 * `.run-control` (globals.css) draws the pill, its hover and its disabled
 * state; the utilities here add the pressed state on top, and undo it while
 * the control is disabled. Focus-visible is the site-wide --route ring.
 */
export const RUN_CONTROL_CLASS =
  "run-control cursor-pointer select-none transition-[border-color,color,background-color,transform] duration-150 " +
  "active:translate-y-px active:bg-panel " +
  "disabled:cursor-default disabled:active:translate-y-0 disabled:active:bg-transparent";

export function useChecks(): Ctx {
  const ctx = useContext(RunAllContext);
  if (!ctx) throw new Error("useChecks must be used inside <RunAllProvider>");
  return ctx;
}

type VerificationFile = {
  builtAt: string;
  results: Record<string, CheckResult>;
};

const buildData = verification as VerificationFile;

function seedStates(): Record<CheckSlug, CheckState> {
  const out = {} as Record<CheckSlug, CheckState>;
  for (const slug of CHECK_SLUGS) {
    const rec = buildData.results[slug];
    out[slug] = {
      status: rec ? (rec.pass ? "pass" : "fail") : "idle",
      result: rec,
      logs: [],
      ranByVisitor: false,
    };
  }
  return out;
}

const nameOf = (slug: CheckSlug) => CLAIMS.find((c) => c.slug === slug)?.name ?? slug;
const idOf = (slug: CheckSlug) => CLAIMS.find((c) => c.slug === slug)?.id ?? slug;

export default function RunAllProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<CheckSlug, CheckState>>(seedStates);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [runningAll, setRunningAll] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [lite, setLite] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Mirrors `states` for the async runners, which need the latest value after
  // an await. Synced after commit, never written during render.
  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  }, [states]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setLite(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const announce = useCallback((text: string) => {
    setAnnouncement(text);
  }, []);

  const runCheck = useCallback(
    async (slug: CheckSlug) => {
      if (statesRef.current[slug].status === "running") return;
      const controller = abortRef.current ?? new AbortController();
      setStates((s) => ({
        ...s,
        [slug]: { ...s[slug], status: "running", logs: [] },
      }));
      // Mirror every status transition into the ref synchronously: the
      // effect that syncs statesRef runs after commit, so a caller that
      // reads the ref right after `await runCheck()` (Run all's tally,
      // the copy-summary) would otherwise see the previous status.
      statesRef.current = {
        ...statesRef.current,
        [slug]: { ...statesRef.current[slug], status: "running", logs: [] },
      };
      announce(`${idOf(slug)} ${nameOf(slug)}: running`);
      try {
        const run = await loadRunner[slug]();
        const result = await run({
          lite,
          signal: controller.signal,
          onLog: (l: LogLine) =>
            setStates((s) => ({
              ...s,
              [slug]: { ...s[slug], logs: [...s[slug].logs, l] },
            })),
        });
        setStates((s) => ({
          ...s,
          [slug]: {
            ...s[slug],
            status: result.pass ? "pass" : "fail",
            result,
            ranByVisitor: true,
          },
        }));
        statesRef.current = {
          ...statesRef.current,
          [slug]: {
            ...statesRef.current[slug],
            status: result.pass ? "pass" : "fail",
            result,
            ranByVisitor: true,
          },
        };
        if (result.metrics.length > 0) {
          const m = result.metrics[0];
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, "0");
          const mm = String(now.getMinutes()).padStart(2, "0");
          const ss = String(now.getSeconds()).padStart(2, "0");
          setObservations((o) => [
            ...o,
            {
              time: `${hh}:${mm}:${ss}`,
              chk: idOf(slug),
              metric: `${m.value} ${m.label}`,
              origin: result.mode === "live" ? "your device" : "recorded replay",
            },
          ]);
        }
        announce(
          `${idOf(slug)} ${nameOf(slug)}: ${result.pass ? "pass" : "fail"} — ${result.summary}`,
        );
      } catch {
        setStates((s) => ({
          ...s,
          [slug]: { ...s[slug], status: "fail" },
        }));
        statesRef.current = {
          ...statesRef.current,
          [slug]: { ...statesRef.current[slug], status: "fail" },
        };
        announce(`${idOf(slug)} ${nameOf(slug)}: fail — check did not complete`);
      }
    },
    [announce, lite],
  );

  const runAll = useCallback(() => {
    if (runningAll) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setRunningAll(true);
    announce(`Running all ${CHECK_SLUGS.length} checks.`);
    (async () => {
      for (const claim of CLAIMS) {
        if (controller.signal.aborted) break;
        await runCheck(claim.slug);
      }
      setRunningAll(false);
      abortRef.current = null;
      const passing = CHECK_SLUGS.filter(
        (s) => statesRef.current[s].status === "pass",
      ).length;
      announce(`Run complete: ${passing} of ${CHECK_SLUGS.length} checks passing.`);
    })();
  }, [announce, runCheck, runningAll]);

  const passCount = CHECK_SLUGS.filter((s) => states[s].status === "pass").length;

  const copySummary = useCallback(async () => {
    const lines = [
      "Parth Auti — verification summary",
      `page built and pre-verified: ${buildData.builtAt}`,
      `checks passing: ${
        CHECK_SLUGS.filter((s) => statesRef.current[s].status === "pass").length
      }/${CHECK_SLUGS.length}`,
      "",
      ...CLAIMS.map((c) => {
        const st = statesRef.current[c.slug];
        const r = st.result;
        return `${st.status === "pass" ? "PASS" : st.status === "fail" ? "FAIL" : st.status.toUpperCase()}  ${c.id}  ${c.name} — ${r ? r.summary : "not run"}`;
      }),
      "",
      ...observations.map(
        (o) => `OBSERVED ${o.time} · ${o.chk} · ${o.metric} · ${o.origin}`,
      ),
      "",
      "source: https://github.com/pauti04",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      announce("Summary copied to clipboard.");
      return true;
    } catch {
      announce("Could not copy summary.");
      return false;
    }
  }, [announce, observations]);

  const value = useMemo<Ctx>(
    () => ({
      states,
      builtAt: buildData.builtAt,
      runCheck,
      runAll,
      runningAll,
      passCount,
      total: CHECK_SLUGS.length,
      observations,
      copySummary,
      lite,
    }),
    [states, runCheck, runAll, runningAll, passCount, observations, copySummary, lite],
  );

  return (
    <RunAllContext.Provider value={value}>
      {/* sticky mini-bar during RUN ALL — warm ground, accent live indicator */}
      {runningAll && (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-ground">
          <div className="mx-auto flex max-w-[var(--page-max)] items-center gap-3 px-5 py-2">
            <span className="status-icon status-running text-xs">running</span>
            <span className="mono text-xs text-ink-soft">
              {passCount}/{CHECK_SLUGS.length} passing…
            </span>
          </div>
        </div>
      )}
      {/* polite announcements for every state change */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
      {children}
    </RunAllContext.Provider>
  );
}
