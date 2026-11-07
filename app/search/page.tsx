import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { cacheGet } from "@/lib/cache";
import {
  getCatalogProduct,
  lookupByUrl,
  searchCatalog,
  type CatalogProduct,
} from "@/lib/catalog";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; image?: string; ids?: string; token?: string }>;
}) {
  const { q = "", ids = "", token = "" } = await searchParams;
  const trimmed = q.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);

  let products: CatalogProduct[] = [];
  let note: string | undefined;
  let heading = "Search";

  if (token) {
    const cached = cacheGet<CatalogProduct[]>(`image-search:${token}`);
    products = cached ?? [];
    heading = "Photo results";
    if (!products.length) note = "That photo search expired. Upload again.";
  } else if (ids) {
    const list = ids.split(",").filter(Boolean).slice(0, 24);
    const loaded = await Promise.all(list.map((id) => getCatalogProduct(id)));
    products = loaded.map((r) => r.product).filter((p): p is CatalogProduct => p != null);
    heading = "Photo results";
  } else if (isUrl) {
    const result = await lookupByUrl(trimmed);
    note = result.note;
    heading = "URL lookup";
    if (result.product) products = [result.product];
  } else if (trimmed) {
    const result = await searchCatalog(trimmed);
    products = result.products;
    note = result.note;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
      <div className="mt-6 max-w-2xl">
        <SearchBar initialQuery={isUrl ? "" : trimmed} />
      </div>
      <div className="mt-8">
        {note ? (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {note}
          </p>
        ) : null}

        {!trimmed && !ids && !token ? (
          <p className="text-sm text-stone-500">
            Try “sony headphones”, paste an Amazon/Nike product URL, or upload a photo.
          </p>
        ) : products.length === 0 ? (
          <p className="text-sm text-stone-500">No products found.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-stone-500">
              {products.length} result{products.length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
      <Link href="/" className="mt-8 inline-block text-sm underline">
        Back home
      </Link>
    </main>
  );
}
