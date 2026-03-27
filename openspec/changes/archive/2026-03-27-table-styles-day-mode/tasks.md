## 1. 全局亮色令牌与壳层

- [x] 1.1 在 `src/style.css` 的 `:root` 中将 `color-scheme` 设为 `light`，并将 `--rk-bg`、`--rk-surface`、`--rk-text`、`--rk-muted`、`--rk-border`、`--rk-accent`（如需）调整为白/浅灰底与深色字体系
- [x] 1.2 更新 `body`、`a`、`.shell-header`、`.shell-nav`、`.home-card`、`.rk-panel`、`.tool-link` 等依赖变量的规则，确认在亮底上对比度与 hover/active 状态正常
- [x] 1.3 将 `.rk-select-trigger`、`.rk-select-content`、`.rk-slider-track`、`.rk-slider-range` 等仍偏深色的硬编码改为变量或亮底友好色值

## 2. 武器页表格与局部样式

- [x] 2.1 在 `WeaponRangeView.vue` 中增强 `.weapon-table` / `.weapon-table-wrap`：表头区分、边框/分隔、内边距与圆角容器协调；颜色优先使用全局 CSS 变量
- [x] 2.2 调整同文件内 scoped 的 `.weapon-tag`、`.sep`、`.err` 等仍假设深底的色值，使之与亮色主题一致
- [x] 2.3 确认 `weapon-dmg-high`（≥100 红色高亮）在亮底上清晰可读，必要时微调色值

## 3. 其他视图与收尾

- [x] 3.1 检查 `MapRangeView.vue`、`HomeView.vue`、`App.vue` 及弹层组件中是否有硬编码深色背景/浅色字，按需改为变量或与新主题一致
- [x] 3.2 本地运行 `vite dev` 全站浏览首页、地图工具、武器工具；确认无回归布局与可点击性
