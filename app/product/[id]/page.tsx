import Image from "next/image";
import Link from "next/link";
import { AiVerdictBanner } from "@/components/ai-verdict-banner";
import { ChatPanel } from "@/components/chat-panel";
import { OffersGrid } from "@/components/offers-grid";
import { PriceChartPanel } from "@/components/price-chart-panel";
import { ProductCard } from "@/components/product-card";
import { SetAlertBox } from "@/components/set-alert-box";
import { VariantSelector } from "@/components/variant-selector";
import { WatchlistButton } from "@/components/watchlist-button";
import {
  findSimilarProducts,
  getCatalogProduct,
  lowestOfferPrice,
} from "@/lib/catalog";
import { usd } from "@/lib/utils";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const selectedOptions: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (!key.startsWith("option_")) continue;
    const label = Array.isArray(value) ? value[0] : value;
    if (label) selectedOptions[key.slice("option_".length)] = label;
  }

  const { product, note } = await getCatalogProduct(
    id,
    Object.keys(selectedOptions).length ? selectedOptions : undefined,
  );

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p>Product not found.</p>
        {note ? <p className="mt-2 text-sm text-stone-500">{note}</p> : null}
        <Link href="/" className="mt-3 inline-block text-sm underline">
          Back home
        </Link>
      </main>
    );
  }

  const low = lowestOfferPrice(product);
  const similarResult = await findSimilarProducts(product.id, 6);
  const similar = similarResult.products;

  const brandHref = `/brand/${encodeURIComponent(
    product.brand.toLowerCase().replace(/\s+/g, "-"),
  )}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-stone-500">
        <Link href={brandHref} className="underline hover:text-stone-800">
          {product.brand}
        </Link>
        {" · "}
        {product.category}
      </p>

      {note ? (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {note}
        </p>
      ) : null}

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 items-start gap-6 sm:grid-cols-[minmax(180px,260px)_minmax(0,1fr)]">
          <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-3xl border border-stone-200 bg-white sm:mx-0 sm:max-w-none">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                priority
                className="object-contain p-4"
                sizes="260px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-sm text-stone-400">
                No product photo
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{product.title}</h1>
            <p className="mt-2 line-clamp-4 text-stone-600">{product.description}</p>
            <p className="mt-4 text-2xl font-semibold">
              {low == null ? "See offers" : usd(low)}
            </p>
            <p className="text-sm text-stone-500">Lowest offer price</p>

            <WatchlistButton
              productId={product.id}
              title={product.title}
              brand={product.brand}
              imageUrl={product.imageUrl}
              lowestPrice={low}
            />

            {product.variants?.length ? (
              <VariantSelector
                productId={product.id}
                options={product.variants}
                selected={product.selectedVariant}
              />
            ) : null}
          </div>
        </div>
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:row-span-2 lg:self-start">
          {low != null ? (
            <AiVerdictBanner
              productId={product.id}
              title={product.title}
              brand={product.brand}
              currentPrice={low}
              history={product.history}
            />
          ) : null}
          <SetAlertBox
            productId={product.id}
            title={product.title}
            currentPrice={low ?? 0}
          />
        </aside>
        <div className="min-w-0 space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-medium">Offers</h2>
          <OffersGrid productId={product.id} offers={product.offers} />
        </section>

        {product.history.length ? (
          <PriceChartPanel
            history={product.history}
            priceStatus={product.priceStatus}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-sm text-stone-500">
            No price history yet for this product. Tracking is on, and points
            show up as prices are recorded (up to 90 days).
          </p>
        )}

        {similarResult.note && !similar.length ? (
          <p className="text-sm text-stone-500">{similarResult.note}</p>
        ) : null}

        {similar.length ? (
          <section>
            <h2 className="mb-3 text-lg font-medium">Similar products</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {similar.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}

        <ChatPanel />
        </div>
      </div>
    </main>
  );
}
