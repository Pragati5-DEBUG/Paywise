import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { StoreLogoRow } from "@/components/store-logos";
import { WhatPaywiseDoes } from "@/components/what-paywise-does";
import { searchCatalog, trendingCatalog } from "@/lib/catalog";
import { categories } from "@/lib/seed-data";

export default async function HomePage() {
  const [trending, categoryCards] = await Promise.all([
    trendingCatalog(),
    Promise.all(
      categories.map(async (category) => {
        const result = await searchCatalog(category.channel3Query, { limit: 8 });
        const tablet = result.products.find(
          (product) =>
            product.imageUrl &&
            /tablet|\bipad\b|galaxy tab/i.test(product.title) &&
            !/case|cover|keyboard|folio|sleeve|charger|stand/i.test(product.title),
        );
        const imageUrl =
          (category.slug === "electronics" ? tablet?.imageUrl : null) ??
          result.products.find((product) => product.imageUrl)?.imageUrl ??
          null;
        return { ...category, imageUrl };
      }),
    ),
  ]);

  return (
    <main>
      <section className="border-b border-stone-100 bg-[radial-gradient(ellipse_at_top,_#f8fafc_0%,_#ffffff_55%)]">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:pt-24">
          <p className="mb-4 text-sm font-medium tracking-wide text-stone-500">Paywise</p>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Find the right price. Know when to buy.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-600 sm:text-lg">
            Compare US store offers, track drops, and get an AI timing read before you checkout.
          </p>
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <SearchBar large />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Trending drops</h2>
            <p className="mt-1 text-sm text-stone-500">
              US store prices, ready to compare
            </p>
          </div>
          <Link href="/search?q=headphones" className="text-sm text-stone-600 hover:underline">
            Search headphones
          </Link>
        </div>
        {trending.note ? (
          <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {trending.note}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trending.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-stone-100 bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Popular categories</h2>
          <p className="mt-1 text-sm text-stone-500">
            Browse US stores, then check out here.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categoryCards.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white hover:border-stone-400"
              >
                <div className="relative aspect-[4/3] bg-stone-50">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 1024px) 50vw, 20vw"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="font-medium">{category.name}</p>
                  <p className="mt-1 text-sm text-stone-500">{category.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WhatPaywiseDoes />

      <section className="border-y border-stone-100">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-xs font-medium tracking-[0.18em] text-stone-400">
            SUPPORTED STORES
          </h2>
          <StoreLogoRow />
        </div>
      </section>

    </main>
  );
}
