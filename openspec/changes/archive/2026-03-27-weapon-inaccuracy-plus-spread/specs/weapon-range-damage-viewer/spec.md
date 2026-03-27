## MODIFIED Requirements

### 需求:武器详情模态中的 JSON 字段展示

模态内必须按下列规则展示属性（数值来自该武器记录的 `columns` 或等价结构，键名匹配须大小写不敏感；缺失或非有限数时展示「—」或省略该项，但不得崩溃）：

- **护甲衰减**：`WeaporArmorRatio`（或实现中已支持的同义列）除以 2，结果以百分比形式展示。
- **基本伤害**：`Damage`。
- **距离衰减**：`RangeModifier`。
- **爆头倍率**：`HeadshotMultiplier`（或实现中已支持的同义列名）。
- **射速**：\(60 / \text{CycleTime}\)，单位为 rpm（`CycleTime` 须为正有限数）。
- **击杀奖励**：以货币形式展示，前缀为「$」加上 `KillAward` 的数值。
- **最大速度**：`MaxPlayerSpeed`，单位为 unit/s。
- **静步最大速度**：`MaxPlayerSpeed × 0.52`，单位为 unit/s。
- **蹲走最大速度**：`MaxPlayerSpeed × 0.34`，单位为 unit/s。
- **站立 / 蹲 / 移动（精度与精确射击距离）**：分别对应 `InaccuracyStand`、`InaccuracyCrouch`、`InaccuracyMove`。对每一姿态，系统必须先将该姿态的 `Inaccuracy` 与同条记录 `columns` 中的 **`Spread`** 相加得到有效不准确度 \(\text{EffectiveInaccuracy}\)（若 `Spread` 缺失、为空或非有限数，则 **`Spread` 按 0** 参与求和）。精度为 \(\text{EffectiveInaccuracy}/1000\) rad；精确射击距离为 \(152.4/\text{EffectiveInaccuracy}\) m（`EffectiveInaccuracy` 须为正有限数；否则该项展示「—」）。
- **弹夹容量**：来自表内弹容列（例如 `clip_size` 或导出脚本使用的等价列名）。
- **备弹**：展示 `m_nPrimaryReserveAmmoMax` 的数值；若 `m_bReserveAmmoAsClips` 为 true，则该数值的单位文案为「弹夹」，否则为「子弹」。
- **武器价格**：`WeaponPrice`。
- **最远射击距离**：`Range`。
- **类型**：`WeaponType`（列内字符串）。
- **霰弹数**：仅当 `Bullets` 严格大于 1 时展示该项及其标签；为 1 或缺失时不展示霰弹数行。

#### 场景:模态展示与 JSON 一致

- **当** 用户打开某武器的详情模态且该武器在 JSON 中具有上述列的有效取值
- **那么** 模态必须包含上述各字段的格式化展示，且射速、速度、百分比与精度公式等必须符合本节说明

#### 场景:单弹丸武器不展示霰弹数

- **当** 某武器的 `Bullets` 为 1 或缺失
- **那么** 模态不得展示「霰弹数」条目

#### 场景:多弹丸武器展示霰弹数

- **当** 某武器的 `Bullets` 为大于 1 的有限数
- **那么** 模态必须展示霰弹数及其数值
