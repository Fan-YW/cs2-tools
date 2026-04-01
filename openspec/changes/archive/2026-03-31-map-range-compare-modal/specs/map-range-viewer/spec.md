## ADDED Requirements

### Requirement: Map range table supports selecting two weapons for comparison

系统 MUST 在 `MapRangeView` 的右侧数据表格最左侧新增一列「对比」。

该列在每一行必须显示一个可点击控件，用于将该行武器加入/移出对比选择：
- **未选中**：显示 `+`
- **已选中**：显示 `-`

系统 MUST 允许同时选中最多 **2** 个武器用于对比。

#### Scenario: Select first weapon shows minus
- **WHEN** 用户在某武器行的「对比」列点击 `+`
- **THEN** 该行的显示必须变为 `-`
- **AND THEN** 当前已选对比数量必须为 1

#### Scenario: Deselect weapon restores plus
- **WHEN** 用户在已选中的武器行点击 `-`
- **THEN** 该行的显示必须变为 `+`
- **AND THEN** 当前已选对比数量必须减少 1

#### Scenario: Selecting third weapon is blocked while two selected
- **WHEN** 用户已选中 2 个武器
- **THEN** 所有未被选中的行的 `+` 控件必须不可用（disabled）且不可将第三个武器加入对比
- **AND THEN** 用户仍必须能够对已选中的两行点击 `-` 取消选择

### Requirement: Comparison modal opens with two selected weapons and remains lock-enforcing after close

当系统检测到已选中的对比武器数量达到 **2** 时，系统 MUST 自动打开一个对比模态窗口。

系统 MUST 允许用户关闭该模态窗口；关闭后系统 MUST NOT 自动清空对比选择。

关闭模态窗口后，只要仍有 2 个武器处于对比选择状态，系统 MUST 保持“禁止选择其他武器”的锁定规则（即：只能在这两个中至少取消一个后，才能选择其它武器）。

#### Scenario: Auto-open modal when second weapon selected
- **WHEN** 用户选中第二个武器使已选数量从 1 变为 2
- **THEN** 系统必须自动打开对比模态窗口

#### Scenario: Closing modal does not clear selection
- **WHEN** 对比模态窗口处于打开状态且已选数量为 2
- **AND WHEN** 用户关闭对比模态窗口
- **THEN** 系统必须保持已选数量仍为 2
- **AND THEN** 未被选中的行必须仍处于不可选择（disabled）状态

### Requirement: Comparison modal shows three-column diff and highlights better/worse

对比模态窗口 MUST 包含三列布局：
- 左列：武器 A 的值
- 中列：属性（字段/指标）名称
- 右列：武器 B 的值

模态窗口 MUST 对 `MapRangeView` 表格中呈现的**全部字段/列**进行逐项对比（不得遗漏用户在表格中可见的列）。

当某字段两侧值可比较且存在优劣时，系统 MUST 满足：
- 较优项必须使用绿色背景高亮
- 较差项必须使用红色背景高亮

当两侧值相等、缺失或不可比较时，系统 MUST 使用中性样式（不得标红或标绿）。

#### Scenario: Better value highlighted green and worse red
- **WHEN** 对比模态窗口展示某数值字段且两侧均为可比较的有效数值
- **AND WHEN** 该字段存在可判定的较优与较差
- **THEN** 较优侧必须显示绿色背景
- **AND THEN** 较差侧必须显示红色背景

#### Scenario: Equal or non-comparable values are neutral
- **WHEN** 对比模态窗口展示某字段且两侧值相等或任一侧缺失/不可比较
- **THEN** 两侧必须均不显示红/绿高亮（中性样式）

