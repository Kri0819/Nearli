/** 交通方式 */
export type TransportMode = "motorcycle" | "car" | "transit" | "walk" | "other";

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  motorcycle: "機車",
  car: "汽車",
  transit: "大眾運輸",
  walk: "步行",
  other: "其他",
};

/** 時間限制類型 */
export type TimeConstraintType = "strict" | "grace" | "flexible";

export const TIME_CONSTRAINT_LABELS: Record<TimeConstraintType, string> = {
  strict: "一定不能遲到",
  grace: "有寬限時間",
  flexible: "可以順延",
};

export const TIME_CONSTRAINT_HINTS: Record<TimeConstraintType, string> = {
  strict: "適合電影、火車、飛機、考試、面試、報到截止",
  grace: "適合餐廳訂位或一般預約",
  flexible: "適合逛街、買東西、自己吃飯、沒有預約的景點",
};

/** 停車設定方式 */
export type ParkingMode = "auto" | "manual" | "none";

export interface ParkingSetting {
  mode: ParkingMode;
  /** 使用者手動設定時的找車位分鐘數（mode === "manual" 時使用） */
  manualMinutes?: number;
}

/** 單一停靠點 */
export interface Stop {
  id: string;
  /** 地點名稱 */
  name: string;
  /** 完整地址 */
  address: string;
  /** Google Place ID，可為空（尚未確認地點時） */
  placeId: string | null;
  /** 經緯度，可為空 */
  latitude: number | null;
  longitude: number | null;

  /** 指定抵達時間（ISO 字串，含日期，處理跨日情境） */
  targetArrivalTime: string;

  /** 時間限制類型 */
  timeConstraintType: TimeConstraintType;
  /** 寬限分鐘數，僅 timeConstraintType === "grace" 時使用 */
  graceMinutes: number;
  /** 希望提早抵達分鐘數，僅 timeConstraintType === "strict" 時使用 */
  earlyArrivalMinutes: number;

  /** 交通方式 */
  transportMode: TransportMode;
  /** 路程時間（分鐘），來自 Google Maps 或 mock 資料 */
  travelMinutes: number;
  /** 路程時間資料來源說明，例如「示範路程資料」 */
  travelSource: string;

  /** 停車設定 */
  parking: ParkingSetting;
  /** 找車位時間（分鐘），由 parkingEstimator 計算或使用者手動設定後寫回 */
  parkingMinutes: number;
  /** 停車後步行時間（分鐘） */
  walkFromParkingMinutes: number;
  /** 找入口、搭電梯或報到時間（分鐘） */
  entryBufferMinutes: number;
  /** 個人習慣調整時間（分鐘），由學習引擎計算，可正可負 */
  personalAdjustmentMinutes: number;

  /** 備註 */
  note: string;
  /** 排序順序 */
  order: number;

  /** 是否為熟悉地點（用於個人習慣學習分組），預設為陌生 */
  isFamiliarLocation: boolean;
  /** 使用者按下「我已經出發」的實際時間，尚未出發則為 null */
  actualDepartureTime: string | null;
  /** 使用者按下「我已抵達」的實際時間，尚未抵達則為 null */
  actualArrivalTime: string | null;
}

export function createEmptyStop(order: number): Stop {
  return {
    id: `stop-${Date.now()}-${order}`,
    name: "",
    address: "",
    placeId: null,
    latitude: null,
    longitude: null,
    targetArrivalTime: "",
    timeConstraintType: "flexible",
    graceMinutes: 0,
    earlyArrivalMinutes: 0,
    transportMode: "motorcycle",
    travelMinutes: 20,
    travelSource: "尚未計算",
    parking: { mode: "auto" },
    parkingMinutes: 10,
    walkFromParkingMinutes: 5,
    entryBufferMinutes: 5,
    personalAdjustmentMinutes: 0,
    note: "",
    order,
    isFamiliarLocation: false,
    actualDepartureTime: null,
    actualArrivalTime: null,
  };
}
