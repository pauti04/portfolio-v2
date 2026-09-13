// ----------------------------------------------------------------------------
// Runner registry. Lazy — a runner's module is only imported when its check
// is actually executed, so later, heavier implementations stay off the
// critical path. Later agents replace the stub modules, not this map.
// ----------------------------------------------------------------------------

import type { CheckRunner } from "@/lib/checks/types";
import type { CheckSlug } from "@/lib/claims";

export const loadRunner: Record<CheckSlug, () => Promise<CheckRunner>> = {
  reflight: () => import("./reflight").then((m) => m.run),
  bourse: () => import("./bourse").then((m) => m.run),
  netpulse: () => import("./netpulse").then((m) => m.run),
  costdna: () => import("./costdna").then((m) => m.run),
  chaincheck: () => import("./chaincheck").then((m) => m.run),
  "chaincheck-action": () => import("./chaincheck-action").then((m) => m.run),
  rasoibot: () => import("./rasoibot").then((m) => m.run),
  dispatch: () => import("./dispatch").then((m) => m.run),
};
