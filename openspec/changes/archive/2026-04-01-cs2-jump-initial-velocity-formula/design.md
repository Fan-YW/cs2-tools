## Context

`FallDamageView.vue` 中 `initVelocity` 在「跳」且 CS2 时使用固定 **-298.908405**；页面已有可调 `svGravity`（默认 800），但初速不随 g 变化。目标改为与 CS2 文档一致的 **−√(91200 − 2.34×g)**（g 为 `sv_gravity`）。

## Goals / Non-Goals

**Goals:**

- 在单处（`initVelocity` 计算属性）用 `svGravity` 计算 CS2 跳跃初速，保持 GO 与「坠落」逻辑不变。
- 与 `openspec/specs/fall-damage-view` 中「跳」初速需求对齐。

**Non-Goals:**

- 不改动 `fallSimulation` 算法、tick/sub-tick、图表与落地伤害公式。
- 不新增 UI 控件；不调整 CS:GO 常数 **-295.7434082**。

## Decisions

1. **公式与符号**  
   竖直向上为正时，起跳初速取 **−√(91200 − 2.34 × sv_gravity)**。与现有代码一致（向下为负），直接替换 CS2 分支常数。

2. **实现位置**  
   仅在 `FallDamageView.vue` 的 `initVelocity` 内计算，避免散落魔法数；系数 **91200**、**2.34** 以命名常量或内联注释标出来源，便于与规范对照。

3. **根号内非负**  
   当 **91200 − 2.34×g ≤ 0** 时，物理上无实数初速。当前 UI 对 `sv_gravity` 有合理范围；若需防御性处理，可对根号内使用 `Math.max(0, …)` 避免 NaN 污染表（可选，任务阶段再定）。

4. **与旧常数关系**  
   在默认 **g = 800** 下，√(91200 − 1872) ≈ **298.877**，与旧 **298.908405** 略有差异，属预期（按新公式为准）。

## Risks / Trade-offs

- **[Risk]** 用户将 `sv_gravity` 调到极大导致根号内为负 → **缓解**：文档说明有效范围；可选 `Math.max(0, …)`。  
- **[Trade-off]** 固定常数简单、可复现旧截图；公式与重力联动更符合 CS2 模型与可调参数语义。

## Migration Plan

- 单页行为变更：发布即生效；无需数据迁移。回滚为恢复 CS2 分支常数。

## Open Questions

- 无（若产品要求与某固定 build 像素级一致，可再核对游戏内 g 与系数）。
