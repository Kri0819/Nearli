import { TransportMode } from "./stop";

/** Google Places 搜尋結果（或 mock 資料） */
export interface PlaceResult {
  placeId: string | null;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

/** 兩點之間的路程估算結果 */
export interface RouteEstimate {
  minutes: number;
  distanceMeters: number | null;
  /** 資料來源說明文字，例如「目前使用示範路程資料。」 */
  source: string;
  /** 是否為 mock 資料 */
  isMock: boolean;
}

export interface RouteEstimateRequest {
  originAddress: string;
  originLatitude: number | null;
  originLongitude: number | null;
  destinationAddress: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  transportMode: TransportMode;
}
