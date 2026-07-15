import { ParsedItinerary } from "@/types/ai";
import { createEmptyTrip } from "@/types/trip";
import { createEmptyStop } from "@/types/stop";
import { Trip } from "@/types/trip";
import { generateId } from "@/lib/id";
import { combineDateAndTime } from "@/lib/dateUtils";

/**
 * 把 AI（或本地 mock parser）解析出來的 ParsedItinerary，
 * 轉換成可以在「確認行程」頁面編輯的 Trip 草稿。
 *
 * 重要：這裡不會幫使用者補上路程時間、停車資訊或編造地址，
 * 全部使用安全預設值，並保留 unresolvedPlaces 讓使用者確認。
 */
export function buildTripDraftFromParsedItinerary(parsed: ParsedItinerary, fallbackDate: string): Trip {
  const trip = createEmptyTrip();
  trip.title = parsed.tripTitle || "新行程";
  trip.date = parsed.date || fallbackDate;

  trip.preparationTasks = parsed.preparationTasks.map((task, index) => ({
    id: generateId("prep"),
    name: task.name,
    estimatedMinutes: task.estimatedMinutes,
    enabled: true,
    order: index,
    actualStartedAt: null,
    actualCompletedAt: null,
  }));

  trip.stops = parsed.stops.map((parsedStop, index) => {
    const stop = createEmptyStop(index);
    const isUnresolved = parsed.unresolvedPlaces.includes(parsedStop.rawName);
    stop.name = isUnresolved ? "" : parsedStop.resolvedName ?? parsedStop.rawName;
    stop.note = isUnresolved ? `AI 無法確認「${parsedStop.rawName}」，請選擇正確地點。` : "";
    stop.timeConstraintType = parsedStop.timeConstraintType;
    stop.graceMinutes = parsedStop.graceMinutes ?? 0;
    stop.earlyArrivalMinutes = parsedStop.earlyArrivalMinutes ?? 0;
    if (parsedStop.arrivalTime) {
      stop.targetArrivalTime = combineDateAndTime(trip.date, parsedStop.arrivalTime).toISOString();
    }
    return stop;
  });

  return trip;
}
