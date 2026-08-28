const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const form = $('#settlement-form');
const startMonthInput = $('#start-month');
const incomeInputs = ['#first-platform', '#first-wechat', '#adjustment'].map(selector => $(selector));
const caicaiDaysInput = $('#caicai-days');
const xiaofanDaysInput = $('#xiaofan-days');
const equalRateInput = $('#equal-rate');
const workRateInput = $('#work-rate');
const resultSection = $('#result-section');
const historyList = $('#history-list');
const historyYearSelect = $('#history-year');
const toast = $('#toast');
const dstPurchaseForm = $('#dst-purchase-form');
const dstSaleForm = $('#dst-sale-form');

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
  const month = startMonthInput.value;
  return { month, key: month };
}

function updatePeriodUI() {
  if (!startMonthInput.value) return;
  const { month } = currentPeriod();
  $('#first-month-title').textContent = monthLabel(month);
  $('#top-period').textContent = monthLabel(month);
  const totalAvailable = getAvailableBusinessDays(month);
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
  const total = roundMoney(firstSubtotal + numberValue($('#adjustment')));
  $('#first-subtotal').textContent = formatMoney(firstSubtotal);
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
  const { month } = currentPeriod();
  $('#calendar-pair').innerHTML = renderMonthCalendar(month);
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
  const greetings = {
    history: '看看以前每一期是怎么分配的 <span>☀</span>',
    dushutong: '读书瞳的库存和利润，也要清清楚楚 <span>☀</span>',
    settlement: '嗨，来完成本月结算吧 <span>☀</span>',
  };
  $('#page-greeting').innerHTML = greetings[viewName] || greetings.settlement;
  $('#period-jump').hidden = viewName === 'dushutong';
  if (viewName === 'dushutong') renderDushutong();
  if (viewName === 'history') renderHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(title, message) {
  $('strong', toast).textContent = title;
  $('p', toast).textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

const DUSHUTONG_PURCHASES_KEY = 'dushutongPurchases';
const DUSHUTONG_SALES_KEY = 'dushutongSales';
const DUSHUTONG_INITIAL_STOCK_KEY = 'dushutongInitialStockSeeded';

function getStoredList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveStoredList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedDushutongInitialStock() {
  if (localStorage.getItem(DUSHUTONG_INITIAL_STOCK_KEY)) return;
  const purchases = getStoredList(DUSHUTONG_PURCHASES_KEY);
  const sales = getStoredList(DUSHUTONG_SALES_KEY);
  if (!purchases.length && !sales.length) {
    saveStoredList(DUSHUTONG_PURCHASES_KEY, [{
      id: 'initial-stock-20260825',
      date: '2026-08-25',
      quantity: 50,
      unitCost: 98,
      freight: 57,
      totalCost: 4957,
      note: '现有首批库存',
    }]);
  }
  localStorage.setItem(DUSHUTONG_INITIAL_STOCK_KEY, '1');
}

function dushutongTotals() {
  const purchases = getStoredList(DUSHUTONG_PURCHASES_KEY);
  const sales = getStoredList(DUSHUTONG_SALES_KEY);
  const purchasedQuantity = purchases.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const purchaseCost = purchases.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
  const soldQuantity = sales.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const soldGoodsCost = sales.reduce((sum, item) => sum + Number(item.goodsCost || 0), 0);
  const stock = purchasedQuantity - soldQuantity;
  const inventoryValue = Math.max(0, roundMoney(purchaseCost - soldGoodsCost));
  const averageCost = stock > 0 ? roundMoney(inventoryValue / stock) : 0;
  return { purchases, sales, purchasedQuantity, purchaseCost, soldQuantity, soldGoodsCost, stock, inventoryValue, averageCost };
}

function calculateDushutongSale() {
  const totals = dushutongTotals();
  const quantity = Math.max(0, Math.floor(numberValue($('#dst-sale-quantity'))));
  const unitPrice = Math.max(0, numberValue($('#dst-sale-unit-price')));
  const freight = Math.max(0, numberValue($('#dst-sale-freight')));
  const seller = $('#dst-sale-seller').value === 'xiaofan' ? 'xiaofan' : 'caicai';
  const revenue = roundMoney(quantity * unitPrice);
  const goodsCost = roundMoney(quantity * totals.averageCost);
  const grossProfit = roundMoney(revenue - goodsCost);
  const profit = roundMoney(revenue - goodsCost - freight);
  const sellerCostShare = roundMoney(goodsCost / 2);
  const otherCostShare = roundMoney(goodsCost - sellerCostShare);
  const sellerReceivable = roundMoney(sellerCostShare + grossProfit * 0.6 - freight / 2);
  const otherReceivable = roundMoney(revenue - freight - sellerReceivable);
  const sellerProfit = roundMoney(sellerReceivable - sellerCostShare);
  const otherProfit = roundMoney(otherReceivable - otherCostShare);
  const caicaiReceivable = seller === 'caicai' ? sellerReceivable : otherReceivable;
  const xiaofanReceivable = seller === 'xiaofan' ? sellerReceivable : otherReceivable;
  const caicaiProfit = seller === 'caicai' ? sellerProfit : otherProfit;
  const xiaofanProfit = seller === 'xiaofan' ? sellerProfit : otherProfit;
  return {
    quantity, unitPrice, freight, revenue, goodsCost, unitCost: totals.averageCost, grossProfit, profit, seller,
    caicaiProfit, xiaofanProfit, caicaiReceivable, xiaofanReceivable,
    caicaiCostShare: seller === 'caicai' ? sellerCostShare : otherCostShare,
    xiaofanCostShare: seller === 'xiaofan' ? sellerCostShare : otherCostShare,
    stock: totals.stock,
  };
}

function updateDushutongPreview() {
  const sale = calculateDushutongSale();
  $('#dst-preview-revenue').textContent = formatMoney(sale.revenue);
  $('#dst-preview-cost').textContent = formatMoney(sale.goodsCost);
  $('#dst-preview-profit').textContent = formatMoney(sale.profit);
  $('#dst-preview-profit').classList.toggle('dst-profit-warning', sale.profit < 0);
  $('#dst-preview-caicai').textContent = formatMoney(sale.caicaiReceivable);
  $('#dst-preview-xiaofan').textContent = formatMoney(sale.xiaofanReceivable);
  $('#dst-preview-caicai-detail').textContent = `${sale.seller === 'caicai' ? '卖货人 60%' : '另一人 40%'} · 成本返还 ${formatMoney(sale.caicaiCostShare)} · 分得利润 ${formatMoney(sale.caicaiProfit)}`;
  $('#dst-preview-xiaofan-detail').textContent = `${sale.seller === 'xiaofan' ? '卖货人 60%' : '另一人 40%'} · 成本返还 ${formatMoney(sale.xiaofanCostShare)} · 分得利润 ${formatMoney(sale.xiaofanProfit)}`;
}

function formatDushutongDate(value) {
  if (!value) return '未填写日期';
  const [year, month, day] = value.split('-');
  return `${year}.${month}.${day}`;
}

function safeText(value) {
  return String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function ownerName(value) {
  return value === 'xiaofan' ? '小凡' : '菜菜';
}

function renderDushutong() {
  const totals = dushutongTotals();
  const revenue = totals.sales.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const profit = totals.sales.reduce((sum, item) => sum + Number(item.profit || 0), 0);
  const caicaiProfit = totals.sales.reduce((sum, item) => sum + Number(item.caicaiProfit || 0), 0);
  const xiaofanProfit = totals.sales.reduce((sum, item) => sum + Number(item.xiaofanProfit || 0), 0);
  $('#dst-hero-stock').textContent = `${totals.stock} 台`;
  $('#dst-stock-count').textContent = `${totals.stock} 台`;
  $('#dst-stock-flow').textContent = `累计进货 ${totals.purchasedQuantity} · 已售 ${totals.soldQuantity}`;
  $('#dst-average-cost').textContent = formatMoney(totals.averageCost);
  $('#dst-stock-value').textContent = `库存货值 ${formatMoney(totals.inventoryValue)}`;
  $('#dst-revenue-total').textContent = formatMoney(revenue);
  $('#dst-sales-count').textContent = `共 ${totals.sales.length} 笔销售`;
  $('#dst-profit-total').textContent = formatMoney(profit);
  $('#dst-caicai-profit').textContent = formatMoney(caicaiProfit);
  $('#dst-xiaofan-profit').textContent = formatMoney(xiaofanProfit);
  $('#dst-sale-quantity').max = Math.max(0, totals.stock);

  const salesList = $('#dst-sales-list');
  salesList.innerHTML = totals.sales.length ? totals.sales.map(item => `<tr>
    <td><strong>${formatDushutongDate(item.date)}</strong><small>${safeText(item.note) || '无备注'}</small></td>
    <td><strong>${ownerName(item.seller)}</strong><small>利润 60%</small></td><td>${item.quantity} 台</td><td>${formatMoney(item.revenue)}</td><td>${formatMoney(item.goodsCost)}<small>双方各承担一半</small></td>
    <td>${formatMoney(item.freight)}<small>双方各 ${formatMoney(Number(item.freight || 0) / 2)}</small></td><td class="${Number(item.profit) < 0 ? 'negative' : 'positive'}">${formatMoney(item.profit)}</td>
    <td>${formatMoney(item.caicaiProfit)}<small>${item.seller === 'caicai' ? '卖货 60%' : '合作 40%'}</small></td><td>${formatMoney(item.xiaofanProfit)}<small>${item.seller === 'xiaofan' ? '卖货 60%' : '合作 40%'}</small></td>
    <td class="allocation-cell">菜菜 ${formatMoney(item.caicaiReceivable)}<br>小凡 ${formatMoney(item.xiaofanReceivable)}<small>均含本人一半成本返还</small></td>
    <td><button class="dst-delete" type="button" data-dst-sale-id="${item.id}" aria-label="删除销售记录">×</button></td>
  </tr>`).join('') : '<tr><td class="dst-empty" colspan="11">还没有销售记录，卖出第一台后会显示在这里。</td></tr>';

  const purchasesList = $('#dst-purchases-list');
  purchasesList.innerHTML = totals.purchases.length ? totals.purchases.map(item => `<tr>
    <td><strong>${formatDushutongDate(item.date)}</strong><small>${safeText(item.note) || '无备注'}</small></td><td>${item.quantity} 台</td>
    <td>${formatMoney(item.unitCost)}</td><td>${formatMoney(item.freight)}</td><td>${formatMoney(item.totalCost)}</td>
    <td><button class="dst-delete" type="button" data-dst-purchase-id="${item.id}" aria-label="删除进货记录">×</button></td>
  </tr>`).join('') : '<tr><td class="dst-empty" colspan="6">还没有进货记录，请先录入库存。</td></tr>';
  updateDushutongPreview();
}

function addDushutongPurchase(event) {
  event.preventDefault();
  const quantity = Math.floor(numberValue($('#dst-purchase-quantity')));
  const unitCost = numberValue($('#dst-purchase-unit-cost'));
  const freight = numberValue($('#dst-purchase-freight'));
  if (quantity <= 0 || unitCost < 0 || freight < 0) return showToast('无法保存', '请填写正确的进货数量和金额。');
  const purchases = getStoredList(DUSHUTONG_PURCHASES_KEY);
  purchases.unshift({
    id: Date.now(), date: $('#dst-purchase-date').value, quantity, unitCost: roundMoney(unitCost), freight: roundMoney(freight),
    totalCost: roundMoney(quantity * unitCost + freight), note: $('#dst-purchase-note').value.trim(),
  });
  saveStoredList(DUSHUTONG_PURCHASES_KEY, purchases);
  dstPurchaseForm.reset();
  $('#dst-purchase-date').value = localDateValue();
  $('#dst-purchase-freight').value = 0;
  renderDushutong();
  showToast('进货已保存', `库存增加 ${quantity} 台。`);
}

function addDushutongSale(event) {
  event.preventDefault();
  const sale = calculateDushutongSale();
  if (sale.quantity <= 0) return showToast('无法保存', '请填写正确的卖出数量。');
  if (sale.quantity > sale.stock) return showToast('库存不足', `当前只有 ${sale.stock} 台可售。`);
  if (sale.unitPrice <= 0) return showToast('无法保存', '请填写大于 0 元的每台售价。');
  const sales = getStoredList(DUSHUTONG_SALES_KEY);
  sales.unshift({ id: Date.now(), date: $('#dst-sale-date').value, note: $('#dst-sale-note').value.trim(), ...sale });
  saveStoredList(DUSHUTONG_SALES_KEY, sales);
  dstSaleForm.reset();
  $('#dst-sale-date').value = localDateValue();
  $('#dst-sale-quantity').value = 1;
  $('#dst-sale-unit-price').value = 198;
  $('#dst-sale-freight').value = 0;
  $('#dst-sale-seller').value = sale.seller;
  renderDushutong();
  renderHistory();
  showToast('销售已保存', `菜菜本次应收 ${formatMoney(sale.caicaiReceivable)}，小凡本次应收 ${formatMoney(sale.xiaofanReceivable)}。`);
}

function deleteDushutongSale(id) {
  if (!confirm('确定删除这笔销售记录吗？删除后库存会自动恢复。')) return;
  const sales = getStoredList(DUSHUTONG_SALES_KEY).filter(item => String(item.id) !== String(id));
  saveStoredList(DUSHUTONG_SALES_KEY, sales);
  renderDushutong();
  renderHistory();
}

function deleteDushutongPurchase(id) {
  if (!confirm('确定删除这笔进货记录吗？')) return;
  const current = dushutongTotals();
  const purchases = current.purchases.filter(item => String(item.id) !== String(id));
  const remainingQuantity = purchases.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const remainingCost = purchases.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
  if (remainingQuantity < current.soldQuantity || remainingCost + 0.01 < current.soldGoodsCost) {
    return showToast('不能删除', '这批进货已被现有销售记录占用，请先删除相关销售记录。');
  }
  saveStoredList(DUSHUTONG_PURCHASES_KEY, purchases);
  renderDushutong();
}

function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function validate(total, counts) {
  if (total <= 0) return '请填写大于 0 元的本月可分配收益。';
  if (counts.caicai + counts.xiaofan <= 0) return '请至少填写一人的营业天数。';
  if (!readAllocation()) return '公共池和出勤池比例合计必须为 100%。';
  if (attendanceMode === 'days') {
    const { month } = currentPeriod();
    const maximum = getAvailableBusinessDays(month);
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
  const { month, key } = currentPeriod();
  const result = {
    id: Date.now(), periodKey: key, month, total,
    equalShare, equalPool: roundMoney(equalShare * 2), workPool: roundMoney(caicaiWork + xiaofanWork),
    caicaiDays: counts.caicai, xiaofanDays: counts.xiaofan,
    equalRate: allocation.equal, workRate: allocation.work,
    caicaiWork, xiaofanWork, caicaiTotal, xiaofanTotal,
  };
  displayResult(result);
  if (!saveHistory(result)) return;
  switchView('settlement');
  showToast('结算完成', '本期结果已计算并保存在这台设备上。');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayResult(result) {
  $('#result-period').textContent = `${monthLabel(result.month)} 结算结果`;
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
  $('#formula-note').textContent = `每人收益 = 本月总收益 × ${result.equalRate}% ÷ 2 ＋ 本月总收益 × ${result.workRate}% × 个人营业天数 ÷ 两人营业总天数`;
  const days = result.caicaiDays + result.xiaofanDays;
  $('#summary-ratio').textContent = `菜菜 ${(result.caicaiDays / days * 100).toFixed(1)}% · 小凡 ${(result.xiaofanDays / days * 100).toFixed(1)}%`;
  resultSection.hidden = false;
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('kuaTuanMonthlyHistory')) || []; } catch { return []; }
}

function saveHistory(result) {
  const history = getHistory().filter(item => item.periodKey !== result.periodKey);
  history.unshift(result);
  try {
    localStorage.setItem('kuaTuanMonthlyHistory', JSON.stringify(history.slice(0, 24)));
  } catch {
    showToast('保存失败', '浏览器禁止或限制了本地存储，请关闭无痕模式后重试。');
    return false;
  }
  renderHistory();
  return true;
}

function exportHistory() {
  const history = getHistory();
  const purchases = getStoredList(DUSHUTONG_PURCHASES_KEY);
  const sales = getStoredList(DUSHUTONG_SALES_KEY);
  if (!history.length && !purchases.length && !sales.length) { showToast('暂无记录', '录入结算或进销存数据后才能导出备份。'); return; }
  const backup = { version: 2, exportedAt: new Date().toISOString(), history, purchases, sales, allocation };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `双人小账本备份-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('备份已导出', '请把 JSON 文件保存到安全位置。');
}

function importHistory(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = Array.isArray(parsed) ? parsed : parsed.history;
      if (!Array.isArray(imported) || imported.some(item => !item || !item.periodKey || !item.first || !item.second)) throw new Error('invalid backup');
      const merged = [...imported, ...getHistory()].reduce((items, item) => {
        if (!items.some(existing => existing.periodKey === item.periodKey)) items.push(item);
        return items;
      }, []).sort((left, right) => Number(right.id || 0) - Number(left.id || 0)).slice(0, 24);
      localStorage.setItem('kuaTuanMonthlyHistory', JSON.stringify(merged));
      if (Array.isArray(parsed.purchases)) saveStoredList(DUSHUTONG_PURCHASES_KEY, parsed.purchases);
      if (Array.isArray(parsed.sales)) saveStoredList(DUSHUTONG_SALES_KEY, parsed.sales);
      if (parsed.allocation && Number(parsed.allocation.equal) + Number(parsed.allocation.work) === 100) {
        allocation = parsed.allocation;
        localStorage.setItem('kuaTuanAllocation', JSON.stringify(allocation));
        updateAllocationUI();
      }
      renderHistory();
      renderDushutong();
      showToast('备份已导入', '快团结算与读书瞳进销存记录已恢复。');
    } catch {
      showToast('导入失败', '请选择本网站导出的 JSON 备份文件。');
    }
  };
  reader.readAsText(file);
}

function renderYearSummary(history) {
  const dushutongSales = getStoredList(DUSHUTONG_SALES_KEY);
  const selectedYear = historyYearSelect.value;
  const years = [...new Set([
    ...history.map(item => Number(String(item.month).slice(0, 4))),
    ...dushutongSales.map(item => Number(String(item.date).slice(0, 4))),
  ].filter(Boolean))].sort((a, b) => b - a);
  const fallbackYear = new Date().getFullYear();
  const availableYears = years.length ? years : [fallbackYear];
  historyYearSelect.innerHTML = availableYears.map(year => `<option value="${year}">${year} 年</option>`).join('');
  historyYearSelect.value = availableYears.includes(Number(selectedYear)) ? selectedYear : String(availableYears[0]);

  const year = Number(historyYearSelect.value);
  const yearlyHistory = history.filter(item => Number(String(item.month).slice(0, 4)) === year);
  const yearlyDushutongSales = dushutongSales.filter(item => Number(String(item.date).slice(0, 4)) === year);
  const totals = yearlyHistory.reduce((summary, item) => ({
    total: summary.total + Number(item.total || 0),
    caicai: summary.caicai + Number(item.caicaiTotal || 0),
    xiaofan: summary.xiaofan + Number(item.xiaofanTotal || 0),
    equalPool: summary.equalPool + Number(item.equalPool || 0),
    workPool: summary.workPool + Number(item.workPool || 0),
    caicaiDays: summary.caicaiDays + Number(item.caicaiDays || 0),
    xiaofanDays: summary.xiaofanDays + Number(item.xiaofanDays || 0),
  }), { total: 0, caicai: 0, xiaofan: 0, equalPool: 0, workPool: 0, caicaiDays: 0, xiaofanDays: 0 });
  const dushutongTotals = yearlyDushutongSales.reduce((summary, item) => ({
    total: summary.total + Number(item.profit || 0),
    caicai: summary.caicai + Number(item.caicaiProfit || 0),
    xiaofan: summary.xiaofan + Number(item.xiaofanProfit || 0),
  }), { total: 0, caicai: 0, xiaofan: 0 });

  $('#year-total').textContent = formatMoney(totals.total + dushutongTotals.total);
  $('#year-caicai').textContent = formatMoney(totals.caicai + dushutongTotals.caicai);
  $('#year-xiaofan').textContent = formatMoney(totals.xiaofan + dushutongTotals.xiaofan);
  $('#year-equal-pool').textContent = formatMoney(totals.equalPool);
  $('#year-work-pool').textContent = formatMoney(totals.workPool);
  $('#year-periods').textContent = `快团 ${yearlyHistory.length} 期 · 读书瞳 ${yearlyDushutongSales.length} 笔`;
  $('#year-caicai-days').textContent = `快团营业 ${totals.caicaiDays} 天 · 读书瞳 ${yearlyDushutongSales.length} 笔`;
  $('#year-xiaofan-days').textContent = `快团营业 ${totals.xiaofanDays} 天 · 读书瞳 ${yearlyDushutongSales.length} 笔`;
}

function renderHistory() {
  const history = getHistory();
  const dushutongSales = getStoredList(DUSHUTONG_SALES_KEY);
  renderYearSummary(history);
  if (!history.length && !dushutongSales.length) {
    historyList.innerHTML = '<p class="empty-history">完成快团月结或读书瞳销售后，记录会出现在这里。</p>';
    return;
  }
  const monthlyItems = history.map(item => ({ sortDate: `${item.month}-31`, html: `<article class="history-item"><div><strong><i class="history-kind kua-tuan">快团</i>${monthLabel(item.month)}</strong><small>总收益 ${formatMoney(item.total)} · 菜菜 ${item.caicaiDays} 天 / 小凡 ${item.xiaofanDays} 天</small></div><div class="history-amount"><span>菜菜</span><b>${formatMoney(item.caicaiTotal)}</b></div><div class="history-amount"><span>小凡</span><b>${formatMoney(item.xiaofanTotal)}</b></div><button type="button" class="delete-history" data-history-id="${item.id}" aria-label="删除快团记录">×</button></article>` }));
  const dushutongItems = dushutongSales.map(item => ({ sortDate: item.date, html: `<article class="history-item"><div><strong><i class="history-kind dushutong">读书瞳</i>${formatDushutongDate(item.date)}</strong><small>${ownerName(item.seller)}卖出 ${item.quantity} 台 · 销售额 ${formatMoney(item.revenue)} · 净利润 ${formatMoney(item.profit)}</small></div><div class="history-amount"><span>菜菜利润</span><b>${formatMoney(item.caicaiProfit)}</b></div><div class="history-amount"><span>小凡利润</span><b>${formatMoney(item.xiaofanProfit)}</b></div><button type="button" class="delete-history" data-dst-history-sale-id="${item.id}" aria-label="删除读书瞳记录">×</button></article>` }));
  historyList.innerHTML = [...monthlyItems, ...dushutongItems].sort((a, b) => b.sortDate.localeCompare(a.sortDate)).map(item => item.html).join('');
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
$('#clear-history').addEventListener('click', () => { if (getHistory().length && confirm('确定清空全部快团月结记录吗？读书瞳记录不会被删除。')) { localStorage.removeItem('kuaTuanMonthlyHistory'); renderHistory(); } });
$('#export-history').addEventListener('click', exportHistory);
$('#import-history').addEventListener('click', () => $('#import-history-file').click());
$('#import-history-file').addEventListener('change', event => { if (event.target.files[0]) importHistory(event.target.files[0]); event.target.value = ''; });
historyYearSelect.addEventListener('change', () => renderYearSummary(getHistory()));
historyList.addEventListener('click', event => {
  const monthlyButton = event.target.closest('[data-history-id]');
  if (monthlyButton) {
    const next = getHistory().filter(item => String(item.id) !== monthlyButton.dataset.historyId);
    localStorage.setItem('kuaTuanMonthlyHistory', JSON.stringify(next));
    renderHistory();
    return;
  }
  const dushutongButton = event.target.closest('[data-dst-history-sale-id]');
  if (dushutongButton) deleteDushutongSale(dushutongButton.dataset.dstHistorySaleId);
});
form.addEventListener('submit', calculateSettlement);
dstPurchaseForm.addEventListener('submit', addDushutongPurchase);
dstSaleForm.addEventListener('submit', addDushutongSale);
['#dst-sale-quantity', '#dst-sale-unit-price', '#dst-sale-freight', '#dst-sale-seller'].forEach(selector => $(selector).addEventListener('input', updateDushutongPreview));
$('#dst-sales-list').addEventListener('click', event => { const button = event.target.closest('[data-dst-sale-id]'); if (button) deleteDushutongSale(button.dataset.dstSaleId); });
$('#dst-purchases-list').addEventListener('click', event => { const button = event.target.closest('[data-dst-purchase-id]'); if (button) deleteDushutongPurchase(button.dataset.dstPurchaseId); });

startMonthInput.value = defaultStartMonth();
$('#dst-purchase-date').value = localDateValue();
$('#dst-sale-date').value = localDateValue();
updateAllocationUI();
seedDushutongInitialStock();
formatToday();
updatePeriodUI();
updateIncomePreview();
renderCalendars();
updateRestModeUI();
renderHistory();

cloudSync?.start({
  appId: 'shared-settlement-ledger',
  keys: ['kuaTuanMonthlyHistory', 'kuaTuanAllocation', 'dushutongPurchases', 'dushutongSales', 'dushutongInitialStockSeeded'],
  onRemote: () => { updateAllocationUI(); renderHistory(); renderDushutong(); },
});
renderDushutong();
