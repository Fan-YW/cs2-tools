## Why

Fall damage 页面中 CS2「跳」的初速目前写死为 **-298.908405**，与用户可调的 `sv_gravity` 无关；而 CS2 侧更合理的模型是初速模长为 **√(91200 − 2.34×g)**（g 为 `sv_gravity`），以便在改重力时仿真与文档公式一致。

## What Changes

- 将 `FallDamageView.vue` 中 CS2「跳」分支的 `initVelocity` 从固定常数改为 **−√(91200 − 2.34 × sv_gravity)**（与当前 `svGravity` 输入联动）。
- 更新 `openspec/specs/fall-damage-view/spec.md` 中「跳」初速相关需求：由固定常数改为上述公式（并说明 g 为仿真用 `sv_gravity`）。

## Capabilities

### New Capabilities

- （无）本变更仅调整既有 fall-damage 行为与规范表述。

### Modified Capabilities

- `fall-damage-view`：「跳」初速在 CS2 下 SHALL 按 **−√(91200 − 2.34×g)** 计算（g 为 `sv_gravity`），不再要求固定 **-298.908405**。

## Impact

- **代码**：`src/views/FallDamageView.vue`（`initVelocity` 计算属性）。
- **规范**：`openspec/specs/fall-damage-view/spec.md`（初始动作 / 「跳」初速场景）。
- **依赖**：无新依赖；`fallSimulation` 仍接收数值型 `initVelocity`，行为不变。
