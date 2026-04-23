"use client";

import { useEffect, useState } from "react";

type Settings = {
  enabled: boolean;
  time: string;
  timezone: string;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushSettingsCard() {
  const [settings, setSettings] = useState<Settings>({ enabled: false, time: "22:00", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/notifications/settings")
      .then((response) => response.json())
      .then((data) => {
        setSettings({ enabled: Boolean(data.enabled), time: data.time || "22:00", timezone: data.timezone || "Europe/Moscow" });
      })
      .catch(() => null);
  }, []);

  async function save(next: Settings) {
    setSettings(next);
    const response = await fetch("/api/notifications/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    });

    if (!response.ok) {
      setStatus("Не удалось сохранить настройки");
      return;
    }

    setStatus("Сохранено");
  }

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("Push не поддерживается в этом браузере");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("Разрешение на уведомления не выдано");
      return;
    }

    const keyResponse = await fetch("/api/push/public-key");
    const keyData = await keyResponse.json();

    if (!keyData.key) {
      setStatus("VAPID ключ не настроен на сервере");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.key)
    });

    const saveResponse = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription)
    });

    if (saveResponse.ok) {
      setStatus("Push подключен");
    } else {
      setStatus("Не удалось сохранить push подписку");
    }
  }

  return (
    <div className="card stack animate-fade-up">
      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span>Включить уведомления</span>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => save({ ...settings, enabled: event.target.checked })}
          style={{ width: 22, height: 22 }}
        />
      </label>

      <div>
        <label className="muted">Время</label>
        <input className="input" type="time" value={settings.time} onChange={(event) => save({ ...settings, time: event.target.value })} />
      </div>

      <div>
        <label className="muted">Часовой пояс</label>
        <input className="input" value={settings.timezone} onChange={(event) => save({ ...settings, timezone: event.target.value })} />
      </div>

      <button className="button button-primary" onClick={enablePush}>
        Запросить разрешение и подключить Push
      </button>

      {status ? <p className="muted" style={{ margin: 0 }}>{status}</p> : null}
    </div>
  );
}
