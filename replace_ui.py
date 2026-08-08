import re

p = 'js/english.js'
s = open(p, encoding='utf-8').read()

# 1) IPA 首页 hero -> eng-hero（用 .*? 吃掉中间点，避免编码差异）
pat1 = re.compile(
    r"let html = '<div class=\"card\" style=\"background:linear-gradient\(135deg,var\(--primary\),var\(--primary-light\)\);color:#fff\">'\s*\n"
    r"\s*\+ '<div style=\"font-size:17px;font-weight:700\">国际音标 IPA</div>'\s*\n"
    r"\s*\+ '<div style=\"font-size:13px;opacity:\.9;margin-top:4px\">标准 44 音素.*?每课 5 步闭环</div></div>'",
    re.DOTALL)
new1 = ("let html = '<div class=\"eng-hero\">'\n"
        "      + '<div class=\"hero-title\">国际音标 IPA</div>'\n"
        "      + '<div class=\"hero-sub\">标准 44 音素 · 共 ' + d.lessons.length + ' 课 · 每课 5 步闭环</div></div>'")
assert pat1.search(s), 'IPA hero 未匹配'
s = pat1.sub(new1, s)

# 2) IPA 课程卡 -> 加序号徽章 + 完成标记
pat2 = re.compile(r"html \+= '<div class=\"lesson-card\" onclick=\"openIpaLesson\(.*?</div></div>';", re.DOTALL)
new2 = ("      html += '<div class=\"lesson-card\" onclick=\"openIpaLesson(\\' + ls.id + \\')>\">'\n"
        "        + (isLessonDone(ls.id) ? '<div class=\"lesson-done\">✓</div>' : '')\n"
        "        + '<div class=\"lesson-badge\">' + ls.id.toUpperCase().slice(0, 3) + '</div>'\n"
        "        + '<div class=\"lesson-no\">' + ls.id.toUpperCase() + '</div>'\n"
        "        + '<div class=\"lesson-name\">' + ls.title + '</div>'\n"
        "        + '<div class=\"lesson-sub\">' + ls.sub + '</div></div>';")
assert pat2.search(s), 'IPA lesson-card 未匹配'
s = pat2.sub(new2, s)

# 3) 自然拼读播放器头部 -> player-head + 步骤进度条
old3 = ("  let html = '<div class=\"card\"><div style=\"font-weight:700;font-size:16px\">' + ls.title + '</div>'"
        "    + '<div class=\"pill\" style=\"margin-top:6px\">' + ls.sub + '</div></div>';")
new3 = ("  let html = '<div class=\"player-head\"><div class=\"player-title\">' + ls.title + '</div>"
        "<div class=\"pill\">' + ls.sub + '</div></div>'"
        " + '<div class=\"stepper\" id=\"phStepper\">' + buildStepper(['要领', '听音', '跟读', '辨词', '巩固']) + '</div>';")
assert old3 in s, 'phonics player head 未匹配'
s = s.replace(old3, new3)

# 4) 国际音标播放器头部 -> player-head + 步骤进度条
old4 = ("  let html = '<div class=\"card\"><div style=\"font-weight:700;font-size:16px\">' + ls.title + '</div>"
        "    <div class=\"pill\" style=\"margin-top:6px\">' + ls.sub + '</div></div>';")
new4 = ("  let html = '<div class=\"player-head\"><div class=\"player-title\">' + ls.title + '</div>"
        "<div class=\"pill\">' + ls.sub + '</div></div>'"
        " + '<div class=\"stepper\" id=\"ipaStepper\">' + buildStepper(['要领', '听音', '跟读', '辨词', '巩固']) + '</div>';")
assert old4 in s, 'ipa player head 未匹配'
s = s.replace(old4, new4)

# 5) phonicsStep 更新进度条
old5 = ("function phonicsStep(dir) {\n"
        "  const steps = document.querySelectorAll('#englishRoot .step');\n"
        "  phStep = Math.max(0, Math.min(steps.length - 1, phStep + dir));\n"
        "  steps.forEach((s, i) => s.classList.toggle('active', i === phStep));\n"
        "}")
new5 = ("function phonicsStep(dir) {\n"
        "  const steps = document.querySelectorAll('#englishRoot .step');\n"
        "  phStep = Math.max(0, Math.min(steps.length - 1, phStep + dir));\n"
        "  steps.forEach((s, i) => s.classList.toggle('active', i === phStep));\n"
        "  updateStepper('phStepper', phStep);\n"
        "}")
assert old5 in s, 'phonicsStep 未匹配'
s = s.replace(old5, new5)

# 6) ipaStep 更新进度条
old6 = ("function ipaStep(dir) {\n"
        "  const steps = document.querySelectorAll('#englishRoot .step');\n"
        "  ipaStepIdx = Math.max(0, Math.min(steps.length - 1, ipaStepIdx + dir));\n"
        "  steps.forEach((s, i) => s.classList.toggle('active', i === ipaStepIdx));\n"
        "}")
new6 = ("function ipaStep(dir) {\n"
        "  const steps = document.querySelectorAll('#englishRoot .step');\n"
        "  ipaStepIdx = Math.max(0, Math.min(steps.length - 1, ipaStepIdx + dir));\n"
        "  steps.forEach((s, i) => s.classList.toggle('active', i === ipaStepIdx));\n"
        "  updateStepper('ipaStepper', ipaStepIdx);\n"
        "}")
assert old6 in s, 'ipaStep 未匹配'
s = s.replace(old6, new6)

# 7) 追加辅助函数
helper = """

/* 课程完成标记 / 步骤进度条 */
function isLessonDone(id) {
  try { const s = (loadData().stats) || {}; return !!(s['ph_' + id] || s['ipa_' + id]); } catch (e) { return false; }
}
function buildStepper(labels) {
  let h = '';
  labels.forEach((lb, i) => {
    h += '<div class="step-dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '"><div class="dot">' + (i + 1) + '</div><div class="lbl">' + lb + '</div></div>';
    if (i < labels.length - 1) h += '<div class="step-line"></div>';
  });
  return h;
}
function updateStepper(id, idx) {
  const box = document.getElementById(id); if (!box) return;
  const dots = box.querySelectorAll('.step-dot');
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === idx);
    d.classList.toggle('done', i < idx);
    const dot = d.querySelector('.dot'); if (dot) dot.textContent = i < idx ? '✓' : (i + 1);
  });
  const lines = box.querySelectorAll('.step-line');
  lines.forEach((l, i) => l.classList.toggle('filled', i < idx));
}
"""
s = s.rstrip('\n') + '\n' + helper

open(p, 'w', encoding='utf-8').write(s)
print('OK: 全部替换完成')
