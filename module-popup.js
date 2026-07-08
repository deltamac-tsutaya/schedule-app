/**
 * module-popup.js
 * 大型主題平台展區排程模組 (Popup Planning Module)
 *
 * Exposes a global `PopupModule` object.
 * Host page calls: PopupModule.init(ctx), PopupModule.onShow(), PopupModule.onHide(), PopupModule.onDateChange(dateStr)
 *
 * ctx = { db, getCurrentUser, getDate, setDate, toast, container }
 */

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // 1. DATA DEFINITIONS
  // ------------------------------------------------------------------
  const SPACES_DATA = {
    '台中市政店': [
      { id: 1, name: '2F 入口導流展區',   area: '3-5 坪',   items: '5-10 件',  rent_week: 5000,  rent_month: 20000, basic_comm_month: 10000 },
      { id: 2, name: '2F 窗前美學展區',   area: '4-6 坪',   items: '8-15 件',  rent_week: 5000,  rent_month: 20000, basic_comm_month: 10000 },
      { id: 3, name: '2F 核心中島展區',   area: '3-4 坪',   items: '10-20 件', rent_week: 5000,  rent_month: 20000, basic_comm_month: 7500  },
      { id: 4, name: '3F 主題策展展區',   area: '15-20 坪', items: '彈性調整', rent_week: 10000, rent_month: 40000, basic_comm_month: 15000 },
      { id: 5, name: '3F 文藝沙龍展區',   area: '5-8 坪',   items: '10-20 件', rent_week: 3000,  rent_month: 12000, basic_comm_month: 5000  }
    ],
    '信義店': [
      { id: 1, name: '5F 提案主題花車1號', area: '3-5 坪',   items: '5-10 件',  rent_week: 5000,  rent_month: 20000, basic_comm_month: 10000 },
      { id: 2, name: '5F 閱讀沙龍展桌1號', area: '4-6 坪',   items: '8-15 件',  rent_week: 5000,  rent_month: 20000, basic_comm_month: 10000 },
      { id: 3, name: '5F 提案主題花車2號', area: '3-4 坪',   items: '10-20 件', rent_week: 5000,  rent_month: 20000, basic_comm_month: 7500  },
      { id: 4, name: '5F 主題策展展區',   area: '15-20 坪', items: '彈性調整', rent_week: 10000, rent_month: 40000, basic_comm_month: 15000 },
      { id: 5, name: '5F 閱讀沙龍展桌2號', area: '5-8 坪',   items: '10-20 件', rent_week: 3000,  rent_month: 12000, basic_comm_month: 5000  }
    ]
  };

  // Special months: 1-2月新春, 4-5月母親節, 7-8月暑假, 11-12月聖誕跨年
  const SPECIAL_MONTHS = [1, 2, 4, 5, 7, 8, 11, 12];

  // Color palette per store / space index (1-based)
  const SPACE_COLORS = {
    taichung: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
    xinyi:    ['#ec4899', '#14b8a6', '#6366f1', '#f97316', '#d946ef']
  };

  // ------------------------------------------------------------------
  // 2. STATE
  // ------------------------------------------------------------------
  const state = {
    db: null,
    ctx: null,
    currentStore: '台中市政店',
    calendarDate: new Date(),      // month being displayed
    selectedDateStr: '',
    currentSpaceFilter: 'all',
    statusFilter: 'all',
    applications: [],
    isConnected: false,
    unsubscribe: null,
    initialized: false,
    toastConnectedShown: false
  };

  // ------------------------------------------------------------------
  // 3. CSS INJECTION (once)
  // ------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('popup-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'popup-module-styles';
    style.textContent = `
      /* ── module-popup: scoped under .pm- prefix ── */
      .pm-inner {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 0;
      }

      /* Header row */
      .pm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pm-store-pills {
        display: flex;
        gap: 6px;
      }
      .pm-store-pill {
        padding: 6px 16px;
        border-radius: 20px;
        border: 1px solid #e5e7eb;
        background: #fff;
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s;
      }
      .pm-store-pill:active { transform: scale(0.95); }
      .pm-store-pill.active-taichung { background: #10b981; color: #fff; border-color: #10b981; }
      .pm-store-pill.active-xinyi    { background: #2563eb; color: #fff; border-color: #2563eb; }

      /* Space filter bar */
      .pm-space-filters {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none;
      }
      .pm-space-filters::-webkit-scrollbar { display: none; }
      .pm-space-filter-tab {
        flex-shrink: 0;
        padding: 5px 11px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: #fff;
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s;
      }
      .pm-space-filter-tab.active-all       { background: #0f172a !important; border-color: #0f172a !important; color: #fff !important; }
      /* Taichung space active colors */
      .pm-space-filter-tab.active-tc-1 { background: #ef4444 !important; border-color: #ef4444 !important; color: #fff !important; }
      .pm-space-filter-tab.active-tc-2 { background: #3b82f6 !important; border-color: #3b82f6 !important; color: #fff !important; }
      .pm-space-filter-tab.active-tc-3 { background: #10b981 !important; border-color: #10b981 !important; color: #fff !important; }
      .pm-space-filter-tab.active-tc-4 { background: #f59e0b !important; border-color: #f59e0b !important; color: #fff !important; }
      .pm-space-filter-tab.active-tc-5 { background: #8b5cf6 !important; border-color: #8b5cf6 !important; color: #fff !important; }
      /* Xinyi space active colors */
      .pm-space-filter-tab.active-xy-1 { background: #ec4899 !important; border-color: #ec4899 !important; color: #fff !important; }
      .pm-space-filter-tab.active-xy-2 { background: #14b8a6 !important; border-color: #14b8a6 !important; color: #fff !important; }
      .pm-space-filter-tab.active-xy-3 { background: #6366f1 !important; border-color: #6366f1 !important; color: #fff !important; }
      .pm-space-filter-tab.active-xy-4 { background: #f97316 !important; border-color: #f97316 !important; color: #fff !important; }
      .pm-space-filter-tab.active-xy-5 { background: #d946ef !important; border-color: #d946ef !important; color: #fff !important; }

      /* Calendar */
      .pm-cal-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 16px;
      }
      .pm-cal-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .pm-cal-nav-btn {
        width: 32px; height: 32px;
        border-radius: 50%;
        border: 1px solid #e5e7eb;
        background: #fff;
        font-size: 16px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: #1f2937;
        transition: background 0.15s;
      }
      .pm-cal-nav-btn:active { background: #f1f5f9; }
      .pm-cal-month-label {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }
      .pm-cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 3px;
      }
      .pm-cal-hdr {
        text-align: center;
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        padding: 3px 0;
        user-select: none;
      }
      .pm-cal-day {
        aspect-ratio: 1;
        border: 1px solid #e5e7eb;
        border-radius: 7px;
        background: #fff;
        padding: 3px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        cursor: pointer;
        transition: border 0.15s, background 0.15s;
        min-height: 40px;
        overflow: hidden;
      }
      .pm-cal-day.empty { background: transparent; border: none; cursor: default; }
      .pm-cal-day span { font-size: 10px; font-weight: 700; z-index: 2; position: relative; pointer-events: none; }
      .pm-cal-day.is-today { border: 2px solid #2563eb; }
      .pm-cal-day.is-today span { color: #2563eb; }
      .pm-cal-day.is-selected { border: 2px solid #0f172a !important; }

      /* Occupancy bars (heatmap) */
      .pm-day-occupancy {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        border-radius: 5px;
        overflow: hidden;
        z-index: 1;
        padding-top: 14px;
      }
      .pm-occ-bar {
        flex: 1;
        width: 100%;
        opacity: 0.82;
        margin-bottom: 1px;
      }
      /* Taichung bar colors */
      .pm-occ-bar.tc-1 { background: #ef4444; }
      .pm-occ-bar.tc-2 { background: #3b82f6; }
      .pm-occ-bar.tc-3 { background: #10b981; }
      .pm-occ-bar.tc-4 { background: #f59e0b; }
      .pm-occ-bar.tc-5 { background: #8b5cf6; }
      /* Xinyi bar colors */
      .pm-occ-bar.xy-1 { background: #ec4899; }
      .pm-occ-bar.xy-2 { background: #14b8a6; }
      .pm-occ-bar.xy-3 { background: #6366f1; }
      .pm-occ-bar.xy-4 { background: #f97316; }
      .pm-occ-bar.xy-5 { background: #d946ef; }

      /* Single-space occupied backgrounds */
      .pm-cal-day.occ-tc-1 { background: #fee2e2; border-color: #fca5a5; }
      .pm-cal-day.occ-tc-2 { background: #dbeafe; border-color: #bfdbfe; }
      .pm-cal-day.occ-tc-3 { background: #dcfce7; border-color: #bbf7d0; }
      .pm-cal-day.occ-tc-4 { background: #fef3c7; border-color: #fde68a; }
      .pm-cal-day.occ-tc-5 { background: #f3e8ff; border-color: #e9d5ff; }
      .pm-cal-day.occ-xy-1 { background: #fce7f3; border-color: #fbcfe8; }
      .pm-cal-day.occ-xy-2 { background: #e0f2fe; border-color: #bae6fd; }
      .pm-cal-day.occ-xy-3 { background: #e0e7ff; border-color: #c7d2fe; }
      .pm-cal-day.occ-xy-4 { background: #ffedd5; border-color: #fed7aa; }
      .pm-cal-day.occ-xy-5 { background: #fae8ff; border-color: #f5d0fe; }
      .pm-cal-day.free-single { background: #e8f5e9; border-color: #a5d6a7; }

      /* Calendar legend */
      .pm-cal-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 10px;
        color: #64748b;
        font-weight: 600;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid #e5e7eb;
      }
      .pm-legend-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .pm-legend-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        display: inline-block;
      }

      /* Section header */
      .pm-section-hdr {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 8px;
      }

      /* Space status list */
      .pm-status-list { display: flex; flex-direction: column; gap: 8px; }
      .pm-status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        background: #fff;
        transition: background 0.2s;
      }
      /* left-border accent for occupied rows */
      .pm-status-row.occ-tc-1 { border-left: 4px solid #ef4444; }
      .pm-status-row.occ-tc-2 { border-left: 4px solid #3b82f6; }
      .pm-status-row.occ-tc-3 { border-left: 4px solid #10b981; }
      .pm-status-row.occ-tc-4 { border-left: 4px solid #f59e0b; }
      .pm-status-row.occ-tc-5 { border-left: 4px solid #8b5cf6; }
      .pm-status-row.occ-xy-1 { border-left: 4px solid #ec4899; }
      .pm-status-row.occ-xy-2 { border-left: 4px solid #14b8a6; }
      .pm-status-row.occ-xy-3 { border-left: 4px solid #6366f1; }
      .pm-status-row.occ-xy-4 { border-left: 4px solid #f97316; }
      .pm-status-row.occ-xy-5 { border-left: 4px solid #d946ef; }
      .pm-status-row.free-accent { border-left: 4px solid #10b981; }

      .pm-space-info { display: flex; flex-direction: column; gap: 2px; }
      .pm-space-name { font-size: 13px; font-weight: 700; color: #0f172a; }
      .pm-space-meta { font-size: 11px; color: #64748b; }

      .pm-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 20px;
      }
      .pm-badge-available { background: #dcfce7; color: #166534; }
      .pm-badge-occupied  { background: #fee2e2; color: #991b1b; }

      /* Metrics grid */
      .pm-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        background: rgba(255,255,255,0.7);
        border: 1px solid rgba(255,255,255,0.4);
        border-radius: 16px;
        padding: 14px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .pm-metric-item { text-align: center; }
      .pm-metric-label { font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 3px; }
      .pm-metric-value { font-size: 22px; font-weight: 300; color: #111; line-height: 1; }
      .pm-metric-unit  { font-size: 10px; font-weight: 600; color: #64748b; margin-left: 1px; }

      /* Apps list */
      .pm-apps-section { display: flex; flex-direction: column; gap: 8px; }
      .pm-status-tabs {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .pm-status-tabs::-webkit-scrollbar { display: none; }
      .pm-status-tab {
        flex-shrink: 0;
        padding: 5px 11px;
        border-radius: 20px;
        border: 1px solid #e5e7eb;
        background: #fff;
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s;
      }
      .pm-status-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }

      .pm-app-item {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        transition: box-shadow 0.15s;
      }
      .pm-app-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
      .pm-app-item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 6px;
      }
      .pm-app-brand { font-size: 14px; font-weight: 700; color: #0f172a; }
      .pm-app-tag {
        font-size: 10px; font-weight: 700;
        padding: 2px 8px; border-radius: 20px;
      }
      .pm-app-tag.approved { background: #dcfce7; color: #166534; }
      .pm-app-tag.pending  { background: #fef3c7; color: #92400e; }
      .pm-app-tag.rejected { background: #fee2e2; color: #991b1b; }
      .pm-app-details {
        font-size: 11px;
        color: #64748b;
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-bottom: 8px;
      }
      .pm-app-actions {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      /* Buttons */
      .pm-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        padding: 5px 11px;
        height: 30px;
        border: 1px solid #e5e7eb;
        transition: all 0.15s;
        background: #fff;
        color: #1f2937;
        user-select: none;
      }
      .pm-btn:active { transform: scale(0.97); }
      .pm-btn-primary  { background: #2563eb; color: #fff; border-color: #2563eb; }
      .pm-btn-primary:hover { background: #1d4ed8; }
      .pm-btn-secondary { background: #fff; color: #1f2937; border-color: #e5e7eb; }
      .pm-btn-secondary:hover { background: #f8f7f2; }
      .pm-btn-danger   { background: #ef4444; color: #fff; border-color: #ef4444; }
      .pm-btn-danger:hover { background: #b91c1c; }
      .pm-btn-success  { background: #10b981; color: #fff; border-color: #10b981; }
      .pm-btn-success:hover { background: #059669; }
      .pm-btn-xs { height: 24px; padding: 2px 8px; font-size: 10px; }

      /* Card */
      .pm-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 14px;
      }

      /* Empty state */
      .pm-empty {
        padding: 28px 16px;
        text-align: center;
        color: #64748b;
      }
      .pm-empty-icon { font-size: 26px; margin-bottom: 6px; }
      .pm-empty-text { font-size: 12px; font-weight: 600; }

      /* Modal */
      .pm-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 1200;
      }
      .pm-modal-backdrop.open { opacity: 1; pointer-events: auto; }

      .pm-modal {
        position: fixed;
        z-index: 1201;
        background: #fff;
        display: flex;
        flex-direction: column;
      }
      @media (max-width: 899px) {
        .pm-modal {
          bottom: 0; left: 0; right: 0;
          border-radius: 20px 20px 0 0;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 88vh;
        }
        .pm-modal.open { transform: translateY(0); }
      }
      @media (min-width: 900px) {
        .pm-modal {
          top: 50%; left: 50%; width: 500px;
          transform: translate(-50%, -50%) scale(0.9);
          opacity: 0; pointer-events: none;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 90vh;
        }
        .pm-modal.open { transform: translate(-50%, -50%) scale(1); opacity: 1; pointer-events: auto; }
      }
      .pm-modal-header {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
      .pm-modal-title { font-size: 15px; font-weight: 700; color: #0f172a; }
      .pm-modal-body { padding: 16px; overflow-y: auto; flex: 1; }
      .pm-modal-footer {
        padding: 12px 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        flex-shrink: 0;
        padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      }

      /* Form */
      .pm-form-group { margin-bottom: 11px; }
      .pm-form-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 4px;
      }
      .pm-form-control, .pm-form-select {
        width: 100%;
        padding: 7px 11px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        font-size: 13px;
        font-family: inherit;
        color: #1f2937;
        background: #fff;
        height: 36px;
        transition: border 0.15s;
      }
      .pm-form-control:focus, .pm-form-select:focus {
        outline: none;
        border-color: #2563eb;
      }
      .pm-form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      /* Price panel */
      .pm-price-panel {
        background: #f8f7f2;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 12px;
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .pm-price-panel-title {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 4px;
        margin-bottom: 3px;
      }
      .pm-calc-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #1f2937;
      }
      .pm-calc-row.total {
        font-size: 13px;
        font-weight: 700;
        border-top: 1px dashed #e5e7eb;
        padding-top: 5px;
        margin-top: 3px;
      }
      .pm-calc-row.deposit { color: #166534; font-weight: 700; margin-top: 2px; }
      .pm-calc-row.special { color: #d97706; }

      /* Logistics alert */
      .pm-logistics-alert {
        background: #fef3c7;
        border: 1.5px solid #d97706;
        border-radius: 10px;
        padding: 9px 11px;
        margin-bottom: 10px;
        font-size: 11px;
        color: #92400e;
        line-height: 1.55;
      }
      .pm-logistics-alert strong {
        font-weight: 700;
        display: block;
        margin-bottom: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  // ------------------------------------------------------------------
  // 4. HTML INJECTION
  // ------------------------------------------------------------------
  function buildHTML(container) {
    container.innerHTML = `
      <div class="pm-inner" id="pmInner">

        <!-- Header: store pills + new-app button -->
        <div class="pm-header">
          <div class="pm-store-pills">
            <button class="pm-store-pill active-taichung" id="pmPillTaichung"
              onclick="PopupModule._selectStore('台中市政店')">台中市政店</button>
            <button class="pm-store-pill" id="pmPillXinyi"
              onclick="PopupModule._selectStore('信義店')">信義店</button>
          </div>
          <button class="pm-btn pm-btn-primary" onclick="PopupModule._openNewApp()">＋ 新增申請</button>
        </div>

        <!-- Metrics -->
        <div class="pm-metrics" id="pmMetrics">
          <div class="pm-metric-item">
            <div class="pm-metric-label">當月預約案件</div>
            <div class="pm-metric-value"><span id="pmMetricCount">0</span><span class="pm-metric-unit">件</span></div>
          </div>
          <div class="pm-metric-item">
            <div class="pm-metric-label">當月預計租金</div>
            <div class="pm-metric-value"><span id="pmMetricRevenue">0K</span></div>
          </div>
          <div class="pm-metric-item">
            <div class="pm-metric-label">展區出租率</div>
            <div class="pm-metric-value"><span id="pmMetricOccupancy">0%</span></div>
          </div>
        </div>

        <!-- Calendar card -->
        <div class="pm-cal-card">
          <!-- Space filter tabs -->
          <div class="pm-space-filters" id="pmSpaceFilters"></div>

          <!-- Month nav -->
          <div class="pm-cal-nav">
            <button class="pm-cal-nav-btn" onclick="PopupModule._adjustMonth(-1)">‹</button>
            <span class="pm-cal-month-label" id="pmCalLabel"></span>
            <button class="pm-cal-nav-btn" onclick="PopupModule._adjustMonth(1)">›</button>
          </div>

          <!-- Grid -->
          <div class="pm-cal-grid" id="pmCalGrid">
            <div class="pm-cal-hdr">日</div>
            <div class="pm-cal-hdr">一</div>
            <div class="pm-cal-hdr">二</div>
            <div class="pm-cal-hdr">三</div>
            <div class="pm-cal-hdr">四</div>
            <div class="pm-cal-hdr">五</div>
            <div class="pm-cal-hdr">六</div>
          </div>

          <!-- Legend -->
          <div class="pm-cal-legend" id="pmCalLegend"></div>
        </div>

        <!-- Selected day status -->
        <div class="pm-card">
          <div class="pm-section-hdr" id="pmDayTitle">選擇日期查看展區狀態</div>
          <div class="pm-status-list" id="pmDayStatusList"></div>
        </div>

        <!-- 90-day free periods (single space only) -->
        <div class="pm-card" id="pmFreePeriodsCard" style="display:none;">
          <div class="pm-section-hdr">未來 90 天空閒時段</div>
          <div class="pm-status-list" id="pmFreePeriodsList"></div>
        </div>

        <!-- Applications list -->
        <div class="pm-apps-section">
          <div class="pm-section-hdr">所有申請案件</div>
          <div class="pm-status-tabs">
            <button class="pm-status-tab active" id="pmTabAll"
              onclick="PopupModule._setStatusFilter('all')">全部</button>
            <button class="pm-status-tab" id="pmTabPending"
              onclick="PopupModule._setStatusFilter('pending')">待審</button>
            <button class="pm-status-tab" id="pmTabApproved"
              onclick="PopupModule._setStatusFilter('approved')">已核准</button>
            <button class="pm-status-tab" id="pmTabRejected"
              onclick="PopupModule._setStatusFilter('rejected')">已駁回</button>
          </div>
          <div id="pmAppsList"></div>
        </div>

      </div>

      <!-- Modal backdrop -->
      <div class="pm-modal-backdrop" id="pmModalBackdrop"
        onclick="PopupModule._closeModal()"></div>

      <!-- Application form modal -->
      <div class="pm-modal" id="pmModal">
        <div class="pm-modal-header">
          <span class="pm-modal-title" id="pmModalTitle">新增展區租用申請</span>
          <button class="pm-btn pm-btn-secondary"
            style="border:none; background:transparent; font-size:15px; width:28px; height:28px; padding:0;"
            onclick="PopupModule._closeModal()">✕</button>
        </div>
        <div class="pm-modal-body">
          <form id="pmForm" onsubmit="PopupModule._submitApplication(event)">
            <input type="hidden" id="pmFormEditId">

            <div class="pm-form-group">
              <label class="pm-form-label" for="pmFormBrand">品牌商戶名稱</label>
              <input class="pm-form-control" type="text" id="pmFormBrand" required
                placeholder="例如：京都手工餐具庫">
            </div>

            <div class="pm-form-group">
              <label class="pm-form-label" for="pmFormStore">租賃門市</label>
              <select class="pm-form-select" id="pmFormStore"
                onchange="PopupModule._onFormStoreChange()">
                <option value="台中市政店">台中市政店</option>
                <option value="信義店">信義店</option>
              </select>
            </div>

            <div class="pm-form-group">
              <label class="pm-form-label" for="pmFormSpace">租用展區空間</label>
              <select class="pm-form-select" id="pmFormSpace"
                onchange="PopupModule._recalculatePrice()">
              </select>
            </div>

            <div class="pm-form-row">
              <div class="pm-form-group">
                <label class="pm-form-label" for="pmFormStart">起始日期</label>
                <input class="pm-form-control" type="date" id="pmFormStart" required
                  onchange="PopupModule._recalculatePrice()">
              </div>
              <div class="pm-form-group">
                <label class="pm-form-label" for="pmFormEnd">結束日期</label>
                <input class="pm-form-control" type="date" id="pmFormEnd" required
                  onchange="PopupModule._recalculatePrice()">
              </div>
            </div>

            <div class="pm-form-group">
              <label class="pm-form-label" for="pmFormPlan">租賃合約方案</label>
              <select class="pm-form-select" id="pmFormPlan"
                onchange="PopupModule._recalculatePrice()">
                <option value="fixed">固定租金制</option>
                <option value="commission">基礎服務費加%制</option>
              </select>
            </div>

            <div class="pm-logistics-alert">
              <strong>⚠️ 蔦屋場地進撤場與物流規範：</strong>
              • 進場：每日 21:00 後。<br>
              • 撤場：結束當日 21:00 後，次日 10:00 前完成盤點與清空復原。<br>
              • 補貨時效：一般檔期通知後 3 工作天，特殊檔期 1-2 工作天送達。
            </div>

            <div class="pm-price-panel" id="pmPricePanel">
              <div class="pm-price-panel-title">費用估算明細</div>
              <div class="pm-calc-row">
                <span>期間天數：</span><span id="pmCalcDays">0 天</span>
              </div>
              <div class="pm-calc-row">
                <span>場地租金小計：</span><span id="pmCalcBase">NT$ 0</span>
              </div>
              <div class="pm-calc-row special" id="pmCalcSpecialRow" style="display:none;">
                <span id="pmCalcSpecialLabel">特殊檔期加給 (1.2x)：</span>
                <span id="pmCalcSpecialAmt">NT$ 0</span>
              </div>
              <div class="pm-calc-row">
                <span>營業稅金 (5%)：</span><span id="pmCalcTax">NT$ 0</span>
              </div>
              <div class="pm-calc-row total">
                <span>總金額 (含稅)：</span><span id="pmCalcTotal">NT$ 0</span>
              </div>
              <div class="pm-calc-row deposit">
                <span>預收訂金 (50%)：</span><span id="pmCalcDeposit">NT$ 0</span>
              </div>
            </div>
          </form>
        </div>
        <div class="pm-modal-footer">
          <button type="button" class="pm-btn pm-btn-secondary"
            onclick="PopupModule._copyQuotation()">複製報價草稿</button>
          <button type="button" class="pm-btn pm-btn-secondary"
            onclick="PopupModule._closeModal()">取消</button>
          <button type="submit" class="pm-btn pm-btn-primary" form="pmForm">送出申請</button>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // 5. HELPERS
  // ------------------------------------------------------------------
  function localDateStr(d) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function storeKey(store) {
    return store === '台中市政店' ? 'tc' : 'xy';
  }

  function storeKeyLong(store) {
    return store === '台中市政店' ? 'taichung' : 'xinyi';
  }

  function getBookingsForDate(dateStr, store) {
    return state.applications.filter(app =>
      app.store === store &&
      app.status !== 'rejected' &&
      dateStr >= app.startDate &&
      dateStr <= app.endDate
    );
  }

  function isAdmin() {
    const user = state.ctx && state.ctx.getCurrentUser ? state.ctx.getCurrentUser() : null;
    return user && user.role === 'admin';
  }

  // ------------------------------------------------------------------
  // 6. RENDER: SPACE FILTER TABS
  // ------------------------------------------------------------------
  function buildSpaceFilterTabs() {
    const bar = document.getElementById('pmSpaceFilters');
    if (!bar) return;
    bar.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'pm-space-filter-tab' + (state.currentSpaceFilter === 'all' ? ' active-all' : '');
    allBtn.textContent = '全部展區 (熱力圖)';
    allBtn.dataset.val = 'all';
    allBtn.onclick = () => PopupModule._selectSpaceFilter('all');
    bar.appendChild(allBtn);

    const sk = storeKey(state.currentStore);
    SPACES_DATA[state.currentStore].forEach(s => {
      const btn = document.createElement('button');
      const isActive = String(state.currentSpaceFilter) === String(s.id);
      btn.className = 'pm-space-filter-tab' + (isActive ? ` active-${sk}-${s.id}` : '');
      btn.textContent = s.name;
      btn.dataset.val = String(s.id);
      btn.onclick = () => PopupModule._selectSpaceFilter(s.id);
      bar.appendChild(btn);
    });
  }

  // ------------------------------------------------------------------
  // 7. RENDER: CALENDAR
  // ------------------------------------------------------------------
  function renderCalendar() {
    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();

    const label = document.getElementById('pmCalLabel');
    if (label) label.textContent = `${year} 年 ${(month + 1).toString().padStart(2, '0')} 月`;

    const grid = document.getElementById('pmCalGrid');
    if (!grid) return;

    // Keep only the 7 header cells
    const hdrs = Array.from(grid.querySelectorAll('.pm-cal-hdr'));
    grid.innerHTML = '';
    hdrs.forEach(h => grid.appendChild(h));

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayStr = localDateStr(new Date());
    const sk = storeKey(state.currentStore);

    // Empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      const empty = document.createElement('div');
      empty.className = 'pm-cal-day empty';
      grid.appendChild(empty);
    }

    // Day cells
    for (let day = 1; day <= totalDays; day++) {
      const cellDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const cell = document.createElement('div');
      cell.className = 'pm-cal-day';
      if (cellDateStr === todayStr) cell.classList.add('is-today');
      if (cellDateStr === state.selectedDateStr) cell.classList.add('is-selected');

      cell.innerHTML = `<span>${day}</span>`;
      cell.onclick = () => PopupModule._selectDay(cellDateStr);

      const dayBookings = getBookingsForDate(cellDateStr, state.currentStore);

      if (state.currentSpaceFilter === 'all') {
        if (dayBookings.length > 0) {
          const occDiv = document.createElement('div');
          occDiv.className = 'pm-day-occupancy';
          dayBookings.forEach(booking => {
            const bar = document.createElement('div');
            bar.className = `pm-occ-bar ${sk}-${booking.spaceId}`;
            const spaceDef = SPACES_DATA[state.currentStore].find(s => s.id === booking.spaceId);
            bar.title = `${booking.brand}${spaceDef ? ' (' + spaceDef.name + ')' : ''}`;
            occDiv.appendChild(bar);
          });
          cell.appendChild(occDiv);
        }
      } else {
        const spaceIdInt = parseInt(state.currentSpaceFilter);
        const activeBooking = dayBookings.find(b => b.spaceId === spaceIdInt);
        if (activeBooking) {
          cell.classList.add(`occ-${sk}-${spaceIdInt}`);
          const lbl = document.createElement('div');
          lbl.style.cssText = 'position:absolute; bottom:3px; right:3px; font-size:7px; font-weight:700; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:80%; text-align:right; z-index:2;';
          lbl.textContent = activeBooking.brand;
          cell.appendChild(lbl);
        } else {
          cell.classList.add('free-single');
        }
      }

      grid.appendChild(cell);
    }

    renderCalendarLegend();
  }

  function renderCalendarLegend() {
    const legend = document.getElementById('pmCalLegend');
    if (!legend) return;
    legend.innerHTML = '';

    const sk = storeKeyLong(state.currentStore);
    const spaces = SPACES_DATA[state.currentStore];
    const colors = SPACE_COLORS[sk];

    if (state.currentSpaceFilter === 'all') {
      spaces.forEach((s, idx) => {
        const item = document.createElement('div');
        item.className = 'pm-legend-item';
        item.innerHTML = `<span class="pm-legend-dot" style="background:${colors[idx]};"></span>${s.name}`;
        legend.appendChild(item);
      });
    } else {
      const spaceIdx = parseInt(state.currentSpaceFilter) - 1;
      const color = colors[spaceIdx] || '#64748b';
      legend.innerHTML = `
        <div class="pm-legend-item"><span class="pm-legend-dot" style="background:${color};"></span>已預約</div>
        <div class="pm-legend-item" style="margin-left:10px;"><span class="pm-legend-dot" style="background:#a5d6a7;"></span>空閒可用</div>
      `;
    }
  }

  // ------------------------------------------------------------------
  // 8. RENDER: SELECTED DAY STATUS
  // ------------------------------------------------------------------
  function renderSelectedDayStatus() {
    const title = document.getElementById('pmDayTitle');
    const list = document.getElementById('pmDayStatusList');
    if (!list) return;

    if (title) title.textContent = state.selectedDateStr
      ? `${state.selectedDateStr} 展區預約狀態`
      : '選擇日期查看展區狀態';

    list.innerHTML = '';
    if (!state.selectedDateStr) return;

    const spaces = SPACES_DATA[state.currentStore];
    const bookings = getBookingsForDate(state.selectedDateStr, state.currentStore);
    const sk = storeKey(state.currentStore);

    spaces.forEach(space => {
      if (state.currentSpaceFilter !== 'all' && String(space.id) !== String(state.currentSpaceFilter)) return;

      const activeBooking = bookings.find(b => b.spaceId === space.id);
      const row = document.createElement('div');
      row.className = 'pm-status-row' + (activeBooking ? ` occ-${sk}-${space.id}` : '');

      let badgeHTML = '';
      let metaHTML = `坪數: ${space.area} | 建議陳列: ${space.items}`;

      if (activeBooking) {
        const label = activeBooking.status === 'approved' ? '已核准' : '審核中';
        badgeHTML = `<span class="pm-badge pm-badge-occupied">${label}: ${activeBooking.brand}</span>`;
        metaHTML = `品牌: <strong>${activeBooking.brand}</strong> | 方案: ${activeBooking.plan === 'fixed' ? '固定租金制' : '展售抽成制'}`;
      } else {
        badgeHTML = `<span class="pm-badge pm-badge-available">空閒</span>`;
      }

      row.innerHTML = `
        <div class="pm-space-info">
          <div class="pm-space-name">${space.name}</div>
          <div class="pm-space-meta">${metaHTML}</div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          ${badgeHTML}
          ${!activeBooking
            ? `<button class="pm-btn pm-btn-xs" onclick="PopupModule._openNewAppWithDates('${state.selectedDateStr}','${state.selectedDateStr}',${space.id})">預約</button>`
            : ''
          }
        </div>
      `;
      list.appendChild(row);
    });

    if (list.children.length === 0) {
      list.innerHTML = `<div class="pm-empty"><div class="pm-empty-icon">📅</div><div class="pm-empty-text">請選擇日期</div></div>`;
    }
  }

  // ------------------------------------------------------------------
  // 9. RENDER: FREE PERIODS (90 days)
  // ------------------------------------------------------------------
  function calculateFreePeriods(store, spaceId) {
    const freePeriods = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let scanDate = new Date(today);
    let startFreeDate = null;

    for (let i = 0; i < 90; i++) {
      const dateStr = localDateStr(scanDate);
      const bookings = getBookingsForDate(dateStr, store);
      const isOccupied = bookings.some(b => b.spaceId === spaceId && b.status === 'approved');

      if (!isOccupied) {
        if (startFreeDate === null) startFreeDate = new Date(scanDate);
      } else {
        if (startFreeDate !== null) {
          const endFreeDate = new Date(scanDate);
          endFreeDate.setDate(endFreeDate.getDate() - 1);
          freePeriods.push({ start: localDateStr(startFreeDate), end: localDateStr(endFreeDate) });
          startFreeDate = null;
        }
      }
      scanDate.setDate(scanDate.getDate() + 1);
    }

    if (startFreeDate !== null) {
      const endFreeDate = new Date(scanDate);
      endFreeDate.setDate(endFreeDate.getDate() - 1);
      freePeriods.push({ start: localDateStr(startFreeDate), end: localDateStr(endFreeDate) });
    }

    return freePeriods;
  }

  function renderFreePeriodsList() {
    const card = document.getElementById('pmFreePeriodsCard');
    const list = document.getElementById('pmFreePeriodsList');
    if (!list) return;

    if (state.currentSpaceFilter === 'all') {
      if (card) card.style.display = 'none';
      return;
    }

    if (card) card.style.display = '';
    list.innerHTML = '';

    const spaceId = parseInt(state.currentSpaceFilter);
    const freePeriods = calculateFreePeriods(state.currentStore, spaceId);

    if (freePeriods.length === 0) {
      list.innerHTML = `<div class="pm-empty"><div class="pm-empty-icon">📅</div><div class="pm-empty-text">未來 90 天內無任何空閒時段（已被佔滿）</div></div>`;
      return;
    }

    freePeriods.forEach(p => {
      const days = Math.ceil((new Date(p.end) - new Date(p.start)) / (1000 * 3600 * 24)) + 1;
      const row = document.createElement('div');
      row.className = 'pm-status-row free-accent';
      row.innerHTML = `
        <div class="pm-space-info">
          <div class="pm-space-name" style="color:#166534;">🟢 ${p.start} 至 ${p.end}</div>
          <div class="pm-space-meta">連續空閒天數：${days} 天</div>
        </div>
        <button class="pm-btn pm-btn-primary pm-btn-xs"
          onclick="PopupModule._openNewAppWithDates('${p.start}','${p.end}',${spaceId})">快速預約</button>
      `;
      list.appendChild(row);
    });
  }

  // ------------------------------------------------------------------
  // 10. RENDER: METRICS
  // ------------------------------------------------------------------
  function updateMetrics() {
    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const thisMonthApps = state.applications.filter(app => {
      if (app.store !== state.currentStore || app.status !== 'approved') return false;
      const start = new Date(app.startDate);
      const end = new Date(app.endDate);
      return start <= monthEnd && end >= monthStart;
    });

    let totalRevenue = 0;
    let occupiedDaysSum = 0;
    const spacesCount = SPACES_DATA[state.currentStore].length;
    const daysInMonth = monthEnd.getDate();
    const totalSpaceDaysPossible = spacesCount * daysInMonth;

    thisMonthApps.forEach(app => {
      const space = SPACES_DATA[app.store] && SPACES_DATA[app.store].find(s => s.id === app.spaceId);
      if (!space) return;

      const start = new Date(app.startDate);
      const end = new Date(app.endDate);
      const overlapStart = new Date(Math.max(start, monthStart));
      const overlapEnd = new Date(Math.min(end, monthEnd));
      const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 3600 * 24)) + 1;
      occupiedDaysSum += overlapDays;

      let specialDays = 0;
      let scan = new Date(overlapStart);
      for (let d = 0; d < overlapDays; d++) {
        if (SPECIAL_MONTHS.includes(scan.getMonth() + 1)) specialDays++;
        scan.setDate(scan.getDate() + 1);
      }

      let appSubtotal = 0;
      if (app.plan === 'fixed') {
        const rate = space.rent_week / 7;
        appSubtotal = (overlapDays * rate) + (specialDays * rate * 0.2);
      } else {
        const rate = space.basic_comm_month / 30;
        appSubtotal = (overlapDays * rate) + (specialDays * rate * 0.2);
      }
      totalRevenue += appSubtotal;
    });

    const elCount = document.getElementById('pmMetricCount');
    const elRev = document.getElementById('pmMetricRevenue');
    const elOcc = document.getElementById('pmMetricOccupancy');
    if (elCount) elCount.textContent = thisMonthApps.length;
    if (elRev) elRev.textContent = `${(totalRevenue / 1000).toFixed(1)}K`;
    const pct = totalSpaceDaysPossible > 0
      ? Math.round((occupiedDaysSum / totalSpaceDaysPossible) * 100)
      : 0;
    if (elOcc) elOcc.textContent = `${pct}%`;
  }

  // ------------------------------------------------------------------
  // 11. RENDER: APPLICATIONS LIST
  // ------------------------------------------------------------------
  function renderApplicationsList() {
    const container = document.getElementById('pmAppsList');
    if (!container) return;
    container.innerHTML = '';

    let apps = state.applications.filter(app => app.store === state.currentStore);

    if (state.statusFilter !== 'all') {
      apps = apps.filter(app => app.status === state.statusFilter);
    }

    if (apps.length === 0) {
      container.innerHTML = `<div class="pm-empty"><div class="pm-empty-icon">📂</div><div class="pm-empty-text">目前尚無符合條件的申請資料</div></div>`;
      return;
    }

    apps.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const admin = isAdmin();

    apps.forEach(app => {
      const space = SPACES_DATA[app.store] && SPACES_DATA[app.store].find(s => s.id === app.spaceId);
      const spaceName = space ? space.name : `展區 ${app.spaceId}`;

      let tagClass = 'pending', tagLabel = '待審核';
      if (app.status === 'approved') { tagClass = 'approved'; tagLabel = '已核准'; }
      else if (app.status === 'rejected') { tagClass = 'rejected'; tagLabel = '已駁回'; }

      let adminActions = '';
      if (admin && app.status === 'pending') {
        adminActions = `
          <button class="pm-btn pm-btn-success pm-btn-xs"
            onclick="PopupModule._approveApplication('${app.id}', true)">核准</button>
          <button class="pm-btn pm-btn-danger pm-btn-xs"
            onclick="PopupModule._approveApplication('${app.id}', false)">駁回</button>
        `;
      }

      const item = document.createElement('div');
      item.className = 'pm-app-item';
      item.innerHTML = `
        <div class="pm-app-item-header">
          <span class="pm-app-brand">${app.brand}</span>
          <span class="pm-app-tag ${tagClass}">${tagLabel}</span>
        </div>
        <div class="pm-app-details">
          <div>📍 <strong>租賃展區</strong>：${spaceName}</div>
          <div>📅 <strong>租賃期間</strong>：${app.startDate} 至 ${app.endDate}</div>
          <div>💼 <strong>合約方案</strong>：${app.plan === 'fixed' ? '固定租金制' : '基礎服務費加%制'}</div>
        </div>
        <div class="pm-app-actions">
          ${adminActions}
          <button class="pm-btn pm-btn-secondary pm-btn-xs"
            onclick="PopupModule._openEditApp('${app.id}')">編輯</button>
          <button class="pm-btn pm-btn-danger pm-btn-xs"
            onclick="PopupModule._deleteApplication('${app.id}')">刪除</button>
        </div>
      `;
      container.appendChild(item);
    });
  }

  // ------------------------------------------------------------------
  // 12. PRICING ENGINE
  // ------------------------------------------------------------------
  function computePrice(store, spaceId, startStr, endStr, plan) {
    const space = SPACES_DATA[store] && SPACES_DATA[store].find(s => s.id === spaceId);
    if (!space) return null;

    const start = new Date(startStr);
    const end = new Date(endStr);
    const totalDays = Math.ceil((end - start) / (1000 * 3600 * 24)) + 1;
    if (isNaN(totalDays) || totalDays <= 0) return null;

    let specialDays = 0;
    let scan = new Date(start);
    for (let d = 0; d < totalDays; d++) {
      if (SPECIAL_MONTHS.includes(scan.getMonth() + 1)) specialDays++;
      scan.setDate(scan.getDate() + 1);
    }

    let basePrice = 0, specialAddition = 0;
    if (plan === 'fixed') {
      const weeks = Math.floor(totalDays / 7);
      const rem = totalDays % 7;
      basePrice = (weeks * space.rent_week) + (rem * (space.rent_week / 7));
      specialAddition = specialDays * (space.rent_week / 7) * 0.2;
    } else {
      basePrice = totalDays * (space.basic_comm_month / 30);
      specialAddition = specialDays * (space.basic_comm_month / 30) * 0.2;
    }

    const subtotal = basePrice + specialAddition;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const deposit = total * 0.5;

    return { totalDays, basePrice, specialDays, specialAddition, tax, total, deposit };
  }

  function _recalculatePrice() {
    const store = (document.getElementById('pmFormStore') || {}).value;
    const spaceIdVal = (document.getElementById('pmFormSpace') || {}).value;
    const startStr = (document.getElementById('pmFormStart') || {}).value;
    const endStr = (document.getElementById('pmFormEnd') || {}).value;
    const plan = (document.getElementById('pmFormPlan') || {}).value;

    if (!spaceIdVal || !startStr || !endStr) return;

    const result = computePrice(store, parseInt(spaceIdVal), startStr, endStr, plan);

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    if (!result) {
      setEl('pmCalcDays', '0 天');
      setEl('pmCalcBase', 'NT$ 0');
      setEl('pmCalcTax', 'NT$ 0');
      setEl('pmCalcTotal', 'NT$ 0');
      setEl('pmCalcDeposit', 'NT$ 0');
      const sr = document.getElementById('pmCalcSpecialRow');
      if (sr) sr.style.display = 'none';
      return;
    }

    setEl('pmCalcDays', `${result.totalDays} 天`);
    setEl('pmCalcBase', `NT$ ${Math.round(result.basePrice).toLocaleString()}`);
    setEl('pmCalcTax', `NT$ ${Math.round(result.tax).toLocaleString()}`);
    setEl('pmCalcTotal', `NT$ ${Math.round(result.total).toLocaleString()}`);
    setEl('pmCalcDeposit', `NT$ ${Math.round(result.deposit).toLocaleString()}`);

    const specialRow = document.getElementById('pmCalcSpecialRow');
    if (specialRow) {
      if (result.specialDays > 0) {
        specialRow.style.display = 'flex';
        setEl('pmCalcSpecialLabel', `特殊檔期加給 (1.2x, 共 ${result.specialDays} 天)：`);
        setEl('pmCalcSpecialAmt', `NT$ ${Math.round(result.specialAddition).toLocaleString()}`);
      } else {
        specialRow.style.display = 'none';
      }
    }
  }

  // ------------------------------------------------------------------
  // 13. FORM HELPERS
  // ------------------------------------------------------------------
  function _onFormStoreChange() {
    const store = (document.getElementById('pmFormStore') || {}).value;
    const select = document.getElementById('pmFormSpace');
    if (!select || !store) return;
    select.innerHTML = '';
    (SPACES_DATA[store] || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.area})`;
      select.appendChild(opt);
    });
    _recalculatePrice();
  }

  function setupFormDates() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const s = document.getElementById('pmFormStart');
    const e = document.getElementById('pmFormEnd');
    if (s) s.value = localDateStr(today);
    if (e) e.value = localDateStr(nextWeek);
  }

  // ------------------------------------------------------------------
  // 14. MODAL: OPEN / CLOSE
  // ------------------------------------------------------------------
  function openModal() {
    const backdrop = document.getElementById('pmModalBackdrop');
    const modal = document.getElementById('pmModal');
    if (backdrop) backdrop.classList.add('open');
    if (modal) modal.classList.add('open');
  }

  function closeModal() {
    const backdrop = document.getElementById('pmModalBackdrop');
    const modal = document.getElementById('pmModal');
    if (backdrop) backdrop.classList.remove('open');
    if (modal) modal.classList.remove('open');
  }

  function _openNewApp() {
    const editId = document.getElementById('pmFormEditId');
    const brand = document.getElementById('pmFormBrand');
    const storeEl = document.getElementById('pmFormStore');
    const plan = document.getElementById('pmFormPlan');
    const title = document.getElementById('pmModalTitle');

    if (editId) editId.value = '';
    if (brand) brand.value = '';
    if (storeEl) { storeEl.value = state.currentStore; }
    _onFormStoreChange();
    setupFormDates();
    if (plan) plan.value = 'fixed';
    if (title) title.textContent = '新增展區租用申請';

    openModal();
    _recalculatePrice();
  }

  function _openNewAppWithDates(startStr, endStr, spaceId) {
    _openNewApp();
    const s = document.getElementById('pmFormStart');
    const e = document.getElementById('pmFormEnd');
    const sp = document.getElementById('pmFormSpace');
    if (s) s.value = startStr;
    if (e) e.value = endStr;
    if (sp) sp.value = spaceId;
    _recalculatePrice();
  }

  function _openEditApp(appId) {
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;

    const title = document.getElementById('pmModalTitle');
    if (title) title.textContent = '修改展區租用申請';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('pmFormEditId', app.id);
    setVal('pmFormBrand', app.brand);
    setVal('pmFormStore', app.store);
    _onFormStoreChange();
    setVal('pmFormSpace', app.spaceId);
    setVal('pmFormStart', app.startDate);
    setVal('pmFormEnd', app.endDate);
    setVal('pmFormPlan', app.plan);

    openModal();
    _recalculatePrice();
  }

  // ------------------------------------------------------------------
  // 15. FIRESTORE OPERATIONS
  // ------------------------------------------------------------------
  function _submitApplication(event) {
    event.preventDefault();
    const db = state.db;

    const id = (document.getElementById('pmFormEditId') || {}).value || '';
    const brand = ((document.getElementById('pmFormBrand') || {}).value || '').trim();
    const store = (document.getElementById('pmFormStore') || {}).value;
    const spaceId = parseInt((document.getElementById('pmFormSpace') || {}).value);
    const startDate = (document.getElementById('pmFormStart') || {}).value;
    const endDate = (document.getElementById('pmFormEnd') || {}).value;
    const plan = (document.getElementById('pmFormPlan') || {}).value;

    if (!brand) return;

    if (new Date(endDate) < new Date(startDate)) {
      state.ctx.toast('結束日期不能早於起始日期', 'error');
      return;
    }

    // Conflict check (approved only)
    const hasConflict = state.applications.some(app => {
      if (app.store !== store || app.spaceId !== spaceId || app.status !== 'approved') return false;
      if (id && app.id === id) return false;
      const appStart = new Date(app.startDate);
      const appEnd = new Date(app.endDate);
      const formStart = new Date(startDate);
      const formEnd = new Date(endDate);
      return formStart <= appEnd && formEnd >= appStart;
    });

    if (hasConflict) {
      state.ctx.toast('與該展區之現有已核准預約時間衝突！無法送出申請。', 'error');
      return;
    }

    const existingApp = id ? state.applications.find(a => a.id === id) : null;
    const appData = {
      brand,
      store,
      spaceId,
      startDate,
      endDate,
      plan,
      status: existingApp ? existingApp.status : 'pending',
      createdAt: existingApp ? existingApp.createdAt : new Date().toISOString()
    };

    if (db) {
      const colRef = db.collection('popup_applications');
      const promise = id
        ? colRef.doc(id).set(appData)
        : colRef.add(appData);

      promise
        .then(() => {
          state.ctx.toast(id ? '申請已成功修改！' : '申請已成功送出！', 'success');
          closeModal();
        })
        .catch(err => {
          console.error('Firestore write failed:', err);
          state.ctx.toast('雲端同步失敗，請稍後再試', 'error');
        });
    } else {
      state.ctx.toast('資料庫未連線，無法送出申請', 'error');
    }
  }

  function _deleteApplication(appId) {
    if (!confirm('確定要刪除此筆展區申請案件嗎？')) return;
    const db = state.db;
    if (!db) { state.ctx.toast('資料庫未連線', 'error'); return; }

    db.collection('popup_applications').doc(appId).delete()
      .then(() => state.ctx.toast('案件已成功刪除', 'info'))
      .catch(err => {
        console.error('Firebase delete failed:', err);
        state.ctx.toast('雲端刪除失敗', 'error');
      });
  }

  function _approveApplication(appId, approve) {
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;

    if (approve) {
      const hasConflict = state.applications.some(other => {
        if (other.id === appId || other.store !== app.store || other.spaceId !== app.spaceId || other.status !== 'approved') return false;
        const os = new Date(other.startDate), oe = new Date(other.endDate);
        const as_ = new Date(app.startDate), ae = new Date(app.endDate);
        return as_ <= oe && ae >= os;
      });
      if (hasConflict) {
        state.ctx.toast('此案件與現有已核准檔期重疊！無法核准。', 'error');
        return;
      }
    }

    const db = state.db;
    if (!db) { state.ctx.toast('資料庫未連線', 'error'); return; }

    const newStatus = approve ? 'approved' : 'rejected';
    db.collection('popup_applications').doc(appId).update({ status: newStatus })
      .then(() => state.ctx.toast(approve ? '案件已成功核准！' : '案件已駁回！', 'info'))
      .catch(err => {
        console.error('Firebase approve failed:', err);
        state.ctx.toast('審核同步失敗', 'error');
      });
  }

  // ------------------------------------------------------------------
  // 16. COPY QUOTATION
  // ------------------------------------------------------------------
  function _copyQuotation() {
    const brand = (document.getElementById('pmFormBrand') || {}).value || '未指定品牌';
    const store = (document.getElementById('pmFormStore') || {}).value;
    const spaceIdVal = (document.getElementById('pmFormSpace') || {}).value;
    const startStr = (document.getElementById('pmFormStart') || {}).value;
    const endStr = (document.getElementById('pmFormEnd') || {}).value;
    const plan = (document.getElementById('pmFormPlan') || {}).value;

    if (!spaceIdVal || !startStr || !endStr) {
      state.ctx.toast('請填妥預約期間與展區空間以計算報價！', 'error');
      return;
    }

    const result = computePrice(store, parseInt(spaceIdVal), startStr, endStr, plan);
    if (!result) {
      state.ctx.toast('日期區間錯誤！', 'error');
      return;
    }

    const space = SPACES_DATA[store] && SPACES_DATA[store].find(s => s.id === parseInt(spaceIdVal));
    const spaceName = space ? space.name : '未知展區';

    const text = `【得利蔦屋大型主題平台展區 - 場地報價單草稿】
品牌商戶：${brand}
租賃門市：${store}
租賃展區：${spaceName}
租賃期間：${startStr} 至 ${endStr} (共 ${result.totalDays} 天)
租賃方案：${plan === 'fixed' ? '固定租金制' : '基礎服務費加%制'}

場地租金小計：NT$ ${Math.round(result.basePrice).toLocaleString()}
特殊檔期加給：NT$ ${Math.round(result.specialAddition).toLocaleString()} (${result.specialDays} 天落入特殊月份)
營業稅金 (5%)：NT$ ${Math.round(result.tax).toLocaleString()}
總金額 (含稅)：NT$ ${Math.round(result.total).toLocaleString()}
預收訂金 (50%)：NT$ ${Math.round(result.deposit).toLocaleString()}

※ 進撤場物流規範：
- 進場時間：每日 21:00 後。
- 撤場時間：結束當日 21:00 後，次日 10:00 前完成盤點與清空復原。
- 補貨時效：一般檔期通知後 3 工作天，特殊檔期 1-2 工作天內送達。

Best regards,
Linus`;

    navigator.clipboard.writeText(text)
      .then(() => state.ctx.toast('已成功複製報價草稿至剪貼簿！', 'success'))
      .catch(() => state.ctx.toast('複製失敗，請手動選取複製', 'error'));
  }

  // ------------------------------------------------------------------
  // 17. FULL REFRESH
  // ------------------------------------------------------------------
  function refreshAll() {
    buildSpaceFilterTabs();
    renderCalendar();
    renderSelectedDayStatus();
    renderFreePeriodsList();
    renderApplicationsList();
    updateMetrics();
  }

  // ------------------------------------------------------------------
  // 18. PUBLIC API
  // ------------------------------------------------------------------
  window.PopupModule = {

    async init(ctx) {
      if (state.initialized) return;
      state.initialized = true;
      state.ctx = ctx;
      state.db = ctx.db || null;

      // Sync initial date from shared context
      const sharedDate = ctx.getDate ? ctx.getDate() : localDateStr(new Date());
      state.selectedDateStr = sharedDate || localDateStr(new Date());
      state.calendarDate = new Date(state.selectedDateStr + 'T00:00:00');

      // Inject CSS
      injectStyles();

      // Build HTML inside the container
      buildHTML(ctx.container);

      // Populate form store select
      _onFormStoreChange();

      // Update store pill UI
      this._updateStorePills();

      // Subscribe to Firestore
      if (state.db) {
        state.unsubscribe = state.db
          .collection('popup_applications')
          .onSnapshot(
            snapshot => {
              const apps = [];
              snapshot.forEach(doc => apps.push(Object.assign({ id: doc.id }, doc.data())));
              state.applications = apps;
              state.isConnected = true;
              if (!state.toastConnectedShown) {
                state.toastConnectedShown = true;
                ctx.toast('展區資料已連線', 'success');
              }
              refreshAll();
            },
            err => {
              console.error('PopupModule Firestore error:', err);
              state.isConnected = false;
              ctx.toast('展區資料連線失敗', 'error');
            }
          );
      }

      refreshAll();
    },

    onShow() {
      // Re-render in case shared date changed while hidden
      const sharedDate = state.ctx && state.ctx.getDate ? state.ctx.getDate() : null;
      if (sharedDate && sharedDate !== state.selectedDateStr) {
        state.selectedDateStr = sharedDate;
        state.calendarDate = new Date(sharedDate + 'T00:00:00');
      }
      refreshAll();
    },

    onHide() {
      // Optionally pause listener — we keep it active for live data
      // If bandwidth is a concern, call state.unsubscribe() here
    },

    onDateChange(dateStr) {
      if (!dateStr) return;
      state.selectedDateStr = dateStr;
      // If the new date is outside current calendar month, navigate to it
      const d = new Date(dateStr + 'T00:00:00');
      if (
        d.getFullYear() !== state.calendarDate.getFullYear() ||
        d.getMonth() !== state.calendarDate.getMonth()
      ) {
        state.calendarDate = new Date(d.getFullYear(), d.getMonth(), 1);
      }
      renderCalendar();
      renderSelectedDayStatus();
      updateMetrics();
    },

    // ---- Private methods (called from inline onclick) ----

    _selectStore(storeName) {
      state.currentStore = storeName;
      state.currentSpaceFilter = 'all';
      this._updateStorePills();
      // Update form store in modal if open
      const formStore = document.getElementById('pmFormStore');
      if (formStore) formStore.value = storeName;
      _onFormStoreChange();
      refreshAll();
    },

    _updateStorePills() {
      const tc = document.getElementById('pmPillTaichung');
      const xy = document.getElementById('pmPillXinyi');
      if (tc) tc.className = 'pm-store-pill' + (state.currentStore === '台中市政店' ? ' active-taichung' : '');
      if (xy) xy.className = 'pm-store-pill' + (state.currentStore === '信義店' ? ' active-xinyi' : '');
    },

    _selectSpaceFilter(val) {
      state.currentSpaceFilter = val;
      buildSpaceFilterTabs();
      const freeCard = document.getElementById('pmFreePeriodsCard');
      if (state.currentSpaceFilter === 'all') {
        if (freeCard) freeCard.style.display = 'none';
      } else {
        if (freeCard) freeCard.style.display = '';
        renderFreePeriodsList();
      }
      renderCalendar();
      renderSelectedDayStatus();
    },

    _adjustMonth(delta) {
      state.calendarDate = new Date(
        state.calendarDate.getFullYear(),
        state.calendarDate.getMonth() + delta,
        1
      );
      renderCalendar();
      updateMetrics();
    },

    _selectDay(dateStr) {
      state.selectedDateStr = dateStr;
      if (state.ctx && state.ctx.setDate) state.ctx.setDate(dateStr);
      renderCalendar();
      renderSelectedDayStatus();
    },

    _setStatusFilter(filter) {
      state.statusFilter = filter;
      // Update tab active classes
      ['all', 'pending', 'approved', 'rejected'].forEach(f => {
        const el = document.getElementById(`pmTab${f.charAt(0).toUpperCase() + f.slice(1)}`);
        if (el) el.className = 'pm-status-tab' + (f === filter ? ' active' : '');
      });
      renderApplicationsList();
    },

    _openNewApp,
    _openNewAppWithDates,
    _openEditApp,
    _closeModal: closeModal,
    _onFormStoreChange,
    _recalculatePrice,
    _submitApplication,
    _deleteApplication,
    _approveApplication,
    _copyQuotation
  };

})();
