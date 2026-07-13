import { Stop } from "@/types/stop";
import { Trip } from "@/types/trip";

/**
 * 分享功能只允許以下欄位出現在分享網址中，其餘一律不可外洩：
 * 不能分享：出發地、住家地址、準備事項、幾點化妝/上廁所、前一站去了哪裡、
 * 個人習慣資料、私人備註。
 */
export interface SharedStopPayload {
  tripTitle: string;
  date: string;
  stopName: string;
  address: string;
  arrivalTime: string;
  /** 最後可接受時間，可選 */
  latestAcceptableTime: string | null;
  /** Google Maps 地點連結 */
  mapUrl: string;
  /** 簡單抵達狀態，可選 */
  simpleStatus: string | null;
}

export function buildShareableStopPayload(
  trip: Trip,
  stop: Stop,
  mapUrl: string,
  options: { includeLatestAcceptableTime: boolean; includeStatus: boolean; simpleStatus?: string }
): SharedStopPayload {
  const arrivalDate = new Date(stop.targetArrivalTime);
  const arrivalTime = `${String(arrivalDate.getHours()).padStart(2, "0")}:${String(arrivalDate.getMinutes()).padStart(2, "0")}`;

  let latestAcceptableTime: string | null = null;
  if (options.includeLatestAcceptableTime && stop.timeConstraintType === "grace" && stop.graceMinutes > 0) {
    const latest = new Date(arrivalDate.getTime() + stop.graceMinutes * 60_000);
    latestAcceptableTime = `${String(latest.getHours()).padStart(2, "0")}:${String(latest.getMinutes()).padStart(2, "0")}`;
  }

  return {
    tripTitle: trip.title,
    date: trip.date,
    stopName: stop.name,
    address: stop.address,
    arrivalTime,
    latestAcceptableTime,
    mapUrl,
    simpleStatus: options.includeStatus ? options.simpleStatus ?? null : null,
  };
}

/** 將分享資料編碼成 URL-safe base64 字串，放進分享連結 query */
export function encodeSharePayload(payload: SharedStopPayload): string {
  const json = JSON.stringify(payload);
  const base64 = typeof window === "undefined" ? Buffer.from(json, "utf-8").toString("base64") : window.btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSharePayload(encoded: string): SharedStopPayload | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window === "undefined"
        ? Buffer.from(base64, "base64").toString("utf-8")
        : decodeURIComponent(escape(window.atob(base64)));
    return JSON.parse(json) as SharedStopPayload;
  } catch (error) {
    console.error("[shareEncoding] 解碼分享資料失敗", error);
    return null;
  }
}
