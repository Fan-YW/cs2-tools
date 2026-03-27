## Why

当前工具页以多页原生 HTML/CSS/JS 与 Pico CSS 维护，交互与状态分散在多个脚本中，扩展与一致性成本偏高。采用 Vue 3 + Vite 可在保持**纯静态构建产物**的前提下改善组件化与开发体验，并便于对接 GitHub Pages 的固定 `base` 部署；UI 统一迁至 Reka UI，在**不改变既有规格所描述的功能与数据契约**的前提下刷新界面层次与可访问性实现。

## What Changes

- 使用 **Vue 3（Composition API）+ Vite** 作为源码构建链；开发态 `vite dev`，交付物为 **`vite build` 生成的静态资源**（可含 SPA 路由或等价多入口，以实现为准），满足 GitHub Pages 托管。
- 移除对「用户态代码不经打包器即可直接由仓库根静态托管」的依赖方式，改为**以构建产物目录**作为站点根（文档中明确本地预览与 GH Pages 的发布路径）。
- **UI 组件库采用 Reka UI**（替代 Pico CSS 作为组件与交互 primitives 来源）；全局样式与布局可在 Reka 之上自行编排，但须满足 `map-range-viewer` 与 `weapon-range-damage-viewer` 中关于布局、地图与表格行为的既有需求。
- 地图 JSON/PNG、武器 `manifest.json` 与生成 JSON 等 **`public/` 数据与现有 Node 脚本工作流保持不变**；仅调整应用在运行时的资源 URL 解析方式以兼容 `base`（如子路径部署）。
- **BREAKING**：仓库根不再作为「无构建即可运行」的页面源；贡献者需执行 `npm install` 与 `npm run build`（或文档约定命令）生成可部署静态站。

## Capabilities

### New Capabilities

- （无独立新能力包；前端工程与托管约定通过对既有 `vanilla-frontend-structure` 的规格更新体现。）

### Modified Capabilities

- `vanilla-frontend-structure`：将「无应用层打包器」改为 **Vite + Vue 源码树与构建产物** 的目录角色、入口与静态托管说明；明确 `public/`、`scripts/` 的保留关系及 GitHub Pages 部署路径。
- `map-range-viewer`：将「原生 HTML + Pico CSS」等实现约束替换为 **Vue 3 + Reka UI**，保留地图、刻度、测距、交互与计算相关全部行为需求。
- `weapon-range-damage-viewer`：将页面结构、导航入口与 Pico 相关表述更新为 **Vue 应用内路由/视图 + Reka UI**，保留武器数据加载、Tag 分组、伤害表与地图联动等全部行为需求。

## Impact

- **代码**：`index.html`、`pages/`、`css/`、`js/` 等现有 Vanilla 实现将由 Vue 工程（如 `src/`）与构建输出替代；需核对所有对 `public/` 的相对路径在 `base` 下的正确性。
- **依赖**：新增 `vue`、`vite`、`@vitejs/plugin-vue`、**Reka UI** 及相关样式构建链路；可移除 Pico CDN 依赖（以最终实现为准）。
- **工具链**：CI/文档需补充或更新构建与 **GitHub Pages** 发布步骤（例如 `base` 与 `assets` 配置）。
- **规格**：上述三份主 spec 将随本变更的 delta 同步更新；实现完成后须按任务清单与主 spec 做行为回归，确保与归档前行为一致。
