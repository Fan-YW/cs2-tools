## Context

武器距离伤害页（`WeaponRangeView.vue`）右侧栏当前内联了地图选择、按 `weaponType` 分组的 Tag 多选、以及伤害结果表。武器数据经 `loadWeaponsJson` / `normalizeWeaponsPayload` 转为 `WeaponRow`，计算用字段来自 `columns`（与 `weaponDamageCore` 一致）。`weapons.json` 中另有 `CycleTime`、`WeaponPrice`、`KillAward`、`MaxPlayerSpeed`、`m_nPrimaryReserveAmmoMax`、`m_bReserveAmmoAsClips`、`WeaponType`（列内字符串）等，尚未在 UI 中集中展示。

## Goals / Non-Goals

**Goals:**

- 将武器 Tag 区域封装为可复用、可折叠的 UI 块；折叠态仅展示「选择武器」与向下展开图标，展开态行为与现有一致（分组、批量、多选 Tag）。
- 表格第一列武器名为可点击控件，打开模态框展示该武器从 JSON/`columns` 解析的静态属性，展示规则与用户在变更说明中给出的公式一致（缺列时展示「—」或合理回退，不崩溃）。
- 复用项目已有 Reka UI（如 `Dialog`/`AlertDialog`）与现有 CSS 变量，保持与地图工具页右栏视觉一致。

**Non-Goals:**

- 不修改伤害计算公式、测距语义与 `weapon-range-damage-viewer` 中已有数值列定义。
- 不在此变更中重做 xlsx 导出脚本或 `weapons.json`  schema（仅消费现有列名；`clip_size` 等表头以实现与 `colCI` 一致的大小写不敏感匹配）。

## Decisions

1. **组件边界**：新建 `WeaponSelectorPanel.vue`（或等价命名）承载折叠状态、`aria-expanded`、标题与图标；父级通过 `v-model`/props 传入 `weaponGroups`、`selectedIds` 与 `toggle`/`bulkToggle` 回调，避免重复拉取 JSON。
2. **折叠默认**：默认 `expanded = true`，避免首次进入用户误以为未加载武器；可选在 `localStorage` 记忆折叠状态（若实现则任务中明确键名）。
3. **模态数据**：优先从当前行对应的 `WeaponRow` 回查；若详情需原始 `columns` 中未并入 `WeaponRow` 的键，在加载 JSON 时保留 `raw` 映射 `id -> record` 或在 `WeaponRow` 扩展可选 `columns?: Record<string, unknown>`（实现时选其一，避免在模态中重复 fetch）。
4. **射速**：`rpm = 60 / CycleTime`（当 `CycleTime` 为正有限数）；否则显示「—」。
5. **护甲衰减展示**：`WeaporArmorRatio / 2` 以百分比形式展示（例如 `(ratio/2)*100` 保留合理小数位，与现有 `fmt2` 风格一致）。
6. **备弹文案**：`m_nPrimaryReserveAmmoMax` 为数值；若 `m_bReserveAmmoAsClips === true`，后缀单位显示「弹夹」，否则「子弹」。
7. **霰弹数**：仅当 `Bullets > 1` 时在模态中展示该项。
8. **可访问性**：模态具备标题、关闭按钮与焦点陷阱（Reka UI 默认行为）；武器名单元格使用 `button` 或 `role="button"` + 键盘可激活。

## Risks / Trade-offs

- **[Risk]** `columns` 键名在不同导出批次可能略有差异 → **Mitigation**：沿用 `weaponLoader` 中 `colCI` 模式或抽共享 `getColumn`。
- **[Risk]** 表格第一列可点击与行内选中文案混淆 → **Mitigation**：仅名称单元格可点，样式上可下划线或 `cursor:pointer`，不改变 Tag 多选逻辑。
- **[Trade-off]** 保留完整 `columns` 会增加内存 → 仅存 `id`→`columns` 的浅引用即可接受。

## Migration Plan

纯前端变更：合并后执行 `npm run build` 验证；无需数据迁移。回滚即还原组件与视图改动。

## Open Questions

- 折叠状态是否持久化到 `localStorage`（默认不持久化，除非产品确认）。
