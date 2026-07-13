"use client";

import { useCallback, useEffect, useState } from "react";

export type NotificationPermissionState = "unsupported" | "default" | "granted" | "denied";

/**
 * 通知功能第一版限制：
 * 瀏覽器通知只能保證「App 開啟期間」提醒可靠觸發。
 * 一旦分頁或瀏覽器被關閉，本機無法保證背景推播準時送達，
 * 這一點會在設定頁與 README 清楚註明，不會假裝已經有可靠背景推播。
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>("unsupported");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as NotificationPermissionState);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported" as NotificationPermissionState;
    }
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermissionState);
    return result as NotificationPermissionState;
  }, []);

  const notify = useCallback(
    (title: string, body: string) => {
      if (permission !== "granted") return;
      try {
        new Notification(title, { body, icon: "/icons/icon-192.png" });
      } catch (error) {
        console.error("[useNotifications] 發送通知失敗", error);
      }
    },
    [permission]
  );

  return { permission, requestPermission, notify };
}
