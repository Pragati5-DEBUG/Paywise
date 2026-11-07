import { NextResponse } from "next/server";
import { buildDealTimeline } from "@/lib/deal-timeline";

export async function GET() {
  const timeline = await buildDealTimeline();
  return NextResponse.json(timeline);
}
