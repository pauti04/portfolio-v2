"use client";

// CHK-02 · Bourse — price-time-priority order book matched in this tab.
// run() seeds a book, fires a burst of orders through the real matching
// engine (a TypeScript port of the v1 logic), checks the book invariants,
// and reports ops/sec measured on the visitor's hardware.

import { useSyncExternalStore, type CSSProperties } from "react";
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
      ? `${fmtInt(total)} orders matched in this tab at ${fmtOps(opsPerSec)} ops/sec. The book stayed sorted and uncrossed.`
      : `Book invariant violated after ${fmtInt(total)} orders — see the report lines.`,
  };
  return result;
};

/* ------------------------------------------------------------------ visual */
// The book, mirrored around its own spread. This is the one demo on the site
// allowed a second and third hue, because in an order book the colour IS the
// data: bid and ask are opposite sides of a trade and every trader on earth
// reads them that way. Both tones are desaturated into the warm palette and
// both clear AA on the well (bid 6.9:1, ask 6.4:1) — and neither ever carries
// meaning alone: the columns are labeled and the sides are mirrored.

const BOOK_TONES = {
  "--bid": "#74a67e",
  "--ask": "#e0736f",
} as CSSProperties;

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
  const buy = side === "buy";
  const tone = buy ? "var(--bid)" : "var(--ask)";
  const w = Math.max(5, (qty / maxQty) * 100);

  const depth = (
    <div className="relative h-5">
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 ${buy ? "right-0" : "left-0"} rounded-[2px]`}
        style={{ width: `${w}%`, background: tone, opacity: 0.16 }}
      />
      <span
        className={`relative block px-1.5 leading-5 tabular-nums ${buy ? "text-right" : "text-left"}`}
        style={{ color: tone }}
      >
        {price.toFixed(2)}
      </span>
    </div>
  );
  const size = (
    <span className={`tabular-nums text-muted ${buy ? "text-left" : "text-right"}`}>
      {qty}
    </span>
  );

  return (
    <li
      className={`grid items-center gap-2 ${buy ? "grid-cols-[2.25rem_1fr]" : "grid-cols-[1fr_2.25rem]"}`}
    >
      {buy ? size : depth}
      {buy ? depth : size}
    </li>
  );
}

function ThroughputPlot({ batches }: { batches: number[] }) {
  if (batches.length === 0) return null;
  const max = Math.max(...batches, 1);
  return (
    <div className="mt-2.5 flex h-10 items-end gap-[3px]" aria-hidden="true">
      {batches.map((b, i) => (
        <div
          key={i}
          className="flex-1"
          style={{
            height: `${Math.max(4, (b / max) * 100)}%`,
            background: "var(--ink-soft)",
            opacity: 0.5,
            borderRadius: "2px 2px 0 0",
          }}
        />
      ))}
    </div>
  );
}

export default function BourseCheck() {
  const view = useSyncExternalStore(subscribeView, getView, getView);
  const maxQty = Math.max(
    1,
    ...view.bids.map(([, q]) => q),
    ...view.asks.map(([, q]) => q),
  );
  const bb = view.bestBid;
  const ba = view.bestAsk;
  const bothSides = bb !== undefined && ba !== undefined;
  const midTxt = bothSides ? ((bb + ba) / 2).toFixed(3) : "—";
  const spreadTxt = bothSides ? (ba - bb).toFixed(2) : "—";

  return (
    <div className="p-4 sm:p-5" style={BOOK_TONES}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
        <span className="mono text-[0.75rem] text-ink">
          price-time priority, matched in this tab
        </span>
        <span className="mono text-[0.6875rem] text-muted">
          {view.ran ? "after the burst" : "seeded book, not yet run"}
        </span>
      </div>

      {/* the book, mirrored around the spread */}
      <div className="mono mt-4 grid grid-cols-2 gap-x-5 text-xs sm:gap-x-8">
        <div>
          <div className="mono grid grid-cols-[2.25rem_1fr] gap-2 text-[0.625rem] tracking-[0.16em] text-muted uppercase">
            <span>qty</span>
            <span className="text-right" style={{ color: "var(--bid)" }}>
              bid
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {view.bids.length === 0 && <li className="text-muted">empty</li>}
            {view.bids.map(([p, q]) => (
              <BookRow key={`b-${p}`} price={p} qty={q} maxQty={maxQty} side="buy" />
            ))}
          </ul>
        </div>
        <div>
          <div className="mono grid grid-cols-[1fr_2.25rem] gap-2 text-[0.625rem] tracking-[0.16em] text-muted uppercase">
            <span style={{ color: "var(--ask)" }}>ask</span>
            <span className="text-right">qty</span>
          </div>
          <ul className="mt-2 space-y-1">
            {view.asks.length === 0 && <li className="text-right text-muted">empty</li>}
            {view.asks.map(([p, q]) => (
              <BookRow key={`a-${p}`} price={p} qty={q} maxQty={maxQty} side="sell" />
            ))}
          </ul>
        </div>
      </div>

      {/* the spread — the one number the whole book exists to produce */}
      <div className="mono mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule pt-3 text-[0.75rem]">
        <span className="text-[0.625rem] tracking-[0.16em] text-muted uppercase">best</span>
        <span className="tabular-nums" style={{ color: "var(--bid)" }}>
          {bb !== undefined ? bb.toFixed(2) : "—"}
        </span>
        <span className="text-muted">/</span>
        <span className="tabular-nums" style={{ color: "var(--ask)" }}>
          {ba !== undefined ? ba.toFixed(2) : "—"}
        </span>
        <span className="tabular-nums text-muted">
          spread {spreadTxt} · mid {midTxt}
        </span>
      </div>

      {/* what the burst measured, here, on this machine */}
      {view.ran && (
        <div className="mt-5 border-t border-rule pt-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-[2.375rem] leading-none tracking-tight tabular-nums text-ink">
              {fmtOps(view.opsPerSec)}
            </span>
            <span className="text-[0.875rem] text-ink-soft">ops/sec on this device</span>
          </div>
          <p className="mono mt-2 text-[0.6875rem] tabular-nums text-muted">
            {fmtInt(view.orders)} orders in {view.workMs.toFixed(1)} ms, {fmtInt(view.matched)}{" "}
            of them matched. Matching work only, yields excluded.
          </p>

          {view.batches.length > 0 && (
            <figure className="mt-4">
              <figcaption className="mono text-[0.6875rem] text-muted">
                throughput per batch of {fmtInt(2500)} orders
              </figcaption>
              <ThroughputPlot batches={view.batches} />
            </figure>
          )}

          <ol className="mt-5 space-y-1.5 border-t border-rule-soft pt-3.5">
            {view.invariants.map((inv, i) => (
              <li
                key={inv.name}
                className="mono grid grid-cols-[1.5rem_1fr] items-baseline gap-x-2 text-[0.75rem]"
              >
                <span className="tabular-nums text-muted">{i + 1}.</span>
                <span
                  className={`status-icon status-${inv.ok ? "pass" : "fail"} text-[0.75rem]`}
                >
                  {inv.name} — {inv.ok ? "holds" : "violated"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="mt-4 max-w-[62ch] text-[0.8125rem] leading-relaxed text-muted">
        The engine running here is a TypeScript port of the Rust matcher, so this number
        is the browser&apos;s, not the release build&apos;s.
      </p>
    </div>
  );
}
