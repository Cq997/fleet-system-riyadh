// ============================================================
// 🚑 منصة صيانة وتشغيل الأسطول - هيئة الهلال الأحمر السعودي
// app.js - المنطق الرئيسي للتطبيق
// ============================================================

'use strict';

// ====== المتغيرات العامة ======
let fleetData = [];       // بيانات الأسطول
let trackingData = [];    // بيانات الرصد
let accidentData = [];    // بيانات الحوادث
let maintenanceData = []; // بيانات الصيانة
let oilData = [];         // بيانات تغيير الزيت

let charts = {};          // مخزن الرسوم البيانية
let currentReport = 'monthly';

// ====== رابط Google Apps Script ======
// يجب تحديث هذا الرابط بعد نشر السكريبت
const SCRIPT_URL = typeof CONFIG !== 'undefined' ? CONFIG.SCRIPT_URL : 'https://script.google.com/macros/s/AKfycbyDFRlRvIi_uRMZvcTF365ncbQ4AVFU0iD9kNMmbRMhZZ_TSPNDVCAlpWZ_uOLQCgs/exec';

// ====== تهيئة التطبيق ======
window.addEventListener('DOMContentLoaded', () => {
  initYearSelects();
  setDefaultDates();
  fillFormDropdowns();
  loadAllData();
});

// ====== تهيئة قوائم السنوات ======
function initYearSelects() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const selects = ['yearSelect', 'rpt_year'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      el.appendChild(opt);
    });
  });

  // تعيين الشهر الحالي
  const currentMonth = new Date().getMonth() + 1;
  ['monthSelect', 'rpt_month'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentMonth;
  });
}

// ====== تعيين التواريخ الافتراضية ======
function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  const dateFields = ['t_date','a_date','m_dateIn','o_date'];
  const timeFields = ['t_time','a_time','m_timeIn','o_time'];
  dateFields.forEach(id => { const el = document.getElementById(id); if (el) el.value = today; });
  timeFields.forEach(id => { const el = document.getElementById(id); if (el) el.value = now; });
}

// ====== تعبئة قوائم النماذج ======
function fillFormDropdowns() {
  // أنواع العطل
  const faultTypeEl = document.getElementById('m_faultType');
  if (faultTypeEl) {
    MAINTENANCE_DATA.faultTypes.forEach(t => {
      faultTypeEl.innerHTML += `<option value="${t}">${t}</option>`;
    });
  }

  // وصف العطل
  const faultDescEl = document.getElementById('m_faultDesc');
  if (faultDescEl) {
    MAINTENANCE_DATA.faultDescriptions.forEach(d => {
      faultDescEl.innerHTML += `<option value="${d}">${d}</option>`;
    });
  }

  // الفنيون
  const techEl = document.getElementById('m_tech');
  if (techEl) {
    MAINTENANCE_DATA.technicians.forEach(t => {
      techEl.innerHTML += `<option value="${t}">${t}</option>`;
    });
  }
}

// ====== تحميل جميع البيانات من Google Sheets ======
async function loadAllData() {
  showLoading('جاري تحميل بيانات الأسطول...');
  try {
    const url = SCRIPT_URL + '?action=getAll';
    const res = await fetch(url);
    if (!res.ok) throw new Error('فشل الاتصال');
    const data = await res.json();

    fleetData = (data.fleet || []).filter(r => r[0]);
    trackingData = data.tracking || [];
    accidentData = data.accidents || [];
    maintenanceData = data.maintenance || [];
    oilData = data.oil || [];

    updateConnectionStatus(true);
    populatePlateDropdowns();
    fillSectorFilters();
    updateDashboard();
    checkOilAlerts();

  } catch (err) {
    console.warn('تعذر الاتصال بـ Google Sheets:', err.message);
    updateConnectionStatus(false);
    // تحميل بيانات تجريبية
    loadDemoData();
  } finally {
    hideLoading();
  }
}

// ====== بيانات تجريبية للعرض ======
function loadDemoData() {
  // بيانات أسطول تجريبية
  const types = ['تويوتا هايلوكس','تويوتا لاند كروزر','فورد F150','نيسان باترول','ميتسوبيشي L200'];
  const models = ['2020','2021','2022','2023','2024'];
  const sectors = Object.keys(SECTORS_DATA['داخلي']);
  const statuses = ['جاهزة','جاهزة','جاهزة','صيانة','خارج الخدمة'];

  fleetData = [];
  for (let i = 1; i <= 397; i++) {
    const plate = `${1000 + i} أ ب`;
    const type = types[i % types.length];
    const model = models[i % models.length];
    const chassis = `SA${String(i).padStart(15, '0')}`;
    const sector = sectors[i % sectors.length];
    const centers = SECTORS_DATA['داخلي'][sector];
    const center = centers[i % centers.length];
    const status = statuses[i % statuses.length];
    const lastKm = 10000 + (i * 500);
    fleetData.push([plate, type, model, chassis, 'داخلي', sector, center, status, lastKm, '']);
  }

  populatePlateDropdowns();
  fillSectorFilters();
  updateDashboard();
  showToast('⚠️ وضع العرض التجريبي - يرجى ربط Google Sheets', 'error');
}

// ====== تعبئة قوائم اللوحات ======
function populatePlateDropdowns() {
  const plateSelects = ['t_plate','a_plate','m_plate','o_plate'];
  plateSelects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">-- اختر المركبة --</option>';
    fleetData.forEach(car => {
      el.innerHTML += `<option value="${car[0]}">${car[0]} - ${car[1]} ${car[2]}</option>`;
    });
  });

  // قائمة لوحات الأسطول
  const fleetSectorFilter = document.getElementById('fleetSectorFilter');
  if (fleetSectorFilter) {
    const allSectors = [...new Set(fleetData.map(c => c[5]).filter(Boolean))];
    fleetSectorFilter.innerHTML = '<option value="">الكل</option>';
    allSectors.forEach(s => {
      fleetSectorFilter.innerHTML += `<option value="${s}">${s}</option>`;
    });
  }
}

// ====== تعبئة فلاتر القطاعات ======
function fillSectorFilters() {
  const allSectors = [...new Set([
    ...Object.keys(SECTORS_DATA['داخلي']),
    ...Object.keys(SECTORS_DATA['خارجي'])
  ])];

  ['filterSector'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">الكل</option>';
    allSectors.forEach(s => el.innerHTML += `<option value="${s}">${s}</option>`);
  });
}

// ====== تحديث القطاعات حسب النوع ======
function updateSectors(prefix) {
  const type = document.getElementById(`${prefix}_sectorType`).value;
  const sectorEl = document.getElementById(`${prefix}_sector`);
  sectorEl.innerHTML = '<option value="">-- اختر القطاع --</option>';
  if (!type || !SECTORS_DATA[type]) return;
  Object.keys(SECTORS_DATA[type]).forEach(s => {
    sectorEl.innerHTML += `<option value="${s}">${s}</option>`;
  });
  updateCenters(prefix);
}

// ====== تحديث المراكز حسب القطاع ======
function updateCenters(prefix) {
  const type = document.getElementById(`${prefix}_sectorType`).value;
  const sector = document.getElementById(`${prefix}_sector`).value;
  const centerEl = document.getElementById(`${prefix}_center`);
  centerEl.innerHTML = '<option value="">-- اختر المركز --</option>';
  if (!type || !sector || !SECTORS_DATA[type]?.[sector]) return;
  SECTORS_DATA[type][sector].forEach(c => {
    centerEl.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

// ====== تعبئة معلومات المركبة ======
function fillVehicleInfo(prefix, plate) {
  const car = fleetData.find(c => c[0] === plate);
  const infoCard = document.getElementById(`${prefix}_vehicleInfo`);
  if (!car || !infoCard) { if (infoCard) infoCard.style.display = 'none'; return; }

  infoCard.style.display = 'grid';
  const typeEl = document.getElementById(`${prefix}_vType`);
  const modelEl = document.getElementById(`${prefix}_vModel`);
  const chassisEl = document.getElementById(`${prefix}_vChassis`);
  const statusEl = document.getElementById(`${prefix}_vStatus`);

  if (typeEl) typeEl.textContent = car[1] || '-';
  if (modelEl) modelEl.textContent = car[2] || '-';
  if (chassisEl) chassisEl.textContent = car[3] || '-';
  if (statusEl) statusEl.textContent = car[7] || '-';
}

// ====== تعبئة بيانات الزيت ======
function fillOilData(plate) {
  fillVehicleInfo('o', plate);
  const car = fleetData.find(c => c[0] === plate);
  if (!car) return;

  // آخر تغيير زيت
  const lastOil = oilData.filter(r => r[3] === plate).sort((a, b) => new Date(b[0]) - new Date(a[0]))[0];

  const lastKmEl = document.getElementById('o_lastKm');
  const lastChangeEl = document.getElementById('o_lastChange');
  const lastKmDisplayEl = document.getElementById('o_lastKmDisplay');

  if (lastOil) {
    if (lastKmEl) lastKmEl.value = lastOil[5] || '';
    if (lastChangeEl) lastChangeEl.textContent = lastOil[0] || '-';
    if (lastKmDisplayEl) lastKmDisplayEl.textContent = (lastOil[5] || '-') + ' كم';
    updateOilIndicator(lastOil[0], lastOil[5]);
  } else {
    if (lastKmEl) lastKmEl.value = car[8] || '';
    if (lastChangeEl) lastChangeEl.textContent = 'لا يوجد سجل';
    if (lastKmDisplayEl) lastKmDisplayEl.textContent = (car[8] || '-') + ' كم';
  }

  document.getElementById('o_vehicleInfo').style.display = 'grid';
  calcOilDiff();
}

// ====== حساب الفرق في الكيلومترات ======
function calcOilDiff() {
  const km = parseFloat(document.getElementById('o_km')?.value) || 0;
  const lastKm = parseFloat(document.getElementById('o_lastKm')?.value) || 0;
  const diff = km - lastKm;
  const diffEl = document.getElementById('o_diff');
  if (diffEl) diffEl.value = diff > 0 ? diff : 0;
}

// ====== مؤشر حالة الزيت ======
function updateOilIndicator(lastDate, lastKm) {
  const indicator = document.getElementById('oilIndicator');
  const bar = document.getElementById('oilProgressBar');
  const text = document.getElementById('oilIndicatorText');
  const pct = document.getElementById('oilIndicatorPct');
  if (!indicator) return;

  indicator.style.display = 'block';
  const OIL_KM_LIMIT = 5000;
  const OIL_DAY_LIMIT = 30;

  const daysDiff = lastDate ? Math.floor((new Date() - new Date(lastDate)) / 86400000) : 0;
  const kmDiff = parseFloat(document.getElementById('o_km')?.value || 0) - parseFloat(lastKm || 0);

  const kmPct = Math.min((kmDiff / OIL_KM_LIMIT) * 100, 100);
  const dayPct = Math.min((daysDiff / OIL_DAY_LIMIT) * 100, 100);
  const maxPct = Math.max(kmPct, dayPct);

  bar.style.width = maxPct + '%';
  bar.className = 'oil-progress-bar ' + (maxPct >= 90 ? 'danger' : maxPct >= 70 ? 'warn' : 'safe');
  text.textContent = maxPct >= 90 ? '⚠️ يحتاج تغيير زيت عاجل' : maxPct >= 70 ? '⚠️ اقترب موعد تغيير الزيت' : '✅ الزيت بحالة جيدة';
  pct.textContent = Math.round(maxPct) + '%';
}

// ====== إظهار/إخفاء الورشة الخارجية ======
function toggleWorkshop() {
  const val = document.getElementById('m_external').value;
  document.getElementById('workshopGroup').style.display = val === 'نعم' ? 'flex' : 'none';
}

// ====== التنقل بين الصفحات ======
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const page = document.getElementById(`page-${pageId}`);
  if (page) page.style.display = 'block';

  const btn = document.getElementById(`btn-${pageId}`);
  if (btn) btn.classList.add('active');

  // تحميل البيانات عند الانتقال
  if (pageId === 'fleet') renderFleetTable(fleetData);
  if (pageId === 'tracking') loadTrackingRecords();
  if (pageId === 'accidents') loadAccidentRecords();
  if (pageId === 'maintenance') loadMaintenanceRecords();
  if (pageId === 'oil') { loadOilRecords(); checkOilAlerts(); }

  // إغلاق الشريط الجانبي في الجوال
  if (window.innerWidth <= 768) toggleSidebar();
}

// ====== تبديل الشريط الجانبي ======
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

// ====== تحديث لوحة القائد ======
function updateDashboard() {
  const total = fleetData.length;
  const ready = fleetData.filter(c => c[7] === 'جاهزة').length;
  const maint = fleetData.filter(c => c[7] === 'صيانة').length;
  const out = fleetData.filter(c => c[7] === 'خارج الخدمة').length;
  const accidents = accidentData.length;
  const pending = maintenanceData.filter(r => r[10] === 'غير منجز').length +
                  accidentData.filter(r => r[11] === 'غير منجز').length;

  setStatValue('stat-total', total);
  setStatValue('stat-ready', ready);
  setStatValue('stat-maint', maint);
  setStatValue('stat-out', out);
  setStatValue('stat-accidents', accidents);
  setStatValue('stat-pending', pending);

  renderFleetStatusChart(ready, maint, out);
  renderMaintenanceChart();
  renderAccidentsChart();
  renderOilChart();
  renderRecentActivities();
  checkOilAlerts();
  updateAlertBadge();
}

// ====== تعيين قيمة إحصائية ======
function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'countUp 0.5s ease';
  }
}

// ====== رسم حالات الأسطول ======
function renderFleetStatusChart(ready, maint, out) {
  const ctx = document.getElementById('fleetStatusChart');
  if (!ctx) return;
  if (charts.fleetStatus) charts.fleetStatus.destroy();

  charts.fleetStatus = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['جاهزة', 'صيانة', 'خارج الخدمة'],
      datasets: [{
        data: [ready, maint, out],
        backgroundColor: ['#1a7a3c', '#d29922', '#da3633'],
        borderColor: '#161b22',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#e6edf3', font: { family: 'Cairo', size: 12 } } }
      }
    }
  });
}

// ====== رسم الصيانة الشهرية ======
function renderMaintenanceChart() {
  const ctx = document.getElementById('maintenanceChart');
  if (!ctx) return;
  if (charts.maintenance) charts.maintenance.destroy();

  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const counts = new Array(12).fill(0);
  maintenanceData.forEach(r => {
    if (r[0]) {
      const m = new Date(r[0]).getMonth();
      if (!isNaN(m)) counts[m]++;
    }
  });

  charts.maintenance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'عمليات الصيانة',
        data: counts,
        backgroundColor: 'rgba(26,122,60,0.7)',
        borderColor: '#1a7a3c',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#e6edf3', font: { family: 'Cairo' } } } },
      scales: {
        x: { ticks: { color: '#8b949e', font: { family: 'Cairo', size: 10 } }, grid: { color: '#30363d' } },
        y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }
      }
    }
  });
}

// ====== رسم الحوادث حسب القطاع ======
function renderAccidentsChart() {
  const ctx = document.getElementById('accidentsChart');
  if (!ctx) return;
  if (charts.accidents) charts.accidents.destroy();

  const sectorCounts = {};
  accidentData.forEach(r => {
    const s = r[7] || 'غير محدد';
    sectorCounts[s] = (sectorCounts[s] || 0) + 1;
  });

  const labels = Object.keys(sectorCounts).slice(0, 8);
  const data = labels.map(l => sectorCounts[l]);

  charts.accidents = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'الحوادث',
        data,
        backgroundColor: 'rgba(218,55,51,0.7)',
        borderColor: '#da3633',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { labels: { color: '#e6edf3', font: { family: 'Cairo' } } } },
      scales: {
        x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } },
        y: { ticks: { color: '#8b949e', font: { family: 'Cairo', size: 10 } }, grid: { color: '#30363d' } }
      }
    }
  });
}

// ====== رسم حالة الزيت ======
function renderOilChart() {
  const ctx = document.getElementById('oilChart');
  if (!ctx) return;
  if (charts.oil) charts.oil.destroy();

  // حساب المركبات التي تحتاج تغيير زيت
  let needOil = 0, okOil = 0, noRecord = 0;
  fleetData.forEach(car => {
    const lastOil = oilData.filter(r => r[3] === car[0]).sort((a, b) => new Date(b[0]) - new Date(a[0]))[0];
    if (!lastOil) { noRecord++; return; }
    const daysDiff = Math.floor((new Date() - new Date(lastOil[0])) / 86400000);
    const kmDiff = (car[8] || 0) - (lastOil[5] || 0);
    if (daysDiff > 30 || kmDiff > 5000) needOil++;
    else okOil++;
  });

  charts.oil = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['بحاجة تغيير', 'جيد', 'لا يوجد سجل'],
      datasets: [{
        data: [needOil, okOil, noRecord],
        backgroundColor: ['#da3633', '#1a7a3c', '#8b949e'],
        borderColor: '#161b22',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: '#e6edf3', font: { family: 'Cairo', size: 12 } } } }
    }
  });
}

// ====== آخر الأنشطة ======
function renderRecentActivities() {
  const tbody = document.getElementById('recentActivities');
  if (!tbody) return;

  const activities = [];

  trackingData.slice(-5).forEach(r => {
    activities.push({ date: r[0], time: r[1], type: '📍 رصد', plate: r[3], sector: r[5], status: r[7], done: '-' });
  });
  accidentData.slice(-5).forEach(r => {
    activities.push({ date: r[0], time: r[1], type: '🚧 حادث', plate: r[3], sector: r[7], status: r[6], done: r[11] });
  });
  maintenanceData.slice(-5).forEach(r => {
    activities.push({ date: r[0], time: r[1], type: '🔧 صيانة', plate: r[5], sector: '-', status: '-', done: r[10] });
  });

  activities.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const recent = activities.slice(0, 10);

  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-secondary);padding:20px">لا توجد أنشطة حديثة</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(a => `
    <tr>
      <td>${a.date || '-'}</td>
      <td>${a.type}</td>
      <td>${a.plate || '-'}</td>
      <td>${a.sector || '-'}</td>
      <td>${getStatusBadge(a.status)}</td>
      <td>${getDoneBadge(a.done)}</td>
    </tr>
  `).join('');
}

// ====== شارة الحالة ======
function getStatusBadge(status) {
  if (!status || status === '-') return '<span class="badge badge-secondary">-</span>';
  if (status === 'عاملة') return '<span class="badge badge-success">✅ عاملة</span>';
  if (status === 'خارج الخدمة') return '<span class="badge badge-danger">❌ خارج الخدمة</span>';
  if (status === 'صيانة') return '<span class="badge badge-warning">🔧 صيانة</span>';
  return `<span class="badge badge-secondary">${status}</span>`;
}

// ====== شارة الإنجاز ======
function getDoneBadge(done) {
  if (!done || done === '-') return '<span class="badge badge-secondary">-</span>';
  if (done === 'منجز') return '<span class="badge badge-success">✅ منجز</span>';
  if (done === 'غير منجز') return '<span class="badge badge-warning">⏳ غير منجز</span>';
  return `<span class="badge badge-secondary">${done}</span>`;
}

// ====== التحقق من تنبيهات الزيت ======
function checkOilAlerts() {
  const alerts = [];
  const OIL_KM_WARN = 4500;
  const OIL_KM_LIMIT = 5000;
  const OIL_DAY_WARN = 25;
  const OIL_DAY_LIMIT = 30;

  fleetData.forEach(car => {
    const lastOil = oilData.filter(r => r[3] === car[0]).sort((a, b) => new Date(b[0]) - new Date(a[0]))[0];
    if (!lastOil) return;

    const daysDiff = Math.floor((new Date() - new Date(lastOil[0])) / 86400000);
    const kmDiff = (parseFloat(car[8]) || 0) - (parseFloat(lastOil[5]) || 0);

    if (kmDiff >= OIL_KM_LIMIT || daysDiff >= OIL_DAY_LIMIT) {
      alerts.push({ type: 'danger', plate: car[0], msg: `تجاوز موعد تغيير الزيت (${kmDiff} كم / ${daysDiff} يوم)` });
    } else if (kmDiff >= OIL_KM_WARN || daysDiff >= OIL_DAY_WARN) {
      alerts.push({ type: 'warning', plate: car[0], msg: `اقترب موعد تغيير الزيت (${kmDiff} كم / ${daysDiff} يوم)` });
    }
  });

  // عرض في لوحة القائد
  renderAlerts('alertsContainer', alerts.slice(0, 5));
  // عرض في صفحة الزيت
  renderAlerts('oilAlertsContainer', alerts);

  // تحديث الشارة
  const badge = document.getElementById('alertBadge');
  if (badge) {
    badge.textContent = alerts.length;
    badge.style.display = alerts.length > 0 ? 'inline-flex' : 'none';
  }
}

// ====== عرض التنبيهات ======
function renderAlerts(containerId, alerts) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="alert alert-${a.type}">
      <span class="alert-icon">${a.type === 'danger' ? '🔴' : '⚠️'}</span>
      <div class="alert-content">
        <div class="alert-title">تنبيه تغيير الزيت - ${a.plate}</div>
        <div class="alert-text">${a.msg}</div>
      </div>
    </div>
  `).join('');
}

// ====== تحديث شارة التنبيهات ======
function updateAlertBadge() {
  const pendingCount = maintenanceData.filter(r => r[10] === 'غير منجز').length +
                       accidentData.filter(r => r[11] === 'غير منجز').length;
  const badge = document.getElementById('alertBadge');
  if (badge && pendingCount > 0) {
    badge.textContent = pendingCount;
    badge.style.display = 'inline-flex';
  }
}

// ====== عرض جدول الأسطول ======
function renderFleetTable(data) {
  const tbody = document.getElementById('fleetTableBody');
  const countEl = document.getElementById('fleetCount');
  if (!tbody) return;

  if (countEl) countEl.textContent = `إجمالي: ${data.length} مركبة`;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:var(--text-secondary);padding:20px">لا توجد مركبات</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((car, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${car[0] || '-'}</strong></td>
      <td>${car[1] || '-'}</td>
      <td>${car[2] || '-'}</td>
      <td style="font-size:11px;color:var(--text-secondary)">${car[3] || '-'}</td>
      <td>${car[5] || '-'}</td>
      <td>${car[6] || '-'}</td>
      <td>${getStatusBadge(car[7])}</td>
      <td>${car[8] ? car[8] + ' كم' : '-'}</td>
    </tr>
  `).join('');
}

// ====== فلترة جدول الأسطول ======
function filterFleetTable() {
  const search = document.getElementById('fleetSearch')?.value.toLowerCase() || '';
  const sector = document.getElementById('fleetSectorFilter')?.value || '';
  const status = document.getElementById('fleetStatusFilter')?.value || '';

  const filtered = fleetData.filter(car => {
    const matchSearch = !search || [car[0], car[1], car[2], car[3]].some(v => (v || '').toLowerCase().includes(search));
    const matchSector = !sector || car[5] === sector;
    const matchStatus = !status || car[7] === status;
    return matchSearch && matchSector && matchStatus;
  });

  renderFleetTable(filtered);
}

// ====== تحديث الأسطول ======
function refreshFleet() {
  renderFleetTable(fleetData);
  showToast('✅ تم تحديث قائمة الأسطول');
}

// ====== تحميل سجلات الرصد ======
function loadTrackingRecords() {
  const tbody = document.getElementById('trackingRecords');
  if (!tbody) return;

  if (trackingData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="color:var(--text-secondary);padding:20px">لا توجد سجلات رصد</td></tr>';
    return;
  }

  const recent = [...trackingData].sort((a, b) => new Date(b[0] + ' ' + b[1]) - new Date(a[0] + ' ' + a[1])).slice(0, 50);
  tbody.innerHTML = recent.map(r => `
    <tr>
      <td>${r[0] || '-'}</td>
      <td>${r[1] || '-'}</td>
      <td>${r[2] || '-'}</td>
      <td><strong>${r[3] || '-'}</strong></td>
      <td>${r[4] || '-'}</td>
      <td>${r[5] || '-'}</td>
      <td>${r[6] || '-'}</td>
      <td>${getStatusBadge(r[7])}</td>
    </tr>
  `).join('');
}

// ====== تحميل سجلات الحوادث ======
function loadAccidentRecords() {
  renderAccidentTable(accidentData);
}

function filterAccidents() {
  const filter = document.getElementById('accidentFilter')?.value || '';
  const filtered = filter ? accidentData.filter(r => r[11] === filter) : accidentData;
  renderAccidentTable(filtered);
}

function renderAccidentTable(data) {
  const tbody = document.getElementById('accidentRecords');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="color:var(--text-secondary);padding:20px">لا توجد سجلات حوادث</td></tr>';
    return;
  }

  const sorted = [...data].sort((a, b) => new Date(b[0]) - new Date(a[0])).slice(0, 50);
  tbody.innerHTML = sorted.map(r => `
    <tr>
      <td>${r[0] || '-'}</td>
      <td>${r[1] || '-'}</td>
      <td><strong>${r[3] || '-'}</strong></td>
      <td>${r[4] || '-'}</td>
      <td>${r[5] || '-'}</td>
      <td>${getStatusBadge(r[6])}</td>
      <td>${r[7] || '-'}</td>
      <td>${r[8] ? r[8] + '%' : '-'}</td>
      <td>${r[9] || '-'}</td>
      <td><span class="badge badge-info">${r[10] || '-'}</span></td>
      <td>${getDoneBadge(r[11])}</td>
    </tr>
  `).join('');
}

// ====== تحميل سجلات الصيانة ======
function loadMaintenanceRecords() {
  renderMaintenanceTable(maintenanceData);
}

function filterMaintenance() {
  const filter = document.getElementById('maintFilter')?.value || '';
  const filtered = filter ? maintenanceData.filter(r => r[10] === filter) : maintenanceData;
  renderMaintenanceTable(filtered);
}

function renderMaintenanceTable(data) {
  const tbody = document.getElementById('maintenanceRecords');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="color:var(--text-secondary);padding:20px">لا توجد سجلات صيانة</td></tr>';
    return;
  }

  const sorted = [...data].sort((a, b) => new Date(b[0]) - new Date(a[0])).slice(0, 50);
  tbody.innerHTML = sorted.map(r => {
    const severity = r[6];
    const severityBadge = severity === 'ثقيل' ? 'badge-danger' : severity === 'متوسط' ? 'badge-warning' : 'badge-success';
    return `
      <tr>
        <td>${r[0] || '-'} ${r[1] || ''}</td>
        <td>${r[2] ? r[2] + ' ' + (r[3] || '') : '-'}</td>
        <td><strong>${r[5] || '-'}</strong></td>
        <td>${r[13] || '-'}</td>
        <td>${r[14] || '-'}</td>
        <td>${r[4] || '-'}</td>
        <td><span class="badge ${severityBadge}">${severity || '-'}</span></td>
        <td>${r[7] || '-'}</td>
        <td style="font-size:11px">${r[8] || '-'}</td>
        <td>${r[9] === 'نعم' ? r[10] || 'نعم' : 'لا'}</td>
        <td>${getDoneBadge(r[11])}</td>
      </tr>
    `;
  }).join('');
}

// ====== تحميل سجلات الزيت ======
function loadOilRecords() {
  const tbody = document.getElementById('oilRecords');
  if (!tbody) return;

  if (oilData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="color:var(--text-secondary);padding:20px">لا توجد سجلات تغيير زيت</td></tr>';
    return;
  }

  const sorted = [...oilData].sort((a, b) => new Date(b[0]) - new Date(a[0])).slice(0, 50);
  tbody.innerHTML = sorted.map(r => {
    const km = parseFloat(r[5]) || 0;
    const lastKm = parseFloat(r[6]) || 0;
    const diff = km - lastKm;
    const oilStatus = diff > 5000 ? '<span class="badge badge-danger">⚠️ تجاوز الحد</span>' :
                      diff > 4500 ? '<span class="badge badge-warning">⚠️ قريب</span>' :
                      '<span class="badge badge-success">✅ جيد</span>';
    const car = fleetData.find(c => c[0] === r[3]);
    return `
      <tr>
        <td>${r[0] || '-'}</td>
        <td>${r[1] || '-'}</td>
        <td><strong>${r[3] || '-'}</strong></td>
        <td>${car ? car[1] : '-'}</td>
        <td>${car ? car[2] : '-'}</td>
        <td>${r[4] || '-'}</td>
        <td>${km ? km.toLocaleString() + ' كم' : '-'}</td>
        <td>${lastKm ? lastKm.toLocaleString() + ' كم' : '-'}</td>
        <td>${diff > 0 ? diff.toLocaleString() + ' كم' : '-'}</td>
        <td>${oilStatus}</td>
      </tr>
    `;
  }).join('');
}

// ====== إرسال بيانات الرصد ======
async function submitTracking(e) {
  e.preventDefault();
  const data = {
    sheet: 'الرصد',
    values: [
      document.getElementById('t_date').value,
      document.getElementById('t_time').value,
      document.getElementById('t_user').value,
      document.getElementById('t_plate').value,
      document.getElementById('t_sectorType').value,
      document.getElementById('t_sector').value,
      document.getElementById('t_center').value,
      document.getElementById('t_status').value,
      document.getElementById('t_notes').value
    ]
  };

  // تحديث حالة المركبة في الأسطول المحلي
  const carIdx = fleetData.findIndex(c => c[0] === data.values[3]);
  if (carIdx !== -1) fleetData[carIdx][7] = data.values[7];

  trackingData.push(data.values);
  await sendToSheets(data);
  loadTrackingRecords();
  showToast('✅ تم إرسال بيانات الرصد بنجاح');
  e.target.reset();
  setDefaultDates();
}

// ====== إرسال بيانات الحادث ======
async function submitAccident(e) {
  e.preventDefault();
  const data = {
    sheet: 'الحوادث',
    values: [
      document.getElementById('a_date').value,
      document.getElementById('a_time').value,
      document.getElementById('a_user').value,
      document.getElementById('a_plate').value,
      document.getElementById('a_reason').value,
      document.getElementById('a_location').value,
      document.getElementById('a_vehicleStatus').value,
      document.getElementById('a_sector').value,
      document.getElementById('a_errorPercent').value,
      document.getElementById('a_reportNumber').value,
      document.getElementById('a_authority').value,
      document.getElementById('a_done').value,
      document.getElementById('a_notes').value
    ]
  };

  // تحديث حالة المركبة
  if (data.values[6] === 'خارج الخدمة') {
    const carIdx = fleetData.findIndex(c => c[0] === data.values[3]);
    if (carIdx !== -1) fleetData[carIdx][7] = 'خارج الخدمة';
  }

  accidentData.push(data.values);
  await sendToSheets(data);
  loadAccidentRecords();
  updateDashboard();
  showToast('✅ تم تسجيل الحادث بنجاح');
  e.target.reset();
  setDefaultDates();
}

// ====== إرسال بيانات الصيانة ======
async function submitMaintenance(e) {
  e.preventDefault();
  const plate = document.getElementById('m_plate').value;
  const car = fleetData.find(c => c[0] === plate);

  const data = {
    sheet: 'الصيانة الوقائية',
    values: [
      document.getElementById('m_dateIn').value,
      document.getElementById('m_timeIn').value,
      document.getElementById('m_dateOut').value,
      document.getElementById('m_timeOut').value,
      document.getElementById('m_faultType').value,
      plate,
      car ? car[1] : '',
      car ? car[2] : '',
      car ? car[3] : '',
      document.getElementById('m_user').value,
      document.getElementById('m_severity').value,
      document.getElementById('m_tech').value,
      document.getElementById('m_parts').value,
      document.getElementById('m_external').value,
      document.getElementById('m_workshop').value,
      document.getElementById('m_status').value,
      document.getElementById('m_notes').value,
      document.getElementById('m_faultDesc').value
    ]
  };

  // تحديث حالة المركبة
  const carIdx = fleetData.findIndex(c => c[0] === plate);
  if (carIdx !== -1) {
    fleetData[carIdx][7] = data.values[15] === 'منجز' ? 'جاهزة' : 'صيانة';
  }

  maintenanceData.push(data.values);
  await sendToSheets(data);
  loadMaintenanceRecords();
  updateDashboard();
  showToast('✅ تم حفظ كرت الصيانة بنجاح');
  e.target.reset();
  setDefaultDates();
  document.getElementById('m_vehicleInfo').style.display = 'none';
  document.getElementById('workshopGroup').style.display = 'none';
}

// ====== إرسال بيانات الزيت ======
async function submitOil(e) {
  e.preventDefault();
  const plate = document.getElementById('o_plate').value;
  const car = fleetData.find(c => c[0] === plate);

  const data = {
    sheet: 'تغيير الزيت',
    values: [
      document.getElementById('o_date').value,
      document.getElementById('o_time').value,
      document.getElementById('o_user').value,
      plate,
      document.getElementById('o_orderNum').value,
      document.getElementById('o_km').value,
      document.getElementById('o_lastKm').value,
      document.getElementById('o_diff').value,
      document.getElementById('o_notes').value,
      car ? car[1] : '',
      car ? car[2] : ''
    ]
  };

  // تحديث آخر قراءة عداد في الأسطول
  const carIdx = fleetData.findIndex(c => c[0] === plate);
  if (carIdx !== -1) fleetData[carIdx][8] = data.values[5];

  oilData.push(data.values);
  await sendToSheets(data);
  loadOilRecords();
  checkOilAlerts();
  showToast('✅ تم تسجيل تغيير الزيت بنجاح');
  e.target.reset();
  setDefaultDates();
  document.getElementById('o_vehicleInfo').style.display = 'none';
  document.getElementById('oilIndicator').style.display = 'none';
}

// ====== إرسال البيانات إلى Google Sheets ======
async function sendToSheets(data) {
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    console.log('Google Sheets غير مربوط - البيانات محفوظة محلياً:', data);
    return;
  }

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error('خطأ في الإرسال:', err);
    showToast('⚠️ تعذر الإرسال - البيانات محفوظة محلياً', 'error');
  }
}

// ====== تحديث لوحة القائد ======
function refreshDashboard() {
  showLoading('جاري تحديث البيانات...');
  loadAllData();
  showToast('✅ تم تحديث لوحة القائد');
}

// ====== تحديث نطاق التاريخ ======
function updateDateRange() {
  const type = document.getElementById('reportType').value;
  document.getElementById('monthGroup').style.display = type === 'monthly' ? 'flex' : 'none';
  document.getElementById('quarterGroup').style.display = type === 'quarterly' ? 'flex' : 'none';
  document.getElementById('customDateGroup').style.display = type === 'custom' ? 'flex' : 'none';
  document.getElementById('customDateGroup2').style.display = type === 'custom' ? 'flex' : 'none';
}

// ====== تطبيق فلتر لوحة القائد ======
function applyDashboardFilter() {
  const type = document.getElementById('reportType').value;
  const year = parseInt(document.getElementById('yearSelect').value);
  const month = parseInt(document.getElementById('monthSelect').value);
  const quarter = parseInt(document.getElementById('quarterSelect').value);
  const sector = document.getElementById('filterSector').value;
  const status = document.getElementById('filterStatus').value;

  let from, to;
  if (type === 'monthly') {
    from = new Date(year, month - 1, 1);
    to = new Date(year, month, 0);
  } else if (type === 'quarterly') {
    const startMonth = (quarter - 1) * 3;
    from = new Date(year, startMonth, 1);
    to = new Date(year, startMonth + 3, 0);
  } else if (type === 'annual') {
    from = new Date(year, 0, 1);
    to = new Date(year, 11, 31);
  } else {
    from = new Date(document.getElementById('fromDate').value);
    to = new Date(document.getElementById('toDate').value);
  }

  // فلترة البيانات
  const filterByDate = (arr, dateIdx = 0) => arr.filter(r => {
    if (!r[dateIdx]) return true;
    const d = new Date(r[dateIdx]);
    return d >= from && d <= to;
  });

  const filteredMaint = filterByDate(maintenanceData);
  const filteredAcc = filterByDate(accidentData);
  const filteredOil = filterByDate(oilData);
  const filteredTracking = filterByDate(trackingData);

  // تحديث الإحصائيات
  const filteredFleet = sector ? fleetData.filter(c => c[5] === sector) : fleetData;
  const finalFleet = status ? filteredFleet.filter(c => c[7] === status) : filteredFleet;

  setStatValue('stat-total', finalFleet.length);
  setStatValue('stat-ready', finalFleet.filter(c => c[7] === 'جاهزة').length);
  setStatValue('stat-maint', finalFleet.filter(c => c[7] === 'صيانة').length);
  setStatValue('stat-out', finalFleet.filter(c => c[7] === 'خارج الخدمة').length);
  setStatValue('stat-accidents', filteredAcc.length);
  setStatValue('stat-pending', filteredMaint.filter(r => r[15] === 'غير منجز').length + filteredAcc.filter(r => r[11] === 'غير منجز').length);

  showToast('✅ تم تطبيق الفلتر');
}

// ====== تبديل تقارير ======
function switchReport(type, btn) {
  currentReport = type;
  document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const monthGroup = document.getElementById('rpt_monthGroup');
  const quarterGroup = document.getElementById('rpt_quarterGroup');
  if (monthGroup) monthGroup.style.display = type === 'monthly' ? 'flex' : 'none';
  if (quarterGroup) quarterGroup.style.display = type === 'quarterly' ? 'flex' : 'none';

  document.getElementById('reportSummary').style.display = 'none';
}

// ====== إنشاء التقرير ======
function generateReport() {
  const year = parseInt(document.getElementById('rpt_year').value);
  const month = parseInt(document.getElementById('rpt_month').value);
  const quarter = parseInt(document.getElementById('rpt_quarter').value);

  let from, to, title;
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  if (currentReport === 'monthly') {
    from = new Date(year, month - 1, 1);
    to = new Date(year, month, 0);
    title = `تقرير شهر ${months[month - 1]} ${year}`;
  } else if (currentReport === 'quarterly') {
    const startMonth = (quarter - 1) * 3;
    from = new Date(year, startMonth, 1);
    to = new Date(year, startMonth + 3, 0);
    title = `تقرير الربع ${['الأول','الثاني','الثالث','الرابع'][quarter - 1]} ${year}`;
  } else {
    from = new Date(year, 0, 1);
    to = new Date(year, 11, 31);
    title = `التقرير السنوي ${year}`;
  }

  const filterByDate = (arr, dateIdx = 0) => arr.filter(r => {
    if (!r[dateIdx]) return false;
    const d = new Date(r[dateIdx]);
    return d >= from && d <= to;
  });

  const filteredMaint = filterByDate(maintenanceData);
  const filteredAcc = filterByDate(accidentData);
  const filteredOil = filterByDate(oilData);

  // إحصائيات
  const statsEl = document.getElementById('reportStats');
  statsEl.innerHTML = `
    <div class="stat-card blue"><div class="stat-icon">🚑</div><div class="stat-value">${fleetData.length}</div><div class="stat-label">إجمالي الأسطول</div></div>
    <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-value">${fleetData.filter(c=>c[7]==='جاهزة').length}</div><div class="stat-label">جاهزة</div></div>
    <div class="stat-card yellow"><div class="stat-icon">🔧</div><div class="stat-value">${filteredMaint.length}</div><div class="stat-label">عمليات صيانة</div></div>
    <div class="stat-card red"><div class="stat-icon">🚧</div><div class="stat-value">${filteredAcc.length}</div><div class="stat-label">حوادث</div></div>
    <div class="stat-card orange"><div class="stat-icon">🛢️</div><div class="stat-value">${filteredOil.length}</div><div class="stat-label">تغيير زيت</div></div>
    <div class="stat-card yellow"><div class="stat-icon">⏳</div><div class="stat-value">${filteredMaint.filter(r=>r[15]==='غير منجز').length}</div><div class="stat-label">صيانة معلقة</div></div>
  `;

  // جدول التقرير
  document.getElementById('reportTableTitle').textContent = `📋 ${title}`;
  document.getElementById('reportTableHead').innerHTML = `
    <tr>
      <th>التاريخ</th><th>رقم اللوحة</th><th>النوع</th>
      <th>نوع العطل</th><th>الدرجة</th><th>الفني</th><th>الإنجاز</th>
    </tr>
  `;
  document.getElementById('reportTableBody').innerHTML = filteredMaint.length > 0
    ? filteredMaint.map(r => `
        <tr>
          <td>${r[0] || '-'}</td>
          <td><strong>${r[5] || '-'}</strong></td>
          <td>${r[6] || '-'}</td>
          <td>${r[4] || '-'}</td>
          <td>${r[10] || '-'}</td>
          <td>${r[11] || '-'}</td>
          <td>${getDoneBadge(r[15])}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="7" style="color:var(--text-secondary);padding:20px">لا توجد بيانات في هذه الفترة</td></tr>';

  document.getElementById('reportSummary').style.display = 'block';
  showToast('✅ تم إنشاء التقرير');
}

// ====== تصدير PDF للوحة القائد ======
function exportReportPDF() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) { window.print(); return; }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');

  // العنوان
  doc.setFontSize(16);
  doc.setTextColor(26, 122, 60);
  doc.text('Fleet Management Report - SRCA Riyadh', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Date: ${new Date().toLocaleDateString('ar-SA')}`, 105, 30, { align: 'center' });

  // الإحصائيات
  doc.setFontSize(11);
  doc.text(`Total Fleet: ${fleetData.length}`, 20, 45);
  doc.text(`Ready: ${fleetData.filter(c=>c[7]==='جاهزة').length}`, 20, 55);
  doc.text(`Maintenance: ${fleetData.filter(c=>c[7]==='صيانة').length}`, 20, 65);
  doc.text(`Out of Service: ${fleetData.filter(c=>c[7]==='خارج الخدمة').length}`, 20, 75);
  doc.text(`Accidents: ${accidentData.length}`, 20, 85);

  doc.save(`fleet-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ====== تصدير PDF كامل ======
function exportFullReportPDF() {
  window.print();
}

// ====== تصدير الأسطول PDF ======
function exportFleetPDF() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) { window.print(); return; }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Fleet List - SRCA Riyadh', 148, 15, { align: 'center' });

  const headers = [['#', 'Plate', 'Type', 'Model', 'Chassis', 'Sector', 'Center', 'Status']];
  const rows = fleetData.slice(0, 100).map((car, i) => [
    i + 1, car[0], car[1], car[2], car[3], car[5], car[6], car[7]
  ]);

  doc.autoTable({ head: headers, body: rows, startY: 25, styles: { fontSize: 8 } });
  doc.save(`fleet-list-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ====== مؤشر التحميل ======
function showLoading(text = 'جاري التحميل...') {
  const overlay = document.getElementById('loadingOverlay');
  const textEl = document.getElementById('loadingText');
  if (overlay) overlay.style.display = 'flex';
  if (textEl) textEl.textContent = text;
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ====== الإشعارات ======
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type === 'error' ? 'error' : ''} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ====== حالة الاتصال ======
function updateConnectionStatus(connected) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (dot) dot.className = `status-dot ${connected ? '' : 'offline'}`;
  if (text) text.textContent = connected ? 'متصل بـ Google Sheets' : 'وضع غير متصل';
}
