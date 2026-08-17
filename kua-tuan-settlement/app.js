const form = document.querySelector('#settlement-form');
const monthInput = document.querySelector('#settlement-month');
const platformInput = document.querySelector('#platform-income');
const wechatInput = document.querySelector('#wechat-income');
const adjustmentInput = document.querySelector('#adjustment');
const caicaiDaysInput = document.querySelector('#caicai-days');
const xiaofanDaysInput = document.querySelector('#xiaofan-days');
const incomePreview = document.querySelector('#income-preview');
const resultSection = document.querySelector('#result-section');
const calendar = document.querySelector('#calendar');
const historyList = document.querySelector('#history-list');
const toast = document.querySelector('#toast');

let attendanceMode = 'days';
let selectedDates = {};

const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
});

function numberValue(input) {
  return Number.parseFloat(input.value) || 0;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value) {
  return money.format(value).replace('CN¥', '¥');
}

function defaultMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthDetails(monthValue) {
  const [year, month] = monthValue.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let businessDays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (new Date(year, month - 1, day).getDay() !== 0) businessDays += 1;
  }

  return { year, month, daysInMonth, businessDays };
}

function updateIncomePreview() {
  const total = numberValue(platformInput) + numberValue(wechatInput) + numberValue(adjustmentInput);
  incomePreview.textContent = formatMoney(total);
}

function updateBusinessDayHint() {
  if (!monthInput.value) return;
  const { businessDays } = getMonthDetails(monthInput.value);
  document.querySelector('#business-day-hint').textContent = `该月除去周日后，共有 ${businessDays} 个可营业日。`;
  caicaiDaysInput.max = businessDays;
  xiaofanDaysInput.max = businessDays;
}

function renderCalendar() {
  if (!monthInput.value) return;
  const { year, month, daysInMonth } = getMonthDetails(monthInput.value);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const mondayFirstOffset = firstDay === 0 ? 6 : firstDay - 1;
  calendar.innerHTML = '';

  for (let index = 0; index < mondayFirstOffset; index += 1) {
    const blank = document.createElement('div');
    blank.className = 'calendar-day empty';
    calendar.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const dateKey = `${monthInput.value}-${String(day).padStart(2, '0')}`;
    const button = document.createElement('button');
    const state = selectedDates[dateKey] || 'none';
    const isSunday = date.getDay() === 0;

    button.type = 'button';
    button.className = `calendar-day${isSunday ? ' sunday' : ''}${state !== 'none' ? ` selected-${state}` : ''}`;
    button.disabled = isSunday;
    button.dataset.date = dateKey;
    button.innerHTML = `<span class="day-number">${day}</span><span class="day-state">${stateLabel(state, isSunday)}</span>`;
    button.setAttribute('aria-label', `${month}月${day}日，${stateLabel(state, isSunday)}`);
    calendar.appendChild(button);
  }

  updateDateCounts();
}

function stateLabel(state, isSunday = false) {
  if (isSunday) return '休息';
  return { none: '', caicai: '菜菜', xiaofan: '小凡', both: '两人' }[state];
}

function cycleDateState(dateKey) {
  const states = ['none', 'caicai', 'xiaofan', 'both'];
  const currentIndex = states.indexOf(selectedDates[dateKey] || 'none');
  const nextState = states[(currentIndex + 1) % states.length];

  if (nextState === 'none') delete selectedDates[dateKey];
  else selectedDates[dateKey] = nextState;
  renderCalendar();
}

function getDateCounts() {
  return Object.values(selectedDates).reduce(
    (counts, state) => {
      if (state === 'caicai' || state === 'both') counts.caicai += 1;
      if (state === 'xiaofan' || state === 'both') counts.xiaofan += 1;
      return counts;
    },
    { caicai: 0, xiaofan: 0 },
  );
}

function updateDateCounts() {
  const counts = getDateCounts();
  document.querySelector('#caicai-date-count').textContent = counts.caicai;
  document.querySelector('#xiaofan-date-count').textContent = counts.xiaofan;
}

function setMode(mode) {
  attendanceMode = mode;
  document.querySelectorAll('.mode-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  document.querySelector('#days-mode').classList.toggle('active', mode === 'days');
  document.querySelector('#dates-mode').classList.toggle('active', mode === 'dates');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function validateInputs(total, caicaiDays, xiaofanDays) {
  if (total <= 0) return '请填写大于 0 元的可分配收益。';
  if (caicaiDays + xiaofanDays <= 0) return '请至少填写一人的营业天数。';

  if (attendanceMode === 'days') {
    const { businessDays } = getMonthDetails(monthInput.value);
    if (!Number.isInteger(caicaiDays) || !Number.isInteger(xiaofanDays)) return '营业天数需要填写整数。';
    if (caicaiDays < 0 || xiaofanDays < 0) return '营业天数不能小于 0。';
    if (caicaiDays > businessDays || xiaofanDays > businessDays) {
      return `该月除去周日后最多有 ${businessDays} 个营业日，请检查天数。`;
    }
  }
  return '';
}

function calculateSettlement(event) {
  event.preventDefault();
  const total = roundMoney(numberValue(platformInput) + numberValue(wechatInput) + numberValue(adjustmentInput));
  const counts = attendanceMode === 'dates'
    ? getDateCounts()
    : { caicai: numberValue(caicaiDaysInput), xiaofan: numberValue(xiaofanDaysInput) };
  const validationMessage = validateInputs(total, counts.caicai, counts.xiaofan);

  if (validationMessage) {
    showToast(validationMessage);
    return;
  }

  const totalDays = counts.caicai + counts.xiaofan;
  const equalShare = roundMoney(total * 0.3);
  const caicaiRatio = counts.caicai / totalDays;
  const caicaiTotal = roundMoney(total * (0.3 + 0.4 * caicaiRatio));
  const xiaofanTotal = roundMoney(total - caicaiTotal);
  const caicaiWork = roundMoney(caicaiTotal - equalShare);
  const xiaofanWork = roundMoney(xiaofanTotal - equalShare);
  const equalPool = roundMoney(equalShare * 2);
  const workPool = roundMoney(caicaiWork + xiaofanWork);

  const result = {
    id: Date.now(),
    month: monthInput.value,
    total,
    equalPool,
    workPool,
    equalShare,
    caicaiDays: counts.caicai,
    xiaofanDays: counts.xiaofan,
    caicaiWork,
    xiaofanWork,
    caicaiTotal,
    xiaofanTotal,
    mode: attendanceMode,
  };

  displayResult(result);
  saveHistory(result);
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayResult(result) {
  const [year, month] = result.month.split('-');
  document.querySelector('#result-month').textContent = `${year} 年 ${Number(month)} 月`;
  document.querySelector('#caicai-total').textContent = formatMoney(result.caicaiTotal);
  document.querySelector('#xiaofan-total').textContent = formatMoney(result.xiaofanTotal);
  document.querySelector('#caicai-equal').textContent = formatMoney(result.equalShare);
  document.querySelector('#xiaofan-equal').textContent = formatMoney(result.equalShare);
  document.querySelector('#caicai-work').textContent = formatMoney(result.caicaiWork);
  document.querySelector('#xiaofan-work').textContent = formatMoney(result.xiaofanWork);
  document.querySelector('#caicai-result-days').textContent = `${result.caicaiDays} 天`;
  document.querySelector('#xiaofan-result-days').textContent = `${result.xiaofanDays} 天`;
  document.querySelector('#summary-total').textContent = formatMoney(result.total);
  document.querySelector('#summary-equal-pool').textContent = formatMoney(result.equalPool);
  document.querySelector('#summary-work-pool').textContent = formatMoney(result.workPool);
  document.querySelector('#summary-ratio').textContent = `菜菜 ${(result.caicaiDays / (result.caicaiDays + result.xiaofanDays) * 100).toFixed(1)}% · 小凡 ${(result.xiaofanDays / (result.caicaiDays + result.xiaofanDays) * 100).toFixed(1)}%`;
  resultSection.hidden = false;
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('kuaTuanSettlementHistory')) || [];
  } catch {
    return [];
  }
}

function saveHistory(result) {
  const history = getHistory().filter((item) => item.month !== result.month);
  history.unshift(result);
  localStorage.setItem('kuaTuanSettlementHistory', JSON.stringify(history.slice(0, 24)));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  if (!history.length) {
    historyList.innerHTML = '<p class="empty-history">还没有结算记录，完成第一次结算后会自动保存在这台设备上。</p>';
    return;
  }

  historyList.innerHTML = history.map((item) => {
    const [year, month] = item.month.split('-');
    return `
      <article class="history-item">
        <div><strong>${year} 年 ${Number(month)} 月</strong><small>总收益 ${formatMoney(item.total)} · 菜菜 ${item.caicaiDays} 天 / 小凡 ${item.xiaofanDays} 天</small></div>
        <div class="history-amount"><span>菜菜</span><b>${formatMoney(item.caicaiTotal)}</b></div>
        <div class="history-amount"><span>小凡</span><b>${formatMoney(item.xiaofanTotal)}</b></div>
        <button class="delete-history" type="button" data-history-id="${item.id}" aria-label="删除这条记录">×</button>
      </article>`;
  }).join('');
}

function resetForm() {
  platformInput.value = '';
  wechatInput.value = '';
  adjustmentInput.value = '';
  caicaiDaysInput.value = '0';
  xiaofanDaysInput.value = '0';
  selectedDates = {};
  setMode('days');
  updateIncomePreview();
  renderCalendar();
  resultSection.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

[platformInput, wechatInput, adjustmentInput].forEach((input) => input.addEventListener('input', updateIncomePreview));

document.querySelectorAll('.mode-button').forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

monthInput.addEventListener('change', () => {
  selectedDates = {};
  updateBusinessDayHint();
  renderCalendar();
});

calendar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-date]');
  if (button && !button.disabled) cycleDateState(button.dataset.date);
});

document.querySelector('#clear-dates').addEventListener('click', () => {
  selectedDates = {};
  renderCalendar();
});

document.querySelector('#reset-button').addEventListener('click', resetForm);
document.querySelector('#print-button').addEventListener('click', () => window.print());
document.querySelector('#clear-history').addEventListener('click', () => {
  if (getHistory().length && window.confirm('确定清空全部历史结算记录吗？')) {
    localStorage.removeItem('kuaTuanSettlementHistory');
    renderHistory();
  }
});

historyList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-history-id]');
  if (!button) return;
  const history = getHistory().filter((item) => String(item.id) !== button.dataset.historyId);
  localStorage.setItem('kuaTuanSettlementHistory', JSON.stringify(history));
  renderHistory();
});

form.addEventListener('submit', calculateSettlement);

monthInput.value = defaultMonth();
updateIncomePreview();
updateBusinessDayHint();
renderCalendar();
renderHistory();
