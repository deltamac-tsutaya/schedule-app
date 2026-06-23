# 得利蔦屋 營運管理系統

得利影視股份有限公司（Deltamac Co., Ltd.）內部使用的門市營運管理 PWA，涵蓋行事曆排班瀏覽、班表後台管理、展區排程等工具。

後端：Firebase Firestore（資料）+ Firebase Auth（員工登入）。
前端：純 HTML / CSS / JavaScript，無框架，無建置工具，Firebase Hosting 部署。

---

## 專案結構

```
├── index.html                  前台行事曆管理系統（主 PWA）
├── admin.html                  後台班表管理（管理員專用）
├── firebase-config.js          Firebase 設定 + Firestore 安全規則
├── sw.js                       Service Worker（PWA 快取，目前 management-v10）
├── manifest.json               PWA manifest
├── firebase.json               Firebase Hosting 設定
├── create-admin.js             一次性管理員帳號建立腳本（Node.js）
├── DESIGN.md                   設計系統規格（色彩、字體、元件）
│
├── tool-schedule/              子工具：班表前台（Firestore 串接版）
│   └── index.html / sw.js / firebase-config.js / manifest.json
│
├── tool-popup-planning/        子工具：大型主題平台展區排程
│   └── index.html / sw.js / firebase-config.js / manifest.json
│
└── assets/                     品牌圖示、Logo、菜單圖片
```

---

## 應用程式說明

### 1. `index.html` — 前台行事曆管理系統

門市人員的主要行動應用程式，以 PWA 形式安裝於手機桌面。

**三層橫向 Carousel 視圖（左右滑動切換）：**

| 視圖 | 說明 |
|---|---|
| 月（Month） | 黑底月曆格狀總覽，點選任一日期跳往週視圖 |
| 週（Week） | 象牙白週條狀視圖，7 天直排，可滑動切換上/下週 |
| Day Modal | 點擊週條任一天開啟 bottom sheet，顯示天氣卡 + 班表行程 |

**底部導覽列：** 月 / 週 / 本日（快速跳回今天）

**Day Modal 功能：**
- 天氣資訊卡（溫度、天氣狀況、降雨、UV、濕度、風速）
- 當日班表行程列表
- 可從週視圖任意日期展開，動畫從點擊處展開

**其他：**
- FAB 浮動按鈕 → 設定面板
- 使用者頭像徽章（右下角）
- 設定 overlay：顯示系統版本、時區、PWA 快取版本

---

### 2. `admin.html` — 後台班表管理

管理員專用後台，負責將 Excel 班表上傳至 Firestore，並管理員工職稱資料。

**登入：** Firebase Auth 電子郵件 / 密碼驗證

**主要功能區塊：**

| 功能 | 說明 |
|---|---|
| 📤 上傳班表 | 拖曳或點選 `.xlsx/.xls`，解析後寫入 Firestore `schedules` 集合 |
| 📅 已上傳月份 | 列出 Firestore 中現有的月份清單 |
| 👤 員工資料管理 | 批量上傳員工基本資料 Excel（12 欄位） |
| 職位清冊上傳 | 批量更新員工職稱（工號對應職稱） |
| 職稱手動編輯 | 逐一編輯每位員工的職稱並儲存至 Firestore |

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

### 3. `tool-schedule/` — 排班前台工具

連接 Firestore 的排班瀏覽器，為主前台（`index.html`）的前一版本，目前作為獨立工具保留。

- 前後日期箭頭導覽 + 快捷 chip（昨天/今天/明天）
- 月份 badge 切換
- 門市篩選（信義店 / 臺中市政店）
- 部門類型篩選（書店 / 外場 / 內場 / 行政）
- 人力統計儀表板（在班人數、總工時）
- 員工狀態標籤：上班中 / 未上班 / 已下班 / 休假

---

### 4. `tool-popup-planning/` — 主題平台展區排程

大型主題平台展區排程管理工具，用於規劃 TSUTAYA BOOKSTORE 主題活動的人力配置。

- 連接 Firestore
- 角色切換（門市 / 部門視角）
- 展區排程視覺化

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
```

**Firestore 安全規則：**
- `schedules`：登入員工可讀，管理員（`role == 'admin'`）可寫
- `employees`：登入員工可讀，管理員或本人可寫
- 完整規則定義於 `firebase-config.js` 頂部

---

## PWA / Service Worker

每支 PWA 各有獨立的 `sw.js` 與版本號，**修改任一 HTML/JS 後必須遞增對應的 `CACHE_NAME`**：

| 檔案 | 目前版本 |
|---|---|
| `sw.js`（主前台） | `management-v10` |
| `tool-schedule/sw.js` | 各自維護 |
| `tool-popup-planning/sw.js` | 各自維護 |

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
- HTML/JS/CSS 快取 1 小時
- `assets/` 快取 7 天
- SPA rewrite：所有路徑導向 `index.html`

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
