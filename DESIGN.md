---
name: 得利蔦屋 營運管理系統

colors:
  background: "#F8F7F2"
  on-background: "#1f2937"

  surface: "#ffffff"
  surface-dim: "#f1f5f9"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f8fafc"
  surface-container: "#f1f5f9"
  surface-container-high: "#e5e7eb"
  surface-container-highest: "#cbd5e1"
  on-surface: "#1f2937"
  on-surface-variant: "#64748b"

  outline: "#e5e7eb"
  outline-variant: "#f1f5f9"

  inverse-surface: "#0f172a"
  inverse-on-surface: "#ffffff"
  surface-tint: "#2563eb"

  primary: "#2563eb"
  on-primary: "#ffffff"
  primary-container: "#dbeafe"
  on-primary-container: "#1e40af"
  inverse-primary: "#93c5fd"

  secondary: "#64748b"
  on-secondary: "#ffffff"
  secondary-container: "#f1f5f9"
  on-secondary-container: "#374151"

  tertiary: "#10b981"
  on-tertiary: "#ffffff"
  tertiary-container: "#dcfce7"
  on-tertiary-container: "#166534"

  error: "#f87171"
  on-error: "#ffffff"
  error-container: "#fee2e2"
  on-error-container: "#991b1b"

  warning: "#d97706"
  on-warning: "#ffffff"
  warning-container: "#fef3c7"
  on-warning-container: "#92400e"

  status-pending: "#fbbf24"

  dept-book-container: "#dcfce7"
  on-dept-book-container: "#15803d"
  dept-floor-container: "#dbeafe"
  on-dept-floor-container: "#1d4ed8"
  dept-kitchen-container: "#ffedd5"
  on-dept-kitchen-container: "#c2410c"
  dept-admin-container: "#ede9fe"
  on-dept-admin-container: "#6d28d9"

  store-xinyi-accent: "#2563eb"
  store-taichung-accent: "#10b981"

typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 28px
    fontWeight: "800"
    lineHeight: 32px
    letterSpacing: -0.04em

  headline-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 20px
    fontWeight: "800"
    lineHeight: 24px
    letterSpacing: -0.03em

  headline-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 17px
    fontWeight: "700"
    lineHeight: 22px
    letterSpacing: -0.02em

  title-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 15px
    fontWeight: "600"
    lineHeight: 20px

  title-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px

  body-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px

  body-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px

  label-lg:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px

  label-sm:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 14px

  store-name:
    fontFamily: "'Noto Serif TC', serif"
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 20px
    letterSpacing: 0.05em

  metric:
    fontFamily: "'Inter', sans-serif"
    fontSize: 32px
    fontWeight: "300"
    lineHeight: 36px

  mono:
    fontFamily: "'Menlo', 'Monaco', monospace"
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 16px

rounded:
  sm: 6px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px

spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  2xl: 32px
  page-padding: 16px
  card-padding: 20px
  section-gap: 12px
  nav-height: 56px

components:
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding}"
    shadow: "0 1px 4px rgba(0, 0, 0, 0.05)"

  staffing-card:
    backgroundColor: "rgba(255, 255, 255, 0.58)"
    backdropFilter: blur(10px)
    borderColor: "{colors.outline}"
    borderWidth: 1px
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "0 4px 12px rgba(0, 0, 0, 0.06)"

  nav-tab:
    backgroundColor: transparent
    textColor: "{colors.on-surface-variant}"
    activeTextColor: "{colors.inverse-surface}"
    height: "{spacing.nav-height}"
    typography: "{typography.label-sm}"

  store-pill:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.outline}"
    borderWidth: 1.5px
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.label-lg}"
    activeBackgroundColor: "{colors.inverse-surface}"
    activeTextColor: "{colors.inverse-on-surface}"

  month-badge:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.outline}"
    borderWidth: 1.5px
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.xl}"
    padding: "4px 11px"
    typography: "{typography.label-lg}"
    activeBackgroundColor: "{colors.inverse-surface}"
    activeTextColor: "{colors.inverse-on-surface}"

  status-badge-working:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    rounded: "{rounded.sm}"
    typography: "{typography.label-sm}"

  status-badge-rest:
    backgroundColor: "{colors.warning-container}"
    textColor: "{colors.on-warning-container}"
    rounded: "{rounded.sm}"
    typography: "{typography.label-sm}"

  status-badge-holiday:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    rounded: "{rounded.sm}"
    typography: "{typography.label-sm}"

  dept-badge-book:
    backgroundColor: "{colors.dept-book-container}"
    textColor: "{colors.on-dept-book-container}"
    rounded: "{rounded.sm}"
    typography: "{typography.label-sm}"

  dept-badge-floor:
    backgroundColor: "{colors.dept-floor-container}"
    textColor: "{colors.on-dept-floor-container}"
    rounded: "{rounded.sm}"
    typography: "{typography.label-sm}"

  dept-badge-kitchen:
    backgroundColor: "{colors.dept-kitchen-container}"
    textColor: "{colors.on-dept-kitchen-container}"
    rounded: "{rounded.sm}"
    typography: "{typography.label-sm}"

  dept-badge-admin:
    backgroundColor: "{colors.dept-admin-container}"
    textColor: "{colors.on-dept-admin-container}"
    rounded: "{rounded.sm}"
    typography: "{typography.label-sm}"

  calendar-day:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    typography: "{typography.label-lg}"

  calendar-day-today:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    indicatorColor: "{colors.primary}"

  calendar-day-selected:
    backgroundColor: "{colors.inverse-surface}"
    textColor: "{colors.inverse-on-surface}"
    shadow: "0 2px 6px rgba(15, 23, 42, 0.3)"

  cloud-dot-connected:
    color: "#22c55e"
    size: 7px
    rounded: "{rounded.full}"

  cloud-dot-pending:
    color: "{colors.status-pending}"
    size: 7px
    rounded: "{rounded.full}"

  cloud-dot-error:
    color: "{colors.error}"
    size: 7px
    rounded: "{rounded.full}"

  toggle-switch:
    trackColor: "{colors.surface-container-high}"
    trackCheckedColor: "{colors.primary}"
    thumbColor: "{colors.surface}"
    thumbShadow: "0 1px 3px rgba(0, 0, 0, 0.2)"
    rounded: "{rounded.full}"

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.DEFAULT}"
    shadow: "0 2px 4px rgba(37, 99, 235, 0.3)"
    typography: "{typography.label-lg}"
    activeScale: 0.98

  settings-action-btn:
    backgroundColor: "{colors.surface-container-low}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    typography: "{typography.title-lg}"
---

## Brand & Style

得利蔦屋 營運管理系統 is the internal operations dashboard for a Japanese bookstore × café hybrid retail chain operating in Taiwan. The design intent is quiet confidence — a tool that staff reach for without friction, reads clearly under store lighting, and never competes with the physical retail environment.

The aesthetic draws from the brand's publishing roots: a warm cream background (`#F8F7F2`) that evokes paper, crisp white card surfaces, and ink-black selected states. Every color decision leans slightly literary rather than purely digital. The result feels like a premium printed schedule elevated into a living screen.

Tone words: **calm, precise, premium, warm**.

---

## Colors

The palette operates in two layers.

**Page layer** — The background is `#F8F7F2`, a warm off-white that breaks the harshness of pure white without adding visible color. It reads as neutral to most users but subconsciously softens the experience. All cards float above this in pure white (`#ffffff`), creating a clean foreground/background separation with almost no shadow required.

**Interactive layer** — `#2563eb` is the sole interactive color. Every actionable element — buttons, active navigation tabs, selected calendar days, focus rings — uses this blue. This rigidity is intentional: users immediately understand that blue means "you can do something here."

**Status colors** — Three semantic states use distinct hue families so they are distinguishable even under peripheral vision:
- Working / connected: green (`#22c55e`, `#dcfce7` / `#166534`)
- Rest days / pending: amber (`#fef3c7` / `#92400e`, `#fbbf24`)
- Holidays / errors: red (`#fee2e2` / `#991b1b`, `#f87171`)

**Department type coding** — The staffing view assigns a color identity to each department role. These four colors are the most information-dense elements in the UI and are used consistently across badges, row backgrounds, and spectrum indicators:

| Role | Background | Text |
|---|---|---|
| 書店 (Bookstore) | `#dcfce7` | `#15803d` |
| 外場 (Floor) | `#dbeafe` | `#1d4ed8` |
| 內場 (Kitchen) | `#ffedd5` | `#c2410c` |
| 行政 (Admin) | `#ede9fe` | `#6d28d9` |

**Store accents** — The two store locations each carry an accent color in section headers: `#2563eb` (blue) for 信義店, `#10b981` (green) for 臺中市政店.

---

## Typography

The type system balances three competing needs: Japanese/Chinese readability, operational data density, and the premium feel of the retail brand.

**Primary stack** — The system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI'…`) is used for all UI chrome and data text. It renders natively on every device, loads instantly, and handles Traditional Chinese characters reliably at any size. No web font is loaded for functional text.

**Serif accent** — `Noto Serif TC` appears only for store names inside staffing cards. This single typographic exception signals that the store name is a brand identifier, not a data label. The contrast between the serif store name and the surrounding tabular sans-serif data creates visual hierarchy without adding color.

**Inter** — Used exclusively for large numeric metrics (staffing totals, time figures) where proportional figure alignment matters. At `font-weight: 300` and `32px`, it creates airy, legible large numbers.

**Monospace** — `Menlo / Monaco` is reserved for displayed time strings (`09:00`, `18:00`). Fixed-width rendering keeps columns aligned in the schedule grid.

**Weight hierarchy** — The scale runs from 300 (metric numerals) through 400 (body), 500 (sub-labels), 600 (titles, badges), 700 (section headers), to 800 (headline dates, splash brand). Eight steps of weight let weight carry hierarchy without requiring font-size increases.

**Letter spacing** — Negative tracking (`-0.02em` to `-0.04em`) on large headlines tightens display text for a premium feel. Small uppercase-style labels use slight positive tracking (`0.03em–0.05em`) to aid legibility at small sizes.

---

## Layout & Spacing

The grid base unit is **8px**. All spacing values are multiples of this unit, producing consistent visual rhythm.

**Mobile layout** (default) — A single-column stack: status bar → scrollable content → fixed bottom navigation. Content has `16px` side padding. The bottom navigation bar sits at a fixed `56px` height with safe-area inset support for notched devices. Cards stack vertically with `12px` gaps.

**Tablet layout** (≥ 640px) — The staffing cards switch from vertical stack to horizontal row, giving each store equal width (`flex: 1`).

**Desktop layout** (≥ 1024px) — The dashboard page splits into a `380px` fixed sidebar (calendar) and a `1fr` main content area, constrained to `1280px` max-width and centered. The dashboard body switches to a 2-column grid for operational panels. Bottom navigation gains a `24px 24px 0 0` radius and centers at `max-width: 600px`.

**Card breathing room** — Internal card padding is `20px`. This generous padding ensures content never feels crowded and touch targets remain comfortable. Section titles inside cards carry `12px` bottom margin to separate headings from content.

---

## Elevation & Depth

The design is intentionally near-flat. Depth is used sparingly, only to clarify the stacking order of UI layers.

**Level 0 — page**: `#F8F7F2` background, no shadow  
**Level 1 — cards**: `box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05)` — almost invisible, just enough to separate the card from the page  
**Level 2 — staffing cards**: `filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.06))` plus `backdrop-filter: blur(10px)` on a `rgba(255, 255, 255, 0.58)` background — the one deliberate glassmorphism element, used to give the live staffing data a sense of floating above the dashboard  
**Level 3 — overlays / toasts**: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12)`, positioned fixed  
**Level 4 — splash screen**: `z-index: 500`, full-screen dark overlay (`#0a0f1a`) during app initialization

---

## Shapes

Border radius follows the semantic scale:

- **`6px` (sm)** — Status badges, small data chips. Sharp enough to read as labels, not buttons.
- **`8px` (DEFAULT)** — Standard interactive elements: buttons, inputs, calendar day cells, arrow buttons. Friendly but not bubbly.
- **`12px` (md)** — Filter bar container, results card, toggle track. Medium containers that hold multiple items.
- **`16px` (lg)** — Main content cards, date navigator, calendar wrapper, metric cards. The primary card radius — soft and modern.
- **`20px` (xl)** — Month badge pills, store pill filters. The pill shape signals these are toggleable filters, not links.
- **`full` (9999px)** — Cloud status dot, calendar today indicator, toggle thumb. Pure circles for state indicators.

---

## Interactions

All state transitions are fast and physical. The UI should feel like a responsive physical object, not an animated presentation.

**Transition duration** — `0.15s` for interactive elements (hover, press, toggle). `0.2s` for color transitions on inputs and labels. `0.4s` for the cloud connection status dot, which changes state less frequently and benefits from a slower, more deliberate signal.

**Press feedback** — Every tappable element scales down on `:active`: buttons to `0.98`, pills and chips to `0.95–0.96`, arrow buttons to `0.93`. The variation in scale magnitude matches the visual weight of the element — smaller elements scale more dramatically.

**Loading states** — Two animations: a `0.8s linear infinite` CSS spin for inline day-loading spinners, and a `1.4s ease-in-out infinite` pulse animation for the splash screen dots. The splash dots stagger their phase offset to create a sequential wave effect.

**Toast notifications** — Slide in from the trailing edge (`translateX(110%) → 0`) over `0.25s`. Fade out over `0.3s`. Maximum `z-index: 200` ensures they appear above all content but below the splash screen.

---

## Components

### Status Bar
The top bar carries the app name on the left and a live cloud connection indicator on the right. The indicator is a 7px colored dot plus a text label (`連線中`, `已連線`, `失敗`). The dot transitions between amber (pending), green (connected), and red (error) over `0.4s`. The bar uses `max(14px, env(safe-area-inset-top))` top padding to handle device notches.

### Bottom Navigation
Four tabs: Dashboard, Marketing, Announcements, Settings. Each tab is an icon + label stack. The active tab uses `inverse-surface` (`#0f172a`) for both icon and label; inactive tabs use `on-surface-variant` (`#64748b`). No indicator bar — the color change alone communicates active state.

### Calendar
A 7-column month grid. Weekday headers in `label-sm`. Day cells are circular (`border-radius: 50%`, `aspect-ratio: 1`). Today's date shows a small primary-colored dot below the number. The selected date inverts to `inverse-surface` background with a subtle shadow.

### Staffing Card
The highest-information component. Each card represents one store and shows per-department breakdown (书店/外場/內場) with three columns: 現場 (on-site, today-only), 今日 (total working), 時數 (total hours). The card uses glassmorphism to visually elevate live data above static dashboard panels. Store name is rendered in `Noto Serif TC`.

### Employee Row
Each row shows: dept-type color badge, employee name (`title-md`), employee ID (`label-sm`, muted), title badge if set, and a status badge (上班中 / 未上班 / 已下班 / 休假). On the "today" view, rows are grouped by real-time status and separated by sub-labels (`未上班 N 人`, `已下班 N 人`).

### Department-Type Badge
A small inline chip (`label-sm`, `6px` radius) using the four department color pairs. It is the primary visual anchor for scanning which type of staff a row belongs to. The four colors (green/blue/orange/purple) are perceptually distinct and hold contrast against both the warm-beige page and white card backgrounds.

### Toggle Switch
Used for the "全體" (show all staff including on-leave) filter. Custom CSS toggle: `40px × 22px` track, `18px` circular thumb. Track background transitions from `outline` to `primary` on check. Thumb slides `20px` with a `0.2s` ease transition.
