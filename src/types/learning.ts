import { TransportMode } from "./stop";

/** 行程完成後的簡單回顧選項 */
export type ReviewOutcome =
  | "earlier_than_planned"
  | "on_time"
  | "travel_took_longer"
  | "parking_took_longer"
  | "got_lost"
  | "prep_not_enough"
  | "entry_took_longer";

export const REVIEW_OUTCOME_LABELS: Record<ReviewOutcome, string> = {
  earlier_than_planned: "比預計早",
  on_time: "都很順利",
  travel_took_longer: "路上塞車",
  parking_took_longer: "找車位",
  got_lost: "迷路了",
  prep_not_enough: "準備太久",
  entry_took_longer: "找入口",
};

/** 日夜區段 */
export type TimeOfDay = "day" | "night";
/** 平假日區段 */
export type DayType = "weekday" | "weekend";
/** 熟悉程度 */
export type FamiliarityLevel = "familiar" | "unfamiliar";

/**
 * 單一停靠點完成後留下的學習紀錄。
 * 用來以加權平均方式計算個人化調整分鐘數。
 */
export interface StopLearningRecord {
  id: string;
  stopId: string;
  tripId: string;
  transportMode: TransportMode;
  familiarity: FamiliarityLevel;
  dayType: DayType;
  timeOfDay: TimeOfDay;

  estimatedTravelMinutes: number;
  actualTravelMinutes: number | null;
  estimatedParkingMinutes: number;
  actualParkingMinutes: number | null;
  estimatedPrepMinutes: number | null;
  actualPrepMinutes: number | null;

  gotLost: boolean;
  overshot: boolean;
  couldNotFindEntry: boolean;
  forgotSomething: boolean;
  arrivedOnTime: boolean;

  reviewOutcomes: ReviewOutcome[];
  recordedAt: string;
}

/** 依條件分組計算出的個人化調整結果 */
export interface PersonalAdjustment {
  transportMode: TransportMode;
  familiarity: FamiliarityLevel;
  dayType: DayType;
  timeOfDay: TimeOfDay;
  /** 加權平均後，建議在 Google Maps 預估之外額外增加的分鐘數 */
  suggestedExtraMinutes: number;
  /** 根據幾筆紀錄計算出來的 */
  sampleSize: number;
}
