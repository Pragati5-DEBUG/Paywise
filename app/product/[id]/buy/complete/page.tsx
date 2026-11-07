import Link from "next/link";
import { CapturePayPalReturn } from "@/components/capture-paypal-return";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BuyCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const orderId = one(sp.token) || one(sp.orderId) || "";
  const store = one(sp.store) || "";
  const title = one(sp.title) || "";
  const amount = Number(one(sp.amount) || "");
  const currency = one(sp.currency) || "USD";

  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Finishing payment…</h1>
      <p className="mt-3 text-stone-600">
        Confirming your payment on Paywise
        {store ? ` for ${store}` : ""}.
      </p>
      {orderId ? (
        <CapturePayPalReturn
          orderId={orderId}
          productId={id}
          store={store}
          title={title}
          amount={Number.isFinite(amount) ? amount : undefined}
          currency={currency}
        />
      ) : (
        <p className="mt-6 text-sm text-amber-800">
          Missing payment token.{" "}
          <Link href={`/product/${id}`} className="underline">
            Back to product
          </Link>
        </p>
      )}
    </main>
  );
}
