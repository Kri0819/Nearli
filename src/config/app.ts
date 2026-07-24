/**
 * 全域 App 設定。
 *
 * 正式品牌名稱為 Nearli，統一在這裡管理，
 * 頁面與元件一律從這裡引用，不會寫死文字。
 */
export const APP_CONFIG = {
  displayName: "Nearli",
  shortName: "Nearli",
  /** 版本號 */
  version: "0.1.10",
  /** 版本代稱 */
  versionCodename: "任務跑道",
  /**
   * localStorage 資料結構版本，用於未來遷移。
   * v0.1.1：Trip 新增 actualPrepStartTime 欄位
   * v0.1.2：清除未來行程被誤寫入的即時進度資料
   * v0.1.3：PreparationTask 新增 actualStartedAt / actualCompletedAt 欄位，
   *         並將這兩個欄位一併納入「未來行程不可有進度資料」的清理範圍
   * v0.1.4：純視覺更新，資料結構無變動
   * v0.1.5：純視覺更新，資料結構無變動
   * v0.1.6：純文案與呈現方式更新，資料結構無變動
   * v0.1.7：Design Language 重新定義，純 UX/UI/Layout 更新，資料結構無變動
   * v0.1.8：產品體驗重新定義（陪伴出門），純 UX/Layout/Interaction 更新，資料結構無變動
   * v0.1.9：新增吉祥物角色（純視覺），資料結構無變動
   * v0.1.10：首頁新增遊戲風格任務跑道（純視覺），資料結構無變動
   */
  storageSchemaVersion: 4,
  /** 預設語言 */
  locale: "zh-Hant-TW",
  /** 完整版產品描述 */
  tagline: "告訴 Nearli 幾點要到，它會按照你的實際習慣，安排現在該做什麼。",
  /** 精簡版產品描述，空間有限的地方使用 */
  shortTagline: "從準備到抵達，一步一步帶你準時出門。",
} as const;

export type AppConfig = typeof APP_CONFIG;
