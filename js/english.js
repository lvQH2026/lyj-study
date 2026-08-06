// ============================================================
// 英语模块（自然拼读 + 国际音标）
// 与数学共享 math_practice_data 存储：错题写入 data.wrong（带 module:'英语'），
// 正确率写入 data.stats（键名 eng_*），家长视图可统一查看。
// ============================================================
const DATA = window.ENG_DATA;

/* Hy3 可选反馈层：无密钥时降级为预设文案 */
const HY3 = {
  configured: false,
  async call(prompt) {
    if (!this.configured) return null;
    try {
      // 真实接入示例（需配置端点/密钥）：
      // const r = await fetch(HY3_ENDPOINT, {method:'POST', headers:{'Authorization':`Bearer ${KEY}`}, body:JSON.stringify({prompt})});
      // return (await r.json()).text;
    } catch (e) { return null; }
    return null;
  },
  async encourage(score) {
    const preset = score >= 90 ? '发音真标准，了不起！继续保持～'
      : score >= 70 ? '很不错，再多听几遍就会更顺口啦！'
      : '勇敢开口就是进步，我们再试一次！';
    const ai = await this.call('鼓励二年级孩子跟读，得分' + score);
    return ai || preset;
  },
  async explain(item) {
    const preset = '正确答案：' + item.answer + '。' + (item.hint || '多听标准发音，注意口型，再跟读几遍就会了。');
    const ai = await this.call('用儿童语言讲解：' + JSON.stringify(item));
    return ai || preset;
  }
};

/* 发音 / 识别 工具 */
function speak(text, lang) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang || 'en-US'; u.rate = 0.9; u.pitch = 1; u.volume = 1;
  const fire = () => { try { synth.speak(u); } catch (e) {} };
  // 移动端修复：cancel 紧跟 speak 会吞掉首个音频；若正在播放则取消后延迟再播
  if (synth.speaking || synth.pending) {
    try { synth.cancel(); } catch (e) {}
    setTimeout(fire, 60);
  } else {
    fire();
  }
  // iOS Safari：首个音频常需 pause/resume 触发
  const ua = navigator.userAgent || '';
  if (/iP(ad|hone|od)/i.test(ua)) {
    setTimeout(() => { try { synth.pause(); synth.resume(); } catch (e) {} }, 220);
  }
}
function recogSupported() { return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window); }
let _recog = null;
function startRecog(expected, cb) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { cb({ supported: false }); return; }
  // 复用单实例：浏览器全局只允许一个识别会话，复用可避免 "already started"
  let r = _recog;
  if (!r) { try { r = new SR(); _recog = r; } catch (e) { cb({ supported: false }); return; } }
  let done = false;
  const finish = (res) => { if (done) return; done = true; clearTimeout(safety); cb(res); };
  r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
  r.onresult = (e) => {
    const alts = [];
    for (let i = 0; i < e.results[0].length; i++) alts.push((e.results[0][i].transcript || '').toLowerCase().trim());
    finish({ supported: true, alts });
  };
  r.onerror = (e) => {
    const err = e && e.error;
    if (err === 'no-speech') finish({ supported: true, error: '没听到声音，请再试一次' });
    else if (err === 'not-allowed' || err === 'service-not-allowed') finish({ supported: true, error: '麦克风权限被拒绝，请在浏览器设置中允许使用麦克风' });
    else if (err === 'network') finish({ supported: true, error: '网络异常，识别失败' });
    else if (err === 'aborted') finish({ supported: true, error: '已取消' });
    else finish({ supported: true, error: err || '识别失败' });
  };
  r.onend = () => {};
  const safety = setTimeout(() => { try { r.stop(); } catch (_) {} finish({ supported: true, error: '识别超时，请再试一次' }); }, 9000);
  try { r.start(); }
  catch (e) {
    // 上次会话未正常结束：先停再试
    try { r.stop(); } catch (_) {}
    setTimeout(() => { try { r.start(); } catch (_) { finish({ supported: false }); } }, 120);
  }
}
function scoreRead(alts, expected) {
  expected = expected.toLowerCase().trim();
  if (alts.indexOf(expected) >= 0) return 100;
  for (const a of alts) { if (a.indexOf(expected) >= 0 || expected.indexOf(a) >= 0) return 85; }
  let hit = 0; for (const ch of expected) { if (alts.join(' ').indexOf(ch) >= 0) hit++; }
  return Math.max(40, Math.round(hit / expected.length * 80));
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* 视图状态 */
let mainTab = 'phonics';
const viewStack = [];
function setView(title, render, showBack) {
  document.getElementById('engNavTitle').textContent = title;
  document.getElementById('engBackBtn').style.display = showBack ? 'flex' : 'none';
  render();
}
function engGoBack() {
  if (viewStack.length) {
    const v = viewStack.pop();
    setView(v.title, v.render, viewStack.length > 0);
  }
}
function switchMain(tab) {
  viewStack.length = 0;
  mainTab = tab;
  document.querySelectorAll('#englishRoot .nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'phonics') renderPhonicsHome();
  else if (tab === 'ipa') renderIpaHome();
  else if (tab === 'progress') renderProgress();
  else renderWrong();
}

/* ============ 自然拼读 ============ */
function renderPhonicsHome() {
  const d = DATA.phonics;
  viewStack.length = 0;
  setView(d.title, () => {
    let lessonCount = 0; d.levels.forEach(l => lessonCount += l.lessons.length);
    let html = '<div class="card" style="background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff">'
      + '<div style="font-size:17px;font-weight:700">自然拼读 Phonics</div>'
      + '<div style="font-size:13px;opacity:.9;margin-top:4px">四级体系 · 共 ' + d.levels.length + ' 级 ' + lessonCount + ' 课 · 每课 5 步闭环 + 20 个单词 · 关卡全开放</div></div>';
    d.levels.forEach((lv, li) => {
      html += '<div class="section-title">' + lv.no + ' · ' + lv.name + '</div><div class="lesson-grid">';
      lv.lessons.forEach((ls) => {
        html += '<div class="lesson-card" onclick="openPhonicsLesson(' + li + ',\'' + ls.id + '\')">'
          + '<div class="lesson-no">' + ls.id.toUpperCase() + '</div>'
          + '<div class="lesson-name">' + ls.title + '</div>'
          + '<div class="lesson-sub">' + ls.sub + '</div></div>';
      });
      html += '</div>';
    });
    document.getElementById('engBody').innerHTML = html;
  }, false);
}
function openPhonicsLesson(li, id) {
  const lv = DATA.phonics.levels[li];
  const ls = lv.lessons.find(x => x.id === id);
  viewStack.push({ title: DATA.phonics.title, render: renderPhonicsHome });
  setView(ls.title, () => renderPhonicsPlayer(ls), true);
}
function renderPhonicsPlayer(ls) {
  const words = ls.words;
  const stepDefs = [
    { t: '看符号 + 文字发音要领', body:
        '<div class="symbol-big">' + ls.sym + '</div>'
        + '<div class="tip-box">' + ls.tip + '</div>' },
    { t: '听标准发音（' + words.length + ' 个单词）', body:
        '<p class="muted-note">点击「听」逐词听美式发音，可反复听</p>'
        + '<div class="word-list" id="listenList"></div>' },
    { t: '麦克风跟读打分（Hy3 鼓励）', body:
        '<div id="recogBox" style="text-align:center;padding:8px 0">'
        + '<button class="btn-primary" onclick="doPhonicsRecog(\'' + ls.id + '\')">开始跟读</button>'
        + '<div class="muted-note" id="recogNote"></div></div>' },
    { t: '听音辨别选择题', body:
        '<div class="muted-note">听单词，从选项中选出你听到的词（本轮共 10 题，完成后记录正确率）</div>'
        + '<div id="disBox"></div>' },
    { t: '错题自动入错题库（Hy3 讲解）', body:
        '<p class="muted-note">听音辨选答错会自动记录到错题本，讲解由 Hy3 生成（无密钥时降级）。</p>'
        + '<button class="btn-ghost" style="width:100%" onclick="switchMain(\'wrong\')">查看错题本</button>' }
  ];
  let html = '<div class="card"><div style="font-weight:700;font-size:16px">' + ls.title + '</div>'
    + '<div class="pill" style="margin-top:6px">' + ls.sub + '</div></div>';
  stepDefs.forEach((s, i) => {
    if (i === 3) {
      html += '<div class="card step' + (i === 0 ? ' active' : '') + '" data-step="' + i + '">'
        + '<div class="step-title"><span class="step-num">' + (i + 1) + '</span>' + s.t + '</div>'
        + '<div class="step-wrap" style="margin-top:10px">' + s.body + '</div></div>';
    } else {
      html += '<div class="card step' + (i === 0 ? ' active' : '') + '" data-step="' + i + '">'
        + '<div class="step-title"><span class="step-num">' + (i + 1) + '</span>' + s.t + '</div>'
        + '<div class="step-wrap" style="margin-top:10px">' + s.body + '</div></div>';
    }
  });
  html += '<div class="btn-row" style="margin-top:6px">'
    + '<button class="btn-ghost" style="flex:1" onclick="phonicsStep(-1)">上一步</button>'
    + '<button class="btn-primary" style="flex:1" onclick="phonicsStep(1)">下一步</button></div>';
  document.getElementById('engBody').innerHTML = html;
  const listen = document.getElementById('listenList');
  words.forEach(w => listen.appendChild(makeWordChip(w)));
  startPhonicsDis(ls);
}
function makeWordChip(w) {
  const div = document.createElement('div');
  div.className = 'word-chip';
  div.innerHTML = '<span><span class="word-spell">' + w.w.toLowerCase() + '</span><span class="word-mean">' + (w.m || '') + '</span></span>';
  const b = document.createElement('button');
  b.className = 'icon-btn'; b.textContent = '听';
  b.onclick = () => speak(w.w);
  div.appendChild(b);
  return div;
}
let phStep = 0;
function phonicsStep(dir) {
  const steps = document.querySelectorAll('#englishRoot .step');
  phStep = Math.max(0, Math.min(steps.length - 1, phStep + dir));
  steps.forEach((s, i) => s.classList.toggle('active', i === phStep));
}
function doPhonicsRecog(id) {
  const ls = findPhonics(id); if (!ls) return;
  const target = ls.words[Math.floor(Math.random() * ls.words.length)].w;
  const note = document.getElementById('recogNote');
  if (!recogSupported()) {
    note.innerHTML = '<span style="color:var(--warning)">当前环境不支持麦克风，已模拟跟读（' + target + '）</span>';
    HY3.encourage(95).then(t => note.innerHTML += '<br><span style="color:var(--success)">' + t + '</span>');
    return;
  }
  note.textContent = '🎤 聆听中，请跟读：' + target;
  startRecog(target, (res) => {
    if (!res.supported) { note.textContent = '麦克风不可用'; return; }
    if (res.error) { note.textContent = '识别失败：' + res.error; return; }
    const sc = scoreRead(res.alts, target);
    HY3.encourage(sc).then(t => note.innerHTML = '得分 ' + sc + ' · ' + t);
  });
}
let phDis = null;
function startPhonicsDis(ls) {
  const q = shuffle(ls.words.map(w => w.w)).slice(0, Math.min(ls.words.length, 10));
  phDis = { ls, queue: q, idx: 0, correct: 0, total: q.length };
  renderPhonicsDis();
}
function renderPhonicsDis() {
  const box = document.getElementById('disBox'); if (!box) return;
  if (phDis.idx >= phDis.total) {
    const acc = Math.round(phDis.correct / phDis.total * 100);
    recordAccuracy('ph_' + phDis.ls.id, phDis.ls.title, phDis.correct, phDis.total);
    box.innerHTML = '<div class="feedback ok" style="display:block">本轮完成！正确 ' + phDis.correct + ' / ' + phDis.total + '（正确率 ' + acc + '%）</div>'
      + '<button class="btn-ghost" style="width:100%;margin-top:10px" onclick="switchMain(\'progress\')">查看学习进度</button>';
    return;
  }
  const target = phDis.queue[phDis.idx];
  const others = shuffle(phDis.ls.words.map(w => w.w).filter(w => w !== target)).slice(0, 3);
  const opts = shuffle([target].concat(others));
  box.innerHTML = '<p class="muted-note">第 ' + (phDis.idx + 1) + ' / ' + phDis.total + ' 题 · 点击播放，选出你听到的单词</p>'
    + '<button class="btn-gold" style="width:100%;margin:8px 0" onclick="speak(\'' + target + '\')">▶ 播放单词</button>'
    + '<div id="optWrap"></div>'
    + '<div id="disFeedback" class="feedback" style="display:none"></div>';
  const wrap = box.querySelector('#optWrap');
  opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'option-btn'; b.textContent = o.toLowerCase();
    b.onclick = () => {
      const fb = box.querySelector('#disFeedback');
      if (o === target) {
        b.classList.add('correct');
        fb.className = 'feedback ok'; fb.style.display = 'block';
        fb.textContent = '答对了！';
        phDis.correct++;
        setTimeout(() => { phDis.idx++; renderPhonicsDis(); }, 650);
      } else {
        b.classList.add('wrong');
        fb.className = 'feedback no'; fb.style.display = 'block';
        fb.textContent = '正确答案：' + target.toLowerCase();
        HY3.explain({ answer: target.toLowerCase(), hint: phDis.ls.tip }).then(t => {
          fb.innerHTML = '答错了 · ' + t;
        });
        addWrong({ module: '自然拼读', lesson: phDis.ls.title, prompt: '听音辨词', answer: target.toLowerCase(), your: o.toLowerCase() });
        setTimeout(() => { phDis.idx++; renderPhonicsDis(); }, 1400);
      }
    };
    wrap.appendChild(b);
  });
}

/* ============ 国际音标 ============ */
function renderIpaHome() {
  const d = DATA.ipa;
  viewStack.length = 0;
  setView(d.title, () => {
    let html = '<div class="card" style="background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff">'
      + '<div style="font-size:17px;font-weight:700">国际音标 IPA</div>'
      + '<div style="font-size:13px;opacity:.9;margin-top:4px">标准 44 音素 · 共 8 课 · 每课 5 步闭环</div></div>'
      + '<div class="section-title">课程列表</div><div class="lesson-grid">';
    d.lessons.forEach((ls) => {
      html += '<div class="lesson-card" onclick="openIpaLesson(\'' + ls.id + '\')">'
        + '<div class="lesson-no">' + ls.id.toUpperCase() + '</div>'
        + '<div class="lesson-name">' + ls.title + '</div>'
        + '<div class="lesson-sub">' + ls.sub + '</div></div>';
    });
    html += '</div>';
    document.getElementById('engBody').innerHTML = html;
  }, false);
}
function openIpaLesson(id) {
  const ls = DATA.ipa.lessons.find(x => x.id === id);
  viewStack.push({ title: DATA.ipa.title, render: renderIpaHome });
  setView(ls.title, () => renderIpaPlayer(ls), true);
}
function renderIpaPlayer(ls) {
  const phs = ls.phonemes;
  const stepDefs = [
    { t: '看符号 + 文字发音要领', body: '<div id="ipaSymBox"></div>' },
    { t: '听标准发音', body: '<p class="muted-note">点击播放该音标的例词（美式）</p><div id="ipaListen" class="word-list"></div>' },
    { t: '麦克风跟读打分（Hy3 鼓励）', body: '<div id="ipaRecog" style="text-align:center;padding:8px 0"><button class="btn-primary" onclick="doIpaRecog(\'' + ls.id + '\')">开始跟读</button><div class="muted-note" id="ipaRecogNote"></div></div>' },
    { t: '听音辨别选择题', body: '<div id="ipaDis"></div>' },
    { t: '错题自动入错题库（Hy3 讲解）', body: '<p class="muted-note">答错自动记录，讲解由 Hy3 生成（无密钥降级）。</p><button class="btn-ghost" style="width:100%" onclick="switchMain(\'wrong\')">查看错题本</button>' }
  ];
  let html = '<div class="card"><div style="font-weight:700;font-size:16px">' + ls.title + '</div><div class="pill" style="margin-top:6px">' + ls.sub + '</div></div>';
  stepDefs.forEach((s, i) => {
    html += '<div class="card step' + (i === 0 ? ' active' : '') + '" data-step="' + i + '"><div class="step-title"><span class="step-num">' + (i + 1) + '</span>' + s.t + '</div><div class="step-wrap" style="margin-top:10px">' + s.body + '</div></div>';
  });
  html += '<div class="btn-row" style="margin-top:6px"><button class="btn-ghost" style="flex:1" onclick="ipaStep(-1)">上一步</button><button class="btn-primary" style="flex:1" onclick="ipaStep(1)">下一步</button></div>';
  document.getElementById('engBody').innerHTML = html;
  const symBox = document.getElementById('ipaSymBox');
  phs.forEach(p => {
    const c = document.createElement('div');
    c.className = 'card'; c.style.marginBottom = '10px';
    c.innerHTML = '<div class="phoneme-big">' + p.sym + '</div><div class="tip-box" style="margin:10px 0 0">' + p.tip + '</div>';
    symBox.appendChild(c);
  });
  const listen = document.getElementById('ipaListen');
  phs.forEach(p => {
    const m = p.tip.match(/如\s*([a-zA-Z]+)/); const ex = m ? m[1] : '';
    const c = document.createElement('div'); c.className = 'word-chip';
    c.innerHTML = '<span><span class="word-spell">' + p.sym + '</span><span class="word-mean">' + (ex || '') + '</span></span>';
    const b = document.createElement('button'); b.className = 'icon-btn'; b.textContent = '听';
    b.onclick = () => speak(ex || p.sym.replace(/[\/]/g, ''));
    c.appendChild(b); listen.appendChild(c);
  });
  renderIpaDis(ls, 0);
}
let ipaStepIdx = 0;
function ipaStep(dir) {
  const steps = document.querySelectorAll('#englishRoot .step');
  ipaStepIdx = Math.max(0, Math.min(steps.length - 1, ipaStepIdx + dir));
  steps.forEach((s, i) => s.classList.toggle('active', i === ipaStepIdx));
}
function doIpaRecog(id) {
  const ls = DATA.ipa.lessons.find(x => x.id === id); if (!ls) return;
  const p = ls.phonemes[Math.floor(Math.random() * ls.phonemes.length)];
  const m = p.tip.match(/如\s*([a-zA-Z]+)/); const ex = m ? m[1] : p.sym.replace(/[\/]/g, '');
  const note = document.getElementById('ipaRecogNote');
  if (!recogSupported()) {
    note.innerHTML = '<span style="color:var(--warning)">当前环境不支持麦克风，已模拟跟读（' + ex + '）</span>';
    HY3.encourage(95).then(t => note.innerHTML += '<br><span style="color:var(--success)">' + t + '</span>');
    return;
  }
  note.textContent = '🎤 聆听中，请跟读：' + ex;
  startRecog(ex, (res) => {
    if (!res.supported) { note.textContent = '麦克风不可用'; return; }
    if (res.error) { note.textContent = '识别失败：' + res.error; return; }
    const sc = scoreRead(res.alts, ex);
    HY3.encourage(sc).then(t => note.innerHTML = '得分 ' + sc + ' · ' + t);
  });
}
function renderIpaDis(ls, idx) {
  const box = document.getElementById('ipaDis'); if (!box) return;
  const phs = ls.phonemes;
  const target = phs[idx % phs.length];
  const m = target.tip.match(/如\s*([a-zA-Z]+)/); const ex = m ? m[1] : target.sym.replace(/[\/]/g, '');
  const others = shuffle(phs.filter(p => p !== target)).slice(0, 3);
  const opts = shuffle([target].concat(others));
  box.innerHTML = '<p class="muted-note">第 ' + (idx + 1) + ' 题 · 播放例词，选出对应音标</p>'
    + '<button class="btn-gold" style="width:100%;margin:8px 0" onclick="speak(\'' + ex + '\')">▶ 播放例词</button>'
    + '<div id="optWrap"></div><div id="ipaFb" class="feedback" style="display:none"></div>';
  const wrap = box.querySelector('#optWrap');
  opts.forEach(o => {
    const b = document.createElement('button'); b.className = 'option-btn'; b.textContent = o.sym;
    b.onclick = () => {
      const fb = box.querySelector('#ipaFb');
      if (o === target) {
        b.classList.add('correct'); fb.className = 'feedback ok'; fb.style.display = 'block'; fb.textContent = '答对了！';
        if (idx + 1 < phs.length) setTimeout(() => renderIpaDis(ls, idx + 1), 700);
      } else {
        b.classList.add('wrong'); fb.className = 'feedback no'; fb.style.display = 'block'; fb.textContent = '正确答案：' + target.sym;
        HY3.explain({ answer: target.sym, hint: target.tip }).then(t => fb.innerHTML = '答错了 · ' + t);
        addWrong({ module: '国际音标', lesson: ls.title, prompt: '听音辨音标', answer: target.sym, your: o.sym });
      }
    };
    wrap.appendChild(b);
  });
}

/* ============ 错题库（与数学共享 math_practice_data） ============ */
function loadEnglishWrong() {
  const data = (typeof loadData === 'function') ? loadData() : (JSON.parse(localStorage.getItem('math_practice_data') || '{}'));
  return (data.wrong || []).filter(w => w.module === '英语');
}
function renderWrong() {
  viewStack.length = 0;
  setView('错题本', () => {
    const list = loadEnglishWrong();
    let html = '<div class="card" style="display:flex;justify-content:space-between;align-items:center">'
      + '<div><div style="font-weight:700">错题本</div><div class="muted-note" style="text-align:left">共 ' + list.length + ' 条</div></div>'
      + (list.length ? '<button class="btn-ghost" onclick="clearWrong()">清空</button>' : '') + '</div>';
    if (!list.length) { html += '<div class="empty">还没有错题，加油练习！</div>'; }
    list.forEach(r => {
      const q = r.question || {};
      html += '<div class="wrong-item"><div class="w-top">' + (r.unitName || '') + '</div>'
        + '<div class="w-body">正确答案：' + (q.answer || '') + '</div>'
        + (r.userAnswer ? '<div class="w-ans">你的作答：' + r.userAnswer + '</div>' : '')
        + '<div class="muted-note" style="text-align:left">' + (r.time || '') + '</div></div>';
    });
    document.getElementById('engBody').innerHTML = html;
  }, false);
}
function clearWrong() {
  let data = (typeof loadData === 'function') ? loadData() : (JSON.parse(localStorage.getItem('math_practice_data') || '{}'));
  data.wrong = (data.wrong || []).filter(w => w.module !== '英语');
  if (typeof saveData === 'function') saveData(data);
  else localStorage.setItem('math_practice_data', JSON.stringify(data));
  renderWrong();
}

/* 工具 */
function findPhonics(id) { for (const lv of DATA.phonics.levels) { const f = lv.lessons.find(x => x.id === id); if (f) return f; } return null; }

/* ============ 正确率统计（家长监督，写入共享 stats） ============ */
function recordAccuracy(id, title, correct, total) {
  let data = (typeof loadData === 'function') ? loadData() : (JSON.parse(localStorage.getItem('math_practice_data') || '{}'));
  if (!data.stats) data.stats = {};
  data.stats['eng_' + id] = {
    title, correct, total,
    acc: Math.round(correct / total * 100),
    time: new Date().toLocaleString('zh-CN'),
    done: true, module: '英语'
  };
  if (typeof saveData === 'function') saveData(data);
  else localStorage.setItem('math_practice_data', JSON.stringify(data));
}
function clearStats() {
  let data = (typeof loadData === 'function') ? loadData() : (JSON.parse(localStorage.getItem('math_practice_data') || '{}'));
  if (!data.stats) data.stats = {};
  Object.keys(data.stats).forEach(k => { if (k.indexOf('eng_') === 0) delete data.stats[k]; });
  if (typeof saveData === 'function') saveData(data);
  else localStorage.setItem('math_practice_data', JSON.stringify(data));
  renderProgress();
}

/* 家长视图：学习进度 */
function renderProgress() {
  viewStack.length = 0;
  setView('学习进度', () => {
    let data = (typeof loadData === 'function') ? loadData() : (JSON.parse(localStorage.getItem('math_practice_data') || '{}'));
    const stats = data.stats || {};
    const levels = DATA.phonics.levels;
    let totalLessons = 0, doneLessons = 0, accSum = 0, accCount = 0;
    levels.forEach(lv => lv.lessons.forEach(ls => {
      totalLessons++;
      const s = stats['eng_ph_' + ls.id];
      if (s && s.done) { doneLessons++; accSum += s.acc; accCount++; }
    }));
    const overall = accCount ? Math.round(accSum / accCount) : 0;
    let html = '<div class="card" style="background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff">'
      + '<div style="font-size:17px;font-weight:700">学习进度（家长视图）</div>'
      + '<div style="font-size:13px;opacity:.9;margin-top:4px">自然拼读 · 已学 ' + doneLessons + ' / ' + totalLessons + ' 课 · 平均正确率 ' + (accCount ? overall + '%' : '—') + '</div></div>'
      + '<div class="muted-note" style="text-align:left;margin:10px 4px 4px">软件仅记录正确率数据，供家长监督学习进度。</div>';
    levels.forEach(lv => {
      html += '<div class="section-title">' + lv.no + ' · ' + lv.name + '</div>';
      lv.lessons.forEach(ls => {
        const s = stats['eng_ph_' + ls.id];
        const badge = (s && s.done)
          ? '<span class="pill" style="color:var(--success);background:rgba(78,140,110,.1)">' + s.acc + '%</span>'
          : '<span class="pill" style="color:var(--text-lighter)">未学</span>';
        html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px">'
          + '<div><div style="font-weight:600;font-size:14px">' + ls.title + '</div>'
          + '<div class="muted-note" style="text-align:left">' + ls.sub + (s && s.done ? (' · ' + s.time) : '') + '</div></div>'
          + badge + '</div>';
      });
    });
    html += '<div class="btn-row" style="margin-top:8px">'
      + '<button class="btn-ghost" style="flex:1" onclick="clearStats()">清空进度</button>'
      + '<button class="btn-ghost" style="flex:1" onclick="switchMain(\'phonics\')">返回学习</button></div>';
    document.getElementById('engBody').innerHTML = html;
  }, false);
}

/* 统一错题写入：写入 math_practice_data.wrong，带 module:'英语' 标记 */
function addWrong(rec) {
  let data = (typeof loadData === 'function') ? loadData() : (JSON.parse(localStorage.getItem('math_practice_data') || '{}'));
  if (!data.wrong) data.wrong = [];
  const questionText = (rec.prompt ? rec.prompt + '：' : '') + (rec.answer || '');
  const item = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    question: { question: questionText, answer: rec.answer },
    userAnswer: rec.your || '',
    unitName: '英语 · ' + (rec.module || '') + ' · ' + (rec.lesson || ''),
    grade: '',
    module: '英语',
    time: new Date().toLocaleString('zh-CN'),
    count: 1
  };
  const ex = data.wrong.find(w => w.module === '英语' && w.question.question === item.question.question && w.question.answer === item.question.answer);
  if (ex) { ex.count = (ex.count || 1) + 1; ex.lastWrong = Date.now(); }
  else data.wrong.push(item);
  if (typeof saveData === 'function') saveData(data);
  else localStorage.setItem('math_practice_data', JSON.stringify(data));
}

/* 暴露全局（供 index.html 内联 onclick 调用） */
window.DATA = DATA;
window.switchMain = switchMain;
window.engGoBack = engGoBack;
window.openPhonicsLesson = openPhonicsLesson;
window.openIpaLesson = openIpaLesson;
window.doPhonicsRecog = doPhonicsRecog;
window.doIpaRecog = doIpaRecog;
window.speak = speak;
window.clearWrong = clearWrong;
window.phonicsStep = phonicsStep;
window.ipaStep = ipaStep;
window.addWrong = addWrong;
window.startPhonicsDis = startPhonicsDis;
window.renderProgress = renderProgress;
window.clearStats = clearStats;

/* 启动：渲染英语首页到隐藏的 engBody（切到英语模块时即显示） */
switchMain('phonics');
