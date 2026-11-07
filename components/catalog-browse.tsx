"use client";

import { useState, useTransition } from "react";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters } from "@/components/catalog-filters";
import type { CatalogProduct } from "@/lib/catalog";

type BrowseKind = "category" | "brand";

export function CatalogBrowse({
  kind,
  slug,
  initialProducts,
  initialNextPageToken,
  initialMin,
  initialMax,
  initialInStock,
}: {
  kind: BrowseKind;
  slug: string;
  initialProducts: CatalogProduct[];
  initialNextPageToken?: string | null;
  initialMin?: number;
  initialMax?: number;
  initialInStock?: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [nextToken, setNextToken] = useState(initialNextPageToken ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    if (!nextToken) return;
    startTransition(async () => {
      setError(null);
      const params = new URLSearchParams({
        kind,
        slug,
        page: nextToken,
      });
      if (initialMin != null) params.set("min", String(initialMin));
      if (initialMax != null) params.set("max", String(initialMax));
      if (initialInStock) params.set("stock", "1");
      try {
        const res = await fetch(`/api/catalog/browse?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load more");
        const data = (await res.json()) as {
          products: CatalogProduct[];
          nextPageToken: string | null;
          note?: string;
        };
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.products.filter((p) => !seen.has(p.id))];
        });
        setNextToken(data.nextPageToken);
        if (data.note) setError(data.note);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load more");
      }
    });
  }

  return (
    <div>
      <CatalogFilters
        initialMin={initialMin}
        initialMax={initialMax}
        initialInStock={initialInStock}
      />

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-stone-500">No products match these filters.</p>
      ) : (
        <>
          <p className="mt-6 mb-4 text-sm text-stone-500">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {nextToken ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={pending}
                className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:border-stone-500 disabled:opacity-60"
              >
                {pending ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      )}
      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
    </div>
  );
}
