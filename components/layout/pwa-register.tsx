"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerSw = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)));

        await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("workbox-") || key.startsWith("next-"))
              .map((key) => caches.delete(key)),
          );
        }
      } catch {
        // Intentionally silent: PWA registration must not break app runtime.
      }
    };

    registerSw().catch(() => undefined);
  }, []);

  return null;
}
