export type DealEventKind = "alert" | "buy_window" | "paypal";

export type DealCalendarEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  resourceId: string;
  eventColor: string;
  productId: string;
  dealKind: DealEventKind;
};

export type DealCalendarResource = {
  id: string;
  name: string;
  eventColor: string;
};

export function hrefForDealEvent(event: {
  dealKind?: DealEventKind;
  productId?: string;
}) {
  if (!event.productId) return "/watchlist";
  return `/product/${encodeURIComponent(event.productId)}`;
}
