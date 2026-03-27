## Context

`map-range.css` 中 `.app` 为横向 flex，`.map-wrap` 控制左侧正方形尺寸，`aside.panel` 使用 `flex: 1 1 18rem`、`min-width: 16rem`、`max-width: 24rem`。在宽屏上左侧地图已占用一列后，右栏被限制在最多 24rem，导致「地图 + 窄栏」右侧仍有大片空白，与用户期望的「右半边全部用于信息展示」不符。

## Goals / Non-Goals

**Goals:**

- 在桌面典型宽屏下，让右侧信息栏在**水平方向**占满「视口减去左侧地图列、再减去页面级 padding」后的剩余宽度。
- 保持左侧地图仍为正方形且高度策略不变；不改变测距、刻度、武器计算与数据加载逻辑。
- 两页（`map-range.html`、`weapon-range-damage.html`）共享 `map-range.css` 时行为一致；武器页额外样式不破坏全宽策略。

**Non-Goals:**

- 不改变移动端或小视口下的换行/滚动策略 beyond 为 flex 换行预留的现有行为（若需单独收紧可后续迭代）。
- 不重构 HTML 为 grid 除非纯 CSS 无法达成（优先 flex 调整）。

## Decisions

1. **以 CSS 为主调整 flex 与最大宽度**  
   - **做法**：移除或放宽 `aside.panel` 的 `max-width: 24rem`，改为 `flex: 1 1 0` 或 `min-width: 0` + `flex-grow: 1`，使侧栏吃掉剩余空间；必要时为 `.map-wrap` 明确 `flex-shrink: 0`，避免地图列被错误压缩。  
   - **理由**：改动面小、与现有结构一致。  
   - **备选**：主布局改为 CSS Grid（`1fr` 地图列 + `minmax(0,1fr)` 信息列）；若 flex 在边缘视口出现回归再考虑。

2. **地图列宽度公式**  
   - 保持现有 `width: min(100vh - 2rem, calc(100vw - 22rem))` 等逻辑时，将原先用于「给右栏预留约 22rem」的 `calc(100vw - 22rem)` 与新的「右栏占满剩余」目标对齐：在实现时把 `22rem` 调整为与最小右栏需求一致或改为不依赖固定 rem 的减法（例如仅 `min(100vh-2rem, 100vw - 2rem - <侧栏最小宽度>)`），避免地图意外过大挤掉右栏。具体数值在实现任务中按视觉与 `min-width` 联调。

3. **武器页**  
   - `weapon-range-damage.css` 中 `.weapon-dmg-table` 已有 `width: 100%`；栏变宽后表格自然拉宽。若出现列过宽可读性问题，可仅调表格 `max-width` 或单元格 padding，属可选润色。

## Risks / Trade-offs

- **[Risk] 极窄视口下右栏可读性** → 保留合理 `min-width`（可与现有一致或略调），必要时窄屏仍换行堆叠。  
- **[Risk] `calc(100vw - 22rem)` 与新的 flex 行为不一致** → 实现时在浏览器中验证地图尺寸与右栏同时合理，必要时统一为单一布局策略。

## Migration Plan

- 静态站点：部署更新后的 CSS 即可；无数据迁移。  
- **回滚**：恢复 `aside.panel` 的 `max-width` 与相关 `calc` 提交。

## Open Questions

- 无。若产品后续要求「右栏内容区 max-width 居中」，再在栏内加内层容器即可，与本变更「栏占满剩余宽」不冲突。
