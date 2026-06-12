import webPush from "web-push";

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  created_at?: string;
};

let initialized = false;

export function initWebPush() {
  if (initialized) return;
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  initialized = true;
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

// In-memory store for subscriptions (use a DB for production scale)
// Stored as a module-level singleton so it persists across requests in the same process
declare global {
  // eslint-disable-next-line no-var
  var __vocabSubscriptions: PushSubscriptionRow[] | undefined;
}

export function getSubscriptions(): PushSubscriptionRow[] {
  if (!global.__vocabSubscriptions) {
    global.__vocabSubscriptions = [];
  }
  return global.__vocabSubscriptions;
}

export function addSubscription(sub: PushSubscriptionRow) {
  const subs = getSubscriptions();
  const idx = subs.findIndex((s) => s.endpoint === sub.endpoint);
  if (idx >= 0) {
    subs[idx] = sub;
  } else {
    subs.push(sub);
  }
}

export function removeSubscription(endpoint: string) {
  const subs = getSubscriptions();
  const idx = subs.findIndex((s) => s.endpoint === endpoint);
  if (idx >= 0) subs.splice(idx, 1);
}
