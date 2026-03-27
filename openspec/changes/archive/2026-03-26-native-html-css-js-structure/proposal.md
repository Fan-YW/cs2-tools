## Why

当前地图工具页将大量 CSS 与 JavaScript 内联在单个 `public/map-range.html` 中，根目录 `index.html` 与数据资源混在 `public/` 下，结构更接近「单文件页面」而非可维护的纯静态站点。将结构调整为典型的原生 HTML/CSS/JS 分层目录，有利于阅读、 diff、复用样式脚本，并与「无打包器」的部署方式一致。

## What Changes

- 将地图工具页拆为：独立 HTML 壳、`css/` 下样式表、`js/` 下脚本文件；HTML 仅保留结构与外链。
- 将多入口页面集中到约定子目录（如 `pages/`），根目录保留 `index.html` 作为导航；更新首页链向新路径。
- 保持 `public/` 作为**静态数据**根（`json/`、`png/`、`map/` 等），工具页通过相对路径（如自 `pages/` 指向 `../public/...`）加载资源。
- **BREAKING**：本地书签或外部文档中若写死 `public/map-range.html`，需改为新页面路径（具体路径以 design 为准）。

## Capabilities

### New Capabilities

- `vanilla-frontend-structure`: 约定原生 HTML/CSS/JS 的目录划分、外链资源、静态数据位置，以及浏览器侧不依赖应用层打包工具。

### Modified Capabilities

- `map-range-viewer`: 更新「从何处加载 PNG/JSON」的规范表述，使之与工具 HTML 新位置及相对 `public/` 的解析方式一致（行为不变，路径约定随结构迁移）。

## Impact

- 受影响文件：`index.html`、`public/map-range.html`（迁移/拆分）、新增 `css/`、`js/`、`pages/`（或 design 中最终目录名）。
- 不受影响：`scripts/map-txt-to-json.mjs` 等可选开发脚本仍可保留，但不作为运行时依赖。
- 部署：仍为静态文件托管；需确认静态服务器站点根仍指向仓库根（或按 design 调整文档说明）。
