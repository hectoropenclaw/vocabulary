import webPush from "web-push";

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  created_at?: string;
};

let initialized = false;

const TABLE = "vocabulary_push_subscriptions";

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return { base: `${url.replace(/\/$/, "")}/rest/v1`, key };
}

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

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

export async function getSubscriptions(): Promise<PushSubscriptionRow[]> {
  const { base, key } = supabaseConfig();
  const res = await fetch(
    `${base}/${TABLE}?select=endpoint,p256dh,auth,timezone,created_at`,
    { headers: supabaseHeaders(key), cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`Failed to load subscriptions: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as PushSubscriptionRow[];
}

export async function addSubscription(sub: PushSubscriptionRow) {
  const { base, key } = supabaseConfig();
  const row: PushSubscriptionRow = {
    ...sub,
    created_at: sub.created_at ?? new Date().toISOString(),
  };
  // Upsert on the endpoint primary key.
  const res = await fetch(`${base}/${TABLE}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(key),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`Failed to store subscription: ${res.status} ${await res.text()}`);
  }
}

export async function removeSubscription(endpoint: string) {
  const { base, key } = supabaseConfig();
  const res = await fetch(
    `${base}/${TABLE}?endpoint=eq.${encodeURIComponent(endpoint)}`,
    {
      method: "DELETE",
      headers: { ...supabaseHeaders(key), Prefer: "return=minimal" },
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to remove subscription: ${res.status} ${await res.text()}`);
  }
}
