# AGENTS.md — lattice-qcd-at-imp.top

格点量子色动力学课题组网站（中国科学院近代物理研究所 IMP, CAS）→ https://lattice-qcd-at-imp.top。GitHub Pages 静态站点，SPA，Vanilla JS 模块化，中英文切换（i18n），深色/浅色模式。

## 技能（权威参考）

`.claude/skills/` 下两个技能（已归集到 `/root/.opencode/skills/`，此处原文件已归档为 `.claude.md.<ts>.bak`）：

- **build-website**：从零完整构建网站（11 步：初始化、Bulma 0.9.x CSS、`index.html` SPA、`custom/data/translations.json`、JS 模块、数据文件、离线论文、媒体资源、本地预览、部署 GitHub Pages）
- **update-website**：内容更新。子命令 `papers`（INSPIRE-HEP API → `custom/data/papers.json`）、`add-conference`（限中国 CAS 研究所）、`add-summer-school`、`advisor`、`students`、`translations`、`software`、`theme`、`summary`、`assets`、`all`

**导师 INSPIRE-HEP ID**：孙鹏 `1659207`、刘柳明 `1259106`。

## 架构要点

- 单页应用，`index.html` 为唯一页面；JS 模块 IIFE + `window` 全局命名空间（`I18N`/`Theme`/`Papers`/`MusicPlayer`/`Animations`），`langChanged` 自定义事件通信；defer 加载顺序：i18n → theme → music → papers → animations → index
- CSS 2331 行基于 Bulma 0.9.x（本地 `bulma.min.css`），自定义属性系统 + 响应式断点 1024/768/600/480px；Canvas 动画背景：深色=星场、浅色=樱花雨
- 板块 `#hero #about #advisors #research #publications #students #conferences #summer-schools #software #gallery #help`

## 数据三层结构

```
数据.csv  ← 手动修正入口（分类、项目、中文、英文、备注）
  ▼ /update-website summary
data_summary.json ← 机器可读摘要
  ├── custom/data/papers.json        ← 论文唯一数据源（papers.js 加载，INSPIRE-HEP API 拉取）
  ├── custom/data/conferences.json   ← 会议（运行时按中国机构过滤，CHINA_KEYWORDS）
  ├── custom/data/summer-schools.json← 讲习班
  └── custom/data/translations.json  ← i18n 字典
```

修改流程：编辑 `数据.csv` → `/update-website summary` → JSON 同步 → 推送部署。

**注意**：代码引用的 `要求.json` 不存在于仓库（需求规范在 build-website 技能内）。

## 本地开发

```bash
python3 -m http.server 8000    # 纯静态，无需构建
```

离线论文回退：`custom/inspirehep.net/authors/{1659207,1259106}/INSPIRE-CiteAll.html`。

## 版本标签（tag 技能约定）

四类独立编号注释标签，文法 `^(stab|dev|bug|test)[0-9]+(_[0-9]+)?$`：

- `stab<N>` 稳定里程碑 / `dev<N>` 开发快照 / `bug<N>` 修复标记 / `test<N>` 测试标记（计数器从 0 独立递增，子版本如 `stab15_1` 仅显式请求）
- 消息格式：`follow <前一标签>, 1. 变更项; 2. ...; [opencode].`

## 会话产物（不入库）

`.agent.*.log`、`.tag.*.log`、`.init.*.log`、`.agent.*.list`（用户输入记录）为 agent 会话产物，不入库；`.gitignore` 已忽略 `*.log` 与 `.agent.*.list`。

## form 格式约定

- 库类型：simple；运行时主导语言为 HTML/CSS/JavaScript，维护工具为 Python 与 Node.js。
- 顶层目录白名单：`custom/`、`data/`、`docs/`、`logs/`、`skills/`、`static/`、`tools/`。
- 根目录允许文件：平台入口与标准文件（`index.html`、`CNAME`、`LICENSE`、`README.md`、`AGENTS.md`、`.gitignore`、`.nojekyll`）、手动数据入口 `数据.csv`、生成摘要 `data_summary.json`。
- 文件命名：本地 JS/CSS 使用全小写点划分或 `-`；Python 使用全小写 `_`；运行时 JSON 使用全小写 `-`；新增内容文件禁止空格。
- 函数命名：JS 使用 `camelCase`；Python 使用 `snake_case`。
- 变量命名：JS 普通变量使用 `camelCase`，固定集合可使用 `UPPER_SNAKE_CASE`；Python 模块常量使用 `UPPER_SNAKE_CASE`。
- 对象命名：JS IIFE 模块/单例使用 `PascalCase`，专有缩写保持原形，如 `I18N`、`MusicPlayer`。
- 测试入口：`node tools/fa.test.js`、`python3 tools/fa_coverage.py`、`python3 tools/fa_verify.py`、`skills/form/scripts/form-scripts.test.sh`。
- 功能复现：先执行 `node --check` 与 `python3 -m py_compile`，再运行上述测试及 `FORM_SKILL_DIR=skills/form skills/form/scripts/form-audit.sh --root "$PWD" --strict --quiet`；本地预览使用 `python3 -m http.server 8000`，并验证 `index.html`、`custom/data/*.json` 和其他 `custom/` 资源均可访问。
- 文档/日志/数据：`docs/` 保存任务 Markdown、TeX、PDF 和图片；`logs/` 只保存 `log/json/tsv/csv/txt`；`custom/data/` 保存网站运行时 JSON，`data/` 仅保留目录约束说明，`数据.csv` 与 `data_summary.json` 是根目录数据工作流入口。
- Git 交付：常规整改按逻辑批次提交并推送当前分支；禁止 `git add -A`、force push、改写已推送标签。最终使用 `devN` 注释标签指向验收提交。
- 本地例外：`custom/` 是运行时内容树，`custom/data/*.json` 必须跟踪；`data/` 不得跟踪运行时 JSON；`logs/AGENTS.md` 是目录规则元数据，不受日志内容扩展名限制；`static/**` 中 vendored/minified 文件与 `custom/inspirehep.net/**` 保留上游名称；中文内容文件名允许保留中文，但空格必须替换为 `_`；`CNAME`、`LICENSE` 使用平台/标准固定名称。
