import { promises as fs } from "fs";
import path from "path";
import type {
  StoredAlert,
  StoredPurchase,
  StoredTiming,
  StoredWatchItem,
} from "@/lib/deal-types";

export type {
  StoredAlert,
  StoredPurchase,
  StoredTiming,
  StoredWatchItem,
} from "@/lib/deal-types";

type DealStoreFile = {
  alerts: StoredAlert[];
  timings: StoredTiming[];
  purchases: StoredPurchase[];
  watchlist: StoredWatchItem[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "deals.json");

const emptyStore = (): DealStoreFile => ({
  alerts: [],
  timings: [],
  purchases: [],
  watchlist: [],
});

async function ensureStore(): Promise<DealStoreFile> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<DealStoreFile>;
    return {
      alerts: parsed.alerts ?? [],
      timings: parsed.timings ?? [],
      purchases: parsed.purchases ?? [],
      watchlist: parsed.watchlist ?? [],
    };
  } catch {
    const store = emptyStore();
    await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
    return store;
  }
}

async function writeStore(store: DealStoreFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function listAlerts() {
  return (await ensureStore()).alerts;
}

export async function createAlert(input: {
  productId: string;
  title: string;
  currentPrice?: number | null;
  currency?: string;
  remindAt?: string;
  email?: string;
}) {
  const store = await ensureStore();
  const remind =
    input.remindAt ||
    isoDay(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const previous = store.alerts.find((a) => a.productId === input.productId);
  const baseline =
    typeof input.currentPrice === "number" &&
    Number.isFinite(input.currentPrice) &&
    input.currentPrice > 0
      ? input.currentPrice
      : null;
  const alert: StoredAlert = {
    id: previous?.id || id("alert"),
    productId: input.productId,
    title: input.title,
    currency: input.currency || "USD",
    createdAt: previous?.createdAt || new Date().toISOString(),
    remindAt: remind,
    email: input.email?.trim() || undefined,
    emailSentAt: null,
    lastPrice: baseline ?? previous?.lastPrice ?? null,
    lastCheckedAt: baseline ? new Date().toISOString() : (previous?.lastCheckedAt ?? null),
    notifiedPrice: null,
  };
  store.alerts = [alert, ...store.alerts.filter((a) => a.productId !== alert.productId)];
  await writeStore(store);
  return alert;
}

export async function saveAlertCheck(
  alertId: string,
  patch: {
    lastPrice: number;
    lastCheckedAt: string;
    notifiedPrice: number | null;
  },
) {
  const store = await ensureStore();
  const current = store.alerts.find((a) => a.id === alertId);
  if (!current) return;
  store.alerts = store.alerts.map((a) => (a.id === alertId ? { ...a, ...patch } : a));
  await writeStore(store);
}

export async function removeAlertsForProduct(productId: string) {
  const store = await ensureStore();
  const next = store.alerts.filter((a) => a.productId !== productId);
  if (next.length === store.alerts.length) return;
  store.alerts = next;
  await writeStore(store);
}

export async function markAlertEmailSent(alertId: string) {
  const store = await ensureStore();
  store.alerts = store.alerts.map((a) =>
    a.id === alertId ? { ...a, emailSentAt: new Date().toISOString() } : a,
  );
  await writeStore(store);
}

export async function listTimings() {
  return (await ensureStore()).timings;
}

export async function getTimingForProduct(productId: string) {
  const timings = await listTimings();
  return timings.find((t) => t.productId === productId) ?? null;
}

export async function upsertTiming(
  timing: Omit<StoredTiming, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
) {
  const store = await ensureStore();
  const next: StoredTiming = {
    id: timing.id || id("timing"),
    createdAt: timing.createdAt || new Date().toISOString(),
    productId: timing.productId,
    title: timing.title,
    verdict: timing.verdict,
    confidence: timing.confidence,
    summary: timing.summary,
    windowFrom: timing.windowFrom,
    windowTo: timing.windowTo,
    currentPrice: timing.currentPrice,
    source: timing.source,
  };
  store.timings = [next, ...store.timings.filter((t) => t.productId !== next.productId)];
  await writeStore(store);
  return next;
}

export async function listPurchases() {
  return (await ensureStore()).purchases;
}

export async function recordPurchase(input: {
  productId: string;
  title: string;
  merchant: string;
  amount: number;
  currency?: string;
  orderId: string;
  status: string;
  paidAt?: string;
}) {
  const store = await ensureStore();
  if (input.status.toUpperCase() === "COMPLETED") {
    store.alerts = store.alerts.filter((a) => a.productId !== input.productId);
  }
  const existing = store.purchases.find((p) => p.orderId === input.orderId);
  if (existing) {
    await writeStore(store);
    return existing;
  }
  const purchase: StoredPurchase = {
    id: id("pay"),
    productId: input.productId,
    title: input.title,
    merchant: input.merchant,
    amount: input.amount,
    currency: input.currency || "USD",
    orderId: input.orderId,
    status: input.status,
    paidAt: input.paidAt || new Date().toISOString(),
  };
  store.purchases = [purchase, ...store.purchases];
  await writeStore(store);
  return purchase;
}

export async function listWatchlist() {
  return (await ensureStore()).watchlist;
}

export async function addWatchItem(input: {
  productId: string;
  title: string;
  brand: string;
  imageUrl?: string | null;
  lowestPrice?: number | null;
}) {
  const store = await ensureStore();
  const existing = store.watchlist.find((w) => w.productId === input.productId);
  if (existing) {
    const updated: StoredWatchItem = {
      ...existing,
      title: input.title,
      brand: input.brand,
      imageUrl: input.imageUrl ?? existing.imageUrl,
      lowestPrice:
        input.lowestPrice === undefined ? existing.lowestPrice : input.lowestPrice,
    };
    store.watchlist = [
      updated,
      ...store.watchlist.filter((w) => w.productId !== input.productId),
    ];
    await writeStore(store);
    return updated;
  }
  const item: StoredWatchItem = {
    id: id("watch"),
    productId: input.productId,
    title: input.title,
    brand: input.brand,
    imageUrl: input.imageUrl ?? null,
    lowestPrice: input.lowestPrice ?? null,
    addedAt: new Date().toISOString(),
  };
  store.watchlist = [item, ...store.watchlist];
  await writeStore(store);
  return item;
}

export async function removeWatchItem(productId: string) {
  const store = await ensureStore();
  store.watchlist = store.watchlist.filter((w) => w.productId !== productId);
  await writeStore(store);
}

export async function isWatched(productId: string) {
  const list = await listWatchlist();
  return list.some((w) => w.productId === productId);
}

export async function getDealSnapshot() {
  return ensureStore();
}
