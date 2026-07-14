import { Trip } from "@/types/trip";
import { classifyDateGroup } from "@/lib/dateUtils";
import { getNextStop } from "@/lib/tripProgress";

/**
 * 首頁「現在」要顯示哪個行程。
 *
 * 規則（修正 v0.1.1 的錯誤：過期但從未開始的行程會一直卡在首頁）：
 * 1. 「正在進行中」的行程優先：尚未完成、至少有一站已經出發、且還有下一站未抵達。
 *    這種行程不看日期，因為行程可能跨夜進行。
 * 2. 否則選「今天或未來、尚未完成」的行程中日期最近的一個。
 * 3. 過去、且從未開始（沒有任何出發紀錄）的行程不會出現在首頁，
 *    使用者可以到「行程」列表自行處理。
 */
export function selectActiveTrip(trips: Trip[], now: Date = new Date()): Trip | null {
  const inProgress = trips.find(
    (t) => !t.completed && t.stops.some((s) => s.actualDepartureTime) && getNextStop(t) !== null
  );
  if (inProgress) return inProgress;

  const upcoming = trips
    .filter((t) => !t.completed && t.stops.length > 0)
    .filter((t) => classifyDateGroup(t.date, now) !== "past")
    .sort((a, b) => a.date.localeCompare(b.date));

  return upcoming[0] ?? null;
}
