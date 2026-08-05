#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把吕泳冀学习站PWA打包成单个自包含HTML(内联所有JS/manifest)，并生成归档说明。"""
import os, json, urllib.parse

SRC = r"C:\Users\Administrator\WorkBuddy\2026-08-05-10-06-13\吕泳冀学习站PWA"
OUT_DIR = r"C:\Users\Administrator\WorkBuddy\2026-08-05-10-06-13\吕泳冀学习站归档"
os.makedirs(OUT_DIR, exist_ok=True)

def read(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

html = read(os.path.join(SRC, "index.html"))
cfg = read(os.path.join(SRC, "config.js"))
sb = read(os.path.join(SRC, "supabase.js"))
pjs = read(os.path.join(SRC, "parent.js"))

# 1) 内联三个本地脚本
html = html.replace('<script src="config.js"></script>',
                    '<script>\n' + cfg + '\n</script>')
html = html.replace('<script src="supabase.js"></script>',
                    '<script>\n' + sb + '\n</script>')
html = html.replace('<script src="parent.js"></script>',
                    '<script>\n' + pjs + '\n</script>')

# 2) 内联 manifest 为 data URI，使单文件也是完整 PWA
manifest = json.load(open(os.path.join(SRC, "manifest.webmanifest"), encoding="utf-8"))
manifest["start_url"] = "."   # 单文件场景
manifest_uri = "data:application/manifest+json," + urllib.parse.quote(json.dumps(manifest, ensure_ascii=False))
html = html.replace('<link rel="manifest" href="manifest.webmanifest">',
                    '<link rel="manifest" href="' + manifest_uri + '">')

# 3) sw.js 注册在单文件场景会失败(无 sw.js)，包一层容错（原代码已有 .catch，保留即可）
# 4) 写自包含主程序
out_main = os.path.join(OUT_DIR, "吕泳冀学习站.html")
with open(out_main, "w", encoding="utf-8") as f:
    f.write(html)

# 5) 复制家长电脑端页面(它依赖 config.js/supabase.js，归档同目录保留副本便于本地查看)
import shutil
shutil.copy(os.path.join(SRC, "parent-pc.html"), os.path.join(OUT_DIR, "吕泳冀学习站-家长电脑端.html"))
shutil.copy(os.path.join(SRC, "schema.sql"), os.path.join(OUT_DIR, "schema.sql"))

size = os.path.getsize(out_main)
print("MAIN_HTML_BYTES:", size)
print("OUT_DIR:", OUT_DIR)
print("files:", os.listdir(OUT_DIR))

# 6) 生成说明文档
readme = """# 吕泳冀学习站 · 项目归档说明

## 项目简介
吕泳冀（二年级）专属的小学数学同步练习与专项训练 Web 应用，支持：
- 分年级、分单元刷题（含专项练习板块）
- 手机端安装为 App（PWA，离线可用）
- 家长后台：查看练习次数、平均正确率、薄弱单元、每日练习量、逐题错题详情
- 手机 / 电脑多设备统一身份，数据自动同步云端，家长任意一端可远程查看

## 线上地址
- 主站（永久，GitHub Pages）：https://lvqh2026.github.io/lyj-study/
- 家长电脑端查看页：https://lvqh2026.github.io/lyj-study/parent-pc.html

## 家长查看方式
- 学习ID：LYJ-YONGJI　口令：202506
- 手机/电脑打开主站 → 底部「家长」→ 本机数据直接显示；下方输入上面凭证可看云端汇总
- 或电脑浏览器打开「家长电脑端查看页」，输入学习ID+口令即可

## 归档文件说明
- `吕泳冀学习站.html`：自包含主程序（已内联所有 JS 与 manifest），双击即可在浏览器打开使用
- `吕泳冀学习站-家长电脑端.html`：家长专用查看页（需联网读取云端数据）
- `schema.sql`：Supabase 数据库建表与统计函数，部署云端时用

## 云端数据库
- Supabase 项目：wrgupojuxnkgwbiddbsv.supabase.co
- 表：children（学习身份）、study_records（每次练习+逐题错题）、content（内容覆盖层）

## 源仓库
- GitHub：https://github.com/lvQH2026/lyj-study
"""
with open(os.path.join(OUT_DIR, "项目说明.md"), "w", encoding="utf-8") as f:
    f.write(readme)
print("README written")
