export type StoredAlert = {
  id: string;
  productId: string;
  title: string;
  /** Older alerts stored a user-typed target. New alerts do not ask for one. */
  targetPrice?: number;
  currency: string;
  createdAt: string;
  remindAt: string;
  email?: string;
  emailSentAt?: string | null;
  /** Lowest offer seen on the last daily check. */
  lastPrice?: number | null;
  lastCheckedAt?: string | null;
  /** Price we last emailed about. */
  notifiedPrice?: number | null;
};

export type StoredWatchItem = {
  id: string;
  productId: string;
  title: string;
  brand: string;
  imageUrl: string | null;
  lowestPrice: number | null;
  addedAt: string;
};

export type StoredTiming = {
  id: string;
  productId: string;
  title: string;
  verdict: "buy_now" | "wait" | "set_alert";
  confidence: "low" | "medium" | "high";
  summary: string;
  windowFrom: string;
  windowTo: string;
  currentPrice: number;
  source: "anthropic" | "rules";
  createdAt: string;
};

export type StoredPurchase = {
  id: string;
  productId: string;
  title: string;
  merchant: string;
  amount: number;
  currency: string;
  orderId: string;
  status: string;
  paidAt: string;
};
