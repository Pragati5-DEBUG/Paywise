import { getDealSnapshot } from "@/lib/deal-store";
import type {
  StoredAlert,
  StoredPurchase,
  StoredTiming,
} from "@/lib/deal-types";
import type {
  DealCalendarEvent,
  DealCalendarResource,
} from "@/lib/deal-timeline-shared";
import { usd } from "@/lib/utils";

export type {
  DealCalendarEvent,
  DealCalendarResource,
  DealEventKind,
} from "@/lib/deal-timeline-shared";
export { hrefForDealEvent } from "@/lib/deal-timeline-shared";

function isoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function shortTitle(title: string) {
  return title.length > 36 ? `${title.slice(0, 34)}…` : title;
}

function nextDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return isoDay(d);
}

function alertEvent(alert: StoredAlert): DealCalendarEvent {
  return {
    id: alert.id,
    name: `Alert · ${shortTitle(alert.title)}`,
    startDate: alert.remindAt,
    endDate: nextDay(alert.remindAt),
    allDay: true,
    resourceId: "alerts",
    eventColor: "blue",
    productId: alert.productId,
    dealKind: "alert",
  };
}

function timingEvent(timing: StoredTiming): DealCalendarEvent {
  const end =
    timing.windowTo > timing.windowFrom
      ? timing.windowTo
      : nextDay(timing.windowFrom);
  return {
    id: timing.id,
    name: `AI · ${timing.verdict.replace("_", " ")} · ${shortTitle(timing.title)}`,
    startDate: timing.windowFrom,
    endDate: end,
    allDay: true,
    resourceId: "buy",
    eventColor: "orange",
    productId: timing.productId,
    dealKind: "buy_window",
  };
}

function purchaseEvent(purchase: StoredPurchase): DealCalendarEvent {
  const day = purchase.paidAt.slice(0, 10);
  return {
    id: purchase.id,
    name: `Paid · ${shortTitle(purchase.title)} (${usd(purchase.amount)})`,
    startDate: day,
    endDate: nextDay(day),
    allDay: true,
    resourceId: "paypal",
    eventColor: "green",
    productId: purchase.productId,
    dealKind: "paypal",
  };
}

/** Calendar feed from saved alerts, AI timings, and PayPal purchases only. */
export async function buildDealTimeline() {
  const { alerts, timings, purchases } = await getDealSnapshot();
  const resources: DealCalendarResource[] = [
    { id: "alerts", name: "Price alerts", eventColor: "blue" },
    { id: "buy", name: "AI buy windows", eventColor: "orange" },
    { id: "paypal", name: "Checkouts", eventColor: "green" },
  ];

  const events: DealCalendarEvent[] = [
    ...alerts.map(alertEvent),
    ...timings.map(timingEvent),
    ...purchases.map(purchaseEvent),
  ];

  return {
    resources,
    events,
    date: isoDay(),
    counts: {
      alerts: alerts.length,
      timings: timings.length,
      purchases: purchases.length,
    },
  };
}
