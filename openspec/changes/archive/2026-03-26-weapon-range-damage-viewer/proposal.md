## Why

地图测距页已支持距离与 C4 伤害，但武器随距离、部位与护甲衰减的伤害缺少统一、可对照数据表的计算界面。将 CS2 武器表格（xlsx）中的 **Raw Value** 参数接入同一套「左地图 + 右侧面板」布局，便于在测距同时查看各部位伤害与护甲减免。

## What Changes

- 在根目录 **`index.html`** 增加入口链接，指向新页面（例如 **`pages/weapon-range-damage.html`**）。
- 新增页面：布局参考 **`pages/map-range.html`**（Pico CDN + 左正方形地图视口 + 右栏）；左侧地图与测距交互与地图页一致或复用同一套资源与逻辑约定。
- 右栏：**第一行** 地图选择、**第二行** 距离展示（与地图页一致，距离仍来自地图测距）。
- 右栏 **第二行以下**：新增 **4 行 × 8 列** 表格（HTML `table` + `colspan`/`rowspan`）：
  - 第 1 行：第 2–5 列合并标题「无护甲」；第 6–8 列合并标题「有护甲」。
  - 第 2 行：列标题依次为 **部位、头、胸/手臂、腹、腿、头、胸/手臂、腹**（有护甲侧仅三列部位，与下列伤害列对齐）。
  - 第 3 行：**伤害** + 各列计算值（**保留 2 位小数**）。
  - 第 4 行：**护甲减少**；第 2–5 列为 **「-」**；第 6–8 列为整数（**向下取整**）。
- 数据来源：在 **`public/weapon/`** 下解析 **文件名日期最新** 的 `.xlsx`，读取工作表 **`Raw Value`**（名称大小写按实现与文件一致匹配）。静态托管下列目录需配合 **`manifest.json`**（或其它约定）解析「当前最新 xlsx 文件名」——见 design。
- **BREAKING**：无（新页面）；若将来替换 xlsx 列名需同步解析映射。

## Capabilities

### New Capabilities

- `weapon-range-damage-viewer`：武器距离与部位伤害展示、xlsx Raw Value 读取、与地图测距联动的右侧面板与表格计算与展示规则。

### Modified Capabilities

（无；不修改 `map-range-viewer` 的 C4 规范语义，仅新增独立工具页；可选后续再提「复用布局」的 vanilla 文档示例，非必须。）

## Impact

- 新增 `pages/weapon-range-damage.html`、`css/`、`js/` 中对应文件（或共享样式片段）。
- `public/weapon/`：xlsx 文件 + 建议 `manifest.json`；可选 `scripts/` 下生成 manifest 的 Node 脚本。
- 浏览器侧需 xlsx 解析（如 SheetJS 类库 CDN）；不引入应用级打包器（与仓库 vanilla 约定一致）。
