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
function dgDrag(svg, node, onMove){
  node.style.cursor='grab';
  node.style.touchAction='none';
  node.addEventListener('pointerdown', function(e){
    e.preventDefault();
    try{node.setPointerCapture(e.pointerId);}catch(_){}
    node.style.cursor='grabbing';
    const mv = function(ev){ onMove(dgPoint(svg,ev)); };
    const up = function(){ node.removeEventListener('pointermove',mv); node.removeEventListener('pointerup',up); node.style.cursor='grab'; };
    node.addEventListener('pointermove',mv);
    node.addEventListener('pointerup',up);
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
  const ticks = span<=24?span: (span<=60?Math.round(span/5):Math.round(span/10));
  for(let i=0;i<=ticks;i++){
    const v=min+span*i/ticks, x=x0+(x1-x0)*i/ticks;
    dg('line',{x1:x,y1:y-5,x2:x,y2:y+5,stroke:DC.ink,'stroke-width':1.5},svg);
    if(span<=24 || i%2===0) dgt(svg,x,y+22,String(v),10,DC.light);
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
  const blocks=[];
  function drawBlocks(cx, cy, kind, n){
    for(let i=blocks.length-1;i>=0;i--) if(blocks[i].parentNode) blocks[i].parentNode.removeChild(blocks[i]);
    blocks.length=0;
    if(kind===0){ // 百: 10x10 方格
      for(let i=0;i<n;i++){ const r=dg('rect',{x:cx-30+i*4,y:cy-30,width:60,height:60,fill:DC.blue,opacity:0.85-i*0.05},svg); blocks.push(r);} 
    } else if(kind===1){ // 十: 长条
      for(let i=0;i<n;i++){ const r=dg('rect',{x:cx-30,y:cy-25+i*9,width:60,height:8,fill:DC.green,opacity:0.9},svg); blocks.push(r);} 
    } else { // 个: 小方块
      for(let i=0;i<n;i++){ const r=dg('rect',{x:cx-24+(i%5)*12,y:cy-20+Math.floor(i/5)*12,width:10,height:10,fill:DC.gold},svg); blocks.push(r);} 
    }
  }
  const numT = dgt(svg,180,212,'',22,DC.ink);
  function upd(){
    const num=vals[0]*100+vals[1]*10+vals[2];
    numT.textContent='组成的数：'+num;
    drawBlocks(60,120,0,vals[0]); drawBlocks(180,120,1,vals[1]); drawBlocks(300,120,2,vals[2]);
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
  function upd(h,m){ h=Math.max(0,Math.min(11,h)); m=Math.max(0,Math.min(59,m)); const ha=Math.PI*(h%12)/6+Math.PI*m/360, ma=Math.PI*m/30; hour.setAttribute('x2',cx+50*Math.sin(ha)); hour.setAttribute('y2',cy-50*Math.cos(ha)); min.setAttribute('x2',cx+75*Math.sin(ma)); min.setAttribute('y2',cy-75*Math.cos(ma)); info.textContent='时间：'+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
  dgDrag(svg,hour,function(p){ const a=Math.atan2(p.x-cx,p.y-cy); let h=Math.round((12-a*12/Math.PI))%12; upd(h, +info.textContent.slice(3,5)||0); });
  dgDrag(svg,min,function(p){ const a=Math.atan2(p.x-cx,p.y-cy); let m=Math.round(60-a*60/Math.PI)%60; if(m<0)m+=60; const h=+info.textContent.slice(0,2)||0; upd(h,m); });
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
  // 十字展开图
  const sq=(x,y,c)=>dg('rect',{x:x*46-23,y:y*46-23,width:44,height:44,fill:c,stroke:'#fff','stroke-width':2},g);
  const cols=['#4E8C6E','#B4945A','#6B7894','#E57373','#C08A3E','#3E4A63'];
  const cells=[[0,-1],[ -1,0],[0,0],[1,0],[0,1],[0,0]];
  const layout=[[0,-1,DC.green],[-1,0,DC.gold],[0,0,DC.blue],[1,0,DC.red],[0,1,DC.amber]];
  layout.forEach((c,i)=>sq(c[0],c[1],c[2]));
  const info=dgt(svg,180,232,'',14,DC.ink);
  let ang=0;
  dgDrag(svg,g,function(p){ ang=Math.atan2(p.y-130,p.x-180); g.setAttribute('transform','translate(180,130) rotate('+(ang*180/Math.PI)+')'); info.textContent='旋转中：'+Math.round(ang*180/Math.PI)+'°'; });
  info.textContent='正方体有 11 种展开图，这是十字型';
}

// ============================================================
// 单元 → 交互动图 映射
// 依据单元名称关键词 + 类型，给每个单元返回 1~3 个交互动图
// ============================================================
function getUnitDiagrams(unit){
  const name = unit.name || '';
  const type = unit.type || '';
  const L = name.toLowerCase();
  const add = (arr, fn, title, opts) => arr.push({ fn, title, opts });
  let out = [];

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
