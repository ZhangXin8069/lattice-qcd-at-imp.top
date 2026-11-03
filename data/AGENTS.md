# AGENTS.md — data/

本目录是 Git 数据跟踪护栏保护的元数据目录，不再保存站点运行时 JSON。

`data/` 只允许跟踪 `.gitignore`、`AGENTS.md` 和 `README.md`；运行时 JSON 统一存放于
`custom/data/`，由 JS 通过 `fetch('custom/data/*.json')` 加载。

- `custom/data/papers.json` — 论文唯一数据源（papers.js 加载，INSPIRE-HEP API 拉取，/update-website papers）
- `custom/data/conferences.json` — 会议（运行时按中国机构过滤，CHINA_KEYWORDS）
- `custom/data/summer-schools.json` — 讲习班（运行时只加载此 JSON）
- `custom/data/translations.json` — i18n 字典（语言切换文案）

修改流程：编辑根目录 `数据.csv` → `/update-website summary` → JSON 同步。
