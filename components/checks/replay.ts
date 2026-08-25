// ----------------------------------------------------------------------------
// Shared stub core: replays a check's lib/verification.json entry as
// mode:"recorded", streaming a few log lines. Real implementations replace
// the per-check run() with live execution; this file can then be deleted.
// ----------------------------------------------------------------------------

import type { CheckResult, CheckRunner, LogLine } from "@/lib/checks/types";
import verification from "@/lib/verification.json";

type VerificationFile = { builtAt: string; results: Record<string, CheckResult> };
const data = verification as VerificationFile;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function makeRecordedRunner(
  slug: string,
  lines: Omit<LogLine, "t">[],
): CheckRunner {
  return async ({ lite, signal, onLog }) => {
    const t0 = Date.now();
    for (const line of lines) {
      if (!lite && !signal?.aborted) await sleep(240);
      onLog({ t: Date.now() - t0, ...line });
    }
    const rec = data.results[slug];
    if (!rec) {
      return {
        pass: false,
        mode: "recorded",
        metrics: [],
        summary: `no build-verification entry for ${slug}`,
      };
    }
    return { ...rec, mode: "recorded" };
  };
}
