import { NextRequest, NextResponse } from "next/server";
import { getSubscriptions, sendPushNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret") ?? "";
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const subs = getSubscriptions();
  const sent: string[] = [];
  const failed: string[] = [];

  for (const sub of subs) {
    try {
      // Check if it's 9am in the subscriber's timezone
      const localHour = Number(
        new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: sub.timezone }).format(now),
      );
      if (localHour !== 9) continue;

      await sendPushNotification(sub);
      sent.push(sub.endpoint.slice(-20));
    } catch {
      failed.push(sub.endpoint.slice(-20));
    }
  }

  return NextResponse.json({ ok: true, sent: sent.length, failed: failed.length, total: subs.length });
}
