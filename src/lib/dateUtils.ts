/** 將日期字串（YYYY-MM-DD）與時間字串（HH:mm）組合成 Date */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

/** 從 ISO 字串或 Date 取出 YYYY-MM-DD */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 格式化為 HH:mm，24 小時制 */
export function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** 格式化為「M/D（週X）」 */
export function formatDateWithWeekday(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${date.getMonth() + 1}/${date.getDate()}（週${weekdays[date.getDay()]}）`;
}

/** 加上分鐘數，回傳新的 Date（不修改原本物件） */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** 兩個時間相差幾分鐘（a - b） */
export function diffMinutes(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60_000);
}

/** 判斷是否為平日／假日（週六日視為假日） */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** 判斷是否為夜間（18:00 之後或 06:00 之前視為夜間） */
export function isNightTime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 18 || hour < 6;
}

/** 判斷某個日期是「今天」「明天」「本週」「之後」的哪一種分組 */
export function classifyDateGroup(dateStr: string, now: Date = new Date()): "today" | "tomorrow" | "this_week" | "later" | "past" {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return "past";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays <= 7 - today.getDay()) return "this_week";
  return "later";
}

/** 相對時間描述，例如「還有 35 分鐘」「已經超過 8 分鐘」 */
export function describeCountdown(targetAt: Date, now: Date = new Date()): string {
  const minutes = diffMinutes(targetAt, now);
  if (minutes >= 0) {
    return `還有 ${minutes} 分鐘`;
  }
  return `已經超過 ${Math.abs(minutes)} 分鐘`;
}
