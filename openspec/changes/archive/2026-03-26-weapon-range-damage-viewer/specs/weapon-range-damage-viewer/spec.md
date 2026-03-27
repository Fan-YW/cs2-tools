# weapon-range-damage-viewer 规范

## 目的

在保留地图测距的前提下，依据 `public/weapon` 下由构建脚本从 xlsx **Raw Values** 表导出的 **JSON**（默认 `weapons.json`，由 `manifest.json` 的 `weaponsJson` 指定）中的武器数值，按约定公式计算并展示各部位在不同距离下的伤害及护甲相关数值。更新表格源文件后须重新运行 `npm run weapon:json`（或 `npm run weapon:data`）再部署或刷新静态资源。

## 需求

### 需求:入口与页面布局

系统必须在站点根目录的导航页（`index.html`）提供指向本工具的链接。本工具必须使用独立 HTML 页面（位于 `pages/` 下），并引入 Pico CSS（CDN 方式与地图工具页一致）。页面布局必须与 `pages/map-range.html` 同型：左侧为正方形地图视口（与地图工具相同的缩放、平移与测距能力），右侧为信息栏。

#### 场景:从首页进入

- **当** 用户在首页点击「武器距离伤害」或等价链接
- **那么** 必须打开本工具页面且左侧地图与右侧栏可见

### 需求:地图选择与距离

系统必须在右侧栏最上方提供地图下拉选择，且必须与现有七张竞技地图数据源一致。系统必须在与地图工具相同的语义下展示**当前测距距离**（游戏单位），该距离必须驱动下方武器伤害计算中的「距离」变量。

#### 场景:距离参与计算

- **当** 用户在地图上完成测距且距离有效
- **那么** 武器伤害表必须使用当前距离值代入公式中的指数项

### 需求:武器 JSON 数据源（由 xlsx 预生成）

武器原始表为 xlsx 内 **`Raw Values`** 工作表（名称匹配策略以实现为准）。**运行时**页面必须仅通过 HTTP 加载 `public/weapon/` 下由 **`manifest.json`** 的 `weaponsJson` 字段指定的 JSON 文件（缺省时为 `weapons.json`）。该 JSON 必须由仓库内脚本（`scripts/weapon-xlsx-to-json.mjs`）从 `manifest.json` 所指定 xlsx 生成；每条武器记录至少包含：`id`、`damage`、`headMul`、`rangeMod`、`weaponArmor`（与 xlsx 列 `Damage` / `HeadshotMultiplier` / `RangeModifier` / `WeaporArmorRatio` 对应）。

#### 场景:manifest 与 JSON 就绪

- **当** `manifest.json` 存在且 `weaponsJson` 指向的 JSON 已生成并包含至少一把有效武器
- **那么** 页面必须成功加载该 JSON 且能列出武器

#### 场景:加载或格式失败

- **当** JSON 缺失、无法请求或内容不符合约定结构
- **那么** 系统必须在右栏展示可读错误信息（可提示运行 `npm run weapon:json`），且不得抛出未捕获异常导致白屏

### 需求:伤害指数因子

设 \(d\) 为当前距离（游戏单位），`RangeModifier` 为表中取值。系统必须计算 \(R = \text{RangeModifier}^{(d/500)}\)（即 `RangeModifier` 的 \((d/500)\) 次幂），且所有下列部位公式中的「距离衰减部分」必须使用同一 \(R\)。

#### 场景:距离为 0 或正值

- **当** 距离 \(d\) 为非负有限数且 `RangeModifier` 为正有限数
- **那么** \(R\) 必须为有限正数并参与各部位计算

### 需求:无护甲伤害（表格第 3 行第 2–5 列）

系统必须按下式计算无护甲伤害（结果展示保留 **2 位小数**）：

- **头**：\(\text{Damage} \times \text{HeadShotMultiplier} \times R\)
- **胸/手臂**：\(\text{Damage} \times 1.00 \times R\)
- **腹**：\(\text{Damage} \times 1.25 \times R\)
- **腿**：\(\text{Damage} \times 0.75 \times R\)

#### 场景:切换武器或距离

- **当** 用户更换武器或地图测距距离变化
- **那么** 第 3 行第 2–5 列必须按上式更新

### 需求:有护甲伤害（表格第 3 行第 6–8 列）

系统必须仅在三列展示：**头、胸/手臂、腹**（与表格列对齐）。有护甲伤害必须在对应无护甲伤害基础上乘以 \((\text{WeaponArmor}/2)\)。展示格式必须为 **2 位小数**。

- **头（有护甲）**：\((\text{Damage} \times \text{HeadShotMultiplier} \times R) \times (\text{WeaponArmor}/2)\)
- **胸/手臂（有护甲）**：\((\text{Damage} \times 1.00 \times R) \times (\text{WeaponArmor}/2)\)
- **腹（有护甲）**：\((\text{Damage} \times 1.25 \times R) \times (\text{WeaponArmor}/2)\)

#### 场景:有护甲三列更新

- **当** 武器或距离变化
- **那么** 第 3 行第 6–8 列必须按上式更新

### 需求:护甲减少（表格第 4 行）

系统必须在第 4 行第 1 列展示标签「护甲减少」。第 4 行第 **2–5** 列必须固定展示 **「-」**（或等价占位，表示不适用）。第 **6–8** 列必须为整数，且数值必须为下列表达式计算后 **向下取整**（`floor`）：

- **头**：\(\left\lfloor \text{Damage} \times \text{HeadShotMultiplier} \times \dfrac{(2 - \text{WeaponArmor})}{4} \times R \right\rfloor\)
- **胸/手臂**：\(\left\lfloor \text{Damage} \times 1.00 \times \dfrac{(2 - \text{WeaponArmor})}{4} \times R \right\rfloor\)
- **腹**：\(\left\lfloor \text{Damage} \times 1.25 \times \dfrac{(2 - \text{WeaponArmor})}{4} \times R \right\rfloor\)

#### 场景:护甲减少为整数

- **当** 计算完成
- **那么** 第 4 行第 6–8 列必须为整数且与 floor 定义一致

### 需求:表格结构

系统必须使用 **4 行 × 8 列** 的表格呈现上述数据。第 1 行：第 **2–5** 列必须合并为单一单元格，内容为「无护甲」；第 **6–8** 列必须合并为单一单元格，内容为「有护甲」。第 2 行从左到右列标题必须为：**部位、头、胸/手臂、腹、腿、头、胸/手臂、腹**。第 3 行第 1 列为「伤害」，第 4 行第 1 列为「护甲减少」。

#### 场景:表头与合并单元格

- **当** 用户打开页面
- **那么** 必须看到符合上述合并与列标题的表格结构
