import { APP_CONFIG } from "@/config/app";
import { Trip } from "@/types/trip";
import { AppSettings, createDefaultSettings } from "@/types/settings";
import { StopLearningRecord } from "@/types/learning";
import { createSampleTrip } from "@/lib/sampleData";

/**
 * localStorage 存取層。
 * 所有讀寫都集中在這裡，並包含版本欄位與錯誤處理，
 * 避免未來資料結構調整時，直接讀到壞掉的舊資料造成 App 崩潰。
 */

const KEYS = {
  trips: "itinerary-app:trips",
  settings: "itinerary-app:settings",
  learning: "itinerary-app:learning-records",
  onboarded: "itinerary-app:onboarded",
} as const;

interface VersionedPayload<T> {
  schemaVersion: number;
  data: T;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeRead<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as VersionedPayload<T>;
    if (!parsed || typeof parsed.schemaVersion !== "number") {
      // 資料格式不符合預期，視為壞資料，回傳預設值以避免整個 App 崩潰
      console.warn(`[storage] "${key}" 格式不符合預期，已改用預設值`);
      return fallback;
    }
    if (parsed.schemaVersion !== APP_CONFIG.storageSchemaVersion) {
      // 版本不同時，第一版先直接沿用資料本身（結構尚未有破壞性變更）
      // 未來若有破壞性變更，可在這裡加入遷移邏輯。
      return parsed.data ?? fallback;
    }
    return parsed.data ?? fallback;
  } catch (error) {
    console.error(`[storage] 讀取 "${key}" 失敗，已改用預設值`, error);
    return fallback;
  }
}

function safeWrite<T>(key: string, data: T): boolean {
  if (!isBrowser()) return false;
  try {
    const payload: VersionedPayload<T> = {
      schemaVersion: APP_CONFIG.storageSchemaVersion,
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error(`[storage] 寫入 "${key}" 失敗（可能是儲存空間已滿）`, error);
    return false;
  }
}

// ---- Trips ----

export function loadTrips(): Trip[] {
  const hasOnboarded = isBrowser() ? window.localStorage.getItem(KEYS.onboarded) : "1";
  const fallback = hasOnboarded ? [] : [createSampleTrip()];
  const trips = safeRead<Trip[]>(KEYS.trips, fallback);
  if (!hasOnboarded && isBrowser()) {
    window.localStorage.setItem(KEYS.onboarded, "1");
    safeWrite(KEYS.trips, trips);
  }
  return trips;
}

export function saveTrips(trips: Trip[]): boolean {
  return safeWrite(KEYS.trips, trips);
}

// ---- Settings ----

export function loadSettings(): AppSettings {
  return safeRead<AppSettings>(KEYS.settings, createDefaultSettings());
}

export function saveSettings(settings: AppSettings): boolean {
  return safeWrite(KEYS.settings, settings);
}

// ---- Learning records ----

export function loadLearningRecords(): StopLearningRecord[] {
  return safeRead<StopLearningRecord[]>(KEYS.learning, []);
}

export function saveLearningRecords(records: StopLearningRecord[]): boolean {
  return safeWrite(KEYS.learning, records);
}

/** 清除所有本機資料（設定頁「清除所有本機資料」使用） */
export function clearAllLocalData(): void {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}
