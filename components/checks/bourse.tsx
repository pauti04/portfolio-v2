"use client";

// CHK-02 · Bourse — price-time-priority order book matched in this tab.
// run() seeds a book, fires a burst of orders through the real matching
// engine (a TypeScript port of the v1 logic), checks the book invariants,
// and reports ops/sec measured on the visitor's hardware.

import { useSyncExternalStore } from "react";
import type { CheckResult, CheckRunner, LogLine } from "@/lib/checks/types";

/* ------------------------------------------------------------------ engine */

type Side = "buy" | "sell";
type Order = { id: number; side: Side; price: number; qty: number };

class Book {
  bids: Order[] = [];
  asks: Order[] = [];
  nextId = 1;
  matchedOrders = 0;

  submit(side: Side, price: number, qty: number): number {
    const order: Order = { id: this.nextId++, side, price, qty };
    let filled = 0;
    const opposite = side === "buy" ? this.asks : this.bids;
    const own = side === "buy" ? this.bids : this.asks;

    while (order.qty > 0 && opposite.length > 0) {
      const best = opposite[0];
      const crosses =
        side === "buy" ? order.price >= best.price : order.price <= best.price;
      if (!crosses) break;
      const tradeQty = Math.min(order.qty, best.qty);
      filled += tradeQty;
      order.qty -= tradeQty;
      best.qty -= tradeQty;
      if (best.qty === 0) opposite.shift();
    }

    if (order.qty > 0) {
      const idx =
        side === "buy"
          ? own.findIndex((o) => o.price < order.price)
          : own.findIndex((o) => o.price > order.price);
      if (idx === -1) own.push(order);
      else own.splice(idx, 0, order);
    }

    if (filled > 0) this.matchedOrders++;
    return filled;
  }

  bestBid(): number | undefined {
    return this.bids[0]?.price;
  }
  bestAsk(): number | undefined {
    return this.asks[0]?.price;
  }

  depth(side: Side, levels: number): [number, number][] {
    const arr = side === "buy" ? this.bids : this.asks;
    const map = new Map<number, number>();
    for (const o of arr) map.set(o.price, (map.get(o.price) || 0) + o.qty);
    return Array.from(map.entries()).slice(0, levels);
  }
}

function seedBook(book: Book) {
  const mid = 100.5;
  for (let i = 1; i <= 6; i++) {
    book.submit("buy", +(mid - i * 0.01).toFixed(2), 2 + ((i * 7) % 9));
    book.submit("sell", +(mid + i * 0.01).toFixed(2), 2 + ((i * 13) % 9));
  }
}

type Invariant = { name: string; ok: boolean };

function checkInvariants(book: Book): Invariant[] {
  const bidsSorted = book.bids.every(
    (o, i) => i === 0 || o.price <= book.bids[i - 1].price,
  );
  const asksSorted = book.asks.every(
    (o, i) => i === 0 || o.price >= book.asks[i - 1].price,
  );
  const bb = book.bestBid();
  const ba = book.bestAsk();
  const uncrossed = bb === undefined || ba === undefined || bb < ba;
  const qtyPositive =
    book.bids.every((o) => o.qty > 0) && book.asks.every((o) => o.qty > 0);
  return [
    { name: "bids sorted high → low", ok: bidsSorted },
    { name: "asks sorted low → high", ok: asksSorted },
    { name: "book uncrossed (best bid < best ask)", ok: uncrossed },
    { name: "no zero-quantity resting orders", ok: qtyPositive },
  ];
}

/* ------------------------------------------------------------------- store */

type BourseView = {
  ran: boolean;
  bids: [number, number][];
  asks: [number, number][];
  bestBid?: number;
  bestAsk?: number;
  orders: number;
  matched: number;
  workMs: number;
  opsPerSec: number;
  batches: number[]; // ops/sec per batch, for the spark plot
  invariants: Invariant[];
};

const SEED_VIEW: BourseView = (() => {
  const b = new Book();
  seedBook(b);
  return {
    ran: false,
    bids: b.depth("buy", 4),
    asks: b.depth("sell", 4),
    bestBid: b.bestBid(),
    bestAsk: b.bestAsk(),
    orders: 0,
    matched: 0,
    workMs: 0,
    opsPerSec: 0,
    batches: [],
    invariants: [],
  };
})();

let viewState: BourseView = SEED_VIEW;
const viewSubs = new Set<() => void>();
const setView = (v: BourseView) => {
  viewState = v;
  viewSubs.forEach((f) => f());
};
const subscribeView = (f: () => void) => {
  viewSubs.add(f);
  return () => {
    viewSubs.delete(f);
  };
};
const getView = () => viewState;

/* ----------------------------------------------------------------- helpers */

const fmtInt = (n: number) => n.toLocaleString("en-US");
const fmtOps = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${Math.round(n / 1e3)}k`;
const yieldToBrowser = () => new Promise<void>((r) => setTimeout(r, 0));

/* --------------------------------------------------------------------- run */

export const run: CheckRunner = async ({ lite, signal, onLog }) => {
  const t0 = performance.now();
  const log = (text: string, tone?: LogLine["tone"]) =>
    onLog({ t: Math.round(performance.now() - t0), text, tone });
  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException("check aborted", "AbortError");
  };

  const book = new Book();
  seedBook(book);
  log("seeding book · 6 bid levels · 6 ask levels", "muted");

  const total = lite ? 10_000 : 50_000;
  const CHUNK = 2_500;
  log(`burst: ${fmtInt(total)} orders · price-time priority · this tab`, "muted");

  let mid = 100.5;
  let submitted = 0;
  let workMs = 0;
  let nextProgress = 0.5;
  const batches: number[] = [];

  while (submitted < total) {
    throwIfAborted();
    const n = Math.min(CHUNK, total - submitted);
    const c0 = performance.now();
    for (let j = 0; j < n; j++) {
      const side: Side = Math.random() > 0.5 ? "buy" : "sell";
      const aggro = Math.random();
      let px: number;
      if (aggro > 0.7) {
        px =
          side === "buy"
            ? (book.bestAsk() ?? mid + 0.01) + Math.floor(Math.random() * 3) * 0.01
            : (book.bestBid() ?? mid - 0.01) - Math.floor(Math.random() * 3) * 0.01;
      } else {
        const off = (Math.floor(Math.random() * 5) + 1) * 0.01;
        px = side === "buy" ? mid - off : mid + off;
      }
      const qty = 1 + Math.floor(Math.random() * 6);
      book.submit(side, +px.toFixed(2), qty);
      mid = ((book.bestBid() ?? mid) + (book.bestAsk() ?? mid)) / 2;
    }
    const dt = performance.now() - c0;
    workMs += dt;
    batches.push((n / Math.max(dt, 0.001)) * 1000);
    submitted += n;
    if (submitted / total >= nextProgress && submitted < total) {
      log(
        `… ${fmtInt(submitted)} submitted · ${fmtInt(book.matchedOrders)} matched`,
        "muted",
      );
      nextProgress += 0.5;
    }
    await yieldToBrowser();
  }

  const opsPerSec = Math.round((total / Math.max(workMs, 0.001)) * 1000);
  const invariants = checkInvariants(book);
  for (const inv of invariants) {
    log(`assert ${inv.name}`, inv.ok ? "ok" : "err");
  }
  const pass = invariants.every((i) => i.ok);
  log(
    `${fmtInt(total)} orders in ${workMs.toFixed(1)} ms · ${fmtOps(opsPerSec)} ops/sec on this device (matching work only, yields excluded)`,
    pass ? "ok" : "err",
  );

  setView({
    ran: true,
    bids: book.depth("buy", 4),
    asks: book.depth("sell", 4),
    bestBid: book.bestBid(),
    bestAsk: book.bestAsk(),
    orders: total,
    matched: book.matchedOrders,
    workMs,
    opsPerSec,
    batches,
    invariants,
  });

  const result: CheckResult = {
    pass,
    mode: "live",
    metrics: [
      { label: "ops/sec", value: fmtOps(opsPerSec) },
      { label: "orders", value: fmtInt(total) },
      { label: "orders matched", value: fmtInt(book.matchedOrders) },
      { label: "book invariants", value: pass ? "hold" : "violated" },
    ],
    summary: pass
      ? `${fmtInt(total)} orders matched in this tab at ${fmtOps(opsPerSec)} ops/sec; the book stayed sorted and uncrossed.`
      : `Book invariant violated after ${fmtInt(total)} orders — see the report lines.`,
  };
  return result;
};

/* ------------------------------------------------------------------ visual */

function BookRow({
  price,
  qty,
  maxQty,
  side,
}: {
  price: number;
  qty: number;
  maxQty: number;
  side: Side;
}) {
  const w = Math.max(4, (qty / maxQty) * 100);
  return (
    <div className="grid grid-cols-[1fr_2.5rem] items-center gap-2">
      <div className="relative h-4">
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 ${side === "buy" ? "right-0" : "left-0"} opacity-15`}
          style={{ width: `${w}%`, background: "var(--ink-soft)" }}
        />
        <span className={`relative text-ink-soft ${side === "sell" ? "" : "float-right"}`}>
          {price.toFixed(2)}
        </span>
      </div>
      <span className="text-muted">{qty}</span>
    </div>
  );
}

function ThroughputSpark({ batches }: { batches: number[] }) {
  if (batches.length === 0) return null;
  const max = Math.max(...batches, 1);
  const bw = 4;
  const width = batches.length * bw;
  return (
    <svg
      viewBox={`0 0 ${width} 26`}
      className="h-6 w-full max-w-[16rem]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="25.5" x2={width} y2="25.5" stroke="var(--line)" strokeWidth="1" />
      {batches.map((b, i) => {
        const h = Math.max(1.5, (b / max) * 22);
        return (
          <rect
            key={i}
            x={i * bw + 0.5}
            y={25 - h}
            width={bw - 1}
            height={h}
            fill="var(--ink-soft)"
            opacity="0.75"
          />
        );
      })}
    </svg>
  );
}

export default function BourseCheck() {
  const view = useSyncExternalStore(subscribeView, getView, getView);
  const maxQty = Math.max(
    1,
    ...view.bids.map(([, q]) => q),
    ...view.asks.map(([, q]) => q),
  );
  const midTxt =
    view.bestBid !== undefined && view.bestAsk !== undefined
      ? ((view.bestBid + view.bestAsk) / 2).toFixed(3)
      : "—";
  const spreadTxt =
    view.bestBid !== undefined && view.bestAsk !== undefined
      ? (view.bestAsk - view.bestBid).toFixed(2)
      : "—";

  return (
    <div className="mono p-4 text-xs">
      <div className="grid grid-cols-2 gap-x-6">
        <div>
          <div className="mb-2 italic text-muted">
            bids{view.ran ? " · after burst" : ""}
          </div>
          <div className="space-y-1">
            {view.bids.length === 0 && <div className="text-muted">empty</div>}
            {view.bids.map(([p, q]) => (
              <BookRow key={`b-${p}`} price={p} qty={q} maxQty={maxQty} side="buy" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-right italic text-muted">
            {view.ran ? "after burst · " : ""}asks
          </div>
          <div className="space-y-1">
            {view.asks.length === 0 && <div className="text-right text-muted">empty</div>}
            {view.asks.map(([p, q]) => (
              <BookRow key={`a-${p}`} price={p} qty={q} maxQty={maxQty} side="sell" />
            ))}
          </div>
        </div>
      </div>

      {view.ran && (
        <ol className="mt-3 space-y-1 border-t border-line pt-2.5">
          {view.invariants.map((inv, i) => (
            <li key={inv.name} className="grid grid-cols-[1.25rem_1rem_1fr] gap-x-1.5">
              <span className="text-muted">{i + 1}.</span>
              <span aria-hidden="true" className="text-ink">
                {inv.ok ? "✓" : "✗"}
              </span>
              <span className={inv.ok ? "text-ink-soft" : "font-medium text-ink"}>
                assert {inv.name} — {inv.ok ? "holds" : "violated"}
              </span>
            </li>
          ))}
          <li className="grid grid-cols-[1.25rem_1rem_1fr] gap-x-1.5">
            <span className="text-muted">{view.invariants.length + 1}.</span>
            <span aria-hidden="true" className="text-ink">
              →
            </span>
            <span className="text-ink-soft">
              observe {fmtInt(view.orders)} orders in {view.workMs.toFixed(1)} ms →{" "}
              {fmtOps(view.opsPerSec)} ops/sec, this device
            </span>
          </li>
        </ol>
      )}

      {view.ran && view.batches.length > 0 && (
        <div className="mt-3 border-t border-line pt-2.5">
          <div className="mb-1 italic text-muted">
            throughput per batch of {fmtInt(2500)} orders
          </div>
          <ThroughputSpark batches={view.batches} />
        </div>
      )}

      <div className="mt-3 border-t border-line pt-2 text-muted">
        mid {midTxt} · spread {spreadTxt} · price-time priority, in-tab engine
        {view.ran ? ` · ${fmtInt(view.matched)} of ${fmtInt(view.orders)} orders matched` : ""}
      </div>
    </div>
  );
}
