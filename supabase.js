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
  let id = localStorage.getItem('lyj_learning_id');
  if (!id) { id = 'LYJ' + Math.random().toString(36).slice(2, 8).toUpperCase(); localStorage.setItem('lyj_learning_id', id); }
  return id;
}
function getLearningPw() {
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
        svg: (w.question && w.question.svg) || ''
      }
    }))
  });
  const mark = (h) => { h.synced = true; };
  try {
    await c.from('study_records').insert(pending.map(toRow));
    pending.forEach(mark);
  } catch (e) {
    console.warn('pushStudyRecords 批次失败，改为逐条写入：', e);
    for (const h of pending) {
      try { await c.from('study_records').insert(toRow(h)); mark(h); }
      catch (e2) { console.warn('跳过一条记录：', h.unitName, e2); }
    }
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
}

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
