"use client";

import { FormEvent, useState } from "react";
import { usd } from "@/lib/utils";

export function SetAlertBox({
  productId,
  title,
  currentPrice,
}: {
  productId: string;
  title: string;
  currentPrice: number;
}) {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [emailNote, setEmailNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watching = currentPrice > 0 ? currentPrice : null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    setError(null);
    setEmailNote(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          title,
          currentPrice: watching,
          currency: "USD",
          email: email.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        email?: { ok?: boolean; skipped?: boolean; error?: string };
      };
      if (!res.ok) throw new Error(data.error || "Could not save alert");
      setSaved(true);
      if (data.email?.ok) setEmailNote("Confirmation emailed.");
      else if (data.email?.skipped)
        setEmailNote("Alert saved. Email is not configured.");
      else if (data.email?.error)
        setEmailNote(`Alert saved; email failed (${data.email.error.slice(0, 80)}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save alert");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="font-medium">Price alert</h2>
      <p className="mt-1 text-sm text-stone-500">
        {watching
          ? `Watching ${usd(watching)}. We check once a day and email you whenever it drops.`
          : "We check once a day and email you whenever the price drops."}{" "}
        Buying the product removes the alert.
      </p>
      <div className="mt-4 space-y-2">
        <input
          aria-label="Email for the price drop"
          type="email"
          required
          className="h-11 w-full rounded-full border border-stone-200 px-4 outline-none focus:ring-2 focus:ring-stone-900"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email for the price drop"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-full bg-stone-900 px-5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Saving…" : "Set alert"}
        </button>
      </div>
      {saved ? (
        <p className="mt-3 text-sm text-emerald-800" role="status">
          Alert saved. We email you when the daily check finds a lower price.
        </p>
      ) : null}
      {emailNote ? <p className="mt-2 text-sm text-stone-600">{emailNote}</p> : null}
      {error ? <p className="mt-3 text-sm text-amber-800">{error}</p> : null}
    </form>
  );
}
