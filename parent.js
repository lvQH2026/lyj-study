// ===== 家长后台 =====

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ===== 同步状态码与错误提示（便于定位「家长端看不到内容」类问题）=====
const SYNC_STATUS = {
  INIT: 'INIT',                 // 未同步
  OK: 'OK',                     // 成功
  LOADING: 'LOADING',           // 同步中
  NETWORK_ERROR: 'NETWORK_ERROR', // SYNC-401 网络异常
  AUTH_FAIL: 'AUTH_FAIL',       // SYNC-403 学习ID/口令错误
  EMPTY: 'EMPTY',               // 该账号暂无记录
  PARSE_ERROR: 'PARSE_ERROR'    // SYNC-500 数据解析失败
};
let _lastRemoteId = '', _lastRemotePw = '';   // 供「刷新」按钮复用上次凭证

function syncInfoBox(title, detail, kind) {
  const bg = kind === 'err' ? '#fff1f0' : '#eef7f0';
  const bd = kind === 'err' ? '#cf1322' : '#4E8C6E';
  const fg = kind === 'err' ? '#cf1322' : '#2c6b4f';
  return '<div style="margin:10px 0;padding:12px;border:1px solid ' + bd + ';border-radius:10px;background:' + bg + ';color:' + fg + ';font-size:13px;line-height:1.6">'
    + '<div style="font-weight:700">' + esc(title) + '</div>'
    + (detail ? '<div style="color:#8c8c8c;margin-top:4px">' + esc(detail) + '</div>' : '')
    + '<button class="btn" style="margin-top:8px" onclick="renderRemote(_lastRemoteId,_lastRemotePw)">刷新重试</button>'
    + '</div>';
}

function syncRefreshBar() {
  return '<div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#9AA3BD">'
    + '<span>数据来自云端（最新同步）</span>'
    + '<button class="btn" style="padding:4px 12px;font-size:12px" onclick="renderRemote(_lastRemoteId,_lastRemotePw)">↻ 刷新</button>'
    + '</div>';
}

// v60：把「本机」练习记录合并补传云端——用于恢复在某台手机本地、但云端被覆盖丢失的练习
// （例如孩子做完期中后清过 PWA 缓存，本机本地的那次记录仍在，点此即可补回云端）
async function repairCloudFromLocal() {
  const cfg = window.APP_CONFIG || {};
  const id = cfg.LEARNING_ID || (typeof getLearningId === 'function' ? getLearningId() : null);
  const pw = cfg.LEARNING_PW || (typeof getLearningPw === 'function' ? getLearningPw() : null);
  if (!id || !pw) { alert('未配置家庭学习ID，无法补传'); return; }
  const btn = document.getElementById('repairCloudBtn');
  if (btn) { btn.disabled = true; btn.textContent = '正在合并本机记录到云端…'; }
  try {
    if (typeof pushRecentHistory === 'function') await pushRecentHistory();
    await renderRemote(id, pw);
  } catch (e) {
    if (typeof logSync === 'function') logSync(SYNC_STATUS.NETWORK_ERROR, (e && e.message) || String(e));
    alert('补传失败：' + ((e && e.message) || String(e)));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '↥ 把本机记录合并同步到云端'; }
  }
}

// 拉取并渲染指定学习ID的云端数据；统一处理网络/口令/空/解析四类失败，并显示状态码
async function renderRemote(id, pw) {
  const result = document.getElementById('parentResult');
  if (!result) return;
  _lastRemoteId = id; _lastRemotePw = pw;
  const bar = document.getElementById('syncStatusBar');
  if (bar) bar.textContent = '正在同步 ' + id + ' …';
  let remote;
  try {
    remote = await getRecentHistory(id, pw);
  } catch (e) {
    const msg = (e && e.message) ? e.message : String(e);
    if (typeof logSync === 'function') logSync(SYNC_STATUS.NETWORK_ERROR, msg);
    if (bar) bar.outerHTML = '';
    result.insertAdjacentHTML('afterbegin', syncInfoBox('网络异常，无法连接云端（SYNC-401）', '请检查网络后点「刷新」重试。', 'err'));
    return;
  }
  if (bar) bar.outerHTML = '';
  // getRecentHistory 返回 null = 主行未找到 / 口令不匹配 / 查询异常
  if (!remote) {
    if (typeof logSync === 'function') logSync(SYNC_STATUS.AUTH_FAIL, 'getRecentHistory=null');
    result.insertAdjacentHTML('afterbegin', syncInfoBox('未找到该学习ID，或口令不正确（SYNC-403）', '请核对学习ID与口令后重试。', 'err'));
    return;
  }
  const recent = remote.recent || [];
  if (!recent.length) {
    if (typeof logSync === 'function') logSync(SYNC_STATUS.EMPTY, 'no records');
    result.innerHTML = syncInfoBox('该账号暂无练习记录', '孩子完成练习后会自动同步到这里。', 'ok');
    return;
  }
  try {
    const stats = buildStatsFromRecent(recent);
    const recentHtml = renderRecentPractice(recent);
    result.innerHTML = renderDashboard(stats, true) + recentHtml + '<div id="aiMount"></div>' + syncRefreshBar();
    mountAiAnalysis('aiMount', 'cloud', stats);
    if (typeof logSync === 'function') logSync(SYNC_STATUS.OK, 'records=' + recent.length);
  } catch (e) {
    if (typeof logSync === 'function') logSync(SYNC_STATUS.PARSE_ERROR, (e && e.message) || String(e));
    result.insertAdjacentHTML('afterbegin', syncInfoBox('数据解析失败（SYNC-500）', '云端返回内容异常，请点「刷新」重试。', 'err'));
  }
}

// 「最近练习」当前渲染的数据源（本机 history 或云端 study_records，统一归一化结构）
let _rpRecords = [];

// 把本地/云端的错题对象统一成 {unitName, grade, userAnswer, question:{question,options,answer,explain,svg}}
function normalizeWrong(rawList) {
  return (rawList || []).map(w => {
    const q = w.question || {};
    return {
      unitName: w.unitName || '',
      grade: w.grade,
      userAnswer: w.userAnswer,
      question: {
        question: q.question || q.stem || '',
        options: q.options || [],
        answer: q.answer,
        explain: q.explain || '',
        svg: q.svg || '',
        passage: q.passage || ''
      }
    };
  });
}

function getLocalStats() {
  const data = loadData();
  const history = data.history || [];
  const byUnit = {};
  history.forEach(h => {
    const u = h.unitName || '未知单元';
    if (!byUnit[u]) byUnit[u] = { correct: 0, total: 0, count: 0 };
    byUnit[u].correct += (h.score || 0);
    byUnit[u].total += (h.total || 0);
    byUnit[u].count += 1;
  });
  const units = Object.keys(byUnit).map(u => ({
    unit: u,
    accuracy: byUnit[u].total ? Math.round(byUnit[u].correct / byUnit[u].total * 100) : 0,
    count: byUnit[u].count
  })).sort((a, b) => a.accuracy - b.accuracy);
  const weak = units.filter(u => u.count >= 1 && u.accuracy < 80).slice(0, 5);
  const byDay = {};
  history.forEach(h => {
    const d = new Date(h.time || Date.now()).toISOString().slice(0, 10);
    byDay[d] = (byDay[d] || 0) + (h.total || 0);
  });
  const trend = Object.keys(byDay).sort().map(d => ({ date: d, count: byDay[d] }));
  const avg = history.length ? Math.round(history.reduce((s, h) => s + (h.accuracy || 0), 0) / history.length) : 0;
  return { total: history.length, avg, units, weak, trend, wrong: normalizeWrong((data.wrong || []).slice(-8)) };
}

function renderParent() {
  const cfg = window.APP_CONFIG;
  const cloud = cfg && cfg.USE_CLOUD;
  const box = document.getElementById('parentLogin');
  const result = document.getElementById('parentResult');
  // 显示本机学习凭证（供家长远程查看用）
  const cred = document.getElementById('deviceCred');
  if (cred) {
    try {
      const cid = (typeof getLearningId === 'function') ? getLearningId() : null;
      const cpw = (typeof getLearningPw === 'function') ? getLearningPw() : null;
      const body = document.getElementById('deviceCredBody');
      if (body) {
        if (cid && cpw) {
          body.innerHTML = '学习ID：<b>' + cid + '</b> · 固定口令（家长记好即可）';
        } else {
          body.textContent = '（未获取到凭证）';
        }
      }
    } catch (e) {}
  }
  if (cloud) {
    box.style.display = 'block';
    const s = getLocalStats();
    const d2 = loadData();
    let syncBox;
    if (typeof window.supabase === 'undefined') {
      syncBox = '<div style="margin:10px 0;padding:10px 12px;border:1px solid #cf1322;border-radius:10px;background:#fff1f0;color:#cf1322;font-size:12px;line-height:1.6"><b>云端同步不可用</b><br>Supabase SDK 未加载（网络受限时常见）。答题记录只存在本机。</div>';
    } else if (d2 && d2.syncError) {
      syncBox = '<div style="margin:10px 0;padding:10px 12px;border:1px solid #cf1322;border-radius:10px;background:#fff1f0;color:#cf1322;font-size:12px;line-height:1.6"><b>云端同步异常</b>（' + new Date(d2.syncError.time).toLocaleString('zh-CN') + '）<br>' + esc(d2.syncError.msg) + '<br><span style="color:#8c8c8c">答题记录只存在本机。请检查 Supabase 的 study_records 表 RLS 策略是否允许插入。</span></div>';
    } else {
      syncBox = '<div style="margin:10px 0;font-size:12px;color:var(--success)">✓ 云端同步正常</div>';
    }
    // 已配置固定学习ID/口令（如吕泳冀专属 LYJ-YONGJI）→ 打开即自动拉取家庭云端内容，家长无需手动登录即可看到
    if (cfg.LEARNING_ID && cfg.LEARNING_PW) {
      result.innerHTML = syncBox
        + '<div style="margin:8px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
        + '<button id="repairCloudBtn" class="btn" style="padding:6px 12px;font-size:12px" onclick="repairCloudFromLocal()">↥ 把本机记录合并同步到云端</button>'
        + '<span style="font-size:12px;color:#9AA3BD">若某次练习在家长端丢失，用「做过那次练习的手机」点此即可补回</span>'
        + '</div>'
        + '<div id="syncStatusBar" style="font-size:13px;color:#9AA3BD;padding:8px 0">正在同步家庭学习数据…</div>';
      renderRemote(cfg.LEARNING_ID, cfg.LEARNING_PW);
    } else {
      // 未配置固定凭证 → 本机预览 + 手动登录框
      const s = getLocalStats();
      result.innerHTML = syncBox + renderDashboard(s) + renderRecentPractice() + '<div id="aiMount"></div><div style="margin-top:14px;font-size:12px;color:#9AA3BD;text-align:center">▲ 本机数据 · 下方可输入其他学习凭证远程查看</div>';
      mountAiAnalysis('aiMount', 'local', null);
    }
  } else {
    box.style.display = 'none';
    const s = getLocalStats();
    result.innerHTML =
      '<div class="pp-note">当前为「本机预览」模式（数据存在这台手机本地）。部署到云端并填入 Supabase 后，家长可在自己手机上用学习ID+口令远程查看。</div>' +
      renderDashboard(s) + renderRecentPractice() + '<div id="aiMount"></div>';
    mountAiAnalysis('aiMount', 'local', null);
  }
}

// AI 学习分析版块挂载（本机全量 / 远程云端聚合）
function mountAiAnalysis(mountId, mode, cloudStats) {
  const mount = document.getElementById(mountId);
  if (!mount || typeof window.AI_ANALYSIS === 'undefined') return;
  try {
    const raw = (loadData() || {}).history || [];
    const dataset = mode === 'local' ? window.AI_ANALYSIS.normalize(raw) : [];
    window.AI_ANALYSIS.mount(mount, { dataset: dataset, mode: mode, cloudStats: cloudStats || null });
  } catch (e) {
    console.warn('mountAiAnalysis', e);
  }
}

// 根据远程 children 数据通道返回的最近练习，组装出 renderDashboard / mountAiAnalysis 需要的 stats 对象
function buildStatsFromRecent(records) {
  const byUnit = {};
  const byDay = {};
  let totalScore = 0, count = 0;
  const wrongs = [];
  (records || []).forEach(function (h) {
    count += 1;
    totalScore += (h.accuracy || 0);
    const u = h.unitName || '未知单元';
    if (!byUnit[u]) byUnit[u] = { correct: 0, total: 0, count: 0 };
    byUnit[u].correct += (h.score || 0);
    byUnit[u].total += (h.total || 0);
    byUnit[u].count += 1;
    const d = new Date(h.time || Date.now()).toISOString().slice(0, 10);
    byDay[d] = (byDay[d] || 0) + (h.total || 0);
    (h.wrong || []).forEach(function (w) { wrongs.push(w); });
  });
  const units = Object.keys(byUnit).map(function (u) {
    return {
      unit: u,
      accuracy: byUnit[u].total ? Math.round(byUnit[u].correct / byUnit[u].total * 100) : 0,
      count: byUnit[u].count
    };
  }).sort(function (a, b) { return a.accuracy - b.accuracy; });
  const avg = count ? Math.round(totalScore / count) : 0;
  const trend = Object.keys(byDay).sort().map(function (d) { return { date: d, count: byDay[d] }; });
  const weak = units.filter(function (u) { return u.count >= 1 && u.accuracy < 80; }).slice(0, 5);
  return { total: count, avg: avg, units: units, weak: weak, trend: trend, wrong: normalizeWrong(wrongs.slice(-8)) };
}

async function parentLogin() {
  const id = document.getElementById('parentId').value.trim();
  const pw = document.getElementById('parentPw').value.trim();
  if (!id || !pw) { alert('请填写学习ID和口令'); return; }
  const result = document.getElementById('parentResult');
  result.innerHTML = '<div id="syncStatusBar" style="font-size:13px;color:#9AA3BD;padding:8px 0">正在同步 ' + esc(id) + ' …</div>';
  renderRemote(id, pw);
}

function renderDashboard(s) {
  const unitBars = (s.units || []).slice(0, 12).map(u => {
    const w = Math.max(0, Math.min(100, u.accuracy));
    const color = u.accuracy >= 80 ? 'var(--success)' : u.accuracy >= 60 ? 'var(--warning)' : 'var(--accent)';
    return `<div class="pp-bar">
      <div class="pp-bar-top"><span>${u.unit}</span><span>${u.accuracy}% · ${u.count}次</span></div>
      <div class="pp-bar-track"><div class="pp-bar-fill" style="width:${w}%;background:${color}"></div></div>
    </div>`;
  }).join('');
  const weakHtml = (s.weak && s.weak.length)
    ? s.weak.map(u => `<span class="pp-weak">${u.unit}（${u.accuracy}%）</span>`).join('')
    : '<span class="pp-good">暂无明显薄弱点 🎉</span>';
  const trendHtml = (s.trend && s.trend.length)
    ? s.trend.map(t => `<div class="pp-dim">${t.date}：练习 ${t.count} 题</div>`).join('')
    : '<div class="pp-dim">暂无每日数据</div>';
  const wrongHtml = (s.wrong && s.wrong.length)
    ? s.wrong.map(w => {
        const q = w.question || {};
        return `<div class="pp-wrong-row">
          <div class="pp-dim">${esc(w.unitName)}${w.grade ? ' · ' + esc(String(w.grade)) + '年级' : ''}</div>
          ${q.passage ? `<div class="pp-passage">${esc(q.passage)}</div>` : ''}
          <div class="pp-wrong-q">${esc(q.question)}</div>
          ${q.svg ? `<div style="margin:4px 0">${q.svg}</div>` : ''}
          <div class="pp-dim" style="margin-top:2px">你的答案：<b class="pp-bad">${esc(w.userAnswer)}</b>　正确答案：<b class="pp-good">${esc(q.answer)}</b></div>
          ${q.explain ? `<div class="pp-dim" style="margin-top:2px">解析：${esc(q.explain)}</div>` : ''}
        </div>`;
      }).join('')
    : '<div class="pp-dim">暂无错题记录</div>';
  return `
    <div class="pp-stat-row">
      <div class="pp-stat"><div class="v" style="color:var(--primary)">${s.total || 0}</div><div class="l">练习次数</div></div>
      <div class="pp-stat"><div class="v" style="color:var(--success)">${s.avg || 0}%</div><div class="l">平均正确率</div></div>
      <div class="pp-stat"><div class="v" style="color:var(--accent)">${s.weak ? s.weak.length : 0}</div><div class="l">薄弱单元</div></div>
    </div>
    <div class="card" style="margin-bottom:12px"><div class="section-title">📅 每日练习量</div>${trendHtml}</div>
    <div class="card" style="margin-bottom:12px"><div class="section-title">📊 各单元正确率</div>${unitBars || '<div class="pp-dim">暂无数据</div>'}</div>
    <div class="card" style="margin-bottom:12px"><div class="section-title">🎯 薄弱点</div><div>${weakHtml}</div></div>
    <div class="card"><div class="section-title">❌ 最近错题</div>${wrongHtml}</div>
  `;
}

// ============================================================
// 最近练习（家长端本机预览）
// ============================================================

function formatRelativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return min + ' 分钟前';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' 小时前';
  const day = Math.floor(hr / 24);
  if (day < 7) return day + ' 天前';
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function formatFullTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function renderRecentPractice(source) {
  // 数据来源：远程云端登录传归一化数组；本机预览不传参数则读本地 history
  if (Array.isArray(source)) {
    _rpRecords = source.slice().sort((a, b) => (b.time || 0) - (a.time || 0));
  } else {
    const data = loadData();
    const history = (data.history || []).slice();
    // 旧数学记录无 module 字段，按数学兜底
    _rpRecords = history.map(h => ({
      module: h.module || '数学',
      grade: h.grade,
      unitName: h.unitName || '',
      score: h.score || 0,
      total: h.total || 0,
      accuracy: h.accuracy != null ? h.accuracy : (h.total ? Math.round(h.score / h.total * 100) : 0),
      time: h.time || 0,
      wrong: Array.isArray(h.wrong) ? h.wrong : []
    })).sort((a, b) => (b.time || 0) - (a.time || 0));
  }
  const list = _rpRecords.slice(0, 8);

  const head = '<div class="card rp-card" style="margin-bottom:12px"><div class="section-title">📝 最近练习</div>';

  if (!_rpRecords.length) {
    // 真正没有任何练习记录时才显示空状态（不再以「近 7 天」为门槛，避免历史内容被隐藏）
    return head +
      '<div class="rp-empty">' +
        '<div class="rp-empty-icon">📭</div>' +
        '<div class="rp-empty-title">还没有练习记录</div>' +
        '<div class="rp-empty-sub">鼓励孩子每天坚持练习，进步看得见～</div>' +
      '</div></div>';
  }

  const items = list.map((h, i) => {
    const isCn = h.module === '语文';
    const mod = isCn ? '语文' : '数学';
    const modCls = isCn ? 'rp-sub-cn' : 'rp-sub-math';
    const accCls = h.accuracy >= 80 ? 'rp-acc-ok' : h.accuracy >= 60 ? 'rp-acc-mid' : 'rp-acc-low';
    // 期中/期末/月考为考试条目，加考试徽标
    const isExam = /期中|期末|月考/.test(h.unitName || '');
    return '<div class="rp-item" onclick="showPracticeDetail(' + i + ')">' +
      '<div class="rp-subject ' + modCls + '">' + mod + (isExam ? ' 📄' : '') + '</div>' +
      '<div class="rp-main">' +
        '<div class="rp-title">' + (h.grade ? esc(String(h.grade)) + '年级 · ' : '') + esc(h.unitName) + '</div>' +
        '<div class="rp-meta">' +
          '<span class="rp-acc ' + accCls + '">' + h.accuracy + '%</span>' +
          '<span class="rp-count">' + h.total + ' 题</span>' +
          '<span class="rp-time">' + formatRelativeTime(h.time) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="rp-arrow">›</div>' +
    '</div>';
  }).join('');

  return head +
    '<div id="rpList">' + items + '</div>' +
    '<div id="rpDetail" style="display:none"></div>' +
    '</div>';
}

function showPracticeDetail(i) {
  const h = _rpRecords[i];
  if (!h) return;
  const listEl = document.getElementById('rpList');
  const detEl = document.getElementById('rpDetail');
  if (!listEl || !detEl) return;
  const isCn = (h.module || '数学') === '语文';
  const acc = h.accuracy != null ? h.accuracy : (h.total ? Math.round(h.score / h.total * 100) : 0);
  const wrongs = Array.isArray(h.wrong) ? h.wrong : [];
  const wrongHtml = wrongs.length
    ? wrongs.map(w => {
        const q = w.question || {};
        const passage = q.passage ? '<div class="rp-passage">' + esc(q.passage) + '</div>' : '';
        const opts = (Array.isArray(q.options) && q.options.length)
          ? '<div class="rp-opts">' + q.options.map((o, idx) => {
              const oStr = String(o);
              const isAns = (oStr === String(q.answer)) || (oStr.indexOf(String(q.answer) + '.') === 0);
              return '<div class="rp-opt' + (isAns ? ' rp-opt-ans' : '') + '">' + String.fromCharCode(65 + idx) + '. ' + esc(o) + (isAns ? ' ✓' : '') + '</div>';
            }).join('') + '</div>'
          : '';
        const svg = q.svg ? '<div class="rp-svg">' + q.svg + '</div>' : '';
        const explain = q.explain ? '<div class="rp-explain">解析：' + esc(q.explain) + '</div>' : '';
        return '<div class="rp-wrong-item">' +
          passage +
          '<div class="rp-wq">' + esc(q.question || '') + '</div>' +
          svg + opts +
          '<div class="rp-ans-row"><span class="rp-ua">你的答案：' + esc(w.userAnswer) + '</span><span class="rp-ca">正确答案：' + esc(q.answer) + '</span></div>' +
          explain +
        '</div>';
      }).join('')
    : '<div class="rp-dim">本次练习全部答对，没有错题 🎉</div>';

  detEl.innerHTML =
    '<div class="rp-detail-head">' +
      '<button class="rp-back" onclick="hidePracticeDetail()">‹ 返回</button>' +
      '<div class="rp-detail-title">' + (isCn ? '语文' : '数学') + (h.grade ? ' · ' + h.grade + '年级' : '') + '</div>' +
    '</div>' +
    '<div class="rp-detail-unit">' + esc(h.unitName || '') + '</div>' +
    '<div class="rp-summary">' +
      '<span>正确率 <b class="' + (acc >= 80 ? 'rp-acc-ok' : acc >= 60 ? 'rp-acc-mid' : 'rp-acc-low') + '">' + acc + '%</b></span>' +
      '<span>答对 ' + (h.score || 0) + '/' + (h.total || 0) + ' 题</span>' +
      '<span>' + formatFullTime(h.time) + '</span>' +
    '</div>' +
    '<div class="rp-section-title">答题情况</div>' +
    '<div class="rp-overview">' +
      '<div class="rp-ov"><div class="rp-ov-v">' + (h.total || 0) + '</div><div class="rp-ov-l">练习题数</div></div>' +
      '<div class="rp-ov"><div class="rp-ov-v">' + (h.score || 0) + '</div><div class="rp-ov-l">答对</div></div>' +
      '<div class="rp-ov"><div class="rp-ov-v">' + wrongs.length + '</div><div class="rp-ov-l">错题</div></div>' +
    '</div>' +
    '<div class="rp-section-title">错题汇总（' + wrongs.length + '）</div>' +
    wrongHtml;
  listEl.style.display = 'none';
  detEl.style.display = 'block';
}

function hidePracticeDetail() {
  const listEl = document.getElementById('rpList');
  const detEl = document.getElementById('rpDetail');
  if (listEl) listEl.style.display = 'block';
  if (detEl) { detEl.style.display = 'none'; detEl.innerHTML = ''; }
}
