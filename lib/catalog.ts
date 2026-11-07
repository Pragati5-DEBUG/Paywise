import { cached } from "@/lib/cache";
import { getChannel3, hasChannel3Key } from "@/lib/channel3";
import { categories as seedCategories } from "@/lib/seed-data";
import { usd } from "@/lib/utils";
import type { Channel3Api } from "@channel3/sdk";

export type CatalogOffer = {
  merchant: string;
  domain: string;
  price: number;
  currency: string;
  availability: string;
  deliveryCost: number | null;
  buyUrl: string;
  isCloseMatch: boolean;
  condition?: string | null;
};

export type CatalogVariantValue = {
  label: string;
  exists: boolean;
  available: string | null;
  thumbnailUrl: string | null;
  productId: string | null;
};

export type CatalogVariantOption = {
  name: string;
  values: CatalogVariantValue[];
};

export type CatalogPricePoint = {
  timestamp: string;
  price: number;
  currency: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  description: string;
  offers: CatalogOffer[];
  variants: CatalogVariantOption[] | null;
  selectedVariant: Record<string, string> | null;
  source: "channel3" | "seed";
  /** Real Channel3 price-tracking points only — never synthetic. */
  history: CatalogPricePoint[];
  priceStatus?: "low" | "typical" | "high" | null;
};

export type CatalogListFilters = {
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  pageToken?: string;
  limit?: number;
};

export type CatalogListResult = {
  products: CatalogProduct[];
  source: "channel3" | "seed";
  nextPageToken?: string | null;
  note?: string;
  title: string;
  description?: string | null;
};

function mapOffers(offers?: Channel3Api.ProductOffer[]): CatalogOffer[] {
  if (!offers?.length) return [];
  const mapped: CatalogOffer[] = [];
  for (const offer of offers) {
    const price = offer.price?.price;
    if (typeof price !== "number" || !Number.isFinite(price)) continue;
    const domain = offer.domain || "store";
    mapped.push({
      merchant: domain.replace(/^www\./, ""),
      domain,
      price,
      currency: offer.price?.currency || "USD",
      availability: offer.availability || "Unknown",
      deliveryCost: null,
      buyUrl: offer.url || "#",
      isCloseMatch: false,
      condition: offer.condition ?? null,
    });
  }
  return mapped.sort((a, b) => a.price - b.price);
}

function mapVariants(variants?: Channel3Api.Variants | null): {
  variants: CatalogVariantOption[] | null;
  selected: Record<string, string> | null;
} {
  if (!variants?.options?.length) return { variants: null, selected: null };
  return {
    variants: variants.options.map((opt) => ({
      name: opt.name,
      values: (opt.values ?? []).map((val) => ({
        label: val.label,
        exists: val.exists !== false,
        available: val.available ?? null,
        thumbnailUrl: val.thumbnail_url ?? null,
        productId: val.product_id ?? null,
      })),
    })),
    selected:
      variants.selected?.reduce<Record<string, string>>((acc, s) => {
        acc[s.name] = s.label;
        return acc;
      }, {}) ?? null,
  };
}

function mapChannel3Product(
  product: Channel3Api.Product,
  history: CatalogPricePoint[] = [],
  priceStatus: CatalogProduct["priceStatus"] = null,
): CatalogProduct {
  const brand = product.brands?.[0]?.name || "Brand";
  const category = product.category?.title || product.category?.slug || "Catalog";
  const imageUrl =
    product.images?.find((img) => img.is_main_image)?.cleaned_url ||
    product.images?.find((img) => img.is_main_image)?.url ||
    product.images?.[0]?.cleaned_url ||
    product.images?.[0]?.url ||
    null;
  const { variants, selected } = mapVariants(product.variants);
  const offers = mapOffers(product.offers);
  return {
    id: product.id,
    slug: product.id,
    title: product.title,
    brand,
    category,
    imageUrl,
    description:
      product.description?.trim() ||
      `${brand} · compared across US stores`,
    offers,
    variants,
    selectedVariant: selected,
    source: "channel3",
    history,
    priceStatus,
  };
}

function toPricePoints(
  points: Channel3Api.PriceHistoryPoint[] | undefined,
): CatalogPricePoint[] {
  if (!points?.length) return [];
  return points
    .map((p) => ({
      timestamp:
        p.timestamp instanceof Date
          ? p.timestamp.toISOString()
          : new Date(p.timestamp).toISOString(),
      price: Number(p.price),
      currency: p.currency || "USD",
    }))
    .filter((p) => Number.isFinite(p.price))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/** Live Channel3 price history (max 90 days). Starts tracking if needed. */
export async function fetchChannel3PriceHistory(
  productId: string,
  days = 90,
): Promise<{
  history: CatalogPricePoint[];
  priceStatus: CatalogProduct["priceStatus"];
}> {
  if (!hasChannel3Key()) return { history: [], priceStatus: null };

  return cached(
    `price-history:${productId}:${days}`,
    async () => {
      const client = getChannel3();
      try {
        await client.priceTracking.start({ canonical_product_id: productId });
      } catch {
        /* already active or unavailable — still try history */
      }
      try {
        const res = await client.priceTracking.retrieveHistory({
          canonical_product_id: productId,
          days,
        });
        return {
          history: toPricePoints(res.history),
          priceStatus: res.statistics?.current_status ?? null,
        };
      } catch {
        return { history: [], priceStatus: null };
      }
    },
    30 * 60 * 1000,
  );
}

export function offerLabel(price: number, lowest: number, cheapestMerchant: string) {
  if (price === lowest) return "Lowest";
  const diff = Math.round((price - lowest) * 100) / 100;
  const pct = Math.round(((price - lowest) / lowest) * 100);
  if (lowest > 0 && diff < lowest * 0.08) {
    return `${usd(diff)} higher than ${cheapestMerchant}`;
  }
  return `${pct}% higher`;
}

export function lowestOfferPrice(product: CatalogProduct) {
  if (!product.offers.length) return null;
  return Math.min(...product.offers.map((o) => o.price));
}

function buildSearchFilters(
  filters?: CatalogListFilters,
): Channel3Api.SearchFilters | undefined {
  if (!filters) return undefined;
  const out: Channel3Api.SearchFilters = {};
  if (filters.minPrice != null || filters.maxPrice != null) {
    out.price = {
      min_price: filters.minPrice ?? null,
      max_price: filters.maxPrice ?? null,
    };
  }
  if (filters.inStockOnly) {
    out.availability = ["InStock"];
  }
  return Object.keys(out).length ? out : undefined;
}

export async function searchCatalog(
  query: string,
  filters?: CatalogListFilters,
): Promise<{
  products: CatalogProduct[];
  source: "channel3" | "seed";
  note?: string;
  nextPageToken?: string | null;
}> {
  const q = query.trim();
  if (!q) {
    return { products: [], source: hasChannel3Key() ? "channel3" : "seed" };
  }

  if (!hasChannel3Key()) {
    return {
      products: [],
      source: "seed",
      note: "Live US prices are unavailable right now.",
    };
  }

  try {
    const searchFilters = buildSearchFilters(filters);
    const limit = filters?.limit ?? 24;
    const cacheKey = [
      "search",
      q.toLowerCase(),
      filters?.minPrice ?? "",
      filters?.maxPrice ?? "",
      filters?.inStockOnly ? "1" : "0",
      filters?.pageToken ?? "",
      limit,
    ].join(":");
    const page = await cached(cacheKey, async () => {
      return getChannel3().products.search({
        query: q,
        limit,
        filters: searchFilters,
        page_token: filters?.pageToken,
      });
    });
    const products = (page.data ?? []).map((product) => mapChannel3Product(product));
    return {
      products,
      source: "channel3",
      nextPageToken: page.response?.next_page_token ?? null,
    };
  } catch (error) {
    return {
      products: [],
      source: "channel3",
      note: `Search failed (${error instanceof Error ? error.message : "error"}).`,
    };
  }
}

export async function lookupByUrl(url: string): Promise<{
  product: CatalogProduct | null;
  source: "channel3" | "seed";
  note?: string;
}> {
  if (!hasChannel3Key()) {
    return {
      product: null,
      source: "seed",
      note: "Shop-link lookup is unavailable right now.",
    };
  }
  try {
    const data = await cached(`lookup:${url}`, async () => {
      const client = getChannel3();
      return client.products.lookup({ url });
    });
    return { product: mapChannel3Product(data.product), source: "channel3" };
  } catch (error) {
    return {
      product: null,
      source: "seed",
      note: `URL lookup failed (${error instanceof Error ? error.message : "error"}).`,
    };
  }
}

export async function searchByImageBase64(base64: string): Promise<{
  products: CatalogProduct[];
  source: "channel3" | "seed";
  note?: string;
}> {
  if (!hasChannel3Key()) {
    return {
      products: [],
      source: "seed",
      note: "Photo search is unavailable right now.",
    };
  }
  try {
    const page = await getChannel3().products.searchByImage({
      base64_image: base64,
      limit: 24,
    });
    return {
      products: (page.data ?? []).map((product) => mapChannel3Product(product)),
      source: "channel3",
    };
  } catch (error) {
    return {
      products: [],
      source: "seed",
      note: `Image search failed (${error instanceof Error ? error.message : "error"}).`,
    };
  }
}

export async function getCatalogProduct(
  id: string,
  selectedOptions?: Record<string, string>,
): Promise<{
  product: CatalogProduct | null;
  note?: string;
}> {
  if (!hasChannel3Key()) {
    return {
      product: null,
      note: "This product is unavailable right now.",
    };
  }

  try {
    const optionKey = selectedOptions
      ? Object.entries(selectedOptions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join("&")
      : "";
    const [raw, priceHist] = await Promise.all([
      cached(
        `product:${id}:${optionKey}`,
        async () => {
          const client = getChannel3();
          return client.products.retrieve({
            product_id: id,
            country: "US",
            language: "en",
            currency: "USD",
            selected_options: selectedOptions,
          });
        },
        30 * 60 * 1000,
      ),
      fetchChannel3PriceHistory(id, 90),
    ]);
    const product = mapChannel3Product(
      raw,
      priceHist.history,
      priceHist.priceStatus,
    );
    const note =
      product.history.length === 0
        ? "No price history yet. Tracking is on, and the chart fills as prices are recorded."
        : undefined;
    return { product, note };
  } catch (error) {
    return {
      product: null,
      note: error instanceof Error ? error.message : "Product not found",
    };
  }
}

export async function trendingCatalog(): Promise<{
  products: CatalogProduct[];
  source: "channel3" | "seed";
  note?: string;
}> {
  if (!hasChannel3Key()) {
    return {
      products: [],
      source: "seed",
      note: "Live US prices are unavailable right now.",
    };
  }
  const result = await searchCatalog("wireless headphones");
  return {
    products: result.products.slice(0, 4),
    source: result.source,
    note: result.note,
  };
}

async function resolveCategorySlug(slug: string, fallbackQuery: string) {
  return cached(`category-resolve:${slug}`, async () => {
    const client = getChannel3();
    try {
      const category = await client.categories.retrieve({ slug });
      return {
        slug: category.slug,
        title: category.title,
        description: category.description ?? null,
      };
    } catch {
      const found = await client.categories.search({
        query: fallbackQuery || slug,
        limit: 5,
      });
      const hit = found.categories?.[0];
      if (!hit) return null;
      return {
        slug: hit.slug,
        title: hit.title,
        description: null,
      };
    }
  });
}

async function resolveBrand(slug: string) {
  const query = slug.replace(/-/g, " ");
  return cached(`brand-resolve:${slug}`, async () => {
    const found = await getChannel3().brands.search({ query, limit: 5 });
    const hit = found.brands?.[0];
    if (!hit) return null;
    return { id: hit.id, name: hit.name, description: hit.description ?? null };
  });
}

export async function browseCategory(
  slug: string,
  filters?: CatalogListFilters,
): Promise<CatalogListResult> {
  const meta = seedCategories.find((c) => c.slug === slug);
  const fallbackTitle = meta?.name ?? slug.replace(/-/g, " ");
  const fallbackQuery = meta?.channel3Query ?? fallbackTitle;

  if (!hasChannel3Key()) {
    return {
      products: [],
      source: "seed",
      title: fallbackTitle,
      description: meta?.blurb ?? null,
      note: "Live browse is unavailable right now.",
    };
  }

  if (slug === "electronics") {
    const search = await searchCatalog("tablet", filters);
    return {
      products: search.products,
      source: search.source,
      nextPageToken: search.nextPageToken,
      note: search.note,
      title: fallbackTitle,
      description: meta?.blurb ?? null,
    };
  }

  try {
    const resolved = await resolveCategorySlug(slug, fallbackQuery);
    if (!resolved) {
      const search = await searchCatalog(fallbackQuery, filters);
      return {
        products: search.products,
        source: search.source,
        nextPageToken: search.nextPageToken,
        note: search.note ?? "Category slug not found; showing search results.",
        title: fallbackTitle,
        description: meta?.blurb ?? null,
      };
    }

    const searchFilters: Channel3Api.SearchFilters = {
      ...buildSearchFilters(filters),
      category_ids: [resolved.slug],
    };
    const limit = filters?.limit ?? 24;
    const cacheKey = [
      "browse-cat",
      resolved.slug,
      filters?.minPrice ?? "",
      filters?.maxPrice ?? "",
      filters?.inStockOnly ? "1" : "0",
      filters?.pageToken ?? "",
      limit,
    ].join(":");

    const page = await cached(cacheKey, async () => {
      return getChannel3().products.browse({
        filters: searchFilters,
        limit,
        page_token: filters?.pageToken,
      });
    });

    return {
      products: (page.data ?? []).map((product) => mapChannel3Product(product)),
      source: "channel3",
      nextPageToken: page.response?.next_page_token ?? null,
      title: resolved.title,
      description: resolved.description ?? meta?.blurb ?? null,
    };
  } catch (error) {
    const search = await searchCatalog(fallbackQuery, filters);
    return {
      products: search.products,
      source: search.source,
      nextPageToken: search.nextPageToken,
      title: fallbackTitle,
      description: meta?.blurb ?? null,
      note: `Category browse failed (${error instanceof Error ? error.message : "error"}). Showing live search instead.`,
    };
  }
}

export async function browseBrand(
  slug: string,
  filters?: CatalogListFilters,
): Promise<CatalogListResult> {
  const fallbackTitle = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (!hasChannel3Key()) {
    return {
      products: [],
      source: "seed",
      title: fallbackTitle,
      note: "Live browse is unavailable right now.",
    };
  }

  try {
    const brand = await resolveBrand(slug);
    if (!brand) {
      const search = await searchCatalog(fallbackTitle, filters);
      return {
        products: search.products,
        source: search.source,
        nextPageToken: search.nextPageToken,
        title: fallbackTitle,
        note: search.note ?? "Brand not found; showing search results.",
      };
    }

    const searchFilters: Channel3Api.SearchFilters = {
      ...buildSearchFilters(filters),
      brand_ids: [brand.id],
    };
    const limit = filters?.limit ?? 24;
    const cacheKey = [
      "browse-brand",
      brand.id,
      filters?.minPrice ?? "",
      filters?.maxPrice ?? "",
      filters?.inStockOnly ? "1" : "0",
      filters?.pageToken ?? "",
      limit,
    ].join(":");

    const page = await cached(cacheKey, async () => {
      return getChannel3().products.browse({
        filters: searchFilters,
        limit,
        page_token: filters?.pageToken,
      });
    });

    return {
      products: (page.data ?? []).map((product) => mapChannel3Product(product)),
      source: "channel3",
      nextPageToken: page.response?.next_page_token ?? null,
      title: brand.name,
      description: brand.description,
    };
  } catch (error) {
    const search = await searchCatalog(fallbackTitle, filters);
    return {
      products: search.products,
      source: search.source,
      nextPageToken: search.nextPageToken,
      title: fallbackTitle,
      note: `Brand browse failed (${error instanceof Error ? error.message : "error"}). Showing live search instead.`,
    };
  }
}

export async function findSimilarProducts(
  productId: string,
  limit = 6,
): Promise<{
  products: CatalogProduct[];
  source: "channel3" | "seed";
  note?: string;
}> {
  if (!hasChannel3Key()) {
    return {
      products: [],
      source: "seed",
      note: "Similar products are unavailable right now.",
    };
  }

  try {
    const page = await cached(
      `similar:${productId}:${limit}`,
      async () =>
        getChannel3().products.findSimilar({
          product_id: productId,
          limit,
        }),
      60 * 60 * 1000,
    );
    return {
      products: (page.data ?? [])
        .map((product) => mapChannel3Product(product))
        .filter((p) => p.id !== productId)
        .slice(0, limit),
      source: "channel3",
    };
  } catch (error) {
    return {
      products: [],
      source: "channel3",
      note: `Similar products unavailable (${error instanceof Error ? error.message : "error"}).`,
    };
  }
}

export function parseListFilters(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogListFilters {
  const one = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const minRaw = one("min");
  const maxRaw = one("max");
  const minPrice = minRaw != null && minRaw !== "" ? Number(minRaw) : undefined;
  const maxPrice = maxRaw != null && maxRaw !== "" ? Number(maxRaw) : undefined;
  return {
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    inStockOnly: one("stock") === "1",
    pageToken: one("page") || undefined,
    limit: 24,
  };
}
