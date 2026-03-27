## Context

仓库已是无 npm 前端工程的原生页面：`index.html` 链到 `public/map-range.html`；地图页使用 Pico CDN，业务逻辑与样式集中在单文件内，数据放在 `public/json/`、`public/png/` 等。用户希望目录与文件组织明确符合「纯 HTML/CSS/JS」静态项目惯例。

## Goals / Non-Goals

**Goals:**

- 每个工具页：HTML / CSS / JS 分文件；路径清晰、可静态托管。
- 多页面时统一放置工具 HTML 的子目录名与资源相对关系在文档中固定下来。
- 规范与实现中明确：`public/` 专用于可托管的静态数据，与页面源码目录分离。

**Non-Goals:**

- 不引入 Vite、Webpack、TypeScript 等应用构建链。
- 不改变地图测距/C4 伤害等功能需求本身（仅随文件位置调整资源 URL）。
- 不强制删除 `scripts/` 下 Node 数据预处理脚本。

## Decisions

1. **工具 HTML 放在 `pages/`**  
   - **理由**：与根导航 `index.html` 区分明显，名称通用，后续加新工具可并列放入。  
   - **备选**：`tools/` — 语义同样成立；若团队更偏好 `tools/`，可在实现 tasks 中用该名替换，并同步 spec 中的示例路径。

2. **样式与脚本文件命名与页面一一对应**  
   - `pages/map-range.html` → `css/map-range.css`、`js/map-range.js`。  
   - **理由**：查找简单；无需先引入复杂「按模块拆分」的目录。

3. **静态数据仍留在 `public/json/`、`public/png/`、`public/map/`**  
   - **理由**：与现有 `map-range-viewer` 规范中的归档位置一致，仅运行时 URL 从 `pages/` 出发写为 `../public/json/...`、`../public/png/...`（或等价相对路径）。  
   - **备选**：把 `public/` 整段改为站点根下的 `assets/` — 会牵动更多路径与规范改写，本变更不采纳。

4. **站点根目录 = 仓库根**  
   - **理由**：与当前 `index.html` 位置一致；本地可用 `npx serve .` 或任意静态服务器指向仓库根进行验证。

5. **迁移后删除或替换 `public/map-range.html`**  
   - **理由**：避免双份入口造成维护分叉；首页改为指向 `pages/map-range.html`。

## Risks / Trade-offs

- **[Risk] 相对路径在「错误打开文件方式」下失效** — 若用户用 `file://` 直接打开深层 HTML，跨目录 `fetch` 可能受浏览器限制。  
  - **缓解**：在 README 或注释中说明需以静态服务器打开站点根（现有项目若已依赖 `fetch`，此约束通常已存在）。

- **[Risk] 外部链到旧 URL** — **BREAKING** 已写入 proposal。  
  - **缓解**：在 `public/` 保留一个极短的 `map-range.html` 仅做 `meta refresh` 或 JS 跳转到 `../pages/map-range.html` — 可作为可选任务，本设计默认直接迁移不保留兼容层（减少重复）；若需要零破坏书签，可在 tasks 中加可选 redirect 页。

## Migration Plan

1. 新增 `pages/`、`css/`、`js/` 文件并迁出内容与更新资源路径。  
2. 更新根 `index.html` 导航链接。  
3. 移除 `public/map-range.html`（或按需加 redirect）。  
4. 用静态服务器从仓库根启动，手测首页与地图页加载 JSON/PNG。

## Open Questions

- 是否在 `public/` 保留兼容跳转页：默认 **否**，若产品要求可补一项 task。
