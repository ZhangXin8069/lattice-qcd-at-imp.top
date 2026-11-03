# AGENTS.md — logs/

历史 CI 与任务日志，只允许 `log/json/tsv/csv/txt`：

- `logs_77854265053/`、`logs_77854265054/` — 2026 年 GitHub Pages 构建/部署历史。

历史日志内容按原样保留，不因目录或文件名规范化而重写；新增日志不得含空格，且不能作为运行时数据源。
## 2026-11-03 数据路径迁移 - final - 2026-11-03 16:44:53 +0800
- 主任务: 迁移网站运行时 JSON 到 custom/data
- 日志文件: logs/v2026110316.txt
- 文件大小: 6059 bytes
- 触发原因: 任务完成
- 关键内容: 迁移四个 JSON，同步运行时、规则、文档和审计引用；相关测试与 HTTP 冒烟通过
- 验证: path, size, required sections, conflict markers
- 批次状态: complete
