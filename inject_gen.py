#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 gen_new.js 注入 index.html，替换旧生成器段。"""
import re

HTML = r"C:\Users\Administrator\WorkBuddy\2026-08-05-10-06-13\吕泳冀学习站PWA\index.html"
GEN = r"C:\Users\Administrator\WorkBuddy\2026-08-05-10-06-13\吕泳冀学习站PWA\gen_new.js"

with open(HTML, "r", encoding="utf-8") as f:
    lines = f.readlines()

with open(GEN, "r", encoding="utf-8") as f:
    gen_new = f.read()

# 找到旧生成器区域：从 "// --- 1年级 ---" 到 "// --- 快速练习生成器 ---" 之前
start_i = None
end_i = None
for i, line in enumerate(lines):
    if start_i is None and line.strip() == "// --- 1年级 ---":
        start_i = i
    if start_i is not None and "// --- 快速练习生成器 ---" in line:
        end_i = i
        break

if start_i is None or end_i is None:
    print("ERROR: couldn't find boundaries")
    print("start_i:", start_i, "end_i:", end_i)
    exit(1)

print(f"Replacing lines {start_i+1}-{end_i} ({end_i-start_i} lines)")

# 构建新内容：注释头 + gen_new.js（去掉开头的重复 ri/pick/fmt/注释）
# 只保留 SVG 工具 + mc/mf/msc + 生成器
gen_lines = gen_new.split("\n")
# 跳过文件头注释和重复的工具函数定义，找到 function svgR 开始
cut_in = 0
for j, gl in enumerate(gen_lines):
    if gl.strip().startswith("function svgR("):
        cut_in = j
        break

new_gen_block = "\n".join(["// ===== 新题库生成器（人教版 + 试卷配图）====="] + gen_lines[cut_in:])

# 替换
new_lines = lines[:start_i] + [new_gen_block + "\n", "\n"] + lines[end_i:]

with open(HTML, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"Done. Old lines {start_i+1}-{end_i} replaced. New file length: {len(new_lines)} lines.")
