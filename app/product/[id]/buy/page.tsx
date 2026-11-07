import Image from "next/image";
import Link from "next/link";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { getCatalogProduct, offerLabel, lowestOfferPrice } from "@/lib/catalog";
import { usd } from "@/lib/utils";

function one(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function stockLabel(value: string) {
  const key = value.replace(/[\s_-]/g, "").toLowerCase();
  if (key === "instock") return "In stock";
  if (key === "outofstock") return "Out of stock";
  if (key === "limitedavailability" || key === "preorder") return "Limited";
  if (!value || key === "unknown") return "Not listed";
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default async function ProductBuyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const store = one(sp.store)?.trim() || "";
  const cancelled = one(sp.cancelled) === "1";

  const { product, note } = await getCatalogProduct(id);

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p>Product not found.</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">
          Back home
        </Link>
      </main>
    );
  }

  const sorted = [...product.offers].sort((a, b) => a.price - b.price);
  const lowest = sorted[0]?.price ?? 0;
  const cheapestMerchant = sorted[0]?.merchant ?? "";
  const offer =
    sorted.find((o) => o.merchant === store || o.domain === store) ??
    sorted.find((o) => o.merchant.includes(store) || o.domain.includes(store)) ??
    null;

  if (!store || !offer) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-stone-700">Pick a store offer from the product page.</p>
        <Link
          href={`/product/${product.id}`}
          className="mt-3 inline-block text-sm underline"
        >
          Back to {product.title}
        </Link>
      </main>
    );
  }

  const low = lowestOfferPrice(product);
  const compared = offerLabel(offer.price, lowest, cheapestMerchant);
  const stock = stockLabel(offer.availability || "");
  const inStock = stock === "In stock";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-stone-500">
        <Link href={`/product/${product.id}`} className="underline">
          {product.title}
        </Link>
        {" · "}
        Checkout on Paywise
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-2 text-stone-600">
        You selected <span className="font-medium text-stone-900">{offer.merchant}</span>.
        Payment stays on Paywise.
      </p>

      {cancelled ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Checkout was cancelled. You can try again below.
        </p>
      ) : null}

      {note ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {note}
        </p>
      ) : null}

      <div className="mt-8 grid items-start gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-contain p-3"
              sizes="180px"
              unoptimized
            />
          ) : null}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-stone-500">{product.brand}</p>
            <span
              className={
                inStock
                  ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                  : "rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
              }
            >
              {stock}
            </span>
            <span
              className={
                compared === "Lowest"
                  ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                  : "rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
              }
            >
              {compared}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-medium leading-snug">{product.title}</h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{usd(offer.price)}</p>
          <p className="mt-1 text-sm text-stone-500">
            {offer.merchant}
            {low != null && low !== offer.price ? ` · lowest elsewhere ${usd(low)}` : ""}
          </p>

          <div className="mt-6">
            <PayPalCheckoutButton
              productId={product.id}
              merchant={offer.merchant}
              amount={offer.price}
              currency={offer.currency || "USD"}
              title={product.title}
            />
          </div>

          {offer.buyUrl && offer.buyUrl !== "#" ? (
            <p className="mt-4 text-xs text-stone-400">
              Prefer the merchant site?{" "}
              <a
                href={offer.buyUrl}
                className="underline"
                rel="noreferrer"
                target="_blank"
              >
                Open {offer.merchant} listing
              </a>
              {" "}(leaves Paywise)
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
