import { TransportMode } from "./stop";

export interface NotificationSettings {
  /** 該開始準備 */
  prepReminder: boolean;
  /** 距離離開還有 10 分鐘 */
  tenMinuteWarning: boolean;
  /** 現在必須離開 */
  mustLeaveNow: boolean;
  /** 行程可能遲到 */
  possibleDelay: boolean;
  /** 下一站時間受到影響 */
  nextStopAffected: boolean;
}

export interface AppSettings {
  /** 預設交通方式 */
  defaultTransportMode: TransportMode;
  /** 常用出發地 */
  frequentOrigins: Array<{ id: string; label: string; address: string }>;
  /** 常用準備事項名稱清單（供快速新增） */
  frequentPreparationNames: string[];
  /** 預設提前抵達時間（分鐘） */
  defaultEarlyArrivalMinutes: number;
  /** 預設停車時間（分鐘） */
  defaultParkingMinutes: number;
  /** 通知設定 */
  notifications: NotificationSettings;
}

export function createDefaultSettings(): AppSettings {
  return {
    defaultTransportMode: "motorcycle",
    frequentOrigins: [],
    frequentPreparationNames: ["洗澡", "挑衣服", "化妝", "上廁所", "收拾包包", "吃東西", "整理儀容"],
    defaultEarlyArrivalMinutes: 10,
    defaultParkingMinutes: 10,
    notifications: {
      prepReminder: true,
      tenMinuteWarning: true,
      mustLeaveNow: true,
      possibleDelay: true,
      nextStopAffected: true,
    },
  };
}
