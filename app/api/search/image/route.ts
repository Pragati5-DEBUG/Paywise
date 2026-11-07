import { NextResponse } from "next/server";
import { cacheSet } from "@/lib/cache";
import { searchByImageBase64 } from "@/lib/catalog";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { base64?: string };
    const base64 = body.base64?.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
    if (!base64) {
      return NextResponse.json({ ok: false, error: "Missing image" }, { status: 400 });
    }
    if (base64.length > 6_000_000) {
      return NextResponse.json({ ok: false, error: "Image too large" }, { status: 400 });
    }

    const result = await searchByImageBase64(base64);
    if (result.note && result.products.length === 0) {
      return NextResponse.json({ ok: false, error: result.note }, { status: 400 });
    }

    const token = randomUUID();
    cacheSet(`image-search:${token}`, result.products, 30 * 60 * 1000);
    return NextResponse.json({
      ok: true,
      token,
      ids: result.products.map((p) => p.id),
      source: result.source,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Image search failed",
      },
      { status: 500 },
    );
  }
}
