## 1. 状态与布局（FallDamageView）

- [x] 1.1 在左侧栏最上方增加「2」「GO」切换；根据选择控制其下 Server Tick 区：「2」仅显示「64 + sub tick」；「GO」显示 64/128 二选一且不显示 sub tick 滑块
- [x] 1.2 在高度输入下方增加「初始动作」：「坠落」「跳」；与版本组合绑定 `INIT_VELOCITY`（跳：2→-298.908405，GO→-295.7434082；坠落→0）
- [x] 1.3 在「64 + sub tick」模式下，在 Server Tick 下方增加 sub tick offset 滑块（0～1/64 秒，1024 step，每步 1/65536 秒），标签「sub tick offset」；计算 `INIT_TICK = (step/65536) * TICK_RATE`（TICK_RATE=64）；GO 模式 `INIT_TICK = 0`

## 2. 仿真与右侧表

- [x] 2.1 实现与参考 Java 一致的仿真循环（`SV_GRAVITY=800`、`START_HEIGHT`=用户高度、`INIT_TIME`、`currVelocity`、位移积分、`currTick`→`floor(currTick)+1`、终止于 `height_floor < 2`），并加入**速度上限 3500**：若某间隔 `prevVelocity < 3500` 且 `currVelocity > 3500`，用临界 `t1` 将位移拆为 `V0·t1+½g·t1²` 与 `3500·t2`；封顶后各间隔位移为 `3500·dt`；输出落地 `prevVelocity` 与伤害 `(prevVelocity-580)/420*100`
- [x] 2.2 将右侧表替换为列：tick | time | velocity | height(start) | height(floor)，行数据来自仿真循环，格式对齐 Java `printf` 风格
- [x] 2.3 更新左侧结果区与仿真一致：**移除** Landing Time、Landing Speed (unit/s)；**Landing Time (int tick)** / **Landing Speed (int tick)** 仅从仿真**最后一行表数据**取 tick、time、velocity；**新增**「最后 1 tick 距地面高度」= 最后一行 `height(floor)`；伤害等与表末 `prevVelocity` 一致；删除 `fallTime`/`fallSpeed` 等与 `sqrt(2h/g)` 绑定的展示逻辑

## 3. i18n、图表与收尾

- [x] 3.1 为版本、64+sub tick、sub tick offset、初始动作、新表头、**最后 1 tick 距地面高度**添加 `fallDamage` 文案（中/英与其它页面一致）；可保留或弃用 `landingTime`/`landingSpeed` 键（若 UI 已移除则不再引用）
- [x] 3.2 评估 `showChart`/`chartData`：与同一仿真对齐或暂时禁用并加注释，避免与表矛盾
- [x] 3.3 手动验证：「2」+滑块+跳、「GO」64/128+跳、「坠落」+无 sub tick 等组合的表末速度与伤害

## 4. 文档与 OpenSpec 主线

- [x] 4.1 将实现后澄清（滑块 `s = tick` 文案、去 `(xxx/1024)`、落地时间为 Δt/Δtick、标签去「(int tick)」）写回变更内 proposal/design/spec，并新增主线 `openspec/specs/fall-damage-view/spec.md`
