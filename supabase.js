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
  } else {
    delete data.syncError;
  }
  saveData(data);
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
  if (c) { pushStudyRecords(); }  // v39：打开即补同步积压记录（此前 RLS 拒绝被静默标记 synced 的记录）
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

async function syncAfterQuiz() {
  const c = sbClient(); if (!c) return;
  await ensureChild();
  await pushStudyRecords();
}

// 启动时加载内容覆盖层
loadAndApplyContent();
