import { Trip } from "@/types/trip";
import { Stop, TIME_CONSTRAINT_LABELS } from "@/types/stop";
import { RiskStatus, StopPlan, TripPlan } from "@/types/timeline";
import { addMinutes, combineDateAndTime, diffMinutes, formatTime } from "@/lib/dateUtils";

/**
 * 所有時間倒推計算集中在這個檔案的純函式中，
 * 不依賴 React、不依賴瀏覽器 API，方便測試與未來調整。
 */

/** 額外風險緩衝分鐘數，用來吸收計算誤差 */
export const RISK_BUFFER_MINUTES = 5;

/** 進入「時間偏緊」狀態的提前判斷分鐘數 */
const TIGHT_WARNING_LOOKAHEAD_MINUTES = 20;

function effectiveParkingMinutes(stop: Stop): number {
  if (stop.parking.mode === "none") return 0;
  return Math.max(0, stop.parkingMinutes);
}

function effectiveTravelMinutes(stop: Stop): number {
  return Math.max(0, stop.travelMinutes + stop.personalAdjustmentMinutes);
}

/** 這一站扣除所有緩衝後的總分鐘數（不含提前抵達，因為提前抵達已反映在目標抵達時間） */
function totalBufferMinutes(stop: Stop): number {
  return (
    effectiveTravelMinutes(stop) +
    effectiveParkingMinutes(stop) +
    Math.max(0, stop.walkFromParkingMinutes) +
    Math.max(0, stop.entryBufferMinutes) +
    RISK_BUFFER_MINUTES
  );
}

/**
 * 計算單一停靠點的時間規劃（不考慮前後站鏈接關係，只看這一站本身）。
 */
export function computeStopPlan(stop: Stop, now: Date): StopPlan {
  const rawTargetArrival = new Date(stop.targetArrivalTime);
  const constraintLabel = TIME_CONSTRAINT_LABELS[stop.timeConstraintType];

  // 「一定不能遲到」：實際目標抵達時間 = 指定時間 - 提前抵達分鐘數
  // 「有寬限時間」與「可以順延」：目標抵達時間就是指定時間本身，不可以把寬限直接排進正常規劃
  const earlyArrival = stop.timeConstraintType === "strict" ? Math.max(0, stop.earlyArrivalMinutes) : 0;
  const targetArrivalAt = addMinutes(rawTargetArrival, -earlyArrival);

  const hardDeadlineAt =
    stop.timeConstraintType === "grace"
      ? addMinutes(rawTargetArrival, Math.max(0, stop.graceMinutes))
      : rawTargetArrival;

  const buffer = totalBufferMinutes(stop);
  const mustLeaveAt = addMinutes(targetArrivalAt, -buffer);
  const mustLeaveByHardDeadlineAt = addMinutes(hardDeadlineAt, -buffer);

  // 保底防呆：buffer 理論上不會是負數，若發生代表資料有誤，標記為不可行
  const isInfeasible = buffer < 0;

  // 假設「現在馬上出發」，預計抵達時間
  const projectedArrivalIfLeaveNow = addMinutes(now, buffer);

  let riskStatus: RiskStatus;
  let statusMessage: string;

  if (now <= mustLeaveAt) {
    riskStatus = "comfortable";
    statusMessage = "目前仍可準時抵達。";
  } else if (stop.timeConstraintType === "grace" && now <= mustLeaveByHardDeadlineAt) {
    riskStatus = "tight";
    const slack = diffMinutes(mustLeaveByHardDeadlineAt, now);
    statusMessage = `再晚 ${Math.max(slack, 0)} 分鐘離開，就會使用到${stop.name || "這一站"}的寬限時間。`;
  } else if (
    stop.timeConstraintType !== "grace" &&
    diffMinutes(mustLeaveAt, now) > -TIGHT_WARNING_LOOKAHEAD_MINUTES
  ) {
    riskStatus = "tight";
    statusMessage = "依照目前進度，建議現在開始準備。";
  } else if (projectedArrivalIfLeaveNow <= hardDeadlineAt) {
    riskStatus = "tight";
    const slack = diffMinutes(hardDeadlineAt, projectedArrivalIfLeaveNow);
    statusMessage =
      slack > 0
        ? `依照目前進度，建議現在開始準備，還有約 ${slack} 分鐘緩衝。`
        : "依照目前進度，建議現在開始準備。";
  } else {
    riskStatus = "possible_delay";
    const overMinutes = diffMinutes(projectedArrivalIfLeaveNow, hardDeadlineAt);
    statusMessage = `預計 ${formatTime(projectedArrivalIfLeaveNow)} 抵達，已超過${
      stop.timeConstraintType === "grace" ? "最後保留時間" : "預定時間"
    } ${overMinutes} 分鐘。`;
  }

  return {
    stopId: stop.id,
    targetArrivalAt,
    hardDeadlineAt,
    mustLeaveAt,
    effectiveTravelMinutes: effectiveTravelMinutes(stop),
    riskStatus,
    statusMessage,
    isInfeasible,
  };
}

function worseStatus(a: RiskStatus, b: RiskStatus): RiskStatus {
  const rank: Record<RiskStatus, number> = { comfortable: 0, tight: 1, possible_delay: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/**
 * 計算整趟行程的規劃：每一站的時間、開始準備時間、整體風險狀態與建議。
 * 會檢查前後站的鏈接關係（前一站抵達時間是否晚於下一站必須離開時間）。
 */
export function computeTripPlan(trip: Trip, now: Date = new Date()): TripPlan {
  const orderedStops = [...trip.stops].sort((a, b) => a.order - b.order);
  const stopPlans = orderedStops.map((stop) => computeStopPlan(stop, now));

  const suggestions: string[] = [];

  // 檢查前後站鏈接：前一站的目標抵達時間是否晚於下一站的必須離開時間
  for (let i = 1; i < orderedStops.length; i++) {
    const prevStop = orderedStops[i - 1];
    const prevPlan = stopPlans[i - 1];
    const currStop = orderedStops[i];
    const currPlan = stopPlans[i];

    const gapMinutes = diffMinutes(currPlan.mustLeaveAt, prevPlan.targetArrivalAt);
    if (gapMinutes < 0) {
      currPlan.isInfeasible = true;
      currPlan.riskStatus = worseStatus(currPlan.riskStatus, "possible_delay");
      if (prevStop.timeConstraintType === "flexible") {
        suggestions.push(
          `若要準時抵達「${currStop.name || "下一站"}」，建議將「${prevStop.name || "上一站"}」的時間縮短 ${Math.abs(
            gapMinutes
          )} 分鐘。`
        );
      } else {
        suggestions.push(
          `「${prevStop.name || "上一站"}」與「${currStop.name || "下一站"}」的時間安排太緊湊，建議調整其中一站的時間或交通方式。`
        );
      }
    }
  }

  const overallRiskStatus = stopPlans.reduce<RiskStatus>(
    (acc, plan) => worseStatus(acc, plan.riskStatus),
    "comfortable"
  );

  // 第一站再往前扣除所有啟用的準備事項，得出開始準備時間
  let prepStartAt: Date | null = null;
  const preparationSchedule: TripPlan["preparationSchedule"] = [];

  if (stopPlans.length > 0) {
    const firstStopMustLeaveAt = stopPlans[0].mustLeaveAt;
    const enabledTasks = [...trip.preparationTasks]
      .filter((t) => t.enabled)
      .sort((a, b) => a.order - b.order);

    const totalPrepMinutes = enabledTasks.reduce((sum, t) => sum + Math.max(0, t.estimatedMinutes), 0);
    prepStartAt = addMinutes(firstStopMustLeaveAt, -totalPrepMinutes);

    let cursor = prepStartAt;
    for (const task of enabledTasks) {
      const startAt = cursor;
      const endAt = addMinutes(cursor, Math.max(0, task.estimatedMinutes));
      preparationSchedule.push({ taskId: task.id, startAt, endAt });
      cursor = endAt;
    }
  }

  return {
    tripId: trip.id,
    prepStartAt,
    preparationSchedule,
    stopPlans,
    overallRiskStatus,
    suggestions,
  };
}
