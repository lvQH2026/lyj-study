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
  const handle = dg('circle', {cx:x+(val-min)/(max-min)*w, cy:y, r:9, fill:color||DC.gold, stroke:'#fff', 'stroke-width':2});
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

// ---------- 1. 数轴 ----------
function diagNumberLine(container, opts){
  opts = opts||{};
  const min = opts.min!=null?opts.min:0, max = opts.max!=null?opts.max:20;
  const svg = dgMake(container, 360, 200);
  dgBg(svg,360,200);
  const x0=30, x1=330, y=120;
  dg('line',{x1:x0,y1:y,x2:x1,y2:y,stroke:DC.ink,'stroke-width':2},svg);
  const span=max-min;
  // 刻度数量：小范围逐格，大范围取 10 个整间隔（避免万以内轴画出上千刻度）
  const tickCount = span<=24 ? span : (span<=60 ? 12 : 10);
  for(let i=0;i<=tickCount;i++){
    const v=min+span*i/tickCount, x=x0+(x1-x0)*i/tickCount;
    dg('line',{x1:x,y1:y-5,x2:x,y2:y+5,stroke:DC.ink,'stroke-width':1.5},svg);
    const showLabel = tickCount<=12 ? true : (i%2===0);
    if(showLabel) dgt(svg,x,y+22,String(v),10,DC.light);
  }
  const info = dgt(svg,180,40,'拖动小球改变数值',12,DC.gold);
  const valT = dgt(svg,180,62,'',18,DC.ink);
  const marker = dg('circle',{cx:x1,cy:y,r:9,fill:DC.red,stroke:'#fff','stroke-width':2},svg);
  const flag = dg('line',{x1:x1,y1:y-9,x2:x1,y2:y-22,stroke:DC.red,'stroke-width':1.5},svg);
  dgDrag(svg, marker, function(p){
    let v=min+Math.round((p.x-x0)/(x1-x0)*span);
    v=Math.max(min,Math.min(max,v));
    const x=x0+(x1-x0)*(v-min)/span;
    marker.setAttribute('cx',x); flag.setAttribute('x1',x); flag.setAttribute('x2',x);
    valT.textContent='数值：'+v;
  });
  valT.textContent='数值：'+max;
  marker.setAttribute('cx',x1);
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
  const svg = dgMake(container, 360, 260);
  dgBg(svg,360,260);
  dgt(svg,180,26,'拖动右下角方块，改变行×列',11,DC.gold);
  const gx=40, gy=50, cell=26;
  let rows=4, cols=5;
  const gridG=dg('g',{},svg);
  const handle=dg('rect',{width:18,height:18,rx:4,fill:DC.gold,stroke:'#fff','stroke-width':2},svg);
  const info=dgt(svg,180,238,'',18,DC.ink);
  function redraw(){
    gridG.innerHTML='';
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const f=(r+c)%2===0?DC.green:DC.blue;
      dg('rect',{x:gx+c*cell,y:gy+r*cell,width:cell-2,height:cell-2,rx:3,fill:f,opacity:0.85},gridG);
    }
    dg('rect',{x:gx,y:gy,width:cols*cell,height:rows*cell,fill:'none',stroke:DC.ink,'stroke-width':1.5},gridG);
    handle.setAttribute('x', gx+cols*cell-9);
    handle.setAttribute('y', gy+rows*cell-9);
    info.textContent=rows+' × '+cols+' = '+(rows*cols);
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
  const svg = dgMake(container, 360, 240);
  dgBg(svg,360,240);
  dgt(svg,180,26,'拖动滑块改变每份个数',11,DC.gold);
  const g=dg('g',{},svg);
  const info=dgt(svg,180,222,'',15,DC.ink);
  dgSlider(svg,40,200,280,1,9,3,DC.green,function(v){
    const per=Math.round(v);
    g.innerHTML='';
    const groups=Math.floor(N/per), rem=N%per;
    let idx=0;
    for(let grp=0; grp<groups; grp++){
      for(let k=0;k<per;k++){
        const x=20+(idx%12)*28, y=60+Math.floor(idx/12)*28;
        dg('circle',{cx:x,cy:y,r:10,fill:DC.green,opacity:0.85},g);
        idx++;
      }
    }
    for(let k=0;k<rem;k++){
      const x=20+(idx%12)*28, y=60+Math.floor(idx/12)*28;
      dg('circle',{cx:x,cy:y,r:10,fill:DC.red,opacity:0.85},g); idx++;
    }
    info.textContent=N+' ÷ '+per+' = '+groups+(rem?' 余 '+rem:'');
  });
}

// ---------- 7. 分数条 ----------
function diagFractionBar(container, opts){
  opts=opts||{};
  const den = opts.den||4;
  const svg = dgMake(container, 360, 200);
  dgBg(svg,360,200);
  dgt(svg,180,26,'拖动金块，看阴影占几分之几',11,DC.gold);
  const bx=30, by=70, bw=300, bh=46;
  const g=dg('g',{},svg);
  const info=dgt(svg,180,160,'',18,DC.ink);
  dgSlider(svg,30,150,bw-20,0,den,2,DC.gold,function(v){
    const num=Math.round(v);
    g.innerHTML='';
    dg('rect',{x:bx,y:by,width:bw,height:bh,rx:6,fill:'#fff',stroke:DC.ink,'stroke-width':1.5},g);
    const cw=bw/den;
    for(let i=0;i<den;i++){
      dg('rect',{x:bx+i*cw,y:by,width:cw-1,height:bh,fill:(i<num?DC.gold:'#EDE7D9')},g);
      if(i>0) dg('line',{x1:bx+i*cw,y1:by,x2:bx+i*cw,y2:by+bh,stroke:DC.ink,'stroke-width':1},g);
    }
    info.textContent=num+' / '+den;
  });
}

// ---------- 8. 分数圆 ----------
function diagFractionCircle(container, opts){
  opts=opts||{};
  const den = opts.den||4;
  const svg = dgMake(container, 360, 240);
  dgBg(svg,360,240);
  dgt(svg,180,26,'拖动金块，给圆涂色',11,DC.gold);
  const cx=180, cy=120, r=70;
  const g=dg('g',{},svg);
  const info=dgt(svg,180,222,'',18,DC.ink);
  dgSlider(svg,40,205,280,0,den,1,DC.gold,function(v){
    const num=Math.round(v);
    g.innerHTML='';
    dg('circle',{cx,cy,r,fill:'#EDE7D9',stroke:DC.ink,'stroke-width':1.5},g);
    for(let i=0;i<num;i++){
      const a0=2*Math.PI*i/den, a1=2*Math.PI*(i+1)/den;
      const p=dg('path',{d:`M ${cx} ${cy} L ${cx+r*Math.cos(a0)} ${cy+r*Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(a1)} ${cy+r*Math.sin(a1)} Z`,fill:DC.gold},g);
    }
    for(let i=0;i<den;i++){
      const a=2*Math.PI*i/den;
      dg('line',{x1:cx,y1:cy,x2:cx+r*Math.cos(a),y2:cy+r*Math.sin(a),stroke:DC.ink,'stroke-width':1},g);
    }
    info.textContent=num+' / '+den;
  });
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
  const svg = dgMake(container, 360, 200);
  dgBg(svg,360,200);
  dgt(svg,180,26,'拖动滑块填色，看百分比',11,DC.gold);
  const bx=30,by=60,bw=300,bh=50;
  const g=dg('g',{},svg);
  const info=dgt(svg,180,160,'',18,DC.ink);
  dgSlider(svg,30,150,bw-20,0,100,40,DC.amber,function(v){
    const p=Math.round(v);
    g.innerHTML='';
    dg('rect',{x:bx,y:by,width:bw,height:bh,rx:6,fill:'#EDE7D9',stroke:DC.ink,'stroke-width':1.5},g);
    dg('rect',{x:bx,y:by,width:bw*p/100,height:bh,rx:6,fill:DC.amber},g);
    info.textContent=p+'%';
  });
}

// ---------- 11. 比 ----------
function diagRatio(container){
  const svg = dgMake(container, 360, 220);
  dgBg(svg,360,220);
  dgt(svg,180,26,'拖动两个色条，看最简比',11,DC.gold);
  const g=dg('g',{},svg);
  const info=dgt(svg,180,200,'',16,DC.ink);
  function gcd(a,b){return b?gcd(b,a%b):a;}
  function draw(A,B){
    g.innerHTML='';
    const total=A+B;
    dg('rect',{x:30,y:50,width:300*A/total,height:18,rx:4,fill:DC.green},g);
    dg('rect',{x:30+300*A/total,y:50,width:300*B/total,height:18,rx:4,fill:DC.blue},g);
    const k=gcd(A,B);
    info.textContent=A+' : '+B+'  =  '+(A/k)+' : '+(B/k);
  }
  let A=3, B=4;
  dgSlider(svg,30,80,300,1,12,3,DC.green,v=>{A=Math.round(v);draw(A,B);});
  dgSlider(svg,30,140,300,1,12,4,DC.blue,v=>{B=Math.round(v);draw(A,B);});
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
  const svg = dgMake(container, 360, 240);
  dgBg(svg,360,240);
  dgt(svg,180,26,'拖动滑块改变边数',11,DC.gold);
  const cx=180, cy=130, r=80;
  const g=dg('g',{},svg);
  const info=dgt(svg,180,220,'',16,DC.ink);
  const names={3:'三边形',4:'四边形',5:'五边形',6:'六边形',7:'七边形',8:'八边形'};
  dgSlider(svg,40,200,280,3,8,5,DC.blue,function(v){
    const n=Math.round(v); g.innerHTML='';
    let pts=[];
    for(let i=0;i<n;i++){const a=2*Math.PI*i/n-Math.PI/2; pts.push((cx+r*Math.cos(a))+','+(cy+r*Math.sin(a)));}
    dg('polygon',{points:pts.join(' '),fill:'rgba(107,120,148,0.15)',stroke:DC.blue,'stroke-width':2.5},g);
    const interior=Math.round((n-2)*180/n);
    info.textContent=n+' 边形（'+names[n]+'） 内角和 '+(n-2)*180+'° 每个内角约 '+interior+'°';
  });
}

// ---------- 16. 图形识别(点击) ----------
function diagShapeGallery(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  dgt(svg,180,24,'点击图形，认识它的名字',11,DC.gold);
  const shapes=[
    {name:'正方形',draw:()=>dg('rect',{x:0,y:0,width:50,height:50,fill:DC.gold,opacity:0.85})},
    {name:'长方形',draw:()=>dg('rect',{x:0,y:0,width:64,height:40,fill:DC.green,opacity:0.85})},
    {name:'三角形',draw:()=>{const p=dg('polygon',{points:'32,0 64,56 0,56',fill:DC.blue,opacity:0.85});return p;}},
    {name:'圆',draw:()=>dg('circle',{cx:28,cy:28,r:28,fill:DC.red,opacity:0.85})},
    {name:'平行四边形',draw:()=>dg('polygon',{points:'12,56 50,56 64,12 26,12',fill:DC.amber,opacity:0.85})},
  ];
  const info=dgt(svg,180,232,'',15,DC.ink);
  shapes.forEach((s,i)=>{
    const ox=30+(i%3)*110, oy=50+Math.floor(i/3)*95;
    const wrap=dg('g',{transform:`translate(${ox},${oy})`,style:'cursor:pointer'},svg);
    const node=s.draw(); wrap.appendChild(node);
    wrap.addEventListener('click',()=>{ svg.querySelectorAll('.sg').forEach(n=>n.setAttribute('stroke','none')); node.setAttribute('stroke','#3E4A63'); node.setAttribute('stroke-width','3'); info.textContent='这是：'+s.name; });
    wrap.classList.add('sg');
  });
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
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  const cx=150, cy=130;
  dgt(svg,180,24,'拖动圆，改变半径',11,DC.gold);
  const c=dg('circle',{cx,cy,r:60,fill:'rgba(229,115,115,0.15)',stroke:DC.red,'stroke-width':2.5},svg);
  const rline=dg('line',{x1:cx,y1:cy,x2:cx+60,y2:cy,stroke:DC.red,'stroke-width':3,'stroke-linecap':'round'},svg);
  dg('circle',{cx,cy,r:4,fill:DC.ink},svg);
  const info=dgt(svg,300,90,'',13,DC.ink,'start');
  const handle=dg('circle',{cx:cx+60,cy:cy,r:8,fill:DC.gold,stroke:'#fff','stroke-width':2},svg);
  dgDrag(svg,handle,function(p){ let r=Math.hypot(p.x-cx,p.y-cy); r=Math.max(20,Math.min(120,r)); c.setAttribute('r',r); rline.setAttribute('x2',cx+r); handle.setAttribute('cx',cx+r); const d=(2*r).toFixed(0), area=Math.round(Math.PI*r*r); info.textContent='r='+Math.round(r)+'\nd='+d+'\n面积≈'+area; });
  info.textContent='r=60\nd=120\n面积≈11310';
}

// ---------- 19. 矩形周长面积(拖尺寸) ----------
function diagAreaRect(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  dgt(svg,180,24,'拖动矩形角，看周长和面积',11,DC.gold);
  const gx=60, gy=55;
  const rect=dg('rect',{x:gx,y:gy,width:120,height:80,fill:'rgba(78,140,110,0.18)',stroke:DC.green,'stroke-width':2.5},svg);
  const info=dgt(svg,180,228,'',15,DC.ink);
  const handle=dg('rect',{x:gx+120-8,y:gy+80-8,width:16,height:16,rx:4,fill:DC.gold,stroke:'#fff','stroke-width':2},svg);
  dgDrag(svg,handle,function(p){ let w=Math.max(40,Math.min(260,p.x-gx)), h=Math.max(40,Math.min(160,p.y-gy)); rect.setAttribute('width',w); rect.setAttribute('height',h); handle.setAttribute('x',gx+w-8); handle.setAttribute('y',gy+h-8); info.textContent='长 '+Math.round(w)+'  宽 '+Math.round(h)+'  →  面积 '+(w*h)+'  周长 '+Math.round(2*(w+h)); });
  info.textContent='长 120  宽 80  →  面积 9600  周长 400';
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
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  dgt(svg,180,24,'拖动柱顶，调整数据',11,DC.gold);
  const data=[5,8,3,6,9]; const labels=['一','二','三','四','五'];
  const gx=40, gy=200, bw=44, gap=18, maxH=140;
  const g=dg('g',{},svg);
  const info=dgt(svg,180,232,'',13,DC.ink);
  const handles=[];
  function draw(){
    g.innerHTML='';
    let s='';
    data.forEach((v,i)=>{ const x=gx+i*(bw+gap), h=v/10*maxH; dg('rect',{x,y:gy-h,width:bw,height:h,rx:4,fill:DC.blue,opacity:0.85},g); dgt(svg,x+bw/2,gy+16,labels[i],11,DC.light); s+=labels[i]+'='+v+' '; });
    info.textContent=s;
  }
  data.forEach((v,i)=>{ const x=gx+i*(bw+gap); const h=v/10*maxH; const hd=dg('rect',{x:x-4,y:gy-h-8,width:bw+8,height:16,rx:6,fill:DC.gold,opacity:0.9},svg); handles.push(hd);
    dgDrag(svg,hd,function(p){ let nv=Math.round((gy-p.y)/maxH*10); nv=Math.max(0,Math.min(10,nv)); data[i]=nv; draw(); }); });
  draw();
}

// ---------- 24. 饼图 ----------
function diagPieChart(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  dgt(svg,180,24,'拖动扇区边界，调比例',11,DC.gold);
  const cx=150, cy=125, r=80;
  const g=dg('g',{},svg);
  const info=dgt(svg,300,90,'',13,DC.ink,'start');
  let a1=0.4, a2=0.7; // 比例(0~1)
  const h1=dg('circle',{cx:cx+r*Math.cos(2*Math.PI*a1),cy:r*Math.sin(2*Math.PI*a1),r:7,fill:DC.gold,stroke:'#fff','stroke-width':2},svg);
  const h2=dg('circle',{cx:cx+r*Math.cos(2*Math.PI*a2),cy:r*Math.sin(2*Math.PI*a2),r:7,fill:DC.amber,stroke:'#fff','stroke-width':2},svg);
  function path(frac){ const a0=0, a1v=2*Math.PI*frac; return `M ${cx} ${cy} L ${cx+r} ${cy} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(a1v)} ${cy+r*Math.sin(a1v)} Z`; }
  function draw(){ g.innerHTML=''; dg('path',{d:path(a1),fill:DC.green},g); dg('path',{d:`M ${cx} ${cy} L ${cx+r*Math.cos(2*Math.PI*a1)} ${cy+r*Math.sin(2*Math.PI*a1)} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(2*Math.PI*a2)} ${cy+r*Math.sin(2*Math.PI*a2)} Z`,fill:DC.blue},g); dg('path',{d:`M ${cx} ${cy} L ${cx+r*Math.cos(2*Math.PI*a2)} ${cy+r*Math.sin(2*Math.PI*a2)} A ${r} ${r} 0 0 1 ${cx+r} ${cy} Z`,fill:DC.amber},g); info.textContent='A '+Math.round(a1*100)+'%  B '+Math.round((a2-a1)*100)+'%  C '+Math.round((1-a2)*100)+'%'; }
  dgDrag(svg,h1,function(p){ let a=Math.atan2(p.y-cy,p.x-cx)/(2*Math.PI); if(a<0)a+=1; a1=Math.max(0.05,Math.min(a2-0.05,a)); h1.setAttribute('cx',cx+r*Math.cos(2*Math.PI*a1)); h1.setAttribute('cy',cy+r*Math.sin(2*Math.PI*a1)); draw(); });
  dgDrag(svg,h2,function(p){ let a=Math.atan2(p.y-cy,p.x-cx)/(2*Math.PI); if(a<0)a+=1; a2=Math.max(a1+0.05,Math.min(0.95,a)); h2.setAttribute('cx',cx+r*Math.cos(2*Math.PI*a2)); h2.setAttribute('cy',cy+r*Math.sin(2*Math.PI*a2)); draw(); });
  draw();
}

// ---------- 25. 速度时间 ----------
function diagSpeed(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  dgt(svg,180,24,'拖动滑块，看路程=速度×时间',11,DC.gold);
  const pad=40, gx=50, gy=200, gw=260, gh=150;
  dg('rect',{x:gx,y:gy-gh,width:gw,height:gh,fill:'#fff',stroke:DC.line,'stroke-width':1},svg);
  dgt(svg,gx-10,gy+18,'0',10,DC.light); dgt(svg,gx+gw+6,gy-gh,'路程',10,DC.light,'start'); dgt(svg,gx+gw+6,gy,'时间',10,DC.light,'start');
  const g=dg('g',{},svg);
  const info=dgt(svg,180,40,'',14,DC.ink);
  function draw(v,t){ g.innerHTML=''; const x=gx+gw*t/10, y=gy-gh*v/10; dg('line',{x1:gx,y1:gy,x2:x,y2:y,stroke:DC.red,'stroke-width':2.5},g); dg('circle',{cx:x,cy:y,r:5,fill:DC.red},g); info.textContent='速度 '+v+' × 时间 '+t+' = 路程 '+v*t; }
  let curV=4, curT=5;
  dgSlider(svg,50,225,130,1,10,4,DC.red,v=>draw(v, curT));
  dgSlider(svg,200,225,130,1,10,5,DC.blue,v=>{curT=v;draw(curV,v);});
  draw(4,5);
}

// ---------- 26. 植树问题 ----------
function diagPlant(container, opts){
  opts=opts||{};
  const svg = dgMake(container, 360, 220);
  dgBg(svg,360,220);
  dgt(svg,180,24,'拖动滑块，看两端都栽的规律',11,DC.gold);
  const g=dg('g',{},svg);
  const info=dgt(svg,180,202,'',15,DC.ink);
  dgSlider(svg,40,180,280,1,12,4,DC.green,function(v){
    const n=Math.round(v); g.innerHTML='';
    const roadX0=30, roadX1=330, y=90;
    dg('line',{x1:roadX0,y1:y,x2:roadX1,y2:y,stroke:DC.line,'stroke-width':4},g);
    for(let i=0;i<=n;i++){ const x=roadX0+(roadX1-roadX0)*i/n; dg('circle',{cx:x,cy:y,r:8,fill:DC.green},g); }
    info.textContent='间隔 '+n+' 段 → 两端都栽 树 '+(n+1)+' 棵';
  });
}

// ---------- 27. 鸡兔同笼 ----------
function diagChickenRabbit(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  dgt(svg,180,24,'拖动滑块调鸡、兔数量',11,DC.gold);
  const g=dg('g',{},svg);
  const info=dgt(svg,180,232,'',14,DC.ink);
  function draw(c,r){ g.innerHTML=''; let x=20,y=60; for(let i=0;i<c;i++){ dg('text',{x,y,'font-size':22},g).textContent='🐔'; x+=26; if(x>320){x=20;y+=30;} } for(let i=0;i<r;i++){ dg('text',{x,y,'font-size':22},g).textContent='🐰'; x+=26; if(x>320){x=20;y+=30;} } info.textContent='鸡 '+c+' 只，兔 '+r+' 只 → 头 '+(c+r)+' 个，脚 '+(2*c+4*r)+' 只'; }
  let curC=3, curR=2;
  dgSlider(svg,30,210,150,0,10,3,DC.green,v=>draw(Math.round(v),curR));
  dgSlider(svg,200,210,150,0,10,2,DC.red,v=>{curR=Math.round(v);draw(curC,v);});
  draw(3,2);
}

// ---------- 28. 方程天平 ----------
function diagEquation(container, opts){
  opts=opts||{};
  const a = opts.a||3, b = opts.b||12;
  const svg = dgMake(container, 360, 240);
  dgBg(svg,360,240);
  dgt(svg,180,24,'拖动滑块找 x，使天平平衡',11,DC.gold);
  const beamY=90;
  const g=dg('g',{},svg);
  const info=dgt(svg,180,222,'',15,DC.ink);
  function draw(xv){
    g.innerHTML='';
    // 天平
    dg('line',{x1:60,y1:beamY,x2:300,y2:beamY,stroke:DC.ink,'stroke-width':3},g);
    dg('polygon',{points:'180,beamY 168,beamY+14 192,beamY+14',fill:DC.ink},g);
    dg('line',{x1:180,y1:beamY+14,x2:180,y2:beamY+70,stroke:DC.ink,'stroke-width':3},g);
    // 左盘: a 个 x
    dg('line',{x1:90,y1:beamY,x2:90,y2:beamY+30,stroke:DC.line,'stroke-width':2},g);
    dg('text',{x:90,y:beamY+50,'font-size':16,fill:DC.green,'text-anchor':'middle'},g).textContent=a+'x';
    // 右盘: b
    dg('line',{x1:270,y1:beamY,x2:270,y2:beamY+30,stroke:DC.line,'stroke-width':2},g);
    dg('text',{x:270,y:beamY+50,'font-size':16,fill:DC.red,'text-anchor':'middle'},g).textContent=''+b;
    const balanced = a*xv===b;
    info.textContent=a+'x = '+b+'  →  x = '+xv+(balanced?'  ✓ 平衡！':'');
    info.setAttribute('fill', balanced?DC.green:DC.ink);
  }
  dgSlider(svg,40,200,280,0,Math.ceil(b/a)+2,Math.round(b/a),DC.gold,v=>draw(Math.round(v)));
}

// ---------- 29. 3D 展开/旋转 ----------
function diag3DUnfold(container){
  const svg = dgMake(container, 360, 250);
  dgBg(svg,360,250);
  dgt(svg,180,24,'拖动旋转，认识正方体展开图',11,DC.gold);
  const g=dg('g',{transform:'translate(180,130)'},svg);
  // 十字展开图（共 6 个正方形，正方体标准展开图之一）
  const sq=(x,y,c)=>dg('rect',{x:x*46-23,y:y*46-23,width:44,height:44,fill:c,stroke:'#fff','stroke-width':2},g);
  const layout=[[0,-1,DC.green],[-1,0,DC.gold],[0,0,DC.blue],[1,0,DC.red],[0,1,DC.amber],[0,2,DC.ink]];
  layout.forEach((c)=>sq(c[0],c[1],c[2]));
  const info=dgt(svg,180,232,'',14,DC.ink);
  let ang=0;
  dgDrag(svg,g,function(p){ ang=Math.atan2(p.y-130,p.x-180); g.setAttribute('transform','translate(180,130) rotate('+(ang*180/Math.PI)+')'); info.textContent='旋转中：'+Math.round(ang*180/Math.PI)+'°'; });
  info.textContent='正方体有 11 种展开图，这是十字型（6 个面）';
}

// ============================================================
// 单元 → 交互动图 映射
// 依据单元名称关键词 + 类型，给每个单元返回 1~3 个交互动图
// ============================================================
function getUnitDiagrams(unit, grade, sem){
  const name = unit.name || '';
  const type = unit.type || '';
  const L = name.toLowerCase();
  const add = (arr, fn, title, opts, hint) => arr.push({ fn, title, opts: opts || {}, hint: hint || '' });
  let out = [];

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
  if (/观察物体|视图|展开|立体/.test(name)) add(out, diag3DUnfold, '正方体展开与旋转');
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
  if (/植树/.test(name)) add(out, diagPlant, '植树问题：间隔与棵数');
  if (/鸡兔/.test(name)) add(out, diagChickenRabbit, '鸡兔同笼：数头数脚');
  if (/面积应用|周长应用/.test(name)) add(out, diagAreaRect, '画图算面积/周长');
  if (/工程问题|价格应用|分数应用/.test(name)) add(out, diagBarChart, '用图表示数量关系');
  if (/方向|位置/.test(name)) add(out, diagNumberLine, '用数轴表示方向与位置', {min:-5, max:5});

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
    '  <button class="btn" id="cr-new">🎲 换一道题</button>' +
    '</div>' +
    '<div class="anim-tip">💡 <b>假设法</b>：先当作全是鸡，算出的脚会比实际少；每把一只兔当成鸡就少 2 只脚，所以 <b>兔的只数 =（实际脚数 − 头数×2）÷ 2</b>。</div>';

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
      g += '<circle cx="' + (x + 18) + '" cy="' + y + '" r="16" fill="' + (isRab ? '#fd79a8' : '#ffd93d') + '" stroke="#8a6d1f" stroke-width="1.5"/>';
      g += '<text x="' + (x + 18) + '" y="' + (y + 6) + '" text-anchor="middle" font-size="18">' + (isRab ? '🐰' : '🐔') + '</text>';
      const nLeg = isRab ? 4 : 2;
      for (let k = 0; k < nLeg; k++) {
        const lx = x + 18 + (k - (nLeg - 1) / 2) * 9;
        g += '<line class="' + (isRab && k >= 2 ? 'cr-newleg' : '') + '" x1="' + lx + '" y1="' + (y + 15) + '" x2="' + lx + '" y2="' + (y + 40) + '" stroke="' + (isRab ? '#c2185b' : '#c98f00') + '" stroke-width="3" stroke-linecap="round"/>';
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
