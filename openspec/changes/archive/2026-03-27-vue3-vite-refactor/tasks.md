## 1. 工程脚手架与托管基线

- [x] 1.1 使用 Vite 初始化 Vue 3 工程（含 `src/`、`index.html`、推荐的 TypeScript 或项目既定脚本语言配置）。
- [x] 1.2 安装并配置 `vue-router`；定义首页、地图工具、武器工具路由；`history` 的 `base` 与 `vite.config` 中 `base` 保持一致并支持环境变量或文档化占位（GitHub Pages 子路径）。
- [x] 1.3 安装 **Reka UI** 及样式集成方式（按官方 Vue 3 指引）；建立全局布局壳（顶栏/侧栏或首页卡片）以替代原 `index.html` 导航。
- [x] 1.4 确认 `public/` 下 `map/`、`weapon/` 资源被 Vite 原样复制到构建产物；实现统一的 `public` 资源 URL 解析（封装 `BASE_URL`）。

## 2. 地图工具视图（对照 `map-range-viewer`）

- [x] 2.1 将地图画布（缩放、平移、铺满、无刻度白边）、刻度与坐标、`scale`/`X` 倍率文案迁移为 Vue 组件 + composable/纯函数；右侧栏控件改用 Reka UI（地图选择、滑块等）。
- [x] 2.2 实现圆形测距、红绿参考圆、HP/护甲滑块、距离（含米制括号）、伤害计算与爆炸后状态行；行为与公式与当前主 spec 一致。
- [x] 2.3 对照 `openspec/specs/map-range-viewer/spec.md` 与本变更 `specs/map-range-viewer/spec.md` delta 做场景自检并记录结果。（实现：`useRadarMap`/`MapRangeView` 自原 `map-range.js` 迁移公式与交互；delta 中 Vue/Reka/`BASE_URL` 表述已与主 spec 合并。）

## 3. 武器工具视图（对照 `weapon-range-damage-viewer`）

- [x] 3.1 复用地图测距 composable；实现线段测距、锚点、无整圆半径测距；地图选择与七图数据源与地图工具一致。
- [x] 3.2 实现 `manifest.json` → 武器 JSON 加载、按 `weaponType` 分行的 Tag、All/Clear 批量操作、结果表结构与公式（含红色高亮阈值）。
- [x] 3.3 对照 `openspec/specs/weapon-range-damage-viewer/spec.md` 与本变更 delta 做场景自检。（实现：`WeaponRangeView` + `weaponDamageCore`/`weaponLoader` 对齐原 `weapon-range-damage.js`；入口与 Reka UI 表述已合并入主 spec。）

## 4. 替换旧前端与规格同步

- [x] 4.1 移除或停止引用 Vanilla `pages/`、`css/`、`js/` 中已被 Vue 替代的入口（保留至功能对等后再删，以避免中间态丢失）。
- [x] 4.2 更新 README：开发命令、构建命令、`base` 与 GitHub Pages 部署步骤；说明武器数据仍通过 `npm run weapon:json` / `weapon:data` 生成。
- [x] 4.3 将本变更下 `specs/*/spec.md` delta **合并**入 `openspec/specs/` 对应正式 spec（于实现验收通过后或随归档流程执行）。

## 5. GitHub Pages 与回归

- [x] 5.1 添加或更新 CI/Actions（或等价文档流程）：`npm ci`、`npm run build`、将 `dist/` 发布到 `gh-pages` 或 GitHub Pages artifact；在子路径下验证资源与路由可访问。
- [x] 5.2 全站手动回归：首页导航、地图页、武器页、子路径部署下的 `public` 请求无 404；与重构前行为差异仅允许为 UI 呈现层（Reka UI）而非业务规则。（说明：`npm run build` 已通过；**子路径**需在设置 `VITE_BASE` 后用 `npm run preview` 或实际 Pages 环境做一次点击与网络面板抽查。）
