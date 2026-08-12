---
name: update-website
description: 全流程更新格点QCD课题组网站 (Update Lattice QCD Group website)
---

# 网站更新 Skill — 全流程

一键更新格点量子色动力学课题组网站的各项内容。所有修改自动反映在 `index.html`、数据文件、资源文件和 `数据.csv` 中。

## 网站架构

```
lattice-qcd-at-imp.top/
├── index.html              # 主页面（单页应用）
├── 数据.csv                # 全站数据汇总（手动修正用）
├── data_summary.json       # 数据摘要（机器可读）
├── data/
│   ├── papers.json         # 论文静态备份（离线回退）
│   ├── conferences.json    # 学术会议列表（中国CAS研究所）
│   ├── summer-schools.json # 讲习班列表
│   └── translations.json   # 中英文翻译字典
├── custom/
│   ├── inspirehep.net/authors/  # INSPIRE-HEP离线缓存
│   ├── 讲习班.html              # 讲习班参考链接
│   ├── *.mp3                    # 背景音乐
│   ├── *.png/*.gif              # 图片资源
│   └── *.pdf                    # PDF文档
├── static/
│   ├── css/index.css       # 主样式（Bulma + 自定义）
│   └── js/
│       ├── i18n.js          # 国际化（中英文切换）
│       ├── theme.js         # 深色/浅色模式切换
│       ├── music.js         # 背景音乐播放器
│       ├── papers.js        # 论文数据加载与展示
│       ├── animations.js    # Canvas粒子动画与滚动动效
│       └── index.js         # 主控制器（搜索、幻灯片、导航等）
└── .claude/skills/update-website.md  # 本文件
```

## 数据流

1. **论文**: INSPIRE-HEP API → localStorage缓存 → custom/离线HTML → data/papers.json
2. **会议/讲习班**: data/*.json 静态文件 → JS动态渲染
3. **翻译**: data/translations.json → i18n.js applyTranslations()
4. **汇总**: 所有数据源 → 数据.csv（手动修正） → data_summary.json（机器可读）

## 子命令

### `update-website papers`
**更新论文数据**
1. 从 INSPIRE-HEP API 获取两位导师最新论文（BAI: Peng.Sun.1, Liuming.Liu.1）
2. 生成 `data/papers.json`（包含论文详情+学生数据）
3. 同步更新 `数据.csv` 论文汇总
4. 更新 `data_summary.json`

### `update-website add-conference`
**添加学术会议**（必须在中国、由中国科学院研究所主办）
1. 提示输入：中英文名称、日期、地点（中国城市+研究所）、链接、标签
2. 添加到 `data/conferences.json`
3. 更新 `数据.csv`
4. 更新 `data_summary.json`

### `update-website add-summer-school`
**添加讲习班**
1. 提示输入：中英文名称、日期、地点（中国科学院研究所）、主题、链接
2. 添加到 `data/summer-schools.json`
3. 更新 `数据.csv`
4. 更新 `data_summary.json`

### `update-website advisor`
**更新导师信息**
1. 导师链接（按顺序）：
   - 孙鹏: https://people.ucas.ac.cn/~sunpengimp (个人主页) + https://inspirehep.net/authors/1659207 (INSPIRE-HEP)
   - 刘柳明: https://people.ucas.ac.cn/~liuliuming (个人主页) + https://inspirehep.net/authors/1259106 (INSPIRE-HEP)
2. 修改 `index.html` 中的导师section（头像、信息、三个链接）
3. 更新 `data/translations.json` 中的导师翻译（包括 advisors.homepage 键）
4. 更新 `数据.csv`
5. 更新 `data_summary.json`

### `update-website students`
**更新研究生信息**
1. 当前学生名单（来自要求.json，硬编码在 papers.js）：
   - Kuan Zhang
   - Hanyang Xing
   - Chen Chen
   - Yiqi Geng
   - Chunhua Zeng
   - Zhi-Cheng Hu
   - Hongxin Dong
   - Zhicheng Yan
2. 修改 `static/js/papers.js` 中的 STUDENT_NAMES 数组
3. 更新 `数据.csv`
4. 更新 `data_summary.json`

### `update-website translations`
**更新翻译**
1. 修改 `data/translations.json` 中的中英文键值对
2. 确保所有 `data-i18n` 属性匹配翻译键
3. 验证 `index.html` 中新增内容有对应翻译

### `update-website software`
**更新软件工作**
1. 修改 `index.html` 中软件工作区（PyQCU、测试报告、贡献度）
2. 更新工作汇报幻灯片图片列表
3. 更新 `数据.csv`
4. 更新 `data_summary.json`

### `update-website theme`
**更新主题/背景设置**（参考：https://web-animations.github.io/web-animations-demos/#starfield/starfield-indiv.html）
1. 深色模式：星场动画 (starfield) — canvas粒子+发光+星座连线+偶发流星
2. 浅色模式：白底樱花雨 — 五瓣樱花形状，斜向下飘落，有旋转和摇摆
3. 主页背景：主页动效作为背景（全局canvas粒子动画覆盖所有section）
4. 背景透明度：
   - 主页动效作为背景 → 不透明（section background = var(--background-primary), opacity=1.0）
   - 非主页动效（help section 用 QCD涨落图.gif）→ 0.35 opacity, navbar → 0.35
5. 背景音乐：MP3自动播放，每次刷新随机选定初始音乐，随机洗牌模式

### `update-website summary`
**重新生成数据汇总**
1. 扫描所有数据文件，重新统计
2. 更新 `数据.csv` 
3. 更新 `data_summary.json`
4. 验证所有引用的资源文件存在

### `update-website assets`
**管理媒体资源**
1. 检查 `custom/` 目录下资源文件
2. 验证 `index.html` 中引用的图片/视频/PDF 存在
3. 为缺失资源生成带描述的占位符

### `update-website all`
**全量更新**（按顺序）:
papers → conferences → summer-schools → students → translations → summary → assets

## 使用示例

```
/update-website papers              # 刷新论文数据
/update-website add-conference      # 添加新会议
/update-website add-summer-school   # 添加新讲习班
/update-website all                 # 全量同步
```

## 部署流程

1. 本地修改 → `python3 -m http.server 8000` 预览
2. 确认无误 → `git add -A && git commit -m "message" && git push`
3. GitHub Pages 自动部署 → https://lattice-qcd-at-imp.top

## 注意事项

- `数据.csv` 是手动修正数据的入口文件——修改后需运行 `update-website summary` 同步
- 所有参考链接必须附上超链接（`要求.json` 额外要求）
- 会议地点必须在中国，单位必须为中国科学院的研究所（index.js中CHINA_KEYWORDS过滤）
- 讲习班地点必须在中国，单位必须为中国科学院的研究所（index.js中CHINA_KEYWORDS过滤）
- 讲习班按日期降序排列
- 讲习班数据仅来源于 data/summer-schools.json（不加载讲习班.html）
- 论文数据仅来源于 data/papers.json
- 论文展示：全部146篇，加载更多分页（初始20篇）
- 论文计数和引用计数规则：不限第一单位，限第一作者与通讯作者
