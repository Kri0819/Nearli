import { PlaceResult, RouteEstimate, RouteEstimateRequest } from "@/types/maps";
import { TransportMode } from "@/types/stop";

/**
 * Google Maps 服務層（adapter）。
 *
 * 所有跟地圖相關的呼叫都集中在這裡，UI 元件不會直接呼叫 Google API。
 * 目前尚未設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 時，
 * 全部回傳 mock 資料，並且明確標示「目前使用示範路程資料」，
 * 不會假裝有真實資料。
 */

const MOCK_NOTICE = "目前使用示範路程資料。";

function hasApiKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
}

const MOCK_TRAVEL_MINUTES_BY_MODE: Record<TransportMode, number> = {
  motorcycle: 18,
  car: 25,
  transit: 35,
  walk: 12,
  other: 20,
};

/** 地點 autocomplete + Place Details（合併為單一搜尋函式） */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query.trim()) return [];

  if (!hasApiKey()) {
    return buildMockPlaceResults(query);
  }

  try {
    // 實際串接時，這裡會呼叫 Google Places Autocomplete + Place Details API。
    // 第一版尚未串接，先以 mock 資料代替，確保介面契約（PlaceResult）已經固定。
    return buildMockPlaceResults(query);
  } catch (error) {
    console.error("[mapsAdapter] searchPlaces 失敗，改用示範資料", error);
    return buildMockPlaceResults(query);
  }
}

function buildMockPlaceResults(query: string): PlaceResult[] {
  return [
    {
      placeId: null,
      name: query,
      address: `${query}（示範地址，尚未串接 Google Places）`,
      latitude: null,
      longitude: null,
    },
  ];
}

/** 估算兩點之間的路程時間 */
export async function estimateRoute(request: RouteEstimateRequest): Promise<RouteEstimate> {
  if (!hasApiKey()) {
    return {
      minutes: MOCK_TRAVEL_MINUTES_BY_MODE[request.transportMode],
      distanceMeters: null,
      source: MOCK_NOTICE,
      isMock: true,
    };
  }

  try {
    // 實際串接時，這裡會呼叫 Google Distance Matrix / Routes API。
    // 第一版尚未串接金鑰邏輯，先回傳 mock，之後只需要替換這個區塊。
    return {
      minutes: MOCK_TRAVEL_MINUTES_BY_MODE[request.transportMode],
      distanceMeters: null,
      source: MOCK_NOTICE,
      isMock: true,
    };
  } catch (error) {
    console.error("[mapsAdapter] estimateRoute 失敗，改用示範資料", error);
    return {
      minutes: MOCK_TRAVEL_MINUTES_BY_MODE[request.transportMode],
      distanceMeters: null,
      source: MOCK_NOTICE,
      isMock: true,
    };
  }
}

/** 產生可開啟 Google Maps 導航的連結 */
export function buildNavigationUrl(destination: { address: string; latitude: number | null; longitude: number | null }): string {
  if (destination.latitude !== null && destination.longitude !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.address)}`;
}

/** 產生可分享的 Google Maps 地點連結 */
export function buildPlaceViewUrl(place: { address: string; latitude: number | null; longitude: number | null }): string {
  if (place.latitude !== null && place.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
}

export function isMapsApiConfigured(): boolean {
  return hasApiKey();
}
