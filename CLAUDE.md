# 格点量子色动力学课题组网站

> 中国科学院近代物理研究所 (IMP, CAS) — Lattice QCD Group Website
> https://lattice-qcd-at-imp.top

## Skills

工作区共有 **6 个 skill**，分布在两个项目中。Skill 文件是架构、数据格式和更新流程的**权威参考**。

---

### 本网站项目 (`lattice-qcd-at-imp.top/`)

Skill 文件位于 `.claude/skills/`。

#### `/build-website` — 完整构建网站

从零生成完全一致的网站，共 11 个步骤：

| 步骤 | 内容 |
|---|---|
| 1 | 初始化项目（`git init`、`.nojekyll`、`CNAME`） |
| 2 | 下载 CSS 框架（Bulma 0.9.x、Font Awesome 5、Bulma Carousel/Slider） |
| 3 | 创建 `static/css/index.css`（CSS变量系统、深色模式、动画） |
| 4 | 创建 `index.html`（SPA 全部 section 结构） |
| 5 | 创建 `data/translations.json`（zh + en 完整翻译字典） |
| 6 | 创建 JS 模块（i18n、theme、music、papers、animations、index） |
| 7 | 创建数据文件（conferences.json、summer-schools.json、papers.json、data_summary.json、数据.csv） |
| 8 | 创建离线论文数据（从 INSPIRE-HEP 导出 CiteAll HTML） |
| 9 | 准备媒体资源（图片、音频、PDF、视频到 `custom/`） |
| 10 | 本地预览（`python3 -m http.server 8000`） |
| 11 | 部署到 GitHub Pages |

#### `/update-website` — 内容更新

各项子命令用于更新网站不同部分，每次更新后需本地预览确认再推送。

| 子命令 | 用途 | 涉及文件 |
|---|---|---|
| `papers` | 从 INSPIRE-HEP API 获取最新论文，生成 `data/papers.json` | `data/papers.json`、`数据.csv`、`data_summary.json` |
| `add-conference` | 添加学术会议（限中国CAS研究所主办） | `data/conferences.json`、`数据.csv`、`data_summary.json` |
| `add-summer-school` | 添加讲习班/暑期学校/训练营 | `data/summer-schools.json`、`数据.csv`、`data_summary.json` |
| `advisor` | 更新导师信息（头像、简介、链接） | `index.html`、`data/translations.json`、`数据.csv`、`data_summary.json` |
| `students` | 更新研究生名单 | `static/js/papers.js`、`数据.csv`、`data_summary.json` |
| `translations` | 修改中英文翻译键值对 | `data/translations.json` |
| `software` | 更新软件工作区（PyQCU、测试报告、工作汇报幻灯片） | `index.html`、`数据.csv`、`data_summary.json` |
| `theme` | 更新主题/背景（星场/樱花动画、透明度、背景音乐MP3） | `static/js/animations.js`、`static/js/music.js`、`static/css/index.css` |
| `summary` | 扫描所有数据文件，重新生成数据汇总 | `数据.csv`、`data_summary.json` |
| `assets` | 检查 `custom/` 资源文件，验证 `index.html` 引用完整性 | `custom/`、`index.html` |
| `all` | 全量更新：papers → conferences → summer-schools → students → translations → summary → assets | 全部 |

**约束**：会议地点必须在中国、CAS研究所；讲习班仅来源于 `data/summer-schools.json`；`数据.csv` 是手动修正入口——修改后需运行 `/update-website summary` 同步；导师 INSPIRE-HEP ID：孙鹏 `1659207`、刘柳明 `1259106`。

---

### 胶子PDF项目 (`~/lattice-pdf/`)

Skill 文件位于 `~/lattice-pdf/.claude/skills/` 和 `~/lattice-pdf/agent/.claude/skills/`。项目共 44 个 `.tex` 文件，使用 **XeLaTeX** 编译（两遍以解析交叉引用）。

#### `/compile-latex` — LaTeX 文档编译

| 子命令 | 用途 |
|---|---|
| `<文件路径>` | 编译单个 `.tex` 文件（支持相对/绝对路径、可省略扩展名） |
| `<目录名>` | 编译某个目录下所有 `.tex` 文件。目录：`文档`(3)、`补充`(34)、`汇报`(2)、`代码`(1)、`reports`(2 beamer)、`refer`(1)、`agent-docs`(3) |
| `all` | 编译全部 44 个文件，按目录顺序 |
| `clean` | 清理所有 LaTeX 辅助文件（`.aux`, `.log`, `.out`, `.toc`, `.nav`, `.snm`, `.xdv` 等） |
| `status` | 查看每个 `.tex` 文件对应的 PDF 状态（存在/缺失/大小） |

**编译命令规范**：`xelatex -interaction=nonstopmode -halt-on-error <文件>.tex` 两遍，随后清理辅助文件。Beamer 文件额外生成 `.nav` 和 `.snm`，也需清理。

#### `/update-agent-docs` — 更新 Agent 子模块 PDF 文档

重新编译 `~/lattice-pdf/agent/文档/` 下三个依赖库的 LaTeX PDF（LQCD_Master、lamet-agent、PyQUDA）。

| 子命令 | 用途 |
|---|---|
| `all` | 重编译全部三个 PDF |
| `LQCD_Master` | 仅重编译 LQCD Master 文档 |
| `lamet-agent` | 仅重编译 lamet-agent 文档 |
| `PyQUDA` | 仅重编译 PyQUDA 文档 |
| `deps` | 先 `git pull --ff-only` 更新三个子模块源码，再编译全部文档 |
| `status` | 查看三个 PDF 的当前状态（文件大小、页数） |

等价脚本：`agent/update_docs.sh`（全功能）、`agent/update_deps.sh`（仅源码更新）。

#### `/generate-and-update` — 主 Skill（统一入口）

`~/lattice-pdf/agent/.claude/skills/generate-and-update.md` — 统一管理 `~/lattice-pdf/` 下所有文档（LaTeX PDF）、Python 代码和依赖库文档的生成与编译。封装了上述两个 skill 的全部功能。

#### `/update-deps-docs` — 依赖库文档更新

`~/lattice-pdf/agent/.claude/skills/update-deps-docs.md` — 功能与 `/update-agent-docs` 等价，位于 agent 子目录下。

---

### Skill 全景

| Skill | 项目 | 位置 |
|---|---|---|
| `/build-website` | 网站 | `.claude/skills/build-website.md` |
| `/update-website` | 网站 | `.claude/skills/update-website.md` |
| `/compile-latex` | 胶子PDF | `~/lattice-pdf/.claude/skills/compile-latex.md` |
| `/update-agent-docs` | 胶子PDF | `~/lattice-pdf/.claude/skills/update-agent-docs.md` |
| `/generate-and-update` | 胶子PDF | `~/lattice-pdf/agent/.claude/skills/generate-and-update.md` |
| `/update-deps-docs` | 胶子PDF | `~/lattice-pdf/agent/.claude/skills/update-deps-docs.md` |

## 架构

- 单页应用 (SPA)，Vanilla JS 模块化，部署于 GitHub Pages
- 中英文切换 (`i18n.js`)、深色/浅色模式 (`theme.js`)
- Canvas 粒子动画背景：深色=星场、浅色=樱花雨
- 论文数据源：`data/papers.json`（唯一数据源；更新时从 INSPIRE-HEP API 拉取并写入此文件）
- CSS：2331 行，基于 Bulma 0.9.x（本地 `bulma.min.css`），自定义属性系统实现深色/浅色模式切换，响应式断点 1024/768/600/480px

### `index.html` 板块索引

| `id` | 板块 | 渲染方式 |
|---|---|---|
| `#hero` | 首页大屏 | HTML（Canvas 动画背景，2个canvas重叠） |
| `#about` | 关于我们 | HTML（滚动图库动态填充） |
| `#advisors` | 导师 | HTML 静态内容 |
| `#research` | 研究方向 | HTML 静态内容 |
| `#publications` | 论文 | JS 动态渲染（`papers.js`） |
| `#students` | 研究生 | JS 动态渲染（`loadStudents()`） |
| `#conferences` | 会议 | JS 动态渲染（`loadConferences()`） |
| `#summer-schools` | 讲习班 | JS 动态渲染（`loadSummerSchools()`） |
| `#software` | 软件工作 | HTML（幻灯片 JS 驱动） |
| `#gallery` | 图库 | JS 动态填充（`populateGallery()`） |
| `#help` | 帮助反馈 | HTML 静态内容（背景图 QCD涨落图.gif） |

### 数据文件三层结构

```
数据.csv          ← 全站数据汇总，手动修正的入口
    │                （CSV格式：分类、项目、中文、英文、备注）
    ▼
data_summary.json ← 机器可读摘要，由 /update-website summary 生成
    │                （JSON格式：site_info、papers_count、students[]等）
    │
    ├── data/papers.json       ← 运行时数据源（papers.js 唯一加载）
    ├── data/conferences.json  ← 运行时数据源（index.js loadConferences()）
    ├── data/summer-schools.json ← 运行时数据源（index.js loadSummerSchools()）
    └── data/translations.json ← 运行时数据源（i18n.js 加载）
```

修改流程：编辑 `数据.csv` → 运行 `/update-website summary` → 对应的 JSON 文件同步更新 → 推送部署。

### 论文离线回退

`custom/inspirehep.net/authors/{1659207,1259106}/INSPIRE-CiteAll.html` 是 INSPIRE-HEP 的离线 HTML 缓存（两位导师的完整发表列表）。当 INSPIRE-HEP API 不可用时作为备选数据源。HTML 解析规则见 `.claude/skills/build-website.md` 步骤 8。

⚠️ `custom/讲习班.html` 存在于仓库中但**已废弃** — 运行时仅加载 `data/summer-schools.json`。

## 本地开发

```bash
python3 -m http.server 8000
# 访问 http://localhost:8000
```

无需构建工具 — 纯静态站点，直接通过 HTTP 服务预览。

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
| `数据.csv` | 全站数据汇总（手动修正入口） |
| `data_summary.json` | 数据摘要（机器可读，由 `/update-website summary` 生成） |

注意：代码中引用的 `要求.json` 文件不存在于仓库中 — 实际需求规范已整合到 `.claude/skills/build-website.md`。

## JS 模块模式与通信

所有 JS 模块使用 **IIFE** 模式，各自独立初始化（在 `DOMContentLoaded` 时自动执行），不需要显式调用 `init()`。模块间通过以下方式通信：

- **全局命名空间**：`I18N`、`Theme`、`Papers`、`MusicPlayer`、`Animations` 挂载在 `window` 上
- **自定义事件**：语言切换时 `i18n.js` 派发 `langChanged` CustomEvent（`index.js` 和 `papers.js` 监听它以重新渲染动态内容）
- **模块加载顺序**（`index.html` 中 `defer` 脚本顺序）：i18n → theme → music → papers → animations → index

`index.js` 作为主控制器，负责初始化 UI 交互（搜索、幻灯片、lightbox）并调用各数据加载函数。

## 动态内容渲染

`index.js` 中三个函数负责动态渲染：

- `loadConferences()` — 读取 `data/conferences.json`，**按地点过滤**（只保留中国学术机构，通过 `CHINA_KEYWORDS` 数组匹配），按日期降序，分"即将举行/已举办"
- `loadSummerSchools()` — 读取 `data/summer-schools.json`，按日期降序渲染卡片（不加载 `custom/讲习班.html`）
- `loadStudents()` — 轮询 `Papers.getStudents()`（最多等待 10 秒），渲染学生卡片

这三个函数都在 `langChanged` 事件触发时重新执行以支持语言切换。

## 论文数据流

```
INSPIRE-HEP API (手动触发)
  → data/papers.json (唯一运行时数据源，含 papers[] + students[])
  → papers.js 加载并渲染
```

**关键规则**：
- `papers.json` 是 papers.js 的**唯一数据源** — 不直接从 INSPIRE-HEP 实时获取
- 论文搜索：仅搜索标题和期刊关键词，无其他筛选按钮
- 分页：初始 20 篇，每次"加载更多"+20 篇
- 统计数据（`stat-card` 中的计数器和引用数）由 `papers.js` 动态更新
- `isFirstUnitIMP` 字段标记论文第一单位是否为 IMP，仅影响标记显示，不影响列表展示

## 关键设计约束

- **会议地点**：必须在中国，单位必须为中国科学院的研究所（由 `index.js` 中 `CHINA_KEYWORDS` 数组过滤）
- **讲习班**：数据仅来源于 `data/summer-schools.json`
- **背景透明度规则**：普通 section 背景透明（Canvas 粒子上层），`#help` section 使用 QCD涨落图.gif 叠加 0.35 遮罩，navbar 使用 rgba(255,255,255,0.35) + blur(12px) 毛玻璃效果
- **Canvas 动画节能**：仅当前活跃主题对应的 canvas 运行 rAF 循环，主题切换通过 `MutationObserver` 监听 `data-theme` 属性自动重启/停止

## 部署

GitHub Pages 从 `main` 分支部署。推送即可自动更新。

```bash
git push origin main
```

必需文件：`.nojekyll`（禁用 Jekyll 处理）、`CNAME`（自定义域名）。
