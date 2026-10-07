# NexbitAl 双版本文档部署

## 版本对应

| 版本标识 | 下拉展示 | 正式链接 |
| --- | --- | --- |
| latest | Advanced Kit Version | https://wiki.hiwonder.com/projects/NexbitAl/en/latest/ |
| standard | Standard Kit Version | https://wiki.hiwonder.com/projects/NexbitAl/en/standard/ |

版本标识用于内容目录、构建参数和 URL；请统一使用 `latest` 和 `standard`。

## 内容结构

```text
content/
├── latest/
│   ├── docs/        # 1–7 章、Appendix、首页 index.md
│   └── _static/     # 高级版资源
└── standard/
    ├── docs/        # 1–6 章、Appendix、首页 index.md
    └── _static/     # 标准版资源
```

高级版第 6 章为 Robotic Gripper Expansion Projects，第 7 章为 Software and Hardware Guide。
标准版第 6 章为 Software and Hardware Guide；两版内容及资源独立维护，侧边栏从各自 Markdown 自动生成。

两版 `docs/index.md` 都使用以下入口，构建脚本将其复制到站点根首页，跳转至该版本用户手册：

```markdown
---
layout: page-redirect
redirectTo: /docs/1. Nexbit AI User Manual.html
---

Redirecting to content page...
```

## 开发和构建

```bash
npm ci
npm run dev:latest
# 关闭高级版预览后，预览标准版
npm run dev:standard

# 单版构建并整理发布产物
npm run build:latest
npm run build:standard

# 双版构建（必须串行）
npm run build:all
```

脚本先检查内容入口和资源目录，再复制到共享 `docs/` 工作目录，并设置：

- `DOCS_VERSION=latest` 或 `standard`
- `DOCS_BASE=/projects/NexbitAl/en/<version>/`

构建完成后，仅替换对应版本的产物目录，并还原 `docs/index.md`。
普通 PNG/JPEG 转为 WebP；宽或高超过 16383 像素的长图保留原文件，避免超过 WebP 格式上限。
转换缓存放在 `docs/.vitepress/cache/webp/`，按图片内容和转换参数生成键，复用两版共有资源。
整理脚本在覆盖产物前检查构建路径与目标版本是否匹配，防止把标准版复制到高级版目录。

## 发布目录

```text
index.html
.nojekyll
projects/NexbitAl/en/
├── latest/
│   ├── index.html
│   ├── assets/
│   └── docs/
└── standard/
    ├── index.html
    ├── assets/
    └── docs/
```

提交源内容 `content/`、配置主题 `docs/.vitepress/`、`docs/index.md`、构建脚本及完整发布产物。
忽略 `node_modules/`、`docs/docs/`、`docs/_static/`、VitePress 的 `dist/` 和 `cache/`。

GitHub Pages 使用 main 分支的仓库根目录部署。正式服务器应提供两个版本路径，并同步完整发布目录。
部署后分别检查版本首页、用户手册、侧边栏、图片、搜索以及桌面和手机的下拉切换；切换将打开目标版本首页。
