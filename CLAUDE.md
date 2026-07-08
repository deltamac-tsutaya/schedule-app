# CLAUDE.md

跨專案通用的工程紀律、權限模式與交付慣例已整合進全域 `~/.claude/CLAUDE.md`（第 9 節），本檔不再重複列出，該檔規則同樣適用於本專案。

---

# 得利蔦屋 營運管理系統 — 開發指引

## 專案概覽

純 HTML/CSS/JS 的 PWA（Progressive Web App）集合，無建置工具、無框架、無測試套件。
全部檔案直接由 Firebase Hosting 提供，Service Worker 負責 PWA 快取。

主要入口：
- `index.html` — 前台（4模組：排班/展區/員工/設定），Firebase Auth 登入後解鎖展區與員工模組
- `admin.html` — 後台（Excel 班表上傳、員工管理、展區申請審核）

Firebase 後端：Firestore（資料）+ Firebase Auth（員工登入）。

## 沒有建置流程

直接開啟 `index.html` 或 `admin.html` 於瀏覽器即可使用，或透過 Firebase Hosting URL 存取。
唯一需要 Node.js 的工具：`create-admin.js`（一次性建立管理員帳號，需 Firebase Admin SDK 服務帳戶金鑰）。

```bash
node create-admin.js   # 一次性：在 Firestore 建立管理員帳號
```

目前 `package.json` 僅含 Playwright 依賴，尚無自動化測試。

## 設計規格來源

`DESIGN.md` 是設計系統的唯一權威來源，包含色彩 token、字體層級、間距、元件規格與互動規則。
新增 UI 元件前，請先對照 `DESIGN.md` 確認色彩與圓角值。

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

模組切換以 `display:none / display:flex` 控制，不用 transform。外層 `#appColumn`（flex-column，max-width 430px）包住所有 `.module-section`。

### 內層：排班 Carousel（僅在排班 tab 內）

| id | 背景 | 說明 |
|---|---|---|
| `viewMonth` | `#000`（深黑） | 月曆格狀總覽，選擇日期 |
| `viewWeek` | `--primary`（象牙白） | 週條狀視圖，7 天橫列 |
| `viewDay` | `--primary`（象牙白） | 單日排班詳情，Firestore 真實資料 |

Carousel 以 `view-track` 的 `transform: translateX` 動畫切換，支援左右滑動。

### Firebase Auth 登入流程

- 未登入：只顯示排班 tab（月/週/日 Carousel 仍可瀏覽，但無 Firestore 資料）
- 登入後：解鎖展區、員工 tab；模組 lazy init 在首次切換 tab 時觸發
- 登入 UI：`#loginBackdrop` + `#loginSheet`（position fixed bottom sheet，z-index 600/601）
- Auth 狀態：`_currentUser`（Firebase User）、`_userProfile`（Firestore employees 文件）
- `isAdmin()`：`_userProfile?.role === 'admin'`

## 模組系統（Module Registry）

`index.html` 維護一個 `MODULES[]` 陣列作為插槽：

```javascript
const MODULES = [
  { id: 'moduleSchedule', navId: 'navSchedule', module: null, initialized: true  },
  { id: 'modulePopup',    navId: 'navPopup',    module: null, initialized: false },
  { id: 'moduleEmployees',navId: 'navEmployees',module: null, initialized: false },
];
```

**延遲初始化（lazy init）**：`initialized: false` 的模組只在首次切換到該 tab 時呼叫 `module.init(ctx)`。

**模組 API 合約**（每個外部 `.js` IIFE 必須實作）：

| 方法 | 呼叫時機 |
|---|---|
| `init(ctx)` | 首次進入 tab，`ctx = { db, getCurrentUser, isAdmin, getDate, setDate, toast, container }` |
| `onShow()` | tab 變為可見 |
| `onHide()` | tab 離開可見 |
| `onDateChange(dateStr)` | 全域日期（`_viewDate`）變更時通知 |

新增模組只需：在 `MODULES[]` 加登錄、建立 `module-xxx.js` IIFE、在 HTML 加 `<script src>`。

### index.html 的前台分類邏輯

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
    approvedBy:   string (empId)  ← 核准/駁回後寫入
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

每次修改 `index.html`、`admin.html` 或任何引用的資源（`module-*.js`、`design-tokens.css` 等）後，必須遞增 `sw.js` 中的 `CACHE_NAME`。
目前版本：`management-v11`。下次修改後改為 `management-v12`，依此類推。

SHELL_URLS 目前包含：`index.html`、`admin.html`、`design-tokens.css`、`module-popup.js`、`module-employees.js`、`firebase-config.js`、`manifest.json`。

## Firestore 安全規則

完整規則定義在 `firebase-config.js` 頂部的 JSDoc 註解中。核心原則：
- `schedules` 集合：登入員工（`isAuthenticated()`）可讀，`role == 'admin'` 才能寫入。
- `employees` 集合：登入員工可讀，管理員或本人（`isSelf(empId)`）可寫入。
- `popup_applications` 集合：登入員工可讀/新增；`role == 'admin'` 才能核准/駁回（update status）。
- Firebase Auth `displayName` 欄位用於儲存 empId（員工工號），Firestore 規則以此識別身份。

## Excel 班表解析與防錯

- 必要欄位：部門、工號、姓名、班表日期、班次。缺欄位須立即中止並回報錯誤行。
- 非標準班次（無 `B-`/`C-` 前綴或格式不符）→ `isValidTime: false`，不寫入 `startTime`/`endTime`。
- 未登錄的部門名稱 → 中止上傳，UI 顯示明確錯誤，不得自動忽略或隨意指派。

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

# 品牌書寫規則

- **TSUTAYA BOOKSTORE** 與 **WIRED TOKYO** 必須全大寫。
- 台灣正式品牌名稱用 TSUTAYA BOOKSTORE，不用「蔦屋書店」。
- 對外表述：「得利影視於台灣經營 TSUTAYA BOOKSTORE 與 WIRED TOKYO」。
- 避免使用「得利蔦屋」作為對外正式稱呼。

## 門市資訊

| 門市 | 地址 | BOOKSTORE 電話 | CAFE 電話 | 營業時間 |
|---|---|---|---|---|
| 信義店 | 台北市信義區忠孝東路五段 8 號 統一時代百貨 5F | 02-2725-1881 | 02-2725-2338 | 週日~四 11:00–21:30；週五六 11:00–22:00 |
| 台中市政店 | 台中市西屯區市政北二路 18-1 號 2F–3F | 04-2253-3636 | 04-2253-2828 | 週一~日 10:00–21:00 |
