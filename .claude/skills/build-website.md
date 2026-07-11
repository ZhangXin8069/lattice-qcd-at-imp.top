---
name: build-website
description: 完整构建格点量子色动力学课题组网站 — 从零生成完全一致的网站 (Build the complete Lattice QCD Group website from scratch)
---

# 格点量子色动力学课题组网站 — 完整构建流程

## 一、网站概述

- **目标**: 中国科学院近代物理研究所格点QCD课题组介绍网站
- **域名**: lattice-qcd-at-imp.top / www.lattice-qcd-at-imp.top
- **平台**: GitHub Pages（静态站点，无需Jekyll）
- **架构**: 单页应用 (SPA)，Vanilla JS 模块化架构
- **语种**: 中英文切换（i18n）
- **主题**: 深色/浅色模式切换
- **导师**: 孙鹏 (Peng Sun)、刘柳明 (Liuming Liu)

---

## 二、目录结构

```
lattice-qcd-at-imp.top/
├── index.html                              # 主页面（唯一HTML页面）
├── CNAME                                   # 自定义域名
├── .nojekyll                               # 禁用GitHub Pages的Jekyll处理
├── .gitignore                              # Git忽略规则（.*.DS_Store）
├── 要求.json                               # 需求规范文档
├── 数据.csv                                # 全站数据汇总（手动修正入口）
├── data_summary.json                       # 数据摘要（机器可读）
├── README.md                               # 项目说明
├── LICENSE                                 # MIT许可证
│
├── data/                                   # 数据目录
│   ├── translations.json                  # 中英文翻译字典（所有文本）
│   ├── conferences.json                   # 学术会议列表
│   ├── summer-schools.json                # 讲习班列表
│   └── papers.json                        # 论文静态备份（离线回退）
│
├── custom/                                 # 自定义资源目录
│   ├── inspirehep.net/authors/            # INSPIRE-HEP离线论文数据
│   │   ├── 1659207/INSPIRE-CiteAll.html   # 孙鹏论文列表
│   │   └── 1259106/INSPIRE-CiteAll.html   # 刘柳明论文列表
│   ├── 孙鹏介绍.md                         # 孙鹏导师介绍
│   ├── 刘柳明介绍.md                       # 刘柳明导师介绍
│   ├── 讲习班.html                         # 讲习班参考链接（Netscape书签格式）
│   ├── 孙鹏头像.png / 刘柳明头像.png        # 导师头像
│   ├── 孙鹏讲习图.png / 刘柳明讲习图.png    # 讲习幻灯片图
│   ├── 张鑫讲习图.png / 张鑫 20260706gitee贡献度.png
│   ├── 张鑫 20251227工作汇报_01~08.png       # 工作汇报幻灯片
│   ├── 张鑫 20260531工作汇报_01.png
│   ├── 张鑫 508应用测试报告-PyQCU.pdf
│   ├── 李政道坐像.png / 李政道手写"格"图.png
│   ├── 李政道先生与芯片上的格点量子色动力学.pdf
│   ├── 标准模型图.png / 课题组合照20260706.png
│   ├── 近代物理研究所惠州分部办公楼.png
│   ├── 网站管理员.png / QCD涨落图.gif / QCD涨落视频.mp4
│   ├── 菊次郎的夏天(轻灵版).mp3
│   ├── 菊次郎的夏天(经典版).mp3
│   └── 菊次郎的夏天(治愈版).mp3
│
├── static/                                # 静态资源目录
│   ├── css/
│   │   ├── index.css                      # **主样式表（核心文件）**
│   │   ├── bulma.min.css                  # Bulma CSS框架 v0.9.x
│   │   ├── bulma-carousel.min.css
│   │   ├── bulma-slider.min.css
│   │   └── fontawesome.all.min.css        # Font Awesome 5 图标
│   ├── js/
│   │   ├── i18n.js                        # 国际化模块（中英文切换）
│   │   ├── theme.js                       # 深色/浅色模式模块
│   │   ├── music.js                       # 背景音乐播放器模块
│   │   ├── papers.js                      # 论文展示模块
│   │   ├── animations.js                  # Canvas粒子动画与动效模块
│   │   ├── index.js                       # 主控制器（搜索、幻灯片等）
│   │   ├── bulma-carousel.min.js
│   │   ├── bulma-slider.min.js
│   │   └── fontawesome.all.min.js
│   ├── images/                            # 通用图片（carousel、favicon）
│   ├── videos/                            # 通用视频
│   └── pdfs/                              # 通用PDF
│
└── .claude/skills/
    ├── build-website.md                   # 本文件（完整构建skill）
    └── update-website.md                  # 网站更新skill（各项子命令）
```

---

## 三、模块架构与数据流

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html (SPA)                       │
├─────────────────────────────────────────────────────────────┤
│  JS模块（按加载顺序）:                                       │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ i18n.js  │  │ theme.js │  │ music.js │                  │
│  │ 中英切换  │  │ 深浅主题  │  │ 背景音乐  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                             │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐   │
│  │ papers.js    │  │ animations.js  │  │  index.js     │   │
│  │ 论文加载展示  │  │ Canvas粒子/动效 │  │  主控制器      │   │
│  └──────┬───────┘  └────────────────┘  └───────┬───────┘   │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌─────────────────────┐         ┌──────────────────────┐  │
│  │ custom/inspirehep   │         │ data/conferences.json │  │
│  │ .net/authors/*/     │         │ data/summer-schools   │  │
│  │ INSPIRE-CiteAll     │         │ .json                 │  │
│  │ .html (offline)     │         │ custom/讲习班.html     │  │
│  └─────────────────────┘         │ data/translations.json │  │
│                                  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  CSS:                                                       │
│  ┌──────────────┐  ┌──────────────────────────────────┐    │
│  │ bulma.min.css │  │ index.css (深色模式/动画/响应式)  │    │
│  └──────────────┘  └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、CSS 架构 (`static/css/index.css`)

### 4.1 CSS变量系统（`:root` 浅色 / `[data-theme="dark"]` 深色）

```css
:root {
  --primary-color: #2563eb;
  --background-primary: #ffffff;
  --background-secondary: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --gradient-primary: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  /* ... 完整变量见 index.css :root 块 ... */
}
[data-theme="dark"] {
  --background-primary: #0f172a;
  --background-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  /* ... */
}
```

### 4.2 核心样式区域

| 区域 | CSS选择器 | 关键属性 |
|---|---|---|
| Navbar | `#main-navbar` | `position:fixed, backdrop-filter:blur(12px), bg:rgba(255,255,255,0.85)` |
| Hero | `#hero` | `height:100vh, background:transparent, z-index:1` |
| Hero Canvas | `.hero-canvas` | `position:fixed, z-index:0, pointer-events:none` |
| Hero Overlay | `.hero-overlay` | `radial-gradient(ellipse, transparent→var(--background-primary) 70%), z-index:2` |
| Section | `.section` | `padding:5rem 1.5rem, bg:var(--background-primary), z-index:1` |
| Section Alt | `.section-alt` | `bg:var(--background-secondary)` |
| Section Overlay | `.section-bg-overlay` | `position:absolute, z-index:-1, bg:transparent` |
| Help Overlay | `#help .section-bg-overlay` | `bg:rgba(.,0.85)` — 非主页动效专用 |
| Cards | `.advisor-card, .research-card, .paper-card, .software-card, .student-card, .school-card` | 白底、圆角、阴影、hover提升效果 |
| Dark Card Glow | `[data-theme="dark"] .*-card:hover` | `box-shadow:0 0 20px rgba(96,165,250,0.15)` |
| Reveal动画 | `.reveal, .reveal-left, .reveal-right, .reveal-up, .reveal-child` | `opacity:0, transform, transition` → `.revealed`激活 |
| 响应式 | `@media(max-width:1024px/768px/600px/480px)` | 移动端适配、单列布局 |

### 4.3 主题切换

- `data-theme="light"` → `:root` 变量
- `data-theme="dark"` → `[data-theme="dark"]` 覆盖变量
- Starfield canvas: dark模式显示，light模式隐藏
- Sakura canvas: light模式显示，dark模式隐藏
- 切换通过 `theme.js` 设置 `<html data-theme="...">` 实现

---

## 五、JS模块详细说明

### 5.1 `i18n.js` — 国际化

- 从 `data/translations.json` 加载翻译字典
- 支持 `data-i18n`（文本）、`data-i18n-html`（HTML）、`data-i18n-placeholder`、`data-i18n-title`
- `langChanged` 自定义事件通知其他模块重渲染
- 语言偏好存入 localStorage
- 返回: `{ init, toggle, t, getLang, applyTranslations }`

### 5.2 `theme.js` — 主题切换

- 从 localStorage 读取偏好，否则跟随系统 `prefers-color-scheme`
- 设置 `<html data-theme="dark|light">`
- 监听系统主题变化（仅在未手动设置时）
- 返回: `{ init, toggle, getTheme, applyTheme }`

### 5.3 `music.js` — 背景音乐

- 3首曲目: 菊次郎的夏天（轻灵/经典/治愈版）
- 每次刷新随机选定初始曲目
- 洗牌模式（默认开启，避免立即重复）
- 自动播放尝试（500ms延迟 + 首次用户交互重试）
- 浮动控制面板: 播放/暂停、上一首、下一首、随机开关、音量
- 音量默认30%

### 5.4 `papers.js` — 论文模块

**数据源优先级**: `custom/inspirehep.net/authors/{1659207,1259106}/INSPIRE-CiteAll.html` → localStorage缓存(24h) → `data/papers.json`

**解析逻辑**:
1. 读取 offline HTML，按 `<br>` 分割为论文块
2. 每块提取: 标题、作者列表、arXiv ID、DOI、期刊/卷/页/年份、`isFirstUnitIMP`
3. `isFirstUnitIMP` 判定: 作者行包含 `Lanzhou, Inst. Modern Phys.`
4. 展示列表: `displayPapers` = `allPapers.filter(p => p.isFirstUnitIMP)`
5. 计数列表: `countPapers` = `allPapers`（全部论文）
6. 学生列表: 硬编码8人名单，匹配论文作者

**功能**: 按导师筛选、按年份筛选、标题/作者/期刊搜索、"加载更多"分页

**更新方式**: 手动运行 `/update-website papers` skill 更新 offline HTML 文件

### 5.5 `animations.js` — 动画模块

**Hero Canvas**: 
- Dark mode: 星场 (starfield) — 粒子闪烁 + 鼠标吸引 + 星座连线
- Light mode: 樱花雨 (sakura) — 对角线飘落 + 摇摆 + 旋转
- 主题切换时停止非活跃canvas的rAF循环（省电）
- MutationObserver监听 `data-theme` 自动重启

**滚动动效**:
- IntersectionObserver触发 `.reveal` / `.reveal-left` / `.reveal-right` / `.reveal-up`
- `.reveal-child` 延迟交错显示
- 计数器动画 (`.stat-number[data-target]`): easeOutCubic, 2000ms

**其他**: Navbar滚动效果、Scroll Spy高亮、平滑滚动、倾斜卡片(`.tilt-card`)、移动端菜单、视差

### 5.6 `index.js` — 主控制器

**模块编排**: 初始化所有子模块，绑定事件

**动态数据加载**:
- `loadConferences()`: 读取 `data/conferences.json`，按地点过滤中国学术机构，按日期降序，分"即将举行/已举办"
- `loadSummerSchools()`: 读取 `data/summer-schools.json` + 解析 `custom/讲习班.html` 链接，合并为统一列表，过滤掉研讨会关键词，使用 `school-card` 模板
- `loadStudents()`: 轮询 `Papers.getStudents()`（最多10秒），渲染学生卡片

**全局搜索**: 
- 快捷键 `Ctrl+K` 或 `/`
- 从DOM实时构建搜索索引（包括动态加载内容）
- 防抖150ms，高亮匹配词，上下文片段显示
- 点击结果平滑滚动到对应section

**其他**: Lightbox灯箱、工作汇报幻灯片（自动播放4s、触摸滑动、hover暂停）、可点击图片全屏、回到顶部按钮

---

## 六、数据文件格式

### 6.1 `data/translations.json`

```json
{
  "zh": { "nav.home": "首页", ... },
  "en": { "nav.home": "Home", ... }
}
```

所有UI文本集中管理。包含: nav、hero、about、advisors、research、publications、students、conferences、lectures、software、gallery、help、footer、music、theme、search

### 6.2 `data/conferences.json`

```json
[{
  "name_zh": "...",
  "name_en": "...",
  "date": "2025-10-09",
  "endDate": "2025-10-12",
  "location_zh": "...",
  "location_en": "...",
  "url": "https://...",
  "tags_zh": ["..."],
  "tags_en": ["..."],
  "status": "past"
}]
```

仅包含学术会议（研讨会/年会）。不包含暑期学校/训练营（已归入讲习班）。

### 6.3 `data/summer-schools.json`

```json
[{
  "name_zh": "...",
  "name_en": "...",
  "date": "2024-08-05",
  "endDate": "2024-08-16",
  "location_zh": "...",
  "location_en": "...",
  "topic_zh": "...",
  "topic_en": "...",
  "url": "https://...",
  "status": "past"
}]
```

仅包含讲习班/暑期学校/训练营。不包含华中师范大学举办的华大讲习班。

### 6.4 `data/papers.json`

```json
{
  "last_updated": "2026-07-11T00:00:00Z",
  "papers": [{
    "id": "3168031",
    "title": "...",
    "authors": ["..."],
    "journal": "Phys. Rev. D",
    "volume": "111",
    "pages": "074506",
    "year": 2025,
    "arxiv_id": "2510.26425",
    "doi": "10.1103/...",
    "citation_count": 1,
    "isFirstUnitIMP": true
  }],
  "students": [
    {"name": "Kuan Zhang", "papers": 0, "start_year": 2025}
  ]
}
```

离线回退数据。`isFirstUnitIMP` 必填。学生列表包含全部8人。

---

## 七、完整构建步骤

### 步骤1: 初始化项目

```bash
mkdir lattice-qcd-at-imp.top && cd lattice-qcd-at-imp.top
git init
echo ".DS_Store" > .gitignore
touch .nojekyll
echo "www.lattice-qcd-at-imp.top" > CNAME
```

### 步骤2: 下载CSS框架

```bash
mkdir -p static/css
# 下载 Bulma 0.9.x CSS
curl -o static/css/bulma.min.css https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css
# 下载 Font Awesome 5
curl -o static/css/fontawesome.all.min.css https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css
# 下载 Bulma 扩展
curl -o static/css/bulma-carousel.min.css https://cdn.jsdelivr.net/npm/bulma-carousel@4.0.24/dist/css/bulma-carousel.min.css
curl -o static/css/bulma-slider.min.css https://cdn.jsdelivr.net/npm/bulma-slider@2.0.5/dist/css/bulma-slider.min.css
```

### 步骤3: 创建 `static/css/index.css`

**从本仓库复制完整内容**。关键特性:
- CSS变量系统（:root + [data-theme="dark"]）
- Navbar毛玻璃效果
- Hero Canvas定位
- Section/Card样式
- 深色模式覆盖
- 响应式断点
- 动画关键帧（fadeInUp、bounce、pulse、musicPulse）
- GPU加速建议（parallax用will-change，card/reveal不用）

### 步骤4: 创建 `index.html`

**从本仓库复制完整内容**。关键结构:
```html
<!DOCTYPE html>
<html lang="zh" data-theme="light">
<head>
  <!-- Meta: charset, viewport, SEO, Open Graph, Twitter -->
  <!-- CSS: bulma, index.css, carousel, slider, fontawesome, Academicons -->
  <!-- Fonts: Inter from Google Fonts -->
  <!-- Structured Data: JSON-LD -->
</head>
<body>
  <!-- #main-navbar (fixed, glassmorphism) -->
  <!-- #hero (canvas#starfield-canvas + canvas#sakura-canvas + .hero-overlay) -->
  <!-- #about (.section) -->
  <!-- #advisors (.section.section-alt) -->
  <!-- #research (.section) -->
  <!-- #publications (.section.section-alt) -->
  <!-- #students (.section) -->
  <!-- #conferences (.section.section-alt) -->
  <!-- #summer-schools (.section) -->
  <!-- #software (.section.section-alt) -->
  <!-- #gallery (.section.section-alt) -->
  <!-- #help (.section.section-bg-img, bg=QCD涨落图.gif) -->
  <!-- footer -->
  <!-- #lightbox, #search-modal, #music-player-container, .scroll-to-top -->
  <!-- Scripts: fontawesome, bulma-*, i18n, theme, music, papers, animations, index -->
</body>
</html>
```

### 步骤5: 创建 `data/translations.json`

**从本仓库复制完整内容**。包含所有i18n键值对（zh + en）。

### 步骤6: 创建 JS 模块

**全部从本仓库复制**:
- `static/js/i18n.js`
- `static/js/theme.js`
- `static/js/music.js`
- `static/js/papers.js`
- `static/js/animations.js`
- `static/js/index.js`

### 步骤7: 创建数据文件

```bash
mkdir -p data
# 从本仓库复制:
# data/conferences.json — 7条学术会议
# data/summer-schools.json — 3条讲习班
# data/papers.json — 12条论文 + 8名学生
# data_summary.json — 数据摘要
# 数据.csv — 全站数据汇总
# 要求.json — 需求规范
```

### 步骤8: 创建离线论文数据

需要从 INSPIRE-HEP 导出两位导师的 CiteAll HTML:

```bash
mkdir -p custom/inspirehep.net/authors/1659207
mkdir -p custom/inspirehep.net/authors/1259106

# 访问以下URL并保存HTML:
# https://inspirehep.net/authors/1659207/INSPIRE-CiteAll.html
# https://inspirehep.net/authors/1259106/INSPIRE-CiteAll.html
# 保存到对应目录
```

HTML解析规则（papers.js `loadFromOfflineData()`）:
- `<br>` 分割论文块
- `<a href="/literature/ID">TITLE</a>` → id + title
- 作者行含 `Lanzhou, Inst. Modern Phys.` → `isFirstUnitIMP = true`
- `e-Print:` → arxiv_id
- `DOI:` → doi
- `Published in:` → journal/volume/pages/year

### 步骤9: 准备媒体资源

```bash
# custom/ 目录下所有图片、音频、PDF、视频文件
# 具体文件列表见第二节"目录结构"
# 缺失的文件使用占位符（带描述的CSS渐变或纯色块）
```

### 步骤10: 本地预览

```bash
cd lattice-qcd-at-imp.top
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 步骤11: 部署到 GitHub Pages

```bash
# 创建GitHub仓库: zhangxin8069/lattice-qcd-at-imp.top
git remote add origin git@github.com:zhangxin8069/lattice-qcd-at-imp.top.git
git add -A
git commit -m "Initial build"
git push -u origin main

# GitHub Pages设置: Settings → Pages → Source: Deploy from branch (main)
# Custom domain: lattice-qcd-at-imp.top
```

---

## 八、关键设计决策

### 8.1 背景与透明度规则

| 区域 | 背景类型 | 透明度 | 实现 |
|---|---|---|---|
| Hero | Canvas 星空/樱花 | 渐变遮罩 | `.hero-overlay` radial-gradient |
| 普通 Section | 主页动效（Canvas） | 实色不透明 | `.section {bg:var(--background-primary)}` |
| Section Alt | 主页动效 | 实色不透明 | `.section-alt {bg:var(--background-secondary)}` |
| Help | QCD涨落图.gif | 0.85遮罩 | `#help .section-bg-overlay {rgba(.,0.85)}` |
| Section Overlay | — | 透明 | `z-index:-1, bg:transparent` |

### 8.2 数据过滤规则

- **会议**: 地点包含中国学术机构关键词 → `['中国科学院', 'CAS', '研究所', '大学', '学院', '北京', '上海', '武汉', '广东', '兰州']`
- **讲习班**: 同会议过滤 + 解析`讲习班.html`时排除标题含`研讨会/年会/Symposium/Annual Meeting/Lattice 20`的条目
- **论文展示**: 仅显示 `isFirstUnitIMP === true` 的论文
- **论文计数**: 全部论文（不限制第一单位）

### 8.3 动画设计

- Hero: Canvas粒子动画（starfield + sakura），仅活跃主题运行
- 滚动触发: IntersectionObserver + `.reveal*` CSS类
- 计数器: easeOutCubic 2秒动画
- 卡片hover: 阴影增强 + 上移4px（仅深色模式有发光）
- 不使用 `will-change` 在文字元素上（会模糊文字）

---

## 九、更新流程

使用 `/update-website` skill 的各项子命令:

```
/update-website papers          # 更新离线论文HTML → 重新解析
/update-website add-conference   # 添加会议到 conferences.json
/update-website add-summer-school # 添加讲习班到 summer-schools.json
/update-website advisor          # 更新导师信息
/update-website students         # 更新研究生名单
/update-website translations     # 更新中英文翻译
/update-website software         # 更新软件工作区
/update-website theme            # 更新主题/背景设置
/update-website summary          # 重新生成数据汇总
/update-website all              # 全量更新
```

每次更新后:
1. 本地 `python3 -m http.server 8000` 预览
2. 确认无误后 `git push`
3. GitHub Pages 自动部署

---

## 十、外部依赖

| 资源 | 用途 | 加载方式 |
|---|---|---|
| Bulma 0.9.x CSS | UI框架 | 本地 `static/css/bulma.min.css` |
| Font Awesome 5 | 图标 | 本地 `static/css/fontawesome.all.min.css` |
| Academicons | 学术图标(arXiv, INSPIRE) | CDN `cdn.jsdelivr.net/gh/jpswalsh/academicons@1` |
| Google Fonts Inter | 字体 | CDN `fonts.googleapis.com/css2?family=Inter` |
| Bulma Carousel | 轮播（备用） | 本地 `static/js/bulma-carousel.min.js` |
| INSPIRE-HEP API | 论文数据更新 | `inspirehep.net/api/literature`（手动触发） |
