"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  hrefForDealEvent,
  type DealCalendarEvent,
  type DealCalendarResource,
  type DealEventKind,
} from "@/lib/deal-timeline-shared";

import "@bryntum/calendar/fontawesome/css/fontawesome.css";
import "@bryntum/calendar/fontawesome/css/solid.css";
import "@bryntum/calendar/calendar.css";
import "@bryntum/calendar/svalbard-light.css";

function fieldOf(
  record: { get?: (name: string) => unknown; data?: Record<string, unknown> },
  name: string,
) {
  try {
    const value = record.get?.(name);
    if (value != null && value !== "") return value;
  } catch {
    /* Bryntum throws if the field was not declared. */
  }
  return record.data?.[name];
}

type TimelinePayload = {
  resources: DealCalendarResource[];
  events: DealCalendarEvent[];
  date: string;
  counts: { alerts: number; timings: number; purchases: number };
};

export function DealCalendar() {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [timeline, setTimeline] = useState<TimelinePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/deals/timeline");
        const data = (await res.json()) as TimelinePayload & { error?: string };
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load timeline");
        setTimeline(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load timeline");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[640px] items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm text-stone-500">
        Loading deal calendar…
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {error || "Timeline unavailable"}
      </div>
    );
  }

  if (!timeline.events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <p className="font-medium text-stone-900">No deal events yet</p>
        <p className="mt-2 text-sm text-stone-600">
          Set a price alert, open a product for AI timing, or complete a
          checkout — those show up here. No demo events.
        </p>
        <p className="mt-3 text-xs text-stone-400">
          Alerts {timeline.counts.alerts} · AI windows {timeline.counts.timings} ·
          Checkouts {timeline.counts.purchases}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500">
        Live feed · alerts {timeline.counts.alerts} · AI windows{" "}
        {timeline.counts.timings} · checkouts {timeline.counts.purchases}
      </p>
      <div className="deal-calendar h-[640px] w-full overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div ref={hostRef} className="h-full w-full" />
      </div>
      <CalendarMount hostRef={hostRef} timeline={timeline} router={router} onError={setError} />
    </div>
  );
}

function CalendarMount({
  hostRef,
  timeline,
  router,
  onError,
}: {
  hostRef: RefObject<HTMLDivElement | null>;
  timeline: TimelinePayload;
  router: ReturnType<typeof useRouter>;
  onError: (message: string) => void;
}) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let destroyed = false;
    let calendar: { destroy: () => void } | null = null;

    void import("@bryntum/calendar")
      .then(({ Calendar }) => {
        if (destroyed || !host.isConnected) return;
        calendar = new Calendar({
          appendTo: host,
          date: timeline.date,
          height: "100%",
          mode: "month",
          modes: {
            day: true,
            week: true,
            month: true,
            year: false,
            agenda: true,
          },
          readOnly: true,
          autoCreate: false,
          resources: timeline.resources,
          events: timeline.events,
          sidebar: {
            items: {
              datePicker: { weight: 100 },
              resourceFilter: { weight: 200 },
            },
          },
          features: {
            eventEdit: false,
            eventMenu: false,
            scheduleMenu: false,
            eventTooltip: true,
          },
          listeners: {
            eventClick({
              eventRecord,
            }: {
              eventRecord: {
                id?: unknown;
                name?: string;
                get?: (name: string) => unknown;
                data?: Record<string, unknown>;
              };
            }) {
              const productId = String(
                fieldOf(eventRecord, "productId") || eventRecord.id || "",
              );
              const dealKind = fieldOf(eventRecord, "dealKind") as DealEventKind | undefined;
              router.push(hrefForDealEvent({ productId, dealKind }));
            },
          },
        });
      })
      .catch((err: unknown) => {
        if (!destroyed) {
          onError(err instanceof Error ? err.message : "Calendar failed to start");
        }
      });

    return () => {
      destroyed = true;
      calendar?.destroy();
      host.replaceChildren();
    };
  }, [hostRef, onError, router, timeline]);

  return null;
}
