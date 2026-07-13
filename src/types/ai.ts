import { TimeConstraintType } from "./stop";

/** AI 解析出的單一停靠點（尚未確認，資料較寬鬆） */
export interface ParsedStop {
  /** 使用者輸入的地點名稱原文，例如「鼎泰豐」「電影院」 */
  rawName: string;
  /** 若地點名稱明確，才會填入；不明確則為 null 並列入 unresolvedPlaces */
  resolvedName: string | null;
  /** 抵達時間，HH:mm，AI 不可自行捏造，缺漏則為 null 由使用者補上 */
  arrivalTime: string | null;
  timeConstraintType: TimeConstraintType;
  graceMinutes: number | null;
  earlyArrivalMinutes: number | null;
  note: string | null;
}

/** AI 解析後、尚未儲存、待使用者於「確認行程」頁修改的資料結構 */
export interface ParsedItinerary {
  tripTitle: string;
  /** YYYY-MM-DD，若使用者只說「星期六」，由 parser 換算成最近的星期六 */
  date: string | null;
  preparationTasks: Array<{ name: string; estimatedMinutes: number }>;
  stops: ParsedStop[];
  /** 需要使用者手動選擇正確地點/分店的項目 */
  unresolvedPlaces: string[];
  /** 給使用者的提醒，例如「AI 無法計算路程時間，請於確認頁面查看」 */
  warnings: string[];
}
