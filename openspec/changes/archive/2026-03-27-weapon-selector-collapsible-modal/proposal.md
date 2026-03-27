## Why

武器距离伤害页右侧栏中，武器 Tag 多选区在武器较多时占用大量纵向空间，影响地图与表格的整体浏览效率。同时用户希望在结果表格中快速查看单把武器的原始数值（护甲穿透、射速、价格等），而当前表格仅展示距离伤害，缺少从 `weapons.json` 派生的静态属性一览。

## What Changes

- 将「按 `weaponType` 分组的武器 Tag 多选 + 批量按钮」抽成**可折叠**的独立组件或等价封装：折叠时仅显示文案「选择武器」与**向下展开**图标；展开时保持现有分组、批量与 Tag 多选行为不变。
- 将伤害结果表格中**武器名称列**（第一列）设为**可点击**；点击后打开**模态窗口**（对话框），内容从已加载的 `weapons.json` 记录中读取并展示。
- 模态内按约定字段与公式展示：护甲衰减（`WeaporArmorRatio`/2，百分比）、基本伤害、距离衰减系数、爆头倍率、射速（60/`CycleTime` rpm）、击杀奖励、最大速度及静步/蹲走派生速度、弹夹与备弹（含 `m_bReserveAmmoAsClips` 决定「弹夹」或「子弹」文案）、武器价格、最远射击距离、类型、`Bullets`（仅当大于 1 时显示霰弹数）等；具体键名与缺省展示以实现与 `weaponLoader`/JSON 结构对齐为准。

## Capabilities

### New Capabilities

- （无独立新能力目录；行为作为武器距离伤害页的增量需求，见下方「修改的能力」。）

### Modified Capabilities

- `weapon-range-damage-viewer`：增加「武器选择区可折叠」「表格武器名可点开详情模态」及「模态内静态属性展示规则」相关需求；不改变现有伤害计算公式与地图测距语义。

## Impact

- 主要影响 `src/views/WeaponRangeView.vue`（或拆出的子组件）及样式；可能扩展 `weaponLoader`/类型定义以暴露模态所需列（若尚未在 `WeaponRow`/`columns` 中统一）。
- 依赖现有 `public/weapon/weapons.json` 与 Reka UI（对话框等）及项目既有样式变量；无后端变更。
