# Nexbit AI Documentation

NexbitAl 的 VitePress 文档站点，包含两个独立版本：

| 下拉展示名称 | 内容目录 | 发布地址 |
| --- | --- | --- |
| Advanced Kit Version | `content/latest/` | https://wiki.hiwonder.com/projects/NexbitAl/en/latest/ |
| Standard Kit Version | `content/standard/` | https://wiki.hiwonder.com/projects/NexbitAl/en/standard/ |

## 本地开发

首次使用运行 `npm ci`，然后选择要预览的版本：

```bash
npm run dev:latest
npm run dev:standard
```

`npm run docs:dev` 默认预览高级版。两个开发服务请分别启动和关闭，避免覆盖共享工作目录。
修改正文和图片时，编辑 `content/<version>/docs/` 和 `content/<version>/_static/`，再重启预览。`docs/docs/`、`docs/_static/` 是自动生成的工作副本。

## 构建

```bash
npm run build:latest
npm run build:standard
# 发布前顺序构建两个版本
npm run build:all
```

每个命令都会完成内容复制、VitePress 构建、图片 WebP 转换和产物整理（超过 WebP 尺寸上限的长图保留原格式），输出到 `projects/NexbitAl/en/<version>/`。
`npm run docs:build` 等同于构建高级版；`npm run docs:preview` 预览最近一次构建的版本。

## 发布

部署目录包含仓库根目录 `index.html`、`.nojekyll` 和完整 `projects/`，两个版本必须同时保留。
GitHub Pages 可选择 **Deploy from a branch → main → /(root)**；根目录入口使用相对链接，兼容仓库子路径。
正式域名需要服务器或 Nginx 将两个发布路径映射到对应的构建目录。构建完成不等于线上已发布。

更多细节见 [MULTI_VERSION_DEPLOY.md](MULTI_VERSION_DEPLOY.md)。
