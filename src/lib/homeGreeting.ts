import { Trip } from "@/types/trip";
import { classifyDateGroup, formatMonthDay, formatTime } from "@/lib/dateUtils";
import { StopPlan } from "@/types/timeline";
import { Stop } from "@/types/stop";

export interface HomeGreeting {
  title: string;
  subtitle: string;
}

/**
 * 首頁標題／副標題，依 activeTrip.date 與本地今天的關係動態決定。
 * 一律透過 classifyDateGroup（內部使用 YYYY-MM-DD 字串比較）判斷，
 * 不直接用 `new Date(dateStr)` 比較，避免 UTC 偏移。
 */
export function computeHomeGreeting(
  trip: Trip,
  nextStop: Stop,
  nextStopPlan: StopPlan | undefined,
  now: Date = new Date()
): HomeGreeting {
  const dateGroup = classifyDateGroup(trip.date, now);

  if (dateGroup === "today") {
    return { title: "今天有一趟行程", subtitle: "下一個動作已經替你算好了。" };
  }

  if (dateGroup === "tomorrow") {
    const subtitle = nextStopPlan
      ? `${formatMonthDay(trip.date)} ${formatTime(nextStopPlan.targetArrivalAt)} 抵達${nextStop.name || "第一站"}`
      : formatMonthDay(trip.date);
    return { title: "明天有一趟行程", subtitle };
  }

  return {
    title: "下一趟行程",
    subtitle: `${formatMonthDay(trip.date)}，已替你算好準備與出發時間。`,
  };
}
