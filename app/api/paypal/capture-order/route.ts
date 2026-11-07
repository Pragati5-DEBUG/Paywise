import { NextResponse } from "next/server";
import { recordPurchase } from "@/lib/deal-store";
import { captureCheckoutOrder, PayPalApiError } from "@/lib/paypal";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      productId?: string;
      title?: string;
      merchant?: string;
      amount?: number;
      currency?: string;
    };
    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }
    const order = await captureCheckoutOrder(orderId);

    if (body.productId?.trim()) {
      await recordPurchase({
        productId: body.productId.trim(),
        title: body.title?.trim() || "Paywise purchase",
        merchant: body.merchant?.trim() || "store",
        amount: Number(body.amount) || 0,
        currency: body.currency || "USD",
        orderId: order.id,
        status: order.status,
      });
    }

    return NextResponse.json({ orderId: order.id, status: order.status });
  } catch (error) {
    const message =
      error instanceof PayPalApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Capture failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
