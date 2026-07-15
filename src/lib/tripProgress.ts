import { Stop } from "@/types/stop";
import { Trip } from "@/types/trip";
import { isFutureDateKey } from "@/lib/dateUtils";

/** 依照 order 排序後，找出下一個尚未抵達的停靠點；若全部完成則回傳 null */
export function getNextStop(trip: Trip): Stop | null {
  const ordered = [...trip.stops].sort((a, b) => a.order - b.order);
  return ordered.find((s) => !s.actualArrivalTime) ?? null;
}

/** 這個行程的所有停靠點是否都已經抵達 */
export function isTripFullyArrived(trip: Trip): boolean {
  return trip.stops.length > 0 && trip.stops.every((s) => Boolean(s.actualArrivalTime));
}

/**
 * 未來行程（trip.date 晚於使用者本地今天）不可以有任何即時進度紀錄。
 * 這裡是最後一道防呆：即使 UI 忘記隱藏按鈕，這幾個函式本身也不會寫入資料。
 */
function isFutureTrip(trip: Trip, now: Date): boolean {
  return isFutureDateKey(trip.date, now);
}

export function markPrepStarted(trip: Trip, now: Date = new Date()): Trip {
  if (isFutureTrip(trip, now)) return trip;
  return { ...trip, actualPrepStartTime: now.toISOString() };
}

export function markStopDeparted(trip: Trip, stopId: string, now: Date = new Date()): Trip {
  if (isFutureTrip(trip, now)) return trip;
  return {
    ...trip,
    stops: trip.stops.map((s) => (s.id === stopId ? { ...s, actualDepartureTime: now.toISOString() } : s)),
  };
}

export function markStopArrived(trip: Trip, stopId: string, now: Date = new Date()): Trip {
  if (isFutureTrip(trip, now)) return trip;
  const nextStops = trip.stops.map((s) => (s.id === stopId ? { ...s, actualArrivalTime: now.toISOString() } : s));
  const nextTrip = { ...trip, stops: nextStops };
  return { ...nextTrip, completed: isTripFullyArrived(nextTrip) };
}

/**
 * 開始一個準備事項。若這是這趟行程第一個被開始的事項，
 * 同時補上 trip 層級的 actualPrepStartTime（維持與 v0.1.1/v0.1.2 的相容性）。
 * 未來行程一律不可寫入。
 */
export function startPreparationTask(trip: Trip, taskId: string, now: Date = new Date()): Trip {
  if (isFutureTrip(trip, now)) return trip;
  const nextTasks = trip.preparationTasks.map((t) =>
    t.id === taskId && !t.actualStartedAt ? { ...t, actualStartedAt: now.toISOString() } : t
  );
  const nextTrip: Trip = { ...trip, preparationTasks: nextTasks };
  return nextTrip.actualPrepStartTime ? nextTrip : { ...nextTrip, actualPrepStartTime: now.toISOString() };
}

/** 完成一個準備事項。若尚未標記開始，一併補上開始時間，避免出現「完成但沒開始」的資料。 */
export function completePreparationTask(trip: Trip, taskId: string, now: Date = new Date()): Trip {
  if (isFutureTrip(trip, now)) return trip;
  return {
    ...trip,
    preparationTasks: trip.preparationTasks.map((t) =>
      t.id === taskId
        ? { ...t, actualStartedAt: t.actualStartedAt ?? now.toISOString(), actualCompletedAt: now.toISOString() }
        : t
    ),
  };
}

/**
 * 跳過一個準備事項。這是使用者主動的選擇，不是 App 自動幫使用者跳過，
 * 資料上與「完成」視為同一種狀態（不再出現在待辦清單中），但由使用者觸發。
 */
export function skipPreparationTask(trip: Trip, taskId: string, now: Date = new Date()): Trip {
  return completePreparationTask(trip, taskId, now);
}

/**
 * 重設一個行程的即時進度（開始準備／出發／抵達／完成狀態／每個準備事項的進度），
 * 但保留行程內容、地點、時間與準備事項本身（名稱、預估分鐘數、順序都不會被清除）。
 * 提供使用者在資料誤植時的手動復原管道。
 */
export function resetTripProgress(trip: Trip): Trip {
  return {
    ...trip,
    actualPrepStartTime: null,
    completed: false,
    reviewCompletedAt: null,
    stops: trip.stops.map((s) => ({ ...s, actualDepartureTime: null, actualArrivalTime: null })),
    preparationTasks: trip.preparationTasks.map((t) => ({ ...t, actualStartedAt: null, actualCompletedAt: null })),
  };
}
