#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""生成 DSH 远程助手 PWA 图标(DeepSeek 白底蓝鲸鱼)。

用法: python gen_icons.py    → 输出 icon-180.png / icon-192.png / icon-512.png
依赖: Pillow(仓库开发机已具备;PWA 运行时不需要它,图标是静态文件)。

素材: 复用 Android 工程 DshRemote 的 launcher 图标
      (mobile/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png,
       即 DeepSeek 白底蓝鲸鱼),resize 到各档尺寸。
      - 白底满幅、鲸鱼居中,天然满足 maskable 安全区;
      - 圆角交给 iOS/Android 系统自行裁切,素材不预置透明角。
"""
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.normpath(os.path.join(
    HERE, "..", "mobile", "app", "src", "main", "res",
    "mipmap-xxxhdpi", "ic_launcher.png"))


def main():
    src = Image.open(SOURCE).convert("RGBA")
    print("source: %s %dx%d" % (SOURCE, src.width, src.height))
    # 源 launcher 图标四角透明,先合成到不透明白底:iOS 主屏把透明处渲染成黑,
    # 必须满幅白底才符合「白底蓝鲸鱼」。
    bg = Image.new("RGBA", src.size, (255, 255, 255, 255))
    src = Image.alpha_composite(bg, src).convert("RGB")
    for s in (512, 192, 180):
        p = os.path.join(HERE, "icon-%d.png" % s)
        src.resize((s, s), Image.LANCZOS).save(p, "PNG")
        print("wrote %s (%dx%d)" % (p, s, s))


if __name__ == "__main__":
    main()
