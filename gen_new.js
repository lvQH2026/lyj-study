// ============================================================
// 新题库生成器（按人教版教材 + 真实试卷样式 + 必配图）
// 替换 index.html 中原有的 g_xxx 生成器函数段
// ============================================================

// ---- 工具 ----
function ri(mi,ma){return Math.floor(Math.random()*(ma-mi+1))+mi}
function pick(a){return a[ri(0,a.length-1)]}
function fmt(n){if(typeof n==='string')return n;n=Number(n);if(isNaN(n))return String(n);return Number.isInteger(n)?n.toString():n.toFixed(2).replace(/\.?0+$/,'')}

// ---- SVG 工具 ----
function svgR(x,y,w,h,f,sw){sw=sw||2;return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f||'#BBDEFB'}" stroke="#333" stroke-width="${sw}"/>`}
function svgC(cx,cy,r,f){return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f||'#FFB74D'}" stroke="#333" stroke-width="2"/>`}
function svgL(x1,y1,x2,y2,s,w){w=w||2;return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s||'#333'}" stroke-width="${w}" stroke-linecap="round"/>`}
function svgTri(x1,y1,x2,y2,x3,y3,f){return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${f||'#81C784'}" stroke="#333" stroke-width="2"/>`}
function svgTxt(x,y,txt,sz,c){sz=sz||12;c=c||'#333';return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${sz}" fill="${c}">${txt}</text>`}
function svgClock(h,m){
  let ha=(h%12)*30+m*0.5, ma=m*6, s='';
  s+=`<circle cx="60" cy="60" r="50" fill="#fff" stroke="#333" stroke-width="2"/>`;
  for(let i=1;i<=12;i++){let a=i*30*Math.PI/180; s+=`<text x="${60+38*Math.sin(a)}" y="${60-38*Math.cos(a)+4}" text-anchor="middle" font-size="10">${i}</text>`}
  s+=`<line x1="60" y1="60" x2="${60+25*Math.sin(ha*Math.PI/180)}" y2="${60-25*Math.cos(ha*Math.PI/180)}" stroke="#333" stroke-width="3" stroke-linecap="round"/>`;
  s+=`<line x1="60" y1="60" x2="${60+40*Math.sin(ma*Math.PI/180)}" y2="${60-40*Math.cos(ma*Math.PI/180)}" stroke="#E57373" stroke-width="2" stroke-linecap="round"/>`;
  s+=`<circle cx="60" cy="60" r="3" fill="#333"/>`;
  return s;
}
function svgAngle(deg){
  let r=35, rad=Math.PI*(180-deg)/180, ex=60+r*Math.cos(rad), ey=60-r*Math.sin(rad);
  let s=svgL(60,60,60+r,60)+svgL(60,60,ex,ey);
  for(let i=0;i<=15;i++){let a=Math.PI*(180-(deg*i/15))/180; s+=`<line x1="${60+10*Math.cos(a)}" y1="${60-10*Math.sin(a)}" x2="${60+10*Math.cos(a+Math.PI*deg/15/180)}" y2="${60-10*Math.sin(a+Math.PI*deg/15/180)}" stroke="#E57373" stroke-width="1"/>`}
  s+=svgTxt(43,50,deg+'°',11,'#E57373'); return s;
}
function svgRuler(){let s='';for(let i=0;i<=10;i++){let h=(i%5==0)?10:5;s+=`<line x1="${5+i*11}" y1="35" x2="${5+i*11}" y2="${35-h}" stroke="#333" stroke-width="1"/>`;if(i%2==0)s+=svgTxt(5+i*11,48,i,8)} return svgR(2,30,115,30,'#fff',1)+s;}

// ---- 选择题/填空题工厂 ----
function mc(q,a,d){
  let o=[fmt(a),...d.map(d=>fmt(d))].filter((v,i,A)=>A.indexOf(v)===i).slice(0,4);
  while(o.length<4){let n=parseFloat(a); if(!isNaN(n)){let x=n+ri(-8,8); if(x>=0&&o.indexOf(fmt(x))<0)o.push(fmt(x))}else o.push('选项'+String.fromCharCode(65+o.length))}
  o.sort(()=>Math.random()-0.5);
  return {type:'choice',question:q,options:o,answer:fmt(a)};
}
function mf(q,a){return {type:'fill',question:q,answer:fmt(a)}}
function msc(q,svg,a,d){
  let o=[fmt(a),...d.map(d=>fmt(d))].filter((v,i,A)=>A.indexOf(v)===i).slice(0,4);
  o.sort(()=>Math.random()-0.5);
  return {type:'shape_choice',question:q,svg:svg,options:o,answer:fmt(a)};
}

// ===== 1年级上册 =====
function g1_5_addsub(){let a=ri(1,4),b=ri(1,5-a); if(Math.random()<0.4) return mf(`${a}+${b}=?`,a+b); return mc(`${a}+${b}=?`,a+b,[a+b-1,a+b+1,a+b+2])}
function g6_10_addsub(){let a=ri(3,7),b=ri(1,10-a); if(Math.random()<0.3) return mf(`${a}+${b}=?`,a+b); return mc(`${a}+${b}=?`,a+b,[a+b-1,a+b+1,a+b+1])}
function g11_20_count(){let n=ri(10,19); return mc(`${n}是由几个十和几个一组成的？`,`1个十和${n-10}个一`,[`2个十`,`${n-10}个十`,`1个十和${n-9}个一`])}
function g20_carry_add(){let a=ri(7,9),b=ri(a>8?2:3,9); return mc(`${a}+${b}=?`,a+b,[a+b-1,a+b+1,a+b+2])}

function g1_shape(){
  let items=[
    {n:'球体',s:svgC(60,45,35,'#FFB74D')},
    {n:'正方体',s:svgR(25,25,50,50,'#64B5F6')},
    {n:'长方体',s:svgR(20,25,60,40,'#E57373')},
    {n:'圆柱',s:svgR(28,16,44,52,'#81C784')+`<ellipse cx="50" cy="16" rx="22" ry="7" fill="#A5D6A7" stroke="#333" stroke-width="2"/>`},
  ];
  let it=pick(items), wr=items.filter(x=>x.n!==it.n).slice(0,3).map(x=>x.n);
  return msc('这是什么图形？',it.s,it.n,wr);
}

function g1_clock(){
  let h=ri(1,12), m=pick([0,15,30,45]);
  let lbl=m===0?`${h}点整`:m===15?`${h}点一刻`:m===30?`${h}点半`:`${h}点三刻`;
  let d=[`${(h%12+1)+1>12?1:h%12+1}点整`,`${h}点${m===0?'半':'整'}`];
  if(h>1)d.push(`${h-1}点整`);else d.push('12点整');
  return msc('钟面显示的是几点？',svgClock(h,m),lbl,d);
}

function g_app_shopping(){let item=pick(['苹果','橘子','糖果']),p=ri(2,8),n=ri(1,4);return mc(`${item}每个${p}元，买${n}个要多少钱？`,p*n,[p*n-p,p*n+p,p*n+n])}
function g_shape_compose(){return msc('下图中有几个小正方体？',svgR(10,10,80,80,'none',1)+svgR(10,10,35,35,'#64B5F6')+svgR(48,10,35,35,'#90CAF9')+svgR(10,48,35,35,'#90CAF9')+svgR(48,48,35,35,'#64B5F6'),'4个',['2个','3个','5个'])}

// ===== 1年级下册 =====
function g20_subtraction(){let a=ri(11,18),b=ri(2,9);if(a-b<0)[a,b]=[b,a];return mc(`${a}-${b}=?`,a-b,[a-b+2,a-b-1,a-b+3])}
function g100_count(){let n=ri(20,99);return mf(`在计数器上拨出${n}，这个数是由几个十和几个一组成的？`, `${Math.floor(n/10)}个十和${n%10}个一`)}
function g100_addsub_nocarry(){let a=ri(20,80),b=ri(10,99-a);return mc(`${a}+${b}=？`,a+b,[a+b-5,a+b+5,a+b+10])}
function g100_addsub_carry(){let a=ri(15,40),b=ri(10,80-a);if((a%10)+(b%10)<10){b+=10-((a%10)+(b%10))%10+ri(1,3)}return mc(`竖式计算：${a}+${b}=？`,a+b,[a+b-3,a+b+2])}

function g_money(){
  let items=[{q:'1元等于多少角？',a:'10角',d:['5角','20角','1角']},
    {q:'50角等于多少元？',a:'5元',d:['10元','3元','1元']},
    {q:'一支铅笔8角，买2支要多少钱？',a:'16角',d:['10角','12角','20角']},
    {q:'1角等于多少分？',a:'10分',d:['5分','1分','20分']},
    {q:'小明有1元5角，他有多少角？',a:'15角',d:['10角','25角','5角']}];
  let it=pick(items); return mc(it.q,it.a,it.d);
}

function g1_shape2(){
  let items=[
    {n:'三角形',s:svgTri(60,10,15,80,105,80,'#FFB74D')},
    {n:'正方形',s:svgR(15,15,70,70,'#64B5F6')},
    {n:'长方形',s:svgR(8,22,88,46,'#E57373')},
    {n:'圆形',s:svgC(60,45,35,'#81C784')},
  ];
  let it=pick(items), wr=items.filter(x=>x.n!==it.n).slice(0,3).map(x=>x.n);
  return msc('这是什么图形？',it.s,it.n,wr);
}

function g_app_time(){
  let items=[
    {s:svgClock(7,0),q:'小红早上几点起床？',a:'7点整',d:['6点整','8点整']},
    {s:svgClock(12,0),q:'中午几点吃饭？',a:'12点整',d:['11点整','1点整']},
    {s:svgClock(8,15),q:'第一节课8:15开始，钟面显示是几点？',a:'8点一刻',d:['8点整','8点半']},
    {s:svgClock(4,30),q:'放学时4:30，钟面显示？',a:'4点半',d:['4点整','5点整']},
  ];
  let it=pick(items); return msc(it.q,it.s,it.a,it.d);
}

// ===== 2年级上册 =====
function g2_length(){
  let items=[
    {q:'一支铅笔大约长多少？',a:'15厘米',d:['5厘米','50厘米','150厘米']},
    {q:'教室的黑板大约长多少？',a:'3米',d:['30厘米','30米','300厘米']},
    {q:'1米等于多少厘米？',a:'100厘米',d:['10厘米','1000厘米','50厘米']},
    {q:'小朋友的身高大约是？',a:'130厘米',d:['13厘米','13米','130米']},
    {q:'课桌的高度大约是？',a:'70厘米',d:['7厘米','7米','700厘米']},
    {q:'操场跑道一圈约？',a:'200米',d:['200厘米','20米','2000米']},
    {q:'橡皮长大约？',a:'3厘米',d:['3米','30厘米','3毫米']},
    {q:'一个图钉大约长？',a:'1厘米',d:['1米','10厘米','1毫米']},
    {q:'一层楼大约高？',a:'3米',d:['3厘米','30厘米','30米']},
    {q: svgRuler()+'<br>图中尺子上的物体长度是多少？',a:'4厘米',d:['3厘米','5厘米','6厘米']},
  ];
  let it=pick(items); return mc(it.q,it.a,it.d);
}

function g100_add(){let a=ri(20,70),b=ri(10,99-a);return mc(`竖式计算：${a}+${b}=？`,a+b,[a+b-2,a+b+2,a+b-1])}
function g100_sub(){let a=ri(40,99),b=ri(10,a);return mc(`竖式计算：${a}-${b}=？`,a-b,[a-b+2,a-b-1,a-b+3])}
function g_mul_1(){let a=ri(2,5),b=ri(1,9); if(a*b>36)return g_mul_1(); return mc(`${a}×${b}=？`,a*b,[a*b-1,a*b+1,a*b+a])}
function g_mul_2(){let a=ri(6,9),b=ri(1,9); if(a*b<20)return g_mul_2(); return mc(`${a}×${b}=？`,a*b,[a*b-2,a*b+2])}

function g2_time(){
  let items=[
    {s:svgClock(3,15),a:'3时15分',d:['3时30分','4时15分'],q:'钟面上显示的时间是？'},
    {s:svgClock(6,45),a:'6时45分',d:['6时15分','7时45分'],q:'钟面上显示的时间是？'},
    {s:svgClock(9,10),a:'9时10分',d:['9时50分','10时10分'],q:'钟面上显示的时间是？'},
    {s:svgClock(11,50),a:'11时50分',d:['11时10分','12时50分'],q:'钟面上显示的时间是？'},
    {s:svgClock(4,25),a:'4时25分',d:['4时5分','5时25分'],q:'钟面上显示的时间是？'},
  ];
  let it=pick(items); return msc(it.q,it.s,it.a,it.d);
}

function g_shape_identify(){
  let items=[
    {n:'三角形',s:svgTri(60,10,15,80,105,80,'#FFB74D')},
    {n:'正方形',s:svgR(15,15,70,70,'#64B5F6')},
    {n:'长方形',s:svgR(8,22,88,46,'#E57373')},
    {n:'圆形',s:svgC(60,45,35,'#81C784')},
    {n:'平行四边形',s:`<polygon points="30,60 80,60 95,20 45,20" fill="#CE93D8" stroke="#333" stroke-width="2"/>`},
  ];
  let it=pick(items), wr=items.filter(x=>x.n!==it.n).slice(0,3).map(x=>x.n);
  return msc('这是什么图形？有几个角？',it.s,it.n,wr);
}

function g_app_age(){let a=ri(6,12),d=ri(20,40);return mc(`小明今年${a}岁，爸爸比他大${d}岁，爸爸多少岁？`,a+d,[a+d-3,a+d+2,a+d-5])}

// ===== 2年级下册 =====
function g_div_1(){let a=ri(2,6)*ri(2,6); let b=ri(2,6); while(a%b!==0){a=ri(2,6)*ri(2,6);b=ri(2,6)} return mc(`${a}÷${b}=？`,a/b,[a/b-1,a/b+1,b])}
function g_div_2(){let a=ri(4,9)*ri(4,9); let b=ri(4,9); while(a%b!==0){a=ri(4,9)*ri(4,9);b=ri(4,9)} return mc(`${a}÷${b}=？`,a/b,[a/b-2,a/b+2])}
function g_remainder(){let a=ri(11,50),b=ri(3,9); if(a%b===0)a+=1;return mc(`${a}÷${b}=？（商和余数）`,`${Math.floor(a/b)}余${a%b}`,[`${Math.floor(a/b)-1}余${a%b+1}`,`${Math.floor(a/b)+1}`,`${Math.floor(a/b)}余${a%b-1}`])}
function g2_mixed(){let a=ri(2,6),b=ri(2,6),c=ri(5,20);return mc(`${a}×${b}+${c}=？`,a*b+c,[a*b+c-1,a*b+c+1,a*(b+c)])}

function g2_weight(){
  let items=[
    {q:'1千克等于多少克？',a:'1000克',d:['100克','10克','500克']},
    {q:'一个苹果大约多重？',a:'200克',d:['2克','2千克','20克']},
    {q:'一袋大米大约是？',a:'10千克',d:['100克','1千克','100千克']},
    {q:'一只鸡大约多重？',a:'2千克',d:['20克','200克','20千克']},
    {q:'2千克等于多少克？',a:'2000克',d:['200克','20克','500克']},
    {q:'一瓶矿泉水约重？',a:'500克',d:['5克','5千克','50克']},
    {q:'一头牛大约重？',a:'500千克',d:['50千克','5000千克','5千克']},
    {q:`${ri(2,5)}千克+${ri(1,3)}千克=？`,a:`${ri(2,5)+ri(1,3)}千克`,d:[]},
  ];
  let it=pick(items); if(!it.d.length){let n=parseInt(it.a);it.d=[String(n-1)+'千克',String(n+1)+'千克']} return mc(it.q,it.a,it.d);
}

function g2_shape(){
  let items=[
    {n:'平移后的图形大小不变',q:'平移后，图形的什么不变？',a:'大小和形状',d:['位置','颜色','大小和形状都变']},
    {n:'对称轴',q:'下面哪个是轴对称图形？',a:'长方形',d:['平行四边形','一般三角形','一般的梯形']},
  ];
  let it=pick(items); return mc(it.q,it.a,it.d);
}

function g_app_capacity(){let a=ri(2,8),b=ri(1,5);return mc(`${a}千克+${b}千克=？`,`${a+b}千克`,[`${a+b-1}千克`,`${a*b}千克`,`${a+b+1}千克`])}
function g_shape_count(){return mc('一个正方形被分成4个小正方形，一共有多少个正方形？','5个',['4个','3个','6个'])}

// ===== 3年级上册 =====
function g3_time(){
  let items=[
    {s:svgClock(2,10),q:'现在是几点几分？',a:'2时10分',d:['2时50分','3时10分']},
    {s:svgClock(5,25),q:'现在是几点几分？',a:'5时25分',d:['5时5分','6时25分']},
    {s:svgClock(9,40),q:'现在是几点几分？',a:'9时40分',d:['9时20分','10时40分']},
    {q:'1小时等于多少分钟？',a:'60分钟',d:['30分钟','100分钟','90分钟']},
    {q:'1分钟等于多少秒？',a:'60秒',d:['30秒','100秒','90秒']},
    {q:'小明9:00-9:30做作业，用了多久？',a:'30分钟',d:['20分钟','1小时','40分钟']},
  ];
  let it=pick(items); return it.s?msc(it.q,it.s,it.a,it.d):mc(it.q,it.a,it.d);
}

function g3_add(){let a=ri(1000,5000),b=ri(1000,5000);return mc(`${a}+${b}=？`,a+b,[a+b-50,a+b+50])}
function g3_sub(){let a=ri(3000,9000),b=ri(1000,a);return mc(`${a}-${b}=？`,a-b,[a-b+20,a-b-30])}
function g3_mul(){let a=ri(100,500),b=ri(3,8);return mc(`${a}×${b}=？`,a*b,[a*b-20,a*b+15])}
function g3_fraction(){
  let items=[
    {q:'1/4表示把一个整体平均分成几份？',a:'4份',d:['1份','2份','3份']},
    {q:'1/2和1/4哪个大？',a:'1/2',d:['1/4','一样大','无法比较']},
    {q:'3/8的分子是？',a:'3',d:['8','5','11']},
  ];
  let it=pick(items); return mc(it.q,it.a,it.d);
}
function g3_rect(){
  let w=ri(3,10),h=ri(2,8);
  return msc(`下面长方形的周长是多少？(长${w}cm 宽${h}cm)`,
    svgR(5,10,w*15,Math.max(h*10,20),'#BBDEFB')+svgTxt(5+w*15/2,8,w+'cm',9)+svgTxt(2,25,h+'cm',9),
    String(2*(w+h)),[String(w+h),String(w*h),String(2*(w+h)-1)]);
}
function g3_direction(){return mc('指南针红色箭头指向什么方向？','南',['东','西','北'])}
function g3_div(){let a=ri(200,800),b=ri(2,9);if(a%b!==0)a+=b-a%b;return mc(`${a}÷${b}=？`,a/b,[a/b-1,a/b+1])}
function g3_mul2(){let a=ri(15,50),b=ri(15,30);return mc(`${a}×${b}=？`,a*b,[a*b-5,a*b+5])}
function g3_area(){
  let w=ri(3,10),h=ri(2,8);
  return msc(`下面长方形的面积是多少？(长${w}cm 宽${h}cm)`,
    svgR(5,10,w*15,h*10,'#BBDEFB')+svgTxt(5+w*15/2,8,w+'cm',9)+svgTxt(2,15+h*5,w+'cm',9),
    String(w*h),[String(w+h),String(2*(w+h)),String(w*h-1)]);
}
function g3_decimal(){return mc('0.5等于几分之几？','5/10',['1/2','5/100','1/5'])}
function g3_date(){
  let items=[
    {q:'一年有多少个月？',a:'12个月',d:['10个月','24个月','6个月']},
    {q:'哪个月有28天？',a:'2月',d:['1月','3月','12月']},
    {q:'7月有多少天？',a:'31天',d:['30天','28天','29天']},
  ];
  let it=pick(items); return mc(it.q,it.a,it.d);
}
function g_app_area(){
  let w=ri(10,50),h=ri(5,30);
  return mc(`一块长方形菜地长${w}米宽${h}米，面积是多少平方米？`,w*h,[w+h,(w+h)*2,w*h-1]);
}
function g_shape_angle_calc(){
  let items=[
    {s:svgAngle(45),q:'这个角是什么角？',a:'锐角',d:['直角','钝角','平角']},
    {s:svgAngle(90),q:'这个角是什么角？',a:'直角',d:['锐角','钝角','平角']},
    {s:svgAngle(135),q:'这个角是什么角？',a:'钝角',d:['锐角','直角','平角']},
  ];
  let it=pick(items); return msc(it.q,it.s,it.a,it.d);
}

// ===== 4年级上册 =====
function g4_bignum(){return mc('100个一万是？','一百万',['十万','一千万','一亿'])}
function g4_angle(){
  let items=[
    {s:svgAngle(45),q:'这个角是多少度？',a:'45°',d:['30°','60°','90°']},
    {s:svgAngle(120),q:'这个角是多少度？',a:'120°',d:['90°','150°','60°']},
    {s:svgAngle(150),q:'这个角是多少度？',a:'150°',d:['120°','180°','90°']},
    {s:svgAngle(30),q:'这个角是多少度？',a:'30°',d:['45°','60°','15°']},
  ];
  let it=pick(items); return msc(it.q,it.s,it.a,it.d);
}
function g4_mul(){let a=ri(100,500),b=ri(20,50);return mf(`${a}×${b}=？`,a*b)}
function g4_div(){let a=ri(200,600),b=ri(10,30);if(a%b!==0)a+=b-a%b;return mc(`${a}÷${b}=？`,a/b,[a/b-1,a/b+1])}
function g4_parallel(){return mc('平行四边形有几组对边平行？','2组',['1组','3组','0组'])}
function g4_bar(){return mc('条形统计图用于？','比较数量的多少',['表示变化趋势','表示比例','表示时间'])}
function g_app_speed(){let v=ri(40,80),t=ri(2,5);return mc(`汽车每小时行${v}千米，${t}小时行多少千米？`,v*t,[v*t-v,v*t+v,v*t*2])}
function g4_mixed(){let a=ri(3,8),b=ri(4,8),c=ri(10,50);return mc(`${a}×${b}+${c}=？`,a*b+c,[a*(b+c),a*b+c-1])}
function g4_law(){return mc('a+b=b+a 是什么运算定律？','加法交换律',['加法结合律','乘法交换律','乘法分配律'])}
function g4_decimal(){return mc('0.01等于几分之几？','1/100',['1/10','1/1000','1/1'])}
function g4_decimal_calc(){let a=ri(1,9)+ri(1,9)/10,b=ri(1,5)+ri(1,9)/10;return mc(`${fmt(a)}+${fmt(b)}=？`,fmt(+(a+b).toFixed(2)),[fmt(+(a+b-0.1).toFixed(2)),fmt(+(a+b+0.1).toFixed(2))])}
function g4_triangle(){return mc('三角形的内角和是多少度？','180°',['90°','360°','270°'])}
function g4_shape2(){return mc('平移后图形的什么不变？','大小和形状',['位置','方向','颜色'])}
function g_app工程(){return mc('一项工程甲队独做10天完成，每天完成工程的几分之几？','1/10',['1/5','10','1/100'])}
function g_shape_symmetry(){return mc('等腰三角形有几条对称轴？','1条',['2条','3条','0条'])}

// ===== 5年级 =====
function g5_mul(){let a=ri(1,5)+ri(1,9)/10,b=ri(2,5);return mf(`${fmt(a)}×${b}=？`,fmt(+(a*b).toFixed(2)))}
function g5_div(){let a=ri(5,20),b=ri(2,5);return mc(`${fmt(a)}÷${b}=？`,fmt(+(a/b).toFixed(2)),[fmt(+(a/b+0.5).toFixed(1)),fmt(+(a/b-0.3).toFixed(1))])}
function g5_equation(){let a=ri(10,30),b=ri(3,9);return mf(`解方程：3x+${b}=${a}, x=？`,(a-b)/3)}
function g5_area(){let b=ri(5,12),h=ri(4,8);return mc(`三角形底${b}cm高${h}cm，面积是多少？`,fmt(b*h/2),[fmt(b*h),fmt(b*h/3)])}
function g5_prob(){return mc('袋子里有3个红球1个蓝球，摸到红球的可能性？','较大',['较小','一样大','无法判断'])}
function g5_tree(){let l=ri(50,120),g=ri(4,8);return mc(`一条路长${l}米，每隔${g}米种一棵（两端都种），共几棵？`,l/g+1,[l/g,l/g-1,l/g+2])}
function g5_observe(){return mc('从正面看正方体看到的是？','正方形',['长方形','三角形','圆形'])}
function g5_factor(){return mc('12的因数有几个？','6个',['4个','5个','8个'])}
function g5_fraction(){return mc('3/9约分后等于？','1/3',['3/9','2/3','1/9'])}
function g5_fraction_calc(){let a=ri(1,4);return mc(`1/${a}+1/${a}=？`,`2/${a}`,[`1/${a}`,`2/${a*2}`])}
function g5_shape3(){return mc('一个图形旋转90度后什么不变？','大小和形状',['位置','方向','大小不变但位置变'])}
function g5_line(){return mc('折线统计图适合表示？','变化趋势',['比例','绝对数值'])}
function g_app_fraction(){let n=ri(3,6),k=ri(2,4);return mc(`总数的1/${k}是${n}，总数是多少？`,n*k,[n/k,n+k,n*(k+1)])}
function g5_factor2(){return mc('既是2的倍数又是3的倍数的是？','6',['5','7','9'])}
function g_shape_3d(){return mc('正方体有几个面？','6个',['4个','8个','12个'])}

// ===== 6年级 =====
function g6_mul(){let a=ri(1,4),b=ri(2,5);return mf(`${a}/${b}×${ri(2,5)}=？`,fmt(+(a/b*ri(2,5)).toFixed(1)))}
function g6_div(){let n=ri(6,15);return mc(`${n}÷(1/3)=？`,n*3,[n/3,n*2,n+3])}
function g6_ratio(){return mc('6:8化简后是？','3:4',['2:3','4:5','6:8'])}
function g6_circle(){return mc('圆的周长公式是？','C=2πr',['C=πr²','C=πd/2'])}
function g6_percent(){return mc('50%等于几分之几？','1/2',['1/5','1/10','1/50'])}
function g6_pie(){return mc('扇形统计图适合表示？','各部分占整体的百分比',['变化趋势','绝对数值','时间序列'])}
function g6_negative(){return mc('比0小5的数是？','-5',['5','0','-4'])}
function g6_percent2(){let p=ri(10,40);return mc(`${p}% = 几分之几？(约分)`,`${p/10}/${100/10}`,[]);}
function g6_cylinder(){return mc('圆柱有几个底面？','2个',['1个','3个','0个'])}
function g6_proportion(){return mc('若a:b=c:d，则ad=?','bc',['ac','bd','ab'])}
function g6_stats(){return mc('平均数反映数据的？','集中趋势',['离散程度','最大值','最小值'])}
function g6_review(){
  let items=[{q:'48和36的最大公因数是？',a:'12',d:['6','8','18']},{q:'100以内最大的质数是？',a:'97',d:['99','91','95']}];
  let it=pick(items); return mc(it.q,it.a,it.d);
}
function g_app_ratio(){let x=ri(3,12);return mc(`3:4=x:${x*4/3}, x=？`,x,[x-1,x+2,x*2])}
function g_app_chicken_rabbit(){
  let heads=ri(8,15),rabbitFeet=ri(1,heads-1)*4,chickFeet=(heads-ri(1,heads-1))*2;
  return mc(`鸡兔同笼，共${heads}个头${rabbitFeet+chickFeet}只脚，兔有几只？`,rabbitFeet/4,[3,heads-3,4]);
}
function g_app_planting(){let l=ri(30,100),g=ri(3,8);return mc(`一条路长${l}米，每隔${g}米种一棵树，共几棵？`,l/g+1,[l/g,l/g-1])}
function g_shape_expand(){return mc('正方体的展开图由几个正方形组成？','6个',['4个','8个','12个'])}
function g_shape_view(){return mc('从上面看正方体看到的是？','正方形',['长方形','三角形','圆形'])}

// ===== 巧数三角形专项（保留原逻辑，已经很好） =====
// g_triangle_count 保持原样（在 index.html 中已定义）
