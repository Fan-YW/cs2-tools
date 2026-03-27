## Why

当前武器页使用单选下拉，无法快速横向对比多把武器；同时表格把“护甲减少”单列展示，阅读成本高。需要改为按武器类型分组的 Tag 多选交互，并让结果表按“每把武器一行”直接对比，减少操作次数并提升可读性。

## What Changes

- 将武器选择从下拉改为按 `weaponType` 分组的 Tag 选择区：每个类型一行，行首提供 “All/Clear + 类型复数” 按钮，用于该行全选/清空。
- 将结果表从固定单武器结构改为多行结构：最左新增 `Weapon` 列显示武器名；选中一把武器就增加一行，取消选中即删除对应行。
- 把“护甲减少”并入“有护甲”三列单元格，展示格式为 `XX.XX(XX)`，括号内为护甲减少整数值。
- 保留现有距离驱动与伤害公式语义，改动仅聚焦武器选择交互和结果呈现结构。

## Capabilities

### New Capabilities

- （无）本变更通过修改现有能力完成，不新增 capability。

### Modified Capabilities

- `weapon-range-damage-viewer`: 修改武器选择交互（下拉 -> 分组 Tag 多选）与结果表结构（多武器行、合并护甲减少展示）的规范要求。

## Impact

- 受影响页面：`pages/weapon-range-damage.html`
- 受影响样式：`css/weapon-range-damage.css`（Tag 组与表格布局）
- 受影响脚本：`js/weapon-range-damage.js`（多选状态、按类型分组、表格行增删与单元格格式化）
- 规范变更：`openspec/specs/weapon-range-damage-viewer/spec.md`
