# PROJECT_MAP（Nearli）

這份文件是專案的地圖，因為 Next.js App Router 的功能會分散在多個檔案裡。
**每次版本更新都必須同步更新這份文件**，尤其是新增檔案、搬動邏輯，或新增/移除頁面時。

目前版本：v0.1.6

---

## 1. App Router 頁面路徑與用途

| 路徑 | 檔案 | 用途 |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | 首頁「現在」，動態行程狀態頁（見下方「首頁」章節） |
| `/trips` | `src/app/trips/page.tsx` | 行程列表，依日期分組（今天／明天／本週／之後／已完成） |
| `/trips/[id]` | `src/app/trips/[id]/page.tsx` | 行程詳情：完整時間軸（檢視模式）／編輯行程（編輯模式，支援 `?edit=1` 深連結） |
| `/new` | `src/app/new/page.tsx` | 新增行程：「用一句話建立」（AI）／「手動建立」兩個分頁 |
| `/settings` | `src/app/settings/page.tsx` | 設定：預設交通方式、常用出發地、通知、清除本機資料 |
| `/share/[id]` | `src/app/share/[id]/page.tsx` | 唯讀分享頁，解碼 URL 中的公開會合資訊 |
| `/api/parse-itinerary` | `src/app/api/parse-itinerary/route.ts` | AI 自然語言解析 API（有金鑰用 AI，沒有金鑰用本地 mock parser） |
| 全域外殼 | `src/app/layout.tsx` | App 畫布結構（桌面置中／手機滿版）、PWA meta、BottomNav |
| 全域樣式 | `src/app/globals.css` | 全域背景色、fade-in 動畫、prefers-reduced-motion |

---

## 2. 首頁主要元件

首頁的核心邏輯全部圍繞「這個行程現在該顯示什麼」。

- `src/app/page.tsx` — 決定要顯示哪個行程（`selectActiveTrip`）、要不要顯示回顧（`TripReview`）、標題文案（`computeHomeGreeting`），並把準備事項/出發/抵達的操作函式傳給卡片。
- `src/components/home/NextStopCard.tsx` — 首頁主卡，內部決定目前是哪個階段（見下方「首頁階段」），只顯示當下最重要的一步。
- `src/components/home/EmptyState.tsx` — 沒有行程時的空狀態。
- `src/components/trip/TripReview.tsx` — 行程結束後的簡單回顧（用來產生學習紀錄）。
- `src/components/trip/StatusBadge.tsx` — 時間充足／偏緊／可能遲到的小標籤，全站共用。

### 首頁階段（NextStopCard 內部的 `Stage`）

優先順序：`future` > `departed` > `preparing` > `ready_to_prep` > `before_prep` > `awaiting_departure`

- **future**：行程日期晚於本地今天。只顯示日期、開始準備／必須離開／抵達時間，不允許任何即時操作。
- **before_prep**：第一站，還沒到第一個準備事項該開始的時間。
- **ready_to_prep**：第一站，現在該開始某個準備事項了（該事項尚未開始）。主要按鈕「開始這一步」。
- **preparing**：某個準備事項正在進行中。主要按鈕「完成，下一步」，次要「跳過這一步」。
- **awaiting_departure**：第一站且準備事項全部完成（顯示「準備完成」），或非第一站（不需要準備事項，顯示「必須離開」）。主要按鈕「我已經出發」。
- **departed**：已出發，顯示預計抵達時間與比較，主要按鈕「我已抵達」。

修改首頁時通常要看的檔案：
`src/app/page.tsx`、`src/components/home/NextStopCard.tsx`、`src/lib/activeTrip.ts`、`src/lib/homeGreeting.ts`、`src/lib/preparationTimeline.ts`、`src/lib/tripProgress.ts`。

---

## 3. 行程列表頁

`src/app/trips/page.tsx` + `src/components/trip/TripCard.tsx`。分組邏輯用 `src/lib/dateUtils.ts` 的 `classifyDateGroup`。

## 4. 新增行程頁

`src/app/new/page.tsx`：
- AI 分頁：`src/components/itinerary/NaturalLanguageInput.tsx` → `/api/parse-itinerary` → `src/components/itinerary/ConfirmItinerary.tsx`（確認後才儲存，AI 不可直接寫入）。
- 手動分頁：直接組 `Trip` 草稿，使用 `StopForm`、`PreparationTaskManager`、`StopCard`。

AI 解析相關：`src/lib/aiParser.ts`（本地 mock parser + 呼叫 API 的 client 函式）、`src/lib/aiToTrip.ts`（把解析結果轉成可編輯的 Trip 草稿）。

修改行程建立流程通常要看的檔案：
`src/app/new/page.tsx`、`src/components/itinerary/*`、`src/lib/aiParser.ts`、`src/lib/aiToTrip.ts`、`src/components/forms/StopForm.tsx`、`src/components/forms/PreparationTaskForm.tsx`。

## 5. 行程詳情頁

`src/app/trips/[id]/page.tsx`：檢視模式用 `src/components/trip/StopTimeline.tsx` 顯示完整時間軸（含每個準備事項的預定/實際開始/完成時間與狀態）；編輯模式重用 `StopForm` / `PreparationTaskManager` / `StopCard`。也提供「重設行程進度」（`resetTripProgress`）作為資料誤植時的手動復原管道。

## 6. 設定頁

`src/app/settings/page.tsx` + `src/hooks/useSettings.ts` + `src/types/settings.ts`。

---

## 7. 核心資料結構（types）

- `src/types/trip.ts` — `Trip`：行程本體，含 `preparationTasks`、`stops`、`actualPrepStartTime`（trip 層級的準備開始旗標，主要為相容舊版本；實際判斷以每個 `PreparationTask` 的進度為準）。
- `src/types/stop.ts` — `Stop`：單一停靠點，含時間限制、交通、停車、`actualDepartureTime`／`actualArrivalTime`。
- `src/types/preparation.ts` — `PreparationTask`：準備事項，含 `estimatedMinutes`、`actualStartedAt`／`actualCompletedAt`（v0.1.3 新增），以及 `DEFAULT_PREPARATION_MINUTES` 常見事項預設分鐘數表。
- `src/types/settings.ts` — `AppSettings`：預設交通方式、常用出發地、通知設定等。
- `src/types/learning.ts` — 停靠點層級的學習紀錄（`StopLearningRecord`），用於路程時間的個人化調整。
- `src/types/timeline.ts` — `TripPlan` / `StopPlan` / `RiskStatus`，時間倒推計算的輸出結構。
- `src/types/ai.ts` — AI 解析輸入輸出的 JSON Schema（`ParsedItinerary`）。
- `src/types/maps.ts` — Google Maps adapter 的輸入輸出型別。

---

## 8. 時間倒推邏輯位置

`src/lib/timeCalculation.ts`：純函式，`computeStopPlan` / `computeTripPlan`。每一站的必須離開時間、風險狀態（時間充足／偏緊／可能遲到）、前後站鏈接檢查都在這裡。**不要**把計算邏輯搬進 React 元件。

## 9. 準備流程計算位置

`src/lib/preparationTimeline.ts`（v0.1.3 新增）：純函式。
- `computePreparationPlan`：把 `PreparationTask[]` 排成時間軸，從必須離開時間往前倒推；一旦有實際進度，後面事項會依實際進度往後順延。
- `getActivePreparationTask` / `getNextUpcomingTask` / `isPreparationFullyDone`
- `describeTaskOverrun`：某事項是否比預估多花時間（語氣中性）
- `assessPreparationRisk`：延誤後的最小重算，判斷整體仍充足／偏緊／可能遲到

`src/lib/prepSuggestions.ts`：`getSuggestedPreparationMinutes(taskName, trips)`，依過去同名事項的實際花費時間，用加權平均提出建議分鐘數（不是大型 AI，也不會自動覆蓋使用者設定）。

`src/lib/prepCopy.ts`（v0.1.6 新增）：`getTaskGoPhrase` / `getTaskDonePhrase`，把任務名稱轉成自然的中文短句（例如「洗澡」→「現在去洗澡」／「洗好了」），純呈現用途，不影響任何資料或計算。

## 10. 進度更新函式位置

`src/lib/tripProgress.ts`：
- `getNextStop` / `isTripFullyArrived`
- `markStopDeparted` / `markStopArrived`（停靠點層級）
- `markPrepStarted`（trip 層級旗標，相容舊版本）
- `startPreparationTask` / `completePreparationTask` / `skipPreparationTask`（v0.1.3 新增，準備事項層級）
- `resetTripProgress`（手動重設整趟行程的進度，內容不受影響）

**所有寫入函式都會擋下未來行程**（`trip.date` 晚於本地今天）的任何進度寫入，這是最後一道防呆，不只靠 UI 隱藏按鈕。

`src/lib/activeTrip.ts`：`selectActiveTrip`，首頁要顯示哪個行程（正在進行中優先，其次是今天/未來最近的行程；過去且從未開始的行程不會出現）。

`src/lib/homeGreeting.ts`：`computeHomeGreeting`，首頁標題／副標題文案（依 `trip.date` 與本地今天的關係）。

## 11. localStorage 與 migration 位置

`src/lib/storage.ts`：
- `KEYS`：`itinerary-app:trips` / `itinerary-app:settings` / `itinerary-app:learning-records` / `itinerary-app:onboarded`（**這些 key 名稱不會更動**，即使 App 改名為 Nearli）。
- `safeRead` / `safeWrite`：版本化 + 錯誤處理，資料格式異常時安全回退，不會讓 App 崩潰。
- `normalizeTrip`：讀取時的資料遷移／正規化，見 `src/config/app.ts` 的 `storageSchemaVersion` 變更紀錄。

`src/config/app.ts`：`APP_CONFIG.storageSchemaVersion`，每次資料結構變更就在這裡加註記與說明。

## 12. Google Maps adapter

`src/lib/mapsAdapter.ts`：UI 元件一律透過這裡呼叫地圖相關功能，不直接呼叫 Google API。沒有設定 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 時回傳 mock 資料並標示「目前使用示範路程資料」。**v0.1.3 沒有修改這個檔案。**

## 13. AI parser

- `src/lib/aiParser.ts`：本地 mock parser（規則式關鍵字與時間解析）+ 呼叫 `/api/parse-itinerary` 的 client 函式。
- `src/app/api/parse-itinerary/route.ts`：伺服器端，有 `ANTHROPIC_API_KEY` 才會呼叫外部 AI，否則用本地 mock。**v0.1.3 沒有修改這個檔案。**

## 14. PWA / notification

- `public/manifest.json`、`public/sw.js`、`public/icons/`
- `src/components/layout/ServiceWorkerRegister.tsx`
- `src/hooks/useNotifications.ts`：Notification API 權限流程 + App 開啟期間的提醒（背景推播尚未實作，見 README 限制說明）
- `src/lib/pushAdapter.ts`：未來推播服務的 adapter 介面（目前是 no-op）

---

## 15. 修改時的檔案速查

**修改首頁**：`src/app/page.tsx`、`src/components/home/NextStopCard.tsx`、`src/lib/activeTrip.ts`、`src/lib/homeGreeting.ts`、`src/lib/preparationTimeline.ts`、`src/lib/tripProgress.ts`。

**修改行程建立**：`src/app/new/page.tsx`、`src/components/itinerary/*`、`src/lib/aiParser.ts`、`src/lib/aiToTrip.ts`、`src/components/forms/*`。

**修改時間計算**：`src/lib/timeCalculation.ts`（停靠點時間倒推）、`src/lib/preparationTimeline.ts`（準備事項時間倒推）、`src/lib/parkingEstimator.ts`（停車估算）。

**修改品牌／文案**：`src/config/app.ts`（唯一來源，各頁面從這裡引用，不要寫死文字）、`public/manifest.json`、`package.json`。

**修改資料結構**：對應的 `src/types/*.ts` → `src/lib/storage.ts` 的 `normalizeTrip`（加入 migration）→ `src/config/app.ts` 的 `storageSchemaVersion`（是否需要遞增）→ `src/lib/sampleData.ts`（示範資料同步更新）。

---

## 16. 版本紀錄摘要

- **v0.1.0**：初版，完整時間倒推、多站行程、AI 解析、分享、PWA 基礎。
- **v0.1.1**：首頁改為依階段動態顯示，BottomNav 改用 `lucide-react`，全站畫布結構調整。
- **v0.1.2**：修正未來行程被誤判為今天、首頁行程選取邏輯、localStorage migration 清除未來行程的錯誤進度。
- **v0.1.3**：正式命名為 Nearli；準備事項升級為逐步流程（`preparationTimeline.ts`、`tripProgress.ts` 新增每個事項的開始/完成/跳過）；新增 `docs/PROJECT_MAP.md`（本檔案）。
- **v0.1.4**：純視覺與觸感更新，資料結構與時間計算沒有變動。補齊 `tailwind.config.ts` 缺少的 `ink-50/100/200/300` 色階（修正大量 `border-ink-100` 等類別實際上沒有作用的問題）；全面改用 `lucide-react` 取代殘留文字符號圖示；卡片改為雙層陰影＋細邊框；`Modal` 改為原生 bottom sheet 手感；讀取狀態改用骨架屏（`src/components/common/Skeleton.tsx`）。
- **v0.1.5**：參考其他 App 截圖的第二輪視覺微調。`ghost` 按鈕改為實線外框；區塊小標題統一為淺灰大寫字距；首頁主卡加入柔和單色裝飾圓（刻意不用漸層，維持既有設計原則）。
- **v0.1.6**：重新定義首頁的產品體驗（純文案與呈現方式，資料結構無變動）。首頁大標題改為「現在該做的事」，時間退為輔助資訊；拿掉首頁的抵達/交通/停車/步行資訊（移到行程詳情）；按鈕文案改為依任務調整的自然說法；行程回顧文案更口語化。新增 `src/lib/prepCopy.ts`。
