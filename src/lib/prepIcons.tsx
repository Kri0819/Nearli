import { LucideIcon, ShowerHead, Sparkles, Shirt, Backpack, Utensils, Wind, DoorOpen, CircleDot } from "lucide-react";

/**
 * 任務名稱對應的小圖示，只用來讓首頁的任務序列更好辨認，
 * 不影響任何資料——找不到對應名稱時用一個通用的圓點圖示。
 */
const TASK_ICONS: Record<string, LucideIcon> = {
  洗澡: ShowerHead,
  化妝: Sparkles,
  挑衣服: Shirt,
  換衣服: Shirt,
  收拾包包: Backpack,
  整理包包: Backpack,
  吃東西: Utensils,
  吃早餐: Utensils,
  整理儀容: Wind,
  吹頭髮: Wind,
  出門: DoorOpen,
};

export function getTaskIcon(taskName: string): LucideIcon {
  return TASK_ICONS[taskName] ?? CircleDot;
}
