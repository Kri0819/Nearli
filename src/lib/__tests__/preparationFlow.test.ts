import { describe, it, expect } from "vitest";
import { createEmptyTrip } from "@/types/trip";
import { createEmptyStop } from "@/types/stop";
import { PreparationTask } from "@/types/preparation";
import { combineDateAndTime, formatTime } from "@/lib/dateUtils";
import {
  computePreparationPlan,
  getActivePreparationTask,
  isPreparationFullyDone,
  assessPreparationRisk,
} from "@/lib/preparationTimeline";
import { startPreparationTask, completePreparationTask, skipPreparationTask, resetTripProgress } from "@/lib/tripProgress";
import { normalizeTrip } from "@/lib/storage";
import { computeTripPlan } from "@/lib/timeCalculation";

const NOW = new Date(2026, 6, 13, 12, 40, 0); // 2026-07-13 12:40

function buildTripWithPrep(dateStr: string, mustLeaveTime: string) {
  const trip = createEmptyTrip();
  trip.title = "週六約會";
  trip.date = dateStr;

  const prepTasks: PreparationTask[] = [
    { id: "p1", name: "洗澡", estimatedMinutes: 20, enabled: true, order: 0, actualStartedAt: null, actualCompletedAt: null },
    { id: "p2", name: "化妝", estimatedMinutes: 30, enabled: true, order: 1, actualStartedAt: null, actualCompletedAt: null },
    { id: "p3", name: "收拾包包", estimatedMinutes: 10, enabled: true, order: 2, actualStartedAt: null, actualCompletedAt: null },
  ];
  trip.preparationTasks = prepTasks;

  const stop = createEmptyStop(0);
  stop.name = "漢神巨蛋";
  // 用 mustLeaveTime 反推一個抵達時間：travel/parking/walk/entry 全設 0，只留風險緩衝(5分鐘)
  stop.targetArrivalTime = combineDateAndTime(dateStr, mustLeaveTime).toISOString();
  stop.travelMinutes = 0;
  stop.parking = { mode: "none" };
  stop.parkingMinutes = 0;
  stop.walkFromParkingMinutes = 0;
  stop.entryBufferMinutes = 0;
  trip.stops = [stop];

  return trip;
}

describe("案例 A：三個準備事項，倒推排程", () => {
  it("洗澡 12:30–12:50，化妝 12:50–13:20，收拾包包 13:20–13:30", () => {
    const trip = buildTripWithPrep("2026-07-13", "13:35"); // 13:35 - 5分鐘風險緩衝 = 13:30 必須離開
    const plan = computeTripPlan(trip, NOW);
    const mustLeaveAt = plan.stopPlans[0].mustLeaveAt;
    expect(formatTime(mustLeaveAt)).toBe("13:30");

    const prepPlans = computePreparationPlan(trip.preparationTasks, mustLeaveAt, NOW);
    expect(prepPlans.map((p) => [p.name, formatTime(p.plannedStartAt), formatTime(p.plannedEndAt)])).toEqual([
      ["洗澡", "12:30", "12:50"],
      ["化妝", "12:50", "13:20"],
      ["收拾包包", "13:20", "13:30"],
    ]);
  });
});

describe("案例 B：12:35 才開始洗澡（比原定 12:30 晚 5 分鐘）", () => {
  it("重新計算剩餘時間，不刪除後續任務", () => {
    let trip = buildTripWithPrep("2026-07-13", "13:35");
    trip = startPreparationTask(trip, "p1", new Date(2026, 6, 13, 12, 35, 0));

    const plan = computeTripPlan(trip, NOW);
    const mustLeaveAt = plan.stopPlans[0].mustLeaveAt;
    const prepPlans = computePreparationPlan(trip.preparationTasks, mustLeaveAt, NOW);

    // 洗澡確實從 12:35 開始（沒有被覆蓋成原定的 12:30）
    expect(formatTime(prepPlans[0].plannedStartAt)).toBe("12:35");
    // 後續事項依照實際進度往後順延，仍然是三個事項，沒有被刪除
    expect(prepPlans).toHaveLength(3);
    expect(formatTime(prepPlans[1].plannedStartAt)).toBe("12:55");
    expect(formatTime(prepPlans[2].plannedStartAt)).toBe("13:25");

    // 整體時間開始偏緊或可能延誤（因為累積終點 13:35 已經超過必須離開時間 13:30）
    const risk = assessPreparationRisk(prepPlans, mustLeaveAt, NOW);
    expect(risk.status).not.toBe("comfortable");
  });
});

describe("案例 C：完成洗澡", () => {
  it("自動切換下一步為化妝，保留洗澡的實際開始／完成時間", () => {
    let trip = buildTripWithPrep("2026-07-13", "13:35");
    trip = startPreparationTask(trip, "p1", new Date(2026, 6, 13, 12, 30, 0));
    trip = completePreparationTask(trip, "p1", new Date(2026, 6, 13, 12, 50, 0));

    const bathTask = trip.preparationTasks.find((t) => t.id === "p1")!;
    expect(bathTask.actualStartedAt).not.toBeNull();
    expect(bathTask.actualCompletedAt).not.toBeNull();

    const plan = computeTripPlan(trip, NOW);
    const prepPlans = computePreparationPlan(trip.preparationTasks, plan.stopPlans[0].mustLeaveAt, NOW);
    const active = getActivePreparationTask(prepPlans);
    expect(active?.name).toBe("化妝");
  });
});

describe("案例 D：所有準備事項完成", () => {
  it("顯示準備完成，可以出發", () => {
    let trip = buildTripWithPrep("2026-07-13", "13:35");
    trip = completePreparationTask(trip, "p1", new Date(2026, 6, 13, 12, 50, 0));
    trip = completePreparationTask(trip, "p2", new Date(2026, 6, 13, 13, 20, 0));
    trip = skipPreparationTask(trip, "p3", new Date(2026, 6, 13, 13, 30, 0));

    const plan = computeTripPlan(trip, NOW);
    const prepPlans = computePreparationPlan(trip.preparationTasks, plan.stopPlans[0].mustLeaveAt, NOW);
    expect(isPreparationFullyDone(prepPlans)).toBe(true);
    expect(getActivePreparationTask(prepPlans)).toBeNull();
  });
});

describe("案例 E：未來行程不可開始任何準備任務", () => {
  it("startPreparationTask / completePreparationTask / skipPreparationTask 皆為 no-op", () => {
    const trip = buildTripWithPrep("2026-08-01", "13:35");
    expect(startPreparationTask(trip, "p1", NOW)).toEqual(trip);
    expect(completePreparationTask(trip, "p1", NOW)).toEqual(trip);
    expect(skipPreparationTask(trip, "p1", NOW)).toEqual(trip);
  });
});

describe("案例 F：舊版 localStorage 行程沒有準備事項進度欄位", () => {
  it("normalizeTrip 自動補上空進度，不會崩潰，原有資料不消失", () => {
    const trip = buildTripWithPrep("2026-07-13", "13:35");
    // 模擬舊資料：拿掉 actualStartedAt / actualCompletedAt 欄位
    const legacyTasks = trip.preparationTasks.map(({ actualStartedAt, actualCompletedAt, ...rest }) => rest);
    const legacyTrip = { ...trip, preparationTasks: legacyTasks } as unknown as typeof trip;

    const cleaned = normalizeTrip(legacyTrip, NOW);
    expect(cleaned.preparationTasks).toHaveLength(3);
    cleaned.preparationTasks.forEach((t) => {
      expect(t.actualStartedAt).toBeNull();
      expect(t.actualCompletedAt).toBeNull();
    });
    // 名稱與預估分鐘數等原有內容不受影響
    expect(cleaned.preparationTasks.map((t) => t.name)).toEqual(["洗澡", "化妝", "收拾包包"]);
    expect(cleaned.preparationTasks[0].estimatedMinutes).toBe(20);
  });

  it("未來行程的準備事項若被誤寫入進度，也會被清除", () => {
    let trip = buildTripWithPrep("2026-08-01", "13:35");
    trip = {
      ...trip,
      preparationTasks: trip.preparationTasks.map((t, i) =>
        i === 0 ? { ...t, actualStartedAt: NOW.toISOString(), actualCompletedAt: NOW.toISOString() } : t
      ),
    };
    const cleaned = normalizeTrip(trip, NOW);
    cleaned.preparationTasks.forEach((t) => {
      expect(t.actualStartedAt).toBeNull();
      expect(t.actualCompletedAt).toBeNull();
    });
  });
});

describe("resetTripProgress 一併清除準備事項進度", () => {
  it("重設後所有 actualStartedAt / actualCompletedAt 變回 null，內容保留", () => {
    let trip = buildTripWithPrep("2026-07-13", "13:35");
    trip = startPreparationTask(trip, "p1", new Date(2026, 6, 13, 12, 30, 0));
    trip = completePreparationTask(trip, "p1", new Date(2026, 6, 13, 12, 50, 0));

    const reset = resetTripProgress(trip);
    reset.preparationTasks.forEach((t) => {
      expect(t.actualStartedAt).toBeNull();
      expect(t.actualCompletedAt).toBeNull();
    });
    expect(reset.preparationTasks.map((t) => t.name)).toEqual(["洗澡", "化妝", "收拾包包"]);
  });
});
