# fall-damage-view 规范

## 目的

约定 Fall damage（`FallDamageView`）中 CS2 / CS:GO 的 tick 与 sub-tick、逐步仿真表、速度上限位移、左侧摘要与滑块说明；实现代码见 `src/views/FallDamageView.vue`、`src/lib/fallSimulation.ts`。

**来源**：变更 `fall-damage-tick-modes` 及实现后澄清（已合并本文）。

## 需求

### Requirement: 游戏版本与 Server Tick 选项

Fall damage 视图 SHALL 在左侧栏顶部提供游戏版本选择：**「2」** 与 **「GO」**。

#### Scenario: CS2（「2」）仅 64 + sub tick

- **WHEN** 用户选择「2」
- **THEN** Server Tick 展示 SHALL 仅为 **「64 + sub tick」**（不可切换为 128）
- **AND** SHALL 显示 sub tick offset 滑块（见 Sub tick 滑块要求）

#### Scenario: CS:GO（「GO」）64 或 128

- **WHEN** 用户选择「GO」
- **THEN** Server Tick SHALL 提供 **64** 与 **128** 两个选项
- **AND** SHALL NOT 显示 sub tick offset 滑块
- **AND** 仿真用 `INIT_TICK` SHALL 为 **0**

### Requirement: Sub tick 滑块（仅 64 + sub tick）

当处于 **64 + sub tick** 模式时，系统 SHALL 在 Server Tick 控件下方提供 **sub tick offset** 滑块：标签为「sub tick offset」；左端对应 **0**；右端对应 **0.015625（1/64）秒**；具有 **1024 个 step**（相邻步长时间差为 **1/65536** 秒）。

#### Scenario: INIT_TICK 由滑块推导

- **WHEN** 用户调整 sub tick 滑块
- **THEN** 仿真使用的 `INIT_TICK` SHALL 等于 **(step/65536) × TICK_RATE**（`TICK_RATE` 为 64）
- **AND** 默认 SHALL 与滑块初始位置一致（通常为 0）

#### Scenario: 滑块旁秒与 tick 分数展示

- **WHEN** 用户处于 CS2「64 + sub tick」模式
- **THEN** 滑块附近 SHALL 展示 **`{秒} s = {tick} tick`**：秒 = `step/65536`，保留 **6** 位小数；tick 分数 = `step/1024`（等于 `INIT_TICK`），保留 **4** 位小数
- **AND** SHALL NOT 展示 `(step/1024)` 括号文本

### Requirement: 初始动作

系统 SHALL 在高度输入下方提供初始动作选项：**「坠落」**、**「跳」**。

#### Scenario: 「跳」初速按版本（CS2）

- **WHEN** 用户选择「跳」且游戏版本为「2」
- **THEN** 仿真使用的初始竖直速度 SHALL 为 **−√(91200 − 2.34 × g)**，其中 **g** 为当前仿真使用的 **`sv_gravity`**（与左侧 `sv_gravity` 输入一致）

#### Scenario: 「跳」初速（GO）

- **WHEN** 用户选择「跳」且游戏版本为「GO」
- **THEN** 仿真使用的初始竖直速度 SHALL 为 **-295.7434082**

#### Scenario: 「坠落」初速

- **WHEN** 用户选择「坠落」
- **THEN** 仿真使用的初始竖直速度 SHALL 为 **0**

### Requirement: 右侧仿真表格式与算法

右侧主表 SHALL 列为：**tick、time（秒）、velocity、height(start)、height(floor)**；仿真 SHALL 使用用户可调的 `sv_gravity`（默认 800）、`TICK_RATE` 按版本；`height_floor` 初值 SHALL 为用户输入高度；循环、`currTick` 推进（`floor(currTick) + 1`）、终止条件（`height_floor < 2`）及落地伤害 **(prevVelocity − 580) / 420 × 100** SHALL 与参考 Java 一致。**位移** SHALL 叠加 **速度上限 3500** 及跨临界分段 / 封顶后匀速规则（见下节）。

#### Scenario: 表头与列顺序

- **WHEN** 用户打开页面且存在仿真数据
- **THEN** 表格列顺序 SHALL 为：tick → time → velocity → height(start) → height(floor)

### Requirement: 下落速度上限与分段位移

仿真 SHALL 将竖直速度上限设为 **3500**。每个 tick 间隔内位移规则：

#### Scenario: 间隔内未超过上限

- **WHEN** 间隔终点未钳制速度 `≤ 3500`
- **THEN** 位移 SHALL 为 `prevVelocity × dt + ½ × g × dt²`

#### Scenario: 间隔内跨越 3500

- **WHEN** `prevVelocity < 3500` 且未钳制终点 `> 3500`
- **THEN** SHALL 分段：`t1 = (3500 − prevVelocity) / g`，位移为 `prevVelocity×t1 + ½gt1² + 3500×(dt−t1)`，且此后间隔按封顶匀速规则

#### Scenario: 已达上限后的间隔

- **WHEN** 已进入封顶位移模式或间隔起点未钳制速度 `≥ 3500`
- **THEN** 该间隔位移 SHALL 为 **`3500 × dt`**

### Requirement: 左侧摘要字段

左侧 SHALL **不**展示基于 `sqrt(2h/g)` 的连续 **Landing Time**、**Landing Speed (unit/s)**。

#### Scenario: 落地时间与落地速度标签

- **WHEN** 渲染左侧摘要
- **THEN** **落地时间**与**落地速度**标签 SHALL **不**含「**(int tick)**」后缀

#### Scenario: 落地时间为最后与初始的差值

- **WHEN** 仿真已产生至少一行表数据
- **THEN** 落地时间秒数 SHALL 为 **最后一行 `time` − `INIT_TICK / TICK_RATE`**
- **AND** tick 差值 SHALL 为 **`currTick_last − INIT_TICK`**

#### Scenario: 落地速度取自最后一行

- **WHEN** 仿真已产生至少一行表数据
- **THEN** 落地速度 SHALL 为最后一行 **velocity**（与表同列、含 3500 展示规则）

#### Scenario: 最后 1 tick 距地面高度

- **WHEN** 仿真已产生至少一行表数据
- **THEN** SHALL 展示「最后 1 tick 距地面高度」类文案，数值 = 最后一行 **height(floor)**

#### Scenario: 无表数据

- **WHEN** 无仿真行
- **THEN** 上述摘要字段 SHALL 显示占位（如 `—`）

### Requirement: 图表与仿真一致

伤害图表数据 SHALL 基于当前仿真路径（如 `height_floor` 与该行展示速度对应伤害），不得单独使用旧的纯运动学阶梯模型。

---

## 变更追溯

- 详细设计迭代与历史任务见 `openspec/changes/fall-damage-tick-modes/`（可归档至 `openspec/changes/archive/`）。
