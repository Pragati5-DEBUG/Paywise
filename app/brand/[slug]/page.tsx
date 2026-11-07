import Link from "next/link";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogResults } from "@/components/catalog-results";
import { browseBrand, parseListFilters } from "@/lib/catalog";

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const filters = parseListFilters(sp);
  const listFilters = { ...filters, pageToken: undefined };
  const result = await browseBrand(slug, listFilters);

  if (result.products.length === 0 && result.source === "seed" && !result.note) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p>No products for this brand.</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-stone-500">
        <Link href="/" className="underline">
          Home
        </Link>{" "}
        / Brand
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{result.title}</h1>
      {result.description ? (
        <p className="mt-2 line-clamp-3 text-stone-600">{result.description}</p>
      ) : null}
      <p className="mt-2 text-sm text-stone-500">
        US stores
      </p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <CatalogFilters
            initialMin={filters.minPrice}
            initialMax={filters.maxPrice}
            initialInStock={filters.inStockOnly}
          />
        </Suspense>
      </div>

      {result.note ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {result.note}
        </p>
      ) : null}

      {result.products.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">No products match these filters.</p>
      ) : (
        <CatalogResults
          key={[filters.minPrice, filters.maxPrice, filters.inStockOnly].join(":")}
          kind="brand"
          slug={slug}
          initialProducts={result.products}
          initialNextPageToken={result.nextPageToken}
          filters={{
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            inStockOnly: filters.inStockOnly,
          }}
        />
      )}
    </main>
  );
}
