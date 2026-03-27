## 为什么

当前 `map-range-viewer` 的刻度/坐标标注需要 `pos_x`/`pos_y`（左上角世界坐标）。现状实现会在运行时额外 `fetch public/map/raw/<map>.txt` 来解析这两个字段，导致页面在“结构化元数据应来自 `public/map/json/`”的约束下仍依赖未结构化的 txt 作为数据来源。

为保持数据契约一致（页面只以 `public/map/json/` 为结构化元数据源），并减少运行时对 txt 的耦合，本变更将 `pos_x`/`pos_y` 也纳入 `txt -> json` 转换结果，让运行时直接从 `public/map/json/<map>.json` 读取并用于刻度与坐标换算。

## 变更内容

1. 扩展 `txt -> json`：在 `scripts/map-txt-to-json.mjs` 中解析源 `.txt` 的 `pos_x`/`pos_y`，并写入 `public/map/json/<map>.json`。
2. 调整运行时数据读取：更新 `js/map-range.js`（由 `pages/map-range.html` 引入），使其用于“左侧/上侧刻度与坐标标注”的 `pos_x`/`pos_y` 来自已加载的 `public/map/json/<map>.json`（不再依赖运行时解析 txt）。
3. 保持刻度行为不变：主刻度与副刻度的计算仍按当前逻辑动态随放大倍率选择主刻度为 `1/2/5 * 10^n`，并根据主刻度“开头数字”决定副刻度数量（`1/5` 开头为 4 个，`2` 开头为 3 个）。

## 功能 (Capabilities)

### 新增功能

<!-- 若有新增独立能力请在此填写；本变更主要为元数据字段扩展与读取路径修正。 -->

### 修改功能

- `map-range-viewer`: 扩展地图元数据 JSON 契约。除现有 `scale` 与 `c4_base_damage` 外，要求 JSON 也包含 `pos_x`、`pos_y`；用于左侧/上侧刻度与坐标的世界左上角坐标不得再依赖运行时解析源 `.txt`。

## 影响

- 代码：`scripts/map-txt-to-json.mjs`、`js/map-range.js`
- 数据：`public/map/json/<map>.json`（新增 `pos_x/pos_y` 字段，由脚本生成或补全）
- 规格：`openspec/specs/map-range-viewer/spec.md` 对 JSON 元数据契约与数据源约束的增量规范

