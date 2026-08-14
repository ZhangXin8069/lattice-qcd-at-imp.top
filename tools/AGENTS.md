# AGENTS.md — tools/

本地内容生成/维护脚本（不参与站点运行时）：

- `fa_coverage.py` — 检查页面与业务 JS 引用的图标名是否都被 fontawesome-subset.js 覆盖
- `fa_subset.py` — 从 fontawesome.all.min.js 提取所需图标定义，生成精简替换器 JS
- `fa_verify.py` — 校验 fontawesome-subset.js 每个图标 path 与源库定义一致
- `fa_test.js` — FontAwesome 替换器行为回归测试（node，最小 DOM mock）
- `optimize_images.py` — 压缩 custom/ 下大图为 JPEG/WebP（原文件保留）
