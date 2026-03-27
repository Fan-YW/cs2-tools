## Why

武器详情模态中「站立 / 蹲 / 移动」的精度与精确射击距离目前仅按各 `Inaccuracy*` 列计算，与同条数据中 **`Spread`（散布）** 的工程语义不一致：在 CS2 数据表里散布与姿态不准确度常以可加方式共同影响有效锥角。将 **`Spread` 与各姿态 `Inaccuracy` 相加** 后再代入既有 rad / 米公式，可使展示与数据源预期一致，避免低估有效散布。

## What Changes

- 在武器详情（`columns`）中，对 **站立、蹲、移动** 三行精度展示：在代入公式前使用 **有效不准确度** \(\text{Effective} = \text{Inaccuracy} + \text{Spread}\)（`Spread` 与同条记录的 `InaccuracyStand` / `InaccuracyCrouch` / `InaccuracyMove` 对应同一武器；`Spread` 缺失或非有限数时 **按 0** 与对应 `Inaccuracy` 相加）。
- 精度（rad）与精确射击距离（m）仍沿用既有定义，但分母中的「Inaccuracy」替换为上述 **有效值**（须为正有限数，否则该行展示「—」）。
- 更新 `weapon-range-damage-viewer` 规范中对应公式说明，与实现保持一致。

## Capabilities

### New Capabilities

（无。本变更属既有武器详情展示公式的修正。）

### Modified Capabilities

- `weapon-range-damage-viewer`：在「武器详情模态中的 JSON 字段展示」需求中，将站立/蹲/移动的精度与精确射击距离计算改为在 `Inaccuracy*` 上叠加同条 `Spread` 后再代入公式。

## Impact

- **代码**：`src/lib/weaponDetail.ts`（`formatInaccuracyPair` 调用处传入有效值或在此集中计算）。
- **数据**：沿用现有 `weapons.json` 的 `Spread` 与各 `Inaccuracy*` 列，无需改导出脚本（除非后续单独优化）。
- **规范**：`openspec/specs/weapon-range-damage-viewer/spec.md` 将通过本变更的 delta 同步更新。
