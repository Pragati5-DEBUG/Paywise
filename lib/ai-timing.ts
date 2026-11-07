import { upsertTiming } from "@/lib/deal-store";
import type { StoredTiming } from "@/lib/deal-types";

export type TimingInput = {
  productId: string;
  title: string;
  brand?: string;
  currentPrice: number;
  history: number[];
};

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function rulesTiming(input: TimingInput): Omit<StoredTiming, "id" | "createdAt"> {
  const { history, currentPrice, title, productId } = input;
  const recent = history.slice(-30);
  const min = recent.length ? Math.min(...recent) : currentPrice;
  const max = recent.length ? Math.max(...recent) : currentPrice;
  const avg =
    recent.length > 0
      ? recent.reduce((s, n) => s + n, 0) / recent.length
      : currentPrice;
  const nearLow = currentPrice <= min * 1.03;
  const elevated = currentPrice >= avg * 1.08;

  let verdict: StoredTiming["verdict"] = "wait";
  let confidence: StoredTiming["confidence"] = "medium";
  let summary = "";
  let from = addDays(0);
  let to = addDays(7);

  if (nearLow) {
    verdict = "buy_now";
    confidence = currentPrice <= min ? "high" : "medium";
    summary = `${title} is near its recent low ($${min.toFixed(2)}–$${max.toFixed(2)} window). Buying soon is reasonable.`;
    from = addDays(0);
    to = addDays(3);
  } else if (elevated) {
    verdict = "set_alert";
    confidence = "medium";
    summary = `Price looks elevated vs the ~$${avg.toFixed(2)} recent average. Set an alert below $${(avg * 0.95).toFixed(2)}.`;
    from = addDays(5);
    to = addDays(14);
  } else {
    verdict = "wait";
    confidence = "low";
    summary = `Price is mid-range. A better window may open in the next 1–2 weeks around $${min.toFixed(2)}–$${avg.toFixed(2)}.`;
    from = addDays(4);
    to = addDays(12);
  }

  return {
    productId,
    title,
    verdict,
    confidence,
    summary,
    windowFrom: isoDay(from),
    windowTo: isoDay(to),
    currentPrice,
    source: "rules",
  };
}

async function anthropicTiming(
  input: TimingInput,
): Promise<Omit<StoredTiming, "id" | "createdAt"> | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const recent = input.history.slice(-45);
  const prompt = `You are Paywise's US shopping timing assistant. Return ONLY compact JSON with keys:
verdict ("buy_now"|"wait"|"set_alert"), confidence ("low"|"medium"|"high"), summary (1-2 sentences), windowDaysFrom (int 0-21), windowDaysTo (int 1-30, > from).
Product: ${input.title}
Brand: ${input.brand || "unknown"}
Current USD price: ${input.currentPrice}
Recent daily prices (oldest→newest): ${JSON.stringify(recent)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]) as {
    verdict?: StoredTiming["verdict"];
    confidence?: StoredTiming["confidence"];
    summary?: string;
    windowDaysFrom?: number;
    windowDaysTo?: number;
  };

  const fromDays = Math.max(0, Number(parsed.windowDaysFrom) || 0);
  let toDays = Math.max(fromDays + 1, Number(parsed.windowDaysTo) || fromDays + 5);
  if (toDays > 30) toDays = 30;

  const verdict =
    parsed.verdict === "buy_now" ||
    parsed.verdict === "wait" ||
    parsed.verdict === "set_alert"
      ? parsed.verdict
      : "wait";

  return {
    productId: input.productId,
    title: input.title,
    verdict,
    confidence:
      parsed.confidence === "low" ||
      parsed.confidence === "medium" ||
      parsed.confidence === "high"
        ? parsed.confidence
        : "medium",
    summary: (parsed.summary || "").trim() || rulesTiming(input).summary,
    windowFrom: isoDay(addDays(fromDays)),
    windowTo: isoDay(addDays(toDays)),
    currentPrice: input.currentPrice,
    source: "anthropic",
  };
}

/** Compute + persist AI buy timing for a product (Anthropic if key set, else rules). */
export async function generateAndStoreTiming(input: TimingInput) {
  let payload: Omit<StoredTiming, "id" | "createdAt">;
  try {
    payload = (await anthropicTiming(input)) ?? rulesTiming(input);
  } catch {
    payload = rulesTiming(input);
  }
  return upsertTiming(payload);
}
