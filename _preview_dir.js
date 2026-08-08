const fs = require('fs');
const vm = require('vm');
const dir = 'c:/Users/Administrator/WorkBuddy/2026-08-05-10-06-13/吕泳冀学习站PWA/';

let code = fs.readFileSync(dir + 'js/math.js', 'utf8');
code = code.replace(/\nrenderHome\(\);\s*$/, '\n'); // strip bootstrap

const ctx = {};
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'math.js' });

const wrap = (svg) => '<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" style="width:240px;height:200px;border:1px solid #ccc;border-radius:8px;background:#fff">' + svg + '</svg>';

const samples = [
  ['方向标·北', ctx.svgCompassArrow('北')],
  ['方向标·东', ctx.svgCompassArrow('东')],
  ['方向标·西南', ctx.svgCompassArrow('西南')],
  ['玫瑰图·东北', ctx.svgRose4('东北')],
  ['玫瑰图·西', ctx.svgRose4('西')],
  ['地图·书店在小明家东', ctx.svgMap4('东','小明家','书店')],
  ['地图·医院在学校南', ctx.svgMap4('南','学校','医院')],
];

let html = '<!doctype html><meta charset="utf-8"><title>位置与方向·箭头预览</title>'
  + '<style>body{font-family:sans-serif;background:#f5f5f5;padding:20px}figure{display:inline-block;margin:10px;text-align:center}figcaption{font-size:12px;color:#666;margin-top:4px}</style>'
  + '<h1>位置与方向 图形箭头预览（带箭头头部）</h1>';
for (const [cap, svg] of samples) {
  html += '<figure>' + wrap(svg) + '<figcaption>' + cap + '</figcaption></figure>';
}
fs.writeFileSync(dir + 'preview_dir.html', html);
console.log('preview written, samples:', samples.length);
for (const [cap, svg] of samples) {
  console.log(cap, '| line:', /<line/.test(svg), '| arrowhead(polygon):', /<polygon/.test(svg));
}
