const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

const base = 'C:/Users/Administrator/WorkBuddy/2026-08-05-10-06-13/吕泳冀学习站PWA';
const htmlPath = path.join(base, 'index.html');
const SMOKE_URL = process.env.SMOKE_URL || ('file://' + htmlPath);
const html = fs.readFileSync(htmlPath, 'utf8');

const errors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: SMOKE_URL,
  pretendToBeVisual: true,
  beforeParse(window) {
    window.addEventListener('error', e => errors.push('window.error: ' + (e.error && e.error.stack || e.message)));
    const oe = window.console.error.bind(window.console);
    window.console.error = (...a) => { errors.push('console.error: ' + a.map(String).join(' ')); };
  }
});

setTimeout(() => {
  const w = dom.window;
  console.log('supabase 全局类型      :', typeof w.supabase, '| createClient:', typeof (w.supabase && w.supabase.createClient));
  console.log('window.App 已定义      :', typeof w.App);
  console.log('mathRoot 存在          :', !!w.document.getElementById('mathRoot'));
  const gg = w.document.getElementById('gradeGrid');
  console.log('gradeGrid 子节点数     :', gg ? gg.children.length : 'NULL');
  const links = [...w.document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href'));
  console.log('样式表                 :', links.join(', '));
  const scripts = [...w.document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));
  console.log('外链脚本(应全本地)     :', scripts.join(', '));
  console.log('捕获的脚本错误数       :', errors.length);
  errors.slice(0, 12).forEach(e => console.log('   - ' + e.slice(0, 200)));
  process.exit(0);
}, 2000);
