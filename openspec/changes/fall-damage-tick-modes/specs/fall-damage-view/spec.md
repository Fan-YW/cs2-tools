## ADDED Requirements

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
- **THEN** 仿真使用的 `INIT_TICK` SHALL 等于 **滑块对应的秒内偏移 × TICK_RATE**（`TICK_RATE` 为 64）
- **AND** 默认 SHALL 与滑块初始位置一致（通常为 0）

#### Scenario: 滑块旁秒与 tick 分数展示

- **WHEN** 用户处于 CS2「64 + sub tick」模式
- **THEN** 滑块附近 SHALL 展示 **`{秒} s = {tick} tick`** 形式：秒为 `step/65536` 保留 **6** 位小数；tick 分数为 `step/1024`（等于 `INIT_TICK`，`TICK_RATE=64`）保留 **4** 位小数
- **AND** SHALL NOT 展示 `(step/1024)` 括号说明（后续澄清取消）

### Requirement: 初始动作

系统 SHALL 在高度输入下方提供初始动作选项：**「坠落」**、**「跳」**。

#### Scenario: 「跳」初速按版本

- **WHEN** 用户选择「跳」且游戏版本为「2」
- **THEN** 仿真使用的初始竖直速度 SHALL 为 **-298.908405**（与提供参考 Java 一致）

#### Scenario: 「跳」初速（GO）

- **WHEN** 用户选择「跳」且游戏版本为「GO」
- **THEN** 仿真使用的初始竖直速度 SHALL 为 **-295.7434082**（与提供参考 Java 一致）

#### Scenario: 「坠落」初速

- **WHEN** 用户选择「坠落」
- **THEN** 仿真使用的初始竖直速度 SHALL 为 **0**（静止释放，符号约定与 Java 中速度积分一致）

### Requirement: 右侧仿真表格式与算法

右侧主表 SHALL 按下列语义生成：**tick、time（秒）、velocity、height(start)、height(floor)**；仿真 SHALL 使用 `SV_GRAVITY = 800`、`TICK_RATE` 等于当前模式下的 tick 率（「2」为 64；「GO」为用户所选 64 或 128）；`height_floor` 初值 SHALL 等于用户输入高度（单位与现有高度输入一致）；循环、`currTick` 推进（`floor(currTick) + 1`）、终止条件（`height_floor < 2`）及落地伤害计算 SHALL 与用户提供的参考 Java 程序一致。**位移积分**在 Java 单段公式基础上 SHALL 增加 **速度上限 3500** 及「跨临界分段 / 封顶后匀速」规则（见 **下落速度上限与分段位移**）。

#### Scenario: 表头与列顺序

- **WHEN** 用户打开 Fall damage 页面并存在仿真数据
- **THEN** 表格列顺序 SHALL 为：tick → time → velocity → height(start) → height(floor)
- **AND** 数值格式 SHALL 与参考 Java 的表格输出风格一致（固定小数位、对齐方式在实现中与 Java `printf` 对齐）

#### Scenario: 落地伤害摘要

- **WHEN** 仿真结束
- **THEN** 系统 SHALL 能基于循环结束时的速度按 `(prevVelocity - 580) / 420 * 100`（与参考 Java 一致）给出落地伤害相关结果，并与右侧表最后一行/落地速度一致

### Requirement: 左侧摘要字段（移除连续量、按最后 tick、距地高度）

左侧结果区 SHALL **不**再展示 **Landing Time** 与 **Landing Speed (unit/s)**（不得使用与仿真无关的连续公式如 `sqrt(2h/g)` 单独计算这两项）。

#### Scenario: 落地时间与落地速度标签

- **WHEN** 渲染左侧摘要
- **THEN** **落地时间**与**落地速度**的界面标签 SHALL **不**包含「**(int tick)**」或等价括号后缀

#### Scenario: 落地时间为最后与初始的差值

- **WHEN** 仿真已产生至少一行表数据
- **THEN** **落地时间**展示的秒数 SHALL 为 **最后一行 `time` − `INIT_TICK / TICK_RATE`**
- **AND** 同一摘要中与 tick 相关的差值 SHALL 为 **`currTick_last − INIT_TICK`**（可与秒数一同展示）

#### Scenario: 落地速度取自最后一行

- **WHEN** 仿真已产生至少一行表数据
- **THEN** **落地速度** SHALL 等于表中**最后一行**的 **velocity**（与右侧表同列、同一 3500 展示/钳制规则）

#### Scenario: 最后 1 tick 距地面高度

- **WHEN** 仿真已产生至少一行表数据
- **THEN** 系统 SHALL 展示**新增**标签（文案如「最后 1 tick 距地面高度」及英文对应）
- **AND** 其数值 SHALL 等于表中**最后一行**的 **height(floor)**（距地面高度，单位与高度输入一致）

#### Scenario: 无表数据时的展示

- **WHEN** 仿真不产生任何表行（非法输入或边界）
- **THEN** 整 tick 时间/速度及最后 tick 距地高度 SHALL 显示明确的空状态或占位（实现选定一种并在 `design` 中一致）

### Requirement: 下落速度上限与分段位移

仿真 SHALL 将竖直速度上限设为 **3500**（与现有 Fall damage 页面速度上限一致）。在每个 tick 间隔内用于高度积分的位移 SHALL 遵守下列规则（`dt` 为该间隔秒长，`prevVelocity` 为间隔起点速度，`currVelocity` 为间隔终点按原公式算出的未钳制速度）：

#### Scenario: 间隔内未超过上限

- **WHEN** `currVelocity ≤ 3500`
- **THEN** 该间隔位移 SHALL 为 `prevVelocity * dt + ½ * SV_GRAVITY * dt²`（与参考 Java 单段积分一致）

#### Scenario: 间隔内从低于上限增至高于上限

- **WHEN** `prevVelocity < 3500` 且 `currVelocity > 3500`
- **THEN** 系统 SHALL 求出临界时间 `t1 = (3500 - prevVelocity) / SV_GRAVITY`（且 `0 < t1 < dt`）
- **AND** 第一段位移 SHALL 为 `prevVelocity * t1 + ½ * SV_GRAVITY * t1²`
- **AND** 第二段 SHALL 使用 `t2 = dt - t1`，位移为 `3500 * t2`
- **AND** 该间隔总位移 SHALL 为两段位移之和

#### Scenario: 已达上限后的间隔

- **WHEN** 间隔起点已处于上限（`prevVelocity ≥ 3500`），或等价地该间隔内速度全程按封顶处理
- **THEN** 该间隔位移 SHALL 为 **`3500 * dt`**（匀速），不再对该间隔使用 `½ * SV_GRAVITY * dt²` 作为附加项
