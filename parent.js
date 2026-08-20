// ===== 成长中心（原「统计页 + 家长后台」合并版，v41）=====
// 版面结构（浅色明亮主题）：
//   [学习概览] 4 张统计卡
//   [学习报告] AI 分析版块（走势/单元表现/归因/风险/方案）→ 近期练习 → 最近错题
//   [家长管理] 学习凭证 → 同步状态 → 远程查看 → 数据与报告工具

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

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
  const avg = history.length ? Math.round(history.reduce((s, h) => s + (h.accuracy || 0), 0) / history.length) : 0;
  return { total: history.length, avg, units, weak, wrong: normalizeWrong((data.wrong || []).slice(-5)) };
}

// ============ 分区标题（金色竖条 · 浅色） ============
function sectionTitle(text, sub) {
  return '<div style="display:flex;align-items:baseline;gap:8px;margin:18px 0 10px">' +
    '<span style="display:inline-block;width:4px;height:16px;background:#B4945A;border-radius:2px;align-self:center"></span>' +
    '<span style="font-size:15px;font-weight:800;color:#3E4A63;letter-spacing:1px">' + text + '</span>' +
    (sub ? '<span style="font-size:11px;color:#9AA3BD;font-weight:400">' + sub + '</span>' : '') +
    '</div>';
}

// ============ 学习概览 4 卡（浅色） ============
function overviewHtml(s, d2) {
  const wrongAll = (d2 && d2.wrong) || [];
  const mathWrong = wrongAll.filter(w => !w.module || w.module === '数学').length;
  const cnWrong = wrongAll.filter(w => w.module === '语文').length;
  const wrongTotal = mathWrong + cnWrong;
  return '<div class="stats-overview" style="margin-bottom:6px">' +
    '<div class="stat-card highlight"><div class="stat-value">' + (s.total || 0) + '</div><div class="stat-label">练习次数</div></div>' +
    '<div class="stat-card success"><div class="stat-value">' + (s.avg || 0) + '%</div><div class="stat-label">平均正确率</div></div>' +
    '<div class="stat-card warning"><div class="stat-value">' + (s.weak ? s.weak.length : 0) + '</div><div class="stat-label">薄弱单元</div></div>' +
    '<div class="stat-card danger"><div class="stat-value">' + wrongTotal + '</div><div class="stat-label">错题数</div></div>' +
    '</div>';
}

// ============ 近期练习（最近 8 条 · 紧凑浅色列表） ============
function recentListHtml() {
  const hist = (loadData().history || []).slice(0, 8);
  if (!hist.length) return '<div class="card"><div class="pp-dim">还没有练习记录，快去完成一次练习吧。</div></div>';
  const gradeNames = { 1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级' };
  const rows = hist.map(r => {
    const subject = (r.module === '语文') ? '语文' : ((r.unitName || '').indexOf('语文') >= 0 ? '语文' : '数学');
    const subjColor = subject === '语文' ? '#B4945A' : '#3E4A63';
    const accColor = r.accuracy >= 80 ? '#389e0d' : r.accuracy >= 60 ? '#d46b08' : '#cf1322';
    const d = new Date(r.time);
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1px solid #F0EEE7;border-radius:10px;margin-bottom:8px">' +
      '<span style="flex-shrink:0;font-size:10px;font-weight:700;color:' + subjColor + ';background:' + subjColor + '14;padding:2px 8px;border-radius:99px">' + subject + '</span>' +
      '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#3E4A63;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.unitName || '') + '</div>' +
      '<div style="font-size:11px;color:#9AA3BD">' + (d.getMonth() + 1) + '/' + d.getDate() + ' · ' + (r.score || 0) + '/' + (r.total || 0) + ' 题</div></div>' +
      '<span style="flex-shrink:0;font-size:16px;font-weight:800;color:' + accColor + '">' + (r.accuracy || 0) + '%</span></div>';
  }).join('');
  return '<div>' + rows + '</div>';
}

// ============ 最近错题（最近 5 条 · 浅色） ============
function wrongListHtml() {
  const list = normalizeWrong((loadData().wrong || []).slice(-5));
  if (!list.length) return '<div class="card"><div class="pp-dim">暂无错题记录，继续保持。</div></div>';
  const rows = list.map(w => {
    const q = w.question || {};
    const subject = (w.unitName || '').indexOf('语文') >= 0 ? '语文' : '数学';
    const subjColor = subject === '语文' ? '#B4945A' : '#3E4A63';
    return '<div style="padding:10px 12px;background:#fff;border:1px solid #F0EEE7;border-radius:10px;margin-bottom:8px">' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">' +
      '<span style="font-size:10px;font-weight:700;color:' + subjColor + ';background:' + subjColor + '14;padding:2px 8px;border-radius:99px">' + subject + '</span>' +
      '<span style="font-size:11px;color:#9AA3BD;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(w.unitName) + '</span></div>' +
      (q.passage ? '<div style="font-size:11px;color:#8c8c8c;background:#FAF8F2;border-radius:6px;padding:6px 8px;margin-bottom:6px;line-height:1.6;max-height:64px;overflow-y:auto">' + esc(q.passage) + '</div>' : '') +
      '<div style="font-size:13px;color:#3E4A63;line-height:1.5">' + esc(q.question) + '</div>' +
      (q.svg ? '<div style="margin:4px 0">' + q.svg + '</div>' : '') +
      '<div style="font-size:11.5px;color:#8c8c8c;margin-top:4px">你的答案：<span style="color:#cf1322;font-weight:700">' + esc(w.userAnswer) + '</span>　正确答案：<span style="color:#389e0d;font-weight:700">' + esc(q.answer) + '</span></div>' +
      (q.explain ? '<div style="font-size:11.5px;color:#8c8c8c;margin-top:2px">解析：' + esc(q.explain) + '</div>' : '') +
      '</div>';
  }).join('');
  return '<div>' + rows + '</div>';
}

// ============ 家长管理 · 同步状态（浅色） ============
function syncStatusHtml() {
  const cfg = window.APP_CONFIG;
  if (!cfg || !cfg.USE_CLOUD) {
    return '<div style="padding:10px 12px;background:#FAF8F2;border:1px solid #F0EEE7;border-radius:10px;font-size:12px;color:#8c8c8c;line-height:1.6">当前为「本机模式」（云端未启用），学习记录保存在这台设备。启用云端后家长可远程查看。</div>';
  }
  const d2 = loadData();
  if (typeof window.supabase === 'undefined') {
    return '<div style="padding:10px 12px;background:#FFF7F0;border:1px solid #FFD8BF;border-radius:10px;font-size:12px;color:#d46b08;line-height:1.6"><b>云端同步不可用</b><br>Supabase SDK 未加载（网络受限时常见）。答题记录只存在本机。</div>';
  }
  if (d2 && d2.syncError) {
    return '<div style="padding:10px 12px;background:#FFF1F0;border:1px solid #FFCCC7;border-radius:10px;font-size:12px;color:#cf1322;line-height:1.6"><b>云端同步异常</b>（' + new Date(d2.syncError.time).toLocaleString('zh-CN') + '）<br>' + esc(d2.syncError.msg) + '<br><span style="color:#8c8c8c">答题记录只存在本机。请检查 Supabase 的 study_records 表 RLS 策略是否允许插入。</span></div>';
  }
  return '<div style="padding:10px 12px;background:#F6FFED;border:1px solid #D9F7BE;border-radius:10px;font-size:12px;color:#389e0d">✓ 云端同步正常，答题记录已自动上传</div>';
}

// ============ 家长管理 · 学习凭证 + 远程查看 + 数据工具 ============
function parentToolsHtml(cfg) {
  let credHtml = '';
  try {
    const cid = (typeof getLearningId === 'function') ? getLearningId() : null;
    if (cid) {
      credHtml = '<div style="padding:12px;background:#F0F7FF;border:1px solid #C8E2FF;border-radius:10px;margin-bottom:10px;font-size:12.5px;color:#1d4ed8;line-height:1.7">' +
        '<b style="font-size:13px">吕泳冀 · 学习凭证</b><br>学习ID：<b>' + esc(cid) + '</b>　口令：家长自行记好（固定不变）<br>' +
        '<span style="color:#475569;font-size:11.5px">所有设备自动共享此身份。家长在自己手机上打开本应用 → 进入「成长」→ 在下方输入学习ID和口令即可远程查看。</span></div>';
    }
  } catch (e) {}

  const loginHtml = cfg && cfg.USE_CLOUD
    ? '<div style="background:#fff;border:1px solid #F0EEE7;border-radius:10px;padding:12px;margin-bottom:10px">' +
      '<div style="font-size:13.5px;font-weight:700;color:#3E4A63;margin-bottom:8px">远程查看其他设备的学习数据</div>' +
      '<input id="parentId" placeholder="学习ID（如 LYJ3X9ZQ）" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #E5E0D3;border-radius:8px;box-sizing:border-box;font-size:16px;background:#FCFBF8">' +
      '<input id="parentPw" type="password" placeholder="口令" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #E5E0D3;border-radius:8px;box-sizing:border-box;font-size:16px;background:#FCFBF8">' +
      '<button class="btn btn-primary" style="width:100%" onclick="parentLogin()">查看远程数据</button>' +
      '<div id="remotePanel" style="margin-top:10px"></div></div>'
    : '';

  const toolsHtml = '<div style="background:#fff;border:1px solid #F0EEE7;border-radius:10px;padding:12px">' +
    '<div style="font-size:13.5px;font-weight:700;color:#3E4A63;margin-bottom:8px">数据与报告</div>' +
    '<div style="font-size:11.5px;color:#8c8c8c;line-height:1.6;margin-bottom:10px">学习记录保存在本机浏览器。换设备前先导出备份，到新设备再导入。</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
    '<button class="btn btn-outline" style="font-size:12px" onclick="exportUserData()">导出学习数据</button>' +
    '<button class="btn btn-outline" style="font-size:12px" onclick="document.getElementById(&#39;importFile&#39;).click()">导入学习数据</button>' +
    '<button class="btn btn-outline" style="font-size:12px" onclick="exportWrongBookText()">导出错题本</button>' +
    '<button class="btn btn-primary" style="font-size:12px" onclick="window.AI_ANALYSIS && AI_ANALYSIS._currentId && AI_ANALYSIS.exportReport(AI_ANALYSIS._currentId)">导出分析报告</button>' +
    '</div>' +
    '<input type="file" id="importFile" accept=".json,application/json" style="display:none" onchange="importUserData(event)"></div>';

  return credHtml + loginHtml + toolsHtml;
}

// ============ 主渲染 ============
function renderParent() {
  const mount = document.getElementById('growthMount');
  if (!mount) return;
  const cfg = window.APP_CONFIG;
  const s = getLocalStats();
  const d2 = loadData();

  mount.innerHTML =
    overviewHtml(s, d2) +
    sectionTitle('学习报告', '基于孩子实际练习数据自动生成') +
    '<div id="aiMount"></div>' +
    sectionTitle('近期练习', '最近 8 次') +
    recentListHtml() +
    sectionTitle('最近错题', '最近 5 题') +
    wrongListHtml() +
    sectionTitle('家长管理', '凭证 · 同步 · 远程 · 数据') +
    '<div id="mgmtMount">' + parentToolsHtml(cfg) + '</div>' +
    '<div style="margin:14px 0 6px;font-size:11px;color:#9AA3BD;text-align:center">本页数据仅存于设备与云端，家长随时可查</div>';

  // 同步状态放在家长管理区开头
  const mgmt = document.getElementById('mgmtMount');
  mgmt.innerHTML = syncStatusHtml() + '<div style="height:10px"></div>' + mgmt.innerHTML;

  mountAiAnalysis('aiMount', 'local', null);
}

// AI 学习分析版块挂载（本机全量 / 远程云端聚合）
function mountAiAnalysis(mountId, mode, cloudStats) {
  const mount = document.getElementById(mountId);
  if (!mount || typeof window.AI_ANALYSIS === 'undefined') return;
  try {
    const raw = (loadData() || {}).history || [];
    const dataset = mode === 'local' ? window.AI_ANALYSIS.normalize(raw) : [];
    window.AI_ANALYSIS.mount(mount, { dataset: dataset, mode: mode, cloudStats: cloudStats || null });
    const block = mount.querySelector('[id^="aiBlock_"]');
    if (block) window.AI_ANALYSIS._currentId = block.id;
  } catch (e) {
    console.warn('mountAiAnalysis', e);
  }
}

// 远程查看：登录成功后渲染云端看板（浅色），本机报告保持不变
async function parentLogin() {
  const id = document.getElementById('parentId').value.trim();
  const pw = document.getElementById('parentPw').value.trim();
  if (!id || !pw) { alert('请填写学习ID和口令'); return; }
  const stats = await getChildStats(id, pw);
  const panel = document.getElementById('remotePanel');
  if (!panel) return;
  if (!stats) { panel.innerHTML = '<p style="color:#cf1322;font-size:13px;margin:8px 0">未找到该学习ID，或口令不正确。</p>'; return; }

  const overview = '<div class="stats-overview" style="margin-bottom:6px">' +
    '<div class="stat-card highlight"><div class="stat-value">' + (stats.total || 0) + '</div><div class="stat-label">累计练习</div></div>' +
    '<div class="stat-card success"><div class="stat-value">' + (stats.avg || 0) + '%</div><div class="stat-label">平均正确率</div></div>' +
    '<div class="stat-card warning"><div class="stat-value">' + ((stats.weak && stats.weak.length) || 0) + '</div><div class="stat-label">薄弱单元</div></div>' +
    '<div class="stat-card danger"><div class="stat-value">' + ((stats.wrong && stats.wrong.length) || 0) + '</div><div class="stat-label">近期错题</div></div>' +
    '</div>';

  panel.innerHTML = '<div style="border-top:1px dashed #E5E0D3;margin-top:4px;padding-top:12px">' +
    '<div style="font-size:12.5px;font-weight:700;color:#3E4A63;margin-bottom:8px">远程数据 · ' + esc(id) + '</div>' +
    overview +
    '<div id="aiRemoteMount"></div>' +
    '<div style="font-size:11px;color:#9AA3BD;text-align:center;margin-top:8px">远程数据来自云端汇总，仅含各单元正确率与最近错题</div>' +
    '</div>';
  mountAiAnalysis('aiRemoteMount', 'cloud', stats);
  const block = panel.querySelector('[id^="aiBlock_"]');
  if (block) window.AI_ANALYSIS._currentId = block.id;
}
