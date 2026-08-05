#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成吕泳冀学习站全体单元的新题库。
按人教版教材题型，带图的必须有 SVG，输出可直接替换 index.html 中的生成器代码。
"""
import json, random, math as m
random.seed(42)

OUT = []

def w(s):
    OUT.append(s)

# ========= 工具函数（同原版JS逻辑） =========
def ri(mi, ma):
    return random.randint(mi, ma)

def pick(arr):
    return random.choice(arr)

# ========= SVG 图形生成器 =========
def svg_rect(w_svg, h_svg, label="", fill="#4A90D9", x=0, y=0, text=""):
    """画一个矩形"""
    svg = f'<rect x="{x}" y="{y}" width="{w_svg}" height="{h_svg}" fill="{fill}" stroke="#333" stroke-width="2"/>'
    if label:
        svg += f'<text x="{x+w_svg/2}" y="{y+h_svg/2}" text-anchor="middle" dominant-baseline="central" font-size="14" fill="#fff">{label}</text>'
    if text:
        svg += f'<text x="{x+w_svg/2}" y="{y+h_svg+16}" text-anchor="middle" font-size="11" fill="#666">{text}</text>'
    return svg

def svg_circle(cx, cy, r, fill="#FFB74D"):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="#333" stroke-width="2"/>'

def svg_line(x1, y1, x2, y2, stroke="#333", sw=2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round"/>'

def svg_triangle(x1,y1,x2,y2,x3,y3,fill="#81C784"):
    return f'<polygon points="{x1},{y1} {x2},{y2} {x3},{y3}" fill="{fill}" stroke="#333" stroke-width="2"/>'

def svg_clock(h, minute):
    """钟表 SVG"""
    hour_angle = (h%12)*30 + minute*0.5
    min_angle = minute*6
    s = '<circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="2"/>'
    for i in range(1,13):
        a = i*30*m.pi/180
        s += f'<text x="{60+38*m.sin(a)}" y="{60-38*m.cos(a)+4}" text-anchor="middle" font-size="10">{i}</text>'
    s += svg_line(60,60, 60+25*m.sin(hour_angle*m.pi/180), 60-25*m.cos(hour_angle*m.pi/180), "#333", 3)
    s += svg_line(60,60, 60+40*m.sin(min_angle*m.pi/180), 60-40*m.cos(min_angle*m.pi/180), "#4A90D9", 2)
    s += '<circle cx="60" cy="60" r="3" fill="#333"/>'
    return s

def svg_ruler(length_mm=100):
    """画一把尺子（0-10cm）"""
    s = '<rect x="5" y="10" width="110" height="30" fill="#fff" stroke="#333" stroke-width="2"/>'
    for i in range(11):
        l = 8 if i%5==0 else 4
        s += f'<line x1="{5+i*10}" y1="40" x2="{5+i*10}" y2="{40-l}" stroke="#333" stroke-width="1"/>'
        if i%2==0 or i%5==0:
            s += f'<text x="{5+i*10}" y="52" text-anchor="middle" font-size="8">{i}</text>'
    return s

def svg_angle(deg):
    """画一个角"""
    r = 30
    x_end = 60 + r * m.cos(m.radians(180-deg))
    y_end = 60 - r * m.sin(m.radians(180-deg))
    s = svg_line(60,60, 60+r, 60, "#333", 2)  # 水平边
    s += svg_line(60,60, x_end, y_end, "#333", 2)  # 另一边
    # 弧度
    steps = 20
    for i in range(steps+1):
        a = m.radians(180-(deg*i/steps))
        x1 = 60 + 12 * m.cos(a)
        y1 = 60 - 12 * m.sin(a)
        x2 = 60 + 12 * m.cos(a + m.radians(deg/steps))
        y2 = 60 - 12 * m.sin(a + m.radians(deg/steps))
        s += svg_line(x1, y1, x2, y2, "#E57373", 1)
    s += f'<text x="{60-5}" y="{48}" font-size="11" fill="#E57373">{deg}°</text>'
    return s

def svg_rect_with_dims(w_cm, h_cm):
    """画矩形并标注长宽"""
    scale = 40
    s = f'<rect x="10" y="10" width="{w_cm*scale}" height="{h_cm*scale}" fill="#BBDEFB" stroke="#333" stroke-width="2"/>'
    s += f'<text x="{10+w_cm*scale/2}" y="{8}" text-anchor="middle" font-size="11">{w_cm}cm</text>'
    s += f'<text x="{2}" y="{10+h_cm*scale/2}" font-size="11" transform="rotate(-90,{2},{10+h_cm*scale/2})">{h_cm}cm</text>'
    return s

def svg_weight_scale(item_kg):
    """磅秤示意（简化）"""
    s = '<circle cx="60" cy="45" r="30" fill="#fff" stroke="#333" stroke-width="2"/>'
    s += svg_line(60, 15, 60, 5, "#333", 2)  # 指针
    s += f'<text x="60" y="80" text-anchor="middle" font-size="13">? kg</text>'
    return s

def svg_money(amount_yuan):
    """人民币示意"""
    s = f'<rect x="10" y="20" width="100" height="50" rx="5" fill="#FFF9C4" stroke="#FF8F00" stroke-width="2"/>'
    s += f'<text x="60" y="50" text-anchor="middle" font-size="20" font-weight="bold" fill="#E65100">¥{amount_yuan}</text>'
    return s

def svg_shapes_compose(shapes_desc):
    """拼组图形的简单示意"""
    s = '<rect x="10" y="10" width="100" height="80" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="4"/>'
    # 随机画几个小图形
    for i in range(ri(3,6)):
        cx = ri(20, 100)
        cy = ri(20, 80)
        r = ri(8, 20)
        color = pick(["#FFB74D","#64B5F6","#81C784","#E57373","#CE93D8"])
        typ = pick(["circle","rect","tri"])
        if typ == "circle":
            s += svg_circle(cx, cy, r, color)
        elif typ == "rect":
            s += f'<rect x="{cx-r}" y="{cy-r}" width="{2*r}" height="{2*r}" fill="{color}" stroke="#333" stroke-width="1"/>'
        else:
            s += f'<polygon points="{cx},{cy-r} {cx-r},{cy+r} {cx+r},{cy+r}" fill="{color}" stroke="#333" stroke-width="1"/>'
    return s

# ========= 选择题生成 =========
def mk_choice(q, ans, dist):
    opts = [str(ans)] + [str(d) for d in dist[:3]]
    # dedup
    seen = set()
    uniq = []
    for o in opts:
        if o not in seen:
            seen.add(o)
            uniq.append(o)
    opts = uniq[:4]
    # fill to 4
    n = float(ans) if str(ans).replace('.','').replace('-','').isdigit() else None
    attempts = 0
    while len(opts) < 4 and attempts < 20:
        attempts += 1
        if n is not None:
            d = ri(int(n)-8, int(n)+8)
            if str(d) not in seen and d >= 0:
                opts.append(str(d))
                seen.add(str(d))
        else:
            opts.append(f'选项{chr(65+len(opts))}')
    opts = opts[:4]
    random.shuffle(opts)
    return {'type':'choice','question':q,'options':opts,'answer':str(ans)}

def mk_fill(q, ans):
    return {'type':'fill','question':q,'answer':str(ans)}

def mk_svg_choice(q, svg, ans, dist):
    opts = [str(ans)] + [str(d) for d in dist[:3]]
    random.shuffle(opts)
    return {'type':'shape_choice','question':q,'svg':svg,'options':opts,'answer':str(ans)}

# =====================================================
# ========= 按人教版生成题库 =========
# =====================================================

UNIT_DATA = {}  # {grade: {'1':{'上册':[]}, '2':{'下册':[]}}}

def add_unit(grade, sem, name, questions):
    """grade:1-6, sem:1=上册/2=下册, questions:list of dicts"""
    g = str(grade)
    s = str(sem)
    if g not in UNIT_DATA: UNIT_DATA[g] = {}
    if s not in UNIT_DATA[g]: UNIT_DATA[g][s] = []
    UNIT_DATA[g][s].append({"name": name, "questions": questions})

PI = 3.14

# ===== 1年级上册 =====
add_unit(1,1,"1-5的认识和加减法", [
    *[mk_choice(f"{a} + {b} = ?", a+b, [a+b+1,a+b-1,a+b+2]) for a in range(1,4) for b in range(1,3) if a+b<=5],
    *[mk_fill(f"{a} - {b} = ?", a-b) for a in range(2,6) for b in range(1,a)],
    mk_choice("3 + 2 = ?", 5, [4,6,7]),
    mk_fill("比3大2的数是？", 5),
    mk_choice("1 + 4 = ?", 5, [3,6,7]),
    mk_fill("5 - 3 = ?", 2),
    *[mk_choice(f"{ri(1,3)} + {ri(1,2)} = ?", a+b, [a+b-1,a+b+1,a+b+2]) for a,b in [(ri(1,3),ri(1,2)) for _ in range(6)] if a+b<=5],
    mk_fill(f"5可以分成3和？", 2),
    mk_fill(f"4可以分成1和？", 3),
    mk_choice("小红有2个苹果，妈妈又给了3个，一共有几个？", 5, [3,4,6]),
])

add_unit(1,1,"6-10的认识和加减法", [
    *[mk_choice(f"{a} + {b} = ?", a+b, [a+b-1,a+b+1,a+b+2]) for a,b in [(3,3),(4,2),(5,1),(6,3),(7,2),(4,4)]],
    *[mk_fill(f"{a} - {b} = ?", a-b) for a,b in [(8,3),(9,4),(7,5),(10,6),(8,5),(9,6)]],
    mk_choice("比7多2的数是？", 9, [6,8,10]),
    mk_fill(f"10 - 4 = ?", 6),
    *[mk_choice(f"树上有{a}只鸟，飞走了{b}只，还剩几只？", a-b, [a-b+1,a-b-1,a-b+2]) for a,b in [(8,3),(9,4),(7,5)]],
])

add_unit(1,1,"11-20各数的认识", [
    *[mk_fill(f"10 + {n} = ?", 10+n) for n in range(1,9)],
    *[mk_choice(f"{10+n}是由几个十和几个一组成的？", f"1个十和{n}个一", [f"2个十",f"{n}个十",f"1个十和{n+1}个一"]) for n in range(1,7)],
    mk_fill("20是由几个十组成的？", "2个十"),
    mk_choice("比15小3的数是？", 12, [10,14,16]),
])

add_unit(1,1,"20以内的进位加法", [
    *[mk_choice(f"{a} + {b} = ?", a+b, [a+b-1,a+b+1,a+b+2]) for a,b in [(9,2),(9,3),(9,4),(9,5),(9,6),(8,3),(8,4),(8,5),(8,6),(8,7),(7,4),(7,5),(7,6),(6,5),(6,6)]],
    mk_choice("凑十法：9 + 4 = ？", 13, [12,14,15]),
    mk_fill(f"8 + 7 = ?", 15),
    mk_choice("小明有9本故事书，又买了5本，一共有几本？", 14, [12,13,15]),
])

add_unit(1,1,"认识图形", [
    mk_svg_choice("这是什么图形？", svg_circle(60,45,35,"#FFB74D"), "球体", ["正方体","圆柱","长方体"]),
    mk_svg_choice("这是什么图形？", f'<rect x="25" y="25" width="50" height="50" fill="#64B5F6" stroke="#333" stroke-width="2"/>', "正方体", ["球体","圆柱","长方体"]),
    mk_svg_choice("这是什么图形？", f'<rect x="20" y="20" width="65" height="40" fill="#E57373" stroke="#333" stroke-width="2" rx="3"/>', "长方体", ["球体","正方体","圆柱"]),
    mk_svg_choice("这是什么图形？", f'<rect x="28" y="15" width="44" height="55" fill="#81C784" stroke="#333" stroke-width="2" rx="8"/><ellipse cx="50" cy="15" rx="22" ry="7" fill="#A5D6A7" stroke="#333" stroke-width="2"/>', "圆柱", ["球体","正方体","长方体"]),
    mk_svg_choice("哪个是球体？", svg_circle(60,45,35,"#FFB74D"), "球体", ["正方体","圆柱","三角体"]),
    mk_svg_choice("哪个物体可以滚动？", svg_circle(60,45,30,"#FFB74D"), "球体", ["长方体","正方体","三角体"]),
    *[mk_svg_choice("这是什么图形？", s, name, [n for n in ["球体","正方体","圆柱","长方体"] if n!=name])
      for s,name in [
        (svg_circle(60,50,35,"#FFCC80"), "球体"),
        (f'<rect x="25" y="25" width="50" height="50" fill="#90CAF9" stroke="#333" stroke-width="2"/>', "正方体"),
        (f'<rect x="20" y="20" width="65" height="40" fill="#EF9A9A" stroke="#333" stroke-width="2" rx="2"/>', "长方体"),
        (f'<rect x="28" y="16" width="44" height="52" fill="#A5D6A7" stroke="#333" stroke-width="2" rx="6"/>', "圆柱"),
    ]],
])

add_unit(1,1,"认识钟表", [
    *[mk_svg_choice("钟表上显示的时间是？", svg_clock(h, mval), f"{h}点{'整' if mval==0 else '一刻' if mval==15 else '半' if mval==30 else '三刻'}", 
        [f"{(h+1) if h<12 else 1}点整",f"{h}点{'半' if mval==0 else '整'}",f"{(h-1) if h>1 else 12}点整"])
      for h in [2,5,7,9,10,12] for mval in [0,30]],
    *[mk_svg_choice("现在几点了？", svg_clock(h, 0), f"{h}点整",
        [f"{(h+1) if h<12 else 1}点整",f"{h}点半",f"{(h-1) if h>1 else 12}点整"])
      for h in [1,3,6,8,11]],
])

add_unit(1,1,"生活中的加减法", [
    mk_choice("小明有3颗糖，吃掉了1颗，还剩几颗？", 2, [1,3,4]),
    mk_choice("树上有5只鸟，飞来了2只，现在有几只？", 7, [5,6,8]),
    mk_choice("妈妈买了8个橘子，吃了3个，还剩几个？", 5, [4,9,6]),
    mk_fill("花丛里有4只蝴蝶，飞来2只，一共有几只？", 6),
    mk_choice("书架上有10本书，拿走了4本，还剩几本？", 6, [4,5,7]),
    mk_choice("池塘里有7条金鱼，又游来3条，现在有几条？", 10, [8,9,11]),
    mk_fill("小红做了5道题，小明做了6道题，两人一共做了几道？", 11),
])

add_unit(1,1,"图形拼组", [
    mk_svg_choice("下面的拼组图形中有几个正方形？", svg_shapes_compose("拼组图"), "2个", ["1个","3个","4个"]),
    mk_svg_choice("下面的拼组图形中有几个三角形？", svg_shapes_compose("拼组图"), "3个", ["1个","2个","4个"]),
    mk_svg_choice("下面的拼组图形中有几个圆形？", svg_shapes_compose("拼组图"), "1个", ["2个","3个","4个"]),
    mk_fill("用2个三角形可以拼成什么图形？", "正方形"),
    mk_svg_choice("几个小正方体可以拼成一个大的正方体？", f'<rect x="10" y="10" width="80" height="80" fill="none" stroke="#333" stroke-width="2"/><rect x="10" y="10" width="40" height="40" fill="#64B5F6" stroke="#333"/><rect x="50" y="10" width="40" height="40" fill="#90CAF9" stroke="#333"/><rect x="10" y="50" width="40" height="40" fill="#90CAF9" stroke="#333"/><rect x="50" y="50" width="40" height="40" fill="#64B5F6" stroke="#333"/>', "8个", ["2个","4个","6个"]),
])

# ===== 1年级下册 =====
add_unit(1,2,"20以内的退位减法", [
    *[mk_choice(f"{a} - {b} = ?", a-b, [a-b-1,a-b+1,a-b+2]) for a,b in [(12,5),(13,6),(14,7),(15,8),(16,9),(11,2),(11,3),(12,4)]],
    mk_choice("破十法：15 - 8 = ？", 7, [5,6,8]),
    mk_fill("13 - 5 = ?", 8),
    mk_choice("小丽有12支铅笔，用了7支，还剩几支？", 5, [4,6,7]),
])

add_unit(1,2,"100以内数的认识", [
    *[mk_fill(f"47 + 1 = ?", 48)],
    *[mk_choice(f"{n} + 10 = ?", n+10, [n+8,n+12,n+20]) for n in [23,35,48,56,62]],
    mk_fill("99 + 1 = ?", 100),
    mk_choice("78是由几个十和几个一组成的？", "7个十和8个一", ["8个十和7个一","7个十","8个一"]),
    mk_choice("一百是由几个十组成的？", "10个十", ["5个十","20个十","1个十"]),
])

add_unit(1,2,"100以内的加减法（不进位）", [
    *[mk_choice(f"{a} + {b} = ?", a+b, [a+b-1,a+b+1,a+b+5]) for a,b in [(23,15),(34,23),(45,12),(56,33),(67,21),(78,11)]],
    *[mk_fill(f"{a} - {b} = ?", a-b) for a,b in [(48,23),(56,34),(67,45),(89,56),(95,73)]],
])

add_unit(1,2,"100以内的加减法（进位）", [
    *[mk_choice(f"{a} + {b} = ?", a+b, [a+b-1,a+b+1]) for a,b in [(28,15),(37,26),(46,38),(55,47),(63,29),(74,18)]],
    *[mk_fill(f"{a} - {b} = ?", a-b) for a,b in [(42,27),(53,36),(64,48),(75,59),(86,68)]],
])

add_unit(1,2,"认识人民币", [
    mk_choice("1元 = ? 角", "10角", ["5角","20角","1角"]),
    mk_choice("50角 = ? 元", "5元", ["10元","3元","1元"]),
    mk_choice("1角 = ? 分", "10分", ["5分","20分","1分"]),
    mk_choice("一本练习本 8角，买2本要多少钱？", "16角", ["10角","12角","20角"]),
    mk_choice("一个棒棒糖 5角，买3个要多少钱？", "15角", ["10角","20角","8角"]),
    mk_fill("小明有1元，买了6角的笔，还剩多少角？", "4角"),
])

add_unit(1,2,"认识图形（二）", [
    mk_svg_choice("这是什么图形？", svg_triangle(60,10,20,75,100,75,"#FFB74D"), "三角形", ["正方形","长方形","圆形"]),
    mk_svg_choice("这是什么图形？", f'<rect x="15" y="15" width="70" height="70" fill="#64B5F6" stroke="#333" stroke-width="2"/>', "正方形", ["三角形","长方形","圆形"]),
    mk_svg_choice("这是什么图形？", f'<rect x="10" y="20" width="85" height="50" fill="#E57373" stroke="#333" stroke-width="2"/>', "长方形", ["正方形","三角形","圆形"]),
    mk_svg_choice("这是什么图形？", svg_circle(60,45,35,"#81C784"), "圆形", ["正方形","长方形","三角形"]),
    mk_svg_choice("下面哪个图形有3条边？", svg_triangle(60,10,20,75,100,75,"#FFB74D"), "三角形", ["正方形(4条边)","长方形(4条边)","圆形(0条边)"]),
    mk_fill("正方形有几条边？", "4条"),
])

add_unit(1,2,"购物应用", [
    mk_choice("苹果5元一个，买2个需要多少钱？", 10, [7,12,8]),
    mk_choice("铅笔2角一支，买5支需要多少角？", "10角", ["8角","12角","15角"]),
    mk_fill("糖1元一个，买3个要几元？", "3元"),
    mk_choice(f"小明带了10元，花了{spent}元，还剩几元？", 10-spent, [10-spent+1,spent,10-spent-1]) for spent in [3,6,8]],
])

add_unit(1,2,"时间应用", [
    mk_svg_choice("小红早上几点起床？", svg_clock(7,0), "7点整", ["6点整","8点整","9点整"]),
    mk_svg_choice("中午几点吃午饭？", svg_clock(12,0), "12点整", ["11点整","1点整","2点整"]),
    mk_svg_choice("下课时针指向4，分针指向12，是几点？", svg_clock(4,0), "4点整", ["3点整","5点整","4点半"]),
])

# ===== 2年级上册 =====
add_unit(2,1,"长度单位", [
    mk_choice("一支新铅笔大约长多少？", "15厘米", ["5厘米","50厘米","150厘米"]),
    mk_choice("教室的黑板大约长多少？", "3米", ["30厘米","30米","300厘米"]),
    mk_choice("1米 = 多少厘米？", "100厘米", ["10厘米","1000厘米","50厘米"]),
    mk_choice("课桌的高大约是多少？", "70厘米", ["7厘米","7米","700厘米"]),
    mk_choice("小明的身高大约是？", "130厘米", ["13厘米","13米","1300厘米"]),
    mk_fill("一个图钉长约1？", "1厘米"),
    mk_fill("操场跑道一圈约200？", "200米"),
    mk_choice("一块橡皮长约3？", "3厘米", ["3米","3毫米","30厘米"]),
    mk_choice("旗杆的高度大约是？", "10米", ["10厘米","100厘米","1米"]),
    *[mk_choice(f"{a}厘米 + {b}厘米 = ？", f"{a+b}厘米", [f"{a+b-10}厘米",f"{a+b+10}厘米"]) for a,b in [(30,45),(50,28),(15,62)]],
])

add_unit(2,1,"100以内的加法", [
    *[mk_choice(f"{a} + {b} = ?", a+b, [a+b-2,a+b+2,a+b-1]) for a,b in [(23,45),(34,56),(45,37),(56,28),(62,19),(38,47)]],
    *[mk_fill(f"列竖式计算：{a} + {b} = ?", a+b) for a,b in [(35,48),(57,36),(29,53),(46,38)]],
])

add_unit(2,1,"100以内的减法", [
    *[mk_choice(f"{a} - {b} = ?", a-b, [a-b+1,a-b-1,a-b+2]) for a,b in [(67,23),(56,34),(89,45),(78,56),(95,67)]],
    *[mk_fill(f"列竖式计算：{a} - {b} = ?", a-b) for a,b in [(73,48),(62,37),(81,56),(94,69)]],
])

add_unit(2,1,"表内乘法（一）", [
    *[mk_choice(f"{a} × {b} = ?", a*b, [a*b-1,a*b+1,a*b+a]) for a,b in [(2,3),(3,4),(4,5),(5,6),(2,7),(3,8)] if a*b<40],
    mk_fill("口诀：二三得？", "六"),
    mk_fill("口诀：四五？", "二十"),
    mk_choice("3+3+3+3 = ？× 4", 3, [4,6,12]),
])

add_unit(2,1,"表内乘法（二）", [
    *[mk_choice(f"{a} × {b} = ?", a*b, [a*b-2,a*b+2,a*b+a]) for a,b in [(6,7),(7,8),(8,9),(9,6),(7,9),(6,8)]],
    mk_fill("7 × 9 = ?", 63),
    mk_choice("口诀：八九？", "七十二", ["六十三","八十一","七十二"]),
])

add_unit(2,1,"认识时间", [
    *[mk_svg_choice("钟面上显示的是几点几分？", svg_clock(h, m), f"{h}时{m}分",
      [f"{h}时{(m+15)%60}分",f"{(h+1)%12 or 12}时{m}分",f"{h}时{(m-5)%60}分"])
      for h,m in [(3,15),(4,30),(6,45),(8,10),(10,50)]],
])

add_unit(2,1,"图形认识", [
    *[mk_svg_choice("这是什么图形？", s, name, [n for n in ["三角形","正方形","长方形","圆形","平行四边形","梯形"] if n!=name])
      for s,name in [
        (svg_triangle(60,10,15,80,105,80,"#FFB74D"),"三角形"),
        (f'<rect x="15" y="15" width="70" height="70" fill="#64B5F6" stroke="#333" stroke-width="2"/>',"正方形"),
        (f'<rect x="8" y="20" width="88" height="50" fill="#E57373" stroke="#333" stroke-width="2"/>',"长方形"),
        (svg_circle(60,45,35,"#81C784"),"圆形"),
    ]],
])

add_unit(2,1,"生活应用题", [
    mk_choice("小明今年8岁，爸爸比他大28岁，爸爸多少岁？", 36, [30,28,40]),
    mk_choice("一根绳子长80厘米，用去35厘米，还剩多少？", "45厘米", ["35厘米","55厘米","30厘米"]),
    mk_fill("小红有12朵花，送给朋友5朵，还剩几朵？", 7),
])

# ===== 2年级下册 =====
add_unit(2,2,"表内除法（一）", [
    *[mk_choice(f"{a} ÷ {b} = ?", a//b, [a//b-1,a//b+1,b]) for a,b in [(12,3),(24,4),(30,5),(36,6),(18,2),(20,4)]],
    mk_fill("把18个苹果平均分给6个小朋友，每人几个？", 3),
    mk_choice("24里面有几个4？", 6, [4,5,8]),
])

add_unit(2,2,"表内除法（二）", [
    *[mk_choice(f"{a} ÷ {b} = ?", a//b, [a//b-1,a//b+1]) for a,b in [(42,7),(56,8),(63,9),(48,6),(72,8),(81,9)]],
    mk_fill("72 ÷ 9 = ?", 8),
])

add_unit(2,2,"有余数的除法", [
    *[mk_choice(f"{a} ÷ {b} = ? (商和余数)", f"{a//b}余{a%b}", [f"{a//b-1}余{a%b+1}",f"{a//b+1}余0",f"{a//b}余{a%b+1}"]) for a,b in [(13,5),(17,4),(19,6),(22,8),(29,9)]],
])

add_unit(2,2,"混合运算", [
    *[mk_choice(f"{a} × {b} + {c} = ?", a*b+c, [a*b+c-1,a*b+c+1,a*(b+c)]) for a,b,c in [(3,4,5),(2,7,8),(5,3,6)]],
    *[mk_choice(f"{a} + {b} × {c} = ?", a+b*c, [a+b*c-1,a+b*c+2,(a+b)*c]) for a,b,c in [(10,3,5),(8,2,9),(15,4,3)]],
])

add_unit(2,2,"克和千克", [
    mk_choice("1千克 = ？克", "1000克", ["100克","10克","500克"]),
    mk_choice("一个苹果大约多重？", "200克", ["2克","2千克","20克"]),
    mk_choice("一袋大米大约是？", "10千克", ["10克","100克","1000千克"]),
    mk_choice("一只鸡大约多重？", "2千克", ["20克","200克","20千克"]),
    mk_choice("2千克 = ？克", "2000克", ["200克","20克","500克"]),
    *[mk_choice(f"{a}千克 + {b}千克 = ？", f"{a+b}千克", [f"{a+b-1}千克",f"{a*b}千克"]) for a,b in [(2,3),(5,4),(8,2)]],
])

add_unit(2,2,"图形的运动", [
    mk_svg_choice("下面的图形经过平移能得到哪个？",
        f'<rect x="30" y="30" width="50" height="30" fill="#64B5F6" stroke="#333" stroke-width="2"/><text x="55" y="50" text-anchor="middle" font-size="12">原图</text>',
        "同样的长方形", ["圆形","三角形","菱形"]),
    mk_svg_choice("下面哪个是轴对称图形？",
        f'<rect x="20" y="25" width="65" height="40" fill="#81C784" stroke="#333" stroke-width="2"/><line x1="52" y1="15" x2="52" y2="75" stroke="#ccc" stroke-dasharray="4"/>',
        "长方形", ["普通的平行四边形","一般三角形","梯形"]),
])

add_unit(2,2,"重量应用", [
    mk_choice("一瓶矿泉水大约多重？", "500克", ["5克","5千克","50克"]),
    mk_choice("一袋盐大约多重？", "500克", ["50克","5千克","5克"]),
    mk_fill("3千克 + 2千克 = ？千克", "5千克"),
])

add_unit(2,2,"图形计数", [
    mk_svg_choice("下图中有几个三角形？",
        ''.join([svg_triangle(60,5,15,70,105,70,"#FFE0B2") for _ in range(1)]),
        "1个", ["2个","3个","4个"]),
    mk_svg_choice("下图中有几个长方形？",
        f'<rect x="15" y="15" width="70" height="70" fill="#BBDEFB" stroke="#333" stroke-width="2"/>',
        "1个", ["2个","3个","4个"]),
    mk_fill("一个正方形被分成4个小正方形，一共有几个正方形？", "5个"),
])

# ===== 3年级上册 =====
add_unit(3,1,"时、分、秒", [
    *[mk_svg_choice("钟面上显示的时间是？", svg_clock(h,m), f"{h}时{m}分",
      [f"{h}时{(m+15)%60}分",f"{(h+1)%12 or 12}时{m}分"])
      for h,m in [(2,10),(5,25),(9,40)]],
    mk_choice("1小时 = ？分钟", "60分钟", ["30分钟","100分钟","90分钟"]),
    mk_choice("1分钟 = ？秒", "60秒", ["30秒","100秒","90秒"]),
    mk_choice("小明9:00开始做作业，9:30做完，用了多长时间？", "30分钟", ["20分钟","40分钟","1小时"]),
])

add_unit(3,1,"万以内的加法", [
    *[mk_choice(f"{a} + {b} = ?", a+b, [a+b-10,a+b+10]) for a,b in [(1234,2456),(3456,1234),(5678,2345),(4567,3456)]],
    *[mk_fill(f"列竖式计算：{a} + {b} = ?", a+b) for a,b in [(2345,4567),(5678,1234)]],
])

add_unit(3,1,"万以内的减法", [
    *[mk_choice(f"{a} - {b} = ?", a-b, [a-b+5,a-b-3]) for a,b in [(5678,2345),(4567,1234),(7890,3456),(6789,4567)]],
])

add_unit(3,1,"多位数乘一位数", [
    *[mk_choice(f"{a} × {b} = ?", a*b, [a*b-10,a*b+5]) for a,b in [(123,4),(234,5),(345,6),(456,7),(567,8)]],
])

add_unit(3,1,"分数的初步认识", [
    mk_choice("把一个饼平均分成4份，每份是它的几分之几？", "1/4", ["1/2","1/3","2/4"]),
    mk_choice("1/2和1/4哪个大？", "1/2", ["1/4","一样大","无法比较"]),
    mk_choice("2/5的分子是？", "2", ["5","3","1"]),
    mk_choice("3/8的分子是3，分母是？", "8", ["3","5","11"]),
    mk_fill("把一个圆平均分成2份，每份是它的？", "1/2"),
])

add_unit(3,1,"长方形和正方形", [
    mk_choice("正方形的四条边有什么关系？", "四条边都相等", ["对边相等","只有两条边相等","没有关系"]),
    mk_choice("长方形有几个直角？", "4个", ["2个","1个","3个"]),
    *[mk_choice(f"一个长方形的长是{w}厘米，宽是{h}厘米，周长是多少？", 2*(w+h), [w+h,w*h,2*(w+h)-1]) for w,h in [(5,3),(8,4),(10,6)]],
    *[mk_choice(f"边长{s}厘米的正方形，周长是多少？", 4*s, [s*s,2*s+s,4*s-1]) for s in [4,6,8]],
])

add_unit(3,1,"周长应用题", [
    mk_choice("一个长方形操场长50米、宽30米，周长是多少？", 160, [80,150,200]),
    mk_choice("用一根24厘米长的铁丝围正方形，边长是多少？", 6, [4,8,12]),
    mk_fill("长8cm、宽5cm的长方形，周长是多少？", 26),
])

add_unit(3,1,"时间计算", [
    mk_choice("小明7:30从家出发，8:00到学校，路上用了多少时间？", "30分钟", ["20分钟","40分钟","1小时"]),
])

# ===== 3年级下册 =====
add_unit(3,2,"位置与方向", [
    mk_choice("指南针红色箭头指向什么方向？", "南", ["东","西","北"]),
    mk_choice("面向北时，你的后方是什么方向？", "南", ["东","西","北"]),
])

add_unit(3,2,"除数是一位数的除法", [
    *[mk_choice(f"{a} ÷ {b} = ?", a//b, [a//b-1,a//b+1]) for a,b in [(248,4),(369,3),(480,6),(728,8)]],
])

add_unit(3,2,"两位数乘两位数", [
    *[mk_choice(f"{a} × {b} = ?", a*b, [a*b-5,a*b+5]) for a,b in [(23,14),(34,25),(45,36)]],
])

add_unit(3,2,"面积", [
    *[mk_choice(f"长{a}厘米、宽{b}厘米的长方形，面积是多少平方厘米？", a*b, [a+b,(a+b)*2,a*b-1]) for a,b in [(6,4),(8,5),(10,7)]],
    mk_choice("1平方米 = ？平方厘米", "10000平方厘米", ["100平方厘米","1000平方厘米","10平方厘米"]),
])

add_unit(3,2,"小数的初步认识", [
    mk_choice("0.5 = 几分之几？", "5/10", ["1/2","5/100","1/5"]),
    mk_choice("3.2读作什么？", "三点二", ["三十二","三点二","三零二"]),
])

add_unit(3,2,"年、月、日", [
    mk_choice("一年有几个月？", "12个月", ["10个月","24个月","6个月"]),
    mk_choice("闰年的二月有多少天？", "29天", ["28天","30天","31天"]),
    mk_choice("一年中哪个月是31天？", "7月", ["2月","6月","11月"]),
])

add_unit(3,2,"面积应用题", [
    mk_choice("一块长方形菜地长20米、宽15米，面积是多少？", 300, [35,200,150]),
])

add_unit(3,2,"图形识别", [
    mk_svg_choice("下列哪个是锐角？", svg_angle(45), "锐角", ["直角","钝角","平角"]),
    mk_svg_choice("下列哪个是钝角？", svg_angle(135), "钝角", ["锐角","直角","平角"]),
    mk_svg_choice("下列哪个是直角？", svg_angle(90), "直角", ["锐角","钝角","平角"]),
])

# ===== 4年级上册 =====
add_unit(4,1,"大数的认识", [
    mk_choice("100个一万是？", "一百万", ["十万","一千万","一亿"]),
    mk_choice("560000 读作？", "五十六万", ["五万六千","五百六十万","五十六"]),
    mk_fill("一百万写作？", "1000000"),
])

add_unit(4,1,"角的度量", [
    *[mk_svg_choice(f"这个角是多少度？", svg_angle(deg), f"{deg}°",
      [f"{(deg-15)}°",f"{(deg+15)}°",f"{90}°"]) for deg in [30,60,120,150]],
    mk_choice("直角等于多少度？", "90°", ["180°","45°","60°"]),
    mk_choice("平角等于多少度？", "180°", ["90°","360°","270°"]),
])

add_unit(4,1,"三位数乘两位数", [
    *[mk_fill(f"{a} × {b} = ?", a*b) for a,b in [(123,45),(234,56),(345,78)]],
])

add_unit(4,1,"除数是两位数的除法", [
    *[mk_choice(f"{a} ÷ {b} = ?", a//b, [a//b-1,a//b+1]) for a,b in [(240,12),(360,15),(480,24)]],
])

add_unit(4,1,"平行四边形和梯形", [
    mk_choice("平行四边形有几组对边平行？", "2组", ["1组","3组","0组"]),
    mk_choice("梯形有几组对边平行？", "1组", ["2组","3组","0组"]),
    mk_svg_choice("下面哪个是平行四边形？",
        f'<polygon points="30,60 80,60 95,20 45,20" fill="#BBDEFB" stroke="#333" stroke-width="2"/>',
        "平行四边形", ["长方形","梯形","三角形"]),
])

add_unit(4,1,"条形统计图", [
    mk_choice("条形统计图纵轴表示？", "数量", ["时间","班级","物品"]),
    mk_fill("统计表为了直观比较数据，通常制成什么图？", "条形统计图"),
])

add_unit(4,1,"行程应用题", [
    mk_choice("汽车每小时行驶60千米，3小时行驶了多少千米？", 180, [20,120,160]),
    mk_choice("路程 ÷ 速度 = ？", "时间", ["速度","距离","加速度"]),
])

add_unit(4,1,"角度计算", [
    mk_choice("一个三角形的三个内角和是多少度？", "180°", ["90°","360°","270°"]),
    mk_choice("一个周角等于多少度？", "360°", ["180°","90°","270°"]),
])

# ===== 4年级下册 =====
add_unit(4,2,"四则运算", [
    *[mk_choice(f"{a} + {b} × {c} = ?", a+b*c, [a*b+c,a+b+c,(a+b)*c]) for a,b,c in [(10,3,5),(8,4,6),(12,2,7)]],
])

add_unit(4,2,"运算定律", [
    mk_choice("a + b = b + a 是？", "加法交换律", ["加法结合律","乘法交换律","乘法分配律"]),
    mk_choice("(a+b)+c = a+(b+c) 是？", "加法结合律", ["加法交换律","乘法交换律","乘法分配律"]),
])

add_unit(4,2,"小数的意义和性质", [
    mk_choice("0.01 = 几分之几？", "1/100", ["1/10","1/1000","1/1"]),
    mk_choice("1.5 = 几分之几？", "15/10", ["15/100","15/1000","1/15"]),
])

add_unit(4,2,"小数的加法和减法", [
    *[mk_choice(f"{a} + {b} = ?", round(a+b,2), [round(a+b-0.1,2),round(a+b+0.1,2)]) for a,b in [(3.5,2.3),(4.6,1.8),(7.2,5.9)]],
])

add_unit(4,2,"三角形", [
    mk_choice("一个三角形的三个内角和是多少度？", "180°", ["90°","360°","270°"]),
    mk_choice("有两条边相等的三角形叫什么？", "等腰三角形", ["等边三角形","直角三角形","钝角三角形"]),
    mk_choice("三个角都小于90°的三角形叫什么？", "锐角三角形", ["直角三角形","钝角三角形","等边三角形"]),
])

add_unit(4,2,"图形的运动（二）", [
    mk_choice("平移不改变图形的什么？", "大小和形状", ["位置","颜色","方向"]),
])

add_unit(4,2,"工程应用题", [
    mk_choice("一项工程，甲队单独做10天完成，乙队单独做15天完成，两队合作每天完成工程的几分之几？", "1/6", ["1/25","1/10","1/15"]),
])

add_unit(4,2,"对称图形", [
    mk_choice("等腰三角形有几天对称轴？", "1条", ["2条","3条","0条"]),
])

# ===== 5年级 =====
add_unit(5,1,"小数乘法", [
    *[mk_fill(f"{a} × {b} = ?", round(a*b,2)) for a,b in [(3.5,2),(4.2,3),(1.8,4)]],
])

add_unit(5,1,"小数除法", [
    *[mk_choice(f"{a} ÷ {b} = ?", round(a/b,2), [round(a/b+0.5,1),round(a/b-0.3,1)]) for a,b in [(7.2,3),(8.4,4),(6.5,5)]],
])

add_unit(5,1,"简易方程", [
    *[mk_fill(f"解方程：x + {b} = {a}, x = ?", a-b) for a,b in [(15,7),(20,13),(30,18)]],
    *[mk_choice(f"3x = {a}, x = ?", a//3, [a//2,a//4,a*3]) for a in [12,15,18,24]],
])

add_unit(5,1,"多边形的面积", [
    *[mk_choice(f"一个平行四边形的底是{b}厘米、高是{h}厘米，面积是多少？", b*h, [b+h,2*(b+h),b*h//2]) for b,h in [(6,4),(8,5),(10,7)]],
    *[mk_choice(f"一个三角形的底是{b}厘米、高是{h}厘米，面积是多少？", round(b*h/2,1), [b*h,b*h//3,round(b*h*2,1)]) for b,h in [(6,4),(8,6),(10,5)]],
])

add_unit(5,1,"可能性", [
    mk_choice("从一个装有3个红球和1个蓝球的袋子里摸球，摸到红球的可能性？", "较大", ["较小","和蓝球一样大","无法判断"]),
])

add_unit(5,1,"植树问题", [
    *[mk_choice(f"一条路长{d}米，每隔{g}米种一棵树（两端都种），一共要种多少棵？", d//g+1, [d//g,d//g-1,d//g+2]) for d,g in [(100,5),(60,4),(80,8)]],
])

add_unit(5,1,"面积应用题（5年级）", [
    mk_choice("一块三角形地的底是20米、高是15米，面积是多少？", 150, [300,75,35]),
])

add_unit(5,1,"鸡兔同笼", [
    mk_choice("鸡兔同笼，共10个头、28只脚，鸡有几只？", 6, [4,5,7]),
    mk_choice("鸡兔同笼，共8个头、26只脚，兔有几只？", 5, [3,4,6]),
])

add_unit(5,2,"观察物体（三）", [
    mk_fill("从正面看一个正方体，看到的是什么图形？", "正方形"),
])

add_unit(5,2,"因数与倍数", [
    mk_choice("12的因数有几个？", "6个", ["4个","5个","8个"]),
    mk_choice("既是2的倍数又是3的倍数的数是？", "6", ["5","7","9"]),
])

add_unit(5,2,"分数的意义和性质", [
    mk_choice("3/9约分后等于？", "1/3", ["3/9","2/3","1/9"]),
    mk_choice("真分数都小于？", "1", ["2","0","无法确定"]),
])

add_unit(5,2,"分数的加法和减法", [
    *[mk_choice(f"1/{a} + 1/{a} = ?", f"2/{a}", [f"1/{a}",f"1/{a*2}",f"2/{a*a}"]) for a in [3,5,7]],
])

add_unit(5,2,"图形的运动（三）", [
    mk_choice("旋转90度后，图形什么不变？", "大小和形状", ["位置","方向","面积一定会变"]),
])

add_unit(5,2,"折线统计图", [
    mk_choice("折线统计图适合表示什么？", "数据的变化趋势", ["各部分比例","数据多少无法表示","只能表示数量"]),
])

add_unit(5,2,"分数应用题", [
    mk_choice("一袋糖的1/4是5颗，这袋糖共有多少颗？", 20, [5,10,25]),
])

add_unit(5,2,"立体图形", [
    mk_choice("正方体有几个面？", "6个", ["4个","8个","12个"]),
    mk_choice("长方体有几个顶点？", "8个", ["4个","6个","12个"]),
])

# ===== 6年级 =====
add_unit(6,1,"分数乘法", [
    *[mk_fill(f"{a}/5 × {b} = ?", f"{a*b}/5") for a,b in [(2,3),(3,4),(4,5)]],
])

add_unit(6,1,"分数除法", [
    *[mk_choice(f"{a} ÷ (1/3) = ?", a*3, [a//3,a*2,a+3]) for a in [6,9,12]],
])

add_unit(6,1,"比", [
    mk_choice("6:8化简后是？", "3:4", ["2:3","4:5","6:8"]),
    mk_fill("2:5的比值是？", "0.4"),
])

add_unit(6,1,"圆", [
    mk_choice("圆的周长公式是？", "C=2πr", ["C=πr²","C=πd/2","C=2d"]),
    *[mk_choice(f"半径{r}厘米的圆，面积约是多少？(π=3.14)", round(3.14*r*r,1), [round(3.14*r*r-3,1),round(2*3.14*r,1)]) for r in [3,5,7]],
])

add_unit(6,1,"百分数", [
    mk_choice("50% = 几分之几？", "1/2", ["1/5","1/10","1/50"]),
    mk_choice("25% = 几分之几？", "1/4", ["1/2","1/5","1/25"]),
])

add_unit(6,1,"扇形统计图", [
    mk_choice("扇形统计图适合表示？", "各部分占整体的百分比", ["数据变化趋势","绝对数值","时间序列"]),
])

add_unit(6,1,"百分数应用题", [
    mk_choice("200的25%是多少？", 50, [25,100,150]),
])

add_unit(6,1,"比例应用题", [
    mk_choice("3:4 = x:12, x = ?", 9, [6,12,16]),
])

add_unit(6,1,"展开图", [
    mk_choice("正方体的展开图有几个面？", "6个", ["4个","8个","12个"]),
])

add_unit(6,2,"负数", [
    mk_choice("比0小5的数是？", "-5", ["5","0","-4"]),
    mk_choice("-3°C和3°C相比谁的温度低？", "-3°C", ["一样","3°C","无法比较"]),
])

add_unit(6,2,"百分数（二）", [
    mk_choice("一件衣服打八折出售，是按原价的百分之几卖？", "80%", ["20%","8%","50%"]),
])

add_unit(6,2,"圆柱与圆锥", [
    mk_choice("圆柱有几个底面？", "2个", ["1个","3个","0个"]),
    mk_choice("圆锥有几个底面？", "1个", ["2个","3个","0个"]),
])

add_unit(6,2,"比例", [
    mk_choice("若 a:b = c:d，则 ad = ?", "bc", ["ac","bd","ab"]),
])

add_unit(6,2,"统计", [
    mk_choice("平均数、中位数、众数中，哪个最能反映数据的集中趋势？", "平均数", ["中位数","众数","极差"]),
])

add_unit(6,2,"行程问题", [
    mk_choice("甲、乙两地相距300千米，汽车以60千米/时的速度从甲开往乙，需要多少小时？", 5, [6,4,3]),
])

add_unit(6,2,"工程问题", [
    mk_choice("一项工程，甲队单独做12天完成，甲队每天做工程的几分之几？", "1/12", ["12","1/10","1/6"]),
])

add_unit(6,2,"视图与展开", [
    mk_choice("正方体的一个面是？", "正方形", ["长方形","三角形","圆形"]),
])

add_unit(6,2,"总复习", [
    mk_choice("48和36的最大公因数是？", 12, [6,8,18]),
    mk_choice("100以内最大的质数是？", 97, [99,91,95]),
])
