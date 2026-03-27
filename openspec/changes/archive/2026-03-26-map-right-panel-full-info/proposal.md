## Why

地图测距页与武器距离伤害页采用左图右栏布局时，右侧信息栏当前受 `max-width` 等样式限制，在宽屏上无法占满除左侧正方形地图以外的剩余区域，导致右半屏出现大块空白，信息密度低、空间浪费。需要在不改变左侧地图正方形与测距行为的前提下，让右侧栏填满剩余宽度。

## What Changes

- 调整共享布局样式（`map-range.css` 及必要时 `weapon-range-damage.css`），使右侧信息栏在桌面宽屏上**水平方向占满**「视口宽度减去左侧地图列」后的剩余区域，消除右半屏因栏宽上限导致的空白。
- 保持左侧地图区域仍为正方形、高度贴近可视区域（与现有规范一致）；仅改变右栏在 flex 布局中的伸缩与最大宽度策略。
- 武器页表格等右栏内容在栏变宽时可合理利用空间（例如表格横向铺满或按现有 `weapon-table-wrap` 规则扩展），**不**改变测距、武器公式与数据源行为。

## Capabilities

### New Capabilities

- （无）本变更通过修改现有查看器规范中的布局需求完成，不新增独立能力包。

### Modified Capabilities

- `map-range-viewer`：更新「页面布局」相关需求，明确右侧信息栏须占满除左侧地图列以外的**全部**剩余水平空间（在常见桌面视口下不应再因栏宽上限留下与栏无关的右侧空白）。
- `weapon-range-damage-viewer`：与 `map-range-viewer` 对齐，更新「入口与页面布局」中右栏描述，使武器页与地图页在右栏占满剩余宽度方面一致。

## Impact

- **主要文件**：`css/map-range.css`（`.app`、`.map-wrap`、`aside.panel` 的 flex/宽度策略）；必要时 `css/weapon-range-damage.css`（若武器页有覆盖右栏宽度的规则需与之一致）。
- **页面**：`pages/map-range.html`、`pages/weapon-range-damage.html` 结构可不变，仅依赖样式调整；若需额外包裹类名以限定作用域，再最小改动 HTML。
- **脚本**：`js/map-range.js`、`js/weapon-range-damage.js` 无逻辑变更预期。
- **依赖**：无新增 npm 依赖。
