# 得利蔦屋 營運管理系統

得利影視股份有限公司（Deltamac Co., Ltd.）內部使用的門市營運管理 PWA，涵蓋行事曆排班瀏覽、班表後台管理、展區排程等工具。

後端：Firebase Firestore（資料）+ Firebase Auth（員工登入）。
前端：純 HTML / CSS / JavaScript，無框架，無建置工具，Firebase Hosting 部署。

---

## 專案結構

```
├── index.html                  前台（4模組：排班/展區/員工/設定）+ Firebase Auth
├── admin.html                  後台（班表上傳、員工管理、展區申請審核）
├── design-tokens.css           共用 CSS 變數（兩個 HTML 均引入）
├── module-popup.js             展區排程模組 IIFE（window.PopupModule）
├── module-employees.js         員工名冊模組 IIFE（window.EmployeesModule）
├── firebase-config.js          Firebase 設定 + Firestore 安全規則
├── sw.js                       Service Worker（PWA 快取，目前 management-v11）
├── manifest.json               PWA manifest
├── firebase.json               Firebase Hosting 設定（含子工具 redirect 規則）
├── create-admin.js             一次性管理員帳號建立腳本（Node.js）
├── DESIGN.md                   設計系統規格（色彩、字體、元件）
│
├── tool-schedule/              [deprecated] 已整合進 index.html，URL redirect → /
├── tool-popup-planning/        [deprecated] 已整合進 index.html，URL redirect → /
│
└── assets/                     品牌圖示、Logo、菜單圖片
```

---

## 應用程式說明

### 1. `index.html` — 前台 4-模組 PWA

門市人員的主要行動應用程式，以 PWA 形式安裝於手機桌面。Firebase Auth 登入後解鎖完整模組。

**底部導覽（4 tabs）：**

| Tab | 說明 |
|---|---|
| 排班 | 月/週/日三層 Carousel；月=黑底、週/日=象牙白 |
| 展區 | PopupModule：日曆熱力圖、申請表單、自動報價、衝突偵測 |
| 員工 | EmployeesModule：員工名冊搜尋篩選、詳情展開 |
| 設定 | 登入/登出、版本資訊 |

**排班 tab 內層 Carousel：**
- 月曆格狀總覽 → 週條狀視圖 → 單日班表詳情（Firestore 真實資料）
- 左右滑動或點擊切換，`view-track` 以 `transform: translateX` 動畫移動

**Auth 流程：** 未登入只可瀏覽排班月/週/日視圖；登入後展區與員工 tab 自動解鎖並延遲初始化。

---

### 2. `admin.html` — 後台管理

管理員專用後台，負責班表上傳、員工管理及展區申請審核。

**登入：** Firebase Auth 電子郵件 / 密碼驗證

**主要功能區塊：**

| 功能 | 說明 |
|---|---|
| 📤 上傳班表 | 拖曳或點選 `.xlsx/.xls`，解析後寫入 Firestore `schedules` 集合 |
| 📅 已上傳月份 | 列出 Firestore 中現有的月份清單 |
| 👤 員工資料管理 | 批量上傳員工基本資料 Excel（12 欄位） |
| 職位清冊上傳 | 批量更新員工職稱（工號對應職稱） |
| 職稱手動編輯 | 逐一編輯每位員工的職稱並儲存至 Firestore |
| 🏪 展區申請審核 | 列出 pending/approved/rejected 申請；核准含衝突偵測；可導入模擬資料或清空 |

**Excel 班表欄位：** 部門、工號、姓名、日期、班次（格式：`B-0900~1800`）

**部門名稱轉換（Excel → Firestore）：**

| Excel 欄位 | 儲存名稱 |
|---|---|
| 1部BOOK | TSUTAYA BOOKSTORE 信義店 |
| 1部CAFE外場 | WIRED TOKYO 信義店 外場 |
| 1部CAFE內場 | WIRED TOKYO 信義店 內場 |
| 2部BOOK | TSUTAYA BOOKSTORE 台中市政店 |
| 2部CAFE外場 | WIRED TOKYO 台中市政店 外場 |
| 2部CAFE內場 | WIRED TOKYO 台中市政店 內場 |

---

---

## Firebase 架構

**專案 ID：** `schedule-app-19839`

**Firestore 資料結構：**

```
schedules/
  {yearMonth}/                    e.g. "2026-04"
    days/
      {date}/                     e.g. "2026-04-26"
        records: [
          { empId, empName, dept, date, yearMonth,
            shiftRaw, startTime, endTime, sortValue,
            status: "working"|"holiday"|"rest",
            isValidTime: true|false }
        ]

employees/
  {empId}/
    title: "店長"
    role:  "admin"    ← 管理員才有

popup_applications/
  {autoId}/
    store, spaceId, clientName, startDate, endDate,
    status: "pending"|"approved"|"rejected",
    pricingType: "fixed"|"commission",
    totalAmount, deposit, createdAt, approvedBy
```

**Firestore 安全規則：**
- `schedules`：登入員工可讀，管理員（`role == 'admin'`）可寫
- `employees`：登入員工可讀，管理員或本人可寫
- `popup_applications`：登入員工可讀/新增，管理員才能核准/駁回
- 完整規則定義於 `firebase-config.js` 頂部

---

## PWA / Service Worker

修改任何 HTML、JS 或 CSS 後必須遞增 `sw.js` 中的 `CACHE_NAME`：

| 檔案 | 目前版本 |
|---|---|
| `sw.js`（主 PWA） | `management-v11` |

子工具（`tool-schedule/`、`tool-popup-planning/`）已 deprecated，其 SW 不再維護。

---

## 本地開發

無建置工具，直接用瀏覽器開啟 HTML 檔案即可預覽，但 Firebase 功能需網路連線。

```bash
# 一次性：建立管理員帳號（需 Firebase Admin SDK 服務帳戶 JSON）
node create-admin.js

# Firebase Hosting 部署
firebase deploy
```

**Firebase Hosting 設定（`firebase.json`）：**
- `sw.js` 設為 `no-cache`，確保 Service Worker 立即更新
- HTML/JS/CSS 快取 1 小時；`assets/` 快取 7 天
- `/tool-schedule/**` 及 `/tool-popup-planning/**` → 301 redirect 至 `/`
- SPA rewrite：所有其他路徑導向 `index.html`

---

## 已安裝的 Agent Skills

```
.agents/skills/
├── find-skills                     搜尋 skills 生態系（vercel-labs）
├── brainstorming                   新功能發想框架
├── writing-plans                   任務拆解與計畫撰寫
├── executing-plans                 依計畫逐步執行
├── subagent-driven-development     Subagent 平行開發
├── dispatching-parallel-agents     多 agent 調度
├── systematic-debugging            有紀律的 debug 流程
├── test-driven-development         TDD 開發流程
├── using-git-worktrees             Git worktree 管理
├── requesting-code-review          發出 code review
├── receiving-code-review           接收 code review
├── finishing-a-development-branch  分支收尾 checklist
├── verification-before-completion  完成前驗證
├── writing-skills                  撰寫新 skill
└── using-superpowers               Superpowers 框架使用指引
```

來源：`obra/superpowers` + `vercel-labs/skills`

---

## 門市資訊

| | TSUTAYA BOOKSTORE 信義店 | TSUTAYA BOOKSTORE 台中市政店 |
|---|---|---|
| 地址 | 台北市信義區忠孝東路五段 8 號 統一時代百貨 5F | 台中市西屯區市政北二路 18-1 號 2F–3F |
| 電話（書店） | 02-2725-1881 | 04-2253-3636 |
| 電話（餐廳） | 02-2725-2338 | 04-2253-2828 |
| 營業時間 | 週日~四 11:00–21:30／週五六 11:00–22:00 | 每日 10:00–21:00 |
