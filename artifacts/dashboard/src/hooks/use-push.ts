import { useEffect, useState } from "react";
import {
  getVapidPublicKey,
  subscribePush,
} from "@workspace/api-client-react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

export interface PushState {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    supported: false,
    permission: "unsupported",
    subscribed: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }
    setState((s) => ({
      ...s,
      supported: true,
      permission: Notification.permission,
    }));
    navigator.serviceWorker
      .getRegistration("/dashboard/sw.js")
      .then(async (reg) => {
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        setState((s) => ({ ...s, subscribed: !!sub }));
      })
      .catch(() => {});
  }, []);

  async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
    const existing = await navigator.serviceWorker.getRegistration(
      "/dashboard/sw.js",
    );
    if (existing) return existing;
    return navigator.serviceWorker.register("/dashboard/sw.js", {
      scope: "/dashboard/",
    });
  }

  async function enable(): Promise<void> {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const perm = await Notification.requestPermission();
      setState((s) => ({ ...s, permission: perm }));
      if (perm !== "granted") {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const reg = await ensureRegistration();
      const { publicKey } = await getVapidPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
          .buffer as ArrayBuffer,
      });
      const json = sub.toJSON();
      await subscribePush({
        endpoint: json.endpoint!,
        keys: {
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        },
      });
      setState((s) => ({ ...s, subscribed: true, loading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  return { ...state, enable };
}
