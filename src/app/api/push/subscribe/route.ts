import { NextRequest, NextResponse } from "next/server";
import { addSubscription } from "@/lib/push";

export async function POST(req: NextRequest) {
  const { subscription, timezone } = await req.json();
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  await addSubscription({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    timezone: timezone || "UTC",
  });
  return NextResponse.json({ ok: true });
}
