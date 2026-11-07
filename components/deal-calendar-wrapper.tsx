"use client";

import dynamic from "next/dynamic";

const DealCalendar = dynamic(
  () => import("@/components/deal-calendar").then((mod) => mod.DealCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[640px] items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm text-stone-500">
        Loading deal calendar…
      </div>
    ),
  },
);

export function DealCalendarWrapper() {
  return <DealCalendar />;
}
