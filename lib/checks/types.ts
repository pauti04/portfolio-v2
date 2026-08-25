export type LogLine = { t: number; text: string; tone?: "muted" | "ok" | "warn" | "err" };
export type CheckResult = {
  pass: boolean;
  mode: "live" | "recorded" | "build";
  metrics: { label: string; value: string }[];   // e.g. {label:"ops/sec", value:"1.18M"}
  summary: string;                                // one dry sentence
};
export type CheckRunner = (opts: { lite?: boolean; signal?: AbortSignal;
  onLog: (l: LogLine) => void }) => Promise<CheckResult>;
