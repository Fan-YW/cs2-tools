## Context

仓库当前为 **Vanilla HTML + `pages/` + `css/`/`js/` + Pico CSS（CDN）**，`openspec/specs/` 中 `map-range-viewer`、`weapon-range-damage-viewer` 与 `vanilla-frontend-structure` 描述了布局、地图测距/伤害与武器表行为，以及「无打包器即可托管」的目录约定。目标是在**不削弱上述行为规格**的前提下，将前端迁移到 **Vue 3 + Vite**，组件层采用 **Reka UI**，构建产物为纯静态文件以部署 **GitHub Pages**。`public/map/*`、`public/weapon/*` 与 `scripts/`（含武器 xlsx→JSON）继续作为数据源与维护工具，与运行时解耦。

## Goals / Non-Goals

**Goals:**

- 以 Vite 管理开发与生产构建；生产包可置于任意静态主机，**默认文档化 GitHub Pages**（含 `base` 子路径）。
- 用 Vue 组件化复用地图画布、布局与控件逻辑；用 **Reka UI** 实现选择器、滑块、对话框等交互 primitives，全局视觉可在设计令牌与少量自定义 CSS 上统一。
- **行为与数据契约**与当前主 spec 一致：地图七图、JSON 元数据、测距语义、C4/武器公式、武器 Tag 与表格列等不因栈切换而改变。
- `npm run weapon:json` / `weapon:data` 等现有脚本路径与输出格式保持不变；应用仅通过 HTTP 从 `public/` 加载资源。

**Non-Goals:**

- 不引入需服务端渲染或 Node 运行时 API 的方案。
- 不改变武器 xlsx 列语义或 JSON schema（除非未来独立变更）。
- 不要求与 Pico 视觉像素级一致；允许在 Reka UI 上重新编排样式，只要满足 spec 中的布局与可读性约束。

## Decisions

1. **单页应用（SPA）+ `vue-router`**  
   - **理由**：首页、地图工具、武器工具共享布局与静态资源路径逻辑，路由比多 HTML 入口更易维护 `base`。  
   - **备选**：多页 MPA（多个 `index.html` 入口）——路径与共享 chunk 更繁琐，否决。

2. **`vite.config` 中可配置 `base`**  
   - **理由**：GitHub Pages 项目站常见为 `https://<user>.github.io/<repo>/`，资源与 `vue-router` 需统一 `createWebHistory(base)`（或文档化 Hash 模式为备选）。  
   - **备选**：仅支持根路径部署——与用户需求冲突，否决。

3. **`public/` 继续作为 Vite public 目录**  
   - **理由**：与现有 `public/map`、`public/weapon` 布局一致，`import.meta.env.BASE_URL` 拼接资源 URL，避免破坏 spec 中的目录约定。  
   - **备选**：搬迁资源到 `src/assets`——增大迁移面与脚本约定变更，否决。

4. **Reka UI 作为交互基础**  
   - **理由**：用户明确要求；用其 Select、Slider、Toggle/ToggleGroup、Dialog 等替代 Pico 与手写控件，同时满足可访问性。  
   - **备选**：仅 Tailwind + 手写——违背需求；其他组件库——违背需求。

5. **地图/测距核心逻辑**  
   - **理由**：将 Canvas/SVG 与坐标数学抽成 **composable 或纯 TS 模块**，两路由视图复用，降低重复与回归成本。  
   - **备选**：两页各写一份——维护成本高，否决。

6. **TypeScript**  
   - **理由**：Vite + Vue 3 生态默认倾向 TS，利于武器列与 JSON 类型约束；若仓库当前无 TS，可采用 `lang="ts"` 渐进引入。  
   - **备选**：纯 JS——可行但类型安全较弱，作为次选。

## Risks / Trade-offs

- **[Risk] 子路径 `base` 下资源 404** → **缓解**：统一封装 `resolvePublicUrl(path)`；CI 或文档中固定 `base` 与仓库名；部署前用构建产物本地静态服测一遍。  
- **[Risk] 规格中仍写「线段/圆」等与旧实现绑定的表述** → **缓解**：本变更的 spec delta 已更新「实现技术」表述；实现阶段按主 spec + delta 做检查清单回归。  
- **[Risk] 构建引入依赖漏洞或体积膨胀** → **缓解**：保持依赖精简；按需引入 Reka 组件；定期 `npm audit`。  
- **[Trade-off]** 贡献者必须安装 Node 并执行构建，无法再「仅克隆 + 打开 HTML」运行完整站——与 **BREAKING** 提案一致，需在 README 说明。

## Migration Plan

1. 初始化 Vite + Vue 项目骨架（含 `base` 占位、Router、`public/` 映射）。  
2. 迁移地图页行为至 Vue 视图，对照 `map-range-viewer` 做手动回归。  
3. 迁移武器页，复用地图 composable，对照 `weapon-range-damage-viewer` 回归。  
4. 移除或弃用旧 `pages/`、`js/`、`css/` 入口（以实现为准，可保留至切换完成后再删）。  
5. 配置 GitHub Actions 或文档化 `npm run build` + `gh-pages`/`actions/upload-pages-artifact` 流程。  
6. **回滚**：保留 Git 历史；若失败可切回归档前的 Vanilla 提交；spec delta 在归档前可单独回退。

## Open Questions

- GitHub 仓库名是否固定，以便将默认 `base` 写入配置（或仅用环境变量 `VITE_BASE` / `GITHUB_REPOSITORY` 在 CI 注入）。  
- 是否采用 **Hash 路由** 作为「零服务端配置」备选（URL 含 `#`，但无需服务端 fallback）；若采用需在 README 说明。
