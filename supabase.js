// ===== 云端数据层（Supabase）=====
// USE_CLOUD=false 时全部走本地，不影响原功能。

let _sbClient = null;
function sbClient() {
  if (_sbClient) return _sbClient;
  const cfg = window.APP_CONFIG;
  if (!cfg || !cfg.USE_CLOUD || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return null;
  if (typeof supabase === 'undefined') { console.warn('supabase-js 未加载'); return null; }
  _sbClient = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  return _sbClient;
}

function getLearningId() {
  const cfg = window.APP_CONFIG;
  if (cfg && cfg.LEARNING_ID) return cfg.LEARNING_ID;
  let id = localStorage.getItem('lyj_learning_id');
  if (!id) { id = 'LYJ' + Math.random().toString(36).slice(2, 8).toUpperCase(); localStorage.setItem('lyj_learning_id', id); }
  return id;
}
function getLearningPw() {
  const cfg = window.APP_CONFIG;
  if (cfg && cfg.LEARNING_PW) return cfg.LEARNING_PW;
  let pw = localStorage.getItem('lyj_learning_pw');
  if (!pw) { pw = Math.random().toString(36).slice(2, 8).toUpperCase(); localStorage.setItem('lyj_learning_pw', pw); }
  return pw;
}

// ===== 同步状态日志（供排查「家长端看不到内容」类问题）=====
let _lastSync = { code: 'INIT', time: 0, msg: '' };
function logSync(code, msg) {
  _lastSync = { code: code, time: Date.now(), msg: String(msg == null ? '' : msg).slice(0, 200) };
  console.log('[sync]', code, _lastSync.msg);
}
function getSyncStatus() { return _lastSync; }

// 仅网络类瞬时错误重试；RLS/口径错误（带 code 或非网络特征）直接抛出，避免无效重试放大故障
async function withRetry(fn, label, retries) {
  retries = retries || 3;
  let lastErr = null;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const m = (e && e.message) ? e.message : String(e);
      const transient = !e.code && /failed to fetch|network|timeout|econn|socket|abort/i.test(m);
      logSync('RETRY_' + (i + 1), label + ': ' + m.slice(0, 120));
      if (!transient) throw e;
      if (i < retries - 1) await new Promise(function (r) { setTimeout(r, 800 * (i + 1)); });
    }
  }
  throw lastErr;
}

async function ensureChild() {
  const c = sbClient(); if (!c) return false;
  try {
    await c.from('children').upsert({ learning_id: getLearningId(), password: getLearningPw(), updated_at: new Date().toISOString() });
    return true;
  } catch (e) { console.warn('ensureChild', e); return false; }
}

async function pushStudyRecords() {
  const c = sbClient(); if (!c) return;
  const data = loadData();
  const hist = data.history || [];
  // 只同步尚未上传过的记录（增量同步，避免每次全量重插导致批次过大失败）
  const pending = hist.filter(h => !h.synced);
  if (!pending.length) return;
  let syncErr = null;
  const toRow = (h) => ({
    learning_id: getLearningId(),
    grade: h.grade,
    unit_name: h.unitName,
    // v56：线上 study_records 表未建 module 列，暂不带该字段；最近练习改走 children 表数据通道
    correct: h.score,
    total: h.total,
    accuracy: h.accuracy,
    created_at: new Date(h.time || Date.now()).toISOString(),
    wrong_json: (h.wrong || []).map(w => ({
      unitName: w.unitName,
      grade: w.grade,
      userAnswer: (w.userAnswer === undefined || w.userAnswer === null) ? '' : String(w.userAnswer),
      question: {
        question: (w.question && w.question.question) || '',
        options: (w.question && w.question.options) || [],
        answer: (w.question && w.question.answer) || '',
        explain: (w.question && w.question.explain) || '',
        svg: (w.question && w.question.svg) || '',
        passage: (w.question && w.question.passage) || '',
        type: (w.question && w.question.type) || ''
      }
    }))
  });
  const mark = (h) => { h.synced = true; };
  // supabase-js v2 的 insert 失败（如 RLS 拒绝）不会 throw，而是返回 {error}——必须显式检查
  const doInsert = async (rows) => {
    const r = await c.from('study_records').insert(rows);
    if (r && r.error) throw r.error;
    return r;
  };
  try {
    await doInsert(pending.map(toRow));
    pending.forEach(mark);
  } catch (e) {
    console.warn('pushStudyRecords 批次失败，改为逐条写入：', e);
    let firstErr = null;
    for (const h of pending) {
      try { await doInsert(toRow(h)); mark(h); }
      catch (e2) {
        if (!firstErr) firstErr = (e2 && e2.message) ? e2.message : String(e2);
        console.warn('跳过一条记录：', h.unitName, e2);
      }
    }
    syncErr = firstErr;
  }
  // 同步状态落盘：成功清空，失败记错误（家长本机页可见，避免静默失败）
  if (syncErr) {
    data.syncError = { time: Date.now(), msg: String(syncErr).slice(0, 300) };
    logSync('FAIL', syncErr);
  } else {
    delete data.syncError;
    logSync('OK', 'pushStudyRecords pending=' + pending.length);
  }
  saveData(data);
}

// v56 新增：通过 children 表的数据通道同步最近练习（绕开 study_records RLS/列缺失问题）
async function pushRecentHistory() {
  const c = sbClient(); if (!c) return;
  const data = loadData();
  const hist = data.history || [];
  // v60：本地最近 50 条（recordHistory 本地上限即 50）映射为精简结构，每道错题最多保留 20 题详情
  const localPayload = hist.slice(0, 50).map(h => ({
    module: h.module || '数学',
    grade: h.grade,
    unitName: h.unitName,
    score: h.score,
    total: h.total,
    accuracy: h.accuracy,
    time: h.time,
    wrong: (h.wrong || []).slice(0, 20).map(w => ({
      unitName: w.unitName,
      grade: w.grade,
      userAnswer: (w.userAnswer === undefined || w.userAnswer === null) ? '' : String(w.userAnswer),
      question: {
        question: (w.question && w.question.question) || '',
        options: (w.question && w.question.options) || [],
        answer: (w.question && w.question.answer) || '',
        explain: (w.question && w.question.explain) || '',
        svg: (w.question && w.question.svg) || '',
        passage: (w.question && w.question.passage) || '',
        type: (w.question && w.question.type) || ''
      }
    }))
  }));
  const recentId = getLearningId() + ':recent';
  try {
    await withRetry(async function () {
      // v60：先取云端已有记录，合并而非整体覆盖——避免本机重置/重装后清空云端历史，
      // 也支持多设备累积（任一设备补传都不会抹掉其它设备已上传的记录）
      let existing = [];
      try {
        const { data: row } = await c.from('children').select('password').eq('learning_id', recentId).single();
        if (row && row.password) {
          const p = JSON.parse(row.password);
          if (Array.isArray(p.records)) existing = p.records;
        }
      } catch (e) { /* 首条记录：云端尚无数据行 */ }
      const keyOf = r => [r.grade, r.unitName, r.time, r.score, r.total].map(x => String(x)).join('|');
      const map = {};
      existing.forEach(r => { if (r && r.time) map[keyOf(r)] = r; });                 // 保留已上传记录（含其错题详情）
      localPayload.forEach(r => { if (r && r.time && !map[keyOf(r)]) map[keyOf(r)] = r; }); // 仅补入本地新增
      const merged = Object.values(map).sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 50);
      const { error } = await c.from('children').upsert({
        learning_id: recentId,
        password: JSON.stringify({ records: merged, updated_at: Date.now() }),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    }, 'pushRecentHistory');
    logSync('OK', 'pushRecentHistory merged ok');
  } catch (e) {
    console.warn('pushRecentHistory ex', e);
    logSync('FAIL', (e && e.message) || String(e));
  }
}

// v56 新增：家长端远程拉取最近练习；先校验 learning_id+pw，再取同账号的 :recent 数据行
async function getRecentHistory(learningId, pw) {
  const c = sbClient(); if (!c) return null;
  try {
    const { data: child, error: cErr } = await c.from('children')
      .select('password').eq('learning_id', learningId).single();
    if (cErr || !child) return null;
    if (String(child.password).trim() !== String(pw).trim()) return null;
    const recentId = learningId + ':recent';
    const { data: row, error: rErr } = await c.from('children')
      .select('password').eq('learning_id', recentId).single();
    if (rErr || !row || !row.password) return { ok: true, recent: [] };
    const payload = JSON.parse(row.password);
    const records = Array.isArray(payload && payload.records) ? payload.records : [];
    return { ok: true, recent: records };
  } catch (e) { console.warn('getRecentHistory', e); return null; }
}

// 数据驱动的单元生成器（用于 content 覆盖层中的 questions 数组）
function g_from_data(unitDef) {
  let i = 0; const qs = unitDef.questions || [];
  return function () { if (qs.length === 0) return null; if (i >= qs.length) i = 0; return qs[i++]; };
}

// 把覆盖层单元合并进 KNOWLEDGE_BASE（所有既有代码自动可见）
function applyContentOverride(override) {
  if (!override || !override.units) return;
  for (const g in override.units) {
    const sem = override.units[g];
    for (const s in sem) {
      const list = sem[s];
      if (!KNOWLEDGE_BASE[g]) continue;
      if (!KNOWLEDGE_BASE[g][s]) KNOWLEDGE_BASE[g][s] = [];
      list.forEach(u => {
        const unit = { name: u.name, type: u.type || 'shape' };
        if (u.questions) unit.gen = g_from_data(u);
        else if (u.gen && typeof window[u.gen] === 'function') unit.gen = window[u.gen];
        else if (u.gen && typeof u.gen === 'function') unit.gen = u.gen;
        KNOWLEDGE_BASE[g][s].push(unit);
      });
    }
  }
}

async function loadAndApplyContent() {
  const cfg = window.APP_CONFIG;
  if (cfg && cfg.LOCAL_OVERRIDE) applyContentOverride(cfg.LOCAL_OVERRIDE);
  const c = sbClient();
  if (c) {
    try {
      const { data, error } = await c.from('content').select('data').eq('id', cfg.CONTENT_ROW_ID).single();
      if (data && data.data) applyContentOverride(data.data);
    } catch (e) { console.warn('loadContent', e); }
  }
  if (typeof renderSpecialSection === 'function') { try { renderSpecialSection(); } catch (e) {} }
  if (c) { ensureChild(); }   // 云端模式：打开即注册本机学习ID，家长可立即远程查看
  if (c) { pushStudyRecords(); pushRecentHistory(); }  // 打开即补同步
}

// v39 一次性修复：服务端 RLS 拒绝 insert 时（返回 {error} 而非抛异常），
// 旧版代码未检查 error 字段、把语文记录误标 synced=true 导致永不重传。
// 云端经核实无任何语文记录，安全地把全部语文历史重置为待同步。
(function resetCnSyncedOnce() {
  if (localStorage.getItem('lyj_v39_cn_resync') === 'done') return;
  const cfg = window.APP_CONFIG;
  if (!cfg || !cfg.USE_CLOUD) { localStorage.setItem('lyj_v39_cn_resync', 'done'); return; }
  try {
    const data = JSON.parse(localStorage.getItem('math_practice_data') || '{}');
    let changed = false;
    (data.history || []).forEach(function (h) {
      if (h.module === '\u8BED\u6587' && h.synced === true) { h.synced = false; changed = true; }
    });
    if (changed) localStorage.setItem('math_practice_data', JSON.stringify(data));
  } catch (e) { console.warn('resetCnSyncedOnce', e); }
  localStorage.setItem('lyj_v39_cn_resync', 'done');
})();

async function getChildStats(learningId, pw) {
  const c = sbClient(); if (!c) return null;
  const { data, error } = await c.rpc('get_child_stats', { p_learning_id: learningId, p_pw: pw });
  if (error) { console.warn('getChildStats', error); return null; }
  return data;
}

// v55：家长端远程登录拉取最近练习（含考试），返回最近 N 条 study_records（含 wrong_json）
async function getChildRecent(learningId, pw, limit) {
  const c = sbClient(); if (!c) return null;
  const { data, error } = await c.rpc('get_child_recent', { p_learning_id: learningId, p_pw: pw, p_limit: limit || 20 });
  if (error) { console.warn('getChildRecent', error); return null; }
  return data;
}

async function syncAfterQuiz() {
  const c = sbClient(); if (!c) return;
  await ensureChild();
  await pushStudyRecords();      // 兼容旧通道（云端库如修复可继续落 study_records）
  await pushRecentHistory();     // v56：稳定的 children 数据通道，用于家长端「最近练习」
}

// 启动时加载内容覆盖层
loadAndApplyContent();

// 子端健壮性：网络恢复 / 回到前台时自动补推，保证云端是最新（修复「家长端看不到最新内容」）
(function scheduleBackgroundSync() {
  if (typeof window === 'undefined') return;
  let timer = null;
  const trigger = function () {
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      const c = sbClient();
      if (c) syncAfterQuiz();   // 幂等 upsert，重复触发无副作用
    }, 1500);
  };
  window.addEventListener('online', trigger);
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () { if (!document.hidden) trigger(); });
  }
})();
