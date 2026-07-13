/** 單一停靠點的時間狀態 */
export type RiskStatus = "comfortable" | "tight" | "possible_delay";

export interface StopPlan {
  stopId: string;
  /** 目標抵達時間（考慮提前抵達分鐘數後的實際目標，非最後底線） */
  targetArrivalAt: Date;
  /** 最後底線時間（僅 grace 類型會晚於 targetArrivalAt） */
  hardDeadlineAt: Date;
  /** 這一站必須離開（上一站）的時間 */
  mustLeaveAt: Date;
  /** 路程時間（分鐘，含個人調整） */
  effectiveTravelMinutes: number;
  /** 這一站的風險狀態 */
  riskStatus: RiskStatus;
  /** 給使用者看的狀態說明文字 */
  statusMessage: string;
  /** 是否為負數時間（代表排程不可行，需要使用者調整） */
  isInfeasible: boolean;
}

export interface TripPlan {
  tripId: string;
  /** 第一站必須離開時間再往前推，得出的開始準備時間 */
  prepStartAt: Date | null;
  /** 每個準備事項的起訖時間，依序排列 */
  preparationSchedule: Array<{ taskId: string; startAt: Date; endAt: Date }>;
  /** 每個停靠點的計算結果，依 stops 順序排列 */
  stopPlans: StopPlan[];
  /** 整體行程層級的風險狀態（取最嚴重的一種） */
  overallRiskStatus: RiskStatus;
  /** 整體建議訊息，例如建議縮短哪個順延行程 */
  suggestions: string[];
}
