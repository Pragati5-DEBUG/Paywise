import { NextResponse } from "next/server";
import {
  browseBrand,
  browseCategory,
  type CatalogListFilters,
} from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const slug = searchParams.get("slug")?.trim();
  if (!kind || !slug || (kind !== "category" && kind !== "brand")) {
    return NextResponse.json({ error: "kind and slug required" }, { status: 400 });
  }

  const minRaw = searchParams.get("min");
  const maxRaw = searchParams.get("max");
  const minPrice = minRaw ? Number(minRaw) : undefined;
  const maxPrice = maxRaw ? Number(maxRaw) : undefined;
  const filters: CatalogListFilters = {
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    inStockOnly: searchParams.get("stock") === "1",
    pageToken: searchParams.get("page") || undefined,
    limit: 24,
  };

  const result =
    kind === "category"
      ? await browseCategory(slug, filters)
      : await browseBrand(slug, filters);

  return NextResponse.json({
    products: result.products,
    nextPageToken: result.nextPageToken ?? null,
    source: result.source,
    note: result.note,
  });
}
