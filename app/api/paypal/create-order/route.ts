import { NextResponse } from "next/server";
import {
  approveUrlFromOrder,
  createCheckoutOrder,
  PayPalApiError,
} from "@/lib/paypal";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      merchant?: string;
      amount?: number;
      currency?: string;
      title?: string;
    };

    const productId = body.productId?.trim();
    const merchant = body.merchant?.trim();
    const amount = Number(body.amount);
    const title = body.title?.trim() || "Paywise purchase";

    if (!productId || !merchant || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "productId, merchant, and a positive amount are required" },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;
    // Force USD — Channel3 is US catalog; non-USD + mismatched sandbox
    // accounts triggers "seller doesn't accept your currency".
    const currency = "USD";
    const returnParams = new URLSearchParams({
      store: merchant,
      productId,
      title,
      amount: String(amount),
      currency,
    });

    const order = await createCheckoutOrder({
      amount,
      currency,
      description: `${title} · ${merchant}`,
      customId: `${productId}:${merchant}`,
      returnUrl: `${origin}/product/${encodeURIComponent(productId)}/buy/complete?${returnParams}`,
      cancelUrl: `${origin}/product/${encodeURIComponent(productId)}/buy?store=${encodeURIComponent(merchant)}&cancelled=1`,
    });

    const approveUrl = approveUrlFromOrder(order);
    if (!approveUrl) {
      return NextResponse.json(
        { error: "Checkout did not return a payment link", detail: order.status },
        { status: 502 },
      );
    }

    return NextResponse.json({ orderId: order.id, approveUrl });

  } catch (error) {
    const message =
      error instanceof PayPalApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
