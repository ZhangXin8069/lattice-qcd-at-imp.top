# AGENTS.md — data/

网站运行时数据 JSON（JS 通过 fetch('data/*.json') 加载）。

- `papers.json` — 论文唯一数据源（papers.js 加载，INSPIRE-HEP API 拉取，/update-website papers）
- `conferences.json` — 会议（运行时按中国机构过滤，CHINA_KEYWORDS）
- `summer-schools.json` — 讲习班（custom/讲习班.html 已废弃，运行时只加载此 JSON）
- `translations.json` — i18n 字典（语言切换文案）

修改流程：编辑根目录 `数据.csv` → `/update-website summary` → JSON 同步。
