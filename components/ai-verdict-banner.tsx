"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogPricePoint } from "@/lib/catalog";
import type { StoredTiming } from "@/lib/deal-types";
import { usd } from "@/lib/utils";

const WINDOWS = [
  { key: "3d", label: "2–3 Days", days: 3 },
  { key: "1w", label: "1 Week", days: 7 },
  { key: "1m", label: "1 Month", days: 30 },
] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

const headlineClass: Record<StoredTiming["verdict"], string> = {
  buy_now: "text-emerald-600",
  wait: "text-amber-600",
  set_alert: "text-stone-800",
};

function rangeOf(prices: number[]) {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  return { min, max, avg };
}

/** Advice for how long the shopper can wait, using only prices inside that window. */
function advise(current: number, prices: number[], days: number) {
  const { min, max, avg } = rangeOf(prices);
  const span = max - min;
  const goodness = span > 0 ? Math.round((1 - (current - min) / span) * 100) : 70;
  const nearLow = current <= min * 1.04;
  const elevated = current >= Math.max(avg * 1.06, min + span * 0.62);

  let verdict: StoredTiming["verdict"] = "wait";
  let headlineText = "Wait before you buy";
  let detailText = "Price is not at a low";

  if (days <= 3) {
    if (nearLow) {
      verdict = "buy_now";
      headlineText = "Go Ahead & Buy now";
      detailText = "Better than prices from the last few days";
    } else if (elevated) {
      verdict = "set_alert";
      headlineText = "Set a price alert";
      detailText = "Unlikely to fall much in 2–3 days";
    } else {
      detailText = "Not a low if you need it in a few days";
    }
  } else if (days <= 7) {
    if (nearLow) {
      verdict = "buy_now";
      headlineText = "Go Ahead & Buy now";
      detailText = "At or below prices from the past week";
    } else if (elevated) {
      detailText = `This week's low was ${usd(min)}`;
    } else {
      detailText = "Mid-range if you can wait a week";
    }
  } else if (nearLow) {
    verdict = "buy_now";
    headlineText = "Go Ahead & Buy now";
    detailText = "Near the low for the past month";
  } else if (current <= avg) {
    detailText = `Month's low was ${usd(min)} — you have time`;
  } else {
    verdict = "set_alert";
    headlineText = "Set a price alert";
    detailText = `Above the month average of ${usd(avg)}`;
  }

  const bump = verdict === "buy_now" ? 6 : verdict === "wait" ? -6 : -12;
  const score = Math.max(0, Math.min(100, goodness + bump));
  return { verdict, headlineText, detailText, score, min, max, avg };
}

const GAUGE_BANDS = ["#f04438", "#f97316", "#f5c518", "#86d96a", "#22a34a"];

/** t = 0 is the left end, t = 1 is the right end, across the top half only. */
function gaugePoint(t: number, radius: number) {
  const angle = Math.PI * (1 - t);
  return {
    x: 110 + radius * Math.cos(angle),
    y: 108 - radius * Math.sin(angle),
  };
}

/** Filled slice of the upper half. Every point stays on or above the baseline. */
function sectorPath(start: number, end: number, outer: number, inner: number) {
  const steps = 16;
  const ring = (from: number, to: number, radius: number) =>
    Array.from({ length: steps + 1 }, (_, index) => {
      const t = from + ((to - from) * index) / steps;
      const point = gaugePoint(t, radius);
      return `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    });
  return `M ${ring(start, end, outer).join(" L ")} L ${ring(end, start, inner).join(" L ")} Z`;
}

function Gauge({ score }: { score: number }) {
  const span = 1 / GAUGE_BANDS.length;
  const gap = 0.014;
  const tip = gaugePoint(score / 100, 62);
  const hub = gaugePoint(0.5, 0);
  const left = gaugePoint(0, 86);
  const right = gaugePoint(1, 86);

  return (
    <svg viewBox="12 14 196 118" className="h-[112px] w-[186px] shrink-0" aria-label={`Buy score ${score} out of 100`}>
      {GAUGE_BANDS.map((color, index) => (
        <path
          key={color}
          d={sectorPath(index * span + gap, (index + 1) * span - gap, 84, 58)}
          fill={color}
        />
      ))}
      <line
        x1={hub.x}
        y1={hub.y}
        x2={tip.x}
        y2={tip.y}
        stroke="#3558d6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={hub.x} cy={hub.y} r="7" fill="#ffffff" stroke="#3558d6" strokeWidth="2.5" />
      <text x={left.x} y={left.y + 14} fill="#57534e" fontSize="13" textAnchor="middle">
        0
      </text>
      <text x={right.x} y={right.y + 14} fill="#57534e" fontSize="13" textAnchor="middle">
        100
      </text>
    </svg>
  );
}

export function AiVerdictBanner({
  productId,
  title,
  brand,
  currentPrice,
  history,
}: {
  productId: string;
  title: string;
  brand?: string;
  currentPrice: number;
  history: CatalogPricePoint[];
}) {
  const [windowKey, setWindowKey] = useState<WindowKey>("3d");

  useEffect(() => {
    const prices = history.map((point) => point.price);
    void fetch("/api/ai/timing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        title,
        brand,
        currentPrice,
        history: prices,
      }),
    }).catch(() => undefined);
  }, [productId, title, brand, currentPrice, history]);

  const selected = WINDOWS.find((item) => item.key === windowKey) ?? WINDOWS[0];
  const view = useMemo(() => {
    const cutoff = Date.now() - selected.days * 24 * 60 * 60 * 1000;
    const inWindow = history.filter(
      (point) => new Date(point.timestamp).getTime() >= cutoff,
    );
    const thin = inWindow.length === 0 && history.length > 0;
    const used = inWindow.length ? inWindow : history;
    const prices = used.map((point) => point.price);
    if (!prices.length) {
      return {
        verdict: "set_alert" as const,
        headlineText: "Set a price alert",
        detailText: "No price history in this window yet",
        score: 40,
        min: currentPrice,
        max: currentPrice,
        avg: currentPrice,
        thin,
        flat: false,
      };
    }
    const advice = advise(currentPrice, prices, selected.days);
    const shorter = history.filter(
      (point) => new Date(point.timestamp).getTime() >= Date.now() - 3 * 24 * 60 * 60 * 1000,
    );
    const flat =
      selected.days > 3 &&
      shorter.length > 0 &&
      Math.min(...shorter.map((point) => point.price)) === advice.min &&
      Math.max(...shorter.map((point) => point.price)) === advice.max;
    return { ...advice, thin, flat };
  }, [currentPrice, history, selected.days]);

  return (
    <section className="bg-white">
      <h2 className="text-xl font-bold tracking-tight text-stone-950">Should you buy now?</h2>
      <div className="mt-3 flex items-center gap-2">
        {WINDOWS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setWindowKey(item.key)}
            className={
              item.key === windowKey
                ? "rounded-full bg-[#e7eeff] px-3 py-1 text-sm font-medium text-[#3558d6]"
                : "px-1 py-1 text-sm text-stone-500"
            }
          >
            {item.label}
          </button>
        ))}
        <span
          title="The gauge and price stats use prices from the window you select."
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-stone-300 text-[10px] text-stone-400"
        >
          i
        </span>
      </div>
      <p className="mt-2 text-sm text-stone-400">
        {selected.key === "3d"
          ? "If you need it in the next few days"
          : selected.key === "1w"
            ? "If you can wait about a week"
            : "If you can wait about a month"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div>
          <Gauge score={view.score} />
          <div className="mt-1 flex gap-3 pl-1 text-xs text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-red-500" /> Bad Time
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500" /> Good Time
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-stone-400">Our Recommendation</p>
          <p className={`mt-1 text-[17px] font-bold leading-tight ${headlineClass[view.verdict]}`}>
            {view.headlineText}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {view.flat
              ? `${view.detailText}. High and low match the last few days.`
              : view.detailText}
          </p>
        </div>
      </div>

      <h3 className="mt-6 text-lg font-bold text-stone-950">Price Stats</h3>
      <p className="mt-1 text-xs text-stone-400">
        {view.thin
          ? "No prices in this window yet, so these use the saved history."
          : selected.key === "3d"
            ? "Last 2–3 days"
            : selected.key === "1w"
              ? "Last 7 days"
              : "Last 30 days"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f4f7fb] px-3 py-4 text-center">
          <p className="text-sm text-stone-500">
            Highest Price <span className="text-red-500">↑</span>
          </p>
          <p className="mt-2 text-lg font-bold text-stone-950">{usd(view.max)}</p>
        </div>
        <div className="rounded-xl bg-[#f4f7fb] px-3 py-4 text-center">
          <p className="text-sm text-stone-500">
            Average Price <span className="text-orange-500">↕</span>
          </p>
          <p className="mt-2 text-lg font-bold text-stone-950">{usd(view.avg)}</p>
        </div>
        <div className="col-span-2 rounded-xl bg-[#f4f7fb] px-3 py-4 text-center">
          <p className="text-sm text-stone-500">
            Lowest Price <span className="text-emerald-500">↓</span>
          </p>
          <p className="mt-2 text-lg font-bold text-stone-950">{usd(view.min)}</p>
        </div>
      </div>
    </section>
  );
}
