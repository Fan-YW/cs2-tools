## 1. 数据与工具函数

- [x] 1.1 在加载 `weapons.json` 后保留 `id → columns`（或完整原始项）映射，供详情模态读取 `CycleTime`、`WeaponPrice` 等未在 `WeaponRow` 顶层的字段；必要时扩展 `WeaponRow` 或并行 `ref` 映射。
- [x] 1.2 抽取 `getColumn(columns, name)`（大小写不敏感）与 `formatWeaponDetailStats(row)`（或等价），实现护甲衰减百分比、rpm、静步/蹲走速度、备弹单位文案、`Bullets>1` 时霰弹数行等展示逻辑，与 spec 一致。

## 2. 可折叠武器选择组件

- [x] 2.1 新建 `WeaponSelectorPanel`（或等价）组件：折叠态仅渲染「选择武器」+ 向下展开图标，`aria-expanded` 与可点击标题切换展开状态。
- [x] 2.2 将 `WeaponRangeView` 中现有 `weapon-tag-groups` 区块迁入该组件，保持 `weaponGroups`、批量按钮与 Tag 多选行为不变。
- [x] 2.3 为折叠标题行补充与右栏一致的间距与 hover/focus 样式。

## 3. 武器详情模态与表格交互

- [x] 3.1 使用 Reka UI `Dialog`（或项目已有对话框封装）实现模态：标题为武器 `displayName`，正文为 1.2 的格式化列表；提供关闭控件。
- [x] 3.2 将伤害表第一列武器名单元格改为可激活控件（`button` 或 `role="button\"`），点击打开模态并传入对应 `id`；阻止冒泡以免误触其他行为。
- [x] 3.3 确认仅名称列打开模态，伤害数值列不触发；键盘可聚焦并 Enter/Space 打开。

## 4. 验证

- [x] 4.1 手动验证：折叠/展开、全选/全清、表格点击多把武器打开详情、缺失列时无白屏。
- [x] 4.2 运行 `npm run build`（或项目既定检查命令）确保无类型与构建错误。
