import { Trip } from "@/types/trip";
import { diffMinutes } from "@/lib/dateUtils";

const MAX_SAMPLES = 5;

/**
 * 依照過去行程中，相同名稱準備事項的實際完成時間，
 * 用加權平均（越近期權重越高）提出建議的預估分鐘數。
 * 這是第一版的透明規則，不是大型 AI，也不會未經確認就永久修改設定。
 */
export function getSuggestedPreparationMinutes(taskName: string, trips: Trip[]): number | null {
  const samples: Array<{ minutes: number; completedAt: string }> = [];

  for (const trip of trips) {
    for (const task of trip.preparationTasks) {
      if (task.name !== taskName) continue;
      if (!task.actualStartedAt || !task.actualCompletedAt) continue;
      const minutes = diffMinutes(new Date(task.actualCompletedAt), new Date(task.actualStartedAt));
      if (minutes > 0) samples.push({ minutes, completedAt: task.actualCompletedAt });
    }
  }

  if (samples.length === 0) return null;

  const recent = samples
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .slice(-MAX_SAMPLES);

  let weightedSum = 0;
  let weightTotal = 0;
  recent.forEach(({ minutes }, index) => {
    const weight = index + 1;
    weightedSum += minutes * weight;
    weightTotal += weight;
  });

  return Math.round(weightedSum / weightTotal);
}
