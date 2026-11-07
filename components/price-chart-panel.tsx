"use client";

import { useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CatalogPricePoint } from "@/lib/catalog";
import { historyStats, usd } from "@/lib/utils";

type RangeKey = "1m" | "3m" | "max";

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "1m", label: "1 Month", days: 30 },
  { key: "3m", label: "3 Month", days: 90 },
  { key: "max", label: "Max", days: null },
];

type SeriesPoint = { price: number; ts: number };

function buildSeries(history: CatalogPricePoint[]): SeriesPoint[] {
  return history.map((point) => ({
    price: point.price,
    ts: new Date(point.timestamp).getTime(),
  }));
}

/** Hold flat runs, then ease into the next price so spikes look soft. */
function softenSteps(points: SeriesPoint[]): SeriesPoint[] {
  if (points.length < 2) return points;
  const out: SeriesPoint[] = [{ ...points[0]! }];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    if (prev.price === cur.price) {
      out.push({ ...cur });
      continue;
    }
    const gap = Math.max(cur.ts - prev.ts, 86_400_000);
    out.push({ ts: prev.ts + gap * 0.72, price: prev.price });
    out.push({
      ts: prev.ts + gap * 0.86,
      price: prev.price + (cur.price - prev.price) * 0.35,
    });
    out.push({
      ts: prev.ts + gap * 0.94,
      price: prev.price + (cur.price - prev.price) * 0.78,
    });
    out.push({ ...cur });
  }
  return out;
}

function formatAxisPrice(value: number) {
  if (value >= 1000) {
    const k = value / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${Math.round(value)}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: number | string;
}) {
  if (!active || !payload?.length) return null;
  const price = Number(payload[0]?.value);
  const when = new Date(Number(label)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-left shadow-sm">
      <p className="text-xs text-stone-500">{when}</p>
      <p className="mt-0.5 text-sm font-semibold text-stone-900">{usd(price)}</p>
    </div>
  );
}

export function PriceChartPanel({
  history,
  priceStatus,
}: {
  history: CatalogPricePoint[];
  priceStatus?: "low" | "typical" | "high" | null;
}) {
  const gradientId = `priceFill-${useId().replace(/:/g, "")}`;
  const [range, setRange] = useState<RangeKey>("max");
  const full = useMemo(() => buildSeries(history), [history]);

  const filtered = useMemo(() => {
    const selected = RANGES.find((r) => r.key === range);
    if (!selected?.days) return full;
    const cutoff = Date.now() - selected.days * 24 * 60 * 60 * 1000;
    const sliced = full.filter((r) => r.ts >= cutoff);
    return sliced.length ? sliced : full;
  }, [full, range]);

  const rows = useMemo(() => softenSteps(filtered), [filtered]);
  const stats = historyStats(filtered.map((r) => r.price));
  const yMax = Math.max(stats.max * 1.15, stats.max + 1, 1);
  const tickCount = Math.min(8, Math.max(4, Math.ceil(filtered.length / 12)));

  if (!history.length) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">
            Price History
          </h2>
          {priceStatus ? (
            <p className="mt-0.5 text-xs text-stone-500">
              Currently {priceStatus}
            </p>
          ) : null}
        </div>
        <div className="inline-flex rounded-xl bg-stone-100 p-1">
          {RANGES.map((item) => {
            const active = item.key === range;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setRange(item.key)}
                className={
                  active
                    ? "rounded-lg bg-[#ece7ff] px-3 py-1.5 text-xs font-semibold text-[#5b4bb7] ring-1 ring-[#d4c9ff]"
                    : "rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={rows}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={0.55} />
                <stop offset="42%" stopColor="#fbbf24" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#a7f3d0" stopOpacity={0.42} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => {
                const d = new Date(Number(value));
                return d.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                });
              }}
              tickCount={tickCount}
              tick={{ fill: "#a8a29e", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              width={48}
              domain={[0, yMax]}
              tickFormatter={formatAxisPrice}
              tick={{ fill: "#a8a29e", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />
            <Tooltip
              cursor={{ stroke: "#d6d3d1", strokeDasharray: "4 4" }}
              content={<ChartTooltip />}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#ef4444"
              strokeWidth={1.75}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-stone-500">Low</dt>
          <dd className="font-medium">{usd(stats.min)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Average</dt>
          <dd className="font-medium">{usd(Math.round(stats.avg))}</dd>
        </div>
        <div>
          <dt className="text-stone-500">High</dt>
          <dd className="font-medium">{usd(stats.max)}</dd>
        </div>
      </dl>
    </div>
  );
}
