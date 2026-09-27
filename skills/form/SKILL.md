---
name: form
description: |
  当用户要求审计或整改 lattice-qcd-at-imp.top 的命名、目录结构、静态资源布局、
  文档/日志/数据/测试格式、仓库清洁度或 Git 交付格式时使用。
metadata:
  openclaw:
    emoji: 📐
---

# form — lattice-qcd-at-imp.top 格式治理

遵循本库根 `AGENTS.md` 的 form 章节；本库为 simple，运行时主导语言为
HTML/CSS/JavaScript，维护工具为 Python 与 Node.js。全局决策参考
`/root/configure/skills/form/references/`；本库目录白名单、例外、验证命令以根
`AGENTS.md` 为准。

## 执行前置

1. 从 Git 根目录工作，不访问仓库外无关内容。
2. 工作区已有改动时先区分用户改动与本任务改动，不得覆盖来源不明的修改。
3. 把运行时资源、历史日志、任务文档、生成资源和临时产物分开审计。
4. 所有删除、移动和公开接口改名必须在计划中列出，并提供 Git 恢复点。

## 核心规则

- 本地文件：JS/CSS 全小写；Python 使用 `snake_case`；测试入口按
  `<功能>.test.js` 或 `*.test.sh` 命名。
- JS 符号：模块/单例 `PascalCase`，函数与变量 `camelCase`，事件名和公开全局命名空间
  视为兼容接口，除非全库引用同步修改。
- Python 符号：函数与变量 `snake_case`，模块常量 `UPPER_SNAKE_CASE`。
- 内容资源：中文含义优先，多词用 `_`；禁止空格。`custom/inspirehep.net/**` 保留上游路径。
- 顶层职责：`custom/` 运行时内容，`data/` 运行时 JSON，`static/` 前端资源，
  `tools/` 维护工具，`docs/` 任务文档，`logs/` 历史与任务日志，`skills/` 本地技能。
- 根目录 `数据.csv` 与 `data_summary.json` 是数据工作流入口，不得挪动。
- `static/**` 的 vendored/minified 文件及标准平台文件不得为了统一风格重命名。

## 工作流程

1. 锁定 Git 根目录、分支、远端、近期标签和工作区状态。
2. 盘点已跟踪文件、顶层目录和未跟踪内容，运行：

```bash
FORM_SKILL_DIR=skills/form
"$FORM_SKILL_DIR/scripts/form-audit.sh" --root "$PWD" --quiet
"$FORM_SKILL_DIR/scripts/form-snapshot-verify.sh" --quiet
"$FORM_SKILL_DIR/scripts/form-scripts.test.sh"
```

3. 建立命名、目录、引用、清理和验证冲突表；自动审计输出必须人工复核，不能直接批量改名。
4. 按“移动/清理 → 引用与文档 → 本地规则 → 功能验证”的顺序分批实施。
5. 每批完成后运行最小验证，全部完成后运行：

```bash
for f in static/js/i18n.js static/js/theme.js static/js/music.js \
  static/js/papers.js static/js/animations.js static/js/index.js tools/fa.test.js; do
  node --check "$f"
done
python3 -m py_compile tools/fa_coverage.py tools/fa_subset.py tools/fa_verify.py tools/optimize_images.py
node tools/fa.test.js
python3 tools/fa_coverage.py
python3 tools/fa_verify.py
FORM_SKILL_DIR=skills/form
"$FORM_SKILL_DIR/scripts/form-audit.sh" --root "$PWD" --strict --quiet
"$FORM_SKILL_DIR/scripts/form-snapshot-verify.sh" --quiet
"$FORM_SKILL_DIR/scripts/form-scripts.test.sh"
git diff --check
```

6. 使用本地 HTTP 服务检查 `index.html`、`data/*.json` 和 `custom/**` 的引用完整性。
7. 只暂存本任务文件；提交消息说明原因、改动和验证，禁止 `git add -A`。
8. 推送后核验本地分支、远端分支和最终标签指向同一验收提交。

## 清理边界

- `logs/` 只保留历史/任务日志；`docs/` 只保留任务文档和图片附件。
- `.DS_Store`、临时备份、重复生成物和已废弃且无引用文件列入清理计划后删除。
- vendor/minified、运行时 JSON、离线论文回退页和历史日志默认保留。
- 删除前用 `git show HEAD:<path>` 确认对象存在；恢复使用
  `git restore --source=<revision> -- <path>`。

## 错误处理

- 活跃依赖中出现旧路径：停止移动，先同步全部引用再验证。
- 工作区存在无法分离的用户改动：停止写操作并报告冲突文件。
- 验证失败：定位最早失败点，修复根因后重跑，不删除测试或篡改期望值绕过。
- 分支或标签漂移：停止自动修正，保留本地结果并报告远端对象状态。
- 规则与运行时路径冲突：保留可部署功能，建立具名本地例外并写入根 `AGENTS.md`。
