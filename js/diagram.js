// ============================================================
// 交互动画图解库 (Interactive SVG Diagrams)
// 每个组件: function(container, opts) → 渲染 SVG + 拖拽交互
// 统一配色: 黛蓝 #3E4A63 / 香槟金 #B4945A / 米白 #F7F6F2
// 移动端友好: 全部使用 pointer 事件 (鼠标/触摸通用)
// ============================================================

const DC = {
  ink:'#3E4A63', gold:'#B4945A', bg:'#F7F6F2', green:'#4E8C6E',
  red:'#E57373', amber:'#C08A3E', blue:'#6B7894', light:'#9AA0AB', line:'#D9D4C7'
};

function dg(tag, attrs, parent){
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]);
  if(parent) parent.appendChild(e);
  return e;
}
function dgt(svg, x, y, s, size, color, anchor){
  const t = dg('text', {x:x, y:y, 'font-size':size||12, fill:color||DC.ink,
    'font-family':'sans-serif', 'text-anchor':anchor||'middle',
    'font-weight':(size&&size>=14)?'bold':'normal'});
  t.textContent = s;
  svg.appendChild(t);
  return t;
}
function dgBg(svg, w, h){
  dg('rect', {x:0, y:0, width:w, height:h, rx:12, fill:DC.bg}, svg);
}
function dgPoint(svg, ev){
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  return { x:(ev.clientX-r.left)/r.width*vb.width, y:(ev.clientY-r.top)/r.height*vb.height };
}
// 拖拽助手：标准 pointer 事件 + setPointerCapture，拖动的节点不会被重绘销毁时可稳定工作
function dgDrag(svg, node, onMove){
  node.style.cursor='grab';
  node.style.touchAction='none';
  node.addEventListener('pointerdown', function(e){
    e.preventDefault();
    try{ node.setPointerCapture(e.pointerId); }catch(_){}
    node.style.cursor='grabbing';
    const mv = function(ev){ onMove(dgPoint(svg, ev)); };
    const up = function(){ node.removeEventListener('pointermove', mv); node.removeEventListener('pointerup', up); node.style.cursor='grab'; };
    node.addEventListener('pointermove', mv);
    node.addEventListener('pointerup', up);
    mv(e);
  });
}
// 滑块：沿水平轨道拖动，返回 {set, handle}
function dgSlider(svg, x, y, w, min, max, val, color, onInput, fmt){
  dg('line', {x1:x, y1:y, x2:x+w, y2:y, stroke:DC.line, 'stroke-width':4, 'stroke-linecap':'round'}, svg);
  const handle = dg('circle', {cx:x+(val-min)/(max-min)*w, cy:y, r:9, fill:color||DC.gold, stroke:'#fff', 'stroke-width':2}, svg);
  const t = dg('text', {x:x+w/2, y:y+20, 'font-size':11, fill:'#5C6370', 'text-anchor':'middle'}, svg);
  function upd(v){ v=Math.max(min,Math.min(max,v)); handle.setAttribute('cx', x+(v-min)/(max-min)*w); if(fmt) t.textContent=fmt(v); onInput(v); }
  dgDrag(svg, handle, function(p){ upd(min+(p.x-x)/w*(max-min)); });
  upd(val);
  return { set:upd };
}
function dgMake(container, w, h){
  container.innerHTML='';
  const svg = dg('svg', {viewBox:`0 0 ${w} ${h}`, style:`width:100%;max-width:${w}px;touch-action:none;user-select:none;display:block;margin:0 auto`});
  container.appendChild(svg);
  return svg;
}

// ============================================================
// 轻奢画框共享助手（主站黛蓝/香槟金/米白体系）
// ============================================================
// 白色圆角画板卡片：在米白底上叠一张白卡，内容绘制在卡内（坐标为整图坐标，卡仅作底衬）
function luxCard(svg, x, y, w, h){
  dg('rect',{x:x, y:y, width:w, height:h, rx:14, fill:'#FFFFFF', stroke:DC.line, 'stroke-width':1.5}, svg);
  return {x:x, y:y, w:w, h:h};
}
// 信息脚卡：#F3EEE3 圆角卡；字符串中 *段* 用香槟金高亮（如 '面积 *9600*'）
function luxInfo(svg, x, y, w, h){
  dg('rect',{x:x, y:y, width:w, height:h, rx:10, fill:'#F3EEE3', stroke:DC.line, 'stroke-width':1}, svg);
  const g=dg('g',{},svg);
  return function(s){
    g.innerHTML='';
    const t=dg('text',{x:x+w/2, y:y+h/2+5, 'font-size':13, fill:DC.ink, 'text-anchor':'middle', 'font-weight':'bold'}, g);
    String(s).split('*').forEach((seg,i)=>{ dg('tspan',{fill: i%2===1?DC.gold:DC.ink}, t).textContent=seg; });
  };
}
// 标准轻奢滑块：金色手柄 + 浅色轨道 + 居中标签（复用 dgSlider）
function luxSlider(svg, x, y, w, min, max, val, onInput, fmt){
  return dgSlider(svg, x, y, w, min, max, val, DC.gold, onInput, fmt);
}


// ---------- 1. 数轴 ----------
function diagNumberLine(container, opts){
  opts = opts||{};
  const min = opts.min!=null?opts.min:0, max = opts.max!=null?opts.max:20;
  const W=360, H=224;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '数轴 · 拖动小球定位', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 150);
  const x0=40, x1=320, y=112;
  dg('line',{x1:x0,y1:y,x2:x1,y2:y,stroke:DC.ink,'stroke-width':2},svg);
  const span=max-min;
  const tickCount = span<=24 ? span : (span<=60 ? 12 : 10);
  for(let i=0;i<=tickCount;i++){
    const v=min+span*i/tickCount, x=x0+(x1-x0)*i/tickCount;
    dg('line',{x1:x,y1:y-5,x2:x,y2:y+5,stroke:DC.ink,'stroke-width':1.5},svg);
    const showLabel = tickCount<=12 ? true : (i%2===0);
    if(showLabel) dgt(svg,x,y+22,String(v),10,DC.light);
  }
  const setInfo = luxInfo(svg, 22, 196, 316, 30);
  const marker = dg('circle',{cx:x1,cy:y,r:10,fill:DC.red,stroke:'#fff','stroke-width':2,style:'cursor:grab'},svg);
  const flag = dg('line',{x1:x1,y1:y-10,x2:x1,y2:y-24,stroke:DC.red,'stroke-width':1.5},svg);
  function place(v){ v=Math.max(min,Math.min(max,v)); const x=x0+(x1-x0)*(v-min)/span; marker.setAttribute('cx',x); flag.setAttribute('x1',x); flag.setAttribute('x2',x); setInfo('拖动小球 → 数值 *'+v+'*'); }
  dgDrag(svg, marker, function(p){ place(min+Math.round((p.x-x0)/(x1-x0)*span)); });
  place(max);
}

// ---------- 2. 位值积木 ----------
function diagPlaceValue(container){
  const svg = dgMake(container, 360, 230);
  dgBg(svg,360,230);
  dgt(svg,180,26,'拖动滑块组数（百位/十位/个位）',11,DC.gold);
  const vals=[1,4,7]; // 百 十 个 默认
  // 每个数位独立分组，各自只清自己的块（避免互相抹除）
  const gB=dg('g',{},svg), gS=dg('g',{},svg), gG=dg('g',{},svg);
  function drawBlocks(g, cx, cy, kind, n){
    g.innerHTML='';
    if(kind===0){ // 百: 10×10 大正方形，n 个并排叠层表示
      for(let i=0;i<n;i++){ dg('rect',{x:cx-28+i*5,y:cy-28,width:56,height:56,rx:4,fill:DC.blue,opacity:0.9-i*0.05,stroke:'#fff','stroke-width':1},g); }
    } else if(kind===1){ // 十: 长条，n 根
      for(let i=0;i<n;i++){ dg('rect',{x:cx-28,y:cy-22+i*8,width:56,height:7,rx:2,fill:DC.green,opacity:0.92},g); }
    } else { // 个: 小方块，每个一个
      for(let i=0;i<n;i++){ dg('rect',{x:cx-22+(i%5)*11,y:cy-18+Math.floor(i/5)*11,width:9,height:9,rx:2,fill:DC.gold},g); }
    }
  }
  const numT = dgt(svg,180,212,'',22,DC.ink);
  function upd(){
    const num=vals[0]*100+vals[1]*10+vals[2];
    numT.textContent='组成的数：'+num;
    drawBlocks(gB,60,118,0,vals[0]); drawBlocks(gS,180,118,1,vals[1]); drawBlocks(gG,300,118,2,vals[2]);
  }
  dgt(svg,60,150,'百位',11,DC.blue); dgt(svg,180,150,'十位',11,DC.green); dgt(svg,300,150,'个位',11,DC.gold);
  dgSlider(svg,30,185,60,0,9,vals[0],DC.blue,v=>{vals[0]=Math.round(v);upd();});
  dgSlider(svg,150,185,60,0,9,vals[1],DC.green,v=>{vals[1]=Math.round(v);upd();});
  dgSlider(svg,270,185,60,0,9,vals[2],DC.gold,v=>{vals[2]=Math.round(v);upd();});
  upd();
}

// ---------- 3. 加法竖式(拖动揭示步骤) ----------
function diagAddColumn(container, opts){
  opts=opts||{};
  let a = opts.a!=null?opts.a: 348, b = opts.b!=null?opts.b: 257;
  if(a<b){const t=a;a=b;b=t;}
  const svg = dgMake(container, 360, 240);
  dgBg(svg,360,240);
  const stepT = dgt(svg,180,28,'拖动滑块，逐步看进位',11,DC.gold);
  const da=a.toString().split('').map(Number), db=b.toString().split('').map(Number);
  const L=Math.max(da.length,db.length);
  while(da.length<L)da.unshift(0); while(db.length<L)db.unshift(0);
  const cx=300, top=70, dh=36;
  const xs=[]; for(let i=0;i<L;i++) xs[i]=cx-i*36;
  function draw(step){
    svg.querySelectorAll('.adyn').forEach(n=>n.remove());
    // 数字
    for(let i=0;i<L;i++){
      const g=dg('g',{class:'adyn'},svg);
      dgt(g, xs[i], top+12, da[i]||'', 18, DC.ink);
      dgt(g, xs[i], top+dh+12, db[i]||'', 18, DC.ink);
      dg('line',{x1:cx+18,y1:top+dh+22,x2:xs[L-1]-14,y2:top+dh+22,stroke:DC.ink,'stroke-width':1.5},g);
    }
    let carry=0;
    for(let i=0;i<L;i++){
      const s=da[L-1-i]+db[L-1-i]+carry;
      const res=s%10, c=Math.floor(s/10);
      if(step>i){
        const g=dg('g',{class:'adyn'},svg);
        dgt(g, xs[L-1-i], top+2*dh+12, res, 18, DC.green);
        if(c && i<L-1) dgt(g, xs[L-1-i]+14, top+dh+2, c, 13, DC.red);
      }
      carry=c;
    }
    if(step>=L && carry){ const g=dg('g',{class:'adyn'},svg); dgt(g, xs[0]+14, top+2*dh+12, carry, 18, DC.green); }
  }
  const info = dgt(svg,180,222,'答案：'+ (a+b),13,DC.ink);
  dgSlider(svg,40,205,280,0,L,a>b?0:0,DC.gold,v=>{draw(Math.round(v));}, v=>'步骤 '+Math.round(v)+' / '+L);
  draw(0);
}

// ---------- 4. 减法竖式(退位) ----------
function diagSubColumn(container, opts){
  opts=opts||{};
  let a = opts.a!=null?opts.a: 503, b = opts.b!=null?opts.b: 268;
  if(a<b){const t=a;a=b;b=t;}
  const svg = dgMake(container, 360, 240);
  dgBg(svg,360,240);
  dgt(svg,180,28,'拖动滑块，逐步看退位',11,DC.gold);
  const da=a.toString().split('').map(Number), db=b.toString().split('').map(Number);
  const L=Math.max(da.length,db.length);
  while(da.length<L)da.unshift(0); while(db.length<L)db.unshift(0);
  const cx=300, top=70, dh=36; const xs=[]; for(let i=0;i<L;i++) xs[i]=cx-i*36;
  function draw(step){
    svg.querySelectorAll('.sdyn').forEach(n=>n.remove());
    for(let i=0;i<L;i++){
      const g=dg('g',{class:'sdyn'},svg);
      dgt(g, xs[i], top+12, da[i]||'', 18, DC.ink);
      dgt(g, xs[i], top+dh+12, db[i]||'', 18, DC.ink);
      dg('line',{x1:cx+18,y1:top+dh+22,x2:xs[L-1]-14,y2:top+dh+22,stroke:DC.ink,'stroke-width':1.5},g);
    }
    let borrow=0;
    for(let i=0;i<L;i++){
      let x=da[L-1-i]-borrow;
      if(x<db[L-1-i]){ x+=10; borrow=1; } else borrow=0;
      if(step>i){ const g=dg('g',{class:'sdyn'},svg); dgt(g, xs[L-1-i], top+2*dh+12, x, 18, DC.green); }
      if(i<L-1 && da[L-2-i]-borrow < (db[L-2-i]||0)){ // 标记借位小点
        const g=dg('g',{class:'sdyn'},svg); dgt(g, xs[L-2-i]+12, top+dh+2, '·', 14, DC.red);
      }
    }
  }
  dgt(svg,180,222,'答案：'+(a-b),13,DC.ink);
  dgSlider(svg,40,205,280,0,L,0,DC.gold,v=>{draw(Math.round(v));}, v=>'步骤 '+Math.round(v)+' / '+L);
  draw(0);
}

// ---------- 5. 乘法面积模型(拖拽改变行列) ----------
function diagMulArea(container, opts){
  opts=opts||{};
  const maxR = opts.maxR||9, maxC = opts.maxC||9;
  const W=360, H=264;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '乘法面积模型 · 行 × 列', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 160);
  const gx=48, gy=60, cell=26;
  let rows=4, cols=5;
  const gridG=dg('g',{},svg);
  const handle=dg('rect',{width:20,height:20,rx:5,fill:DC.gold,stroke:'#fff','stroke-width':2,style:'cursor:grab'},svg);
  const setInfo = luxInfo(svg, 22, 214, 316, 34);
  function redraw(){
    gridG.innerHTML='';
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const f=(r+c)%2===0?DC.green:DC.blue;
      dg('rect',{x:gx+c*cell,y:gy+r*cell,width:cell-2,height:cell-2,rx:3,fill:f,opacity:0.85},gridG);
    }
    dg('rect',{x:gx,y:gy,width:cols*cell,height:rows*cell,fill:'none',stroke:DC.ink,'stroke-width':1.5},gridG);
    handle.setAttribute('x', gx+cols*cell-10);
    handle.setAttribute('y', gy+rows*cell-10);
    setInfo('*'+rows+'* 行 × *'+cols+'* 列 = *'+(rows*cols)+'* 个');
  }
  dgDrag(svg, handle, function(p){
    cols=Math.max(1,Math.min(maxC,Math.round((p.x-gx)/cell)));
    rows=Math.max(1,Math.min(maxR,Math.round((p.y-gy)/cell)));
    redraw();
  });
  redraw();
}

// ---------- 6. 除法分组 ----------
function diagDivGroups(container, opts){
  opts=opts||{};
  const N = opts.N||24;
  const W=360, H=256;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '除法 · 平均分（圈一圈）', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 156);
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 206, 316, 34);
  luxSlider(svg, 50, 190, 260, 1, 9, 3, function(v){
    const per=Math.round(v);
    g.innerHTML='';
    const groups=Math.floor(N/per), rem=N%per;
    let idx=0;
    for(let grp=0; grp<groups; grp++){
      for(let k=0;k<per;k++){
        const x=46+(idx%11)*26, y=64+Math.floor(idx/11)*26;
        dg('circle',{cx:x,cy:y,r:10,fill:DC.green,opacity:0.85},g);
        idx++;
      }
    }
    for(let k=0;k<rem;k++){
      const x=46+(idx%11)*26, y=64+Math.floor(idx/11)*26;
      dg('circle',{cx:x,cy:y,r:10,fill:DC.red,opacity:0.85},g); idx++;
    }
    setInfo('*'+N+'* ÷ *'+per+'* = *'+groups+'*'+(rem?' 余 *'+rem+'*':''));
  }, v=>'每份 '+Math.round(v)+' 个');
}

// ---------- 7. 分数条 ----------
function diagFractionBar(container, opts){
  opts=opts||{};
  const den = opts.den||4;
  const W=360, H=230;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '分数条 · 几分之几', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 138);
  const bx=40, by=78, bw=280, bh=46;
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 188, 316, 30);
  luxSlider(svg, 40, 158, 280, 0, den, 2, function(v){
    const num=Math.round(v);
    g.innerHTML='';
    dg('rect',{x:bx,y:by,width:bw,height:bh,rx:6,fill:'#fff',stroke:DC.ink,'stroke-width':1.5},g);
    const cw=bw/den;
    for(let i=0;i<den;i++){
      dg('rect',{x:bx+i*cw,y:by,width:cw-1,height:bh,fill:(i<num?DC.gold:'#EDE7D9')},g);
      if(i>0) dg('line',{x1:bx+i*cw,y1:by,x2:bx+i*cw,y2:by+bh,stroke:DC.ink,'stroke-width':1},g);
    }
    setInfo('阴影占 *'+num+' / '+den+'*');
  }, v=>'分子 '+Math.round(v));
}

// ---------- 8. 分数圆 ----------
function diagFractionCircle(container, opts){
  opts=opts||{};
  const den = opts.den||4;
  const W=360, H=248;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '分数圆 · 涂一涂', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 156);
  const cx=180, cy=104, r=64;
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 206, 316, 34);
  luxSlider(svg, 40, 192, 280, 0, den, 1, function(v){
    const num=Math.round(v);
    g.innerHTML='';
    dg('circle',{cx,cy,r,fill:'#EDE7D9',stroke:DC.ink,'stroke-width':1.5},g);
    for(let i=0;i<num;i++){
      const a0=2*Math.PI*i/den, a1=2*Math.PI*(i+1)/den;
      dg('path',{d:`M ${cx} ${cy} L ${cx+r*Math.cos(a0)} ${cy+r*Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(a1)} ${cy+r*Math.sin(a1)} Z`,fill:DC.gold},g);
    }
    for(let i=0;i<den;i++){
      const a=2*Math.PI*i/den;
      dg('line',{x1:cx,y1:cy,x2:cx+r*Math.cos(a),y2:cy+r*Math.sin(a),stroke:DC.ink,'stroke-width':1},g);
    }
    setInfo('阴影占 *'+num+' / '+den+'*');
  }, v=>'涂色份数 '+Math.round(v));
}

// ---------- 9. 小数轴 ----------
function diagDecimalLine(container){
  const svg = dgMake(container, 360, 200);
  dgBg(svg,360,200);
  const x0=30,x1=330,y=110;
  dg('line',{x1:x0,y1:y,x2:x1,y2:y,stroke:DC.ink,'stroke-width':2},svg);
  for(let i=0;i<=10;i++){ const x=x0+(x1-x0)*i/10; dg('line',{x1:x,y1:y-5,x2:x,y2:y+5,stroke:DC.ink,'stroke-width':1.5},svg); dgt(svg,x,y+22,(i/10).toFixed(1),10,DC.light); }
  dgt(svg,180,40,'拖动小球，认识小数',12,DC.gold);
  const valT=dgt(svg,180,62,'',18,DC.ink);
  const m=dg('circle',{cx:x1,cy:y,r:9,fill:DC.red,stroke:'#fff','stroke-width':2},svg);
  const flag=dg('line',{x1:x1,y1:y-9,x2:x1,y2:y-22,stroke:DC.red,'stroke-width':1.5},svg);
  dgDrag(svg,m,function(p){
    let v=Math.round((p.x-x0)/(x1-x0)*10)/10; v=Math.max(0,Math.min(1,v));
    const x=x0+(x1-x0)*v; m.setAttribute('cx',x); flag.setAttribute('x1',x); flag.setAttribute('x2',x);
    valT.textContent='小数：'+v.toFixed(1);
  });
  valT.textContent='小数：1.0'; m.setAttribute('cx',x1);
}

// ---------- 10. 百分数 ----------
function diagPercent(container){
  const W=360, H=228;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '百分数 · 百分之几', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 138);
  const bx=40,by=74,bw=280,bh=50;
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 188, 316, 30);
  luxSlider(svg, 40, 158, 280, 0, 100, 40, function(v){
    const p=Math.round(v);
    g.innerHTML='';
    dg('rect',{x:bx,y:by,width:bw,height:bh,rx:6,fill:'#EDE7D9',stroke:DC.ink,'stroke-width':1.5},g);
    dg('rect',{x:bx,y:by,width:bw*p/100,height:bh,rx:6,fill:DC.amber},g);
    setInfo('已涂色 *'+p+'%*');
  }, v=>'百分比 '+Math.round(v));
}

// ---------- 11. 比 ----------
function diagRatio(container){
  const W=360, H=244;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '比 · 两个量的关系', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 150);
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 200, 316, 34);
  function gcd(a,b){return b?gcd(b,a%b):a;}
  function draw(A,B){
    g.innerHTML='';
    const total=A+B;
    dg('rect',{x:30,y:54,width:300*A/total,height:18,rx:4,fill:DC.green},g);
    dg('rect',{x:30+300*A/total,y:54,width:300*B/total,height:18,rx:4,fill:DC.blue},g);
    const k=gcd(A,B);
    setInfo('*'+A+' : '+B+'*  =  '+(A/k)+' : '+(B/k));
  }
  let A=3, B=4;
  luxSlider(svg,30,100,300,1,12,3,function(v){A=Math.round(v);draw(A,B);}, v=>'前项 '+Math.round(v));
  luxSlider(svg,30,150,300,1,12,4,function(v){B=Math.round(v);draw(A,B);}, v=>'后项 '+Math.round(v));
  draw(3,4);
}

// ---------- 12. 角度(拖动) ----------
function diagAngle(container){
  const svg = dgMake(container, 360, 260);
  dgBg(svg,360,260);
  const cx=180, cy=170, r=110;
  const g=dg('g',{},svg);
  const info=dgt(svg,180,34,'拖动红色射线，看角的变化',12,DC.gold);
  const typeT=dgt(svg,180,56,'',16,DC.ink);
  const arm=dg('line',{x1:cx,y1:cy,x2:cx+r,y2:cy,stroke:DC.red,'stroke-width':3,'stroke-linecap':'round'},svg);
  const hub=dg('circle',{cx,cy,r:6,fill:DC.ink},svg);
  function type(d){ if(d===0)return['零角',DC.light]; if(d<90)return['锐角 < 90°',DC.green]; if(d===90)return['直角 = 90°',DC.red]; if(d<180)return['钝角 > 90°',DC.amber]; if(d===180)return['平角 = 180°',DC.blue]; if(d<360)return['优角 > 180°',DC.gold]; return['周角 = 360°',DC.ink]; }
  function upd(d){ d=Math.max(0,Math.min(360,d)); const a=Math.PI*d/180; arm.setAttribute('x2',cx+r*Math.cos(a)); arm.setAttribute('y2',cy-r*Math.sin(a)); const t=type(d); typeT.textContent=d+'°  '+t[0]; typeT.setAttribute('fill',t[1]); }
  dgDrag(svg, arm, function(p){ const ang=Math.atan2(cy-p.y,p.x-cx)*180/Math.PI; upd((ang+360)%360); });
  upd(45);
}

// ---------- 13. 量角器 ----------
function diagProtractor(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  const cx=180, cy=180, r=120;
  dgt(svg,180,28,'拖动射线，用量角器读出度数',11,DC.gold);
  dg('path',{d:`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`,fill:'rgba(180,148,90,0.08)',stroke:DC.gold,'stroke-width':1},svg);
  for(let d=0;d<=180;d+=10){ const a=Math.PI*d/180; dg('line',{x1:cx+(r-8)*Math.cos(a),y1:cy-(r-8)*Math.sin(a),x2:cx+r*Math.cos(a),y2:cy-r*Math.sin(a),stroke:DC.gold,'stroke-width':0.8},svg); }
  const info=dgt(svg,180,46,'',16,DC.ink);
  const arm=dg('line',{x1:cx,y1:cy,x2:cx+r*Math.cos(Math.PI/6),y2:cy-r*Math.sin(Math.PI/6),stroke:DC.red,'stroke-width':3,'stroke-linecap':'round'},svg);
  dg('circle',{cx,cy,r:5,fill:DC.ink},svg);
  dgDrag(svg,arm,function(p){ let d=Math.atan2(cy-p.y,p.x-cx)*180/Math.PI; d=Math.round(d<0?0:d); d=Math.min(180,Math.max(0,d)); const a=Math.PI*d/180; arm.setAttribute('x2',cx+r*Math.cos(a)); arm.setAttribute('y2',cy-r*Math.sin(a)); info.textContent='读数：'+d+'°'; });
  info.textContent='读数：30°';
}

// ---------- 14. 三角形(拖顶点) ----------
function diagTriangle(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  dgt(svg,180,26,'拖动三个顶点，看三角形分类',11,DC.gold);
  let P=[{x:120,y:190},{x:240,y:190},{x:180,y:90}];
  const tri=dg('polygon',{points:'',fill:'rgba(78,140,110,0.18)',stroke:DC.green,'stroke-width':2.5},svg);
  const info=dgt(svg,180,228,'',14,DC.ink);
  const dots=P.map(p=>dg('circle',{cx:p.x,cy:p.y,r:9,fill:DC.red,stroke:'#fff','stroke-width':2},svg));
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function upd(){
    tri.setAttribute('points', P.map(p=>p.x+','+p.y).join(' '));
    dots.forEach((d,i)=>{d.setAttribute('cx',P[i].x);d.setAttribute('cy',P[i].y);});
    const s=[dist(P[0],P[1]),dist(P[1],P[2]),dist(P[2],P[0])].map(x=>Math.round(x));
    const eq=(a,b)=>Math.abs(a-b)<8;
    let side = (eq(s[0],s[1])&&eq(s[1],s[2]))?'等边三角形':(eq(s[0],s[1])||eq(s[1],s[2])||eq(s[2],s[0]))?'等腰三角形':'不等边三角形';
    const mx=Math.max(...s), mn=Math.min(...s);
    let ang = mx*mx > s[0]*s[0]+s[1]*s[1]+s[2]*s[2]-mx*mx+1 ? (mn*mn+ (mn===s[0]?s[1]:s[0])*(mn===s[0]?s[1]:s[0]) > mx*mx?'锐角三角形':'钝角三角形') : '?';
    // 用余弦定理判类型更稳
    function angType(i){const a=s[i],b=s[(i+1)%3],c=s[(i+2)%3];const cos=(b*b+c*c-a*a)/(2*b*c);return Math.acos(Math.max(-1,Math.min(1,cos)))*180/Math.PI;}
    const angs=[angType(0),angType(1),angType(2)];
    let atype = angs.some(a=>a>91)?'钝角三角形':angs.some(a=>a>=89&&a<=91)?'直角三角形':'锐角三角形';
    info.textContent='边长 '+s.join(', ')+' → '+side+' / '+atype;
  }
  dots.forEach((d,i)=>dgDrag(svg,d,function(p){ P[i].x=Math.max(20,Math.min(340,p.x)); P[i].y=Math.max(40,Math.min(210,p.y)); upd(); }));
  upd();
}

// ---------- 15. 多边形(边数) ----------
function diagPolygon(container){
  const W=360, H=252;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '多边形 · 边数越多越圆', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 156);
  const cx=180, cy=104, r=66;
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 206, 316, 34);
  const names={3:'三边形',4:'四边形',5:'五边形',6:'六边形',7:'七边形',8:'八边形'};
  luxSlider(svg, 40, 192, 280, 3, 8, 5, function(v){
    const n=Math.round(v); g.innerHTML='';
    let pts=[];
    for(let i=0;i<n;i++){const a=2*Math.PI*i/n-Math.PI/2; pts.push((cx+r*Math.cos(a))+','+(cy+r*Math.sin(a)));}
    dg('polygon',{points:pts.join(' '),fill:'rgba(107,120,148,0.15)',stroke:DC.blue,'stroke-width':2.5},g);
    const interior=Math.round((n-2)*180/n);
    setInfo('*'+n+'* 边形（'+names[n]+'） 内角和 *'+(n-2)*180+'°*');
  }, v=>'边数 '+Math.round(v));
}

// ---------- 16. 图形识别(点击) ----------
function diagShapeGallery(container){
  const W=360, H=256;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '认识图形 · 点一点', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 168);
  const shapes=[
    {name:'正方形',draw:()=>dg('rect',{x:0,y:0,width:50,height:50,fill:DC.gold,opacity:0.85})},
    {name:'长方形',draw:()=>dg('rect',{x:0,y:0,width:64,height:40,fill:DC.green,opacity:0.85})},
    {name:'三角形',draw:()=>{const p=dg('polygon',{points:'32,0 64,56 0,56',fill:DC.blue,opacity:0.85});return p;}},
    {name:'圆',draw:()=>dg('circle',{cx:28,cy:28,r:28,fill:DC.red,opacity:0.85})},
    {name:'平行四边形',draw:()=>dg('polygon',{points:'12,56 50,56 64,12 26,12',fill:DC.amber,opacity:0.85})},
  ];
  const setInfo = luxInfo(svg, 22, 214, 316, 30);
  shapes.forEach((s,i)=>{
    const ox=40+(i%3)*110, oy=54+Math.floor(i/3)*96;
    const wrap=dg('g',{transform:`translate(${ox},${oy})`,style:'cursor:pointer'},svg);
    const node=s.draw(); wrap.appendChild(node);
    wrap.addEventListener('click',()=>{ svg.querySelectorAll('.sg').forEach(n=>n.setAttribute('stroke','none')); node.setAttribute('stroke','#3E4A63'); node.setAttribute('stroke-width','3'); setInfo('这是：*'+s.name+'*'); });
    wrap.classList.add('sg');
  });
  setInfo('点击图形，认识它的名字');
}

// ---------- 17. 对称(拖镜像线) ----------
function diagSymmetry(container){
  const svg = dgMake(container, 360, 240);
  dgBg(svg,360,240);
  dgt(svg,180,24,'拖动中间虚线，做对称轴',11,DC.gold);
  const cx=180, cy=130;
  const half=dg('polygon',{points:'60,80 120,80 120,180 60,180',fill:DC.green,opacity:0.85},svg);
  const mirror=dg('line',{x1:cx,y1:50,x2:cx,y2:210,stroke:DC.gold,'stroke-width':2,'stroke-dasharray':'6 4'},svg);
  const refl=dg('polygon',{points:'',fill:'rgba(180,148,90,0.4)',stroke:DC.gold,'stroke-width':1.5},svg);
  dgDrag(svg,mirror,function(p){ const x=Math.max(120,Math.min(240,p.x)); mirror.setAttribute('x1',x); mirror.setAttribute('x2',x);
    refl.setAttribute('points',`${2*x-120},80 ${2*x-60},80 ${2*x-60},180 ${2*x-120},180`); });
  refl.setAttribute('points','240,80 300,80 300,180 240,180');
}

// ---------- 18. 圆(拖半径) ----------
function diagCircle(container){
  const W=360, H=256;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '圆 · 半径 直径 面积', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 162);
  const cx=132, cy=118;
  const c=dg('circle',{cx,cy,r:60,fill:'rgba(229,115,115,0.15)',stroke:DC.red,'stroke-width':2.5},svg);
  const rline=dg('line',{x1:cx,y1:cy,x2:cx+60,y2:cy,stroke:DC.red,'stroke-width':3,'stroke-linecap':'round'},svg);
  dg('circle',{cx,cy,r:4,fill:DC.ink},svg);
  const setInfo = luxInfo(svg, 22, 212, 316, 34);
  const handle=dg('circle',{cx:cx+60,cy:cy,r:9,fill:DC.gold,stroke:'#fff','stroke-width':2,style:'cursor:grab'},svg);
  function upd(r){ c.setAttribute('r',r); rline.setAttribute('x2',cx+r); handle.setAttribute('cx',cx+r); const d=(2*r).toFixed(0), area=Math.round(Math.PI*r*r); setInfo('r=*'+Math.round(r)+'*  d=*'+d+'*  面积≈*'+area+'*'); }
  dgDrag(svg,handle,function(p){ let r=Math.hypot(p.x-cx,p.y-cy); r=Math.max(20,Math.min(120,r)); upd(r); });
  upd(60);
}

// ---------- 19. 矩形周长面积(拖尺寸) ----------
function diagAreaRect(container){
  const W=360, H=256;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '长方形 · 面积与周长', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 162);
  const gx=70, gy=64;
  const rect=dg('rect',{x:gx,y:gy,width:120,height:80,fill:'rgba(78,140,110,0.18)',stroke:DC.green,'stroke-width':2.5},svg);
  const handle=dg('rect',{x:gx+120-9,y:gy+80-9,width:18,height:18,rx:5,fill:DC.gold,stroke:'#fff','stroke-width':2,style:'cursor:grab'},svg);
  const setInfo = luxInfo(svg, 22, 212, 316, 34);
  function upd(w,h){ rect.setAttribute('width',w); rect.setAttribute('height',h); handle.setAttribute('x',gx+w-9); handle.setAttribute('y',gy+h-9); setInfo('长 *'+Math.round(w)+'*  宽 *'+Math.round(h)+'*  →  面积 *'+(w*h)+'*  周长 *'+Math.round(2*(w+h))+'*'); }
  dgDrag(svg,handle,function(p){ let w=Math.max(50,Math.min(250,p.x-gx)), h=Math.max(40,Math.min(150,p.y-gy)); upd(w,h); });
  upd(120,80);
}

// ---------- 20. 时钟(拖指针) ----------
function diagClock(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  const cx=180, cy=130, r=90;
  dgt(svg,180,24,'拖动时针和分针，读时间',11,DC.gold);
  dg('circle',{cx,cy,r,fill:'#fff',stroke:DC.ink,'stroke-width':2},svg);
  for(let i=1;i<=12;i++){const a=Math.PI*i/6; const x=cx+r*0.82*Math.sin(a), y=cy-r*0.82*Math.cos(a); dgt(svg,x,y,i,12,DC.ink);}
  const hour=dg('line',{x1:cx,y1:cy,x2:cx,y2:cy-50,stroke:DC.ink,'stroke-width':4,'stroke-linecap':'round'},svg);
  const min=dg('line',{x1:cx,y1:cy,x2:cx,y2:cy-75,stroke:DC.red,'stroke-width':3,'stroke-linecap':'round'},svg);
  dg('circle',{cx,cy,r:5,fill:DC.ink},svg);
  const info=dgt(svg,180,232,'',15,DC.ink);
  let stH=3, stM=0;
  function upd(h,m){ h=((Math.round(h)%12)+12)%12; m=Math.max(0,Math.min(59,Math.round(m))); const ha=Math.PI*h/6+Math.PI*m/360, ma=Math.PI*m/30; hour.setAttribute('x2',cx+50*Math.sin(ha)); hour.setAttribute('y2',cy-50*Math.cos(ha)); min.setAttribute('x2',cx+75*Math.sin(ma)); min.setAttribute('y2',cy-75*Math.cos(ma)); const hh=h===0?12:h; info.textContent='时间：'+String(hh).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
  // 指针角度：以 12 点方向(屏幕正上)为 0°，顺时针为正 → atan2(dx, -dy)
  dgDrag(svg,hour,function(p){ const a=Math.atan2(p.x-cx, -(p.y-cy)); let h=Math.round(a/(2*Math.PI)*12); stH=((h%12)+12)%12; upd(stH, stM); });
  dgDrag(svg,min,function(p){ const a=Math.atan2(p.x-cx, -(p.y-cy)); let m=Math.round(a/(2*Math.PI)*60); stM=((m%60)+60)%60; upd(stH, stM); });
  upd(3,0);
}

// ---------- 21. 尺子测量 ----------
function diagRuler(container){
  const svg = dgMake(container, 360, 200);
  dgBg(svg,360,200);
  dgt(svg,180,24,'拖动端点，量一量长度',11,DC.gold);
  const x0=30, x1=330, y=120;
  dg('rect',{x:x0-10,y:y-12,width:(x1-x0)+20,height:24,rx:4,fill:'#fff',stroke:DC.ink,'stroke-width':1.5},svg);
  for(let i=0;i<=20;i++){const x=x0+i*15; dg('line',{x1:x,y1:y-12,x2:x,y2:(i%5===0)?y+6:y},svg);}
  const obj=dg('rect',{x:90,y:y-30,width:120,height:24,rx:4,fill:DC.green,opacity:0.85},svg);
  const info=dgt(svg,180,170,'',15,DC.ink);
  const h1=dg('circle',{cx:90,cy:y-18,r:7,fill:DC.gold,stroke:'#fff','stroke-width':2},svg);
  const h2=dg('circle',{cx:210,cy:y-18,r:7,fill:DC.gold,stroke:'#fff','stroke-width':2},svg);
  function upd(){ const a=Math.min(h1.cx.baseVal.value,h2.cx.baseVal.value), b=Math.max(h1.cx.baseVal.value,h2.cx.baseVal.value); obj.setAttribute('x',a); obj.setAttribute('width',b-a); info.textContent='长度：'+((b-a)/15).toFixed(1)+' cm'; }
  dgDrag(svg,h1,function(p){ h1.setAttribute('cx',Math.max(x0,Math.min(x1,p.x))); upd(); });
  dgDrag(svg,h2,function(p){ h2.setAttribute('cx',Math.max(x0,Math.min(x1,p.x))); upd(); });
  info.textContent='长度：8.0 cm';
}

// ---------- 22. 货币(硬币计数) ----------
function diagMoney(container, opts){
  opts=opts||{};
  const svg = dgMake(container, 360, 230);
  dgBg(svg,360,230);
  dgt(svg,180,24,'拖动滑块，凑出金额',11,DC.gold);
  const denoms=[{v:100,c:DC.blue,t:'100'},{v:50,c:DC.green,t:'50'},{v:10,c:DC.gold,t:'10'},{v:1,c:DC.amber,t:'1'}];
  const counts=[1,2,1,5];
  const g=dg('g',{},svg);
  const info=dgt(svg,180,212,'',15,DC.ink);
  denoms.forEach((d,i)=>{ dgt(svg,40+i*85,150,d.t+'元',11,d.c); });
  function upd(){ g.innerHTML=''; let total=0; denoms.forEach((d,i)=>{ total+=d.v*counts[i]; for(let k=0;k<counts[i];k++) dg('circle',{cx:40+i*85+(k%5)*7,y:60+Math.floor(k/5)*7,r:6,fill:d.c,opacity:0.85},g); }); info.textContent='合计：'+total+' 元'; }
  denoms.forEach((d,i)=> dgSlider(svg,20+i*85,190,70,0,9,counts[i],d.c,v=>{counts[i]=Math.round(v);upd();}));
  upd();
}

// ---------- 23. 柱状图(拖高度) ----------
function diagBarChart(container, opts){
  opts=opts||{};
  const W=360, H=250;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '条形统计图 · 拖动改数据', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 150);
  const data=[5,8,3,6,9]; const labels=['一','二','三','四','五'];
  const gx=46, gy=176, bw=44, gap=10, maxH=118;
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 204, 316, 34);
  function draw(){
    g.innerHTML='';
    let s='';
    data.forEach((v,i)=>{ const x=gx+i*(bw+gap), h=v/10*maxH; dg('rect',{x:x,y:gy-h,width:bw,height:h,rx:4,fill:DC.blue,opacity:0.85},g); dgt(svg,x+bw/2,gy+16,labels[i],11,DC.light); s+=labels[i]+'='+v+'  '; });
    setInfo(s.trim());
  }
  data.forEach((v,i)=>{ const x=gx+i*(bw+gap); const h=v/10*maxH; const hd=dg('rect',{x:x-4,y:gy-h-9,width:bw+8,height:18,rx:6,fill:DC.gold,opacity:0.95,style:'cursor:grab'},svg);
    dgDrag(svg,hd,function(p){ let nv=Math.round((gy-p.y)/maxH*10); nv=Math.max(0,Math.min(10,nv)); data[i]=nv; draw(); });
  });
  draw();
}

// ---------- 24. 饼图 ----------
function diagPieChart(container){
  const W=360, H=256;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '扇形统计图 · 拖动调比例', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 162);
  const cx=132, cy=118, r=72;
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 212, 316, 34);
  let a1=0.4, a2=0.7; // 比例(0~1)
  const h1=dg('circle',{cx:cx+r*Math.cos(2*Math.PI*a1),cy:cy+r*Math.sin(2*Math.PI*a1),r:8,fill:DC.gold,stroke:'#fff','stroke-width':2,style:'cursor:grab'},svg);
  const h2=dg('circle',{cx:cx+r*Math.cos(2*Math.PI*a2),cy:cy+r*Math.sin(2*Math.PI*a2),r:8,fill:DC.amber,stroke:'#fff','stroke-width':2,style:'cursor:grab'},svg);
  function path(frac){ const a1v=2*Math.PI*frac; return `M ${cx} ${cy} L ${cx+r} ${cy} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(a1v)} ${cy+r*Math.sin(a1v)} Z`; }
  function draw(){ g.innerHTML=''; dg('path',{d:path(a1),fill:DC.green},g); dg('path',{d:`M ${cx} ${cy} L ${cx+r*Math.cos(2*Math.PI*a1)} ${cy+r*Math.sin(2*Math.PI*a1)} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(2*Math.PI*a2)} ${cy+r*Math.sin(2*Math.PI*a2)} Z`,fill:DC.blue},g); dg('path',{d:`M ${cx} ${cy} L ${cx+r*Math.cos(2*Math.PI*a2)} ${cy+r*Math.sin(2*Math.PI*a2)} A ${r} ${r} 0 0 1 ${cx+r} ${cy} Z`,fill:DC.amber},g); setInfo('A *'+Math.round(a1*100)+'%*  B *'+Math.round((a2-a1)*100)+'%*  C *'+Math.round((1-a2)*100)+'%*'); }
  dgDrag(svg,h1,function(p){ let a=Math.atan2(p.y-cy,p.x-cx)/(2*Math.PI); if(a<0)a+=1; a1=Math.max(0.05,Math.min(a2-0.05,a)); h1.setAttribute('cx',cx+r*Math.cos(2*Math.PI*a1)); h1.setAttribute('cy',cy+r*Math.sin(2*Math.PI*a1)); draw(); });
  dgDrag(svg,h2,function(p){ let a=Math.atan2(p.y-cy,p.x-cx)/(2*Math.PI); if(a<0)a+=1; a2=Math.max(a1+0.05,Math.min(0.95,a)); h2.setAttribute('cx',cx+r*Math.cos(2*Math.PI*a2)); h2.setAttribute('cy',cy+r*Math.sin(2*Math.PI*a2)); draw(); });
  draw();
}

// ---------- 25. 速度时间 ----------
function diagSpeed(container){
  const W=360, H=258;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '速度 · 时间 · 路程', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 168);
  const gx=50, gy=186, gw=260, gh=140;
  dg('rect',{x:gx,y:gy-gh,width:gw,height:gh,fill:'#fff',stroke:DC.line,'stroke-width':1},svg);
  dgt(svg,gx-10,gy+18,'0',10,DC.light); dgt(svg,gx+gw+6,gy-gh,'路程',10,DC.light,'start'); dgt(svg,gx+gw+6,gy,'时间',10,DC.light,'start');
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 214, 316, 34);
  function draw(v,t){ g.innerHTML=''; const x=gx+gw*t/10, y=gy-gh*v/10; dg('line',{x1:gx,y1:gy,x2:x,y2:y,stroke:DC.red,'stroke-width':2.5},g); dg('circle',{cx:x,cy:y,r:5,fill:DC.red},g); setInfo('速度 *'+v+'* × 时间 *'+t+'* = 路程 *'+(v*t)+'*'); }
  let curV=4, curT=5;
  luxSlider(svg,50,196,130,1,10,4,function(v){curV=v;draw(curV, curT);}, v=>'速度 '+v);
  luxSlider(svg,200,196,130,1,10,5,function(v){curT=v;draw(curV, curT);}, v=>'时间 '+v);
  draw(4,5);
}

// ---------- 26. 植树问题（多 tab：两端都种/一端种/两端不种/封闭/爬楼梯/敲钟）----------
function diagPlant(container, opts){
  opts=opts||{};
  const W=360, H=332;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 20, '植树问题 · 间隔与棵数', 13, DC.gold);

  // 画板卡片
  const boardX=12, boardY=30, boardW=W-24, boardH=150;
  dg('rect',{x:boardX,y:boardY,width:boardW,height:boardH,rx:12,fill:'#FFFFFF',stroke:DC.line,'stroke-width':1.5},svg);

  const TABS=[['both','两端都种'],['one','一端种'],['none','两端不种'],['closed','封闭图形'],['stair','爬楼梯'],['bell','敲钟']];
  let mode='both', n=5;

  // 直线种树相关常量（拖拽手柄用于改变间隔数 n）
  const SEGL=30, lineX0=boardX+26, roadY=150;

  // 双行 pill 标签
  const tabBar=dg('g',{},svg);
  const tabEls=TABS.map((t,i)=>{
    const col=i%3, row=Math.floor(i/3);
    const tw=104, th=24, gapX=12, gapY=8;
    const x=12+col*(tw+gapX), y=boardY+boardH+10+row*(th+gapY);
    const r=dg('rect',{x:x,y:y,width:tw,height:th,rx:12,fill: i===0?DC.gold:'#EDE7DB',stroke: i===0?DC.gold:'#E3DCCB','stroke-width':1.5,style:'cursor:pointer'},tabBar);
    const tx=dg('text',{x:x+tw/2,y:y+th/2+4,'font-size':11,'text-anchor':'middle',fill: i===0?'#fff':DC.ink,'font-weight':'bold',style:'cursor:pointer;user-select:none'},tabBar);
    tx.textContent=t[1];
    r.addEventListener('click',()=>setMode(t[0]));
    tx.addEventListener('click',()=>setMode(t[0]));
    return {r,tx};
  });

  // 画板内容层（重绘只清这一层）
  const gContent=dg('g',{},svg);

  // 底部公式高亮卡
  const fy=boardY+boardH+10+2*(24+8)+8;
  dg('rect',{x:12,y:fy,width:W-24,height:34,rx:10,fill:'#F3EEE3',stroke:DC.line,'stroke-width':1},svg);
  const gFormula=dg('g',{},svg);
  function setFormula(s){
    gFormula.innerHTML='';
    const txt=dg('text',{x:W/2,y:fy+22,'font-size':13,fill:DC.ink,'text-anchor':'middle','font-weight':'bold'},gFormula);
    s.split('*').forEach((seg,i)=>{ dg('tspan',{fill: i%2===1?DC.gold:DC.ink},txt).textContent=seg; });
  }

  // ---- 矢量小元素 ----
  function tree(x,y,s){
    dg('rect',{x:x-2,y:y+6,width:4,height:9,rx:1,fill:'#9C6B3F'},gContent);
    dg('circle',{cx:x,cy:y,r:9*s,fill:DC.green,stroke:'#fff','stroke-width':1.5},gContent);
    dg('circle',{cx:x-3,cy:y-2,r:3*s,fill:'#5Fa37c',opacity:0.7},gContent);
  }
  function flower(x,y,c){
    for(let i=0;i<6;i++){ const a=i*Math.PI/3; dg('circle',{cx:x+7*Math.cos(a),cy:y+7*Math.sin(a),r:3,fill:c},gContent); }
    dg('circle',{cx:x,cy:y,r:3.5,fill:DC.gold},gContent);
  }
  function person(x,y){
    dg('circle',{cx:x,cy:y-11,r:5,fill:DC.ink},gContent);
    dg('line',{x1:x,y1:y-6,x2:x,y2:y+7,stroke:DC.ink,'stroke-width':2.5,'stroke-linecap':'round'},gContent);
    dg('line',{x1:x,y1:y+1,x2:x-5,y2:y+9,stroke:DC.ink,'stroke-width':2,'stroke-linecap':'round'},gContent);
    dg('line',{x1:x,y1:y+1,x2:x+5,y2:y+9,stroke:DC.ink,'stroke-width':2,'stroke-linecap':'round'},gContent);
  }

  // ---- 可拖拽的金色手柄（拖右端改变间隔数 n；持久节点，重绘后保活）----
  const endHandle = dg('g', { id: 'pl-handle', style: 'cursor:grab;touch-action:none' }, svg);
  dg('circle', { r: 12, fill: DC.gold, stroke: '#fff', 'stroke-width': 2.5 }, endHandle);
  dg('text', { x: 0, y: 4, 'font-size': 12, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 'bold' }, endHandle).textContent = '↔';
  function positionHandle(){
    if (mode==='both' || mode==='one' || mode==='none') {
      endHandle.setAttribute('transform', 'translate(' + (lineX0 + n*SEGL) + ',' + (roadY-20) + ')');
      endHandle.style.display = '';
    } else {
      endHandle.style.display = 'none';
    }
  }
  dgDrag(svg, endHandle, function (p) {
    const nn = Math.max(3, Math.min(9, Math.round((p.x - lineX0) / SEGL)));
    if (nn !== n) { n = nn; syncSlider(); draw(); }
  });

  function drawLine(){
    const x0=lineX0, x1=x0 + n*SEGL;
    dg('rect',{x:x0-8,y:roadY,width:(x1-x0)+16,height:11,rx:4,fill:'#E9E3D6'},gContent);
    dg('line',{x1:x0-8,y1:roadY,x2:x1+8,y2:roadY,stroke:DC.ink,'stroke-width':2},gContent);
    const pos=[]; for(let k=0;k<=n;k++) pos.push(x0+k*SEGL);
    const plantAt = mode==='both' ? ()=>true : mode==='one' ? k=>k<n : k=>k>0&&k<n;
    pos.forEach((x,k)=>{
      if(plantAt(k)) tree(x, roadY-20, 1);
      else dg('circle',{cx:x,cy:roadY-20,r:9,fill:'none',stroke:DC.light,'stroke-width':1.5,'stroke-dasharray':'3 3'},gContent);
    });
    dgt(gContent, pos[0], roadY+22, '起点', 10, DC.light);
    dgt(gContent, pos[n], roadY+22, '终点', 10, DC.light);
    dgt(gContent, (x0+x1)/2, roadY+22, '每段相等 · 共 '+n+' 段', 10, DC.light);
  }
  function drawClosed(){
    const cx=W/2, cy=boardY+boardH/2+4, r=54;
    dg('circle',{cx:cx,cy:cy,r:r,fill:'#FBF4E6',stroke:DC.gold,'stroke-width':2.5},gContent);
    dg('circle',{cx:cx,cy:cy,r:r-12,fill:'none',stroke:DC.line,'stroke-width':1,'stroke-dasharray':'3 3'},gContent);
    for(let i=0;i<n;i++){ const a=-Math.PI/2 + i*2*Math.PI/n; tree(cx+r*Math.cos(a), cy+r*Math.sin(a), 0.8); }
    flower(cx, cy, '#E57373'); flower(cx-20, cy+9, '#C08A3E'); flower(cx+20, cy-9, '#6B7894');
    dgt(gContent, cx, cy+r+16, '周长分成 '+n+' 段 → '+n+' 棵', 10, DC.light);
  }
  function drawStair(){
    const floors=n+1, x0=boardX+22, baseY=boardY+boardH-16, topY=boardY+20;
    const stepW=(W-boardX*2-44)/n, stepH=(baseY-topY)/n;
    let d='M '+x0+' '+baseY, cx=x0, cy=baseY;
    for(let i=0;i<n;i++){ d+=' h '+stepW+' v '+(-stepH); }
    d+=' h '+stepW+' v '+(stepH*n)+' Z';
    dg('path',{d:d,fill:'#EDE7DB',stroke:DC.ink,'stroke-width':2,'stroke-linejoin':'round'},gContent);
    let hx=x0, hy=baseY;
    for(let i=0;i<n;i++){ dg('line',{x1:hx,y1:hy-stepH,x2:hx+stepW,y2:hy-stepH,stroke:DC.gold,'stroke-width':2.5},gContent); hx+=stepW; hy-=stepH; }
    let lx=x0, ly=baseY;
    for(let f=1;f<=floors;f++){ dgt(gContent, lx-7, ly+4, f+'楼', 10, (f===1||f===floors)?DC.ink:DC.light); lx+=stepW; ly-=stepH; }
    dg('line',{x1:x0-6,y1:baseY+13,x2:x0+n*stepW+6,y2:topY+stepH+13,stroke:DC.gold,'stroke-width':2,'stroke-dasharray':'5 4'},gContent);
    person(x0+stepW*0.5, baseY-stepH*0.5);
  }
  function drawBell(){
    const cx=W/2-32, cy=boardY+boardH/2+2, r=42;
    dg('circle',{cx:cx,cy:cy,r:r,fill:'#FFFFFF',stroke:DC.ink,'stroke-width':2.5},gContent);
    for(let i=0;i<12;i++){ const a=i*Math.PI/6 - Math.PI/2, x1=cx+(r-3)*Math.cos(a), y1=cy+(r-3)*Math.sin(a), x2=cx+(r-8)*Math.cos(a), y2=cy+(r-8)*Math.sin(a); dg('line',{x1:x1,y1:y1,x2:x2,y2:y2,stroke:DC.light,'stroke-width':1.5},gContent); }
    dg('line',{x1:cx,y1:cy,x2:cx,y2:cy-r+13,stroke:DC.ink,'stroke-width':2.5,'stroke-linecap':'round'},gContent);
    dg('line',{x1:cx,y1:cy,x2:cx+r-15,y2:cy,stroke:DC.ink,'stroke-width':2,'stroke-linecap':'round'},gContent);
    dg('circle',{cx:cx,cy:cy,r:3,fill:DC.red},gContent);
    const ar=r+20, a0=-Math.PI/2-0.62, a1=-Math.PI/2+0.62, pts=[];
    for(let i=0;i<n;i++){ const a=a0+(a1-a0)*i/Math.max(n-1,1); pts.push([cx+ar*Math.cos(a), cy+ar*Math.sin(a)]); }
    if(pts.length>1){ let dd='M '+pts[0][0]+' '+pts[0][1]; for(let i=1;i<pts.length;i++) dd+=' L '+pts[i][0]+' '+pts[i][1]; dg('path',{d:dd,fill:'none',stroke:DC.gold,'stroke-width':1.5,'stroke-dasharray':'3 3'},gContent); }
    pts.forEach(p=>dg('circle',{cx:p[0],cy:p[1],r:5,fill:DC.red,stroke:'#fff','stroke-width':1.5},gContent));
    const hx=cx+r+16;
    dg('line',{x1:hx,y1:cy,x2:hx+11,y2:cy-11,stroke:DC.ink,'stroke-width':2.5,'stroke-linecap':'round'},gContent);
    dg('circle',{cx:hx+11,cy:cy-11,r:4,fill:DC.gold},gContent);
    dgt(gContent, cx, cy+r+16, '红点 = 敲的次数，弧段 = 间隔', 10, DC.light);
  }

  // 滑块（与拖拽手柄双向同步）
  function syncSlider(){ if (sl) sl.set(n); }
  let sl = dgSlider(svg, 60, 302, 240, 3, 9, 5, DC.green, function(v){ n=Math.round(v); draw(); }, v=>'间隔 '+Math.round(v)+' 段');

  function draw(){
    gContent.innerHTML='';
    if(mode==='both'||mode==='one'||mode==='none'){
      dgt(gContent, W/2, boardY+16, mode==='both'?'两端都种':mode==='one'?'一端种 · 一端不种':'两端都不种', 12, DC.ink);
      drawLine();
    } else if(mode==='closed') drawClosed();
    else if(mode==='stair') drawStair();
    else if(mode==='bell') drawBell();
    let f;
    if(mode==='both') f='间隔 *'+n+'* 段 → 棵数 = 段数 + 1 = *'+(n+1)+'* 棵';
    else if(mode==='one') f='间隔 *'+n+'* 段 → 棵数 = 段数 = *'+n+'* 棵';
    else if(mode==='none') f='间隔 *'+n+'* 段 → 棵数 = 段数 − 1 = *'+(n-1)+'* 棵';
    else if(mode==='closed') f='封闭图形：棵数 = 段数 = *'+n+'* 棵';
    else if(mode==='stair') f='从 1 楼到 *'+(n+1)+'* 楼 → 层数 = '+(n+1)+' − 1 = *'+n+'* 层';
    else if(mode==='bell') f='敲 *'+n+'* 下 → 间隔 = '+n+' − 1 = *'+(n-1)+'* 个';
    setFormula(f);
    positionHandle();
  }
  function setMode(m){
    mode=m;
    tabEls.forEach((e,i)=>{ const on=TABS[i][0]===m; e.r.setAttribute('fill', on?DC.gold:'#EDE7DB'); e.r.setAttribute('stroke', on?DC.gold:'#E3DCCB'); e.tx.setAttribute('fill', on?'#fff':DC.ink); });
    draw();
  }
  draw();
}

// ---------- 27. 鸡兔同笼 ----------
function diagChickenRabbit(container){
  const W=360, H=256;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '鸡兔同笼 · 数头数脚', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 156);
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 206, 316, 34);
  function draw(c,r){
    g.innerHTML='';
    let x=46, y=64;
    for(let i=0;i<c;i++){ dg('circle',{cx:x,cy:y,r:13,fill:DC.green,opacity:0.9},g); dg('text',{x:x,y:y+5,'font-size':13,fill:'#fff','text-anchor':'middle','font-weight':'bold'},g).textContent='鸡'; x+=30; if(x>300){x=46;y+=34;} }
    for(let i=0;i<r;i++){ dg('circle',{cx:x,cy:y,r:13,fill:DC.red,opacity:0.9},g); dg('text',{x:x,y:y+5,'font-size':13,fill:'#fff','text-anchor':'middle','font-weight':'bold'},g).textContent='兔'; x+=30; if(x>300){x=46;y+=34;} }
    setInfo('鸡 *'+c+'* 只，兔 *'+r+'* 只 → 头 *'+(c+r)+'* 个，脚 *'+(2*c+4*r)+'* 只');
  }
  let curC=3, curR=2;
  luxSlider(svg, 30, 192, 150, 0, 10, 3, function(v){curC=Math.round(v);draw(curC,curR);}, v=>'鸡 '+Math.round(v));
  luxSlider(svg, 200, 192, 150, 0, 10, 2, function(v){curR=Math.round(v);draw(curC,curR);}, v=>'兔 '+Math.round(v));
  draw(3,2);
}

// ---------- 28. 方程天平 ----------
function diagEquation(container, opts){
  opts=opts||{};
  const a = opts.a||3, b = opts.b||12;
  const W=360, H=248;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '简易方程 · 天平找 x', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 156);
  const beamY=96;
  const g=dg('g',{},svg);
  const setInfo = luxInfo(svg, 22, 206, 316, 34);
  function draw(xv){
    g.innerHTML='';
    dg('line',{x1:60,y1:beamY,x2:300,y2:beamY,stroke:DC.ink,'stroke-width':3},g);
    dg('polygon',{points:'180,'+beamY+' 168,'+(beamY+14)+' 192,'+(beamY+14),fill:DC.ink},g);
    dg('line',{x1:180,y1:beamY+14,x2:180,y2:beamY+64,stroke:DC.ink,'stroke-width':3},g);
    dg('line',{x1:90,y1:beamY,x2:90,y2:beamY+28,stroke:DC.line,'stroke-width':2},g);
    dg('text',{x:90,y:beamY+52,'font-size':18,fill:DC.green,'text-anchor':'middle','font-weight':'bold'},g).textContent=a+'x';
    dg('line',{x1:270,y1:beamY,x2:270,y2:beamY+28,stroke:DC.line,'stroke-width':2},g);
    dg('text',{x:270,y:beamY+52,'font-size':18,fill:DC.red,'text-anchor':'middle','font-weight':'bold'},g).textContent=''+b;
    const balanced = a*xv===b;
    setInfo('*'+a+'x* = '+b+'  →  x = *'+xv+'*'+(balanced?'  ✓ 平衡':''));
  }
  luxSlider(svg, 40, 192, 280, 0, Math.ceil(b/a)+2, Math.round(b/a), v=>draw(Math.round(v)));
}

// ---------- 29. 3D 展开/旋转 ----------
function diag3DUnfold(container){
  const W=360, H=256;
  const svg = dgMake(container, W, H);
  dgBg(svg, W, H);
  dgt(svg, W/2, 22, '正方体 · 展开与旋转', 13, DC.gold);
  luxCard(svg, 22, 36, 316, 162);
  const g=dg('g',{transform:'translate(180,118)'},svg);
  const sq=(x,y,c)=>dg('rect',{x:x*46-23,y:y*46-23,width:44,height:44,fill:c,stroke:'#fff','stroke-width':2},g);
  const layout=[[0,-1,DC.green],[-1,0,DC.gold],[0,0,DC.blue],[1,0,DC.red],[0,1,DC.amber],[0,2,DC.ink]];
  layout.forEach((c)=>sq(c[0],c[1],c[2]));
  const setInfo = luxInfo(svg, 22, 212, 316, 34);
  let ang=0;
  dgDrag(svg,g,function(p){ ang=Math.atan2(p.y-118,p.x-180); g.setAttribute('transform','translate(180,118) rotate('+(ang*180/Math.PI)+')'); setInfo('旋转 *'+Math.round(ang*180/Math.PI)+'°* ｜ 正方体有 11 种展开图'); });
  setInfo('这是 *十字型* 展开图（共 6 个面）');
}

// ============================================================
// 单元 → 交互动图 映射
// 依据单元名称关键词 + 类型，给每个单元返回 1~3 个交互动图
// ============================================================
// ============================================================
// 专属交互动图（补齐此前只走「兜底数轴/柱状图」的单元）
// 全部复用 dg*/lux* 引擎与品牌色（黛蓝/香槟金/米白）
// 这些函数同时被手机端 showUnitDiagrams 复用（diagram.js 共享）
// ============================================================

// 通用按钮（SVG rect + 文本，可点击）
function svgBtn(svg, x, y, w, h, label, color, onClick) {
  const r = dg('rect', { x: x, y: y, width: w, height: h, rx: 8, fill: color, style: 'cursor:pointer' }, svg);
  const t = dgt(svg, x + w / 2, y + h / 2 + 5, label, 12, '#fff');
  r.addEventListener('click', onClick);
  t.addEventListener('click', onClick);
  return { r: r, t: t };
}

// 生活应用题：部分—整体模型（看图列式）
function diagWordProblem(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '部分—整体模型（看图列式）', 13, DC.gold);
  const T = 18;
  const card = luxCard(svg, 24, 46, 312, 92);
  const bx = card.x + 12, by = card.y + 30, bw = card.w - 24, bh = 38;
  let a = 7;
  const eq = luxInfo(svg, 24, 150, 312, 30);
  const layer = dg('g', {}, svg);
  function draw() {
    layer.innerHTML = '';
    const w1 = bw * a / T;
    dg('rect', { x: bx, y: by, width: bw, height: bh, rx: 6, fill: '#EDE7DA' }, layer);
    dg('rect', { x: bx, y: by, width: w1, height: bh, rx: 6, fill: DC.gold }, layer);
    dg('rect', { x: bx + w1, y: by, width: bw - w1, height: bh, rx: 6, fill: DC.blue }, layer);
    dgt(layer, bx + w1 / 2, by + bh / 2 + 5, '已知 ' + a, 12, '#fff');
    dgt(layer, bx + w1 + (bw - w1) / 2, by + bh / 2 + 5, '? ' + (T - a), 12, '#fff');
    eq('一共有 *' + T + '* 个，已知 *' + a + '* 个，未知 = *' + (T - a) + '*');
  }
  draw();
  dgt(svg, 40, 192, '拖动滑块改变“已知”数量', 11, DC.light, 'start');
  luxSlider(svg, 40, 206, 280, 0, T, a, function (v) { a = Math.round(v); draw(); }, function (v) { return '已知：' + Math.round(v); });
}

// 混合运算：先乘除后加减（点击步骤）
function diagMixOps(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '混合运算：先乘除，后加减', 13, DC.gold);
  const layer = dg('g', {}, svg);
  const info = luxInfo(svg, 24, 200, 312, 30);
  let steps = [];
  const defs = [
    { label: '先算 6 × 2', key: 'mul' },
    { label: '先算 4 ÷ 2', key: 'div' },
    { label: '再算相加', key: 'add' }
  ];
  function onClick(key) {
    if (steps.indexOf(key) >= 0) return;
    if (key === 'add' && (steps.indexOf('mul') < 0 || steps.indexOf('div') < 0)) {
      info('✗ 先算乘除，再算加减！'); return;
    }
    steps.push(key);
    if (steps.length === 3) info('✓ 正确顺序！ 6×2+4÷2 = *14*');
    else info('继续…');
    render();
  }
  function render() {
    layer.innerHTML = '';
    dgt(layer, 180, 78, '6 × 2 + 4 ÷ 2 = ?', 26, DC.ink);
    defs.forEach(function (d, i) {
      const x = 24 + i * 104, y = 110, w = 96, h = 40;
      const done = steps.indexOf(d.key) >= 0;
      const r = dg('rect', { x: x, y: y, width: w, height: h, rx: 8, fill: done ? DC.green : '#EDE7DA', style: 'cursor:pointer' }, layer);
      const t = dgt(layer, x + w / 2, y + h / 2 + 5, d.label, 11, done ? '#fff' : DC.ink);
      const fn = function () { onClick(d.key); };
      r.addEventListener('click', fn); t.addEventListener('click', fn);
    });
  }
  render();
  info('点按钮，按正确顺序计算');
}

// 图形计数 / 巧数图形：数三角形
function diagCountShapes(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '巧数图形：图中有几个三角形？', 13, DC.gold);
  const cx = 180, cy = 120, s = 70;
  const pts = [[cx - s, cy - s], [cx + s, cy - s], [cx + s, cy + s], [cx - s, cy + s]];
  const layer = dg('g', {}, svg);
  let guess = 0, revealed = false;
  const info = luxInfo(svg, 60, 206, 240, 28);
  function draw() {
    layer.innerHTML = '';
    dg('polygon', { points: pts.map(function (p) { return p.join(','); }).join(' '), fill: '#EDE7DA', stroke: DC.ink, 'stroke-width': 1.5 }, layer);
    dg('line', { x1: pts[0][0], y1: pts[0][1], x2: pts[2][0], y2: pts[2][1], stroke: DC.blue, 'stroke-width': 1.5 }, layer);
    dg('line', { x1: pts[1][0], y1: pts[1][1], x2: pts[3][0], y2: pts[3][1], stroke: DC.blue, 'stroke-width': 1.5 }, layer);
    if (revealed) {
      const tris = [[pts[0], pts[1], [cx, cy]], [pts[1], pts[2], [cx, cy]], [pts[2], pts[3], [cx, cy]], [pts[3], pts[0], [cx, cy]]];
      const cols = [DC.gold, DC.green, DC.blue, DC.red];
      tris.forEach(function (tr, i) {
        dg('polygon', { points: tr.map(function (p) { return p.join(','); }).join(' '), fill: cols[i], 'fill-opacity': 0.45, stroke: cols[i], 'stroke-width': 1.5 }, layer);
        dgt(layer, (tr[0][0] + tr[1][0] + tr[2][0]) / 3, (tr[0][1] + tr[1][1] + tr[2][1]) / 3, String(i + 1), 14, '#fff');
      });
    }
  }
  draw();
  luxSlider(svg, 40, 178, 200, 0, 8, 0, function (v) { guess = Math.round(v); info('你的答案：*' + guess + '*'); }, function (v) { return '猜：' + Math.round(v); });
  svgBtn(svg, 260, 166, 80, 34, '验证', DC.gold, function () { revealed = true; draw(); info(guess === 4 ? '✓ 正确，一共 *4* 个三角形' : '✗ 再数数，其实有 *4* 个'); });
  info('拖动滑块猜数量，点验证');
}

// 测量：用尺子量长度
function diagMeasure(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '测量：用尺子量一量', 13, DC.gold);
  const x0 = 30, y0 = 80, w = 300, cm = 20, pxPer = w / cm;
  for (let i = 0; i <= cm; i++) {
    const x = x0 + i * pxPer, big = (i % 5 === 0);
    dg('line', { x1: x, y1: y0, x2: x, y2: y0 - (big ? 16 : 8), stroke: DC.ink, 'stroke-width': big ? 2 : 1 }, svg);
    if (big) dgt(svg, x, y0 + 18, String(i), 11, DC.light);
  }
  let end = 12;
  const seg = dg('rect', { x: x0, y: y0 - 26, width: end * pxPer, height: 16, rx: 3, fill: DC.gold, 'fill-opacity': 0.5 }, svg);
  const handle = dg('circle', { cx: x0 + end * pxPer, cy: y0, r: 9, fill: DC.red, stroke: '#fff', 'stroke-width': 2, style: 'cursor:grab' }, svg);
  const info = luxInfo(svg, 30, 200, 300, 30);
  dgDrag(svg, handle, function (p) {
    end = Math.max(0, Math.min(cm, (p.x - x0) / pxPer));
    const ex = x0 + end * pxPer;
    handle.setAttribute('cx', ex); seg.setAttribute('width', end * pxPer);
    info('长度 = *' + Math.round(end) + '* 厘米（1 米 = 100 厘米）');
  });
  info('拖动红色手柄测量长度');
}

// 倍的认识：几个几（点阵模型）
function diagMultiples(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '倍的认识：几个几', 13, DC.gold);
  const layer = dg('g', {}, svg);
  const info = luxInfo(svg, 30, 200, 300, 30);
  let rows = 3, cols = 4;
  function draw() {
    layer.innerHTML = '';
    const ox = 70, oy = 50, gw = 22, gh = 22, gap = 6;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = ox + c * (gw + gap), y = oy + r * (gh + gap);
      dg('circle', { cx: x + gw / 2, cy: y + gh / 2, r: gw / 2 - 2, fill: r % 2 ? DC.blue : DC.gold, 'fill-opacity': 0.85 }, layer);
    }
    info('每行 *' + cols + '* 个，*' + rows + '* 行，共 *' + (rows * cols) + '* 个 = *' + rows + '* 个 *' + cols + '*');
  }
  draw();
  luxSlider(svg, 30, 150, 130, 1, 6, cols, function (v) { cols = Math.round(v); draw(); }, function (v) { return '每行 ' + Math.round(v); });
  luxSlider(svg, 200, 150, 130, 1, 5, rows, function (v) { rows = Math.round(v); draw(); }, function (v) { return '行数 ' + Math.round(v); });
}

// 位置与方向（3下）：上下左右
function diagPosition(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '位置与方向：上下左右', 13, DC.gold);
  const ox = 120, oy = 44, g = 38;
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) {
    dg('rect', { x: ox + c * g, y: oy + r * g, width: g, height: g, fill: '#fff', stroke: DC.line, 'stroke-width': 1 }, svg);
  }
  dgt(svg, ox + 1.5 * g, oy - 8, '北', 12, DC.ink);
  dgt(svg, ox + 1.5 * g, oy + 3 * g + 16, '南', 12, DC.ink);
  dgt(svg, ox - 14, oy + 1.5 * g, '西', 12, DC.ink);
  dgt(svg, ox + 3 * g + 10, oy + 1.5 * g, '东', 12, DC.ink);
  let tc = 0, tr = 0;
  const info = luxInfo(svg, 30, 214, 300, 22);
  const layer = dg('g', {}, svg);
  function draw() {
    layer.innerHTML = '';
    const me = { x: ox + 1 * g, y: oy + 1 * g };
    dg('circle', { cx: me.x + g / 2, cy: me.y + g / 2, r: 13, fill: DC.blue }, layer);
    dgt(layer, me.x + g / 2, me.y + g / 2 + 5, '我', 12, '#fff');
    const tp = { x: ox + tc * g, y: oy + tr * g };
    dg('text', { x: tp.x + g / 2, y: tp.y + g / 2 + 6, 'font-size': 16, fill: DC.red, 'text-anchor': 'middle' }, layer).textContent = '★';
    const dir = (tc < 1 ? '左(西)' : tc > 1 ? '右(东)' : '') + ' ' + (tr < 1 ? '上(北)' : tr > 1 ? '下(南)' : '');
    info('旗在“我”的 *' + (dir.trim() || '正中心') + '*');
  }
  draw();
  svgBtn(svg, 50, 184, 44, 26, '←', DC.gold, function () { tc = Math.max(0, Math.min(2, tc - 1)); draw(); });
  svgBtn(svg, 104, 184, 44, 26, '→', DC.gold, function () { tc = Math.max(0, Math.min(2, tc + 1)); draw(); });
  svgBtn(svg, 158, 184, 44, 26, '↑', DC.gold, function () { tr = Math.max(0, Math.min(2, tr - 1)); draw(); });
  svgBtn(svg, 212, 184, 44, 26, '↓', DC.gold, function () { tr = Math.max(0, Math.min(2, tr + 1)); draw(); });
}

// 搭配问题：树状图
function diagTree(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 24, '搭配问题 · 树状图', 13, DC.gold);
  dgt(svg, 180, 44, '2 件上衣 × 3 条裤子 = ？种搭配', 12, DC.ink);
  const layer = dg('g', {}, svg);
  const info = luxInfo(svg, 40, 204, 280, 28);
  let hl = -1;
  const tops = [['红上衣', DC.red, 60], ['蓝上衣', DC.blue, 150]];
  const bots = [['黑裤', DC.ink], ['白裤', DC.gold], ['绿裤', DC.green]];
  function draw() {
    layer.innerHTML = '';
    dg('circle', { cx: 36, cy: 105, r: 7, fill: DC.ink }, layer);
    tops.forEach(function (tp, ti) {
      const ty = tp[2];
      dg('line', { x1: 43, y1: 105, x2: 120, y2: ty, stroke: DC.line, 'stroke-width': 1.5 }, layer);
      dg('circle', { cx: 120, cy: ty, r: 7, fill: tp[1] }, layer);
      dgt(layer, 128, ty + 4, tp[0], 11, DC.ink);
      bots.forEach(function (bp, bi) {
        const by = 50 + bi * 28;
        dg('line', { x1: 127, y1: ty, x2: 230, y2: by, stroke: (hl === ti ? tp[1] : DC.line), 'stroke-width': (hl === ti ? 2 : 1.2) }, layer);
        dg('circle', { cx: 230, cy: by, r: 6, fill: bp[1] }, layer);
        if (hl === ti || hl === -1) dgt(layer, 238, by + 4, bp[0], 11, DC.ink);
      });
    });
    dgt(layer, 300, 105, '6 种', 16, DC.gold);
    info(hl === -1 ? '共 *6* 种搭配（点上方上衣高亮它的 3 种）' : ('已高亮 *3* 种：' + tops[hl][0] + ' 的搭配'));
  }
  draw();
  svgBtn(svg, 40, 176, 130, 26, tops[0][0], DC.red, function () { hl = 0; draw(); });
  svgBtn(svg, 185, 176, 130, 26, tops[1][0], DC.blue, function () { hl = 1; draw(); });
}

// 公顷和平方千米：面积单位换算
function diagAreaUnits(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 24, '面积单位：1 公顷 = 10000 平方米', 13, DC.gold);
  const ox = 95, oy = 40, S = 140;
  const layer = dg('g', {}, svg);
  let m2 = 25000;
  function draw() {
    layer.innerHTML = '';
    dg('rect', { x: ox, y: oy, width: S, height: S, fill: '#EDE7DA', stroke: DC.ink, 'stroke-width': 2 }, layer);
    const n = Math.round(m2 / 10000 * 100);
    const cell = S / 10;
    for (let i = 0; i < 100; i++) {
      if (i < n) { const c = i % 10, r = Math.floor(i / 10); dg('rect', { x: ox + c * cell, y: oy + r * cell, width: cell, height: cell, fill: DC.gold, 'fill-opacity': 0.7 }, layer); }
    }
    dgt(layer, ox + S / 2, oy - 8, '1 公顷', 12, DC.ink);
    dgt(svg, 180, 196, (m2 / 10000).toFixed(2) + ' 公顷 = ' + m2 + ' 平方米', 12, DC.ink);
  }
  draw();
  luxSlider(svg, 30, 218, 300, 0, 100000, m2, function (v) { m2 = Math.round(v / 1000) * 1000; draw(); }, function (v) { return '平方米 ' + Math.round(v); });
}

// 图形认知：点一点看特征
function diagShapeProps(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '图形认知：点一点看特征', 13, DC.gold);
  const shapes = [
    { name: '三角形', draw: function (c) { dg('polygon', { points: '180,55 222,118 138,118', fill: DC.gold, 'fill-opacity': 0.7, stroke: DC.ink, 'stroke-width': 1.5 }, c); }, txt: '3 条边 · 3 个角' },
    { name: '正方形', draw: function (c) { dg('rect', { x: 150, y: 55, width: 60, height: 60, fill: DC.blue, 'fill-opacity': 0.6, stroke: DC.ink, 'stroke-width': 1.5 }, c); }, txt: '4 条边相等 · 4 个直角' },
    { name: '圆', draw: function (c) { dg('circle', { cx: 180, cy: 88, r: 32, fill: DC.green, 'fill-opacity': 0.6, stroke: DC.ink, 'stroke-width': 1.5 }, c); }, txt: '没有边 · 没有角' }
  ];
  const layer = dg('g', {}, svg);
  const info = luxInfo(svg, 30, 200, 300, 30);
  let cur = -1;
  function draw() {
    layer.innerHTML = '';
    const sh = shapes[cur >= 0 ? cur : 0];
    sh.draw(layer);
    dgt(layer, 180, 150, sh.name, 13, DC.ink);
    info(cur >= 0 ? ('*' + sh.name + '*：' + sh.txt) : '点下方按钮，认识图形特征');
  }
  draw();
  shapes.forEach(function (s, i) { svgBtn(svg, 30 + i * 100, 168, 90, 28, s.name, DC.gold, function () { cur = i; draw(); }); });
}

// 位置（数对）：坐标系
function diagCoordPlane(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '用数对确定位置 (列,行)', 13, DC.gold);
  const ox = 70, oy = 60, g = 34, N = 5;
  for (let c = 0; c <= N; c++) dg('line', { x1: ox + c * g, y1: oy, x2: ox + c * g, y2: oy + N * g, stroke: DC.line, 'stroke-width': 1 }, svg);
  for (let r = 0; r <= N; r++) dg('line', { x1: ox, y1: oy + r * g, x2: ox + N * g, y2: oy + r * g, stroke: DC.line, 'stroke-width': 1 }, svg);
  dgt(svg, ox - 12, oy - 8, '(0,0)', 10, DC.light);
  let ccol = 2, rrow = 3;
  const marker = dg('circle', { cx: ox + (ccol + 0.5) * g, cy: oy + (rrow + 0.5) * g, r: 10, fill: DC.red, stroke: '#fff', 'stroke-width': 2, style: 'cursor:grab' }, svg);
  const info = luxInfo(svg, 30, 224, 300, 20);
  dgDrag(svg, marker, function (p) {
    ccol = Math.max(0, Math.min(N - 1, Math.floor((p.x - ox) / g)));
    rrow = Math.max(0, Math.min(N - 1, Math.floor((p.y - oy) / g)));
    marker.setAttribute('cx', ox + (ccol + 0.5) * g);
    marker.setAttribute('cy', oy + (rrow + 0.5) * g);
    info('位置数对 = (*' + (ccol + 1) + '* , *' + (rrow + 1) + '*)');
  });
  info('拖动红点，看它的(列,行)');
}

// 因数与倍数：找因数对
function diagFactors(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '因数与倍数：找因数对', 13, DC.gold);
  const layer = dg('g', {}, svg);
  const info = luxInfo(svg, 30, 206, 300, 26);
  let N = 12;
  function draw() {
    layer.innerHTML = '';
    dgt(layer, 180, 58, '数 ' + N + ' 的因数', 15, DC.ink);
    const pairs = [];
    for (let i = 1; i <= N; i++) if (N % i === 0) pairs.push([i, N / i]);
    dgt(layer, 180, 86, pairs.map(function (p) { return p[0] + '×' + p[1]; }).join('   '), 12, DC.green);
    dgt(layer, 180, 114, '因数有 ' + (pairs.length * 2) + ' 个；最小因数是 1', 12, DC.ink);
    dgt(layer, 180, 142, '前 5 个倍数：' + [1, 2, 3, 4, 5].map(function (k) { return N * k; }).join('、'), 12, DC.blue);
    info('*' + N + '* 的因数对已列出');
  }
  draw();
  luxSlider(svg, 30, 176, 300, 1, 60, N, function (v) { N = Math.round(v); draw(); }, function (v) { return '选数 ' + Math.round(v); });
}

// 位置与方向（二）：辨认方向（罗盘）
function diagBearing(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '方向与位置：辨认方向', 13, DC.gold);
  const cx = 180, cy = 120, R = 66;
  const dirs = [['北', 0], ['东北', 45], ['东', 90], ['东南', 135], ['南', 180], ['西南', 225], ['西', 270], ['西北', 315]];
  const layer = dg('g', {}, svg);
  const info = luxInfo(svg, 60, 212, 240, 24);
  let ang = 0;
  function draw() {
    layer.innerHTML = '';
    dg('circle', { cx: cx, cy: cy, r: R, fill: '#fff', stroke: DC.ink, 'stroke-width': 1.5 }, layer);
    dirs.forEach(function (d) { const a = rad(d[1] - 90); dgt(layer, cx + R * Math.cos(a), cy + R * Math.sin(a) + 4, d[0], 11, DC.ink); });
    const a = rad(ang - 90);
    const ex = cx + R * 0.8 * Math.cos(a), ey = cy + R * 0.8 * Math.sin(a);
    dg('line', { x1: cx, y1: cy, x2: ex, y2: ey, stroke: DC.red, 'stroke-width': 3 }, layer);
    dg('circle', { cx: ex, cy: ey, r: 5, fill: DC.red }, layer);
    const name = dirs.reduce(function (best, d) { return Math.abs(((d[1] - ang + 540) % 360) - 180) < Math.abs(((best[1] - ang + 540) % 360) - 180) ? d : best; });
    info('箭头指向 *' + name[0] + '*');
  }
  draw();
  svgBtn(svg, 40, 176, 80, 28, '↺ 左转', DC.gold, function () { ang = (ang - 45 + 360) % 360; draw(); });
  svgBtn(svg, 240, 176, 80, 28, '右转 ↻', DC.gold, function () { ang = (ang + 45) % 360; draw(); });
}

// 按比分配：把总数按比例分
function diagRatioSplit(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '按比分配：把总数按比例分', 13, DC.gold);
  const layer = dg('g', {}, svg);
  const info = luxInfo(svg, 30, 206, 300, 26);
  let T = 100, a = 2, b = 3;
  function draw() {
    layer.innerHTML = '';
    const total = a + b;
    const x = 30, y = 70, w = 300, h = 40;
    const w1 = w * a / total, w2 = w * b / total;
    dg('rect', { x: x, y: y, width: w1, height: h, rx: 6, fill: DC.gold }, layer);
    dg('rect', { x: x + w1, y: y, width: w2, height: h, rx: 6, fill: DC.blue }, layer);
    dgt(layer, x + w1 / 2, y + h / 2 + 5, '甲 ' + Math.round(T * a / total), 12, '#fff');
    dgt(layer, x + w1 + w2 / 2, y + h / 2 + 5, '乙 ' + Math.round(T * b / total), 12, '#fff');
    info('总数 *' + T + '* 按 *' + a + ':' + b + '* 分 → 甲 *' + Math.round(T * a / total) + '*，乙 *' + Math.round(T * b / total) + '*');
  }
  draw();
  luxSlider(svg, 30, 130, 140, 20, 200, T, function (v) { T = Math.round(v); draw(); }, function (v) { return '总数 ' + Math.round(v); });
  luxSlider(svg, 190, 130, 140, 1, 5, a, function (v) { a = Math.round(v); draw(); }, function (v) { return '甲比 ' + Math.round(v); });
  luxSlider(svg, 190, 160, 140, 1, 5, b, function (v) { b = Math.round(v); draw(); }, function (v) { return '乙比 ' + Math.round(v); });
}

// 总复习：知识卡片回顾
function diagReviewMap(container, opts) {
  const svg = dgMake(container, 360, 240);
  dgBg(svg, 360, 240);
  dgt(svg, 180, 26, '六下总复习 · 点卡片回顾', 13, DC.gold);
  const topics = [
    { t: '分数', f: '分子/分母，同分母加减' },
    { t: '百分数', f: '百分数就是百分之几' },
    { t: '比', f: 'a:b = a÷b' },
    { t: '圆柱圆锥', f: '体积 V=πr²h' },
    { t: '正比例', f: 'y/x = k（一定）' },
    { t: '统计', f: '条形/折线/扇形' }
  ];
  const layer = dg('g', {}, svg);
  const info = luxInfo(svg, 30, 210, 300, 26);
  let cur = -1;
  function draw() {
    layer.innerHTML = '';
    topics.forEach(function (tp, i) {
      const c = i % 3, r = Math.floor(i / 3);
      const x = 30 + c * 110, y = 50 + r * 70;
      const on = (cur === i);
      const rect = dg('rect', { x: x, y: y, width: 100, height: 56, rx: 10, fill: on ? DC.gold : '#fff', stroke: DC.line, 'stroke-width': 1.5, style: 'cursor:pointer' }, layer);
      const t = dgt(layer, x + 50, y + 22, tp.t, 14, on ? '#fff' : DC.ink);
      const fn = function () { cur = i; draw(); };
      rect.addEventListener('click', fn); t.addEventListener('click', fn);
    });
    if (cur >= 0) info('*' + topics[cur].t + '*：' + topics[cur].f);
    else info('点上面任意卡片，回顾核心知识');
  }
  draw();
}

// ============================================================
// 圆柱与圆锥的体积：切拼探究 / 倒水实验 / 体积计算 / 随堂挑战
// 移植自《圆柱和圆锥的体积·交互动画》（OpenMAIC 模拟型互动组件范式）
// 自包含：原生 SVG + 内联样式，移动端「同步学习」与 PC 工作台共用
// ============================================================
function diagCylinderCone(container, opts){
  opts = opts || {};
  const C = { primary:'#3E4A63', gold:'#B4945A', goldDeep:'#9A7B42', goldSoft:'#FCF9F2',
              line:'#E8E2D6', ink2:'#6B7590', success:'#4E8C6E', accent:'#C2554F',
              liquid:'#C9AC74', liquidDeep:'#B4945A' };
  const PI = 3.14;
  function svgEl(tag, attrs){ const e=document.createElementNS('http://www.w3.org/2000/svg', tag); if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function el(tag, st, parent, html){ const e=document.createElement(tag); if(st) e.style.cssText=st; if(parent) parent.appendChild(e); if(html!=null) e.innerHTML=html; return e; }
  function txt(parent,x,y,s,size,fill,weight,anchor){ const t=svgEl('text',{x:x,y:y,'font-size':size,fill:fill,'font-weight':weight||400,'text-anchor':anchor||'middle'}); t.textContent=s; parent.appendChild(t); return t; }
  function tween(from,to,dur,onStep,onDone){ const t0=(window.performance&&performance.now)?performance.now():Date.now(); function frame(now){ const k=Math.min(1,(now-t0)/dur); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; onStep(from+(to-from)*e); if(k<1) requestAnimationFrame(frame); else if(onDone) onDone(); } requestAnimationFrame(frame); }

  container.innerHTML='';
  const root = el('div', 'font-family:inherit;color:'+C.primary+';', container);
  el('div', 'font-size:13px;color:'+C.ink2+';line-height:1.7;margin-bottom:10px;', root,
     '像做实验一样学数学：动手切一切、倒一倒，自己发现 <b>V = Sh</b> 与 <b>V = ⅓Sh</b> 的秘密。');

  // Tab 栏
  const TABS=[{id:'derive',label:'切拼探究'},{id:'pour',label:'倒水实验'},{id:'calc',label:'体积计算'},{id:'quiz',label:'随堂挑战'}];
  const tabBar = el('div', 'display:flex;gap:6px;margin-bottom:12px;', root);
  const panels={}; const tabBtns={};
  function setTab(id){
    for(const k in panels) panels[k].style.display = (k===id)?'block':'none';
    TABS.forEach(function(t){ const on=(t.id===id); const b=tabBtns[t.id];
      b.style.background = on?C.primary:'#fff'; b.style.color = on?'#fff':C.ink2; b.style.borderColor = on?C.primary:C.line; });
  }
  TABS.forEach(function(t){
    const b=el('button', 'flex:1;min-height:48px;border:1px solid '+C.line+';background:#fff;border-radius:12px;color:'+C.ink2+';font-size:14px;font-weight:600;cursor:pointer;', tabBar, t.label);
    b.onclick=function(){ setTab(t.id); }; tabBtns[t.id]=b;
    panels[t.id]=el('div', '', root);
  });
  function cardOf(p, no, title){
    const card=el('div','background:#fff;border:1px solid '+C.line+';border-radius:16px;padding:16px;margin-bottom:12px;',p);
    if(title) el('div','font-size:16px;font-weight:700;margin-bottom:8px;',card, no+' '+title);
    return card;
  }

  /* ---------- 1. 切拼探究 ---------- */
  (function(){
    const p=panels.derive;
    const card=cardOf(p,'①','圆柱的底面能变成长方形吗？');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '把圆柱的底面圆平均分成若干份，切开后再拼一拼——猜猜会变成什么形状？分的份数越多，越接近什么？');
    const segWrap=el('div','display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;',card);
    const seg=el('div','display:inline-flex;background:'+C.goldSoft+';border:1px solid '+C.line+';border-radius:10px;padding:3px;gap:3px;',segWrap);
    const segData=[8,16,32]; const segBtns={};
    segData.forEach(function(n){ const sb=el('button',(n===16?'background:#fff;color:'+C.primary+';':'background:transparent;color:'+C.ink2+';')+'min-height:44px;padding:0 14px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;',seg, n+' 份'); sb.onclick=function(){ segData.forEach(function(m){ segBtns[m].style.background='transparent'; segBtns[m].style.color=C.ink2; }); sb.style.background='#fff'; sb.style.color=C.primary; CUT.N=n; CUT.morph=0; btnMorph.textContent='开始切拼'; cutFormula.style.display='none'; cutBuild(); }; segBtns[n]=sb; });
    el('div','font-size:12.5px;color:'+C.ink2+';',segWrap,'份数越多 → 越像长方形');
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 330',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    const btnRow=el('div','display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px;',card);
    const btnMorph=el('button','min-height:48px;padding:0 22px;border-radius:12px;border:none;font-size:15px;font-weight:600;cursor:pointer;background:'+C.primary+';color:#fff;',btnRow,'开始切拼');
    const btnReset=el('button','min-height:48px;padding:0 22px;border-radius:12px;border:1px solid '+C.line+';font-size:15px;font-weight:600;cursor:pointer;background:#fff;color:'+C.primary+';',btnRow,'还原成圆');
    const cutFormula=el('div','display:none;margin-top:12px;border-radius:12px;padding:12px 16px;text-align:center;font-size:16px;font-weight:700;color:'+C.primary+';background:'+C.goldSoft+';border:1px solid #E8D9B8;',card,
       '长方体体积 = 底面积 × 高 → V<sub>柱</sub> = πr²h <br><span style="font-size:12px;font-weight:400;color:'+C.ink2+';">拼成的长方形：长 ≈ πr（半个圆周），宽 ≈ r，所以底面积 S = πr × r = πr²</span>');
    el('div','font-size:12.5px;color:'+C.ink2+';line-height:1.7;margin-top:10px;padding-left:10px;border-left:3px solid #E8D9B8;',card,
       '发现了吗？圆柱切拼后得到一个近似的长方体——它的高就是圆柱的高 h，底面积就是圆的面积 πr²，所以圆柱的体积 = 底面积 × 高。');

    const CUT={N:16,r:70,cx:120,cy:165,rx:350,ry:165,morph:0,anim:false,wedges:[],layout:[]};
    function cutWedgePath(r,alpha){ const x1=r*Math.cos(-alpha/2),y1=r*Math.sin(-alpha/2),x2=r*Math.cos(alpha/2),y2=r*Math.sin(alpha/2); return 'M0,0 L'+x1.toFixed(2)+','+y1.toFixed(2)+' A'+r+','+r+' 0 0 1 '+x2.toFixed(2)+','+y2.toFixed(2)+' Z'; }
    function cutComputeLayout(){ const N=CUT.N,r=CUT.r,alpha=2*Math.PI/N,W=PI*r,s=W/N,x0=CUT.rx-W/2,yB=CUT.ry+r/2,yT=CUT.ry-r/2; CUT.layout=[]; for(let i=0;i<N;i++){ if(i%2===0) CUT.layout.push({x:x0+(i+1)*s,y:yB,deg:-90}); else CUT.layout.push({x:x0+(i+1)*s,y:yT,deg:90}); } }
    function cutBuild(){ cutComputeLayout(); const N=CUT.N,alpha=2*Math.PI/N; svg.innerHTML=''; CUT.wedges=[];
      txt(svg,CUT.cx,58,'底面圆（俯视）',13,C.ink2,600);
      txt(svg,CUT.rx,58,'切开后拼一拼',13,C.ink2,600);
      svg.appendChild(svgEl('circle',{cx:CUT.cx,cy:CUT.cy,r:3,fill:C.goldDeep}));
      for(let i=0;i<N;i++){ const g=svgEl('g',{}); const pa=svgEl('path',{d:cutWedgePath(CUT.r,alpha),fill:i%2===0?'#E5D5B6':'#D9C498',stroke:C.goldDeep,'stroke-width':0.9,'stroke-linejoin':'round'}); g.appendChild(pa); svg.appendChild(g); CUT.wedges.push({g:g,p:pa,i:i,circleDeg:i*360/N,rect:CUT.layout[i]}); }
      cutApply(CUT.morph); cutDims(CUT.morph>.5); }
    function cutApply(m){ CUT.morph=m; CUT.wedges.forEach(function(w){ const cx=CUT.cx+(w.rect.x-CUT.cx)*m, cy=CUT.cy+(w.rect.y-CUT.cy)*m, deg=w.circleDeg+(w.rect.deg-w.circleDeg)*m; w.g.setAttribute('transform','translate('+cx.toFixed(2)+','+cy.toFixed(2)+') rotate('+deg.toFixed(2)+')'); }); }
    function cutDims(show){ const old=svg.querySelector('.dims'); if(old) old.remove(); if(!show) return; const W=PI*CUT.r,r=CUT.r,x0=CUT.rx-W/2,x1=CUT.rx+W/2,yT=CUT.ry-r/2-14,yB=CUT.ry+r/2+30; const g=svgEl('g',{class:'dims'});
      g.appendChild(svgEl('line',{x1:x0,y1:yT,x2:x1,y2:yT,stroke:C.goldDeep,'stroke-width':1.4}));
      g.appendChild(svgEl('line',{x1:x0,y1:yT-5,x2:x0,y2:yT+5,stroke:C.goldDeep,'stroke-width':1.4}));
      g.appendChild(svgEl('line',{x1:x1,y1:yT-5,x2:x1,y2:yT+5,stroke:C.goldDeep,'stroke-width':1.4}));
      txt(g,(x0+x1)/2,yT-8,'长 ≈ πr（半个圆周）',14,C.goldDeep,700);
      const xr=x1+22; g.appendChild(svgEl('line',{x1:xr,y1:CUT.ry-r/2,x2:xr,y2:CUT.ry+r/2,stroke:C.goldDeep,'stroke-width':1.4}));
      g.appendChild(svgEl('line',{x1:xr-5,y1:CUT.ry-r/2,x2:xr+5,y2:CUT.ry-r/2,stroke:C.goldDeep,'stroke-width':1.4}));
      g.appendChild(svgEl('line',{x1:xr-5,y1:CUT.ry+r/2,x2:xr+5,y2:CUT.ry+r/2,stroke:C.goldDeep,'stroke-width':1.4}));
      txt(g,xr+10,CUT.ry+5,'宽 ≈ r',14,C.goldDeep,700);
      txt(g,CUT.rx,yB,'底面积 S = πr × r = πr²',14.5,C.primary,700);
      svg.appendChild(g); }
    btnMorph.onclick=function(){ if(CUT.anim) return; CUT.anim=true; const b=this; b.disabled=true; const target=CUT.morph<.5?1:0; tween(CUT.morph,target,1100,function(v){cutApply(v);},function(){ CUT.anim=false; b.disabled=false; b.textContent=CUT.morph>.5?'还原成圆':'开始切拼'; cutDims(CUT.morph>.5); cutFormula.style.display=CUT.morph>.5?'block':'none'; }); };
    btnReset.onclick=function(){ if(CUT.anim) return; cutApply(0); cutDims(false); btnMorph.textContent='开始切拼'; cutFormula.style.display='none'; };
    cutBuild();
  })();

  /* ---------- 2. 倒水实验 ---------- */
  (function(){
    const p=panels.pour;
    const card=cardOf(p,'②','圆锥要倒几次才能装满圆柱？');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '准备一个圆锥形容器和与它<b>等底等高</b>的圆柱形容器。把圆锥装满水，倒进圆柱里……倒几次能正好装满？先猜一猜，再动手试。');
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 320',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    const pourCount=el('div','text-align:center;font-size:14px;font-weight:600;color:'+C.ink2+';margin-top:10px;',card,'已倒入 <b style="color:'+C.goldDeep+';font-size:17px">0</b> 次，圆柱里的水占了 <b style="color:'+C.goldDeep+';font-size:17px">0 / 3</b> 份');
    const btnRow=el('div','display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px;',card);
    const btnPour=el('button','min-height:48px;padding:0 22px;border-radius:12px;border:none;font-size:15px;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#C4A266,#B4945A);color:#fff;',btnRow,'倒一次');
    const btnReset=el('button','min-height:48px;padding:0 22px;border-radius:12px;border:1px solid '+C.line+';font-size:15px;font-weight:600;cursor:pointer;background:#fff;color:'+C.primary+';',btnRow,'重新开始');
    const conclusion=el('div','display:none;margin-top:12px;border-radius:12px;padding:14px 16px;text-align:center;background:linear-gradient(135deg,'+C.goldSoft+',#F5EDDD);border:1.5px solid '+C.gold+';',card,
       '<div style="font-size:17px;font-weight:700;color:'+C.primary+';">倒了整整 3 次，正好装满！</div><div style="font-size:13px;color:'+C.ink2+';margin-top:6px;line-height:1.7;">等底等高时：圆锥体积 = 圆柱体积 × ⅓<br>即 V<sub>锥</sub> = ⅓ · πr²h = ⅓ · S · h</div>');
    el('div','font-size:12.5px;color:'+C.ink2+';line-height:1.7;margin-top:10px;padding-left:10px;border-left:3px solid #E8D9B8;',card,
       '实验结论：圆锥的体积是与它等底等高圆柱体积的三分之一。记住「等底等高」这个前提——如果底或高不同，就不是简单的 3 倍关系了。');

    const POUR={pours:0,anim:false};
    const PG={coneX:170,cylX:390,baseY:105,tipY:275,rw:78,rh:20};
    function appendText(parent,x,y,s,size,fill,weight,anchor){ const t=svgEl('text',{x:x,y:y,'font-size':size,fill:fill,'font-weight':weight||400,'text-anchor':anchor||'middle'}); t.textContent=s; parent.appendChild(t); return t; }
    function buildPour(){ svg.innerHTML=''; const g=PG;
      const coneG=svgEl('g',{});
      coneG.appendChild(svgEl('path',{d:'M'+g.coneX+','+g.baseY+' L'+(g.coneX-g.rw)+','+(g.tipY-g.rh)+' A'+g.rw+','+g.rh+' 0 0 0 '+(g.coneX-g.rw)+','+(g.tipY+g.rh)+' L'+g.coneX+','+g.tipY+' Z',fill:'#EFE9DC',stroke:C.primary,'stroke-width':2,'stroke-linejoin':'round'}));
      const clip=svgEl('clipPath',{id:'coneClipCC'}); clip.appendChild(svgEl('rect',{id:'coneClipRectCC',x:g.coneX-g.rw-4,y:g.tipY-4,width:g.rw*2+8,height:4})); svg.appendChild(clip);
      const coneLiq=svgEl('path',{d:'M'+g.coneX+','+g.baseY+' L'+(g.coneX-g.rw)+','+(g.tipY-g.rh)+' A'+g.rw+','+g.rh+' 0 0 0 '+(g.coneX-g.rw)+','+(g.tipY+g.rh)+' L'+g.coneX+','+g.tipY+' Z',fill:'url(#liqGradCC)','clip-path':'url(#coneClipCC)'});
      const defs=svgEl('defs',{}); const lg=svgEl('linearGradient',{id:'liqGradCC',x1:0,y1:0,x2:0,y2:1}); lg.appendChild(svgEl('stop',{offset:'0%','stop-color':'#D8BC85'})); lg.appendChild(svgEl('stop',{offset:'100%','stop-color':C.liquidDeep})); defs.appendChild(lg); svg.appendChild(defs);
      svg.appendChild(coneG); svg.appendChild(coneLiq);
      svg.appendChild(svgEl('ellipse',{cx:g.coneX,cy:g.baseY,rx:g.rw,ry:g.rh,fill:'none',stroke:C.primary,'stroke-width':2}));
      appendText(svg,g.coneX,g.baseY-34,'圆锥容器（满的）',13.5,C.ink2,600);
      appendText(svg,g.coneX,g.tipY+34,'等底 · 等高',12.5,C.goldDeep,700);
      const cylG=svgEl('g',{});
      cylG.appendChild(svgEl('path',{d:'M'+(g.cylX-g.rw)+','+g.baseY+' L'+(g.cylX-g.rw)+','+g.tipY+' A'+g.rw+','+g.rh+' 0 0 0 '+(g.cylX+g.rw)+','+g.tipY+' L'+(g.cylX+g.rw)+','+g.baseY+' A'+g.rw+','+g.rh+' 0 0 1 '+(g.cylX-g.rw)+','+g.baseY+' Z',fill:'#EFE9DC',stroke:C.primary,'stroke-width':2,'stroke-linejoin':'round'})); svg.appendChild(cylG);
      const clip2=svgEl('clipPath',{id:'cylClipCC'}); clip2.appendChild(svgEl('rect',{id:'cylClipRectCC',x:g.cylX-g.rw-4,y:g.tipY,width:g.rw*2+8,height:0})); svg.appendChild(clip2);
      const cylLiq=svgEl('path',{d:'M'+(g.cylX-g.rw)+','+g.baseY+' L'+(g.cylX-g.rw)+','+g.tipY+' A'+g.rw+','+g.rh+' 0 0 0 '+(g.cylX+g.rw)+','+g.tipY+' L'+(g.cylX+g.rw)+','+g.baseY+' A'+g.rw+','+g.rh+' 0 0 1 '+(g.cylX-g.rw)+','+g.baseY+' Z',fill:'url(#liqGradCC)','clip-path':'url(#cylClipCC)'}); svg.appendChild(cylLiq);
      svg.appendChild(svgEl('ellipse',{cx:g.cylX,cy:g.baseY,rx:g.rw,ry:g.rh,fill:'none',stroke:C.primary,'stroke-width':2}));
      for(let k=1;k<=3;k++){ const yy2=g.tipY+(g.baseY-g.tipY)*(k/3); svg.appendChild(svgEl('line',{x1:g.cylX+g.rw-26,y1:yy2,x2:g.cylX+g.rw+4,y2:yy2,stroke:C.goldDeep,'stroke-width':1.2,'stroke-dasharray':'3 3'})); appendText(svg,g.cylX+g.rw+10,yy2+4,k===3?'满':(k+'/3'),11.5,C.goldDeep,700); }
      appendText(svg,g.cylX,g.baseY-34,'圆柱容器（等底等高）',13.5,C.ink2,600);
      const stream=svgEl('rect',{id:'streamCC',x:g.coneX-3,y:g.tipY,width:6,height:0,fill:C.liquid,opacity:0,rx:3}); svg.appendChild(stream);
      appendText(svg,(g.coneX+g.cylX)/2+10,g.baseY-60,'装满圆锥 → 倒入圆柱',12.5,C.ink2,400);
    }
    function setPourLevels(coneLv,cylLv){ const g=PG,coneH=g.tipY-g.baseY; const cr=svg.querySelector('#coneClipRectCC'); const lv=Math.max(0,Math.min(1,coneLv)); cr.setAttribute('y',g.tipY-coneH*lv); cr.setAttribute('height',coneH*lv+g.rh+8); const cc=svg.querySelector('#cylClipRectCC'); const lv2=Math.max(0,Math.min(1,cylLv)); cc.setAttribute('y',g.tipY-(g.tipY-g.baseY)*lv2+1); cc.setAttribute('height',(g.tipY-g.baseY)*lv2+g.rh+8); }
    function updatePourCount(){ pourCount.innerHTML='已倒入 <b style="color:'+C.goldDeep+';font-size:17px">'+POUR.pours+'</b> 次，圆柱里的水占了 <b style="color:'+C.goldDeep+';font-size:17px">'+POUR.pours+' / 3</b> 份'; }
    btnPour.onclick=function(){ if(POUR.anim||POUR.pours>=3) return; POUR.anim=true; const b=this; b.disabled=true; const stream=svg.querySelector('#streamCC'); stream.setAttribute('opacity',1); tween(1,0,750,function(v){setPourLevels(v,POUR.pours/3);},function(){ tween(POUR.pours/3,(POUR.pours+1)/3,750,function(v){setPourLevels(0,v);},function(){ stream.setAttribute('opacity',0); POUR.pours++; POUR.anim=false; updatePourCount(); if(POUR.pours>=3){ conclusion.style.display='block'; b.textContent='实验完成'; setPourLevels(1,1); } else { setPourLevels(1,POUR.pours/3); b.disabled=false; b.textContent='倒一次（第 '+(POUR.pours+1)+' 次）'; } }); }); };
    btnReset.onclick=function(){ if(POUR.anim) return; POUR.pours=0; setPourLevels(1,0); updatePourCount(); conclusion.style.display='none'; btnPour.disabled=false; btnPour.textContent='倒一次'; };
    buildPour(); setPourLevels(1,0);
  })();

  /* ---------- 3. 体积计算 ---------- */
  (function(){
    const p=panels.calc;
    const card=cardOf(p,'③','拖动滑块，看体积怎么变');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '自己选一个半径 r 和高 h（π 取 3.14），看看圆柱和圆锥的体积各是多少、它们之间差多少。');
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 300',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    function appendText(parent,x,y,s,size,fill,weight,anchor){ const t=svgEl('text',{x:x,y:y,'font-size':size,fill:fill,'font-weight':weight||400,'text-anchor':anchor||'middle'}); t.textContent=s; parent.appendChild(t); return t; }
    const defs=svgEl('defs',{}); const g1=svgEl('linearGradient',{id:'cgCalc1',x1:0,y1:0,x2:0,y2:1}); g1.appendChild(svgEl('stop',{offset:'0%','stop-color':'#EFE6D3'})); g1.appendChild(svgEl('stop',{offset:'100%','stop-color':'#E3D5BC'})); defs.appendChild(g1); const g2=svgEl('linearGradient',{id:'cgCalc2',x1:0,y1:0,x2:0,y2:1}); g2.appendChild(svgEl('stop',{offset:'0%','stop-color':'#E7EBF2'})); g2.appendChild(svgEl('stop',{offset:'100%','stop-color':'#D5DBE7'})); defs.appendChild(g2); svg.appendChild(defs);
    function drawCalc(r,h){ svg.innerHTML=''; svg.appendChild(defs); const rw=18+r*5.4,hh=40+h*10,rh=rw*0.24,baseY=265,coneX=155,cylX=385; const topY=baseY-hh;
      svg.appendChild(svgEl('path',{d:'M'+coneX+','+baseY+' L'+(coneX-rw)+','+topY+' A'+rw+','+rh+' 0 0 0 '+(coneX+rw)+','+topY+' Z',fill:'url(#cgCalc1)',stroke:C.primary,'stroke-width':2,'stroke-linejoin':'round'}));
      svg.appendChild(svgEl('ellipse',{cx:coneX,cy:topY,rx:rw,ry:rh,fill:'#EFE9DC',stroke:C.primary,'stroke-width':2}));
      appendText(svg,coneX,topY-26,'圆锥',13.5,C.ink2,600); appendText(svg,coneX,baseY+30,'V = ⅓πr²h',14,C.goldDeep,700);
      const cTop=baseY-hh; svg.appendChild(svgEl('path',{d:'M'+(cylX-rw)+','+cTop+' L'+(cylX-rw)+','+baseY+' A'+rw+','+rh+' 0 0 0 '+(cylX+rw)+','+baseY+' L'+(cylX+rw)+','+cTop+' A'+rw+','+rh+' 0 0 1 '+(cylX-rw)+','+cTop+' Z',fill:'url(#cgCalc2)',stroke:C.primary,'stroke-width':2,'stroke-linejoin':'round'}));
      svg.appendChild(svgEl('ellipse',{cx:cylX,cy:cTop,rx:rw,ry:rh,fill:'#EFE9DC',stroke:C.primary,'stroke-width':2}));
      appendText(svg,cylX,cTop-26,'圆柱',13.5,C.ink2,600); appendText(svg,cylX,baseY+30,'V = πr²h',14,C.primary,700);
      appendText(svg,coneX+rw+16,baseY+5,'r='+r,12.5,C.ink2,600,'start');
      appendText(svg,cylX-rw-16,(cTop+baseY)/2+5,'h='+h,12.5,C.ink2,600,'end'); }
    function sliderRow(label,min,max,val){ const row=el('div','display:flex;align-items:center;gap:12px;margin:14px 0;',card); el('label','font-size:14px;font-weight:600;flex:none;width:86px;',row,label); const inp=el('input','flex:1;-webkit-appearance:none;height:44px;background:transparent;cursor:pointer;',row); inp.type='range'; inp.min=min; inp.max=max; inp.step=1; inp.value=val; const out=el('output','font-size:15px;font-weight:700;color:'+C.goldDeep+';width:64px;text-align:right;flex:none;',row,val+' cm'); return {inp:inp,out:out}; }
    const rgR=sliderRow('半径 r',1,10,3); const rgH=sliderRow('高 h',2,15,6);
    const grid=el('div','display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;',card);
    const boxCyl=el('div','border:1px solid '+C.line+';border-radius:12px;padding:12px;text-align:center;',grid);
    const boxCon=el('div','border:1px solid '+C.line+';border-radius:12px;padding:12px;text-align:center;',grid);
    el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',boxCyl,'圆柱体积'); el('div','font-size:13px;color:'+C.primary+';margin-top:6px;line-height:1.7;',boxCyl,'V = πr²h'); const vCyl_v=el('div','font-size:20px;font-weight:700;margin-top:6px;color:'+C.primary+';',boxCyl,'169.56'); el('div','font-size:11px;color:'+C.ink2+';',boxCyl,'立方厘米（cm³）');
    el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',boxCon,'圆锥体积'); el('div','font-size:13px;color:'+C.primary+';margin-top:6px;line-height:1.7;',boxCon,'V = ⅓πr²h'); const vCon_v=el('div','font-size:20px;font-weight:700;margin-top:6px;color:'+C.goldDeep+';',boxCon,'56.52'); el('div','font-size:11px;color:'+C.ink2+';',boxCon,'立方厘米（cm³）');
    const ratioBar=el('div','margin-top:14px;',card);
    el('div','font-size:12.5px;color:'+C.ink2+';margin-bottom:8px;text-align:center;',ratioBar,'体积对比（等底等高：圆柱 = 圆锥 × 3）');
    const rbCyl=el('div','margin-bottom:8px;display:flex;align-items:center;gap:8px;',ratioBar); el('span','font-size:12.5px;font-weight:600;width:52px;flex:none;',rbCyl,'圆柱'); const rbTrackCyl=el('div','flex:1;height:22px;background:'+C.goldSoft+';border-radius:6px;overflow:hidden;',rbCyl); const rbFillCyl=el('div','height:100%;border-radius:6px;background:linear-gradient(90deg,#4A5878,#3E4A63);transition:width .3s ease;',rbTrackCyl); const rbNumCyl=el('span','font-size:12.5px;font-weight:700;width:66px;flex:none;text-align:right;',rbCyl,'169.56');
    const rbCon=el('div','margin-bottom:8px;display:flex;align-items:center;gap:8px;',ratioBar); el('span','font-size:12.5px;font-weight:600;width:52px;flex:none;',rbCon,'圆锥'); const rbTrackCon=el('div','flex:1;height:22px;background:'+C.goldSoft+';border-radius:6px;overflow:hidden;',rbCon); const rbFillCon=el('div','height:100%;border-radius:6px;background:linear-gradient(90deg,#C9AC74,#B4945A);transition:width .3s ease;',rbTrackCon); const rbNumCon=el('span','font-size:12.5px;font-weight:700;width:66px;flex:none;text-align:right;',rbCon,'56.52');
    function calcUpdate(){ const r=+rgR.inp.value,h=+rgH.inp.value; rgR.out.textContent=r+' cm'; rgH.out.textContent=h+' cm'; const vC=PI*r*r*h,vK=vC/3; vCyl_v.textContent=vC.toFixed(2); vCon_v.textContent=vK.toFixed(2); rbNumCyl.textContent=vC.toFixed(2); rbNumCon.textContent=vK.toFixed(2); rbFillCyl.style.width='100%'; rbFillCon.style.width=(vC>0?vK/vC*100:0).toFixed(1)+'%'; drawCalc(r,h); }
    rgR.inp.addEventListener('input',calcUpdate); rgH.inp.addEventListener('input',calcUpdate); calcUpdate();
  })();

  /* ---------- 4. 随堂挑战 ---------- */
  (function(){
    const p=panels.quiz;
    const card=cardOf(p,'④','随堂挑战 · 你学会了吗');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,'共 3 题。答错不要紧——先看提示再想一想，实在想不出再看答案。');
    const quizBox=el('div','',card);
    const quizScore=el('div','display:none;text-align:center;padding:14px;',card);
    const QUIZ=[
      { q:'一个圆柱与一个圆锥等底等高，圆柱的体积是圆锥体积的（　）倍。', opts:['2','3','6','⅓'], ans:1,
        hint:'回忆一下倒水实验：圆锥装满水倒入等底等高的圆柱，倒了整整几次才装满？',
        exp:'实验里倒了 3 次正好装满，所以等底等高时圆柱体积是圆锥的 3 倍。' },
      { q:'一个圆锥形沙堆，底面半径 3 m，高 6 m。它的体积是多少立方米？（π 取 3.14）', opts:['56.52','169.56','18.84','28.26'], ans:0,
        hint:'圆锥体积要先算圆柱体积 πr²h = 3.14 × 9 × 6，再除以 3。算一算：3.14 × 9 × 6 = ? 除以 3 呢？',
        exp:'V = ⅓ × 3.14 × 3² × 6 = ⅓ × 169.56 = 56.52（m³）。注意别忘了除以 3！' },
      { q:'一个圆柱的体积是 45 cm³，与它等底等高的圆锥体积是多少？', opts:['135 cm³','45 cm³','15 cm³','30 cm³'], ans:2,
        hint:'等底等高时，圆锥体积是圆柱的三分之一——把 45 平均分成 3 份是多少？',
        exp:'V锥 = 45 ÷ 3 = 15（cm³）。圆锥是圆柱的 ⅓，用除法。' }
    ];
    const qs={idx:0,score:0,tries:0};
    function renderQuiz(){ quizScore.style.display='none';
      if(qs.idx>=QUIZ.length){ quizScore.style.display='block';
        quizScore.innerHTML='<div style="font-size:30px;font-weight:700;color:'+C.primary+';">'+qs.score+'<small style="font-size:14px;color:'+C.ink2+';font-weight:400;"> / 3 题</small></div><div style="font-size:13.5px;color:'+C.ink2+';margin-top:6px;">'+(qs.score===3?'全对！圆柱和圆锥的体积你已经完全掌握了。':qs.score===2?'很不错！再回顾一下错的那道题。':'没关系，回到「倒水实验」再看一遍，你会发现规律其实很简单。')+'</div><div style="margin-top:10px;"><button id="restartBtnCC" style="min-height:48px;padding:0 22px;border-radius:12px;border:none;background:'+C.primary+';color:#fff;font-size:15px;font-weight:600;cursor:pointer;">再来一轮</button></div>';
        const rb=quizScore.querySelector('#restartBtnCC'); rb.onclick=function(){ qs.idx=0; qs.score=0; qs.tries=0; renderQuiz(); }; return; }
      const q=QUIZ[qs.idx]; let h='<div style="margin-bottom:16px;"><div style="font-size:14.5px;font-weight:600;line-height:1.7;margin-bottom:10px;"><span style="color:'+C.goldDeep+';margin-right:4px;">第 '+(qs.idx+1)+' 题</span>'+q.q+'</div><div style="display:grid;gap:8px;">';
      q.opts.forEach(function(o,i){ h+='<button data-oi="'+i+'" style="min-height:48px;border:1.5px solid '+C.line+';border-radius:12px;background:#fff;font-size:14.5px;color:'+C.primary+';text-align:left;padding:0 14px;cursor:pointer;display:flex;align-items:center;gap:10px;"><span style="width:24px;height:24px;border-radius:8px;background:'+C.goldSoft+';border:1px solid '+C.line+';font-size:12.5px;font-weight:700;color:'+C.ink2+';display:inline-flex;align-items:center;justify-content:center;flex:none;">'+'ABCD'[i]+'</span><span>'+o+'</span></button>'; });
      h+='</div><div data-fb style="display:none;margin-top:10px;border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.8;"></div></div>';
      quizBox.innerHTML=h; const fb=quizBox.querySelector('[data-fb]');
      quizBox.querySelectorAll('button[data-oi]').forEach(function(b){ b.onclick=function(){ quizPick(+b.dataset.oi, b, fb, quizBox); }; });
    }
    function quizPick(i,btn,fb,box){ const q=QUIZ[qs.idx]; const opts=box.querySelectorAll('button[data-oi]');
      if(i===q.ans){ opts.forEach(function(b,k){ b.disabled=true; if(k===q.ans){ b.style.borderColor=C.success; b.style.background='#F0F7F3'; } }); fb.style.display='block'; fb.style.background='#F0F7F3'; fb.style.border='1px solid #CBE3D6'; fb.style.color='#2F6B50'; fb.innerHTML='<strong>✓ 回答正确！</strong><br>'+q.exp; qs.score++; setTimeout(function(){ qs.idx++; qs.tries=0; renderQuiz(); },1600); }
      else { qs.tries++; btn.style.borderColor=C.accent; btn.style.background='#FAF0EF'; btn.disabled=true;
        if(qs.tries===1){ fb.style.display='block'; fb.style.background=C.goldSoft; fb.style.border='1px solid #E8D9B8'; fb.style.color='#7A5F2E'; fb.innerHTML='<strong>再想一想：</strong>'+q.hint; }
        else { opts.forEach(function(b,k){ b.disabled=true; if(k===q.ans){ b.style.borderColor=C.success; b.style.background='#F0F7F3'; } }); fb.style.display='block'; fb.style.background='#FAF0EF'; fb.style.border='1px solid #EBCFCD'; fb.style.color='#96453F'; fb.innerHTML='<strong>✗ 正确答案是 '+['A','B','C','D'][q.ans]+'。</strong><br>'+q.exp; setTimeout(function(){ qs.idx++; qs.tries=0; renderQuiz(); },2400); } }
    }
    renderQuiz();
  })();

  setTab('derive');
}

// ============================================================
// 长方体和正方体 / 多边形的面积 / 圆：专属四段交互动图
// 移植自《圆柱和圆锥的体积·交互动画》范式，但每段按各单元真实课本推导量身定制
// （长方体=摆小正方体累加体积；多边形=剪拼转化；圆=剪拼成长方形），不硬套切拼/倒水
// 自包含：原生 SVG + 内联样式，移动端「同步学习」与 PC 工作台共用
// ============================================================

// ---------- 长方体和正方体：摆一摆 / 表面积 / 体积计算 / 随堂挑战 ----------
function diagCuboid(container, opts){
  opts = opts || {};
  const C = { primary:'#3E4A63', gold:'#B4945A', goldDeep:'#9A7B42', goldSoft:'#FCF9F2',
              line:'#E8E2D6', ink2:'#6B7590', success:'#4E8C6E', accent:'#C2554F',
              faceTop:'#EFE3C8', faceFront:'#DCC79C', faceSide:'#CBB488' };
  function svgEl(tag, attrs){ const e=document.createElementNS('http://www.w3.org/2000/svg', tag); if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function el(tag, st, parent, html){ const e=document.createElement(tag); if(st) e.style.cssText=st; if(parent) parent.appendChild(e); if(html!=null) e.innerHTML=html; return e; }
  function txt(parent,x,y,s,size,fill,weight,anchor){ const t=svgEl('text',{x:x,y:y,'font-size':size,fill:fill,'font-weight':weight||400,'text-anchor':anchor||'middle'}); t.textContent=s; parent.appendChild(t); return t; }
  function tween(from,to,dur,onStep,onDone){ const t0=(window.performance&&performance.now)?performance.now():Date.now(); function frame(now){ const k=Math.min(1,(now-t0)/dur); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; onStep(from+(to-from)*e); if(k<1) requestAnimationFrame(frame); else if(onDone) onDone(); } requestAnimationFrame(frame); }

  container.innerHTML='';
  const root = el('div', 'font-family:inherit;color:'+C.primary+';', container);
  el('div', 'font-size:13px;color:'+C.ink2+';line-height:1.7;margin-bottom:10px;', root,
     '用小正方体把长方体一层层摆出来，自己数出体积；再看看表面积怎么算。');

  const TABS=[{id:'build',label:'摆一摆'},{id:'surface',label:'表面积'},{id:'calc',label:'体积计算'},{id:'quiz',label:'随堂挑战'}];
  const tabBar = el('div', 'display:flex;gap:6px;margin-bottom:12px;', root);
  const panels={}; const tabBtns={};
  function setTab(id){ for(const k in panels) panels[k].style.display=(k===id)?'block':'none'; TABS.forEach(function(t){ const on=(t.id===id); const b=tabBtns[t.id]; b.style.background=on?C.primary:'#fff'; b.style.color=on?'#fff':C.ink2; b.style.borderColor=on?C.primary:C.line; }); }
  TABS.forEach(function(t){ const b=el('button','flex:1;min-height:48px;border:1px solid '+C.line+';background:#fff;border-radius:12px;color:'+C.ink2+';font-size:14px;font-weight:600;cursor:pointer;',tabBar,t.label); b.onclick=function(){ setTab(t.id); }; tabBtns[t.id]=b; panels[t.id]=el('div','',root); });
  function cardOf(p,no,title){ const card=el('div','background:#fff;border:1px solid '+C.line+';border-radius:16px;padding:16px;margin-bottom:12px;',p); if(title) el('div','font-size:16px;font-weight:700;margin-bottom:8px;',card,no+' '+title); return card; }

  /* ① 摆一摆 */
  (function(){
    const p=panels.build;
    const card=cardOf(p,'①','用小正方体把长方体摆出来');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '每行 <b>a</b> 个，摆 <b>b</b> 行是一层，共 <b>h</b> 层。总个数 = a × b × h，这就是长方体的体积！');
    const ctrl=el('div','display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin-bottom:6px;',card);
    function slider(label,min,max,val){ const w=el('div','display:flex;flex-direction:column;gap:4px;',ctrl); el('div','font-size:13px;color:'+C.ink2+';font-weight:600;',w,label); const s=el('input',null,w); s.type='range'; s.min=min; s.max=max; s.value=val; s.style.width='120px'; return s; }
    const sa=slider('长 a（个）',1,5,3), sb=slider('宽 b（个）',1,5,2), sh=slider('高 h（层）',1,5,2);
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 330',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    const cap=el('div','text-align:center;font-size:15px;font-weight:700;color:'+C.primary+';margin-top:10px;',card,'');
    function drawN(a,b,h,n){ svg.innerHTML=''; const ux=18,uy=10,vx=18,vy=-10,z=20; const ox=150,oy=278;
      function P(i,j,k){ return [ox+i*ux+j*vx, oy-i*uy-j*vy-k*z]; }
      function poly(pts,fill){ svg.appendChild(svgEl('polygon',{points:pts.map(function(pp){return pp[0].toFixed(1)+','+pp[1].toFixed(1);}).join(' '),fill:fill,stroke:C.goldDeep,'stroke-width':0.7,'stroke-linejoin':'round'})); }
      let idx=0;
      for(let k=0;k<h;k++){ for(let j=0;j<b;j++){ for(let i=0;i<a;i++){ if(idx>=n) continue; const o=P(i,j,k);
        poly([o,[o[0]+ux,o[1]-uy],[o[0]+ux+vx,o[1]-uy-vy],[o[0]+vx,o[1]-vy]], C.faceTop);
        poly([o,[o[0]+ux,o[1]-uy],[o[0]+ux,o[1]-uy-z],[o[0],o[1]-z]], C.faceFront);
        poly([o,[o[0]+vx,o[1]-vy],[o[0]+vx,o[1]-vy-z],[o[0],o[1]-z]], C.faceSide);
        idx++; } } }
      const A=P(0,0,0), B=P(a,0,0);
      svg.appendChild(svgEl('line',{x1:A[0],y1:A[1]+6,x2:B[0],y2:B[1]+6,stroke:C.goldDeep,'stroke-width':1.4}));
      txt(svg,(A[0]+B[0])/2,A[1]+22,'a = '+a,13,C.goldDeep,700);
      const back=P(0,b,0); svg.appendChild(svgEl('line',{x1:A[0]-6,y1:A[1],x2:back[0]-6,y2:back[1],stroke:C.goldDeep,'stroke-width':1.4}));
      txt(svg,back[0]-18,(A[1]+back[1])/2,'b = '+b,13,C.goldDeep,700);
      const top=P(0,0,h); svg.appendChild(svgEl('line',{x1:A[0]-28,y1:A[1],x2:top[0]-28,y2:top[1],stroke:C.goldDeep,'stroke-width':1.4}));
      txt(svg,top[0]-42,(A[1]+top[1])/2,'h = '+h,13,C.goldDeep,700);
    }
    function refresh(){ const a=+sa.value,b=+sb.value,h=+sh.value; drawN(a,b,h,a*b*h); cap.textContent='体积 = a × b × h = '+a+' × '+b+' × '+h+' = '+(a*b*h)+'（个体积单位）'; }
    [sa,sb,sh].forEach(function(s){ s.addEventListener('input',refresh); });
    const btnRow=el('div','display:flex;gap:10px;justify-content:center;margin-top:10px;',card);
    const btnFill=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:none;background:'+C.primary+';color:#fff;font-size:15px;font-weight:600;cursor:pointer;',btnRow,'摆满它');
    btnFill.onclick=function(){ const a=+sa.value,b=+sb.value,h=+sh.value,total=a*b*h; tween(0,total,900,function(v){ drawN(a,b,h,Math.round(v)); cap.textContent='已经摆了 '+Math.round(v)+' / '+total+' 个…'; },function(){ cap.textContent='体积 = a × b × h = '+a+' × '+b+' × '+h+' = '+(a*b*h)+'（个体积单位）'; }); };
    refresh();
  })();

  /* ② 表面积 */
  (function(){
    const p=panels.surface;
    const card=cardOf(p,'②','长方体（正方体）的表面积');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '长方体 6 个面：上下面、前后面、左右面各一对。表面积 = 2(ab + ah + bh)；正方体 6 个面相同，S = 6a²。');
    const ctrl=el('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:6px;',card);
    const mSel=el('div','display:inline-flex;background:'+C.goldSoft+';border:1px solid '+C.line+';border-radius:10px;padding:3px;gap:3px;',ctrl);
    const modes=[{k:'cuboid',t:'长方体'},{k:'cube',t:'正方体'}]; const mBtns={};
    const M={k:'cuboid'};
    modes.forEach(function(m){ const b=el('button',(m.k==='cuboid'?'background:#fff;color:'+C.primary+';':'background:transparent;color:'+C.ink2+';')+'min-height:44px;padding:0 14px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;',mSel,m.t); b.onclick=function(){ modes.forEach(function(x){mBtns[x.k].style.background='transparent';mBtns[x.k].style.color=C.ink2;}); b.style.background='#fff'; b.style.color=C.primary; M.k=m.k; render(); }; mBtns[m.k]=b; });
    const aS=el('input',null,ctrl), bS=el('input',null,ctrl), hS=el('input',null,ctrl);
    [['长 a',aS],['宽 b',bS],['高 h',hS]].forEach(function(pr){ const w=el('div','display:flex;flex-direction:column;gap:4px;',ctrl); el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',w,pr[0]); pr[1].type='range'; pr[1].min=1; pr[1].max=10; pr[1].value=4; pr[1].style.width='100px'; w.appendChild(pr[1]); });
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;margin-top:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 300',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    const cap=el('div','text-align:center;font-size:15px;font-weight:700;color:'+C.primary+';margin-top:10px;',card,'');
    function render(){ const cuboid=M.k==='cuboid'; const la=cuboid?+aS.value:+aS.value; const lb=cuboid?+bS.value:+aS.value; const lh=cuboid?+hS.value:+aS.value;
      svg.innerHTML=''; const ux=18,uy=10,vx=18,vy=-10,z=18; const ox=175,oy=235;
      function P(i,j,k){ return [ox+i*ux+j*vx, oy-i*uy-j*vy-k*z]; }
      function face(p1,p2,p3,p4,fill){ svg.appendChild(svgEl('polygon',{points:[p1,p2,p3,p4].map(function(pp){return pp[0].toFixed(1)+','+pp[1].toFixed(1);}).join(' '),fill:fill,stroke:C.goldDeep,'stroke-width':1.2,'stroke-linejoin':'round'})); }
      face(P(0,0,lh),P(la,0,lh),P(la,lb,lh),P(0,lb,lh), C.faceTop);
      face(P(0,0,0),P(la,0,0),P(la,0,lh),P(0,0,lh), C.faceFront);
      face(P(0,0,0),P(0,lb,0),P(0,lb,lh),P(0,0,lh), C.faceSide);
      function edge(p1,p2){ svg.appendChild(svgEl('line',{x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],stroke:C.primary,'stroke-width':1.6})); }
      edge(P(0,0,0),P(la,0,0)); edge(P(la,0,0),P(la,0,lh)); edge(P(la,0,lh),P(0,0,lh)); edge(P(0,0,lh),P(0,0,0));
      edge(P(0,0,0),P(0,lb,0)); edge(P(0,lb,0),P(0,lb,lh)); edge(P(0,lb,lh),P(0,0,lh));
      edge(P(0,lb,0),P(la,lb,0)); edge(P(la,lb,0),P(la,0,0));
      edge(P(0,lb,lh),P(la,lb,lh)); edge(P(la,lb,lh),P(la,0,lh)); edge(P(la,lb,lh),P(la,lb,0));
      txt(svg,(P(0,0,0)[0]+P(la,0,0)[0])/2,P(0,0,0)[1]+20,'a',13,C.goldDeep,700);
      txt(svg,P(0,lb,0)[0]-16,(P(0,0,0)[1]+P(0,lb,0)[1])/2,'b',13,C.goldDeep,700);
      txt(svg,P(0,0,0)[0]-30,(P(0,0,0)[1]+P(0,0,lh)[1])/2,'h',13,C.goldDeep,700);
      if(cuboid) cap.textContent='表面积 S = 2(ab+ah+bh) = 2('+la+'×'+lb+'+'+la+'×'+lh+'+'+lb+'×'+lh+') = '+ (2*(la*lb+la*lh+lb*lh));
      else cap.textContent='正方体 S = 6a² = 6×'+la+'² = '+(6*la*la);
    }
    [aS,bS,hS].forEach(function(s){ s.addEventListener('input',render); });
    render();
  })();

  /* ③ 体积计算 */
  (function(){
    const p=panels.calc;
    const card=cardOf(p,'③','体积怎么算');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '长方体体积 = 长×宽×高 = 底面积×高；正方体体积 = 棱长³。拖动改一改，看结果实时变。');
    const ctrl=el('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:6px;',card);
    function slider(label,min,max,val){ const w=el('div','display:flex;flex-direction:column;gap:4px;',ctrl); el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',w,label); const s=el('input',null,w); s.type='range'; s.min=min; s.max=max; s.value=val; s.style.width='100px'; return s; }
    const aS=slider('长 a (cm)',1,10,5), bS=slider('宽 b (cm)',1,10,4), hS=slider('高 h (cm)',1,10,3);
    const out=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:14px;margin-top:10px;font-size:16px;line-height:2;color:'+C.primary+';text-align:center;font-weight:600;',card,'');
    function refresh(){ const a=+aS.value,b=+bS.value,h=+hS.value; out.innerHTML='V<sub>长方体</sub> = a·b·h = '+a+'×'+b+'×'+h+' = <b style="color:'+C.goldDeep+';font-size:20px">'+ (a*b*h) +'</b> cm³<br>也 = 底面积×高 = '+(a*b)+'×'+h+' = '+(a*b*h)+' cm³'; }
    [aS,bS,hS].forEach(function(s){ s.addEventListener('input',refresh); }); refresh();
    const note=el('div','font-size:13px;color:'+C.ink2+';margin-top:10px;line-height:1.7;padding-left:10px;border-left:3px solid #E8D9B8;',card,
       '正方体是特殊的长方体（a=b=h），所以 V<sub>正</sub> = a³。例：棱长 3cm → 3×3×3 = 27 cm³。');
  })();

  /* ④ 随堂挑战 */
  (function(){
    const p=panels.quiz;
    const card=cardOf(p,'④','随堂挑战');
    const Q=[
      {q:'一个长方体，长 5cm、宽 4cm、高 3cm，体积是多少？', a:'60', hint:'体积 = 长×宽×高 = 5×4×3', ok:function(v){return +v===60;}},
      {q:'棱长为 4cm 的正方体，体积是多少？', a:'64', hint:'V = 4³ = 4×4×4', ok:function(v){return +v===64;}},
      {q:'一个长方体底面积 24cm²、高 5cm，体积是？', a:'120', hint:'体积 = 底面积×高 = 24×5', ok:function(v){return +v===120;}}
    ];
    let qi=0, wrong=0; const box=el('div','',card);
    function show(){ box.innerHTML=''; const it=Q[qi];
      el('div','font-size:15px;font-weight:600;color:'+C.primary+';margin-bottom:10px;',box,'第 '+(qi+1)+' 题 / 共 '+Q.length+' 题');
      el('div','font-size:14.5px;line-height:1.8;margin-bottom:12px;',box, it.q);
      const inp=el('input',null,box); inp.type='number'; inp.style.cssText='width:120px;height:46px;font-size:18px;padding:4px 10px;border:1px solid '+C.line+';border-radius:10px;';
      const fb=el('div','font-size:13.5px;margin-top:10px;min-height:20px;',box,'');
      const row=el('div','display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;',box);
      const bOk=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:none;background:'+C.primary+';color:#fff;font-size:15px;font-weight:600;cursor:pointer;',row,'提交');
      const bHint=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:1px solid '+C.line+';background:#fff;color:'+C.primary+';font-size:15px;font-weight:600;cursor:pointer;',row,'看提示');
      bOk.onclick=function(){ const v=inp.value.trim(); if(it.ok(v)){ fb.style.color=C.success; fb.textContent='✓ 答对了！体积 = '+it.a; qi++; if(qi<Q.length){ setTimeout(show,700); } else { fb.style.color=C.success; fb.textContent='🎉 全部完成！'; } } else { wrong++; fb.style.color=C.accent; fb.textContent='再想想～ '+(wrong>=1?('提示：'+it.hint):''); } };
      bHint.onclick=function(){ fb.style.color=C.goldDeep; fb.textContent='提示：'+it.hint; };
    }
    show();
  })();

  setTab('build');
}

// ---------- 多边形的面积：平行四边形剪拼 / 三角·梯形拼组 / 面积计算 / 随堂挑战 ----------
function diagPolygonArea(container, opts){
  opts = opts || {};
  const C = { primary:'#3E4A63', gold:'#B4945A', goldDeep:'#9A7B42', goldSoft:'#FCF9F2',
              line:'#E8E2D6', ink2:'#6B7590', success:'#4E8C6E', accent:'#C2554F' };
  function svgEl(tag, attrs){ const e=document.createElementNS('http://www.w3.org/2000/svg', tag); if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function el(tag, st, parent, html){ const e=document.createElement(tag); if(st) e.style.cssText=st; if(parent) parent.appendChild(e); if(html!=null) e.innerHTML=html; return e; }
  function txt(parent,x,y,s,size,fill,weight,anchor){ const t=svgEl('text',{x:x,y:y,'font-size':size,fill:fill,'font-weight':weight||400,'text-anchor':anchor||'middle'}); t.textContent=s; parent.appendChild(t); return t; }
  function tween(from,to,dur,onStep,onDone){ const t0=(window.performance&&performance.now)?performance.now():Date.now(); function frame(now){ const k=Math.min(1,(now-t0)/dur); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; onStep(from+(to-from)*e); if(k<1) requestAnimationFrame(frame); else if(onDone) onDone(); } requestAnimationFrame(frame); }

  container.innerHTML='';
  const root = el('div', 'font-family:inherit;color:'+C.primary+';', container);
  el('div', 'font-size:13px;color:'+C.ink2+';line-height:1.7;margin-bottom:10px;', root,
     '把图形剪开、拼一拼，自己推出面积公式。');

  const TABS=[{id:'para',label:'平行四边形'},{id:'tt',label:'三角·梯形'},{id:'calc',label:'面积计算'},{id:'quiz',label:'随堂挑战'}];
  const tabBar = el('div', 'display:flex;gap:6px;margin-bottom:12px;', root);
  const panels={}; const tabBtns={};
  function setTab(id){ for(const k in panels) panels[k].style.display=(k===id)?'block':'none'; TABS.forEach(function(t){ const on=(t.id===id); const b=tabBtns[t.id]; b.style.background=on?C.primary:'#fff'; b.style.color=on?'#fff':C.ink2; b.style.borderColor=on?C.primary:C.line; }); }
  TABS.forEach(function(t){ const b=el('button','flex:1;min-height:48px;border:1px solid '+C.line+';background:#fff;border-radius:12px;color:'+C.ink2+';font-size:14px;font-weight:600;cursor:pointer;',tabBar,t.label); b.onclick=function(){ setTab(t.id); }; tabBtns[t.id]=b; panels[t.id]=el('div','',root); });
  function cardOf(p,no,title){ const card=el('div','background:#fff;border:1px solid '+C.line+';border-radius:16px;padding:16px;margin-bottom:12px;',p); if(title) el('div','font-size:16px;font-weight:700;margin-bottom:8px;',card,no+' '+title); return card; }

  /* ① 平行四边形剪拼 */
  (function(){
    const p=panels.para;
    const card=cardOf(p,'①','平行四边形 → 长方形');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '沿着高剪下一个三角形，平移到右边，就拼成了一个长方形。长方形面积 = 底×高，所以平行四边形 S = ah。');
    const ctrl=el('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:6px;',card);
    function slider(label,min,max,val){ const w=el('div','display:flex;flex-direction:column;gap:4px;',ctrl); el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',w,label); const s=el('input',null,w); s.type='range'; s.min=min; s.max=max; s.value=val; s.style.width='100px'; return s; }
    const bS=slider('底 a',3,9,6), hS=slider('高 h',2,7,4);
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 300',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    const cap=el('div','text-align:center;font-size:15px;font-weight:700;color:'+C.primary+';margin-top:10px;',card,'');
    const btnRow=el('div','display:flex;gap:10px;justify-content:center;margin-top:10px;',card);
    const btnCut=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:none;background:'+C.primary+';color:#fff;font-size:15px;font-weight:600;cursor:pointer;',btnRow,'开始剪拼');
    const btnReset=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:1px solid '+C.line+';background:#fff;color:'+C.primary+';font-size:15px;font-weight:600;cursor:pointer;',btnRow,'还原');
    let anim=false, morph=0;
    function draw(m){ const a=+bS.value,h=+hS.value; const baseY=240, x0=120, skew=40, sc=22; svg.innerHTML='';
      const A=[x0,baseY], B=[x0+a*sc,baseY], D=[x0+skew,baseY-h*sc], Cc=[x0+a*sc+skew,baseY-h*sc];
      const E=[x0, baseY-h*sc];
      const triOff=m*(a*sc);
      function poly(pts,fill){ svg.appendChild(svgEl('polygon',{points:pts.map(function(pp){return pp[0].toFixed(1)+','+pp[1].toFixed(1);}).join(' '),fill:fill,stroke:C.goldDeep,'stroke-width':1.3,'stroke-linejoin':'round'})); }
      if(m<0.5){
        poly([A,B,Cc,D],'#E7D6AE');
        poly([A,D,E],'#D9C498');
        txt(svg,(A[0]+B[0])/2,baseY+22,'a = '+a,13,C.goldDeep,700);
        txt(svg,E[0]-14,(A[1]+E[1])/2,'h = '+h,13,C.goldDeep,700);
      } else {
        const Rx=x0+a*sc;
        poly([[x0,baseY],[Rx,baseY],[Rx,baseY-h*sc],[x0,baseY-h*sc]],'#E7D6AE');
        poly([[Rx,baseY],[Rx+ (E[0]-A[0]+skew),baseY],[Rx+(E[0]-A[0]+skew),baseY-h*sc],[Rx,baseY-h*sc]],'#D9C498');
        txt(svg,(x0+Rx)/2,baseY+22,'长 = a = '+a,13,C.goldDeep,700);
        txt(svg,x0-14,(baseY+baseY-h*sc)/2,'宽 = h = '+h,13,C.goldDeep,700);
      }
    }
    function refresh(){ draw(morph); cap.textContent='S = a × h = '+(+bS.value)+' × '+(+hS.value)+' = '+((+bS.value)*(+hS.value)); }
    [bS,hS].forEach(function(s){ s.addEventListener('input',function(){ morph=0; btnCut.textContent='开始剪拼'; refresh(); }); });
    btnCut.onclick=function(){ if(anim) return; anim=true; this.disabled=true; tween(0,1,1000,function(v){ draw(v); }, function(){ anim=false; btnCut.disabled=false; btnCut.textContent='已拼好'; }); };
    btnReset.onclick=function(){ if(anim) return; morph=0; btnCut.textContent='开始剪拼'; refresh(); };
    refresh();
  })();

  /* ② 三角·梯形拼组 */
  (function(){
    const p=panels.tt;
    const card=cardOf(p,'②','两个一样图形 → 拼成平行四边形');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '两个完全一样的三角形，拼成平行四边形 → 三角形面积 = 平行四边形÷2 = ah÷2；两个一样的梯形 → 梯形面积 = (a+b)h÷2。');
    const ctrl=el('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:6px;',card);
    const mSel=el('div','display:inline-flex;background:'+C.goldSoft+';border:1px solid '+C.line+';border-radius:10px;padding:3px;gap:3px;',ctrl);
    const ms=[{k:'tri',t:'三角形'},{k:'trap',t:'梯形'}]; const mB={}; const M={k:'tri'};
    ms.forEach(function(m){ const b=el('button',(m.k==='tri'?'background:#fff;color:'+C.primary+';':'background:transparent;color:'+C.ink2+';')+'min-height:44px;padding:0 14px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;',mSel,m.t); b.onclick=function(){ ms.forEach(function(x){ mB[x.k].style.background='transparent'; mB[x.k].style.color=C.ink2; }); b.style.background='#fff'; b.style.color=C.primary; M.k=m.k; render(); }; mB[m.k]=b; });
    const aS=el('input',null,ctrl), bS=el('input',null,ctrl), hS=el('input',null,ctrl);
    function lab(s,tx){ const w=el('div','display:flex;flex-direction:column;gap:4px;',ctrl); el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',w,tx); s.type='range'; s.min=2; s.max=9; s.value=5; s.style.width='90px'; w.appendChild(s); }
    lab(aS,'底 a'); lab(bS,'底 b'); lab(hS,'高 h');
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;margin-top:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 300',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    const cap=el('div','text-align:center;font-size:15px;font-weight:700;color:'+C.primary+';margin-top:10px;',card,'');
    function render(){ const tri=M.k==='tri'; const a=+aS.value,b=+bS.value,h=+hS.value; svg.innerHTML=''; const x0=120, baseY=240, sc=22;
      function poly(pts,fill){ svg.appendChild(svgEl('polygon',{points:pts.map(function(pp){return pp[0].toFixed(1)+','+pp[1].toFixed(1);}).join(' '),fill:fill,stroke:C.goldDeep,'stroke-width':1.3,'stroke-linejoin':'round'})); }
      if(tri){
        const A=[x0,baseY], B=[x0+a*sc,baseY], T=[x0+a*sc/2,baseY-h*sc];
        poly([A,B,T],'#E7D6AE');
        poly([A,T,[x0-a*sc/2,baseY-h*sc]],'#D9C498');
        txt(svg,(A[0]+B[0])/2,baseY+22,'底 a = '+a,13,C.goldDeep,700);
        txt(svg,T[0],T[1]-10,'h = '+h,13,C.goldDeep,700);
        cap.textContent='三角形 S = a × h ÷ 2 = '+a+' × '+h+' ÷ 2 = '+(a*h/2);
      } else {
        const A=[x0,baseY], B=[x0+a*sc,baseY], T=[x0+a*sc/2,baseY-h*sc], Tt=[x0+b*sc+a*sc/2,baseY-h*sc];
        poly([A,B,Tt,T],'#E7D6AE');
        poly([T,Tt,[Tt[0]+a*sc,Tt[1]],[T[0]+a*sc,T[1]]],'#D9C498');
        txt(svg,(A[0]+B[0]+ (b*sc))/2,baseY+22,'(a+b) = '+(a+b),13,C.goldDeep,700);
        cap.textContent='梯形 S = (a+b) × h ÷ 2 = '+(a+b)+' × '+h+' ÷ 2 = '+((a+b)*h/2);
      }
    }
    [aS,bS,hS].forEach(function(s){ s.addEventListener('input',render); }); render();
  })();

  /* ③ 面积计算 */
  (function(){
    const p=panels.calc;
    const card=cardOf(p,'③','面积计算');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '拖动改底和高，看三个图形面积实时变化。');
    const ctrl=el('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:6px;',card);
    function slider(label,min,max,val){ const w=el('div','display:flex;flex-direction:column;gap:4px;',ctrl); el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',w,label); const s=el('input',null,w); s.type='range'; s.min=min; s.max=max; s.value=val; s.style.width='90px'; return s; }
    const aS=slider('底 a',2,9,6), bS=slider('下底 b',2,9,4), hS=slider('高 h',2,8,4);
    const out=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:14px;margin-top:10px;font-size:15.5px;line-height:2;color:'+C.primary+';text-align:center;font-weight:600;',card,'');
    function refresh(){ const a=+aS.value,b=+bS.value,h=+hS.value; out.innerHTML='平行四边形 S = a·h = '+a+'×'+h+' = <b style="color:'+C.goldDeep+'">'+ (a*h) +'</b><br>三角形 S = a·h÷2 = '+ (a*h/2) +'<br>梯形 S = (a+b)·h÷2 = ('+a+'+'+b+')×'+h+'÷2 = <b style="color:'+C.goldDeep+'">'+ ((a+b)*h/2) +'</b>'; }
    [aS,bS,hS].forEach(function(s){ s.addEventListener('input',refresh); }); refresh();
  })();

  /* ④ 随堂挑战 */
  (function(){
    const p=panels.quiz;
    const card=cardOf(p,'④','随堂挑战');
    const Q=[
      {q:'平行四边形底 8cm、高 5cm，面积？', a:'40', hint:'S=a×h=8×5', ok:function(v){return +v===40;}},
      {q:'三角形底 10cm、高 6cm，面积？', a:'30', hint:'S=a×h÷2=10×6÷2', ok:function(v){return +v===30;}},
      {q:'梯形上底 4cm、下底 6cm、高 5cm，面积？', a:'25', hint:'S=(4+6)×5÷2', ok:function(v){return +v===25;}}
    ];
    let qi=0, wrong=0; const box=el('div','',card);
    function show(){ box.innerHTML=''; const it=Q[qi];
      el('div','font-size:15px;font-weight:600;color:'+C.primary+';margin-bottom:10px;',box,'第 '+(qi+1)+' 题 / 共 '+Q.length+' 题');
      el('div','font-size:14.5px;line-height:1.8;margin-bottom:12px;',box, it.q);
      const inp=el('input',null,box); inp.type='number'; inp.style.cssText='width:120px;height:46px;font-size:18px;padding:4px 10px;border:1px solid '+C.line+';border-radius:10px;';
      const fb=el('div','font-size:13.5px;margin-top:10px;min-height:20px;',box,'');
      const row=el('div','display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;',box);
      const bOk=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:none;background:'+C.primary+';color:#fff;font-size:15px;font-weight:600;cursor:pointer;',row,'提交');
      const bHint=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:1px solid '+C.line+';background:#fff;color:'+C.primary+';font-size:15px;font-weight:600;cursor:pointer;',row,'看提示');
      bOk.onclick=function(){ const v=inp.value.trim(); if(it.ok(v)){ fb.style.color=C.success; fb.textContent='✓ 答对了！'; qi++; if(qi<Q.length){ setTimeout(show,700); } else { fb.style.color=C.success; fb.textContent='🎉 全部完成！'; } } else { wrong++; fb.style.color=C.accent; fb.textContent='再想想～ '+(wrong>=1?('提示：'+it.hint):''); } };
      bHint.onclick=function(){ fb.style.color=C.goldDeep; fb.textContent='提示：'+it.hint; };
    }
    show();
  })();

  setTab('para');
}

// ---------- 圆：剪拼成长方形 / 周长与面积 / 圆环与半圆 / 随堂挑战 ----------
function diagCircleArea(container, opts){
  opts = opts || {};
  const C = { primary:'#3E4A63', gold:'#B4945A', goldDeep:'#9A7B42', goldSoft:'#FCF9F2',
              line:'#E8E2D6', ink2:'#6B7590', success:'#4E8C6E', accent:'#C2554F' };
  function svgEl(tag, attrs){ const e=document.createElementNS('http://www.w3.org/2000/svg', tag); if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function el(tag, st, parent, html){ const e=document.createElement(tag); if(st) e.style.cssText=st; if(parent) parent.appendChild(e); if(html!=null) e.innerHTML=html; return e; }
  function txt(parent,x,y,s,size,fill,weight,anchor){ const t=svgEl('text',{x:x,y:y,'font-size':size,fill:fill,'font-weight':weight||400,'text-anchor':anchor||'middle'}); t.textContent=s; parent.appendChild(t); return t; }
  function tween(from,to,dur,onStep,onDone){ const t0=(window.performance&&performance.now)?performance.now():Date.now(); function frame(now){ const k=Math.min(1,(now-t0)/dur); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; onStep(from+(to-from)*e); if(k<1) requestAnimationFrame(frame); else if(onDone) onDone(); } requestAnimationFrame(frame); }

  container.innerHTML='';
  const root = el('div', 'font-family:inherit;color:'+C.primary+';', container);
  el('div', 'font-size:13px;color:'+C.ink2+';line-height:1.7;margin-bottom:10px;', root,
     '把圆剪拼成长方形，自己推出面积公式。');

  const TABS=[{id:'derive',label:'剪拼成长方形'},{id:'measure',label:'周长与面积'},{id:'ring',label:'圆环与半圆'},{id:'quiz',label:'随堂挑战'}];
  const tabBar = el('div', 'display:flex;gap:6px;margin-bottom:12px;', root);
  const panels={}; const tabBtns={};
  function setTab(id){ for(const k in panels) panels[k].style.display=(k===id)?'block':'none'; TABS.forEach(function(t){ const on=(t.id===id); const b=tabBtns[t.id]; b.style.background=on?C.primary:'#fff'; b.style.color=on?'#fff':C.ink2; b.style.borderColor=on?C.primary:C.line; }); }
  TABS.forEach(function(t){ const b=el('button','flex:1;min-height:48px;border:1px solid '+C.line+';background:#fff;border-radius:12px;color:'+C.ink2+';font-size:14px;font-weight:600;cursor:pointer;',tabBar,t.label); b.onclick=function(){ setTab(t.id); }; tabBtns[t.id]=b; panels[t.id]=el('div','',root); });
  function cardOf(p,no,title){ const card=el('div','background:#fff;border:1px solid '+C.line+';border-radius:16px;padding:16px;margin-bottom:12px;',p); if(title) el('div','font-size:16px;font-weight:700;margin-bottom:8px;',card,no+' '+title); return card; }

  /* ① 剪拼成长方形 */
  (function(){
    const p=panels.derive;
    const card=cardOf(p,'①','圆剪拼成长方形');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '把圆平均分成很多份，切开拼一拼，就接近一个长方形：长≈πr（半个圆周），宽=r，所以 S=πr²。');
    const segWrap=el('div','display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;',card);
    const seg=el('div','display:inline-flex;background:'+C.goldSoft+';border:1px solid '+C.line+';border-radius:10px;padding:3px;gap:3px;',segWrap);
    const segData=[8,16,32]; const segB={};
    const CUT={N:16,r:70,cx:120,cy:165,rx:350,ry:165,morph:0,anim:false,wedges:[],layout:[]};
    segData.forEach(function(n){ const sb=el('button',(n===16?'background:#fff;color:'+C.primary+';':'background:transparent;color:'+C.ink2+';')+'min-height:44px;padding:0 14px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;',seg,n+' 份'); sb.onclick=function(){ segData.forEach(function(m){ segB[m].style.background='transparent'; segB[m].style.color=C.ink2; }); sb.style.background='#fff'; sb.style.color=C.primary; CUT.N=n; CUT.morph=0; btnMorph.textContent='开始切拼'; cutFormula.style.display='none'; cutBuild(); }; segB[n]=sb; });
    el('div','font-size:12.5px;color:'+C.ink2+';',segWrap,'份数越多 → 越像长方形');
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 330',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    const btnRow=el('div','display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px;',card);
    const btnMorph=el('button','min-height:46px;padding:0 22px;border-radius:12px;border:none;background:'+C.primary+';color:#fff;font-size:15px;font-weight:600;cursor:pointer;',btnRow,'开始切拼');
    const btnReset=el('button','min-height:46px;padding:0 22px;border-radius:12px;border:1px solid '+C.line+';background:#fff;color:'+C.primary+';font-size:15px;font-weight:600;cursor:pointer;',btnRow,'还原成圆');
    const cutFormula=el('div','display:none;margin-top:12px;border-radius:12px;padding:12px 16px;text-align:center;font-size:16px;font-weight:700;color:'+C.primary+';background:'+C.goldSoft+';border:1px solid #E8D9B8;',card,'长方形的面积 = 长 × 宽 → S<sub>圆</sub> = πr × r = πr²');
    function cutWedgePath(r,alpha){ const x1=r*Math.cos(-alpha/2),y1=r*Math.sin(-alpha/2),x2=r*Math.cos(alpha/2),y2=r*Math.sin(alpha/2); return 'M0,0 L'+x1.toFixed(2)+','+y1.toFixed(2)+' A'+r+','+r+' 0 0 1 '+x2.toFixed(2)+','+y2.toFixed(2)+' Z'; }
    function cutComputeLayout(){ const N=CUT.N,r=CUT.r,alpha=2*Math.PI/N,W=Math.PI*r,s=W/N,x0=CUT.rx-W/2,yB=CUT.ry+r/2,yT=CUT.ry-r/2; CUT.layout=[]; for(let i=0;i<N;i++){ if(i%2===0) CUT.layout.push({x:x0+(i+1)*s,y:yB,deg:-90}); else CUT.layout.push({x:x0+(i+1)*s,y:yT,deg:90}); } }
    function cutBuild(){ cutComputeLayout(); const N=CUT.N,alpha=2*Math.PI/N; svg.innerHTML=''; CUT.wedges=[];
      txt(svg,CUT.cx,58,'圆（俯视）',13,C.ink2,600); txt(svg,CUT.rx,58,'拼一拼',13,C.ink2,600);
      svg.appendChild(svgEl('circle',{cx:CUT.cx,cy:CUT.cy,r:3,fill:C.goldDeep}));
      for(let i=0;i<N;i++){ const g=svgEl('g',{}); const pa=svgEl('path',{d:cutWedgePath(CUT.r,alpha),fill:i%2===0?'#E5D5B6':'#D9C498',stroke:C.goldDeep,'stroke-width':0.9,'stroke-linejoin':'round'}); g.appendChild(pa); svg.appendChild(g); CUT.wedges.push({g:g,p:pa,i:i,circleDeg:i*360/N,rect:CUT.layout[i]}); }
      cutApply(CUT.morph); cutDims(CUT.morph>.5); }
    function cutApply(m){ CUT.morph=m; CUT.wedges.forEach(function(w){ const cx=CUT.cx+(w.rect.x-CUT.cx)*m, cy=CUT.cy+(w.rect.y-CUT.cy)*m, deg=w.circleDeg+(w.rect.deg-w.circleDeg)*m; w.g.setAttribute('transform','translate('+cx.toFixed(2)+','+cy.toFixed(2)+') rotate('+deg.toFixed(2)+')'); }); }
    function cutDims(show){ const old=svg.querySelector('.dims'); if(old) old.remove(); if(!show) return; const W=Math.PI*CUT.r,r=CUT.r,x0=CUT.rx-W/2,x1=CUT.rx+W/2,yT=CUT.ry-r/2-14,yB=CUT.ry+r/2+30; const g=svgEl('g',{class:'dims'});
      g.appendChild(svgEl('line',{x1:x0,y1:yT,x2:x1,y2:yT,stroke:C.goldDeep,'stroke-width':1.4}));
      g.appendChild(svgEl('line',{x1:x0,y1:yT-5,x2:x0,y2:yT+5,stroke:C.goldDeep,'stroke-width':1.4}));
      g.appendChild(svgEl('line',{x1:x1,y1:yT-5,x2:x1,y2:yT+5,stroke:C.goldDeep,'stroke-width':1.4}));
      txt(g,(x0+x1)/2,yT-8,'长 ≈ πr（半个圆周）',14,C.goldDeep,700);
      const xr=x1+22; g.appendChild(svgEl('line',{x1:xr,y1:CUT.ry-r/2,x2:xr,y2:CUT.ry+r/2,stroke:C.goldDeep,'stroke-width':1.4}));
      g.appendChild(svgEl('line',{x1:xr-5,y1:CUT.ry-r/2,x2:xr+5,y2:CUT.ry-r/2,stroke:C.goldDeep,'stroke-width':1.4}));
      g.appendChild(svgEl('line',{x1:xr-5,y1:CUT.ry+r/2,x2:xr+5,y2:CUT.ry+r/2,stroke:C.goldDeep,'stroke-width':1.4}));
      txt(g,xr+10,CUT.ry+5,'宽 ≈ r',14,C.goldDeep,700);
      txt(g,CUT.rx,yB,'S = πr × r = πr²',14.5,C.primary,700); svg.appendChild(g); }
    btnMorph.onclick=function(){ if(CUT.anim) return; CUT.anim=true; const b=this; b.disabled=true; const target=CUT.morph<.5?1:0; tween(CUT.morph,target,1100,function(v){ cutApply(v); }, function(){ CUT.anim=false; b.disabled=false; b.textContent=CUT.morph>.5?'还原成圆':'开始切拼'; cutDims(CUT.morph>.5); cutFormula.style.display=CUT.morph>.5?'block':'none'; }); };
    btnReset.onclick=function(){ if(CUT.anim) return; cutApply(0); cutDims(false); btnMorph.textContent='开始切拼'; cutFormula.style.display='none'; };
    cutBuild();
  })();

  /* ② 周长与面积 */
  (function(){
    const p=panels.measure;
    const card=cardOf(p,'②','周长和面积');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '拖动改变半径 r：C = 2πr，S = πr²（π 取 3.14）。');
    const ctrl=el('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:6px;',card);
    const w=el('div','display:flex;flex-direction:column;gap:4px;',ctrl); el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',w,'半径 r'); const rS=el('input',null,w); rS.type='range'; rS.min=2; rS.max=10; rS.value=5; rS.style.width='160px'; w.appendChild(rS);
    const stage=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:8px;',card);
    const svg=svgEl('svg',{viewBox:'0 0 560 300',style:'width:100%;height:auto;display:block;'}); stage.appendChild(svg);
    const out=el('div','text-align:center;font-size:16px;font-weight:700;color:'+C.primary+';margin-top:10px;',card,'');
    function refresh(){ const r=+rS.value,PI=3.14; const C=r*22; svg.innerHTML='';
      svg.appendChild(svgEl('circle',{cx:200,cy:160,r:C,fill:'#E7D6AE',stroke:C.goldDeep,'stroke-width':2}));
      svg.appendChild(svgEl('line',{x1:200,y1:160,x2:200,y2:160-C,stroke:C.primary,'stroke-width':1.6}));
      txt(svg,210,150,'r='+r,13,C.primary,700);
      txt(svg,200,160+C+22,'C = 2πr = 2×3.14×'+r+' = '+(2*PI*r).toFixed(2),13,C.goldDeep,700);
      out.innerHTML='半径 r = '+r+' → 周长 C = 2πr ≈ '+(2*PI*r).toFixed(2)+' ，面积 S = πr² ≈ '+(PI*r*r).toFixed(2);
    }
    rS.addEventListener('input',refresh); refresh();
  })();

  /* ③ 圆环与半圆 */
  (function(){
    const p=panels.ring;
    const card=cardOf(p,'③','圆环与半圆');
    el('div','font-size:13.5px;color:'+C.ink2+';line-height:1.8;margin-bottom:10px;',card,
       '圆环面积 = π(R²−r²)；半圆面积 = πr²÷2。');
    const ctrl=el('div','display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:6px;',card);
    function slider(label,min,max,val){ const w=el('div','display:flex;flex-direction:column;gap:4px;',ctrl); el('div','font-size:12.5px;color:'+C.ink2+';font-weight:600;',w,label); const s=el('input',null,w); s.type='range'; s.min=min; s.max=max; s.value=val; s.style.width='90px'; return s; }
    const RS=slider('外半径 R',3,9,6), rs=slider('内半径 r',1,8,3);
    const out=el('div','background:'+C.goldSoft+';border:1px solid #E8D9B8;border-radius:12px;padding:14px;margin-top:10px;font-size:15.5px;line-height:2;color:'+C.primary+';text-align:center;font-weight:600;',card,'');
    function refresh(){ const R=+RS.value, r=Math.min(+rs.value,R-1); const PI=3.14; out.innerHTML='圆环 S = π(R²−r²) = 3.14×('+R+'²−'+r+'²) = <b style="color:'+C.goldDeep+'">'+ (PI*(R*R-r*r)).toFixed(2) +'</b><br>半圆 S = πr²÷2 = '+(PI*r*r/2).toFixed(2); }
    [RS,rs].forEach(function(s){ s.addEventListener('input',refresh); }); refresh();
  })();

  /* ④ 随堂挑战 */
  (function(){
    const p=panels.quiz;
    const card=cardOf(p,'④','随堂挑战');
    const Q=[
      {q:'圆的半径 4cm，面积是多少（π取3.14）？', a:'50.24', hint:'S=πr²=3.14×4²', ok:function(v){return Math.abs(+v-50.24)<0.01;}},
      {q:'圆的半径 10cm，周长约是多少？', a:'62.8', hint:'C=2πr=2×3.14×10', ok:function(v){return Math.abs(+v-62.8)<0.01;}},
      {q:'圆环外半径5cm、内半径3cm，面积？', a:'50.24', hint:'S=π(25−9)=3.14×16', ok:function(v){return Math.abs(+v-50.24)<0.01;}}
    ];
    let qi=0, wrong=0; const box=el('div','',card);
    function show(){ box.innerHTML=''; const it=Q[qi];
      el('div','font-size:15px;font-weight:600;color:'+C.primary+';margin-bottom:10px;',box,'第 '+(qi+1)+' 题 / 共 '+Q.length+' 题');
      el('div','font-size:14.5px;line-height:1.8;margin-bottom:12px;',box, it.q);
      const inp=el('input',null,box); inp.type='number'; inp.style.cssText='width:140px;height:46px;font-size:18px;padding:4px 10px;border:1px solid '+C.line+';border-radius:10px;';
      const fb=el('div','font-size:13.5px;margin-top:10px;min-height:20px;',box,'');
      const row=el('div','display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;',box);
      const bOk=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:none;background:'+C.primary+';color:#fff;font-size:15px;font-weight:600;cursor:pointer;',row,'提交');
      const bHint=el('button','min-height:46px;padding:0 20px;border-radius:12px;border:1px solid '+C.line+';background:#fff;color:'+C.primary+';font-size:15px;font-weight:600;cursor:pointer;',row,'看提示');
      bOk.onclick=function(){ const v=inp.value.trim(); if(it.ok(v)){ fb.style.color=C.success; fb.textContent='✓ 答对了！'; qi++; if(qi<Q.length){ setTimeout(show,700); } else { fb.style.color=C.success; fb.textContent='🎉 全部完成！'; } } else { wrong++; fb.style.color=C.accent; fb.textContent='再想想～ '+(wrong>=1?('提示：'+it.hint):''); } };
      bHint.onclick=function(){ fb.style.color=C.goldDeep; fb.textContent='提示：'+it.hint; };
    }
    show();
  })();

  setTab('derive');
}

function getUnitDiagrams(unit, grade, sem){
  const name = unit.name || '';
  const type = unit.type || '';
  const L = name.toLowerCase();
  const add = (arr, fn, title, opts, hint) => arr.push({ fn, title, opts: opts || {}, hint: hint || '' });
  let out = [];
  let dedicated = false;

  // ===== 圆柱与圆锥：专属四段交互动图（切拼·倒水·计算·挑战）=====
  if (/圆柱与圆锥|圆柱圆锥/.test(name)) { add(out, diagCylinderCone, '圆柱与圆锥的体积（切拼·倒水·计算·挑战）', {}, '👆 点标签切换：切拼探究 / 倒水实验 / 体积计算 / 随堂挑战'); return out; }

  // ===== 长方体和正方体：专属四段交互动图（摆一摆·表面积·计算·挑战）=====
  if (name === '长方体和正方体') { add(out, diagCuboid, '长方体和正方体的体积（摆一摆·表面积·计算·挑战）', {}, '👆 点标签切换：摆一摆 / 表面积 / 体积计算 / 随堂挑战'); return out; }
  // ===== 多边形的面积：专属四段交互动图（剪拼推导·计算·挑战）=====
  if (name === '多边形的面积') { add(out, diagPolygonArea, '多边形的面积（剪拼推导·计算·挑战）', {}, '👆 点标签切换：平行四边形 / 三角·梯形 / 面积计算 / 随堂挑战'); return out; }
  // ===== 圆：专属四段交互动图（剪拼成长方形·计算·挑战）=====
  if (name === '圆') { add(out, diagCircleArea, '圆的面积（剪拼成长方形·计算·挑战）', {}, '👆 点标签切换：剪拼成长方形 / 周长与面积 / 圆环与半圆 / 随堂挑战'); return out; }

  // ===== 专属交互动图（补齐此前只走兜底的单元）=====
  if (/生活应用题/.test(name)) { add(out, diagWordProblem, '看图列式（部分—整体）', {}, '👆 拖动滑块改变“已知”数量，看算式'); dedicated = true; }
  if (/混合运算/.test(name) && grade !== 4) { add(out, diagMixOps, '混合运算顺序', {}, '👆 点按钮，按先乘除后加减的顺序计算'); dedicated = true; }
  if (/图形计数/.test(name)) { add(out, diagCountShapes, '巧数图形（数三角形）', {}, '👆 拖动滑块猜数量，点验证'); dedicated = true; }
  if (/测量/.test(name)) { add(out, diagMeasure, '用尺子量长度', {}, '👆 拖动红色手柄测量长度'); dedicated = true; }
  if (/倍的认识/.test(name)) { add(out, diagMultiples, '倍的认识（几个几）', {}, '👆 拖滑块改变每行/行数，看总数'); dedicated = true; }
  if (/巧数图形/.test(name)) { add(out, diagCountShapes, '巧数图形（数三角形）', {}, '👆 拖动滑块猜数量，点验证'); dedicated = true; }
  if (/位置与方向/.test(name) || /位置（数对）/.test(name)) {
    const isPair = /数对/.test(name), isTwo = /（二）/.test(name);
    add(out, isPair ? diagCoordPlane : (isTwo ? diagBearing : diagPosition), isPair ? '用数对确定位置' : (isTwo ? '方向与位置（辨认方向）' : '位置与方向（上下左右）'), {}, '👆 看位置怎样描述');
    dedicated = true;
  }
  if (/搭配问题/.test(name)) { add(out, diagTree, '搭配问题（树状图）', {}, '👆 点上方上衣，高亮它的 3 种搭配'); dedicated = true; }
  if (/公顷和平方千米|公顷与平方千米/.test(name)) { add(out, diagAreaUnits, '面积单位换算', {}, '👆 拖滑块看平方米与公顷的关系'); dedicated = true; }
  if (/图形认知/.test(name)) { add(out, diagShapeProps, '图形认知', {}, '👆 点按钮认识图形特征'); dedicated = true; }
  if (/因数与倍数/.test(name)) { add(out, diagFactors, '因数与倍数', {}, '👆 拖滑块选数，看它的因数对'); dedicated = true; }
  if (/按比分配/.test(name)) { add(out, diagRatioSplit, '按比分配', {}, '👆 拖滑块改总数与比例'); dedicated = true; }
  if (/总复习/.test(name)) { add(out, diagReviewMap, '六下总复习', {}, '👆 点卡片回顾核心知识'); dedicated = true; }

  // ===== 四年级优先：按参考页「四年级下册数学乐园」升级为精美交互动画 =====
  if (grade === 4) {
    if (/巧数|数三角/.test(name)) {
      add(out, refCountTriangles, '巧数三角形（专项）', {}, '👆 数一数图中有几个三角形，点验证看对错');
    } else if (/四则运算|运算顺序|混合运算/.test(name)) {
      add(out, refOrderOfOps, '四则运算顺序', {}, '👆 点"先算这一步"，看先乘除后加减');
    } else if (/三角形/.test(name)) {
      add(out, refTriSum, '三角形内角和 = 180°', {}, '👆 点"把三个角拼在一起"，看内角和');
    } else if (/运算定律|分配律/.test(name)) {
      add(out, refDistributive, '乘法分配律', {}, '👆 拖滑块改长宽，点"分开算"对比');
    } else if (/小数/.test(name) && /意义|性质/.test(name)) {
      add(out, refDecimal, '小数的意义（100 格方格）', {}, '👆 拖滑块或点格子，看 0.1 和 0.01');
    } else if (/对称|平移|图形的运动/.test(name)) {
      add(out, refMotion, '轴对称 · 平移 · 旋转', {}, '👆 点按钮、拖手柄，看图形变换');
    }
    if (out.length) return out.slice(0, 3);
  }
  // 鸡兔同笼（任意年级，参考页同款假设法动画）
  if (/鸡兔/.test(name)) add(out, refChickenRabbit, '鸡兔同笼（假设法）', {}, '👆 点步骤按钮，看假设法怎么算');
  // 平均数（任意年级）
  if (/平均数/.test(name)) add(out, refAverage, '平均数（移多补少）', {}, '👆 点"移多补少"，看平均数怎么来');

  // 计数 / 数认识 → 数轴 + 位值
  if (/数数|数的认识|数的意义|1-5|6-10|11-20|100以内|万以内|大数|负数/.test(name)) {
    if (/负数/.test(name)) add(out, diagNumberLine, '数轴上的数（含负数）', {min:-10, max:10});
    else if (/万以内|大数/.test(name)) add(out, diagNumberLine, '万以内的数（数轴定位）', {min:0, max:10000, steps:1});
    else add(out, diagNumberLine, '用数轴数一数', {min:0, max:20});
    add(out, diagPlaceValue, '位值积木：拼出这个数');
  }
  // 加减法
  if (/加|减/.test(name) && !/乘法|除法|分数|小数/.test(name)) {
    if (/进位|退位|20以内|100以内/.test(name)) {
      add(out, diagAddColumn, '加法竖式（进位）', {a: ri(35,78), b: ri(24,59)});
      add(out, diagSubColumn, '减法竖式（退位）', {a: ri(60,92), b: ri(18,45)});
    } else if (/进位/.test(name)) {
      add(out, diagAddColumn, '加法竖式（连续进位）', {a: ri(358,789), b: ri(267,654)});
    } else if (/退位/.test(name)) {
      add(out, diagSubColumn, '减法竖式（连续退位）', {a: ri(503,905), b: ri(268,487)});
    } else {
      add(out, diagAddColumn, '加法竖式', {a: ri(123,876), b: ri(45,654)});
      add(out, diagSubColumn, '减法竖式', {a: ri(305,912), b: ri(87,476)});
    }
    if (!/混合|四则/.test(name)) add(out, diagNumberLine, '在数轴上做加减', {min:0, max:100});
  }
  // 乘法
  if (/乘/.test(name)) {
    if (/两位数乘两位数|多位数乘一位数|三位数乘二位数|表内乘法/.test(name)) {
      add(out, diagMulArea, '乘法面积模型：行×列', {maxR:9, maxC:9});
    } else if (/小数乘法/.test(name)) {
      add(out, diagMulArea, '乘法面积模型（拖出乘积）', {maxR:9, maxC:9});
    } else if (/分数乘法/.test(name)) {
      add(out, diagFractionBar, '分数乘法：先取一份再取几份', {den:4});
    } else {
      add(out, diagMulArea, '乘法就是几个几', {maxR:9, maxC:9});
    }
    add(out, diagDivGroups, '等量分组看一看', {N: ri(18,36)});
  }
  // 除法
  if (/除|余数/.test(name)) {
    if (/有余数的除法/.test(name)) add(out, diagDivGroups, '有余数的除法（圈一圈）', {N: ri(20,30)});
    else if (/两位数|一位数/.test(name)) add(out, diagDivGroups, '除法＝平均分（试商）', {N: ri(48,96)});
    else add(out, diagDivGroups, '除法：把总数分一分', {N: ri(12,24)});
    if (!/分数除法/.test(name)) add(out, diagMulArea, '乘除互逆：乘法面积回顾', {maxR:9, maxC:9});
  }
  // 分数
  if (/分数/.test(name)) {
    if (/初步|意义/.test(name)) { add(out, diagFractionBar, '分数条：几分之几', {den:4}); add(out, diagFractionCircle, '分数圆：涂一涂', {den:4}); }
    else if (/加减/.test(name)) { add(out, diagFractionBar, '同分母分数相加减', {den:8}); }
    else { add(out, diagFractionBar, '分数条', {den:5}); add(out, diagFractionCircle, '分数圆', {den:3}); }
  }
  // 小数
  if (/小数/.test(name)) {
    if (/认识|意义|性质/.test(name)) add(out, diagDecimalLine, '小数在数轴上的位置');
    else if (/加减/.test(name)) { add(out, diagDecimalLine, '小数在数轴上的位置'); add(out, diagNumberLine, '小数点对齐再算', {min:0, max:10}); }
    else add(out, diagDecimalLine, '小数在数轴上的位置');
  }
  // 百分数 / 比 / 比例 / 率
  if (/百分数|百分比/.test(name)) { add(out, diagPercent, '百分数就是百分之几'); add(out, diagFractionBar, '百分数 ↔ 分数', {den:4}); }
  if (/比$|比率|比例/.test(name) || /比/.test(name)&&/应用/.test(name)) { add(out, diagRatio, '比：两个量的关系'); }
  if (/比例/.test(name) && !/应用题/.test(name)) add(out, diagRatio, '比例：比值化简');
  // 方程
  if (/方程/.test(name)) add(out, diagEquation, '天平找 x', {a: ri(2,5), b: ri(6,20)});
  // 角度 / 图形度量
  if (/角/.test(name)) { add(out, diagAngle, '拖动认识各种角'); if (/度量|量角/.test(name)) add(out, diagProtractor, '用量角器读度数'); }
  // 三角形
  if (/三角形/.test(name)) add(out, diagTriangle, '拖动顶点，给三角形分类');
  // 圆
  if (/圆/.test(name)) add(out, diagCircle, '拖动看半径、直径、面积');
  // 多边形 / 平行四边形 / 梯形 / 长方形正方形
  if (/多边形|平行四边|梯形|长方形|正方形/.test(name)) add(out, diagPolygon, '拖动看边数变化');
  if (/面积|周长/.test(name)) { add(out, diagAreaRect, '拖一拖，看面积与周长'); }
  if (/周长/.test(name) && !/面积/.test(name)) add(out, diagAreaRect, '长方形周长 =（长+宽）×2');
  // 对称
  if (/对称/.test(name)) add(out, diagSymmetry, '拖动找对称轴');
  // 图形认识 / 识别 / 拼组 / 运动
  if (/图形认识|图形识别|认识图形|图形拼组/.test(name)) add(out, diagShapeGallery, '点一点，认图形');
  if (/图形的运动|运动/.test(name)) add(out, diagShapeGallery, '平移旋转里的图形');
  if (/观察物体|视图|展开|立体|长方体|正方体/.test(name)) add(out, diag3DUnfold, '正方体展开与旋转');
  // 统计
  if (/统计|条形统计|折线统计|扇形统计/.test(name)) {
    if (/扇形/.test(name)) add(out, diagPieChart, '拖动扇区看占比');
    else add(out, diagBarChart, '拖动柱子改数据');
  }
  // 可能性
  if (/可能性|概率/.test(name)) add(out, diagBarChart, '用柱状图看可能性大小');
  // 时间 / 钟表
  if (/钟表|时间|时、分、秒|时分秒|年、月、日/.test(name)) add(out, diagClock, '拖动指针认时间');
  if (/时间计算|时间应用/.test(name)) add(out, diagSpeed, '时间与路程的关系');
  // 长度 / 重量 / 货币 / 人民币 / 克千克
  if (/长度单位/.test(name)) add(out, diagRuler, '用尺子量一量');
  if (/人民币|货币|购物|价格/.test(name)) add(out, diagMoney, '凑出正确的钱数');
  if (/克和千克|重量|容量/.test(name)) add(out, diagBarChart, '用柱状图比轻重');
  // 应用题类
  if (/行程|速度/.test(name)) add(out, diagSpeed, '路程=速度×时间');
  if (/植树/.test(name)) add(out, diagPlant, '植树问题：间隔与棵数', {}, '👆 拖动金色手柄，或拉滑块，看间隔与棵数怎样变');
  if (/鸡兔/.test(name)) add(out, diagChickenRabbit, '鸡兔同笼：数头数脚');
  if (/面积应用|周长应用/.test(name)) add(out, diagAreaRect, '画图算面积/周长');
  if (/工程问题|价格应用|分数应用/.test(name)) add(out, diagBarChart, '用图表示数量关系');
  if (/方向|位置/.test(name) && !dedicated) add(out, diagNumberLine, '用数轴表示方向与位置', {min:-5, max:5});

  // 兜底：若仍为空，按类型给一个通用动图
  if (out.length === 0) {
    if (type === 'shape') add(out, diagShapeGallery, '认识图形');
    else if (type === 'application') add(out, diagBarChart, '用图表示数据');
    else add(out, diagNumberLine, '在数轴上感受这个数', {min:0, max:50});
  }
  // 去重（按 fn+title）
  const seen = new Set();
  out = out.filter(d => { const k = (d.fn.name||'')+d.title; if (seen.has(k)) return false; seen.add(k); return true; });
  // 限制最多 3 个，避免过长
  return out.slice(0, 3);
}

/* ============================================================
 *  四年级下册参考动画（移植自「四年级下册数学乐园」参考页，已美化）
 *  6 个可交互 SVG 动画：每个 render(box) 直接把内容画进 box
 *  计时型动画统一加 box.isConnected 守卫，防止切页后计时器泄漏报错
 * ============================================================ */

function R(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rad(d) { return d * Math.PI / 180; }
function n1(x) { return Math.round(x * 10) / 10; }

/* 扇形（用采样多边形，避免 arc 方向问题）；角度以数学方式：0°向右，90°向上 */
function sectorPoly(cx, cy, r, d0, d1) {
  const pts = [cx + ',' + cy];
  const step = (d1 - d0) / 40;
  for (let i = 0; i <= 40; i++) {
    const d = d0 + step * i;
    pts.push((cx + r * Math.cos(rad(d))).toFixed(1) + ',' + (cy - r * Math.sin(rad(d))).toFixed(1));
  }
  return pts.join(' ');
}
/* 顶点 v 处、两邻点 p1/p2 之间的角弧（屏幕坐标，y 向下） */
function arcPoly(vx, vy, p1, p2, r) {
  const a1 = Math.atan2(p1.y - vy, p1.x - vx);
  const a2 = Math.atan2(p2.y - vy, p2.x - vx);
  let d = a2 - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const a = a1 + d * i / 20;
    pts.push((vx + r * Math.cos(a)).toFixed(1) + ',' + (vy + r * Math.sin(a)).toFixed(1));
  }
  return { poly: pts.join(' '), mid: a1 + d / 2 };
}

const WEDGE_COLORS = ['#ff6b6b', '#45aaf2', '#ffc93c'];

/* ============================================================
 * 1. 三角形内角和 = 180°
 * ============================================================ */
function refTriSum(box) {
  box.innerHTML =
    '<div class="anim-stage">' +
    '  <svg id="ts-tri" viewBox="0 0 420 250" class="anim-svg"></svg>' +
    '  <svg id="ts-line" viewBox="0 0 420 170" class="anim-svg"></svg>' +
    '</div>' +
    '<div class="anim-msg" id="ts-msg"></div>' +
    '<div class="anim-ctrl">' +
    '  <button class="btn btn-primary" id="ts-fold">▶ 把三个角拼在一起</button>' +
    '  <button class="btn" id="ts-new">🎲 换一个三角形</button>' +
    '</div>' +
    '<div class="anim-tip">💡 拖动上方<b>顶点</b>改变三角形形状，三个内角会实时变化，但它们的和永远 = <b>180°</b>。点"把三个角拼在一起"看拼成平角。</div>';

  // 顶点位置为真相来源；角度由位置反算，保证拖拽时度数真实可信
  let P = [{ x: 70, y: 205 }, { x: 350, y: 205 }, { x: 210, y: 60 }];
  let A = 60, B = 60, C = 60, apex = null;

  function angleAt(v, a, b) {
    const v1 = { x: a.x - v.x, y: a.y - v.y }, v2 = { x: b.x - v.x, y: b.y - v.y };
    let d = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
    d = d * 180 / Math.PI;
    while (d < 0) d += 360; while (d > 360) d -= 360;
    return d > 180 ? 360 - d : d;
  }
  function computeAngles() {
    A = Math.round(angleAt(P[0], P[1], P[2]));
    B = Math.round(angleAt(P[1], P[0], P[2]));
    C = 180 - A - B; // 保证三者之和恒为 180，避免浮点误差导致显示异常
  }
  function placeFromAngles(a, b) {
    // 已知底边 P0→P1 与底角 a、b，求顶点 P2
    const x0 = P[0].x, x1 = P[1].x, yb = P[0].y, dx = x1 - x0;
    const t = dx * Math.sin(rad(b)) / Math.sin(rad(a + b));
    P[2] = { x: x0 + t * Math.cos(rad(a)), y: yb - t * Math.sin(rad(a)) };
  }

  function drawTriangle() {
    const svg = box.querySelector('#ts-tri');
    const W = 420, H = 250, pad = 30;
    const xs = P.map(function (p) { return p.x; }), ys = P.map(function (p) { return p.y; });
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    const s = Math.min((W - 2 * pad) / Math.max(maxX - minX, 1), (H - 2 * pad) / Math.max(maxY - minY, 1));
    const Q = P.map(function (p) {
      return { x: pad + (p.x - minX) * s + (W - 2 * pad - (maxX - minX) * s) / 2, y: H - pad - (p.y - minY) * s };
    });
    const ang = [A, B, C];
    let html = '<g id="ts-g"><polygon points="' + Q.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') +
      '" fill="#eef6ff" stroke="#2d6cdf" stroke-width="3" stroke-linejoin="round"/>';
    for (let i = 0; i < 3; i++) {
      const v = Q[i], p1 = Q[(i + 1) % 3], p2 = Q[(i + 2) % 3];
      const a = arcPoly(v.x, v.y, p1, p2, 30);
      html += '<polyline points="' + a.poly + '" fill="none" stroke="' + WEDGE_COLORS[i] + '" stroke-width="4"/>';
      const lx = v.x + 48 * Math.cos(a.mid), ly = v.y + 48 * Math.sin(a.mid);
      html += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 5).toFixed(1) + '" text-anchor="middle" font-size="17" font-weight="700" fill="' + WEDGE_COLORS[i] + '">' + ang[i] + '°</text>';
    }
    html += '</g>';
    let g = svg.querySelector('#ts-g');
    if (!g) { g = dg('g', { id: 'ts-g' }, svg); }
    g.innerHTML = html.replace('<g id="ts-g">', '').replace('</g>', '');
    // 顶点拖拽手柄（只创建一次，避免重复绑定监听）
    if (!apex) {
      apex = dg('circle', { id: 'ts-apex', r: 11, fill: '#2d6cdf', stroke: '#fff', 'stroke-width': 2.5, opacity: 0.9 }, svg);
      dgDrag(svg, apex, function (p) {
        const nx = Math.max(60, Math.min(360, p.x));
        const ny = Math.max(25, Math.min(170, p.y));
        P[2] = { x: nx, y: ny };
        computeAngles();
        drawTriangle();
        refreshMsg(false);
      });
    }
    apex.setAttribute('cx', Q[2].x); apex.setAttribute('cy', Q[2].y);
  }

  function drawWedges(folded) {
    const svg = box.querySelector('#ts-line');
    const cx = 210, cy = 130, r = 100;
    const bounds = [0, C, C + B, 180];
    /* 拼角顺序：从右到左依次放 ∠3(C) ∠2(B) ∠1(A)，颜色与三角形对应 */
    const order = [2, 1, 0];
    let html = '<line x1="30" y1="' + cy + '" x2="390" y2="' + cy + '" stroke="#b9c4d4" stroke-width="3"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#4a5568"/>';
    const spread = [[-148, -58], [0, -86], [148, -58]];
    for (let i = 0; i < 3; i++) {
      const ci = order[i];
      const poly = sectorPoly(cx, cy, r, bounds[i], bounds[i + 1]);
      html += '<g class="ts-wedge" style="transform:translate(' + spread[i][0] + 'px,' + spread[i][1] + 'px)">' +
        '<polygon points="' + poly + '" fill="' + WEDGE_COLORS[ci] + '" fill-opacity="0.62" stroke="' + WEDGE_COLORS[ci] + '" stroke-width="2"/>' +
        '</g>';
    }
    html += '<text id="ts-done" x="' + cx + '" y="' + (cy + 32) + '" text-anchor="middle" font-size="16" font-weight="700" fill="#2f855a" opacity="0">拼成一个平角 = 180°</text>';
    svg.innerHTML = html;
    if (folded) {
      requestAnimationFrame(function () {
        if (!box.isConnected) return;
        Array.prototype.forEach.call(svg.querySelectorAll('.ts-wedge'), function (g) {
          g.style.transform = 'translate(0px,0px)';
        });
        setTimeout(function () {
          if (!box.isConnected) return;
          const t = svg.querySelector('#ts-done');
          if (t) t.setAttribute('opacity', '1');
        }, 880);
      });
    }
  }

  function refreshMsg(folded) {
    box.querySelector('#ts-msg').innerHTML = folded
      ? '∠1 + ∠2 + ∠3 = ' + A + '° + ' + B + '° + ' + C + '° = <b class="hl">180°</b>　拼成了平角！'
      : '∠1=' + A + '°、∠2=' + B + '°、∠3=' + C + '°　→　和 = <b class="hl">180°</b>（拖动顶点试试）';
  }

  function reroll() {
    A = R(30, 80); B = R(30, 80); C = 180 - A - B;
    placeFromAngles(A, B);
    computeAngles();
    drawTriangle();
    drawWedges(false);
    refreshMsg(false);
  }

  box.querySelector('#ts-fold').onclick = function () { drawWedges(true); refreshMsg(true); };
  box.querySelector('#ts-new').onclick = reroll;
  reroll();
}

/* ============================================================
 * 2. 乘法分配律（长方形面积模型）
 * ============================================================ */
function refDistributive(box) {
  box.innerHTML =
    '<div class="anim-stage"><svg id="dl-svg" viewBox="0 0 460 260" class="anim-svg"></svg></div>' +
    '<div class="anim-msg" id="dl-msg"></div>' +
    '<div class="anim-sliders">' +
    '  <label>高 a：<input type="range" id="dl-a" min="2" max="9" value="4"><span id="dl-av">4</span></label>' +
    '  <label>宽 b：<input type="range" id="dl-b" min="1" max="9" value="6"><span id="dl-bv">6</span></label>' +
    '  <label>宽 c：<input type="range" id="dl-c" min="1" max="9" value="3"><span id="dl-cv">3</span></label>' +
    '</div>' +
    '<div class="anim-ctrl"><button class="btn btn-primary" id="dl-split">✂ 分开算 / 合起来算</button></div>' +
    '<div class="anim-tip">💡 大长方形的面积 = a×(b+c)；分成两块后 = a×b + a×c。面积没变，所以 <b>a×(b+c) = a×b + a×c</b>，这就是乘法分配律。</div>';

  let split = false;
  const $ = function (id) { return box.querySelector(id); };

  function draw() {
    const a = +$('#dl-a').value, b = +$('#dl-b').value, c = +$('#dl-c').value;
    $('#dl-av').textContent = a; $('#dl-bv').textContent = b; $('#dl-cv').textContent = c;
    const u = 20, x0 = 40, y0 = 40, gap = split ? 26 : 0;
    const h = a * u;
    let g = '';
    function block(x, w, color) {
      let s = '<rect x="' + x + '" y="' + y0 + '" width="' + (w * u) + '" height="' + h + '" fill="' + color + '" fill-opacity="0.55" stroke="#334" stroke-width="2"/>';
      for (let i = 1; i < w; i++) s += '<line x1="' + (x + i * u) + '" y1="' + y0 + '" x2="' + (x + i * u) + '" y2="' + (y0 + h) + '" stroke="#fff" stroke-width="1"/>';
      for (let j = 1; j < a; j++) s += '<line x1="' + x + '" y1="' + (y0 + j * u) + '" x2="' + (x + w * u) + '" y2="' + (y0 + j * u) + '" stroke="#fff" stroke-width="1"/>';
      return s;
    }
    g += block(x0, b, '#45aaf2');
    g += block(x0 + b * u + gap, c, '#ffc93c');
    g += '<text x="' + (x0 - 14) + '" y="' + (y0 + h / 2 + 5) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#334">' + a + '</text>';
    g += '<text x="' + (x0 + b * u / 2) + '" y="' + (y0 + h + 22) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#1a6fb8">' + b + '</text>';
    g += '<text x="' + (x0 + b * u + gap + c * u / 2) + '" y="' + (y0 + h + 22) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#b58900">' + c + '</text>';
    if (split) {
      g += '<text x="' + (x0 + b * u / 2) + '" y="' + (y0 + h + 46) + '" text-anchor="middle" font-size="14" fill="#1a6fb8">' + a + '×' + b + '=' + (a * b) + '</text>';
      g += '<text x="' + (x0 + b * u + gap + c * u / 2) + '" y="' + (y0 + h + 46) + '" text-anchor="middle" font-size="14" fill="#b58900">' + a + '×' + c + '=' + (a * c) + '</text>';
    } else {
      g += '<text x="' + (x0 + (b + c) * u / 2) + '" y="' + (y0 + h + 46) + '" text-anchor="middle" font-size="14" fill="#334">一共 ' + a + '×(' + b + '+' + c + ')=' + (a * (b + c)) + ' 个小方格</text>';
    }
    $('#dl-svg').innerHTML = g;
    $('#dl-msg').innerHTML = a + ' × (' + b + ' + ' + c + ') = ' + a + '×' + b + ' + ' + a + '×' + c +
      '　→　<b class="hl">' + (a * (b + c)) + ' = ' + (a * b) + ' + ' + (a * c) + '</b>';
  }

  ['#dl-a', '#dl-b', '#dl-c'].forEach(function (id) { $(id).oninput = draw; });
  $('#dl-split').onclick = function () { split = !split; draw(); };
  draw();
}

/* ============================================================
 * 3. 小数的意义（100 格方格图）
 * ============================================================ */
function refDecimal(box) {
  box.innerHTML =
    '<div class="anim-stage"><svg id="dc-svg" viewBox="0 0 300 300" class="anim-svg" style="max-width:320px;touch-action:none"></svg></div>' +
    '<div class="anim-msg" id="dc-msg"></div>' +
    '<div class="anim-sliders"><label style="flex:1 1 100%">涂色格数：<input type="range" id="dc-n" min="0" max="100" value="37"><span id="dc-nv">37</span></label></div>' +
    '<div class="anim-ctrl">' +
    '  <button class="btn" id="dc-m1">− 1 格</button><button class="btn" id="dc-p1">+ 1 格</button>' +
    '  <button class="btn btn-primary" id="dc-p10">+ 1 整行（0.1）</button>' +
    '</div>' +
    '<div class="anim-tip">💡 把"1"平均分成 100 份，每份是 <b>0.01</b>（百分之一）；每一整行 10 格就是 <b>0.1</b>（十分之一）。点方格或拖滑块试试看。</div>';

  const $ = function (id) { return box.querySelector(id); };

  function draw() {
    let n = +$('#dc-n').value;
    n = Math.max(0, Math.min(100, n));
    $('#dc-nv').textContent = n;
    const u = 28, x0 = 10, y0 = 10;
    let g = '';
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), c = i % 10;
      const on = i < n;
      const full = on && (r + 1) * 10 <= n;
      g += '<rect class="dc-cell" data-i="' + i + '" x="' + (x0 + c * u) + '" y="' + (y0 + r * u) + '" width="' + u + '" height="' + u +
        '" fill="' + (on ? (full ? '#26de81' : '#ffc93c') : '#f3f6fa') + '" stroke="#9fb0c6" stroke-width="1"/>';
    }
    g += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (10 * u) + '" height="' + (10 * u) + '" fill="none" stroke="#2d3748" stroke-width="3"/>';
    $('#dc-svg').innerHTML = g;

    const rows = Math.floor(n / 10), rest = n % 10;
    const val = n / 100;
    $('#dc-msg').innerHTML =
      '涂色部分是 <b class="hl">' + val.toFixed(2) + '</b>　（即 ' + n + '/100，读作零点' + String(val.toFixed(2)).slice(2).split('').join('') + '）<br>' +
      '<span class="sub">= ' + rows + ' 个 0.1 ' + (rest ? '+ ' + rest + ' 个 0.01' : '') + '　共 ' + n + ' 个 0.01</span>';

    Array.prototype.forEach.call(box.querySelectorAll('.dc-cell'), function (el) {
      el.onclick = function () { $('#dc-n').value = +el.getAttribute('data-i') + 1; draw(); };
    });
  }

  // 直接在方格上拖动涂色（点一下也可）
  let painting = false;
  const svgDC = $('#dc-svg');
  function cellAt(e) {
    const p = dgPoint(svgDC, e);
    const u = 28, x0 = 10, y0 = 10;
    const c = Math.floor((p.x - x0) / u), r = Math.floor((p.y - y0) / u);
    if (c < 0 || c > 9 || r < 0 || r > 9) return -1;
    return r * 10 + c;
  }
  function paint(e) { if (!box.isConnected) return; const i = cellAt(e); if (i < 0) return; $('#dc-n').value = i + 1; draw(); }
  svgDC.addEventListener('pointerdown', function (e) { e.preventDefault(); painting = true; paint(e); });
  svgDC.addEventListener('pointermove', function (e) { if (painting) paint(e); });
  window.addEventListener('pointerup', function () { painting = false; });

  $('#dc-n').oninput = draw;
  $('#dc-m1').onclick = function () { $('#dc-n').value = Math.max(0, +$('#dc-n').value - 1); draw(); };
  $('#dc-p1').onclick = function () { $('#dc-n').value = Math.min(100, +$('#dc-n').value + 1); draw(); };
  $('#dc-p10').onclick = function () { $('#dc-n').value = Math.min(100, +$('#dc-n').value + 10); draw(); };
  draw();
}

/* ============================================================
 * 3.5 四则运算顺序（先乘除后加减）
 * ============================================================ */
function refOrderOfOps(box) {
  box.innerHTML =
    '<div class="anim-stage"><svg id="oo-svg" viewBox="0 0 470 150" class="anim-svg"></svg></div>' +
    '<div class="anim-msg" id="oo-msg"></div>' +
    '<div class="anim-ctrl">' +
    '  <button class="btn btn-primary" id="oo-next">👉 先算这一步</button>' +
    '  <button class="btn" id="oo-ans">💡 显示全部步骤</button>' +
    '  <button class="btn" id="oo-new">🎲 换一道</button>' +
    '</div>' +
    '<div class="anim-tip">💡 <b>先乘除，后加减</b>：同一级运算从左往右算。先找有没有 × 或 ÷，有就先算它；都算完，再算 + 和 −。点"先算这一步"，看每一步先算谁。</div>';

  const $ = function (id) { return box.querySelector(id); };
  let toks, hi;

  function fixDivide() {
    for (let i = 1; i < toks.length; i += 2) {
      if (toks[i] === '÷') {
        const a = toks[i - 1];
        const fac = [2, 3, 4, 5, 6].filter(function (f) { return a % f === 0; });
        toks[i + 1] = fac.length ? fac[R(0, fac.length - 1)] : 1;
      }
    }
  }
  function findHi() {
    for (let i = 1; i < toks.length; i += 2) if (toks[i] === '×' || toks[i] === '÷') return i;
    for (let i = 1; i < toks.length; i += 2) if (toks[i] === '+' || toks[i] === '−') return i;
    return -1;
  }
  function computeStep() {
    if (hi < 0) return;
    const a = toks[hi - 1], op = toks[hi], b = toks[hi + 1];
    let r;
    if (op === '×') r = a * b; else if (op === '÷') r = a / b; else if (op === '+') r = a + b; else r = a - b;
    toks.splice(hi - 1, 3, r);
    hi = findHi();
  }
  function gen() {
    const n = R(3, 4);
    const hasMul = Math.random() < 0.5;
    const nums = [], ops = [];
    for (let i = 0; i < n; i++) nums.push(R(2, 9));
    for (let i = 0; i < n - 1; i++) {
      if (hasMul) ops.push(Math.random() < 0.6 ? '×' : '+');
      else ops.push(Math.random() < 0.6 ? '÷' : '+');
    }
    toks = [];
    for (let i = 0; i < n; i++) { toks.push(nums[i]); if (i < n - 1) toks.push(ops[i]); }
    fixDivide();
    hi = findHi();
  }
  function draw() {
    const svg = $('#oo-svg');
    let x = 24; const y = 80;
    let g = '';
    for (let i = 0; i < toks.length; i++) {
      const t = String(toks[i]);
      const isOp = (i % 2 === 1);
      const hot = (i === hi);
      const fs = hot ? 36 : 28;
      const col = hot ? '#e8590c' : (isOp ? '#2d6cdf' : '#1a202c');
      const w = t.length * fs * 0.6;
      g += '<text x="' + x + '" y="' + y + '" font-size="' + fs + '" font-weight="' + (hot ? '800' : '700') + '" fill="' + col + '" font-family="ui-monospace,Menlo,Consolas,monospace" text-anchor="start">' + t + '</text>';
      if (hot) g += '<rect x="' + (x - 4) + '" y="' + (y + 9) + '" width="' + (w + 8) + '" height="6" rx="3" fill="#e8590c" opacity="0.85"/>';
      x += w + (isOp ? 18 : 12);
    }
    svg.innerHTML = g;
    $('#oo-msg').innerHTML = hi < 0
      ? '全部算完啦！结果是 <b class="hl">' + toks[0] + '</b>。'
      : '现在该先算 <b class="hl">' + toks[hi - 1] + ' ' + toks[hi] + ' ' + toks[hi + 1] + '</b>（先乘除后加减，同级从左往右）。点"先算这一步"算它。';
  }
  $('#oo-next').onclick = function () { if (hi < 0) return; computeStep(); draw(); };
  $('#oo-ans').onclick = function () { let guard = 0; while (hi >= 0 && guard < 30) { computeStep(); guard++; } draw(); };
  $('#oo-new').onclick = function () { gen(); draw(); };
  gen(); draw();
}

/* ============================================================
 * 3.6 巧数三角形（专项）
 * ============================================================ */
function refCountTriangles(box) {
  box.innerHTML =
    '<div class="anim-stage"><svg id="ct-svg" viewBox="0 0 420 260" class="anim-svg"></svg></div>' +
    '<div class="anim-msg" id="ct-msg"></div>' +
    '<div class="anim-sliders"><label style="flex:1 1 100%">我数到：<input type="number" id="ct-ans" min="0" max="99" value="0" style="width:66px"> 个</label></div>' +
    '<div class="anim-ctrl">' +
    '  <button class="btn btn-primary" id="ct-check">✔ 验证</button>' +
    '  <button class="btn" id="ct-show">👀 显示所有三角形</button>' +
    '  <button class="btn" id="ct-easy">简单</button>' +
    '  <button class="btn" id="ct-mid">中等</button>' +
    '  <button class="btn" id="ct-hard">难</button>' +
    '</div>' +
    '<div class="anim-tip">💡 别只数小三角形！由 2 段、3 段拼起来的<b>大三角形</b>也要算。<br>规律：底边被分成 n 段时，三角形总数 = 1+2+…+n = n(n+1)/2。</div>';

  const $ = function (id) { return box.querySelector(id); };
  let N = 4, timer = null;

  function geom() {
    const W = 420, baseY = 220, x0 = 50, x1 = 370;
    const apex = { x: W / 2, y: 36 };
    const pts = [];
    for (let i = 0; i <= N; i++) pts.push({ x: x0 + (x1 - x0) * i / N, y: baseY });
    return { apex: apex, pts: pts };
  }
  function trueCount() { return N * (N + 1) / 2; }

  function draw(reveal) {
    const svg = $('#ct-svg');
    const G = geom();
    let g = '';
    g += '<polygon points="' + G.apex.x + ',' + G.apex.y + ' ' + G.pts[0].x + ',' + G.pts[0].y + ' ' + G.pts[N].x + ',' + G.pts[N].y + '" fill="#eef6ff" stroke="#2d6cdf" stroke-width="2.5" stroke-linejoin="round"/>';
    for (let i = 1; i < N; i++) g += '<line x1="' + G.apex.x + '" y1="' + G.apex.y + '" x2="' + G.pts[i].x + '" y2="' + G.pts[i].y + '" stroke="#9fb0c6" stroke-width="1.5"/>';
    g += '<line x1="' + G.pts[0].x + '" y1="' + G.pts[0].y + '" x2="' + G.pts[N].x + '" y2="' + G.pts[N].y + '" stroke="#2d6cdf" stroke-width="2.5"/>';
    if (reveal) {
      let k = 0;
      for (let i = 0; i <= N; i++) {
        for (let j = i + 1; j <= N; j++) {
          g += '<polygon points="' + G.apex.x + ',' + G.apex.y + ' ' + G.pts[i].x + ',' + G.pts[i].y + ' ' + G.pts[j].x + ',' + G.pts[j].y + '" fill="none" stroke="' + WEDGE_COLORS[k % 3] + '" stroke-width="2.5" stroke-linejoin="round"/>';
          k++;
        }
      }
    }
    svg.innerHTML = g;
  }

  function showAll() {
    clearInterval(timer);
    draw(false);
    const G = geom();
    const list = [];
    for (let i = 0; i <= N; i++) for (let j = i + 1; j <= N; j++) list.push([i, j]);
    const svg = $('#ct-svg');
    let k = 0;
    $('#ct-msg').innerHTML = '正在标出所有三角形… (0/' + list.length + ')';
    timer = setInterval(function () {
      if (!box.isConnected) { clearInterval(timer); return; }
      const pr = list[k];
      dg('polygon', { points: G.apex.x + ',' + G.apex.y + ' ' + G.pts[pr[0]].x + ',' + G.pts[pr[0]].y + ' ' + G.pts[pr[1]].x + ',' + G.pts[pr[1]].y, fill: 'none', stroke: WEDGE_COLORS[k % 3], 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg);
      k++;
      $('#ct-msg').innerHTML = '正在标出所有三角形… (' + k + '/' + list.length + ')';
      if (k >= list.length) { clearInterval(timer); $('#ct-msg').innerHTML = '共 <b class="hl">' + list.length + '</b> 个三角形 ＝ 1+2+…+' + N + ' = ' + (N * (N + 1) / 2) + '。'; }
    }, 240);
  }

  function setLevel(n) { clearInterval(timer); N = n; $('#ct-ans').value = 0; $('#ct-msg').innerHTML = ''; draw(false); }
  $('#ct-check').onclick = function () {
    const v = +$('#ct-ans').value, t = trueCount();
    $('#ct-msg').innerHTML = v === t
      ? '🎉 正确！图中共有 <b class="hl">' + t + '</b> 个三角形。'
      : '再想想～图中其实有 <b class="hl">' + t + '</b> 个三角形（不是 ' + v + ' 个）。点"显示所有三角形"看看漏了哪些。';
  };
  $('#ct-show').onclick = showAll;
  $('#ct-easy').onclick = function () { setLevel(3); };
  $('#ct-mid').onclick = function () { setLevel(4); };
  $('#ct-hard').onclick = function () { setLevel(5); };
  draw(false);
  return function () { clearInterval(timer); };
}

/* ============================================================
 * 4. 轴对称与平移
 * ============================================================ */
function refMotion(box) {
  box.innerHTML =
    '<div class="anim-tabs"><button class="tab tab-on" data-m="sym">轴对称</button><button class="tab" data-m="tra">平移</button><button class="tab" data-m="rot">旋转</button></div>' +
    '<div class="anim-stage"><svg id="mo-svg" viewBox="0 0 420 300" class="anim-svg" style="touch-action:none"></svg></div>' +
    '<div class="anim-msg" id="mo-msg"></div>' +
    '<div class="anim-sliders" id="mo-sliders"></div>' +
    '<div class="anim-ctrl" id="mo-ctrl"></div>' +
    '<div class="anim-tip" id="mo-tip"></div>';

  const $ = function (id) { return box.querySelector(id); };
  const U = 30, OX = 30, OY = 30, COLS = 12, ROWS = 8;
  /* 小旗图形（格子坐标） */
  const SHAPE = [[0, 0], [0, 5], [3, 4], [3, 2], [1, 2], [1, 0]];
  let mode = 'sym', axis = 'v', shown = false, dx = 4, dy = 0, ang = 0;
  let timer = null;
  const svgMO = box.querySelector('#mo-svg');
  let layer = svgMO.querySelector('#mo-layer'); if (!layer) layer = dg('g', { id: 'mo-layer' }, svgMO);
  let handle = null;
  function positionHandle() {
    if (!handle) return;
    if (mode === 'tra') {
      const refX = OX + (SHAPE[0][0] + 1) * U, refY = OY + (SHAPE[0][1] + 2) * U;
      handle.setAttribute('cx', refX + dx * U); handle.setAttribute('cy', refY + dy * U);
      handle.setAttribute('fill', '#0f9b5a'); handle.style.display = '';
    } else if (mode === 'rot') {
      const cx = OX + 5 * U, cy = OY + 4 * U, R = 56;
      handle.setAttribute('cx', cx + R * Math.cos(rad(ang))); handle.setAttribute('cy', cy + R * Math.sin(rad(ang)));
      handle.setAttribute('fill', '#e8590c'); handle.style.display = '';
    } else {
      handle.style.display = 'none';
    }
  }
  function ensureHandle() {
    if (handle) { positionHandle(); return; }
    handle = dg('circle', { id: 'mo-handle', r: 10, fill: '#0f9b5a', stroke: '#fff', 'stroke-width': 2.5, opacity: 0.95 }, svgMO);
    dgDrag(svgMO, handle, function (p) {
      if (mode === 'tra') {
        const refX = OX + (SHAPE[0][0] + 1) * U, refY = OY + (SHAPE[0][1] + 2) * U;
        dx = Math.max(-2, Math.min(7, Math.round((p.x - refX) / U)));
        dy = Math.max(-2, Math.min(3, Math.round((p.y - refY) / U)));
        draw();
      } else if (mode === 'rot') {
        const cx = OX + 5 * U, cy = OY + 4 * U;
        ang = Math.round(Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI);
        draw();
      }
    });
    positionHandle();
  }

  function grid() {
    let g = '';
    for (let c = 0; c <= COLS; c++) g += '<line x1="' + (OX + c * U) + '" y1="' + OY + '" x2="' + (OX + c * U) + '" y2="' + (OY + ROWS * U) + '" stroke="#e3e9f2" stroke-width="1"/>';
    for (let r = 0; r <= ROWS; r++) g += '<line x1="' + OX + '" y1="' + (OY + r * U) + '" x2="' + (OX + COLS * U) + '" y2="' + (OY + r * U) + '" stroke="#e3e9f2" stroke-width="1"/>';
    return g;
  }
  function poly(pts, fill, stroke, dash, op) {
    return '<polygon points="' + pts.map(function (p) { return (OX + p[0] * U) + ',' + (OY + p[1] * U); }).join(' ') +
      '" fill="' + fill + '" fill-opacity="' + (op === undefined ? 0.6 : op) + '" stroke="' + stroke + '" stroke-width="2.5"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>';
  }

  function draw() {
    let g = grid();
    if (mode === 'sym') {
      const base = SHAPE.map(function (p) { return [p[0] + 2, p[1] + 2]; });
      if (axis === 'v') {
        const ax = 6;
        g += '<line x1="' + (OX + ax * U) + '" y1="' + (OY - 12) + '" x2="' + (OX + ax * U) + '" y2="' + (OY + ROWS * U + 12) + '" stroke="#a55eea" stroke-width="3" stroke-dasharray="8 5"/>';
        g += '<text x="' + (OX + ax * U + 6) + '" y="' + (OY - 16) + '" font-size="13" fill="#a55eea" font-weight="700">对称轴</text>';
        g += poly(base, '#45aaf2', '#1a6fb8');
        const mir = base.map(function (p) { return [2 * ax - p[0], p[1]]; });
        g += '<g class="mo-mirror mo-v" style="transform-origin:' + (OX + ax * U) + 'px ' + OY + 'px">' + poly(mir, '#ff6b6b', '#c0392b') + '</g>';
      } else {
        const ay = 4;
        g += '<line x1="' + (OX - 12) + '" y1="' + (OY + ay * U) + '" x2="' + (OX + COLS * U + 12) + '" y2="' + (OY + ay * U) + '" stroke="#a55eea" stroke-width="3" stroke-dasharray="8 5"/>';
        g += '<text x="' + (OX + COLS * U - 54) + '" y="' + (OY + ay * U - 8) + '" font-size="13" fill="#a55eea" font-weight="700">对称轴</text>';
        const b2 = SHAPE.map(function (p) { return [p[0] + 3, p[1] - 1]; });
        g += poly(b2, '#45aaf2', '#1a6fb8');
        const mir = b2.map(function (p) { return [p[0], 2 * ay - p[1]]; });
        g += '<g class="mo-mirror mo-h" style="transform-origin:' + OX + 'px ' + (OY + ay * U) + 'px">' + poly(mir, '#ff6b6b', '#c0392b') + '</g>';
      }
      $('#mo-msg').innerHTML = shown
        ? '沿对称轴对折，两个图形<b class="hl">完全重合</b>！对应点到对称轴的距离相等。'
        : '点"画出对称图形"，看看沿' + (axis === 'v' ? '竖' : '横') + '着的对称轴翻过去是什么样。';
      $('#mo-sliders').innerHTML = '';
      $('#mo-ctrl').innerHTML =
        '<button class="btn btn-primary" id="mo-go">🦋 画出对称图形</button>' +
        '<button class="btn" id="mo-axis">↔ 换对称轴方向</button>' +
        '<button class="btn" id="mo-rst">↺ 重来</button>';
      $('#mo-tip').innerHTML = '💡 <b>轴对称</b>：沿一条直线对折，两边能完全重合。对应点到对称轴的距离相等，连线与对称轴垂直。';
      $('#mo-go').onclick = function () { shown = true; draw(); };
      $('#mo-axis').onclick = function () { axis = axis === 'v' ? 'h' : 'v'; shown = false; draw(); };
      $('#mo-rst').onclick = function () { shown = false; draw(); };
    } else if (mode === 'tra') {
      const base = SHAPE.map(function (p) { return [p[0] + 1, p[1] + 2]; });
      g += poly(base, '#cbd5e0', '#8a97a8', true, 0.35);
      const mv = base.map(function (p) { return [p[0] + dx, p[1] + dy]; });
      g += poly(mv, '#26de81', '#0f9b5a');
      const sx = OX + (base[0][0] + 0.4) * U, sy = OY + (base[0][1] - 0.5) * U;
      const ex = sx + dx * U, ey = sy + dy * U;
      if (dx || dy) {
        g += '<line x1="' + sx + '" y1="' + sy + '" x2="' + ex + '" y2="' + ey + '" stroke="#0f9b5a" stroke-width="2.5" stroke-dasharray="5 4"/>' +
          '<circle cx="' + ex + '" cy="' + ey + '" r="4" fill="#0f9b5a"/>';
      }
      $('#mo-msg').innerHTML = '把图形向' + (dx >= 0 ? '右' : '左') + '平移 <b class="hl">' + Math.abs(dx) + '</b> 格，向' + (dy >= 0 ? '下' : '上') + '平移 <b class="hl">' + Math.abs(dy) + '</b> 格。<br><span class="sub">形状和大小都没有改变，只是位置变了。（也可直接拖动绿色手柄）</span>';
      $('#mo-sliders').innerHTML =
        '<label>左右：<input type="range" id="mo-dx" min="-2" max="7" value="' + dx + '"><span>' + dx + '</span></label>' +
        '<label>上下：<input type="range" id="mo-dy" min="-2" max="3" value="' + dy + '"><span>' + dy + '</span></label>';
      $('#mo-ctrl').innerHTML = '<button class="btn btn-primary" id="mo-play">▶ 自动平移演示</button><button class="btn" id="mo-rst2">↺ 回到原位</button>';
      $('#mo-tip').innerHTML = '💡 <b>平移</b>：图形沿直线方向整体移动。平移只改变<b>位置</b>，不改变<b>形状、大小和方向</b>。';
      $('#mo-dx').oninput = function () { dx = +this.value; draw(); };
      $('#mo-dy').oninput = function () { dy = +this.value; draw(); };
      $('#mo-play').onclick = function () {
        dx = -2; dy = 0; draw();
        let step = 0;
        clearInterval(timer);
        timer = setInterval(function () {
          if (!box.isConnected) { clearInterval(timer); return; }
          step++; dx = -2 + step; draw();
          if (dx >= 7) clearInterval(timer);
        }, 320);
      };
      $('#mo-rst2').onclick = function () { clearInterval(timer); dx = 0; dy = 0; draw(); };
    } else { // rot
      const cx = OX + 5 * U, cy = OY + 4 * U;
      g += '<circle cx="' + cx + '" cy="' + cy + '" r="3.5" fill="#e8590c"/>';
      g += '<circle cx="' + cx + '" cy="' + cy + '" r="14" fill="none" stroke="#e8590c" stroke-width="1.5" stroke-dasharray="4 4"/>';
      g += '<text x="' + (cx + 20) + '" y="' + (cy + 5) + '" font-size="12" fill="#e8590c" font-weight="700">旋转中心</text>';
      const off = [4, 2];
      const pts = SHAPE.map(function (p) { return [p[0] + off[0], p[1] + off[1]]; });
      g += '<g transform="rotate(' + ang + ' ' + cx + ' ' + cy + ')">' + poly(pts, '#ffa94d', '#e8590c') + '</g>';
      $('#mo-msg').innerHTML = '绕红点（旋转中心）把图形转了 <b class="hl">' + ang + '°</b>。<br><span class="sub">旋转只改变<b>方向</b>，不改变<b>形状和大小</b>。（拖动橙色手柄转一转）</span>';
      $('#mo-sliders').innerHTML = '<label>旋转：<input type="range" id="mo-ang" min="-180" max="180" value="' + ang + '"><span>' + ang + '°</span></label>';
      $('#mo-ctrl').innerHTML = '<button class="btn btn-primary" id="mo-spin">⟳ 自动旋转演示</button><button class="btn" id="mo-rst3">↺ 回到 0°</button>';
      $('#mo-tip').innerHTML = '💡 <b>旋转</b>：图形绕一个定点（旋转中心）转动一定角度。旋转只改变<b>方向</b>，不改变<b>形状和大小</b>。';
      $('#mo-ang').oninput = function () { ang = +this.value; draw(); };
      $('#mo-spin').onclick = function () {
        clearInterval(timer); ang = 0; draw();
        let step = 0;
        timer = setInterval(function () {
          if (!box.isConnected) { clearInterval(timer); return; }
          step++; ang = (ang + 15) % 360; if (ang > 180) ang -= 360; draw();
          if (step >= 24) clearInterval(timer);
        }, 70);
      };
      $('#mo-rst3').onclick = function () { clearInterval(timer); ang = 0; draw(); };
    }
    layer.innerHTML = g;
    ensureHandle();
    if (mode === 'sym' && shown) {
      requestAnimationFrame(function () {
        if (!box.isConnected) return;
        const m = layer.querySelector('.mo-mirror');
        if (m) m.classList.add('mo-on');
      });
    }
  }

  Array.prototype.forEach.call(box.querySelectorAll('.anim-tabs .tab'), function (t) {
    t.onclick = function () {
      Array.prototype.forEach.call(box.querySelectorAll('.anim-tabs .tab'), function (x) { x.classList.remove('tab-on'); });
      t.classList.add('tab-on');
      mode = t.getAttribute('data-m'); shown = false; clearInterval(timer);
      if (mode === 'tra') { dx = 4; dy = 0; }
      if (mode === 'rot') { ang = 0; }
      draw();
    };
  });
  draw();
  return function () { clearInterval(timer); };
}

/* ============================================================
 * 5. 平均数（移多补少）
 * ============================================================ */
function refAverage(box) {
  box.innerHTML =
    '<div class="anim-stage"><svg id="av-svg" viewBox="0 0 440 280" class="anim-svg"></svg></div>' +
    '<div class="anim-msg" id="av-msg"></div>' +
    '<div class="anim-ctrl">' +
    '  <button class="btn btn-primary" id="av-go">⚖ 移多补少，变一样高</button>' +
    '  <button class="btn" id="av-new">🎲 换一组数据</button>' +
    '  <button class="btn" id="av-rst">↺ 看原始数据</button>' +
    '</div>' +
    '<div class="anim-tip">💡 把多的移给少的，最后每根一样高，这个高度就是<b>平均数</b>。计算方法：<b>平均数 = 总数量 ÷ 总份数</b>。点柱子上的 +/− 也能改数据。</div>';

  const $ = function (id) { return box.querySelector(id); };
  let data = [], leveled = false, timer = null;

  function avg() { return data.reduce(function (a, b) { return a + b; }, 0) / data.length; }

  function draw(cur) {
    const vals = cur || data;
    const maxV = Math.max(20, Math.max.apply(null, data) + 4);
    const baseY = 220, H = 170, W = 440;
    const bw = 44, gap = (W - 60 - data.length * bw) / (data.length - 1 || 1);
    const a = avg();
    let g = '<line x1="20" y1="' + baseY + '" x2="' + (W - 20) + '" y2="' + baseY + '" stroke="#4a5568" stroke-width="3"/>';
    const ay = baseY - a / maxV * H;
    g += '<line x1="20" y1="' + ay.toFixed(1) + '" x2="' + (W - 20) + '" y2="' + ay.toFixed(1) + '" stroke="#ff6b6b" stroke-width="2.5" stroke-dasharray="7 5"/>' +
      '<text x="' + (W - 22) + '" y="' + (ay - 7).toFixed(1) + '" text-anchor="end" font-size="14" font-weight="700" fill="#ff6b6b">平均数 ' + n1(a) + '</text>';
    for (let i = 0; i < vals.length; i++) {
      const x = 30 + i * (bw + gap);
      const h = vals[i] / maxV * H;
      g += '<rect class="av-bar" x="' + x + '" y="' + (baseY - h).toFixed(1) + '" width="' + bw + '" height="' + h.toFixed(1) + '" rx="5" fill="#45aaf2"/>' +
        '<text x="' + (x + bw / 2) + '" y="' + (baseY - h - 8).toFixed(1) + '" text-anchor="middle" font-size="14" font-weight="700" fill="#1a6fb8">' + n1(vals[i]) + '</text>' +
        '<text x="' + (x + bw / 2) + '" y="' + (baseY + 20) + '" text-anchor="middle" font-size="13" fill="#4a5568">' + (i + 1) + '号</text>';
      if (!leveled) {
        g += '<text class="av-btn" data-d="1" data-i="' + i + '" x="' + (x + bw / 2 - 12) + '" y="' + (baseY + 44) + '" font-size="19" fill="#26de81" font-weight="700">＋</text>' +
          '<text class="av-btn" data-d="-1" data-i="' + i + '" x="' + (x + bw / 2 + 14) + '" y="' + (baseY + 44) + '" font-size="19" fill="#ff6b6b" font-weight="700">－</text>';
      }
    }
    $('#av-svg').innerHTML = g;
    const sum = data.reduce(function (p, v) { return p + v; }, 0);
    $('#av-msg').innerHTML = '数据：' + data.join('、') + '<br><span class="sub">总数量 ' + sum + ' ÷ 总份数 ' + data.length + ' = </span><b class="hl">平均数 ' + n1(a) + '</b>';
    Array.prototype.forEach.call(box.querySelectorAll('.av-btn'), function (el) {
      el.onclick = function () {
        const i = +el.getAttribute('data-i'), d = +el.getAttribute('data-d');
        data[i] = Math.max(1, Math.min(20, data[i] + d));
        leveled = false; clearInterval(timer); draw();
      };
    });
  }

  function level() {
    clearInterval(timer);
    const target = avg();
    let cur = data.slice(), step = 0;
    leveled = true;
    timer = setInterval(function () {
      if (!box.isConnected) { clearInterval(timer); return; }
      step++;
      cur = data.map(function (v) { return v + (target - v) * step / 20; });
      draw(cur);
      if (step >= 20) {
        clearInterval(timer);
        $('#av-msg').innerHTML = '移多补少后，每根都是 <b class="hl">' + n1(target) + '</b>，这就是这组数据的平均数！';
      }
    }, 45);
  }

  function reroll() {
    const n = R(4, 5);
    data = [];
    for (let i = 0; i < n; i++) data.push(R(3, 18));
    leveled = false; clearInterval(timer); draw();
  }

  $('#av-go').onclick = level;
  $('#av-new').onclick = reroll;
  $('#av-rst').onclick = function () { leveled = false; clearInterval(timer); draw(); };
  reroll();
  return function () { clearInterval(timer); };
}

/* ============================================================
 * 6. 鸡兔同笼（假设法动画）
 * ============================================================ */
function refChickenRabbit(box) {
  box.innerHTML =
    '<div class="anim-stage"><svg id="cr-svg" viewBox="0 0 440 260" class="anim-svg"></svg></div>' +
    '<div class="anim-msg" id="cr-msg"></div>' +
    '<div class="anim-steps" id="cr-steps"></div>' +
    '<div class="anim-ctrl">' +
    '  <button class="btn btn-primary" id="cr-a">① 假设全是鸡</button>' +
    '  <button class="btn btn-primary" id="cr-b">② 给兔子补上脚</button>' +
    '  <button class="btn" id="cr-new">换一道题</button>' +
    '</div>' +
    '<div class="anim-tip"><b>假设法</b>：先当作全是鸡，算出的脚会比实际少；每把一只兔当成鸡就少 2 只脚，所以 <b>兔的只数 =（实际脚数 − 头数×2）÷ 2</b>。</div>';

  const $ = function (id) { return box.querySelector(id); };
  let H, L, RB, CK, rabbitShown = 0, timer = null;

  function draw() {
    const perRow = 8, u = 48, x0 = 26, y0 = 40;
    let g = '';
    let legs = 0;
    for (let i = 0; i < H; i++) {
      const r = Math.floor(i / perRow), c = i % perRow;
      const x = x0 + c * u, y = y0 + r * 78;
      const isRab = i < rabbitShown;
      legs += isRab ? 4 : 2;
      g += '<circle cx="' + (x + 18) + '" cy="' + y + '" r="16" fill="' + (isRab ? DC.red : DC.gold) + '" stroke="' + DC.ink + '" stroke-width="1.5"/>';
      g += '<text x="' + (x + 18) + '" y="' + (y + 6) + '" text-anchor="middle" font-size="18" fill="#fff">' + (isRab ? '兔' : '鸡') + '</text>';
      const nLeg = isRab ? 4 : 2;
      for (let k = 0; k < nLeg; k++) {
        const lx = x + 18 + (k - (nLeg - 1) / 2) * 9;
        g += '<line class="' + (isRab && k >= 2 ? 'cr-newleg' : '') + '" x1="' + lx + '" y1="' + (y + 15) + '" x2="' + lx + '" y2="' + (y + 40) + '" stroke="' + (isRab ? DC.red : DC.gold) + '" stroke-width="3" stroke-linecap="round"/>';
      }
    }
    $('#cr-svg').innerHTML = g;
    return legs;
  }

  function info(stage) {
    const legs = draw();
    $('#cr-msg').innerHTML = '题目：笼子里有鸡和兔，共有 <b>' + H + '</b> 个头、<b>' + L + '</b> 只脚。鸡和兔各有几只？' +
      '<br><span class="sub">当前画面：' + (H - rabbitShown) + ' 只鸡 + ' + rabbitShown + ' 只兔 ＝ ' + legs + ' 只脚</span>';
    let s = '';
    if (stage >= 1) s += '<div class="step">① 假设全是鸡：' + H + ' × 2 = <b>' + (2 * H) + '</b>（只脚）</div>';
    if (stage >= 1) s += '<div class="step">② 比实际少了：' + L + ' − ' + 2 * H + ' = <b>' + (L - 2 * H) + '</b>（只脚）</div>';
    if (stage >= 2) s += '<div class="step">③ 每只兔比鸡多 2 只脚，兔有：' + (L - 2 * H) + ' ÷ 2 = <b class="hl">' + RB + '</b>（只）</div>';
    if (stage >= 2) s += '<div class="step">④ 鸡有：' + H + ' − ' + RB + ' = <b class="hl">' + CK + '</b>（只）</div>';
    if (stage >= 2) s += '<div class="step ok">✔ 检验：' + CK + '×2 + ' + RB + '×4 = ' + L + '（只脚）正确！</div>';
    $('#cr-steps').innerHTML = s;
  }

  function reroll() {
    clearInterval(timer);
    RB = R(2, 6); CK = R(3, 9); H = RB + CK; L = 2 * CK + 4 * RB;
    rabbitShown = 0;
    info(0);
  }

  $('#cr-a').onclick = function () { clearInterval(timer); rabbitShown = 0; info(1); };
  $('#cr-b').onclick = function () {
    clearInterval(timer);
    rabbitShown = 0; info(1);
    timer = setInterval(function () {
      if (!box.isConnected) { clearInterval(timer); return; }
      rabbitShown++;
      if (rabbitShown >= RB) { clearInterval(timer); rabbitShown = RB; info(2); }
      else info(1);
    }, 560);
  };
  $('#cr-new').onclick = reroll;
  reroll();
  return function () { clearInterval(timer); };
}
