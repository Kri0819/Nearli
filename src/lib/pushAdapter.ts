/**
 * 未來推播服務的 adapter 介面。
 *
 * 目前尚未實作真正的後端推播（需要伺服器 + Web Push 憑證），
 * 這裡先定義介面，讓 App 開啟期間的提醒（useNotifications）
 * 之後可以無痛切換成「即使 App 關閉也能收到」的真正推播。
 */
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushAdapter {
  /** 註冊裝置以接收推播（尚未實作） */
  subscribe(): Promise<PushSubscriptionPayload | null>;
  /** 取消註冊 */
  unsubscribe(): Promise<boolean>;
  /** 是否已經訂閱 */
  isSubscribed(): Promise<boolean>;
}

/** 目前的 no-op 實作，串接後端推播服務前先回傳「尚未支援」 */
export const localPushAdapter: PushAdapter = {
  async subscribe() {
    console.warn("[pushAdapter] 尚未串接後端推播服務，目前僅支援 App 開啟期間的提醒。");
    return null;
  },
  async unsubscribe() {
    return true;
  },
  async isSubscribed() {
    return false;
  },
};
