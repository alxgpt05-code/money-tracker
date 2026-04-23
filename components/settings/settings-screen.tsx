"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Clock4 } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";
import type { NotificationSettings } from "@/lib/auth/shared";

interface SettingsResponse {
  ok: boolean;
  settings?: NotificationSettings;
  error?: string;
}

interface TimeMenuProps {
  values: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

function TimeMenu({ values, selectedValue, onSelect }: TimeMenuProps) {
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "center",
      behavior: "auto",
    });
  }, [selectedValue]);

  return (
    <div className="max-h-44 overflow-y-auto rounded-2xl border border-white/10 bg-[#202125] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {values.map((value) => (
        <button
          key={value}
          ref={value === selectedValue ? selectedRef : null}
          type="button"
          onClick={() => onSelect(value)}
          className={`flex h-10 w-full items-center justify-center rounded-xl text-base font-medium transition ${
            value === selectedValue ? "bg-[#9BE274]/20 text-[#CFF3BC]" : "text-white/75 hover:bg-white/6"
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminderEnabled: false,
    dailyReminderTime: "20:00",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [infoText, setInfoText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [isPushEnvironmentSupported, setIsPushEnvironmentSupported] = useState(false);
  const [selectedHour, setSelectedHour] = useState("20");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const timeSaveTimerRef = useRef<number | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<"hour" | "minute" | null>(null);

  const hourValues = useMemo(
    () => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0")),
    [],
  );
  const minuteValues = useMemo(
    () => Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")),
    [],
  );

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/user/settings");
      const payload = (await response.json()) as SettingsResponse;
      if (response.ok && payload.ok && payload.settings) {
        setSettings(payload.settings);
        setErrorText("");
        return;
      }

      setErrorText(payload.error ?? "Не удалось загрузить настройки");
    };
    load().catch(() => undefined);

    if (typeof window !== "undefined") {
      const hasNotification = "Notification" in window;
      const hasServiceWorker = "serviceWorker" in navigator;
      const hasPushManager = "PushManager" in window;
      const isSecure = window.isSecureContext;
      const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isStandalone =
        window.matchMedia?.("(display-mode: standalone)")?.matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const supported = isSecure && hasNotification && hasServiceWorker && hasPushManager && (!isIos || isStandalone);

      setIsPushEnvironmentSupported(supported);
      if (hasNotification) {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && pickerRef.current && !pickerRef.current.contains(target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [openMenu]);

  useEffect(() => {
    const [hour, minute] = settings.dailyReminderTime.split(":");
    setSelectedHour(hour?.padStart(2, "0") ?? "20");
    setSelectedMinute(minute?.padStart(2, "0") ?? "00");
  }, [settings.dailyReminderTime]);

  useEffect(() => {
    return () => {
      if (timeSaveTimerRef.current) {
        window.clearTimeout(timeSaveTimerRef.current);
      }
    };
  }, []);

  const saveSettings = async (nextSettings: NotificationSettings) => {
    setIsSaving(true);
    setErrorText("");
    setInfoText("");
    const response = await fetch("/api/user/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSettings),
    });
    const payload = (await response.json()) as SettingsResponse;
    setIsSaving(false);

    if (!response.ok || !payload.ok || !payload.settings) {
      setErrorText(payload.error ?? "Не удалось сохранить настройки");
      return;
    }

    setSettings(payload.settings);
    setInfoText("Настройки сохранены");
  };

  const pushStatusText = useMemo(() => {
    if (!isPushEnvironmentSupported) {
      return "Пуш-уведомления пока недоступны в этом режиме. Для iPhone откройте приложение как PWA с домашнего экрана и используйте HTTPS.";
    }

    if (notificationPermission === "granted") {
      return "Уведомления разрешены";
    }
    if (notificationPermission === "denied") {
      return "Уведомления запрещены";
    }
    return "Разрешение не выдано";
  }, [isPushEnvironmentSupported, notificationPermission]);

  const queueTimeSave = (nextHour: string, nextMinute: string) => {
    const nextTime = `${nextHour}:${nextMinute}`;
    const nextSettings = {
      ...settings,
      dailyReminderTime: nextTime,
    };
    setSettings(nextSettings);

    if (timeSaveTimerRef.current) {
      window.clearTimeout(timeSaveTimerRef.current);
    }
    timeSaveTimerRef.current = window.setTimeout(() => {
      saveSettings(nextSettings).catch(() => undefined);
    }, 200);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060607] text-white">
      <div className="mx-auto w-full max-w-[430px] px-3 pb-32 pt-6">
        <h1 className="px-1 text-2xl font-semibold tracking-tight">Настройки</h1>

        <section className="mt-4 rounded-2xl border border-white/10 bg-[#1B1C20] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#9BE274]" />
              <p className="text-sm font-medium text-white">Напоминание о заполнении трат</p>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                let nextEnabled = !settings.dailyReminderEnabled;
                if (nextEnabled && isPushEnvironmentSupported && typeof window !== "undefined" && "Notification" in window) {
                  const permission = await Notification.requestPermission();
                  setNotificationPermission(permission);
                  if (permission === "denied") {
                    nextEnabled = false;
                    setErrorText("Браузер запретил уведомления. Разрешите их в настройках.");
                  }
                }

                const nextSettings = {
                  ...settings,
                  dailyReminderEnabled: nextEnabled,
                };
                setSettings(nextSettings);
                saveSettings(nextSettings).catch(() => undefined);
              }}
              className={`relative h-8 w-14 rounded-full transition ${
                settings.dailyReminderEnabled ? "bg-[#9BE274]" : "bg-white/15"
              }`}
              aria-label="Переключить ежедневные напоминания"
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
                  settings.dailyReminderEnabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-3">
            <label className="flex items-center gap-2 text-xs text-white/65">
              <Clock4 className="h-3.5 w-3.5 text-white/55" />
              Время уведомления
            </label>
            <div
              ref={pickerRef}
              className={`relative mt-2 rounded-2xl border border-white/10 bg-[#202125] p-4 ${
                settings.dailyReminderEnabled ? "" : "opacity-90"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setOpenMenu((prev) => (prev === "hour" ? null : "hour"))}
                  className="h-20 w-28 rounded-2xl border border-white/10 bg-[#18191d] text-center text-[4.2rem] font-semibold leading-none tracking-tight text-white transition hover:bg-white/8 disabled:pointer-events-none"
                >
                  {selectedHour}
                </button>

                <span className="text-[4rem] font-semibold leading-none text-white/75">:</span>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setOpenMenu((prev) => (prev === "minute" ? null : "minute"))}
                  className="h-20 w-28 rounded-2xl border border-white/10 bg-[#18191d] text-center text-[4.2rem] font-semibold leading-none tracking-tight text-white transition hover:bg-white/8 disabled:pointer-events-none"
                >
                  {selectedMinute}
                </button>
              </div>

              {openMenu === "hour" ? (
                <div className="absolute left-3 right-1/2 top-[calc(100%+8px)] z-20 pr-1">
                  <TimeMenu
                    values={hourValues}
                    selectedValue={selectedHour}
                    onSelect={(hour) => {
                      setSelectedHour(hour);
                      queueTimeSave(hour, selectedMinute);
                      setOpenMenu(null);
                    }}
                  />
                </div>
              ) : null}

              {openMenu === "minute" ? (
                <div className="absolute left-1/2 right-3 top-[calc(100%+8px)] z-20 pl-1">
                  <TimeMenu
                    values={minuteValues}
                    selectedValue={selectedMinute}
                    onSelect={(minute) => {
                      setSelectedMinute(minute);
                      queueTimeSave(selectedHour, minute);
                      setOpenMenu(null);
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-white/65">
            Каждый день в выбранное время будет приходить пуш-уведомление: «Не забудь заполнить свои траты».
          </p>

          <p className="mt-2 text-[11px] text-white/60">{pushStatusText}</p>
          <p className="mt-2 text-[11px] text-white/45">
            TODO: подключить реальную ежедневную web push отправку через service worker + backend scheduler.
          </p>
        </section>

        {infoText ? <p className="mt-3 px-1 text-sm text-[#9BE274]">{infoText}</p> : null}
        {errorText ? <p className="mt-2 px-1 text-sm text-[#F6A3C7]">{errorText}</p> : null}
      </div>

      <BottomNav />
    </main>
  );
}
