# CLAUDE.md — 12-rule template

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

## Rule 1 — Think Before Coding
State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

## Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

## Rule 3 — Surgical Changes
Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

## Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

## Rule 5 — Use the model only for judgment calls
Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory
Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

## Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

---

# 得利蔦屋 營運管理系統 — 開發指引

## 專案概覽

純 HTML/CSS/JS 的 PWA（Progressive Web App）集合，無建置工具、無框架、無測試套件。
全部檔案直接由 Firebase Hosting 提供，Service Worker 負責 PWA 快取。

主要入口：
- `index.html` — 前台（4模組：排班/展區/員工/設定），Firebase Auth 登入後解鎖展區與員工模組
- `admin.html` — 後台（Excel 班表上傳、員工管理、展區申請審核）

Firebase 後端：Firestore（資料）+ Firebase Auth（員工登入）。

## 檔案結構

```
index.html              前台主要頁面（4模組，含 Firebase Auth）
admin.html              後台管理頁面（含展區申請審核）
design-tokens.css       共用 CSS 變數（index.html & admin.html 均引入）
module-popup.js         展區排程模組 IIFE（window.PopupModule）
module-employees.js     員工名冊模組 IIFE（window.EmployeesModule）
firebase-config.js      Firebase 設定與 Firestore 安全規則說明
sw.js                   Service Worker（目前版本 management-v11）
manifest.json           PWA manifest
create-admin.js         Node.js 一次性管理員建立腳本
DESIGN.md               設計系統規格（色彩、字體、元件）
gemini.md               本文件的 Gemini 副本（請同步更新）

tool-popup-planning/    [deprecated] firebase.json 已加 redirect → /
tool-schedule/          [deprecated] firebase.json 已加 redirect → /
```

## index.html — 目前的視圖架構

前台採**雙層結構**：外層 4-tab 底部導覽（模組層），內層排班 tab 維持三層 Carousel。

### 外層：模組導覽（4 tabs）

| navId | moduleId | 說明 |
|---|---|---|
| `navSchedule` | `moduleSchedule` | 排班（含月/週/日 Carousel，預設顯示） |
| `navPopup` | `modulePopup` | 展區排程（PopupModule IIFE） |
| `navEmployees` | `moduleEmployees` | 員工名冊（EmployeesModule IIFE） |
| `navSettings` | `moduleSettings` | 設定面板（登入/登出、版本） |

模組切換以 `display:none / display:flex` 控制，不用 transform。

### 內層：排班 Carousel（僅在排班 tab 內）

| id | 背景 | 說明 |
|---|---|---|
| `viewMonth` | `#000`（深黑） | 月曆格狀總覽，選擇日期 |
| `viewWeek` | `--primary`（象牙白） | 週條狀視圖，7 天橫列 |
| `viewDay` | `--primary`（象牙白） | 單日排班詳情，Firestore 真實資料 |

### Firebase Auth 登入流程

- 未登入：只顯示排班 tab（月/週/日 Carousel 仍可瀏覽，但無 Firestore 資料）
- 登入後：解鎖展區、員工 tab；模組 lazy init 在首次切換 tab 時觸發
- `isAdmin()`：`_userProfile?.role === 'admin'`

## 模組系統（Module Registry）

```javascript
const MODULES = [
  { id: 'moduleSchedule', navId: 'navSchedule', module: null, initialized: true  },
  { id: 'modulePopup',    navId: 'navPopup',    module: null, initialized: false },
  { id: 'moduleEmployees',navId: 'navEmployees',module: null, initialized: false },
];
```

模組 API 合約（每個外部 `.js` IIFE 必須實作）：

| 方法 | 呼叫時機 |
|---|---|
| `init(ctx)` | 首次進入 tab，`ctx = { db, getCurrentUser, isAdmin, getDate, setDate, toast, container }` |
| `onShow()` | tab 變為可見 |
| `onHide()` | tab 離開可見 |
| `onDateChange(dateStr)` | 全域日期變更時通知 |

## index.html 的前台分類邏輯

**getStore(dept)** — 從部門名稱判斷門市：
- 含「信義」→ `'信義店'`
- 含「台中」或「臺中」→ `'臺中市政店'`（Firestore 存的是簡體「台」，顯示用繁體「臺」，兩者都識別）

**getDeptType(dept, empId)** — 判斷部門類型：
- empId === `'107066'` → 行政（ADMIN_EMP_ID，硬碼單一行政人員）
- 含「BOOKSTORE」→ 書店
- 含「外場」→ 外場
- 含「內場」→ 內場

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
        records: [
          {
            empId:       "123456"
            empName:     "王小明"
            dept:        "TSUTAYA BOOKSTORE 信義店"
            date:        "2026-04-26"
            yearMonth:   "2026-04"
            shiftRaw:    "B-0900~1800"
            startTime:   "09:00"
            endTime:     "18:00"
            sortValue:   900
            status:      "working" | "holiday" | "rest"
            isValidTime: true | false
          }
        ]

employees/
  {empId}/
    title: "店長"            ← 員工職稱（選填）
    role:  "admin"           ← 管理員才有此欄位

popup_applications/
  {autoId}/
    store:        "台中市政店" | "信義店"
    spaceId:      "tc-1"～"tc-5" | "xyi-1"～"xyi-5"
    clientName:   string
    startDate:    "YYYY-MM-DD"
    endDate:      "YYYY-MM-DD"
    status:       "pending" | "approved" | "rejected"
    pricingType:  "fixed" | "commission"
    totalAmount:  number
    deposit:      number
    createdAt:    Timestamp
    approvedBy:   string (empId)
```

## 部門名稱對照（admin.html 上傳時轉換）

| Excel 部門欄 | Firestore 儲存值 |
|---|---|
| 1部BOOK | TSUTAYA BOOKSTORE 信義店 |
| 1部CAFE外場 | WIRED TOKYO 信義店 外場 |
| 1部CAFE內場 | WIRED TOKYO 信義店 內場 |
| 2部BOOK | TSUTAYA BOOKSTORE 台中市政店 |
| 2部CAFE外場 | WIRED TOKYO 台中市政店 外場 |
| 2部CAFE內場 | WIRED TOKYO 台中市政店 內場 |

## 班表格式

Excel 中的班次值（shiftRaw）：
- `B-0900~1800` 或 `C-0900~1800`（B/C 為班別代碼，只解析時間）
- `例假日` → status: `holiday`
- `休息日` → status: `rest`
- 其他任何值 → status: `working`，isValidTime: false

## Service Worker 版本控制

每次修改 `index.html`、`admin.html` 或任何引用的資源後，必須遞增 `sw.js` 中的 `CACHE_NAME`。
目前版本：`management-v11`。下次修改後改為 `management-v12`，依此類推。

## Firestore 安全規則

完整規則定義在 `firebase-config.js` 頂部的 JSDoc 註解中。核心原則：
- `schedules` 集合：登入員工可讀，`role == 'admin'` 才能寫入。
- `employees` 集合：登入員工可讀，管理員或本人（`isSelf(empId)`）可寫入。
- `popup_applications` 集合：登入員工可讀/新增；`role == 'admin'` 才能核准/駁回。
- Firebase Auth `displayName` 欄位用於儲存 empId（員工工號）。

## Excel 班表解析與防錯

- 必要欄位：部門、工號、姓名、班表日期、班次。缺欄位須立即中止並回報錯誤行。
- 非標準班次 → `isValidTime: false`，不寫入 `startTime`/`endTime`。
- 未登錄的部門名稱 → 中止上傳，UI 顯示明確錯誤。

## UI/UX 規範摘要

- 非同步載入：Firestore 讀取期間顯示骨架屏或動畫，切換日期時保持舊資料再淡入新資料。
- 防重複點擊：寫入操作發出後立即將按鈕設為 `disabled`。
- 錯誤提示：Toast 顯示具體原因，不顯示含糊的「連線失敗」。

## 重要陷阱 / 過去踩過的坑

### 「連線失敗」不代表 Firebase 問題
`loadAvailableMonths()` 的 try-catch 也會捕捉到 DOM 操作的 TypeError。
排查時先開 DevTools console 確認真正的 error 訊息。

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
