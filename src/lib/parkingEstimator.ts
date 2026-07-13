import { TransportMode } from "@/types/stop";
import { isNightTime, isWeekend } from "@/lib/dateUtils";

/**
 * parkingEstimator：規則式的找車位時間估算。
 *
 * 這一版沒有任何即時停車資料，全部依照簡單規則推算，
 * 並且一定會附上估算來源說明，避免讓使用者誤以為是真實即時資料。
 * 未來可以替換成 Google Places 或台灣停車資料 API，
 * 只需要替換這個檔案裡的實作，介面（ParkingEstimateInput / ParkingEstimateResult）保持不變。
 */

export type AreaType = "downtown" | "suburb";

export interface ParkingEstimateInput {
  transportMode: TransportMode;
  placeHasOwnParking: boolean;
  isPopularArea: boolean;
  areaType: AreaType;
  at: Date;
  /** 使用者過去同類型（交通方式 + 區域熱門程度）的平均找車位分鐘數，若無資料則為 null */
  personalHistoryAverageMinutes: number | null;
}

export interface ParkingEstimateResult {
  minutes: number;
  /** 給使用者看的估算來源說明文字 */
  source: string;
}

const BASE_MINUTES: Record<TransportMode, number> = {
  motorcycle: 5,
  car: 12,
  transit: 0,
  walk: 0,
  other: 8,
};

export function estimateParkingMinutes(input: ParkingEstimateInput): ParkingEstimateResult {
  if (input.transportMode === "transit" || input.transportMode === "walk") {
    return { minutes: 0, source: "此交通方式不需要停車。" };
  }

  if (input.placeHasOwnParking) {
    const minutes = input.transportMode === "car" ? 6 : 3;
    return {
      minutes,
      source: "此地點本身附有停車場，已依交通方式暫估基本入場時間。",
    };
  }

  let minutes = BASE_MINUTES[input.transportMode];

  const weekend = isWeekend(input.at);
  const night = isNightTime(input.at);

  const reasons: string[] = [];

  if (input.areaType === "downtown") {
    minutes += 5;
    reasons.push("市區");
  } else {
    reasons.push("郊區");
  }

  if (input.isPopularArea) {
    minutes += 5;
    reasons.push("熱門商圈");
  }

  if (weekend && night) {
    minutes += 6;
    reasons.push("週末晚間");
  } else if (weekend) {
    minutes += 3;
    reasons.push("週末");
  } else if (night) {
    minutes += 2;
    reasons.push("晚間");
  } else {
    reasons.push("平日白天");
  }

  let source = `此地點缺少即時停車資料，已依照${reasons.join("、")}，暫估 ${minutes} 分鐘。`;

  if (input.personalHistoryAverageMinutes !== null) {
    const blended = Math.round((minutes + input.personalHistoryAverageMinutes) / 2);
    minutes = blended;
    source = `此地點缺少即時停車資料，已依照${reasons.join("、")}與你的過往紀錄，暫估 ${minutes} 分鐘。`;
  }

  return { minutes, source };
}
