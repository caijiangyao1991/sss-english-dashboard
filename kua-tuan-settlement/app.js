const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const form = $('#settlement-form');
const startMonthInput = $('#start-month');
const incomeInputs = ['#first-platform', '#first-wechat', '#second-platform', '#second-wechat', '#adjustment'].map($);
const caicaiDaysInput = $('#caicai-days');
const xiaofanDaysInput = $('#xiaofan-days');
const resultSection = $('#result-section');
const historyList = $('#history-list');
const toast = $('#toast');

let attendanceMode = 'days';
let selectedDates = {};

const money = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 });

function numberValue(input) { return Number.parseFloat(input.value) || 0; }
function roundMoney(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
function formatMoney(value) { return money.format(value).replace('CN¥', '¥'); }
function monthKey(year, monthIndex) { return `${year}-${String(monthIndex + 1).padStart(2, '0')}`; }

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
  const totalAvailable = getMonthDetails(first).businessDays + getMonthDetails(second).businessDays;
  $('#available-days').textContent = totalAvailable;
  caicaiDaysInput.max = totalAvailable;
  xiaofanDaysInput.max = totalAvailable;
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
  const { year, monthIndex, daysInMonth, businessDays } = getMonthDetails(value);
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const days = [];
  for (let index = 0; index < offset; index += 1) days.push('<div class="calendar-day empty"></div>');

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const key = `${value}-${String(day).padStart(2, '0')}`;
    const state = selectedDates[key] || 'none';
    const sunday = date.getDay() === 0;
    const classes = ['calendar-day', sunday ? 'sunday' : '', state !== 'none' ? `selected-${state}` : ''].filter(Boolean).join(' ');
    days.push(`<button type="button" class="${classes}" ${sunday ? 'disabled' : ''} data-date="${key}" aria-label="${monthIndex + 1}月${day}日 ${stateLabel(state, sunday)}"><b>${day}</b><small>${stateLabel(state, sunday)}</small></button>`);
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
  if (attendanceMode === 'days') {
    const { first, second } = currentPeriod();
    const maximum = getMonthDetails(first).businessDays + getMonthDetails(second).businessDays;
    if (!Number.isInteger(counts.caicai) || !Number.isInteger(counts.xiaofan)) return '营业天数需要填写整数。';
    if (counts.caicai < 0 || counts.xiaofan < 0) return '营业天数不能小于 0。';
    if (counts.caicai > maximum || counts.xiaofan > maximum) return `本期每人最多有 ${maximum} 个可营业日，请检查天数。`;
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
  const equalShare = roundMoney(total * .3);
  const caicaiTotal = roundMoney(total * (.3 + .4 * counts.caicai / totalDays));
  const xiaofanTotal = roundMoney(total - caicaiTotal);
  const caicaiWork = roundMoney(caicaiTotal - equalShare);
  const xiaofanWork = roundMoney(xiaofanTotal - equalShare);
  const { first, second, key } = currentPeriod();
  const result = {
    id: Date.now(), periodKey: key, first, second, total,
    equalShare, equalPool: roundMoney(equalShare * 2), workPool: roundMoney(caicaiWork + xiaofanWork),
    caicaiDays: counts.caicai, xiaofanDays: counts.xiaofan,
    caicaiWork, xiaofanWork, caicaiTotal, xiaofanTotal,
  };
  displayResult(result);
  saveHistory(result);
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

function renderHistory() {
  const history = getHistory();
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
startMonthInput.addEventListener('change', () => { selectedDates = {}; updatePeriodUI(); renderCalendars(); });
$$('.mode-button').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
$('#calendar-pair').addEventListener('click', event => { const button = event.target.closest('[data-date]'); if (button && !button.disabled) cycleDateState(button.dataset.date); });
$('#clear-dates').addEventListener('click', () => { selectedDates = {}; renderCalendars(); });
$('#reset-button').addEventListener('click', resetForm);
$('#print-button').addEventListener('click', () => window.print());
$('#clear-history').addEventListener('click', () => { if (getHistory().length && confirm('确定清空全部双月结算记录吗？')) { localStorage.removeItem('kuaTuanBimonthlyHistory'); renderHistory(); } });
historyList.addEventListener('click', event => { const button = event.target.closest('[data-history-id]'); if (!button) return; const next = getHistory().filter(item => String(item.id) !== button.dataset.historyId); localStorage.setItem('kuaTuanBimonthlyHistory', JSON.stringify(next)); renderHistory(); });
form.addEventListener('submit', calculateSettlement);

startMonthInput.value = defaultStartMonth();
formatToday();
updatePeriodUI();
updateIncomePreview();
renderCalendars();
renderHistory();
