import { DayType, FamiliarityLevel, PersonalAdjustment, StopLearningRecord, TimeOfDay } from "@/types/learning";
import { TransportMode } from "@/types/stop";

/**
 * 個人習慣學習引擎。
 *
 * 第一版刻意使用透明、可解釋的加權平均，而不是黑箱模型：
 * 越近期的紀錄權重越高，並依交通方式、熟悉度、平假日、日夜分開計算，
 * 產生的建議都可以直接說明「為什麼」。
 */

interface GroupKey {
  transportMode: TransportMode;
  familiarity: FamiliarityLevel;
  dayType: DayType;
  timeOfDay: TimeOfDay;
}

function keyOf(k: GroupKey): string {
  return `${k.transportMode}|${k.familiarity}|${k.dayType}|${k.timeOfDay}`;
}

/** 最近 N 筆紀錄，越新權重越高（線性遞減，最舊為 1，最新為 N） */
const MAX_RECORDS_PER_GROUP = 8;

export function computePersonalAdjustments(records: StopLearningRecord[]): PersonalAdjustment[] {
  const groups = new Map<string, StopLearningRecord[]>();

  for (const record of records) {
    if (record.actualTravelMinutes === null) continue;
    const key = keyOf(record);
    const list = groups.get(key) ?? [];
    list.push(record);
    groups.set(key, list);
  }

  const results: PersonalAdjustment[] = [];

  for (const [, list] of groups) {
    const recent = [...list]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-MAX_RECORDS_PER_GROUP);

    let weightedDiffSum = 0;
    let weightSum = 0;

    recent.forEach((record, index) => {
      const weight = index + 1; // 越新權重越高
      const diff = (record.actualTravelMinutes ?? record.estimatedTravelMinutes) - record.estimatedTravelMinutes;
      weightedDiffSum += diff * weight;
      weightSum += weight;
    });

    const suggestedExtraMinutes = weightSum > 0 ? Math.round(weightedDiffSum / weightSum) : 0;
    const first = recent[0];

    results.push({
      transportMode: first.transportMode,
      familiarity: first.familiarity,
      dayType: first.dayType,
      timeOfDay: first.timeOfDay,
      suggestedExtraMinutes,
      sampleSize: recent.length,
    });
  }

  return results;
}

/** 依條件查詢個人化調整分鐘數，找不到符合條件的紀錄則回傳 0（沒有足夠資料時不做調整） */
export function lookupPersonalAdjustment(
  adjustments: PersonalAdjustment[],
  criteria: GroupKey
): PersonalAdjustment | null {
  return (
    adjustments.find(
      (a) =>
        a.transportMode === criteria.transportMode &&
        a.familiarity === criteria.familiarity &&
        a.dayType === criteria.dayType &&
        a.timeOfDay === criteria.timeOfDay
    ) ?? null
  );
}

/** 給使用者看的說明文字，例如「Google Maps 預估 20 分鐘，依照你的過往紀錄，本次建議抓 25 分鐘。」 */
export function describeAdjustment(baseMinutes: number, adjustment: PersonalAdjustment | null): string {
  if (!adjustment || adjustment.sampleSize === 0 || adjustment.suggestedExtraMinutes === 0) {
    return `Google Maps 預估 ${baseMinutes} 分鐘。`;
  }
  const suggested = Math.max(0, baseMinutes + adjustment.suggestedExtraMinutes);
  return `Google Maps 預估 ${baseMinutes} 分鐘，依照你的過往紀錄（近 ${adjustment.sampleSize} 次），本次建議抓 ${suggested} 分鐘。`;
}
