"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
    setPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });

    // Register SW
    navigator.serviceWorker.register("/sw.js");
  }, []);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setSubscribed(false);
        setPermission(Notification.permission);
        return;
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), timezone }),
      });

      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  const isBlocked = permission === "denied";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#1a1a1a] px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-200">Daily reminder</p>
        <p className="text-xs text-gray-500">{isBlocked ? "Blocked in browser settings" : "9:00 AM your local time"}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading || isBlocked}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          subscribed ? "bg-[#7aa37a]" : "bg-gray-700"
        } disabled:opacity-40`}
        aria-label="Toggle daily reminder"
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            subscribed ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
