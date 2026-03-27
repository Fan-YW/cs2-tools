## 1. 实现有效不准确度

- [x] 1.1 在 `buildWeaponDetailRows` 中读取 `Spread`（`numFrom(columns, "Spread")`），无效时按 `0` 参与计算
- [x] 1.2 对 `InaccuracyStand`、`InaccuracyCrouch`、`InaccuracyMove` 分别计算 `effective = Inaccuracy + spreadComponent` 并传入 `formatInaccuracyPair(effective, t)`
- [x] 1.3 确认 `formatInaccuracyPair` 仅在 `effective` 为正有限数时输出数值，否则为「—」（保持现有行为）

## 2. 验证与规范

- [x] 2.1 本地打开武器详情模态，抽样对比含 `Spread` 的武器，确认精度与米数相对仅 Inaccuracy 时有预期变化
- [x] 2.2 运行 `npm run build` 通过
- [x] 2.3 归档或同步时将 `openspec/changes/.../specs/weapon-range-damage-viewer/spec.md` 合并入 `openspec/specs/weapon-range-damage-viewer/spec.md`（若工作流程要求）
