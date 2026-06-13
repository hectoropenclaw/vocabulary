import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import webPush from "web-push";

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  created_at?: string;
};

let initialized = false;
const STORE_DIR = path.join(process.cwd(), ".runtime-data");
const STORE_PATH = path.join(STORE_DIR, "vocabulary-push-subscriptions.json");

export function initWebPush() {
  if (initialized) return;
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  initialized = true;
}

async function ensureStoreDir() {
  await mkdir(STORE_DIR, { recursive: true });
}

async function readStore(): Promise<PushSubscriptionRow[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is PushSubscriptionRow => {
      return Boolean(
        row &&
          typeof row === "object" &&
          typeof row.endpoint === "string" &&
          typeof row.p256dh === "string" &&
          typeof row.auth === "string",
      );
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeStore(rows: PushSubscriptionRow[]) {
  await ensureStoreDir();
  await writeFile(STORE_PATH, JSON.stringify(rows, null, 2));
}

export async function sendPushNotification(sub: PushSubscriptionRow) {
  initWebPush();
  const subscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  const payload = JSON.stringify({
    title: "Vocabulary Practice",
    body: "Time for your daily word practice! 📚",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    url: "/",
  });
  return webPush.sendNotification(subscription, payload);
}

export async function getSubscriptions(): Promise<PushSubscriptionRow[]> {
  return readStore();
}

export async function addSubscription(sub: PushSubscriptionRow) {
  const subs = await readStore();
  const idx = subs.findIndex((s) => s.endpoint === sub.endpoint);
  const nextRow = {
    ...sub,
    created_at: sub.created_at ?? new Date().toISOString(),
  };
  if (idx >= 0) {
    subs[idx] = nextRow;
  } else {
    subs.push(nextRow);
  }
  await writeStore(subs);
}

export async function removeSubscription(endpoint: string) {
  const subs = await readStore();
  await writeStore(subs.filter((row) => row.endpoint !== endpoint));
}
