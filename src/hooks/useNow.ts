"use client";

import { useEffect, useState } from "react";

/** 每隔 intervalMs 更新一次目前時間，用於首頁倒數與風險狀態即時更新 */
export function useNow(intervalMs: number = 30_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
