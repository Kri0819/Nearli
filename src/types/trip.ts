import { PreparationTask } from "./preparation";
import { Stop } from "./stop";

/** 一個完整的行程 */
export interface Trip {
  id: string;
  /** 行程名稱 */
  title: string;
  /** 日期（YYYY-MM-DD） */
  date: string;
  /** 備註 */
  note: string;
  /** 第一站的出發地（地址文字，可能尚未有經緯度） */
  originAddress: string;
  originLatitude: number | null;
  originLongitude: number | null;

  /** 行程前準備事項 */
  preparationTasks: PreparationTask[];
  /** 多個停靠點，依 order 排序 */
  stops: Stop[];

  /** 是否已完成（用於行程列表分組「已完成」） */
  completed: boolean;
  /** 完成後的簡單回顧結果（見 learning.ts） */
  reviewCompletedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export function createEmptyTrip(): Trip {
  const now = new Date().toISOString();
  return {
    id: `trip-${Date.now()}`,
    title: "",
    date: "",
    note: "",
    originAddress: "",
    originLatitude: null,
    originLongitude: null,
    preparationTasks: [],
    stops: [],
    completed: false,
    reviewCompletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
