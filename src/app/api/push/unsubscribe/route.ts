import { NextRequest, NextResponse } from "next/server";
import { removeSubscription } from "@/lib/push";

export async function POST(req: NextRequest) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  await removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
