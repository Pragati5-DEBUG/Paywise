import { NextResponse } from "next/server";
import { checkPriceAlerts } from "@/lib/alert-check";
import { startAlertChecker } from "@/lib/alert-scheduler";

startAlertChecker();

export async function POST() {
  const result = await checkPriceAlerts();
  return NextResponse.json(result);
}
