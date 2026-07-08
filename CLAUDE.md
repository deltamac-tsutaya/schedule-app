# CLAUDE.md

跨專案通用的工程紀律、權限模式與交付慣例已整合進全域 `~/.claude/CLAUDE.md`（第 9 節），本檔不再重複列出，該檔規則同樣適用於本專案。

---

# 得利蔦屋 營運管理系統 — 開發指引

## 專案概覽

單頁 PWA（Progressive Web App），讓門市人員查看當日班表與人力狀況。
後台（admin.html）負責從 Excel 上傳班表資料到 Firebase Firestore，前台（index.html）即時讀取顯示。

## 檔案結構

```
index.html        前台主要頁面（單一 HTML 檔，含所有 CSS/JS）
admin.html        後台管理頁面（上傳班表、管理員工職稱）
firebase-config.js  Firebase 設定（含 Firestore 安全規則說明）
sw.js             Service Worker（PWA 離線快取，目前版本 schedule-v8）
manifest.json     PWA manifest
```

## Firebase Firestore 資料結構

```
schedules/
  {yearMonth}/               e.g. "2026-04"
    yearMonth: "2026-04"
    dateRange: { start: "2026-04-01", end: "2026-04-30" }
    departments: [...]
    employees: [...]
    dates: [...]

    days/
      {date}/                e.g. "2026-04-26"
        date: "2026-04-26"
        yearMonth: "2026-04"
        records: [           每筆為一名員工當天的班表
          {
            empId:       "123456"
            empName:     "王小明"
            dept:        "TSUTAYA BOOKSTORE 信義店"   ← 已轉換的正式名稱
            date:        "2026-04-26"
            yearMonth:   "2026-04"
            shiftRaw:    "B-0900~1800"               ← Excel 原始值
            startTime:   "09:00"
            endTime:     "18:00"
            sortValue:   900                          ← 用於排序（HHMM 數值）
            status:      "working" | "holiday" | "rest"
            isValidTime: true | false
          }
        ]

employees/
  {empId}/
    title: "店長"            ← 員工職稱（選填，前台顯示用）
```

## 部門名稱對照（admin.html 上傳時轉換）

Excel 欄位 → Firestore 儲存的正式名稱：

| Excel 部門欄 | 儲存值 |
|---|---|
| 1部BOOK | TSUTAYA BOOKSTORE 信義店 |
| 1部CAFE外場 | WIRED TOKYO 信義店 外場 |
| 1部CAFE內場 | WIRED TOKYO 信義店 內場 |
| 2部BOOK | TSUTAYA BOOKSTORE 台中市政店 |
| 2部CAFE外場 | WIRED TOKYO 台中市政店 外場 |
| 2部CAFE內場 | WIRED TOKYO 台中市政店 內場 |

## 前台分類邏輯（index.html）

**getStore(dept)** — 從部門名稱判斷門市：
- 含「信義」→ `'信義店'`
- 含「台中」或「臺中」→ `'臺中市政店'`（注意：Firestore 存的是簡體「台」，顯示用繁體「臺」，getStore 兩者都能識別）

**getDeptType(dept, empId)** — 判斷部門類型：
- empId === `'107066'` → 行政（ADMIN_EMP_ID，硬碼單一行政人員）
- 含「BOOKSTORE」→ 書店
- 含「外場」→ 外場
- 含「內場」→ 內場

## 班表格式

Excel 中的班次值（shiftRaw）：
- `B-0900~1800` 或 `C-0900~1800`（B/C 為班別代碼，實際只解析時間）
- `例假日` → status: `holiday`
- `休息日` → status: `rest`
- 其他任何值 → status: `working`，isValidTime: false

## 頁籤結構

| 頁籤 id | 頁面 id | 說明 |
|---|---|---|
| navDashboard | pageDashboard | 行事曆 + 戰情儀表板（主頁） |
| navMarketing | pageMarketing | 行銷商品活動（開發中） |
| navAnnouncements | pageAnnouncements | 公告通知（開發中） |
| navSettings | pageSettings | 設定 |

## 已知 Mockup / 尚未串接真實資料

`pageDashboard` 裡有以下區塊是靜態假資料，標示 badge 說明來源：
- **營運指標**（badge: Mockup）：業績達成率、來客數 — 數值寫死
- **活動與任務**（badge: Notion）：預計串接 Notion API
- **場地與課程**（badge: Notion）：預計串接 Notion API

人力排班區塊（stateMain 內）是唯一真實接 Firestore 的資料。

## 代碼管理與 PWA 發佈規範

### Service Worker 版本控制與快取更新
- 每次修改 [index.html](file:///Users/linus/made_by_vibe/Github/tbs-dm-pms/index.html)、[admin.html](file:///Users/linus/made_by_vibe/Github/tbs-dm-pms/admin.html) 或其引用的資源後，必須在 [sw.js](file:///Users/linus/made_by_vibe/Github/tbs-dm-pms/sw.js) 中將 `CACHE_NAME` 的版本號遞增（例如從 `schedule-v8` 升級至 `schedule-v9`）。
- 部署新版本後，前台需實作快取更新提示，提醒門市人員「已有新版班表系統，請點擊更新」或自動重新載入頁面，避免門市人員使用過期快取。

## Firestore 資料安全與權限設計規範

### 安全規則維護與測試
- 任何 Firestore 規則的異動，必須先於測試環境驗證，再貼上並發佈至 Firebase Console。
- 嚴格遵守最小權限原則：
  - `schedules` 集合：所有登入員工（`isAuthenticated()`）皆可讀取，僅限 `role == 'admin'` 的管理員可寫入。
  - `employees` 集合：所有登入員工可讀取，管理員可寫入。員工本人（`isSelf(empId)`）僅能修改個人資料（如職稱）。
- 請勿在客戶端程式碼中直接使用 `update` 或 `set` 修改他人權限，一切權限變更需透過後台驗證或 Firebase Auth 自訂聲明（Custom Claims）進行。

## Excel 班表解析與防錯規範

### 欄位格式校驗
- 後台解析 Excel 時，必須驗證以下必要欄位：部門（Excel 部門欄）、工號、姓名、班表日期、班次。若缺少必要欄位應立即中止解析並回報錯誤行數。
- 對於非標準格式的班次時間（如未帶 `B-` 或 `C-` 前綴，或格式不符 `HH:mm~HH:mm`），應記錄為 `isValidTime: false`，將 `status` 設為 `working`，但不寫入 `startTime` 與 `endTime`，以防前台轉換出錯。

### 部門轉換失敗防護
- 當 Excel 欄位出現未登錄於對照表中的部門名稱時，系統不得自動忽略或隨意指派，必須：
  1. 暫停上傳流程。
  2. 於後台 UI 顯示明確的錯誤訊息（例如：「偵測到未定義的部門名稱：『3部BOOK』，請先至對照表設定」）。
  3. 待管理員修正或確認後再行上傳。

## UI/UX 操作回饋與 Loading 設計規範

### 非同步載入與骨架屏（Skeleton）
- 前台從 Firestore 讀取月分列表或當日班表時，載入期間必須顯示骨架屏（Skeleton Screen）或微量動畫（如漸變閃爍效果），代替生硬的 Loading 文字。
- 來回切換日期時，需保持舊資料顯示，並在背景讀取新資料，讀取完成後進行淡入漸變切換，提升視覺流暢度。

### 防重複觸發與異常 Toast 提示
- 所有寫入操作（如後台點擊上傳 Excel、前台修改設定）在發出 API 請求後，必須立即將觸發按鈕設為 `disabled` 狀態，避免門市人員因連線延遲重複點擊。
- API 請求失敗時，需透過 Toast 或浮動提示視窗顯示具體異常原因（如：帳號權限不足、網路超時），避免僅顯示含糊的「連線失敗」或無響應。

## 重要陷阱 / 過去踩過的坑

### DOM 元素已移除，JS 需做 null guard
PR #5（2026-04-26）把舊版日期導覽 UI 換成行事曆格狀視圖，以下 DOM 元素已從 HTML 移除，
但部分 JS function 仍有參考。若未來新增功能請確認這些 id 不再被無條件存取：
- `dateSwitcher`、`dateCenterMain`、`dateCenterWeekday`
- `chipYesterday`、`chipToday`、`chipTomorrow`
- `datePicker`、`monthsBar`

相關 JS（`updateDateDisplay`、`onPickerChange`、swipe IIFE）已加 null guard，不會 crash。

### 錯誤訊息「連線失敗」不代表 Firebase 問題
`loadAvailableMonths()` 用一個 try-catch 包住整個初始化流程，包含後續的 DOM 操作。
若 JS 在 DOM 存取時拋出 TypeError，也會被捕獲並顯示「連線失敗」，容易誤導。
排查時先開 DevTools console 確認真正的 error 訊息。

### Service Worker 快取版本
`sw.js` 裡的 `CACHE_NAME = 'schedule-v8'`。
每次改動 HTML/JS 後若使用者看到舊版本，需將版本號碼往上 bump（v9、v10…）。

### 日期字串格式
所有日期統一使用本地時間 `YYYY-MM-DD`（透過 `localDateStr()` 產生）。
**不要** 用 `new Date().toISOString().slice(0,10)`，台灣 UTC+8 會造成日期偏差。

---

# 品牌管理工具製作規範

## 使用目的

本文件作為 TSUTAYA BOOKSTORE 與 WIRED TOKYO 管理工具的製作準則。

Claude 產出管理工具時，需同時掌握以下目標：

- 正確使用得利影視、TSUTAYA BOOKSTORE 與 WIRED TOKYO 的品牌資訊。
- 建立符合門市管理與營運需求的系統架構。
- 使用具備視覺張力的設計方向。
- 維持資訊清楚、操作直覺、手機版可讀。
- 避免空泛形容詞，改用具體內容、具體利益與具體行動。

## 品牌基本定位

得利影視股份有限公司 Deltamac Co., Ltd. 在台灣經營 TSUTAYA BOOKSTORE 與 WIRED TOKYO。

TSUTAYA BOOKSTORE 在台灣由得利影視以加盟形式引進並營運。品牌核心為 BOOK & CAFE 生活提案，結合書籍、文具、日系生活雜貨、餐飲空間與生活風格內容。

WIRED TOKYO 進駐 TSUTAYA BOOKSTORE 店內，為 BOOK & CAFE 體驗中的餐飲核心。品牌源自東京澀谷 WIRED TOKYO 1999，提供和洋折衷料理、咖啡飲品、甜點與可閱讀、可用餐、可停留的空間體驗。

## 品牌書寫規則

- TSUTAYA BOOKSTORE 必須維持全英文大寫。
- WIRED TOKYO 必須維持全英文大寫。
- 得利影視經營的品牌應稱為 TSUTAYA BOOKSTORE，不使用「蔦屋書店」作為正式品牌名稱。
- TSUTAYA BOOKSTORE 與蔦屋書店同屬日本 CCC 集團體系，但在台灣溝通中需明確區分品牌名稱。
- 對外文件若需表述關係，可寫為「得利影視於台灣經營 TSUTAYA BOOKSTORE 與 WIRED TOKYO」。
- 避免使用「得利蔦屋」作為正式對外稱呼，除非是內部簡稱或文件標題需要。

## 營業據點

### 信義店

店名：

- TSUTAYA BOOKSTORE 信義店
- WIRED TOKYO 信義店

地址：

台北市信義區忠孝東路五段 8 號，統一時代百貨 5 樓

電話：

- TSUTAYA BOOKSTORE：02-2725-1881
- WIRED TOKYO：02-2725-2338

營業時間：

- 週日至週四 11:00–21:30
- 週五、週六 11:00–22:00
- 國定假日營業時間依統一時代百貨公告為主

店舖定位：

信義店位於台北信義商圈，主要服務上班族、商務人士、百貨客群與都會生活風格消費者。TSUTAYA BOOKSTORE 信義店強化商業理財、藝術設計、流行時尚與外文雜誌等選書方向。WIRED TOKYO 信義店具備都會感與商務接待功能，適合商務午餐、個人閱讀、咖啡停留、朋友聚餐與小型品牌活動。

### 台中市政店

店名：

- TSUTAYA BOOKSTORE 台中市政店
- WIRED TOKYO 台中市政店

地址：

台中市西屯區市政北二路 18 之 1 號 2F–3F

電話：

- TSUTAYA BOOKSTORE：04-2253-3636
- WIRED TOKYO：04-2253-2828

營業時間：

週一至週日 10:00–21:00

店舖定位：

台中市政店位於台中七期 T&R 廣場，為獨棟生活場域，主要服務家庭客層、在地居民、親子族群與生活風格消費者。空間包含挑高書牆、木質設計與寬敞座席，適合家庭聚餐、朋友聚會、文化活動、課程活動與品牌包場。
