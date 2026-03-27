## ADDED Requirements

### Requirement: 高伤害阈值红色高亮
系统必须对结果表格中的伤害数值执行阈值高亮：当任一伤害单元格的展示值大于或等于 100 时，该数值文本必须以红色字体显示；小于 100 时必须保持默认文本颜色。

#### Scenario: 达到阈值显示红色
- **WHEN** 任一武器任一伤害列的展示值计算结果为 100 或更高
- **THEN** 对应单元格中的数值文本必须显示为红色

#### Scenario: 低于阈值不高亮
- **WHEN** 任一武器任一伤害列的展示值计算结果低于 100
- **THEN** 对应单元格中的数值文本不得使用红色高亮样式

## MODIFIED Requirements

### Requirement: 无护甲伤害（表格第 3 行第 2–5 列）
系统必须按下式计算无护甲伤害（结果展示保留 **2 位小数**），并将结果乘以 `bullets`：

- **头**：\((\text{Damage} \times \text{HeadShotMultiplier} \times R) \times \text{bullets}\)
- **胸/手臂**：\((\text{Damage} \times 1.00 \times R) \times \text{bullets}\)
- **腹**：\((\text{Damage} \times 1.25 \times R) \times \text{bullets}\)
- **腿**：\((\text{Damage} \times 0.75 \times R) \times \text{bullets}\)

其中，若当前测距距离 `d` 严格大于该武器的 `range`，系统必须将以上四列无护甲伤害全部显示为 `0.00`。

#### Scenario: 切换武器或距离
- **WHEN** 用户更换武器或地图测距距离变化
- **THEN** 第 3 行第 2–5 列必须按上式（含 `bullets`）更新

#### Scenario: 超出射程时无护甲归零
- **WHEN** 当前距离 `d` 大于所选武器 `range`
- **THEN** 第 3 行第 2–5 列必须全部显示 `0.00`

### Requirement: 有护甲伤害（表格第 3 行第 6–8 列）
系统必须仅在三列展示：**头、胸/手臂、腹**（与表格列对齐）。有护甲伤害必须在对应无护甲基础公式中同时乘以 \((\text{WeaponArmor}/2)\) 与 `bullets`。展示格式必须为 `XX.XX(XX)`：前半部分为有护甲伤害（保留 **2 位小数**），括号内为对应部位的护甲减少整数值（按护甲减少公式计算并取整）。

- **头（有护甲）**：\(((\text{Damage} \times \text{HeadShotMultiplier} \times R) \times (\text{WeaponArmor}/2)) \times \text{bullets}\)
- **胸/手臂（有护甲）**：\(((\text{Damage} \times 1.00 \times R) \times (\text{WeaponArmor}/2)) \times \text{bullets}\)
- **腹（有护甲）**：\(((\text{Damage} \times 1.25 \times R) \times (\text{WeaponArmor}/2)) \times \text{bullets}\)

其中，若当前测距距离 `d` 严格大于该武器的 `range`，系统必须将三列有护甲伤害显示为 `0.00(0)`。

#### Scenario: 有护甲三列更新
- **WHEN** 武器或距离变化
- **THEN** 有护甲三列必须按上式（含 `bullets`）更新，且每个单元格必须展示为 `XX.XX(XX)`

#### Scenario: 超出射程时有护甲归零
- **WHEN** 当前距离 `d` 大于所选武器 `range`
- **THEN** 有护甲三列必须全部显示为 `0.00(0)`
