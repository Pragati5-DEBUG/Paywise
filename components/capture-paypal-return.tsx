"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CapturePayPalReturn({
  orderId,
  productId,
  store,
  title,
  amount,
  currency,
}: {
  orderId: string;
  productId: string;
  store: string;
  title?: string;
  amount?: number;
  currency?: string;
}) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    const cacheKey = `dealpilot-capture:${orderId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setStatus("ok");
        setDetail(cached);
        return;
      }
    } catch {
      /* ignore */
    }

    // Intentionally no abort-on-cleanup: Strict Mode would cancel the first
    // request and leave this screen stuck on "Capturing…". Capture is idempotent.
    void (async () => {
      try {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            productId,
            merchant: store,
            title,
            amount,
            currency,
          }),
        });
        const data = (await res.json()) as { status?: string; error?: string };
        if (!res.ok) throw new Error(data.error || "Capture failed");
        const next = data.status || "COMPLETED";
        try {
          sessionStorage.setItem(cacheKey, next);
        } catch {
          /* ignore */
        }
        setStatus("ok");
        setDetail(next);
      } catch (err) {
        setStatus("error");
        setDetail(err instanceof Error ? err.message : "Capture failed");
      }
    })();
  }, [orderId, productId, store, title, amount, currency]);

  if (status === "loading") {
    return <p className="mt-6 text-sm text-stone-500">Capturing payment…</p>;
  }

  if (status === "error") {
    return (
      <div className="mt-6 space-y-3">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {detail}
        </p>
        <Link
          href={`/product/${productId}/buy?store=${encodeURIComponent(store)}`}
          className="inline-block text-sm underline"
        >
          Try checkout again
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
        Payment {detail}. Saved in your Paywise wallet.
      </p>
      <div className="flex justify-center gap-4 text-sm">
        <Link href={`/product/${productId}`} className="underline">
          Back to product
        </Link>
        <Link href="/wallet" className="underline">
          View wallet
        </Link>
        <Link href="/watchlist" className="underline">
          Deal calendar
        </Link>
      </div>
    </div>
  );
}
