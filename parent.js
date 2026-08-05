// ===== 家长后台 =====

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
        svg: q.svg || ''
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
          body.innerHTML = '学习ID：<b>' + cid + '</b> &nbsp;&nbsp; 口令：<b>' + cpw + '</b>' +
            (cloud ? '' : ' <span style="color:#874d00">（开启云端后可远程查看）</span>');
        } else {
          body.textContent = '（未获取到凭证）';
        }
      }
    } catch (e) {}
  }
  if (cloud) {
    box.style.display = 'block';
    result.innerHTML = '<p style="color:var(--text-lighter);font-size:13px">输入孩子的学习ID与口令，即可远程查看学习情况。</p>';
  } else {
    box.style.display = 'none';
    const s = getLocalStats();
    result.innerHTML =
      '<div style="background:#fff7e6;border:1px solid #ffd591;padding:8px 10px;border-radius:8px;font-size:12px;color:#874d00;margin-bottom:10px">' +
      '当前为「本机预览」模式（数据存在这台手机本地）。部署到云端并填入 Supabase 后，家长可在自己手机上用学习ID+口令远程查看。</div>' +
      renderDashboard(s);
  }
}

async function parentLogin() {
  const id = document.getElementById('parentId').value.trim();
  const pw = document.getElementById('parentPw').value.trim();
  if (!id || !pw) { alert('请填写学习ID和口令'); return; }
  const stats = await getChildStats(id, pw);
  const result = document.getElementById('parentResult');
  if (!stats) { result.innerHTML = '<p style="color:#cf1322">未找到该学习ID，或口令不正确。</p>'; return; }
  result.innerHTML = renderDashboard(stats, true);
}

function renderDashboard(s) {
  const unitBars = (s.units || []).slice(0, 12).map(u => {
    const w = Math.max(0, Math.min(100, u.accuracy));
    const color = u.accuracy >= 80 ? 'var(--success)' : u.accuracy >= 60 ? 'var(--warning)' : 'var(--accent)';
    return `<div style="margin:6px 0">
      <div style="display:flex;justify-content:space-between;font-size:13px"><span>${u.unit}</span><span>${u.accuracy}% · ${u.count}次</span></div>
      <div style="height:8px;background:#eee;border-radius:4px;overflow:hidden"><div style="width:${w}%;height:100%;background:${color}"></div></div>
    </div>`;
  }).join('');
  const weakHtml = (s.weak && s.weak.length)
    ? s.weak.map(u => `<span style="display:inline-block;background:#fff1f0;color:#cf1322;border:1px solid #ffccc7;padding:3px 8px;border-radius:10px;font-size:12px;margin:3px">${u.unit}（${u.accuracy}%）</span>`).join('')
    : '<span style="color:var(--success)">暂无明显薄弱点 🎉</span>';
  const trendHtml = (s.trend && s.trend.length)
    ? s.trend.map(t => `<div style="font-size:12px;color:var(--text-light)">${t.date}：练习 ${t.count} 题</div>`).join('')
    : '<div style="font-size:12px;color:var(--text-lighter)">暂无每日数据</div>';
  const wrongHtml = (s.wrong && s.wrong.length)
    ? s.wrong.map(w => {
        const q = w.question || {};
        return `<div style="padding:8px 0;border-bottom:1px solid #f0f0f0">
          <div style="font-size:12px;color:var(--text-light)">${esc(w.unitName)}${w.grade ? ' · ' + esc(String(w.grade)) + '年级' : ''}</div>
          <div style="font-size:14px;font-weight:600;margin:3px 0">${esc(q.question)}</div>
          ${q.svg ? `<div style="margin:4px 0">${q.svg}</div>` : ''}
          <div style="font-size:13px;margin-top:2px">你的答案：<b style="color:var(--accent)">${esc(w.userAnswer)}</b>　正确答案：<b style="color:var(--success)">${esc(q.answer)}</b></div>
          ${q.explain ? `<div style="font-size:12px;color:var(--text-light);margin-top:2px">解析：${esc(q.explain)}</div>` : ''}
        </div>`;
      }).join('')
    : '<div style="font-size:12px;color:var(--text-lighter)">暂无错题记录</div>';
  return `
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <div style="flex:1;background:#e6f0ff;border-radius:10px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--primary)">${s.total || 0}</div><div style="font-size:12px;color:var(--text-light)">练习次数</div></div>
      <div style="flex:1;background:#e8f7e8;border-radius:10px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--success)">${s.avg || 0}%</div><div style="font-size:12px;color:var(--text-light)">平均正确率</div></div>
      <div style="flex:1;background:#fff1f0;border-radius:10px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent)">${s.weak ? s.weak.length : 0}</div><div style="font-size:12px;color:var(--text-light)">薄弱单元</div></div>
    </div>
    <div class="card" style="margin-bottom:12px"><div class="section-title">📅 每日练习量</div>${trendHtml}</div>
    <div class="card" style="margin-bottom:12px"><div class="section-title">📊 各单元正确率</div>${unitBars || '<div style="font-size:12px;color:var(--text-lighter)">暂无数据</div>'}</div>
    <div class="card" style="margin-bottom:12px"><div class="section-title">🎯 薄弱点</div><div>${weakHtml}</div></div>
    <div class="card"><div class="section-title">❌ 最近错题</div>${wrongHtml}</div>
  `;
}
