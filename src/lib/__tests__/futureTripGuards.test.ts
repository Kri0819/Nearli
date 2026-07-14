import { describe, it, expect } from "vitest";
import { createEmptyTrip } from "@/types/trip";
import { createEmptyStop } from "@/types/stop";
import { combineDateAndTime, isFutureDateKey, isPastDateKey, isTodayDateKey, toDateKey, describeDayCountdown } from "@/lib/dateUtils";
import { markPrepStarted, markStopDeparted, markStopArrived } from "@/lib/tripProgress";
import { selectActiveTrip } from "@/lib/activeTrip";
import { computeHomeGreeting } from "@/lib/homeGreeting";
import { normalizeTrip } from "@/lib/storage";
import { computeTripPlan } from "@/lib/timeCalculation";

// 固定「現在」：2026-07-13 09:00（本地時間），所有測試都基於這個基準點
const NOW = new Date(2026, 6, 13, 9, 0, 0);

function buildTrip(dateStr: string) {
  const trip = createEmptyTrip();
  trip.title = "週六約會";
  trip.date = dateStr;
  const stop = createEmptyStop(0);
  stop.name = "漢神巨蛋";
  stop.targetArrivalTime = combineDateAndTime(dateStr, "14:00").toISOString();
  stop.travelMinutes = 25;
  trip.stops = [stop];
  return trip;
}

describe("dateUtils：本地日期字串比較（不使用 new Date(dateStr) 直接比較）", () => {
  it("toDateKey 用本地年月日組字串", () => {
    expect(toDateKey(NOW)).toBe("2026-07-13");
  });

  it("isFutureDateKey / isTodayDateKey / isPastDateKey", () => {
    expect(isFutureDateKey("2026-07-18", NOW)).toBe(true);
    expect(isFutureDateKey("2026-07-13", NOW)).toBe(false);
    expect(isTodayDateKey("2026-07-13", NOW)).toBe(true);
    expect(isPastDateKey("2026-07-12", NOW)).toBe(true);
    expect(isPastDateKey("2026-07-13", NOW)).toBe(false);
  });

  it("describeDayCountdown 不會顯示巨大分鐘數，改用天／小時", () => {
    const future = combineDateAndTime("2026-07-18", "12:04");
    const text = describeDayCountdown(future, NOW);
    expect(text).not.toMatch(/分鐘/);
    expect(text).toMatch(/還有 \d+ 天/);
  });
});

describe("案例 A：今天 7/13，行程日期 7/18（未來）", () => {
  const trip = buildTrip("2026-07-18");

  it("不允許寫入任何即時進度", () => {
    const afterPrep = markPrepStarted(trip, NOW);
    expect(afterPrep.actualPrepStartTime).toBeNull();
    expect(afterPrep).toEqual(trip);

    const afterDepart = markStopDeparted(trip, trip.stops[0].id, NOW);
    expect(afterDepart.stops[0].actualDepartureTime).toBeNull();

    const afterArrive = markStopArrived(trip, trip.stops[0].id, NOW);
    expect(afterArrive.stops[0].actualArrivalTime).toBeNull();
    expect(afterArrive.completed).toBe(false);
  });

  it("首頁標題為「下一趟行程」，副標題顯示 7 月 18 日", () => {
    const plan = computeTripPlan(trip, NOW);
    const greeting = computeHomeGreeting(trip, trip.stops[0], plan.stopPlans[0], NOW);
    expect(greeting.title).toBe("下一趟行程");
    expect(greeting.subtitle).toContain("7 月 18 日");
    expect(greeting.title).not.toBe("今天有一趟行程");
  });
});

describe("案例 B：行程日期為今天，但尚未到準備時間", () => {
  it("首頁標題為「今天有一趟行程」，可以開始準備", () => {
    const trip = buildTrip("2026-07-13");
    const plan = computeTripPlan(trip, NOW);
    const greeting = computeHomeGreeting(trip, trip.stops[0], plan.stopPlans[0], NOW);
    expect(greeting.title).toBe("今天有一趟行程");

    const afterPrep = markPrepStarted(trip, NOW);
    expect(afterPrep.actualPrepStartTime).not.toBeNull();
  });
});

describe("案例 C：行程日期為今天且已開始準備", () => {
  it("可以標記出發", () => {
    let trip = buildTrip("2026-07-13");
    trip = markPrepStarted(trip, NOW);
    expect(trip.actualPrepStartTime).not.toBeNull();

    const afterDepart = markStopDeparted(trip, trip.stops[0].id, NOW);
    expect(afterDepart.stops[0].actualDepartureTime).not.toBeNull();
  });
});

describe("案例 D：未來行程呼叫進度函式不得改變任何資料", () => {
  it("markPrepStarted / markStopDeparted / markStopArrived 皆為 no-op", () => {
    const trip = buildTrip("2026-08-01");
    expect(markPrepStarted(trip, NOW)).toEqual(trip);
    expect(markStopDeparted(trip, trip.stops[0].id, NOW)).toEqual(trip);
    expect(markStopArrived(trip, trip.stops[0].id, NOW)).toEqual(trip);
  });
});

describe("案例 E：昨天有一個未完成但從未開始的行程", () => {
  it("不會取代今天或未來的下一趟行程", () => {
    const yesterday = buildTrip("2026-07-12"); // 從未出發
    const today = buildTrip("2026-07-13");
    const active = selectActiveTrip([yesterday, today], NOW);
    expect(active?.id).toBe(today.id);
  });

  it("如果只有過期未開始的行程，首頁不會顯示任何行程", () => {
    const yesterday = buildTrip("2026-07-12");
    const active = selectActiveTrip([yesterday], NOW);
    expect(active).toBeNull();
  });

  it("正在進行中的行程（已出發、尚未抵達）優先於更早的未來行程", () => {
    let inProgress = buildTrip("2026-07-13");
    inProgress = markPrepStarted(inProgress, NOW);
    inProgress = markStopDeparted(inProgress, inProgress.stops[0].id, NOW);

    const laterTrip = buildTrip("2026-07-14");
    const active = selectActiveTrip([laterTrip, inProgress], NOW);
    expect(active?.id).toBe(inProgress.id);
  });
});

describe("資料 migration：清除未來行程被誤寫入的進度資料", () => {
  it("normalizeTrip 會清除未來行程的 actualPrepStartTime / 出發 / 抵達 / completed", () => {
    let bad = buildTrip("2026-07-20");
    bad.actualPrepStartTime = new Date(2026, 6, 12).toISOString();
    bad.stops[0].actualDepartureTime = new Date(2026, 6, 12).toISOString();
    bad.stops[0].actualArrivalTime = new Date(2026, 6, 12).toISOString();
    bad.completed = true;

    const cleaned = normalizeTrip(bad, NOW);
    expect(cleaned.actualPrepStartTime).toBeNull();
    expect(cleaned.stops[0].actualDepartureTime).toBeNull();
    expect(cleaned.stops[0].actualArrivalTime).toBeNull();
    expect(cleaned.completed).toBe(false);
    // 行程內容不受影響
    expect(cleaned.title).toBe(bad.title);
    expect(cleaned.stops[0].name).toBe(bad.stops[0].name);
  });

  it("今天／過去行程的進度資料不會被清除", () => {
    let ok = buildTrip("2026-07-13");
    ok.actualPrepStartTime = NOW.toISOString();
    const cleaned = normalizeTrip(ok, NOW);
    expect(cleaned.actualPrepStartTime).toBe(ok.actualPrepStartTime);
  });
});
