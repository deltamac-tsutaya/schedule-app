/* module-employees.js — 員工名冊模組 */
/* API: window.EmployeesModule.init(ctx), .onShow(), .onHide(), .onDateChange(dateStr) */
/* ctx: { db, getCurrentUser, isAdmin, getDate, toast, container } */
(function () {
  'use strict';

  var _ctx = null;
  var _db = null;
  var _initialized = false;
  var _allEmployees = [];
  var _filtered = [];
  var _searchQuery = '';
  var _storeFilter = '';
  var _detailEmpId = null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getStoreLabel(emp) {
    var dept = emp.dept || (emp.departments && emp.departments[0]) || '';
    if (dept.indexOf('信義') >= 0) return '信義店';
    if (dept.indexOf('台中') >= 0 || dept.indexOf('臺中') >= 0) return '臺中市政店';
    if (emp.departments && emp.departments.length) {
      var d0 = emp.departments[0];
      if (d0.indexOf('信義') >= 0) return '信義店';
      if (d0.indexOf('台中') >= 0 || d0.indexOf('臺中') >= 0) return '臺中市政店';
    }
    return '';
  }

  function getDeptLabel(emp) {
    var dept = emp.dept || (emp.departments && emp.departments[0]) || '';
    if (dept.indexOf('BOOKSTORE') >= 0 || dept.indexOf('1部BOOK') >= 0 || dept.indexOf('2部BOOK') >= 0) return '書店';
    if (dept.indexOf('外場') >= 0) return '外場';
    if (dept.indexOf('內場') >= 0) return '內場';
    if (emp.empId === '107066') return '行政';
    return '';
  }

  function getDeptColor(emp) {
    var d = getDeptLabel(emp);
    if (d === '書店') return '#15803d';
    if (d === '外場') return '#1d4ed8';
    if (d === '內場') return '#c2410c';
    if (d === '行政') return '#6d28d9';
    return '#64748b';
  }

  function getDeptBg(emp) {
    var d = getDeptLabel(emp);
    if (d === '書店') return '#dcfce7';
    if (d === '外場') return '#dbeafe';
    if (d === '內場') return '#ffedd5';
    if (d === '行政') return '#ede9fe';
    return '#f1f5f9';
  }

  function getStoreAccent(store) {
    return store === '信義店' ? '#2563eb' : '#10b981';
  }

  // ── CSS injection ─────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('emp-style')) return;
    var s = document.createElement('style');
    s.id = 'emp-style';
    s.textContent = [
      '#emp-shell { display:flex; flex-direction:column; height:100%; background:var(--bg,#F8F7F2); }',
      '#emp-header { background:#2563eb; color:#fff; padding:16px 16px 12px; flex-shrink:0; }',
      '#emp-header h2 { margin:0 0 12px; font-size:18px; font-weight:700; }',
      '#emp-search-row { display:flex; gap:8px; }',
      '#emp-search { flex:1; padding:8px 12px; border-radius:20px; border:none; font-size:14px; background:rgba(255,255,255,0.2); color:#fff; outline:none; }',
      '#emp-search::placeholder { color:rgba(255,255,255,0.7); }',
      '#emp-search:focus { background:rgba(255,255,255,0.3); }',
      '#emp-store-filter { padding:8px 12px; border-radius:20px; border:none; font-size:13px; background:rgba(255,255,255,0.2); color:#fff; outline:none; cursor:pointer; }',
      '#emp-store-filter option { color:#1f2937; background:#fff; }',
      '#emp-count-bar { padding:8px 16px; font-size:12px; color:#64748b; background:#fff; border-bottom:1px solid #e5e7eb; flex-shrink:0; }',
      '#emp-list { flex:1; overflow-y:auto; padding:12px 16px 80px; }',
      '.emp-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }',
      '.emp-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:14px; cursor:pointer; transition:box-shadow 0.15s, transform 0.15s; -webkit-tap-highlight-color:transparent; }',
      '.emp-card:active { transform:scale(0.97); box-shadow:0 2px 8px rgba(0,0,0,0.12); }',
      '.emp-card-name { font-size:15px; font-weight:700; color:#1f2937; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.emp-card-id { font-size:12px; color:#94a3b8; margin-bottom:8px; font-family:monospace; }',
      '.emp-card-badge { display:inline-block; font-size:11px; font-weight:600; padding:2px 8px; border-radius:20px; margin-bottom:6px; }',
      '.emp-card-dept { font-size:12px; color:#64748b; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.emp-card-title { font-size:12px; font-weight:600; color:#2563eb; margin-bottom:4px; }',
      '.emp-card-phone { font-size:12px; color:#64748b; }',
      '.emp-empty { text-align:center; padding:48px 16px; color:#94a3b8; grid-column:1/-1; }',
      '.emp-empty svg { width:48px; height:48px; margin-bottom:12px; opacity:0.4; }',
      '.emp-loading { text-align:center; padding:48px 16px; color:#94a3b8; grid-column:1/-1; }',
      /* Detail modal */
      '#emp-detail-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1100; opacity:0; transition:opacity 0.2s; pointer-events:none; }',
      '#emp-detail-backdrop.open { opacity:1; pointer-events:auto; }',
      '#emp-detail-sheet { position:fixed; left:0; right:0; bottom:0; background:#fff; border-radius:20px 20px 0 0; z-index:1101; transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.32,0.72,0,1); max-height:85vh; overflow:hidden; display:flex; flex-direction:column; }',
      '#emp-detail-sheet.open { transform:translateY(0); }',
      '#emp-detail-drag { width:36px; height:4px; background:#cbd5e1; border-radius:2px; margin:12px auto 0; flex-shrink:0; }',
      '#emp-detail-content { overflow-y:auto; padding:20px 20px 40px; flex:1; }',
      '#emp-detail-close { position:absolute; top:16px; right:16px; width:32px; height:32px; border-radius:50%; border:none; background:#f1f5f9; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; color:#64748b; line-height:1; }',
      '.emp-detail-name { font-size:20px; font-weight:700; color:#1f2937; margin-bottom:4px; }',
      '.emp-detail-id { font-size:13px; color:#94a3b8; font-family:monospace; margin-bottom:12px; }',
      '.emp-detail-badges { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px; }',
      '.emp-detail-badge { display:inline-block; font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; }',
      '.emp-detail-section { border-top:1px solid #f1f5f9; padding-top:16px; margin-top:16px; }',
      '.emp-detail-section-title { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:12px; }',
      '.emp-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }',
      '.emp-detail-field { }',
      '.emp-detail-label { font-size:11px; color:#94a3b8; margin-bottom:2px; }',
      '.emp-detail-value { font-size:13px; font-weight:600; color:#1f2937; word-break:break-all; }',
      '.emp-detail-value a { color:#2563eb; text-decoration:none; }',
      '.emp-detail-full { grid-column:1/-1; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Shell HTML ────────────────────────────────────────────────────────────
  function renderShell(container) {
    container.innerHTML = [
      '<div id="emp-shell">',
        '<div id="emp-header">',
          '<h2>員工名冊</h2>',
          '<div id="emp-search-row">',
            '<input id="emp-search" type="search" placeholder="搜尋姓名或工號…" autocomplete="off"',
            ' oninput="EmployeesModule._onSearch(this.value)">',
            '<select id="emp-store-filter" onchange="EmployeesModule._onStore(this.value)">',
              '<option value="">全部門市</option>',
              '<option value="信義">信義店</option>',
              '<option value="台中">臺中市政店</option>',
            '</select>',
          '</div>',
        '</div>',
        '<div id="emp-count-bar">載入中…</div>',
        '<div id="emp-list">',
          '<div class="emp-grid">',
            '<div class="emp-loading">載入員工名冊中…</div>',
          '</div>',
        '</div>',
      '</div>',
      /* Detail bottom sheet */
      '<div id="emp-detail-backdrop" onclick="EmployeesModule._closeDetail()"></div>',
      '<div id="emp-detail-sheet">',
        '<div id="emp-detail-drag"></div>',
        '<button id="emp-detail-close" onclick="EmployeesModule._closeDetail()">✕</button>',
        '<div id="emp-detail-content"></div>',
      '</div>',
    ].join('');

    // Attach touch-to-close on drag handle
    var drag = document.getElementById('emp-detail-drag');
    if (drag) {
      var startY = 0;
      drag.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; }, { passive: true });
      drag.addEventListener('touchend', function(e) {
        if (e.changedTouches[0].clientY - startY > 60) _closeDetail();
      }, { passive: true });
    }
  }

  // ── Data loading ─────────────────────────────────────────────────────────
  async function loadEmployees() {
    try {
      var snap = await _db.collection('employees').orderBy('empName').get();
      _allEmployees = snap.docs.map(function(doc) {
        return Object.assign({ id: doc.id }, doc.data());
      });
      _applyFilter();
    } catch(e) {
      var countBar = document.getElementById('emp-count-bar');
      if (countBar) countBar.textContent = '載入失敗：' + e.message;
      var list = document.getElementById('emp-list');
      if (list) list.innerHTML = '<div class="emp-grid"><div class="emp-empty">無法載入員工名冊<br><small>' + esc(e.message) + '</small></div></div>';
    }
  }

  // ── Filter & render ──────────────────────────────────────────────────────
  function _applyFilter() {
    var q = _searchQuery.toLowerCase();
    var store = _storeFilter;

    _filtered = _allEmployees.filter(function(emp) {
      var matchQ = !q ||
        (emp.empName && emp.empName.toLowerCase().indexOf(q) >= 0) ||
        (emp.empId && emp.empId.toLowerCase().indexOf(q) >= 0);

      var matchStore = !store || (
        (emp.dept && emp.dept.indexOf(store) >= 0) ||
        (emp.departments && emp.departments.some(function(d) { return d.indexOf(store) >= 0; }))
      );

      return matchQ && matchStore;
    });

    _renderList();
  }

  function _renderList() {
    var list = document.getElementById('emp-list');
    var bar  = document.getElementById('emp-count-bar');
    if (!list) return;

    if (bar) {
      bar.textContent = '共 ' + _filtered.length + ' 位員工' +
        (_filtered.length !== _allEmployees.length ? '（已篩選，共 ' + _allEmployees.length + ' 位）' : '');
    }

    if (_filtered.length === 0) {
      list.innerHTML = [
        '<div class="emp-grid">',
          '<div class="emp-empty">',
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">',
              '<path stroke-linecap="round" stroke-linejoin="round"',
              ' d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>',
            '</svg>',
            '<div>沒有找到員工</div>',
          '</div>',
        '</div>',
      ].join('');
      return;
    }

    var html = '<div class="emp-grid">' + _filtered.map(function(emp) {
      var store = getStoreLabel(emp);
      var dept  = getDeptLabel(emp);
      var deptColor = getDeptColor(emp);
      var deptBg    = getDeptBg(emp);
      var storeAccent = store ? getStoreAccent(store) : '#64748b';
      var storeDot = store
        ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + storeAccent + ';vertical-align:middle;margin-right:4px"></span>'
        : '';
      return [
        '<div class="emp-card" onclick="EmployeesModule._openDetail(\'' + esc(emp.empId) + '\')">',
          '<div class="emp-card-name">' + esc(emp.empName) + '</div>',
          '<div class="emp-card-id">' + esc(emp.empId) + '</div>',
          dept ? '<span class="emp-card-badge" style="background:' + deptBg + ';color:' + deptColor + '">' + dept + '</span>' : '',
          emp.title ? '<div class="emp-card-title">' + esc(emp.title) + '</div>' : '',
          store ? '<div class="emp-card-dept">' + storeDot + esc(store) + '</div>' : '',
          emp.phone ? '<div class="emp-card-phone">' + esc(emp.phone) + '</div>' : '',
        '</div>',
      ].join('');
    }).join('') + '</div>';

    list.innerHTML = html;
  }

  // ── Detail sheet ──────────────────────────────────────────────────────────
  function _openDetail(empId) {
    var emp = _allEmployees.find(function(e) { return e.empId === empId; });
    if (!emp) return;
    _detailEmpId = empId;

    var store     = getStoreLabel(emp);
    var dept      = getDeptLabel(emp);
    var deptColor = getDeptColor(emp);
    var deptBg    = getDeptBg(emp);
    var storeAccent = store ? getStoreAccent(store) : '#64748b';
    var ec = emp.emergencyContact || {};

    var content = document.getElementById('emp-detail-content');
    if (!content) return;

    content.innerHTML = [
      '<div class="emp-detail-name">' + esc(emp.empName) + '</div>',
      '<div class="emp-detail-id">' + esc(emp.empId) + '</div>',
      '<div class="emp-detail-badges">',
        dept ? '<span class="emp-detail-badge" style="background:' + deptBg + ';color:' + deptColor + '">' + dept + '</span>' : '',
        store ? '<span class="emp-detail-badge" style="background:' + storeAccent + '1a;color:' + storeAccent + '">' + esc(store) + '</span>' : '',
        emp.title ? '<span class="emp-detail-badge" style="background:#dbeafe;color:#1d4ed8">' + esc(emp.title) + '</span>' : '',
      '</div>',

      '<div class="emp-detail-grid">',
        '<div class="emp-detail-field">',
          '<div class="emp-detail-label">合約類型</div>',
          '<div class="emp-detail-value">' + esc(emp.contractType || '—') + '</div>',
        '</div>',
        '<div class="emp-detail-field">',
          '<div class="emp-detail-label">角色</div>',
          '<div class="emp-detail-value">' + esc(emp.role === 'admin' ? '管理員' : '員工') + '</div>',
        '</div>',
        emp.phone ? [
          '<div class="emp-detail-field">',
            '<div class="emp-detail-label">電話</div>',
            '<div class="emp-detail-value"><a href="tel:' + esc(emp.phone) + '">' + esc(emp.phone) + '</a></div>',
          '</div>',
        ].join('') : '',
        emp.email ? [
          '<div class="emp-detail-field">',
            '<div class="emp-detail-label">電子郵件</div>',
            '<div class="emp-detail-value"><a href="mailto:' + esc(emp.email) + '">' + esc(emp.email) + '</a></div>',
          '</div>',
        ].join('') : '',
        emp.address ? [
          '<div class="emp-detail-field emp-detail-full">',
            '<div class="emp-detail-label">地址</div>',
            '<div class="emp-detail-value">' + esc(emp.address) + '</div>',
          '</div>',
        ].join('') : '',
      '</div>',

      ec.name ? [
        '<div class="emp-detail-section">',
          '<div class="emp-detail-section-title">緊急聯絡人</div>',
          '<div class="emp-detail-grid">',
            '<div class="emp-detail-field">',
              '<div class="emp-detail-label">姓名</div>',
              '<div class="emp-detail-value">' + esc(ec.name) + '</div>',
            '</div>',
            '<div class="emp-detail-field">',
              '<div class="emp-detail-label">關係</div>',
              '<div class="emp-detail-value">' + esc(ec.relationship || '—') + '</div>',
            '</div>',
            ec.phone ? [
              '<div class="emp-detail-field emp-detail-full">',
                '<div class="emp-detail-label">電話</div>',
                '<div class="emp-detail-value"><a href="tel:' + esc(ec.phone) + '">' + esc(ec.phone) + '</a></div>',
              '</div>',
            ].join('') : '',
          '</div>',
        '</div>',
      ].join('') : '',
    ].join('');

    var backdrop = document.getElementById('emp-detail-backdrop');
    var sheet    = document.getElementById('emp-detail-sheet');
    if (backdrop) backdrop.classList.add('open');
    if (sheet) {
      sheet.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function _closeDetail() {
    _detailEmpId = null;
    var backdrop = document.getElementById('emp-detail-backdrop');
    var sheet    = document.getElementById('emp-detail-sheet');
    if (backdrop) backdrop.classList.remove('open');
    if (sheet) sheet.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Login gate ────────────────────────────────────────────────────────────
  function renderLoginGate(container) {
    container.innerHTML = [
      '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:32px;text-align:center;background:var(--bg,#F8F7F2)">',
        '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin-bottom:16px">',
          '<path stroke-linecap="round" stroke-linejoin="round"',
          ' d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>',
        '</svg>',
        '<div style="font-size:16px;font-weight:600;color:#374151;margin-bottom:8px">員工名冊</div>',
        '<div style="font-size:13px;color:#94a3b8;margin-bottom:24px">請先登入以瀏覽員工資料</div>',
        '<button onclick="document.getElementById(\'loginSheet\') && document.getElementById(\'loginSheet\').classList.add(\'open\')"',
        ' style="background:#2563eb;color:#fff;border:none;border-radius:20px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer">',
          '登入',
        '</button>',
      '</div>',
    ].join('');
  }

  // ── Module API ────────────────────────────────────────────────────────────
  function init(ctx) {
    _ctx = ctx;
    _db  = ctx.db;
    injectCSS();

    var user = _ctx.getCurrentUser ? _ctx.getCurrentUser() : null;
    if (!user) {
      renderLoginGate(ctx.container);
      return;
    }

    renderShell(ctx.container);
    loadEmployees();
    _initialized = true;
  }

  function onShow() {
    var user = _ctx && _ctx.getCurrentUser ? _ctx.getCurrentUser() : null;
    if (!user) {
      renderLoginGate(_ctx.container);
      _initialized = false;
      return;
    }
    if (!_initialized) {
      renderShell(_ctx.container);
      loadEmployees();
      _initialized = true;
    }
  }

  function onHide() {
    _closeDetail();
  }

  function onDateChange() {
    // Employee roster is not date-sensitive
  }

  // ── Event handlers (called from inline onclick) ───────────────────────────
  function _onSearch(val) {
    _searchQuery = val || '';
    _applyFilter();
  }

  function _onStore(val) {
    _storeFilter = val || '';
    _applyFilter();
  }

  // ── Public export ─────────────────────────────────────────────────────────
  window.EmployeesModule = {
    init: init,
    onShow: onShow,
    onHide: onHide,
    onDateChange: onDateChange,
    _onSearch: _onSearch,
    _onStore: _onStore,
    _openDetail: _openDetail,
    _closeDetail: _closeDetail,
  };

})();
