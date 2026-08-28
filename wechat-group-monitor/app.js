const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const STORAGE_KEY = 'wechatGroupMonitorData';
const ui = {
  groupList: $('#group-list'),
  groupDialog: $('#group-dialog'),
  memberInput: $('#member-input'),
  screenshotInput: $('#screenshot-input'),
  toast: $('#toast'),
};

let state = loadState();
let selectedFiles = [];
let ocrRunning = false;

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && Array.isArray(stored.groups) && Array.isArray(stored.events)) {
      const next = { groups: stored.groups, events: stored.events, activeGroupId: stored.activeGroupId || stored.groups[0]?.id || null };
      seedKnownGroups(next);
      return next;
    }
  } catch {}
  const initial = { groups: [], events: [], activeGroupId: null };
  seedKnownGroups(initial);
  return initial;
}

function seedKnownGroups(target) {
  const knownGroups = [
    { id: 'mango-group-2', name: '芒果味的糯米团子好物分享群②', note: '微信群显示 456 人', expectedCount: 456 },
    { id: 'mango-group-3', name: '芒果味的糯米团子好物分享群③', note: '微信群显示 313 人', expectedCount: 313 },
  ];
  knownGroups.forEach(known => {
    const existing = target.groups.find(group => group.name === known.name);
    if (existing) {
      existing.expectedCount = known.expectedCount;
      existing.note ||= known.note;
    } else {
      target.groups.push({ ...known, createdAt: new Date().toISOString(), snapshots: [] });
    }
  });
  if (!target.activeGroupId) target.activeGroupId = target.groups[0]?.id || null;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activeGroup() {
  return state.groups.find(group => group.id === state.activeGroupId) || null;
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return '时间未知';
  const date = new Date(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseNames(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(name => name.replace(/^[\s·•,，;；|]+|[\s·•,，;；|]+$/g, '').replace(/\s{2,}/g, ' ').trim())
    .filter(name => name && name.length <= 40);
}

function countNames(names) {
  return names.reduce((counts, name) => counts.set(name, (counts.get(name) || 0) + 1), new Map());
}

function diffNames(previousNames, currentNames) {
  const previous = countNames(previousNames);
  const current = countNames(currentNames);
  const left = [];
  const joined = [];
  previous.forEach((count, name) => {
    for (let index = 0; index < Math.max(0, count - (current.get(name) || 0)); index += 1) left.push(name);
  });
  current.forEach((count, name) => {
    for (let index = 0; index < Math.max(0, count - (previous.get(name) || 0)); index += 1) joined.push(name);
  });
  return { left, joined };
}

function latestSnapshot(group) {
  return group?.snapshots?.[0] || null;
}

function groupEvents(groupId, type) {
  return state.events.filter(event => event.groupId === groupId && (!type || event.type === type));
}

function showToast(title, message) {
  $('strong', ui.toast).textContent = title;
  $('p', ui.toast).textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => ui.toast.classList.remove('show'), 2800);
}

function switchView(viewName) {
  $$('.view').forEach(view => view.classList.toggle('active', view.id === `view-${viewName}`));
  $$('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === viewName));
  const titles = { dashboard: '群成员变化，一眼就知道', snapshot: '保存最新名单，自动找出退群客户', history: '每一位流失客户都有记录' };
  $('#page-title').textContent = titles[viewName] || titles.dashboard;
  if (viewName === 'history') renderHistory();
  if (viewName === 'snapshot') renderSnapshotPreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderGroups() {
  if (!state.groups.length) {
    ui.groupList.innerHTML = '<div class="empty-state">还没有微信群<br>点击右上角＋创建</div>';
  } else {
    ui.groupList.innerHTML = state.groups.map(group => {
      const snapshot = latestSnapshot(group);
      const memberText = snapshot ? `${snapshot.members.length} 位成员` : group.expectedCount ? `群标题显示 ${group.expectedCount} 人` : '待建立基线';
      return `<button class="group-item ${group.id === state.activeGroupId ? 'active' : ''}" type="button" data-group-id="${group.id}"><strong>${escapeHtml(group.name)}</strong><small>${memberText} · ${group.snapshots.length} 次快照</small><span class="group-delete" data-delete-group="${group.id}" aria-label="删除微信群">×</span></button>`;
    }).join('');
  }
  const group = activeGroup();
  $('#mobile-group-select').innerHTML = state.groups.length ? state.groups.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('') : '<option value="">暂无微信群</option>';
  $('#mobile-group-select').value = group?.id || '';
  $('#hero-group-name').textContent = group?.name || '先创建一个微信群';
  $('#snapshot-subtitle').textContent = group ? `正在为“${group.name}”保存最新成员名单。` : '先创建并选择一个微信群，再建立成员基线。';
  renderHistoryFilters();
}

function renderDashboard() {
  const group = activeGroup();
  const snapshot = latestSnapshot(group);
  const leftEvents = group ? groupEvents(group.id, 'left') : [];
  const joinedEvents = group ? groupEvents(group.id, 'joined') : [];
  $('#summary-members').textContent = snapshot?.members.length || group?.expectedCount || 0;
  $('#summary-members-note').textContent = snapshot ? '最近一次快照' : group?.expectedCount ? '群标题显示人数，待上传名单核对' : '尚未建立基线';
  $('#summary-left').textContent = leftEvents.length;
  $('#summary-joined').textContent = joinedEvents.length;
  $('#summary-snapshots').textContent = group?.snapshots.length || 0;
  $('#summary-last-time').textContent = snapshot ? formatDateTime(snapshot.time) : '尚未建立基线';
  const latestEvents = group ? state.events.filter(event => event.groupId === group.id).slice(0, 8) : [];
  $('#latest-changes').innerHTML = latestEvents.length ? latestEvents.map(event => `<article class="change-item ${event.type}"><span class="change-dot">${event.type === 'left' ? '−' : '+'}</span><div><strong>${escapeHtml(event.name)}</strong><small>${event.type === 'left' ? '退出群聊' : '新加入群聊'} · ${escapeHtml(group.name)}</small></div><time>${formatDateTime(event.time)}</time></article>`).join('') : '<div class="empty-state">建立两次成员快照后，这里会显示退出和新加入的客户。</div>';
}

function renderSnapshotPreview() {
  const group = activeGroup();
  const names = parseNames(ui.memberInput.value);
  const previous = latestSnapshot(group)?.members || [];
  const comparison = previous.length ? diffNames(previous, names) : { left: [], joined: [] };
  $('#member-count-text').textContent = `当前识别 ${names.length} 个名字`;
  $('#preview-current').textContent = names.length;
  $('#preview-left').textContent = comparison.left.length;
  $('#preview-joined').textContent = comparison.joined.length;
  $('#preview-left-names').textContent = comparison.left.slice(0, 8).join('、') || '—';
  $('#preview-joined-names').textContent = comparison.joined.slice(0, 8).join('、') || '—';
  $('#compare-baseline').textContent = previous.length ? `正在与上次 ${previous.length} 位成员进行对比。` : '首次保存将作为基线，不产生退群记录。';
}

function renderHistoryFilters() {
  const selected = $('#history-group-filter').value || 'all';
  $('#history-group-filter').innerHTML = `<option value="all">全部微信群</option>${state.groups.map(group => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join('')}`;
  $('#history-group-filter').value = selected === 'all' || state.groups.some(group => group.id === selected) ? selected : 'all';
}

function renderHistory() {
  renderHistoryFilters();
  const groupFilter = $('#history-group-filter').value;
  const statusFilter = $('#history-status-filter').value;
  const search = $('#history-search').value.trim().toLowerCase();
  const events = state.events.filter(event => event.type === 'left')
    .filter(event => groupFilter === 'all' || event.groupId === groupFilter)
    .filter(event => statusFilter === 'all' || (statusFilter === 'contacted') === Boolean(event.contacted))
    .filter(event => !search || event.name.toLowerCase().includes(search) || String(event.note || '').toLowerCase().includes(search));
  $('#exit-history').innerHTML = events.length ? events.map(event => {
    const group = state.groups.find(item => item.id === event.groupId);
    return `<article class="exit-card"><div class="exit-main"><span class="exit-avatar">${escapeHtml(event.name.slice(0, 1))}</span><div><strong>${escapeHtml(event.name)}</strong><small>${escapeHtml(group?.name || '已删除群聊')} · ${formatDateTime(event.time)}</small><input class="exit-note" data-event-note="${event.id}" value="${escapeHtml(event.note)}" placeholder="添加客户情况、联系方式或跟进备注"></div></div><div class="exit-actions"><button class="status-button ${event.contacted ? 'contacted' : ''}" type="button" data-event-status="${event.id}">${event.contacted ? '✓ 已联系' : '待联系'}</button><button class="delete-event" type="button" data-delete-event="${event.id}" aria-label="删除记录">×</button></div></article>`;
  }).join('') : '<div class="empty-state">暂时没有符合条件的退群客户记录。</div>';
}

function renderAll() {
  renderGroups();
  renderDashboard();
  renderSnapshotPreview();
}

function createGroup(event) {
  event.preventDefault();
  const name = $('#group-name-input').value.trim();
  if (!name) return;
  const group = { id: uid('group'), name, note: $('#group-note-input').value.trim(), createdAt: new Date().toISOString(), snapshots: [] };
  state.groups.unshift(group);
  state.activeGroupId = group.id;
  saveState();
  ui.groupDialog.close();
  $('#group-form').reset();
  renderAll();
  switchView('snapshot');
  showToast('微信群已创建', '请录入第一次成员名单作为对比基线。');
}

function selectGroup(groupId) {
  state.activeGroupId = groupId;
  saveState();
  ui.memberInput.value = '';
  renderAll();
}

function deleteGroup(groupId) {
  const group = state.groups.find(item => item.id === groupId);
  if (!group || !confirm(`确定删除“${group.name}”及其全部快照和退群记录吗？`)) return;
  state.groups = state.groups.filter(item => item.id !== groupId);
  state.events = state.events.filter(event => event.groupId !== groupId);
  state.activeGroupId = state.groups[0]?.id || null;
  saveState();
  renderAll();
}

function saveSnapshot() {
  const group = activeGroup();
  if (!group) return showToast('请先创建微信群', '点击左侧“我的微信群”旁边的＋号。');
  const members = parseNames(ui.memberInput.value);
  if (!members.length) return showToast('名单为空', '请粘贴成员昵称或上传截图进行识别。');
  const time = $('#snapshot-time').value || localDateTimeValue();
  const previous = latestSnapshot(group);
  const comparison = previous ? diffNames(previous.members, members) : { left: [], joined: [] };
  const snapshotId = uid('snapshot');
  group.snapshots.unshift({ id: snapshotId, time, note: $('#snapshot-note').value.trim(), members });
  const newEvents = [
    ...comparison.left.map(name => ({ id: uid('event'), groupId: group.id, snapshotId, type: 'left', name, time, contacted: false, note: '' })),
    ...comparison.joined.map(name => ({ id: uid('event'), groupId: group.id, snapshotId, type: 'joined', name, time, contacted: false, note: '' })),
  ];
  state.events = [...newEvents, ...state.events];
  saveState();
  ui.memberInput.value = '';
  $('#snapshot-note').value = '';
  $('#snapshot-time').value = localDateTimeValue();
  selectedFiles = [];
  ui.screenshotInput.value = '';
  $('#file-count').textContent = '尚未选择截图';
  $('#run-ocr').disabled = true;
  renderAll();
  switchView('dashboard');
  showToast(previous ? '对比完成' : '基线已建立', previous ? `发现 ${comparison.left.length} 人退群，${comparison.joined.length} 人新加入。` : `已保存 ${members.length} 位群成员。`);
}

async function runOcr() {
  if (!selectedFiles.length || ocrRunning) return;
  if (!window.Tesseract) return showToast('识别组件未加载', '请检查网络后刷新，或改用粘贴名单。');
  const button = $('#run-ocr');
  const progress = $('#ocr-progress');
  const bar = $('span', progress);
  const label = $('p', progress);
  button.disabled = true;
  progress.hidden = false;
  let worker;
  ocrRunning = true;
  try {
    worker = await Tesseract.createWorker('chi_sim', 1, {
      workerPath: 'vendor/tesseract/worker.min.js',
      corePath: 'vendor/tesseract/tesseract-core-lstm.js',
      langPath: 'vendor/tesseract/lang',
      gzip: true,
      logger: message => {
        const percent = Math.round((message.progress || 0) * 100);
        bar.style.width = `${percent}%`;
        label.textContent = `正在识别：${percent}%`;
      },
    });
    const results = [];
    for (let index = 0; index < selectedFiles.length; index += 1) {
      label.textContent = `正在识别第 ${index + 1} / ${selectedFiles.length} 张截图…`;
      const result = await worker.recognize(selectedFiles[index], { rotateAuto: true });
      results.push(result.data.text);
    }
    const existing = ui.memberInput.value.trim();
    ui.memberInput.value = [existing, ...results].filter(Boolean).join('\n');
    switchImportTab('paste');
    renderSnapshotPreview();
    showToast('截图识别完成', '请人工核对昵称，并删除微信界面中的无关文字。');
  } catch (error) {
    console.error(error);
    showToast('截图识别失败', '请检查网络或图片清晰度，也可以直接粘贴成员名单。');
  } finally {
    if (worker) await worker.terminate();
    ocrRunning = false;
    button.disabled = !selectedFiles.length;
    setTimeout(() => { progress.hidden = true; bar.style.width = '0'; }, 700);
  }
}

function switchImportTab(name) {
  $$('[data-import]').forEach(button => button.classList.toggle('active', button.dataset.import === name));
  $$('.import-panel').forEach(panel => panel.classList.toggle('active', panel.id === `import-${name}`));
}

function exportHistory() {
  const events = state.events.filter(event => event.type === 'left');
  if (!events.length) return showToast('暂无数据', '还没有可导出的退群客户记录。');
  const rows = [['客户昵称', '微信群', '退群时间', '跟进状态', '备注'], ...events.map(event => {
    const group = state.groups.find(item => item.id === event.groupId);
    return [event.name, group?.name || '已删除群聊', formatDateTime(event.time), event.contacted ? '已联系' : '待联系', event.note || ''];
  })];
  const csv = `\ufeff${rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')}`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `微信群退群客户-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatToday() {
  const now = new Date();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  $('#today-text').textContent = `${now.getMonth() + 1}月${now.getDate()}日 · ${weekdays[now.getDay()]}`;
}

$$('[data-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
$$('[data-go]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.go)));
$$('[data-import]').forEach(button => button.addEventListener('click', () => switchImportTab(button.dataset.import)));
$('#add-group-button').addEventListener('click', () => ui.groupDialog.showModal());
$('#mobile-add-group').addEventListener('click', () => ui.groupDialog.showModal());
$('#mobile-group-select').addEventListener('change', event => { if (event.target.value) selectGroup(event.target.value); });
$('#close-group-dialog').addEventListener('click', () => ui.groupDialog.close());
$('#group-form').addEventListener('submit', createGroup);
ui.groupList.addEventListener('click', event => {
  const deleteButton = event.target.closest('[data-delete-group]');
  if (deleteButton) { event.stopPropagation(); deleteGroup(deleteButton.dataset.deleteGroup); return; }
  const groupButton = event.target.closest('[data-group-id]');
  if (groupButton) selectGroup(groupButton.dataset.groupId);
});
ui.memberInput.addEventListener('input', renderSnapshotPreview);
$('#clean-list').addEventListener('click', () => { ui.memberInput.value = parseNames(ui.memberInput.value).join('\n'); renderSnapshotPreview(); });
ui.screenshotInput.addEventListener('change', () => {
  selectedFiles = [...ui.screenshotInput.files];
  $('#file-count').textContent = selectedFiles.length ? `已选择 ${selectedFiles.length} 张截图` : '尚未选择截图';
  $('#run-ocr').disabled = !selectedFiles.length;
  if (selectedFiles.length) runOcr();
});
$('#upload-zone').addEventListener('dragover', event => { event.preventDefault(); event.currentTarget.classList.add('dragover'); });
$('#upload-zone').addEventListener('dragleave', event => event.currentTarget.classList.remove('dragover'));
$('#upload-zone').addEventListener('drop', event => {
  event.preventDefault();
  event.currentTarget.classList.remove('dragover');
  selectedFiles = [...event.dataTransfer.files].filter(file => file.type.startsWith('image/'));
  $('#file-count').textContent = selectedFiles.length ? `已选择 ${selectedFiles.length} 张截图` : '尚未选择截图';
  $('#run-ocr').disabled = !selectedFiles.length;
  if (selectedFiles.length) runOcr();
});
$('#run-ocr').addEventListener('click', runOcr);
$('#save-snapshot').addEventListener('click', saveSnapshot);
['#history-group-filter', '#history-status-filter'].forEach(selector => $(selector).addEventListener('change', renderHistory));
$('#history-search').addEventListener('input', renderHistory);
$('#exit-history').addEventListener('click', event => {
  const statusButton = event.target.closest('[data-event-status]');
  if (statusButton) {
    const item = state.events.find(entry => entry.id === statusButton.dataset.eventStatus);
    if (item) { item.contacted = !item.contacted; saveState(); renderHistory(); }
    return;
  }
  const deleteButton = event.target.closest('[data-delete-event]');
  if (deleteButton && confirm('确定删除这条退群记录吗？')) {
    state.events = state.events.filter(item => item.id !== deleteButton.dataset.deleteEvent);
    saveState();
    renderAll();
    renderHistory();
  }
});
$('#exit-history').addEventListener('change', event => {
  const input = event.target.closest('[data-event-note]');
  if (!input) return;
  const item = state.events.find(entry => entry.id === input.dataset.eventNote);
  if (item) { item.note = input.value.trim(); saveState(); }
});
$('#export-history').addEventListener('click', exportHistory);

$('#snapshot-time').value = localDateTimeValue();
formatToday();
renderAll();

cloudSync?.start({
  appId: 'wechat-group-monitor',
  keys: ['wechatGroupMonitorData'],
  onRemote: () => { state = loadState(); renderAll(); },
});
