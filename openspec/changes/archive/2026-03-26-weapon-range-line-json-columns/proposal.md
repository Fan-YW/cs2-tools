## Why

武器距离伤害页的地图测距目前用「圆心 + 半径圆」表示距离，与「两点线段」的直觉不一致；武器下拉仅显示 A 列单元格文本，未利用 Excel 注释中更友好的显示名；导出 JSON 只保留少数数值列，无法保留整张 Raw Values 的列数据，也缺少武器类型字段，不利于后续扩展与核对源表。

## What Changes

- 地图覆盖层：去掉表示测距半径的圆形绘制；在已放置起点后，用**从起点到当前（或已固定）终点的线段**表示测距，并保留起点锚点等必要视觉反馈（具体样式在设计中约定）。
- 武器显示名：`weapon-xlsx-to-json.mjs` 在解析 A 列时读取**单元格注释（comment）**作为展示用名称；若无注释则回退为单元格文本。JSON 与前端下拉使用展示名（同时保留稳定 `id` 用于选项 value 与计算键，见设计）。
- JSON 导出：从 Raw Values 表按表头将**每一列**写入每条武器记录（结构化字段，如按列名映射的对象或等价结构）；为每条记录增加 **`weaponType`**（或统一字段名，如 `type`），取值与源表分类一致（例如 `"pistol"`），来源规则在设计中根据 xlsx 实际列或分段约定明确。
- 前端 `weapon-range-damage.js`：适配新 JSON 形状；伤害计算仍使用既有公式所需列（可从全量列对象中读取相同语义列）。

## Capabilities

### New Capabilities

（无；行为均归入既有武器距离伤害能力。）

### Modified Capabilities

- `weapon-range-damage-viewer`：测距地图覆盖层由圆改为线段；武器列表展示名优先注释；数据源 JSON 包含全列与武器类型字段，加载与校验规则相应更新。

## Impact

- `js/weapon-range-damage.js`（canvas 绘制、武器列表填充、载荷规范化）。
- `scripts/weapon-xlsx-to-json.mjs`（注释读取、全列导出、`weaponType`）。
- `public/weapon/weapons.json`、`public/weapon/weapons.embed.js`（**BREAKING**：JSON 形状相对当前仅五字段记录发生变化；需重新运行 `npm run weapon:json` 并部署/提交生成物）。
- `pages/weapon-range-damage.html` 若需更新提示文案则小幅修改。
