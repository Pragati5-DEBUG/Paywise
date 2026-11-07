import { NextResponse } from "next/server";
import { generateAndStoreTiming } from "@/lib/ai-timing";
import { getTimingForProduct } from "@/lib/deal-store";

export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const timing = await getTimingForProduct(productId);
  return NextResponse.json({ timing });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      title?: string;
      brand?: string;
      currentPrice?: number;
      history?: number[];
      refresh?: boolean;
    };
    const productId = body.productId?.trim();
    const title = body.title?.trim();
    const currentPrice = Number(body.currentPrice);
    if (!productId || !title || !Number.isFinite(currentPrice) || currentPrice <= 0) {
      return NextResponse.json(
        { error: "productId, title, and currentPrice are required" },
        { status: 400 },
      );
    }

    if (!body.refresh) {
      const existing = await getTimingForProduct(productId);
      if (existing) {
        const ageMs = Date.now() - new Date(existing.createdAt).getTime();
        if (ageMs < 6 * 60 * 60 * 1000) {
          return NextResponse.json({ timing: existing, cached: true });
        }
      }
    }

    const timing = await generateAndStoreTiming({
      productId,
      title,
      brand: body.brand,
      currentPrice,
      history: Array.isArray(body.history) ? body.history.map(Number).filter(Number.isFinite) : [],
    });
    return NextResponse.json({ timing, cached: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Timing failed" },
      { status: 500 },
    );
  }
}
