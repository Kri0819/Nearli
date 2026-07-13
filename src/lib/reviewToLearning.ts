import { Trip } from "@/types/trip";
import { ReviewOutcome, StopLearningRecord } from "@/types/learning";
import { diffMinutes, isNightTime, isWeekend } from "@/lib/dateUtils";
import { generateId } from "@/lib/id";

/**
 * 行程完成後，依照使用者「我已經出發」「我已抵達」記錄的實際時間，
 * 與使用者選擇的簡單回顧選項，產生每一站的學習紀錄。
 *
 * 第一版簡化：把路程＋停車＋步行＋進場視為單一整體時間區塊來比較估算與實際，
 * 不做更細的拆解，保持規則透明、容易解釋。
 */
export function buildLearningRecordsFromReview(trip: Trip, outcomes: ReviewOutcome[]): StopLearningRecord[] {
  const records: StopLearningRecord[] = [];

  for (const stop of trip.stops) {
    if (!stop.actualDepartureTime || !stop.actualArrivalTime) continue;

    const departedAt = new Date(stop.actualDepartureTime);
    const arrivedAt = new Date(stop.actualArrivalTime);
    const actualTravelMinutes = Math.max(0, diffMinutes(arrivedAt, departedAt));
    const estimatedTravelMinutes =
      stop.travelMinutes + stop.parkingMinutes + stop.walkFromParkingMinutes + stop.entryBufferMinutes;

    records.push({
      id: generateId("learn"),
      stopId: stop.id,
      tripId: trip.id,
      transportMode: stop.transportMode,
      familiarity: stop.isFamiliarLocation ? "familiar" : "unfamiliar",
      dayType: isWeekend(departedAt) ? "weekend" : "weekday",
      timeOfDay: isNightTime(departedAt) ? "night" : "day",
      estimatedTravelMinutes,
      actualTravelMinutes,
      estimatedParkingMinutes: stop.parkingMinutes,
      actualParkingMinutes: outcomes.includes("parking_took_longer") ? null : stop.parkingMinutes,
      estimatedPrepMinutes: null,
      actualPrepMinutes: null,
      gotLost: outcomes.includes("got_lost"),
      overshot: outcomes.includes("got_lost"),
      couldNotFindEntry: outcomes.includes("entry_took_longer"),
      forgotSomething: false,
      arrivedOnTime: outcomes.includes("on_time") || outcomes.includes("earlier_than_planned"),
      reviewOutcomes: outcomes,
      recordedAt: new Date().toISOString(),
    });
  }

  return records;
}
