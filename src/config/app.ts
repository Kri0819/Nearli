/**
 * 全域 App 設定。
 *
 * 目前程式名稱尚未決定，暫時顯示名稱統一在這裡管理，
 * 之後正式命名時只需要修改這個檔案，不需要逐頁修改。
 */
export const APP_CONFIG = {
  /** 暫時顯示名稱，尚未正式命名 */
  displayName: "未命名行程助手",
  /** 精簡版名稱，用於底部導覽、通知標題等空間有限的地方 */
  shortName: "行程助手",
  /** 版本號 */
  version: "0.1.2",
  /** 版本代稱 */
  versionCodename: "未來行程與首頁日期狀態修正",
  /** localStorage 資料結構版本，用於未來遷移。v0.1.2：清除未來行程被誤寫入的即時進度資料 */
  storageSchemaVersion: 3,
  /** 預設語言 */
  locale: "zh-Hant-TW",
} as const;

export type AppConfig = typeof APP_CONFIG;
