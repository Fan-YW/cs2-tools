## 1. 视图逻辑

- [x] 1.1 在 `src/views/FallDamageView.vue` 的 `initVelocity` 中，将 CS2 +「跳」分支由固定 `-298.908405` 改为 **−Math.sqrt(Math.max(0, 91200 - 2.34 * svGravity.value))**（或等价写法），保留 GO 与「坠落」分支不变
- [x] 1.2 在公式旁添加简短注释，标明 **91200**、**2.34** 与 `sv_gravity` 含义，与变更规范一致

## 2. 规范落地与验证

- [x] 2.1 在实现完成后，将本变更归档（`/opsx:archive` 或项目约定流程），使 `openspec/specs/fall-damage-view/spec.md` 主规范吸收 delta 内容
- [x] 2.2 手动验证：`sv_gravity` 默认 800、选 CS2、「跳」时仿真表首行速度约为 **−298.877**（允许浮点显示差异）；调节 `sv_gravity` 时初速随之变化
