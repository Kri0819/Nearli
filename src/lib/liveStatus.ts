import { Stop } from "@/types/stop";
import { StopPlan } from "@/types/timeline";
import { addMinutes, diffMinutes } from "@/lib/dateUtils";

/**
 * 這個檔案只負責「呈現」已經由 timeCalculation.ts 算好的數字，
 * 不會重新定義或修改任何時間倒推公式。
 */

export interface ArrivalPrediction {
  predictedArrivalAt: Date;
  /** 正值代表比目標時間早，負值代表晚 */
  diffFromTargetMinutes: number;
}

/** 假設現在馬上出發，套用 StopPlan 已經算好的路程與緩衝，預估抵達時間 */
export function predictArrivalIfDepartingNow(stop: Stop, stopPlan: StopPlan, now: Date): ArrivalPrediction {
  const parkingMinutes = stop.parking.mode === "none" ? 0 : Math.max(0, stop.parkingMinutes);
  const remainingMinutes =
    stopPlan.effectiveTravelMinutes +
    parkingMinutes +
    Math.max(0, stop.walkFromParkingMinutes) +
    Math.max(0, stop.entryBufferMinutes);
  const predictedArrivalAt = addMinutes(now, remainingMinutes);
  return {
    predictedArrivalAt,
    diffFromTargetMinutes: diffMinutes(stopPlan.targetArrivalAt, predictedArrivalAt),
  };
}

/** 「已出發」階段的簡短說明文字，語氣不責備使用者 */
export function describeDepartedStatus(stop: Stop, prediction: ArrivalPrediction): string {
  if (prediction.diffFromTargetMinutes >= 0) {
    return `比目標時間早 ${prediction.diffFromTargetMinutes} 分鐘`;
  }
  const lateBy = Math.abs(prediction.diffFromTargetMinutes);
  if (stop.timeConstraintType === "grace" && stop.graceMinutes > 0) {
    if (lateBy <= stop.graceMinutes) {
      return `將使用${stop.name || "這一站"} ${stop.graceMinutes} 分鐘寬限中的 ${lateBy} 分鐘，仍可在最後保留時間內抵達`;
    }
    const over = lateBy - stop.graceMinutes;
    return `已超過最後保留時間 ${over} 分鐘，建議現在聯絡對方`;
  }
  if (lateBy === 0) return "預計準時抵達";
  return `比目標時間晚 ${lateBy} 分鐘`;
}
