const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const form = $('#settlement-form');
const startMonthInput = $('#start-month');
const incomeInputs = ['#first-platform', '#first-wechat', '#second-platform', '#second-wechat', '#adjustment'].map(selector => $(selector));
const caicaiDaysInput = $('#caicai-days');
const xiaofanDaysInput = $('#xiaofan-days');
const equalRateInput = $('#equal-rate');
const workRateInput = $('#work-rate');
const resultSection = $('#result-section');
const historyList = $('#history-list');
const historyYearSelect = $('#history-year');
const toast = $('#toast');

let attendanceMode = 'days';
let selectedDates = {};
let restDates = {};
let restMode = false;
let allocation = getSavedAllocation();

const money = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 });

function numberValue(input) { return Number.parseFloat(input.value) || 0; }
function roundMoney(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
function formatMoney(value) { return money.format(value).replace('CN¥', '¥'); }
function monthKey(year, monthIndex) { return `${year}-${String(monthIndex + 1).padStart(2, '0')}`; }

function getSavedAllocation() {
  try {
    const saved = JSON.parse(localStorage.getItem('kuaTuanAllocation'));
    if (saved && Number.isFinite(saved.equal) && Number.isFinite(saved.work) && saved.equal + saved.work === 100) return saved;
  } catch {}
  return { equal: 60, work: 40 };
}

function updateAllocationUI() {
  equalRateInput.value = allocation.equal;
  workRateInput.value = allocation.work;
  $('.rule-progress span').style.width = `${allocation.equal}%`;
  $('.rule-progress i').style.width = `${allocation.work}%`;
  $('.sidebar-rule small').textContent = `两项合计 100%，每周日固定休息`;
}

function readAllocation() {
  const equal = Math.min(100, Math.max(0, Math.round(numberValue(equalRateInput))));
  const work = Math.min(100, Math.max(0, Math.round(numberValue(workRateInput))));
  if (equal + work !== 100) return null;
  allocation = { equal, work };
  localStorage.setItem('kuaTuanAllocation', JSON.stringify(allocation));
  updateAllocationUI();
  return allocation;
}

function defaultStartMonth() {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return monthKey(previous.getFullYear(), previous.getMonth());
}

function parseMonth(value) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function addMonths(value, count) {
  const date = parseMonth(value);
  date.setMonth(date.getMonth() + count);
  return monthKey(date.getFullYear(), date.getMonth());
}

function monthLabel(value) {
  const [year, month] = value.split('-');
  return `${year}年${Number(month)}月`;
}

function getMonthDetails(value) {
  const date = parseMonth(value);
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let businessDays = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    if (new Date(year, monthIndex, day).getDay() !== 0) businessDays += 1;
  }
  return { year, monthIndex, daysInMonth, businessDays };
}

function getAvailableBusinessDays(value) {
  const details = getMonthDetails(value);
  let extraRestDays = 0;
  for (let day = 1; day <= details.daysInMonth; day += 1) {
    const date = new Date(details.year, details.monthIndex, day);
    const key = `${value}-${String(day).padStart(2, '0')}`;
    if (date.getDay() !== 0 && restDates[key]) extraRestDays += 1;
  }
  return details.businessDays - extraRestDays;
}

function currentPeriod() {
  const first = startMonthInput.value;
  return { first, second: addMonths(first, 1), key: `${first}_${addMonths(first, 1)}` };
}

function updatePeriodUI() {
  if (!startMonthInput.value) return;
  const { first, second } = currentPeriod();
  $('#first-month-title').textContent = monthLabel(first);
  $('#second-month-title').textContent = monthLabel(second);
  $('#top-period').textContent = `${monthLabel(first)} — ${monthLabel(second)}`;
  const totalAvailable = getAvailableBusinessDays(first) + getAvailableBusinessDays(second);
  $('#available-days').textContent = totalAvailable;
  caicaiDaysInput.max = totalAvailable;
  xiaofanDaysInput.max = totalAvailable;
}

function syncPartnerDays(changedInput, partnerInput) {
  if (changedInput.value === '') {
    partnerInput.value = '';
    return;
  }
  const maximum = Number(changedInput.max) || 0;
  const days = Math.min(maximum, Math.max(0, Math.round(numberValue(changedInput))));
  changedInput.value = days;
  partnerInput.value = maximum - days;
}

function updateIncomePreview() {
  const firstSubtotal = roundMoney(numberValue($('#first-platform')) + numberValue($('#first-wechat')));
  const secondSubtotal = roundMoney(numberValue($('#second-platform')) + numberValue($('#second-wechat')));
  const total = roundMoney(firstSubtotal + secondSubtotal + numberValue($('#adjustment')));
  $('#first-subtotal').textContent = formatMoney(firstSubtotal);
  $('#second-subtotal').textContent = formatMoney(secondSubtotal);
  $('#income-preview').textContent = formatMoney(total);
}

function stateLabel(state, isSunday = false) {
  if (isSunday) return '休息';
  return { none: '', caicai: '菜', xiaofan: '凡', both: '两人' }[state];
}

function renderMonthCalendar(value) {
  const { year, monthIndex, daysInMonth } = getMonthDetails(value);
  const businessDays = getAvailableBusinessDays(value);
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const days = [];
  for (let index = 0; index < offset; index += 1) days.push('<div class="calendar-day empty"></div>');

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const key = `${value}-${String(day).padStart(2, '0')}`;
    const state = selectedDates[key] || 'none';
    const sunday = date.getDay() === 0;
    const extraRest = Boolean(restDates[key]);
    const unavailable = sunday || (extraRest && !restMode);
    const classes = ['calendar-day', sunday || extraRest ? 'sunday' : '', extraRest ? 'extra-rest' : '', state !== 'none' ? `selected-${state}` : ''].filter(Boolean).join(' ');
    const label = sunday ? '周日休息' : extraRest ? '额外休息' : stateLabel(state);
    days.push(`<button type="button" class="${classes}" ${unavailable ? 'disabled' : ''} data-date="${key}" aria-label="${monthIndex + 1}月${day}日 ${label}"><b>${day}</b><small>${label}</small></button>`);
  }

  return `<article class="calendar-card"><div class="calendar-title"><strong>${monthLabel(value)}</strong><span>${businessDays} 个可营业日</span></div><div class="weekdays"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="calendar-grid">${days.join('')}</div></article>`;
}

function renderCalendars() {
  const { first, second } = currentPeriod();
  $('#calendar-pair').innerHTML = renderMonthCalendar(first) + renderMonthCalendar(second);
  updateDateCounts();
}

function cycleDateState(key) {
  const states = ['none', 'caicai', 'xiaofan', 'both'];
  const next = states[(states.indexOf(selectedDates[key] || 'none') + 1) % states.length];
  if (next === 'none') delete selectedDates[key]; else selectedDates[key] = next;
  renderCalendars();
}

function toggleRestDay(key) {
  delete selectedDates[key];
  if (restDates[key]) delete restDates[key]; else restDates[key] = true;
  updatePeriodUI();
  renderCalendars();
}

function updateRestModeUI() {
  const button = $('#toggle-rest-mode');
  button.classList.toggle('active', restMode);
  button.textContent = restMode ? '完成休息日设置' : '设置额外休息日';
  $('#calendar-instruction').textContent = restMode ? '点击日期设置或取消休息日' : '点击日期记录营业人';
  $('#calendar-instruction-note').textContent = restMode ? '法定节假日、临时休息日都可以在这里标记。' : '每次点击依次切换：菜菜 → 小凡 → 两人 → 未选择';
}

function getDateCounts() {
  return Object.values(selectedDates).reduce((counts, state) => {
    if (state === 'caicai' || state === 'both') counts.caicai += 1;
    if (state === 'xiaofan' || state === 'both') counts.xiaofan += 1;
    return counts;
  }, { caicai: 0, xiaofan: 0 });
}

function updateDateCounts() {
  const counts = getDateCounts();
  $('#caicai-date-count').textContent = counts.caicai;
  $('#xiaofan-date-count').textContent = counts.xiaofan;
}

function setMode(mode) {
  attendanceMode = mode;
  $$('.mode-button').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  $('#days-mode').classList.toggle('active', mode === 'days');
  $('#dates-mode').classList.toggle('active', mode === 'dates');
}

function switchView(viewName) {
  $$('.view').forEach(view => view.classList.toggle('active', view.id === `view-${viewName}`));
  $$('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === viewName));
  $('#page-greeting').innerHTML = viewName === 'history'
    ? '看看以前每一期是怎么分配的 <span>☀</span>'
    : '嗨，来完成这期双月结算吧 <span>☀</span>';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(title, message) {
  $('strong', toast).textContent = title;
  $('p', toast).textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function validate(total, counts) {
  if (total <= 0) return '请填写大于 0 元的双月可分配收益。';
  if (counts.caicai + counts.xiaofan <= 0) return '请至少填写一人的营业天数。';
  if (!readAllocation()) return '公共池和出勤池比例合计必须为 100%。';
  if (attendanceMode === 'days') {
    const { first, second } = currentPeriod();
    const maximum = getAvailableBusinessDays(first) + getAvailableBusinessDays(second);
    if (!Number.isInteger(counts.caicai) || !Number.isInteger(counts.xiaofan)) return '营业天数需要填写整数。';
    if (counts.caicai < 0 || counts.xiaofan < 0) return '营业天数不能小于 0。';
    if (counts.caicai > maximum || counts.xiaofan > maximum) return `本期每人最多有 ${maximum} 个可营业日，请检查天数。`;
    if (counts.caicai + counts.xiaofan !== maximum) return `两人的营业天数合计需要等于本期 ${maximum} 个可营业日。`;
  }
  return '';
}

function calculateSettlement(event) {
  event.preventDefault();
  const total = roundMoney(incomeInputs.reduce((sum, input) => sum + numberValue(input), 0));
  const counts = attendanceMode === 'dates' ? getDateCounts() : { caicai: numberValue(caicaiDaysInput), xiaofan: numberValue(xiaofanDaysInput) };
  const message = validate(total, counts);
  if (message) { showToast('还差一点', message); return; }

  const totalDays = counts.caicai + counts.xiaofan;
  const equalRate = allocation.equal / 100;
  const workRate = allocation.work / 100;
  const equalShare = roundMoney(total * equalRate / 2);
  const caicaiTotal = roundMoney(total * (equalRate / 2 + workRate * counts.caicai / totalDays));
  const xiaofanTotal = roundMoney(total - caicaiTotal);
  const caicaiWork = roundMoney(caicaiTotal - equalShare);
  const xiaofanWork = roundMoney(xiaofanTotal - equalShare);
  const { first, second, key } = currentPeriod();
  const result = {
    id: Date.now(), periodKey: key, first, second, total,
    equalShare, equalPool: roundMoney(equalShare * 2), workPool: roundMoney(caicaiWork + xiaofanWork),
    caicaiDays: counts.caicai, xiaofanDays: counts.xiaofan,
    equalRate: allocation.equal, workRate: allocation.work,
    caicaiWork, xiaofanWork, caicaiTotal, xiaofanTotal,
  };
  displayResult(result);
  saveHistory(result);
  switchView('settlement');
  showToast('结算完成', '本期结果已计算并保存在这台设备上。');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayResult(result) {
  $('#result-period').textContent = `${monthLabel(result.first)} — ${monthLabel(result.second)} 结算结果`;
  $('#caicai-total').textContent = formatMoney(result.caicaiTotal);
  $('#xiaofan-total').textContent = formatMoney(result.xiaofanTotal);
  $('#caicai-equal').textContent = formatMoney(result.equalShare);
  $('#xiaofan-equal').textContent = formatMoney(result.equalShare);
  $('#caicai-work').textContent = formatMoney(result.caicaiWork);
  $('#xiaofan-work').textContent = formatMoney(result.xiaofanWork);
  $('#caicai-result-days').textContent = `${result.caicaiDays} 天`;
  $('#xiaofan-result-days').textContent = `${result.xiaofanDays} 天`;
  $('#summary-total').textContent = formatMoney(result.total);
  $('#summary-equal-pool').textContent = formatMoney(result.equalPool);
  $('#summary-work-pool').textContent = formatMoney(result.workPool);
  $('#summary-equal-label').textContent = `${result.equalRate}% 公共池`;
  $('#summary-work-label').textContent = `${result.workRate}% 出勤池`;
  $('#formula-note').textContent = `每人收益 = 双月总收益 × ${result.equalRate}% ÷ 2 ＋ 双月总收益 × ${result.workRate}% × 个人营业天数 ÷ 两人营业总天数`;
  const days = result.caicaiDays + result.xiaofanDays;
  $('#summary-ratio').textContent = `菜菜 ${(result.caicaiDays / days * 100).toFixed(1)}% · 小凡 ${(result.xiaofanDays / days * 100).toFixed(1)}%`;
  resultSection.hidden = false;
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('kuaTuanBimonthlyHistory')) || []; } catch { return []; }
}

function saveHistory(result) {
  const history = getHistory().filter(item => item.periodKey !== result.periodKey);
  history.unshift(result);
  localStorage.setItem('kuaTuanBimonthlyHistory', JSON.stringify(history.slice(0, 12)));
  renderHistory();
}

function renderYearSummary(history) {
  const selectedYear = historyYearSelect.value;
  const years = [...new Set(history.map(item => Number(String(item.first).slice(0, 4))).filter(Boolean))].sort((a, b) => b - a);
  const fallbackYear = new Date().getFullYear();
  const availableYears = years.length ? years : [fallbackYear];
  historyYearSelect.innerHTML = availableYears.map(year => `<option value="${year}">${year} 年</option>`).join('');
  historyYearSelect.value = availableYears.includes(Number(selectedYear)) ? selectedYear : String(availableYears[0]);

  const year = Number(historyYearSelect.value);
  const yearlyHistory = history.filter(item => Number(String(item.first).slice(0, 4)) === year);
  const totals = yearlyHistory.reduce((summary, item) => ({
    total: summary.total + Number(item.total || 0),
    caicai: summary.caicai + Number(item.caicaiTotal || 0),
    xiaofan: summary.xiaofan + Number(item.xiaofanTotal || 0),
    equalPool: summary.equalPool + Number(item.equalPool || 0),
    workPool: summary.workPool + Number(item.workPool || 0),
    caicaiDays: summary.caicaiDays + Number(item.caicaiDays || 0),
    xiaofanDays: summary.xiaofanDays + Number(item.xiaofanDays || 0),
  }), { total: 0, caicai: 0, xiaofan: 0, equalPool: 0, workPool: 0, caicaiDays: 0, xiaofanDays: 0 });

  $('#year-total').textContent = formatMoney(totals.total);
  $('#year-caicai').textContent = formatMoney(totals.caicai);
  $('#year-xiaofan').textContent = formatMoney(totals.xiaofan);
  $('#year-equal-pool').textContent = formatMoney(totals.equalPool);
  $('#year-work-pool').textContent = formatMoney(totals.workPool);
  $('#year-periods').textContent = `已结算 ${yearlyHistory.length} 期`;
  $('#year-caicai-days').textContent = `营业 ${totals.caicaiDays} 天`;
  $('#year-xiaofan-days').textContent = `营业 ${totals.xiaofanDays} 天`;
}

function renderHistory() {
  const history = getHistory();
  renderYearSummary(history);
  if (!history.length) {
    historyList.innerHTML = '<p class="empty-history">完成第一次双月结算后，记录会出现在这里。</p>';
    return;
  }
  historyList.innerHTML = history.map(item => `<article class="history-item"><div><strong>${monthLabel(item.first)} — ${monthLabel(item.second)}</strong><small>总收益 ${formatMoney(item.total)} · 菜菜 ${item.caicaiDays} 天 / 小凡 ${item.xiaofanDays} 天</small></div><div class="history-amount"><span>菜菜</span><b>${formatMoney(item.caicaiTotal)}</b></div><div class="history-amount"><span>小凡</span><b>${formatMoney(item.xiaofanTotal)}</b></div><button type="button" class="delete-history" data-history-id="${item.id}" aria-label="删除记录">×</button></article>`).join('');
}

function resetForm() {
  incomeInputs.forEach(input => { input.value = ''; });
  caicaiDaysInput.value = 0;
  xiaofanDaysInput.value = 0;
  selectedDates = {};
  restDates = {};
  restMode = false;
  updateRestModeUI();
  setMode('days');
  updateIncomePreview();
  renderCalendars();
  resultSection.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatToday() {
  const now = new Date();
  const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  $('#today-text').textContent = `${now.getMonth() + 1}月${now.getDate()}日 · ${weekdays[now.getDay()]}`;
}

incomeInputs.forEach(input => input.addEventListener('input', updateIncomePreview));
startMonthInput.addEventListener('change', () => { selectedDates = {}; restDates = {}; restMode = false; updateRestModeUI(); updatePeriodUI(); renderCalendars(); });
caicaiDaysInput.addEventListener('input', () => syncPartnerDays(caicaiDaysInput, xiaofanDaysInput));
xiaofanDaysInput.addEventListener('input', () => syncPartnerDays(xiaofanDaysInput, caicaiDaysInput));
$('#period-jump').addEventListener('click', () => { startMonthInput.focus(); if (typeof startMonthInput.showPicker === 'function') startMonthInput.showPicker(); else startMonthInput.click(); });
equalRateInput.addEventListener('change', () => { readAllocation(); });
workRateInput.addEventListener('change', () => { readAllocation(); });
$$('.mode-button').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
$$('[data-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
$('#calendar-pair').addEventListener('click', event => { const button = event.target.closest('[data-date]'); if (button && !button.disabled) { if (restMode) toggleRestDay(button.dataset.date); else cycleDateState(button.dataset.date); } });
$('#toggle-rest-mode').addEventListener('click', () => { restMode = !restMode; updateRestModeUI(); renderCalendars(); });
$('#clear-dates').addEventListener('click', () => { selectedDates = {}; restDates = {}; updatePeriodUI(); renderCalendars(); });
$('#reset-button').addEventListener('click', resetForm);
$('#print-button').addEventListener('click', () => window.print());
$('#clear-history').addEventListener('click', () => { if (getHistory().length && confirm('确定清空全部双月结算记录吗？')) { localStorage.removeItem('kuaTuanBimonthlyHistory'); renderHistory(); } });
historyYearSelect.addEventListener('change', () => renderYearSummary(getHistory()));
historyList.addEventListener('click', event => { const button = event.target.closest('[data-history-id]'); if (!button) return; const next = getHistory().filter(item => String(item.id) !== button.dataset.historyId); localStorage.setItem('kuaTuanBimonthlyHistory', JSON.stringify(next)); renderHistory(); });
form.addEventListener('submit', calculateSettlement);

startMonthInput.value = defaultStartMonth();
updateAllocationUI();
formatToday();
updatePeriodUI();
updateIncomePreview();
renderCalendars();
updateRestModeUI();
renderHistory();
