import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog";
import { getDealSnapshot } from "@/lib/deal-store";
import { usd } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const lower = message.toLowerCase();
    const snapshot = await getDealSnapshot();

    if (/alert|watchlist|calendar/.test(lower)) {
      return NextResponse.json({
        reply: `You have ${snapshot.alerts.length} alert(s), ${snapshot.watchlist.length} watchlist item(s), and ${snapshot.timings.length} AI buy window(s). Open Watchlist to see the calendar.`,
      });
    }

    if (/paypal|wallet|purchase|paid|cashback/.test(lower)) {
      const total = snapshot.purchases.reduce((s, p) => s + p.amount, 0);
      return NextResponse.json({
        reply:
          snapshot.purchases.length === 0
            ? "No checkouts on Paywise yet. Buy from a product offers row to record one in Wallet."
            : `You've completed ${snapshot.purchases.length} Paywise checkout(s), totaling about ${usd(total)}. See Wallet for history.`,
      });
    }

    const query = message
      .replace(/best|good|time|buy|under|\$|usd|should i|is it/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

    if (query.length >= 3) {
      const { products } = await searchCatalog(query, { limit: 5 });
      if (!products.length) {
        return NextResponse.json({
          reply: `I couldn't find products for “${query}”. Try a shorter name like “sony headphones”.`,
        });
      }
      const lines = products.slice(0, 3).map((p, i) => {
        const low = p.offers.length
          ? Math.min(...p.offers.map((o) => o.price))
          : null;
        return `${i + 1}. ${p.title} — ${low == null ? "see offers" : usd(low)} (/product/${p.id})`;
      });
      return NextResponse.json({
        reply: `Top matches:\n${lines.join("\n")}\nOpen a product for AI timing and checkout.`,
      });
    }

    return NextResponse.json({
      reply:
        "Ask me to search products (e.g. “sony headphones”), or ask about alerts, watchlist, or purchases.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 },
    );
  }
}
