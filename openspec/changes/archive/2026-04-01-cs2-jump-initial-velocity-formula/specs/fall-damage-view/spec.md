## MODIFIED Requirements

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
