## Context

武器详情模态由 `src/lib/weaponDetail.ts` 的 `buildWeaponDetailRows` 生成；站立/蹲/移动的「精度（rad）」与「精确射击距离（m）」来自 `formatInaccuracyPair`，当前仅传入各 `Inaccuracy*` 单列数值。`public/weapon/weapons.json` 的 `columns` 同时包含 **`Spread`** 与各 `Inaccuracy*`，单位与 Inaccuracy 一致（与 xlsx Raw Values 导出一致）。

## Goals / Non-Goals

**Goals:**

- 在代入既有公式前，对 **InaccuracyStand / InaccuracyCrouch / InaccuracyMove** 分别与 **`Spread`** 求和，得到有效不准确度，再计算 rad 与米。
- **`Spread` 缺失、空字符串或非有限数** 时，**按 0** 参与加法，不单独展示一行「Spread」（除非未来产品要求）。
- 与 `weapon-range-damage-viewer` 规范中更新后的公式一致。

**Non-Goals:**

- 不修改伤害主表公式、地图测距或其它非详情模态逻辑。
- 不在此变更中调整 `InaccuracyFire` / `InaccuracyJump` 等未在详情三行展示的列（除非规范明确扩展）。

## Decisions

1. **有效值：`EffectiveInaccuracy = Inaccuracy + spreadComponent`**  
   - `spreadComponent`：从 `Spread` 列解析；无效则为 `0`。  
   - **理由**：与用户要求「所有 Inaccuracy 加上 Spread」一致，且与单列标量相加的简单模型对齐。  
   - **备选**：`sqrt(Inaccuracy² + Spread²)` — 未采用，除非数据源文档明确要求几何合成。

2. **实现位置**：在 `buildWeaponDetailRows` 内对每个姿态读取 `numFrom(columns, "InaccuracyXxx")` 与 `numFrom(columns, "Spread")`，求和后传入现有 `formatInaccuracyPair(effective, t)`，避免重复 rad/m 公式。  
   - **理由**：单点修改、易测。

3. **正数校验**：仅当 `effective > 0` 且有限时展示数值；否则「—」。  
   - **理由**：与现有 `formatInaccuracyPair` 行为一致，避免除零。

## Risks / Trade-offs

- **[Risk]** 若 Valve/表格语义实为非线性合成，简单相加可能偏差 → **缓解**：规范与注释写明「代数和」假设，后续可再开变更。

## Migration Plan

1. 改 `weaponDetail.ts` 并跑 `npm run build`。  
2. 无需数据迁移；部署静态站点即可。  
3. 回滚：恢复上一版 `weaponDetail.ts` 与规范 delta。

## Open Questions

（无。若需对 Alt 列武器使用 `SpreadAlt`，可另起变更。）
