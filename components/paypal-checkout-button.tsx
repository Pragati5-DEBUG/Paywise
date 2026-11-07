"use client";

import { useState } from "react";
import { usd } from "@/lib/utils";

type Props = {
  productId: string;
  merchant: string;
  amount: number;
  currency?: string;
  title: string;
};

export function PayPalCheckoutButton({
  productId,
  merchant,
  amount,
  currency = "USD",
  title,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          merchant,
          amount,
          currency,
          title,
        }),
      });
      const data = (await res.json()) as {
        approveUrl?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.approveUrl) {
        throw new Error(data.error || data.detail || "Could not start checkout");
      }
      window.location.assign(data.approveUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending || amount <= 0}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#ffc439] px-4 py-3.5 text-base font-bold text-[#003087] shadow-sm hover:bg-[#f5b400] disabled:opacity-60"
      >
        {pending ? "Starting checkout…" : `Pay ${amount > 0 ? usd(amount) : ""}`}
      </button>
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-stone-500">
        Sandbox only (USD). Sign in with a <span className="font-medium">US Personal</span> sandbox
        buyer, not a live account.
      </p>
    </div>
  );
}
