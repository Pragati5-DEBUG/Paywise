import { NextResponse } from "next/server";
import {
  addWatchItem,
  listWatchlist,
  removeWatchItem,
} from "@/lib/deal-store";

export async function GET() {
  const items = await listWatchlist();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      title?: string;
      brand?: string;
      imageUrl?: string | null;
      lowestPrice?: number | null;
    };
    const productId = body.productId?.trim();
    const title = body.title?.trim();
    if (!productId || !title) {
      return NextResponse.json(
        { error: "productId and title are required" },
        { status: 400 },
      );
    }
    const item = await addWatchItem({
      productId,
      title,
      brand: body.brand?.trim() || "Brand",
      imageUrl: body.imageUrl ?? null,
      lowestPrice:
        typeof body.lowestPrice === "number" && Number.isFinite(body.lowestPrice)
          ? body.lowestPrice
          : null,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  await removeWatchItem(productId);
  return NextResponse.json({ ok: true });
}
