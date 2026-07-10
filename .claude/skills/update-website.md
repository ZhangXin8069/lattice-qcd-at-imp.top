---
name: update-website
description: 全流程更新格点QCD课题组网站 (Update Lattice QCD Group website)
---

# 网站更新 Skill

一键更新格点量子色动力学课题组网站的各项内容。所有修改自动反映在 `index.html`、数据文件和资源文件中。

## 数据架构

- **论文**: 优先从 `custom/inspirehep.net/authors/{id}/INSPIRE-CiteAll.html` 离线数据加载。离线不可用时回退到 INSPIRE-HEP API。所有论文量不限第一单位，限第一作者与通讯作者。
- **研究生**: 硬编码列表（要求.json 中指定），从论文数据中计算参与论文数
- **会议**: 数据存储于 `data/conferences.json`，仅包含中国境内中国科学院研究所主办的会议
- **夏令营**: 数据来源于 `custom/夏令营补充.html`，按日期排列，仅包含中国境内中国科学院研究所主办的活动

## 子命令

### `update-website papers`
**更新论文数据**
1. 更新 `custom/inspirehep.net/authors/` 中的离线HTML缓存（从INSPIRE-HEP下载）
2. 如离线数据不可用，从 INSPIRE-HEP API 获取最新论文
3. 刷新 `data_summary.json` 中的论文统计

### `update-website add-conference`
**添加学术会议**
1. 提示输入会议信息（中英文名称、日期、地点、链接、标签）
2. 地点必须为中国，单位必须为中国科学院的研究所
3. 添加到 `data/conferences.json`
4. 刷新 `data_summary.json`

### `update-website add-summer-school`
**添加夏令营/讲习班**
1. 更新 `custom/夏令营补充.html` 添加新链接
2. 地点必须为中国，单位必须为中国科学院的研究所
3. 刷新 `data_summary.json`

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
1. 修改硬编码研究生列表（在 `static/js/papers.js` 的 `STUDENT_LIST`）
2. 论文数量由系统自动计算
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
| `data/conferences.json` | 学术会议列表（中国/CAS限定） | JSON |
| `data/summer-schools.json` | 夏令营/讲习班列表（参考） | JSON |
| `data/translations.json` | 中英文翻译字典 | JSON |
| `data_summary.json` | 全站数据汇总（手动修正用） | JSON |
| `custom/inspirehep.net/authors/` | INSPIRE-HEP 离线缓存（优先使用） | HTML |
| `custom/夏令营补充.html` | 夏令营/讲习班主要数据源 | HTML |

## 关键要求

- **论文优先级**: 离线数据 > INSPIRE-HEP API > 静态JSON备份
- **论文计数**: 不限第一单位，限第一作者与通讯作者
- **累计引用**: 导师累计引用量之和
- **会议/夏令营**: 地点必须为中国，单位必须为中国科学院的研究所
- **背景**: 主页动效作为所有section背景（help section除外，0.85透明度）
- **全局搜索**: 支持Ctrl+K或/快捷键
- **背景音乐**: 自动播放，每次刷新随机初始曲目
- **数据修正**: 所有数据汇总到根目录 `data_summary.json` 可供手动修正

## 注意事项

- 所有更改后建议本地预览 (`python3 -m http.server 8000`)
- 确认无误后 commit 并 push 到 GitHub Pages
- `data_summary.json` 可作为手动修正数据的入口文件
