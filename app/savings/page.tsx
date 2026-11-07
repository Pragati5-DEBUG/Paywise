import Link from "next/link";
import { getDealSnapshot } from "@/lib/deal-store";
import { usd } from "@/lib/utils";

export default async function SavingsPage() {
  const { purchases, alerts, timings, watchlist } = await getDealSnapshot();
  const spent = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const completed = purchases.filter((p) =>
    /COMPLETED|CAPTURED|APPROVED/i.test(p.status),
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Savings dashboard</h1>
      <p className="mt-2 text-stone-600">
        Live Paywise activity — checkouts, alerts, AI timings, and watchlist.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 p-5">
          <p className="text-sm text-stone-500">Checkout total</p>
          <p className="mt-2 text-3xl font-semibold">{usd(spent)}</p>
          <p className="mt-1 text-xs text-stone-500">
            {purchases.length} order{purchases.length === 1 ? "" : "s"} · {completed} completed
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 p-5">
          <p className="text-sm text-stone-500">Price alerts</p>
          <p className="mt-2 text-3xl font-semibold">{alerts.length}</p>
          <p className="mt-1 text-xs text-stone-500">Saved from product pages</p>
        </div>
        <div className="rounded-2xl border border-stone-200 p-5">
          <p className="text-sm text-stone-500">AI timings + watchlist</p>
          <p className="mt-2 text-3xl font-semibold">
            {timings.length}
            <span className="text-xl font-normal text-stone-400"> / {watchlist.length}</span>
          </p>
          <p className="mt-1 text-xs text-stone-500">Timing reads · watched items</p>
        </div>
      </div>
      <p className="mt-6 text-sm text-stone-500">
        See{" "}
        <Link href="/wallet" className="underline">
          Wallet
        </Link>{" "}
        for payments and{" "}
        <Link href="/watchlist" className="underline">
          Watchlist
        </Link>{" "}
        for the deal calendar.
      </p>
    </main>
  );
}
