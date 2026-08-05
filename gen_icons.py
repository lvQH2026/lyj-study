#!/usr/bin/env python3
# 生成 PWA 图标（无需第三方库，纯 Python 写 PNG）
import struct, zlib, os

def png(size, path, bg=(0x4A, 0x90, 0xD9), fg=(255, 255, 255)):
    # 像素缓冲 RGBA
    px = bytearray()
    cx = cy = size / 2.0
    R = size * 0.34          # 外圈半径
    r = size * 0.20          # 内圈半径
    for y in range(size):
        px.append(0)  # filter byte
        for x in range(size):
            dx, dy = x - cx, y - cy
            d = (dx * dx + dy * dy) ** 0.5
            if d <= R:
                if d >= r:
                    col = fg
                else:
                    col = bg
            else:
                col = (0, 0, 0, 0)
            px.extend(col if len(col) == 4 else (col[0], col[1], col[2], 255))
    raw = bytes(px)
    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        return c + struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    out = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(out)
    print("wrote", path, size, "x", size)

os.makedirs("icons", exist_ok=True)
png(192, "icons/icon-192.png")
png(512, "icons/icon-512.png")
