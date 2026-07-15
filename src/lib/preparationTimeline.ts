import { PreparationTask } from "@/types/preparation";
import { addMinutes, diffMinutes } from "@/lib/dateUtils";
import { RiskStatus } from "@/types/timeline";

/**
 * 把行程前準備事項排成一段可執行的時間軸。
 * 這個檔案只負責純計算，不依賴 React／瀏覽器 API。
 */

export type PreparationTaskStatus = "upcoming" | "current" | "completed" | "overdue";

export interface PreparationTaskPlan {
  taskId: string;
  name: string;
  plannedStartAt: Date;
  plannedEndAt: Date;
  estimatedMinutes: number;
  status: PreparationTaskStatus;
  actualStartedAt: Date | null;
  actualCompletedAt: Date | null;
}

/**
 * 從 mustLeaveAt 往前倒推出每個事項「原本」的開始時間；
 * 一旦某個事項有實際開始／完成時間，後面事項的規劃時間會依照實際進度往後順延，
 * 不會回頭修改使用者設定的預估分鐘數，也不會自動刪除或縮短任何事項。
 */
export function computePreparationPlan(
  tasks: PreparationTask[],
  mustLeaveAt: Date,
  now: Date
): PreparationTaskPlan[] {
  const enabled = [...tasks].filter((t) => t.enabled).sort((a, b) => a.order - b.order);
  const totalMinutes = enabled.reduce((sum, t) => sum + Math.max(0, t.estimatedMinutes), 0);

  let cursor = addMinutes(mustLeaveAt, -totalMinutes);
  const plans: PreparationTaskPlan[] = [];

  for (const task of enabled) {
    const actualStartedAt = task.actualStartedAt ? new Date(task.actualStartedAt) : null;
    const actualCompletedAt = task.actualCompletedAt ? new Date(task.actualCompletedAt) : null;

    const plannedStartAt = actualStartedAt ?? cursor;
    const plannedEndAt = actualCompletedAt ?? addMinutes(plannedStartAt, Math.max(0, task.estimatedMinutes));

    let status: PreparationTaskStatus;
    if (actualCompletedAt) status = "completed";
    else if (actualStartedAt) status = "current";
    else if (now > plannedStartAt) status = "overdue";
    else status = "upcoming";

    plans.push({
      taskId: task.id,
      name: task.name,
      plannedStartAt,
      plannedEndAt,
      estimatedMinutes: task.estimatedMinutes,
      status,
      actualStartedAt,
      actualCompletedAt,
    });

    cursor = plannedEndAt;
  }

  return plans;
}

/** 目前應該顯示給使用者看的那一個準備事項：依序找第一個還沒完成的 */
export function getActivePreparationTask(plans: PreparationTaskPlan[]): PreparationTaskPlan | null {
  return plans.find((p) => p.status !== "completed") ?? null;
}

export function getNextUpcomingTask(plans: PreparationTaskPlan[], afterTaskId: string): PreparationTaskPlan | null {
  const index = plans.findIndex((p) => p.taskId === afterTaskId);
  if (index === -1) return null;
  return plans[index + 1] ?? null;
}

export function isPreparationFullyDone(plans: PreparationTaskPlan[]): boolean {
  return plans.length > 0 && plans.every((p) => p.status === "completed");
}

/**
 * 某個事項實際花費是否超過原本預估。語氣中性，只陳述事實，不責備使用者。
 * 只有已開始（進行中或已完成）的事項才有意義。
 */
export function describeTaskOverrun(plan: PreparationTaskPlan, now: Date): string | null {
  if (plan.status === "completed" && plan.actualStartedAt && plan.actualCompletedAt) {
    const actualMinutes = diffMinutes(plan.actualCompletedAt, plan.actualStartedAt);
    const overBy = actualMinutes - plan.estimatedMinutes;
    return overBy > 0 ? `${plan.name}比原定多花了 ${overBy} 分鐘` : null;
  }
  if (plan.status === "current" && plan.actualStartedAt) {
    const elapsed = diffMinutes(now, plan.actualStartedAt);
    const overBy = elapsed - plan.estimatedMinutes;
    return overBy > 0 ? `${plan.name}比原定多花了 ${overBy} 分鐘` : null;
  }
  return null;
}

/**
 * 延誤後的最小重算：只看「目前推算出來的準備完成時間」是否還能在必須離開時間之前完成。
 * 不會自動刪除、縮短或跳過使用者的準備事項，只回傳建議文字。
 */
export function assessPreparationRisk(
  plans: PreparationTaskPlan[],
  mustLeaveAt: Date,
  now: Date
): { status: RiskStatus; message: string } {
  if (plans.length === 0) {
    return { status: "comfortable", message: "目前仍有足夠時間。" };
  }

  const last = plans[plans.length - 1];
  const projectedFinishAt = last.actualCompletedAt ?? last.plannedEndAt;
  const slack = diffMinutes(mustLeaveAt, projectedFinishAt);

  if (slack >= 5) {
    return { status: "comfortable", message: "目前仍有足夠時間。" };
  }
  if (slack >= 0) {
    return { status: "tight", message: "時間開始偏緊，建議現在進入下一步。" };
  }

  const hasUnstartedTask = plans.some((p) => p.status === "upcoming" || p.status === "overdue");
  const suggestion = hasUnstartedTask ? "可考慮跳過或縮短某個尚未開始的事項。" : "";
  return { status: "possible_delay", message: `若維持目前進度，可能晚到。${suggestion}` };
}
