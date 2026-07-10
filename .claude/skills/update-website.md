---
name: update-website
description: 全流程更新格点QCD课题组网站 (Update Lattice QCD Group website)
---

# 网站更新 Skill

一键更新格点量子色动力学课题组网站的各项内容。所有修改自动反映在 `index.html`、数据文件和资源文件中。

## 子命令

### `update-website papers`
**更新论文数据**
1. 从 INSPIRE-HEP API 获取最新论文数据
2. 如 API 不可用，从 `custom/inspirehep.net/authors/` 读取离线数据
3. 更新 `data/papers.json` 静态备份
4. 刷新 `data_summary.json` 中的论文和研究生统计

### `update-website add-conference`
**添加学术会议**
1. 提示输入会议信息（中英文名称、日期、地点、链接、标签）
2. 添加到 `data/conferences.json`
3. 刷新 `data_summary.json`

### `update-website add-summer-school`
**添加夏令营/讲习班**
1. 提示输入讲习班信息（中英文名称、日期、地点、主题、链接）
2. 添加到 `data/summer-schools.json`
3. 更新 `custom/夏令营补充.html` 补充链接
4. 刷新 `data_summary.json`

### `update-website advisor`
**更新导师信息**
1. 修改 `index.html` 中导师卡片的文本和图片
2. 更新 `data/translations.json` 中的导师翻译
3. 刷新 `data_summary.json`

### `update-website translations`
**更新翻译**
1. 修改 `data/translations.json` 中的中英文翻译键值
2. 确保新增内容的翻译完整性

### `update-website software`
**更新软件工作**
1. 修改 `index.html` 中软件工作区内容
2. 更新工作汇报幻灯片图片列表
3. 刷新 `data_summary.json`

### `update-website students`
**更新研究生信息**
1. 从论文作者数据中重新分析研究生列表
2. 手动添加/修正研究生信息
3. 刷新 `data_summary.json`

### `update-website summary`
**重新生成数据汇总**
1. 扫描所有数据文件
2. 重新生成 `data_summary.json`
3. 验证所有引用的资源文件存在性

### `update-website assets`
**管理媒体资源**
1. 检查 `custom/` 目录下的资源文件
2. 验证 HTML 中引用的图片/视频/PDF 文件存在
3. 为缺失资源生成占位符

### `update-website all`
**全量更新**
按顺序执行: papers → conferences → summer-schools → students → summary → assets

## 使用示例

```
/update-website papers              # 刷新论文数据
/update-website add-conference      # 添加新会议
/update-website all                 # 全量同步
```

## 数据文件说明

| 文件 | 用途 | 格式 |
|------|------|------|
| `data/papers.json` | 论文静态备份（离线回退） | JSON |
| `data/conferences.json` | 学术会议列表 | JSON |
| `data/summer-schools.json` | 夏令营/讲习班列表 | JSON |
| `data/translations.json` | 中英文翻译字典 | JSON |
| `data_summary.json` | 全站数据汇总（手动修正用） | JSON |
| `custom/inspirehep.net/authors/` | INSPIRE-HEP 离线缓存 | HTML |
| `custom/夏令营补充.html` | 夏令营补充链接 | HTML |

## 注意事项

- 所有更改后建议本地预览 (`python3 -m http.server 8000`)
- 确认无误后 commit 并 push 到 GitHub Pages
- `data_summary.json` 可作为手动修正数据的入口文件
