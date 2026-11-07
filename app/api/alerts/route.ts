import { NextResponse } from "next/server";
import { startAlertChecker } from "@/lib/alert-scheduler";
import {
  createAlert,
  listAlerts,
  markAlertEmailSent,
} from "@/lib/deal-store";
import { sendAlertConfirmationEmail } from "@/lib/email";

startAlertChecker();

export async function GET() {
  const alerts = await listAlerts();
  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      title?: string;
      currentPrice?: number | null;
      currency?: string;
      remindAt?: string;
      email?: string;
    };
    const productId = body.productId?.trim();
    const title = body.title?.trim();
    const email = body.email?.trim();
    const currentPrice =
      typeof body.currentPrice === "number" && Number.isFinite(body.currentPrice)
        ? body.currentPrice
        : null;

    if (!productId || !title) {
      return NextResponse.json(
        { error: "productId and title are required" },
        { status: 400 },
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "An email address is required so we can send the price drop" },
        { status: 400 },
      );
    }

    const alert = await createAlert({
      productId,
      title,
      currentPrice,
      currency: body.currency,
      remindAt: body.remindAt,
      email,
    });

    let emailResult: { ok: boolean; skipped?: boolean; error?: string } | null =
      null;
    if (email) {
      emailResult = await sendAlertConfirmationEmail({
        to: email,
        title,
        currentPrice,
        productId,
        currency: body.currency,
      });
      if (emailResult.ok) await markAlertEmailSent(alert.id);
    }

    return NextResponse.json({ alert, email: emailResult });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save alert" },
      { status: 500 },
    );
  }
}
