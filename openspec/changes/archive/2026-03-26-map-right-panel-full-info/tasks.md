## 1. 布局样式（map-range.css）

- [x] 1.1 调整 `.app` / `.map-wrap` / `aside.panel` 的 flex 与宽度：移除或放宽右栏 `max-width: 24rem`，使 `aside.panel` 在横向占满除左侧地图列以外的剩余空间；为侧栏设置 `min-width: 0`（如需要）以避免 flex 子项溢出，并保证 `.map-wrap` 在缩放下不被误挤扁（如 `flex-shrink: 0`）。
- [x] 1.2 复核并必要时更新 `.map-wrap` 的 `width`/`max-width` 中与 `calc(100vw - 22rem)` 相关的表达式，使其与新的右栏伸缩策略一致，避免地图过大或右栏过窄。
- [x] 1.3 在桌面宽屏与中等宽度下手动打开 `pages/map-range.html`，确认左侧仍为正方形、右栏铺满剩余宽度、无大块右侧空白。

## 2. 武器页一致性与收尾

- [x] 2.1 检查 `css/weapon-range-damage.css` 是否覆盖右栏宽度；若有冲突则调整，使 `weapon-range-damage.html` 与地图页右栏行为一致。
- [x] 2.2 打开 `pages/weapon-range-damage.html` 做同样视口检查，确认表格区域随栏变宽合理展示。

## 3. 规范落地（归档前）

- [x] 3.1 实现完成后将本变更中 `specs/map-range-viewer/spec.md` 与 `specs/weapon-range-damage-viewer/spec.md` 的 delta 合并入 `openspec/specs/` 下对应正式 spec（随项目归档流程执行）。
