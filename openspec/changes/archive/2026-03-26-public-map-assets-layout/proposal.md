## Why

`public` 下地图相关资源分散在 `public/json/`、`public/png/` 与 `public/map/*.txt` 三处，与「同一业务域（地图）数据集中」的维护习惯不一致。将 JSON、PNG 与源概览 txt 统一收拢到 `public/map/` 的子目录中，可减少根级目录数量、明确「raw / 派生 JSON / 派生 PNG」分层。

## What Changes

- 将现有 `public/map/*.txt` 移至 **`public/map/raw/`**（保持文件名与地图基名一致）。
- 将 `public/json/*.json` 移至 **`public/map/json/`**；将 `public/png/*`（雷达图等）移至 **`public/map/png/`**。
- 删除迁空后的顶层 **`public/json/`**、**`public/png/`** 目录（若不再使用）。
- 更新 **`js/map-range.js`** 中 fetch / `img.src` 的相对路径，使其指向 `../public/map/json/`、`../public/map/png/`、`../public/map/raw/`（自 `pages/` 出发）。
- 更新 **`scripts/map-txt-to-json.mjs`**：从 `public/map/raw/*.txt` 读取，写入 `public/map/json/*.json`。
- **保留原始 txt**：`public/map/raw/` 中的 Valve 概览 `.txt` **保留**，可与同图 **`public/map/png/`** 雷达图、**`public/map/json/`** 并存；维护流程**不得**因已存在 PNG 而删除 raw txt。
- **BREAKING**：任何硬编码旧路径（`public/json/`、`public/png/`、`public/map/de_*.txt`）的外部脚本、文档或书签需同步更新。

## Capabilities

### New Capabilities

（无；本变更为目录契约调整，通过修改既有能力规范表达。）

### Modified Capabilities

- `map-range-viewer`：更新 PNG / JSON / `raw` 归档路径；明确 raw txt 与 PNG 可并存、不得因 PNG 删除 txt。
- `vanilla-frontend-structure`：更新「静态数据子目录示例」，与新的 `public/map/...` 约定一致。

## Impact

- 数据文件：物理移动目录与文件；若仓库中 `public/png` 当前为空或未跟踪，实现阶段仍须创建 `public/map/png/` 并约定后续资源放入此处。
- 代码：`js/map-range.js`、`scripts/map-txt-to-json.mjs`；全库检索 `public/json`、`public/png`、`public/map/`（txt 直铺）的引用。
- OpenSpec：`openspec/specs/map-range-viewer/spec.md`、`openspec/specs/vanilla-frontend-structure/spec.md` 需在实现后随归档或本变更的 delta 合并更新。
