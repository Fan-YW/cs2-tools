## Context

`FallDamageView.vue` 当前用纯运动学公式（`sqrt(2h/g)`）估算落地 tick，右侧表按「高度区间」列出阶梯伤害。用户提供的 Java 使用固定 `SV_GRAVITY = 800`、`TICK_RATE`（仿真用 tick 率）、从 `INIT_TICK`/`INIT_VELOCITY` 起在离散 tick 上积分位移，直到 `height_floor < 2`，并以 `prevVelocity` 计算落地伤害。需在 UI 上区分 CS2（「2」）与 CS:GO（「GO」），并暴露 sub-tick 偏移与「跳/坠落」初速。

## Goals / Non-Goals

**Goals:**

- 左侧顶部：**游戏版本**「2」|「GO」；其下 **Server Tick** 规则与需求一致（2：仅 64+sub；GO：64 或 128）。
- **64 + sub tick**：显示 sub tick offset 滑块（0～1/64 秒，1024 档，每档 1/65536 秒）；`INIT_TICK = offsetSeconds * TICK_RATE`（`offsetSeconds = stepIndex / 65536`，`stepIndex ∈ [0,1023]` 或 `0..1024` 共 1025 点——以实现为准：用户要求 1024 个 step，通常指 `stepIndex` 0～1023 共 1024 个可停留位置）。
- **无 sub tick（GO）**：`INIT_TICK = 0`。
- 高度输入下方：**初始动作**「坠落」|「跳」；「跳」初速：**2** → `-298.908405`，**GO** → `-295.7434082`（与给定 Java 一致）。
- **坠落**：`INIT_VELOCITY = 0`（竖直向下为正时速度符号与 Java 一致：Java 中跳跃初速为负，表示向上；坠落从静止释放则为 `0`，`INIT_TICK` 仍按上款）。
- 右侧表：列与参考 Java 打印一致：**tick | time | velocity | height(start) | height(floor)**，行生成逻辑与终止条件、落地伤害输出与 Java 对齐（含 `currTick` 推进为 `floor(currTick) + 1`）。
- 常量：`TICK_RATE` 取当前仿真 tick 率（**2** 固定 64；**GO** 为用户选的 64 或 128）。`SV_GRAVITY = 800`。`START_HEIGHT`（`height_floor` 初值）映射为用户输入的**高度单位**（与现有 `heightUnit` 一致，对应 Java 中 `START_HEIGHT = 192f` 的占位：`height_start` 初值为 0，`height_floor` 初值为用户高度）。
- 左侧摘要：**不**展示连续 **Landing Time** / **Landing Speed (unit/s)**；**落地时间**、**落地速度**（i18n：`landingTimeTick`、`landingSpeedTick`）**不带**「(int tick)」；**落地时间**展示 **Δt = 最后一行 `time` − `INIT_TICK/TICK_RATE`**，tick 差 **Δtick = 最后一行 `currTick` − `INIT_TICK`**；**落地速度**仍为最后一行展示速度；**最后 1 tick 距地面高度**绑定最后一行 **height(floor)**。

**Non-Goals:**

- 不改变项目路由或其它页面，除非 i18n 键扩展。
- 不强制重做图表为同一积分模型；若保留图表，可在任务中标注「后续对齐」或同步改用同一仿真器输出。

## Decisions

1. **仿真核心**  
   - 在 `FallDamageView.vue`（或抽离 small `fallSimulation.ts`）用 TypeScript 复刻 Java 循环，避免与手写公式漂移。浮点按 `number`，打印格式对齐 `printf` 精度（如 tick/time/velocity/heights 小数位与表宽一致）。

2. **INIT_TICK 与滑块**  
   - `offsetSeconds = subTickStep / 65536`（`subTickStep` 为整数 0～1023，共 1024 步）。  
   - `INIT_TICK = offsetSeconds * TICK_RATE`。  
   - 与「最右为 1/64 秒」一致：`1023/65536 ≈ 0.015609`；若产品要求严格终点为 `1/64`，可在任务中二选一：使用 1025 个点或最后一步钳制为 `1/64`（在 tasks 中写清）。  
   - **滑块旁文案**（仅 CS2）：`{offsetSeconds.toFixed(6)} s = {(subTickStep/1024).toFixed(4)} tick`（`subTickStep/1024` 即 `INIT_TICK` 在 64 tick 率下之分数 tick）；**不**再附加 `(step/1024)` 文本。

3. **左侧摘要**  
   - **移除**：**Landing Time**、**Landing Speed (unit/s)**（及对应 i18n：`landingTime`、`landingSpeed` 等连续量展示），不再使用 `sqrt(2h/g)` 等与仿真无关的独立计算。  
   - **落地时间**（键名可仍为 `landingTimeTick`）：标签**不含**「(int tick)」；数值为 **相对初始 sub-tick 的时长**：`Δt = row.time − INIT_TICK/TICK_RATE`，括号内为 **Δtick = row.currTick − INIT_TICK**（可格式化去掉多余尾随零）。  
   - **落地速度**（`landingSpeedTick`）：标签**不含**「(int tick)」；数值为**最后一行**的 **velocity**（展示用、含 3500 钳制），与右侧表同列一致。  
   - **落地伤害**等仍以循环结束时的 `prevVelocity` 与 `(prevVelocity - 580) / 420 * 100` 为准，并与表末一致。  
   - **最后 1 tick 距地面高度**：最后一行 **height(floor)**；无表行时用 `—`（`emptyDash`）。

4. **i18n**  
   - 新增文案键（版本、sub tick、初始动作、新表头）放入 `fallDamage` 命名空间，中英由现有模式扩展。

5. **下落速度上限 3500 与位移积分**（对参考 Java 单段公式的扩展）  
   - 竖直速度沿时间线性变化：`v(τ) = prevVelocity + SV_GRAVITY * τ`，其中 `τ` 为当前 tick 间隔内的经过时间（秒），`prevVelocity` 为该间隔起点速度（与 Java 中用于位移积分的 `prevVelocity` 一致）。  
   - **上限**：任何时刻用于位移与后续区间的有效速度 SHALL NOT 超过 **3500**（与现有页面 `fallSpeed`/`tickSpeed` 上限一致）。  
   - **单间隔内未触顶**（`currVelocity ≤ 3500`）：位移仍用 Java 原式  
     `prevVelocity * dt + ½ * SV_GRAVITY * dt²`，`dt = (currTick - prevTick) / TICK_RATE`。  
   - **单间隔内跨越 3500**（`prevVelocity < 3500` 且 `currVelocity > 3500`）：求临界 `t1` 使 `prevVelocity + SV_GRAVITY * t1 = 3500` 且 `0 < t1 < dt`；  
     - 第一段：`t1` 内匀加速位移 `prevVelocity * t1 + ½ * SV_GRAVITY * t1²`；  
     - 第二段：剩余时间 `t2 = dt - t1` 内匀速位移 `3500 * t2`。  
     总位移为两段之和，`height_start`/`height_floor` 同原逻辑减去该总位移。  
   - **已触顶或间隔内全程 ≥ 3500**：该间隔位移为 **`3500 * dt`**（不再叠加 `½g dt²`，因速度已被钳制为常数）。  
   - **表内 `velocity` 列**：在已达上限后的行，展示值 SHALL 与钳制一致（例如 **3500** 或与 Java 瞬时公式对比后统一约定——实现时以「不超过 3500 且与位移一致」为准）。

## Risks / Trade-offs

- **[Risk] 浮点与 Java 细微差异** → 使用相同运算顺序与 `floor` 推进；对关键常量使用字面量。  
- **[Risk] 图表与表数据不一致** → Non-Goal 中允许先更新表；图表若仍用旧 `chartData`，需在 UI 标明或一并迁移。  
- **[Risk] 1024 步与右端点 1/64** → 在实现时固定一种约定并在界面显示当前秒值。

## Migration Plan

- 纯前端变更：无数据迁移；发布后直接替换页面行为。

## Open Questions

- 若需严格 `offsetSeconds === 1/64` 作为最后一档，是否增加第 1025 档或调整公式（待实现时按产品选择其一）。
