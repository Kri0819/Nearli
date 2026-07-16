# Nearli（v0.1.5）

> Nearli 不是一般行事曆，也不只是告訴你幾點出門。
> 把出門前需要估算、安排與判斷的事情外部化，到了正確時間，直接告訴你現在該做什麼。

品牌名稱：**Nearli**（中文概念：快到了）。顯示名稱與文案統一放在 `src/config/app.ts`，各頁面一律從這裡引用，不會寫死文字。

**v0.1.5**：參考使用者提供的其他 App 截圖，做第二輪視覺細節微調——`ghost` 按鈕改為實線外框（更像原生的 outline pill）；設定頁與表單的區塊小標題統一改成淺灰、大寫字距（更貼近原生設定頁的分組標籤感）；首頁主卡加入柔和的單色裝飾圓（不是鮮豔漸層，維持原本「安靜、溫和」的調性）。曾評估加入參考截圖中的襯線標題字型與大面積漸層卡片，但前者需要自架 CJK 字型檔（單一字重就有 83MB、218 個子集檔案，對這個專案來說太重）、後者違反最初「不要使用大量鮮豔漸層」的設計原則，所以都沒有採用。

**v0.1.4**：視覺與觸感更新——修正 `ink` 色階缺少 50–300 淺色的問題（原本 `border-ink-100` 等大量類別因為色票不存在而沒有作用，是介面看起來偏「生硬」的主因之一）；統一改用 `lucide-react` 圖示取代殘留的文字符號（拖曳把手、刪除、摺疊箭頭、加減號）；卡片改為雙層柔和陰影＋細邊框，更有浮起的實體感；Modal 改成原生 bottom sheet 手感（下滑把手、滑入動畫）；讀取狀態改用骨架屏取代純文字「載入中」；按鈕新增按壓回饋與主要按鈕陰影。資料結構與時間計算完全沒有變動。

**v0.1.3**：正式命名為 Nearli；「開始準備」升級為逐步準備流程——每個準備事項有自己的預定開始/完成時間，可以個別開始、完成或跳過，延誤會自動重新排程後續事項（不會刪除或縮短使用者的設定）。新增 [`docs/PROJECT_MAP.md`](./docs/PROJECT_MAP.md) 專案地圖，之後每次改動都會同步更新。

**v0.1.2**：修正首頁把未來行程誤判為「今天」的問題，未來行程不再允許提前開始準備或出發；日期一律用本地 `YYYY-MM-DD` 字串比較。

**v0.1.1**：首頁改為依行程階段動態顯示最重要的時間與動作；BottomNav 改用 `lucide-react` 圖示；全站改為桌面置中、手機滿版的畫布結構。

## 安裝與啟動

需要 Node.js 18 以上版本。

```bash
npm install
npm run dev       # 本機開發，預設 http://localhost:3000
npm run build     # 正式build
npm start         # 啟動正式 build
npm run test      # 執行自動化測試（vitest，涵蓋未來行程日期防呆）
```

部署以 Vercel 為前提，直接匯入這個專案即可，不需要額外設定 Build Command / Output Directory（使用 Next.js 預設值）。

## 環境變數

複製 `.env.example` 為 `.env.local`：

```bash
cp .env.example .env.local
```

| 變數 | 說明 | 未設定時的行為 |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps 平台金鑰，用於地點搜尋與路程時間 | `src/lib/mapsAdapter.ts` 會回傳 mock 路程資料，畫面會標示「目前使用示範路程資料」 |
| `ANTHROPIC_API_KEY` | AI 自然語言解析用的金鑰（僅伺服器端使用） | `/api/parse-itinerary` 會改用本地 mock parser（`src/lib/aiParser.ts`），App 仍可完整操作 |

`ANTHROPIC_API_KEY` 不會加上 `NEXT_PUBLIC_` 前綴，也不會出現在前端 bundle 中，只在 `/api/parse-itinerary` 這個 API route（伺服器端）使用。

## 第一版功能（已完成）

- **時間倒推核心**：`src/lib/timeCalculation.ts`，純函式，不依賴 React／瀏覽器 API，計算每一站的必須離開時間、開始準備時間，並判斷「時間充足／時間偏緊／可能遲到」三種狀態。
- **多停靠點行程**：新增、編輯、刪除、複製、拖曳排序；排序改變後自動重新計算路程與離開時間。
- **三種時間限制**：一定不能遲到（可設定提前抵達分鐘）、有寬限時間（寬限只在延誤時使用，不會排進正常規劃）、可以順延。
- **停車風險**：`src/lib/parkingEstimator.ts`，規則式估算（交通方式、市區／郊區、熱門商圈、平假日、日夜、過往紀錄），並清楚標示估算來源，絕不假裝有即時資料。
- **個人習慣學習**：`src/lib/learningEngine.ts`，透明的加權平均規則（不是黑箱 AI），依交通方式、熟悉度、平假日、日夜分開計算調整分鐘數；行程完成後可簡單回顧。
- **AI 自然語言新增行程**：大型輸入框 →`/api/parse-itinerary` → 「確認行程」頁（AI 解析後不會直接儲存，必須先確認）。不明確地點會標示「需要選擇正確分店」。
- **Google Maps 服務層**：`src/lib/mapsAdapter.ts`，UI 元件不會直接呼叫 Google API，全部透過這個 adapter。
- **分享功能**：只能分享單一停靠點的會合資訊（地點、時間、地圖連結），絕不包含出發地、準備事項或私人備註；使用 URL 編碼建立唯讀分享頁（`/share/[id]`），沒有共同編輯。
- **通知**：Notification API 權限流程、App 開啟期間的提醒、PWA service worker 基礎架構、未來推播服務的 adapter 介面（`src/lib/pushAdapter.ts`）。
- **本機儲存**：`src/lib/storage.ts`，localStorage 版本化 + 錯誤處理，資料格式異常時會安全回退，不會讓 App 崩潰。
- **逐步準備流程（v0.1.3）**：`src/lib/preparationTimeline.ts`，每個準備事項有自己的預定開始／完成時間，可個別開始、完成、跳過；延誤會自動把後續事項往後順延（不刪除、不縮短使用者設定），並提供「目前仍有足夠時間／時間開始偏緊／可能晚到」的重算建議。
- **未來行程日期防呆（v0.1.2）**：所有日期比較一律用本地 `YYYY-MM-DD` 字串比較；未來行程無法提前寫入任何即時進度（`src/lib/tripProgress.ts` 內建防呆，不只靠 UI 隱藏按鈕）。
- **示範資料**：第一次開啟會自動加入一筆可刪除的示範行程「週六約會」，示範完整倒推流程。
- **自動化測試**：`npm run test`（vitest），涵蓋未來行程防呆與逐步準備流程的排程/延誤重算/資料 migration。

## 目前使用 mock 的功能

- **Google Maps 路程時間 / 地點搜尋**：未設定 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 時，`src/lib/mapsAdapter.ts` 回傳固定的示範路程時間，畫面會標示「目前使用示範路程資料」。
- **AI 自然語言解析**：未設定 `ANTHROPIC_API_KEY` 時，使用 `src/lib/aiParser.ts` 的規則式本地 parser，只能辨識簡單的時間與地點用語（例如「星期六下午兩點到 X」「Y 可以晚十分鐘」「Z 要提早十分鐘」），複雜或不常見的說法可能解析不完整，請在「確認行程」頁手動修正。
- **停車估算**：`src/lib/parkingEstimator.ts` 是規則式估算，不是即時停車資料，介面已預留好之後可以替換成 Google Places 或台灣停車資料 API。
- **背景推播通知**：目前只能保證 App 開啟期間的提醒可靠觸發。分頁或瀏覽器關閉後，無法保證準時推播，這一點會在設定頁清楚標示，不會假裝已經有可靠背景推播。

## 已知限制

- 地址欄位為手動輸入文字，尚未真正串接 Google Places Autocomplete（介面契約已經固定在 `PlaceResult`，之後替換 `mapsAdapter.ts` 內部實作即可）。
- 個人習慣學習的「熟悉地點 / 陌生地點」目前需要在停靠點的「停車與進場細節」中設定，尚未自動判斷。
- 分享連結使用 URL query 編碼公開資料，資料量較大時網址會變長；正式上線建議改為伺服器端儲存 + 短網址。

## 下一版建議串接項目

1. 串接 Google Maps Places Autocomplete + Distance Matrix / Routes API，取代 `mapsAdapter.ts` 的 mock 資料。
2. 串接真正的 AI 服務（設定 `ANTHROPIC_API_KEY` 後，`/api/parse-itinerary` 已經預留呼叫邏輯）。
3. 串接台灣停車資料 API 或 Google Places 的停車場資訊，取代 `parkingEstimator.ts` 的規則式估算。
4. 串接 Web Push 後端服務，讓提醒在 App 關閉後仍能可靠送達（介面已預留在 `pushAdapter.ts` 與 `public/sw.js`）。
5. 若要跨裝置同步，可以在保留 localStorage 作為離線快取的前提下，加上 Supabase 或其他後端。

## 實際建立的檔案清單

```
itinerary-app/
├── .env.example
├── README.md
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── docs/
│   └── PROJECT_MAP.md
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
│       ├── icon-192.png / icon-192.svg
│       └── icon-512.png / icon-512.svg
└── src/
    ├── config/
    │   └── app.ts
    ├── types/
    │   ├── ai.ts
    │   ├── learning.ts
    │   ├── maps.ts
    │   ├── preparation.ts
    │   ├── settings.ts
    │   ├── stop.ts
    │   ├── timeline.ts
    │   └── trip.ts
    ├── lib/
    │   ├── __tests__/
    │   │   ├── futureTripGuards.test.ts
    │   │   └── preparationFlow.test.ts
    │   ├── activeTrip.ts
    │   ├── aiParser.ts
    │   ├── aiToTrip.ts
    │   ├── dateUtils.ts
    │   ├── homeGreeting.ts
    │   ├── id.ts
    │   ├── learningEngine.ts
    │   ├── liveStatus.ts
    │   ├── mapsAdapter.ts
    │   ├── parkingEstimator.ts
    │   ├── prepSuggestions.ts
    │   ├── preparationTimeline.ts
    │   ├── pushAdapter.ts
    │   ├── reviewToLearning.ts
    │   ├── sampleData.ts
    │   ├── shareEncoding.ts
    │   ├── storage.ts
    │   ├── timeCalculation.ts
    │   └── tripProgress.ts
    ├── hooks/
    │   ├── useNotifications.ts
    │   ├── useNow.ts
    │   ├── useSettings.ts
    │   └── useTrips.ts
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   ├── Collapsible.tsx
    │   │   └── Modal.tsx
    │   ├── forms/
    │   │   ├── DurationInput.tsx
    │   │   ├── PreparationTaskForm.tsx
    │   │   ├── StopForm.tsx
    │   │   ├── TimeConstraintSelect.tsx
    │   │   ├── TimeInput.tsx
    │   │   └── TransportModeSelect.tsx
    │   ├── home/
    │   │   ├── EmptyState.tsx
    │   │   └── NextStopCard.tsx
    │   ├── itinerary/
    │   │   ├── ConfirmItinerary.tsx
    │   │   └── NaturalLanguageInput.tsx
    │   ├── layout/
    │   │   ├── BottomNav.tsx
    │   │   ├── PageHeader.tsx
    │   │   └── ServiceWorkerRegister.tsx
    │   ├── share/
    │   │   ├── SharePreviewCard.tsx
    │   │   └── ShareStopModal.tsx
    │   └── trip/
    │       ├── StatusBadge.tsx
    │       ├── StopCard.tsx
    │       ├── StopTimeline.tsx
    │       ├── TripCard.tsx
    │       └── TripReview.tsx
    └── app/
        ├── layout.tsx
        ├── globals.css
        ├── page.tsx                  （首頁「現在」）
        ├── trips/
        │   ├── page.tsx              （行程列表）
        │   └── [id]/page.tsx         （行程詳情）
        ├── new/page.tsx              （新增行程）
        ├── settings/page.tsx         （設定）
        ├── share/[id]/page.tsx       （唯讀分享頁）
        └── api/parse-itinerary/route.ts
```
