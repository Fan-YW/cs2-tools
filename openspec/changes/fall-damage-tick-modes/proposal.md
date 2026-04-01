## Why

Fall damage 页面需要区分 CS2（「2」）与 CS:GO（「GO」）的 tick 与 sub-tick 行为，并在右侧用与参考 Java 一致的逐步仿真表展示 tick、时间、速度及相对起点/地面的高度。当前仅支持简单的 64/128 选择与高度区间伤害表，无法满足按引擎区分的初始速度与 INIT_TICK 规则。

## What Changes

- 左侧栏**最上方**增加游戏版本切换：**「2」** 与 **「GO」**。
- **「2」**：Server Tick 固定为 **「64 + sub tick」**（无 64/128 二选一）。
- **「GO」**：Server Tick 为 **64** 或 **128** 二选一（无 sub tick 滑块）。
- 在 **64 + sub tick** 模式下，显示 **sub tick offset** 滑块：范围 0～0.015625（1/64）秒，**1024 步**，每步 **1/65536** 秒；默认 **INIT_TICK = 滑块对应时间 × TICK_RATE**（与需求表述「滑块值 × TICK_RATE」一致：滑块表示秒内偏移时，INIT_TICK = offsetSeconds × TICK_RATE）。
- **无 sub tick**（GO 的 64/128）：**INIT_TICK 从 0 开始**。
- 在高度输入**下方**增加**初始动作**：**「坠落」**、**「跳」**。
- **「跳」** 的初始竖直速度：**「2」** 为 `-298.908405`；**「GO」** 为 `-295.7434082`（与用户提供 Java 一致）。
- **「坠落」** 的初始速度在实现阶段在 `design.md` 中明确（通常为自静止下落，`INIT_VELOCITY = 0`，除非另有数据）。
- **右侧主表**由当前「高度区间 → tick/时间/速度/伤害」改为与参考 Java **同结构、同列含义**的逐步输出：**tick、time、velocity、height(start)、height(floor)**，循环与终止条件（如 `height_floor < 2`）、落地伤害公式与参考代码一致；表头与数值格式对齐 Java 的 `printf` 风格。
- **下落速度上限 3500**：若某一 tick 间隔内 `prevVelocity < 3500` 且 `currVelocity > 3500`，须求出达到 3500 的临界时刻，将该间隔位移拆为两段（先 `V0·t1 + ½g·t1²`，再 `3500·t2`）；**达到上限之后的 tick** 位移按 **3500·Δt**（匀速）计算。
- **左侧摘要**：删除 **Landing Time**、**Landing Speed (unit/s)**（连续时间/速度，不得再基于 `sqrt(2h/g)` 等独立公式展示）。**落地时间**、**落地速度**标签文案 SHALL **不含**「(int tick)」后缀。 **落地时间**数值为 **最后 tick 时间 − 初始 tick 时间**：`Δt = t_last − INIT_TICK / TICK_RATE`，括号内 tick 差为 **`currTick_last − INIT_TICK`**（与表中最后一行及当前 `INIT_TICK` 一致）。**落地速度**取表中**最后一行**的 **velocity**（与表一致，含 3500 钳制）。**新增**「最后 1 tick 距地面高度」= 最后一行 **height(floor)**。
- **Sub tick 滑块旁说明**：显示 **`{秒 6 位小数} s = {tick 分数 4 位小数} tick`**，其中秒 = `step/65536`，tick 分数 = `step/1024`（= `INIT_TICK` 当 `TICK_RATE=64`）；**不**展示 `(step/1024)` 括号分数形式（后续澄清已取消）。

## Capabilities

### New Capabilities

- `fall-damage-view`: FallDamageView 左侧版本/tick/sub-tick/初始动作与右侧 Java 风格仿真表及摘要计算的一致性需求。

### Modified Capabilities

- （无）—— 主线规范已落地为 `openspec/specs/fall-damage-view/spec.md`（含实现后澄清）；若 i18n 增量可继续在 `app-i18n` 中约定。

## Impact

- **代码**：`src/views/FallDamageView.vue`（模板、状态、计算属性、右侧表格数据源）；可能涉及 `src/locales` 中 `fallDamage` 文案键。
- **行为**：图表（若保留）应与新的 tick/INIT_TICK/INIT_VELOCITY 语义一致或明确是否仅表/摘要更新；需评估 `chartData` 是否与新版物理模型对齐。
