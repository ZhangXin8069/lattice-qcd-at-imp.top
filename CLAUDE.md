# 格点量子色动力学课题组网站

> 中国科学院近代物理研究所 (IMP, CAS) — Lattice QCD Group Website
> https://lattice-qcd-at-imp.top

## Skills

| Skill | 用途 |
|---|---|
| `/build-website` | 完整构建流程 — 从零生成完全一致的网站 |
| `/update-website` | 网站内容更新 — 论文、会议、讲习班、导师等各项子命令 |

## 架构

- 单页应用 (SPA)，Vanilla JS 模块化，部署于 GitHub Pages
- 中英文切换 (`i18n.js`)、深色/浅色模式 (`theme.js`)
- Canvas 粒子动画背景：深色=星场、浅色=樱花雨
- 论文数据源：`custom/inspirehep.net/authors/*/INSPIRE-CiteAll.html`（离线主数据源）

## 文件索引

| 文件 | 说明 |
|---|---|
| `index.html` | 唯一页面 |
| `static/css/index.css` | 主样式表（变量系统/深色模式/动画/响应式） |
| `static/js/i18n.js` | 中英文切换 |
| `static/js/theme.js` | 深色/浅色模式 |
| `static/js/music.js` | 背景音乐播放器 |
| `static/js/papers.js` | 论文加载与展示 |
| `static/js/animations.js` | Canvas粒子动画与滚动动效 |
| `static/js/index.js` | 主控制器（搜索/幻灯片/导航） |
| `data/` | 翻译字典、会议、讲习班、论文等JSON数据 |
| `custom/` | 图片、音频、PDF、offline论文HTML等资源 |
| `要求.json` | 需求规范 |
| `数据.csv` | 全站数据汇总（手动修正入口） |
