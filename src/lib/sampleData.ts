import { Trip } from "@/types/trip";
import { Stop } from "@/types/stop";
import { PreparationTask } from "@/types/preparation";
import { combineDateAndTime } from "@/lib/dateUtils";

function nextSaturday(): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let diff = 6 - today.getDay();
  if (diff <= 0) diff += 7;
  const target = new Date(today.getTime() + diff * 86_400_000);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 建立一筆可刪除的示範行程：週六約會，示範完整倒推流程 */
export function createSampleTrip(): Trip {
  const date = nextSaturday();
  const now = new Date().toISOString();

  const preparationTasks: PreparationTask[] = [
    { id: "prep-sample-1", name: "洗澡", estimatedMinutes: 20, enabled: true, order: 0, actualStartedAt: null, actualCompletedAt: null },
    { id: "prep-sample-2", name: "挑衣服", estimatedMinutes: 15, enabled: true, order: 1, actualStartedAt: null, actualCompletedAt: null },
    { id: "prep-sample-3", name: "化妝", estimatedMinutes: 30, enabled: true, order: 2, actualStartedAt: null, actualCompletedAt: null },
    { id: "prep-sample-4", name: "收拾包包", estimatedMinutes: 10, enabled: true, order: 3, actualStartedAt: null, actualCompletedAt: null },
  ];

  const stops: Stop[] = [
    {
      id: "stop-sample-1",
      name: "漢神巨蛋",
      address: "高雄市三民區大順三路15號",
      placeId: null,
      latitude: null,
      longitude: null,
      targetArrivalTime: combineDateAndTime(date, "14:00").toISOString(),
      timeConstraintType: "flexible",
      graceMinutes: 0,
      earlyArrivalMinutes: 0,
      transportMode: "motorcycle",
      travelMinutes: 20,
      travelSource: "目前使用示範路程資料。",
      parking: { mode: "auto" },
      parkingMinutes: 8,
      walkFromParkingMinutes: 5,
      entryBufferMinutes: 3,
      personalAdjustmentMinutes: 0,
      note: "逛街，沒有預約",
      order: 0,
      isFamiliarLocation: true,
      actualDepartureTime: null,
      actualArrivalTime: null,
    },
    {
      id: "stop-sample-2",
      name: "晚餐餐廳",
      address: "高雄市前鎮區中山二路",
      placeId: null,
      latitude: null,
      longitude: null,
      targetArrivalTime: combineDateAndTime(date, "18:00").toISOString(),
      timeConstraintType: "grace",
      graceMinutes: 10,
      earlyArrivalMinutes: 0,
      transportMode: "motorcycle",
      travelMinutes: 22,
      travelSource: "目前使用示範路程資料。",
      parking: { mode: "auto" },
      parkingMinutes: 12,
      walkFromParkingMinutes: 5,
      entryBufferMinutes: 3,
      personalAdjustmentMinutes: 0,
      note: "週末晚間停車風險較高",
      order: 1,
      isFamiliarLocation: false,
      actualDepartureTime: null,
      actualArrivalTime: null,
    },
    {
      id: "stop-sample-3",
      name: "電影院",
      address: "高雄市苓雅區三多三路",
      placeId: null,
      latitude: null,
      longitude: null,
      targetArrivalTime: combineDateAndTime(date, "20:00").toISOString(),
      timeConstraintType: "strict",
      graceMinutes: 0,
      earlyArrivalMinutes: 10,
      transportMode: "motorcycle",
      travelMinutes: 15,
      travelSource: "目前使用示範路程資料。",
      parking: { mode: "auto" },
      parkingMinutes: 10,
      walkFromParkingMinutes: 5,
      entryBufferMinutes: 5,
      personalAdjustmentMinutes: 0,
      note: "電影開演不能遲到",
      order: 2,
      isFamiliarLocation: false,
      actualDepartureTime: null,
      actualArrivalTime: null,
    },
  ];

  return {
    id: "trip-sample-weekend-date",
    title: "週六約會",
    date,
    note: "示範行程，可以刪除。用來示範完整的時間倒推流程。",
    originAddress: "住家（示範出發地）",
    originLatitude: null,
    originLongitude: null,
    preparationTasks,
    stops,
    completed: false,
    reviewCompletedAt: null,
    actualPrepStartTime: null,
    createdAt: now,
    updatedAt: now,
  };
}
