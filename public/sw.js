/**
 * 基礎 PWA service worker。
 *
 * 目前只負責：
 * 1. 快取 App shell，讓已造訪過的頁面可以離線開啟。
 * 2. 提供未來推播服務串接的掛勾（見下方 push 事件監聽）。
 *
 * 重要限制：
 * 這個 service worker 「不保證」在瀏覽器或分頁關閉後，
 * 仍然能準時觸發提醒通知。真正可靠的背景推播需要串接後端推播服務
 * （例如 Web Push + 伺服器排程），目前尚未實作，請見 README 的限制說明。
 */

const CACHE_NAME = "itinerary-app-shell-v1";
const APP_SHELL = ["/", "/trips", "/new", "/settings", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        // 離線快取屬於漸進增強，失敗不應該阻擋安裝
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

/**
 * 未來推播服務的 adapter 介面掛勾。
 * 真正串接 Web Push 時，伺服器會送出 push 事件，
 * 這裡負責把它顯示成系統通知。目前尚未有後端推播來源。
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = { title: "Nearli", body: "" };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text();
  }
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body }));
});
