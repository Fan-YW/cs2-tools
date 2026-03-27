## Context

当前约定：`pages/map-range.html` 经 `js/map-range.js` 从 `../public/json/`、`../public/png/` 加载数据；源 Valve 概览 `.txt` 位于 `public/map/` 根下。`scripts/map-txt-to-json.mjs` 从 `public/map/*.txt` 读入并写入 `public/json/`。

## Goals / Non-Goals

**Goals:**

- 统一地图资源树：`public/map/raw`（源 txt）、`public/map/json`、`public/map/png`。
- 前端与脚本仅引用新路径；静态托管根仍为仓库根时相对 URL 自 `pages/` 为 `../public/map/...`。

**Non-Goals:**

- 不改变地图测距 / C4 伤害等功能行为与 JSON 字段语义。
- 不引入打包工具或改页面路由结构。
- 不处理 `public/` 下与地图无关的其它文件（例如若存在独立电子表格等，保持原位除非另行变更）。

## Decisions

1. **子目录命名：`raw` / `json` / `png`**  
   - **理由**：短且与用途一致；`raw` 明确表示未转换源文件。  
   - **备选**：`source` / `txt` — 可选用 `txt` 代替 `raw`，但用户明确要求 `raw`，本设计采用 **`public/map/raw`**。

2. **迁移顺序**  
   - 先创建 `public/map/raw`，将现有 `public/map/*.txt` 移入（避免与即将创建的 `public/map/json`、`public/map/png` 混淆）。  
   - 再移动 `public/json` → `public/map/json`、`public/png` → `public/map/png`。  
   - **理由**：先腾空 `public/map` 根下列表，再在同父目录下创建并列子文件夹。

3. **脚本输出目录**  
   - `map-txt-to-json.mjs` 的 `mapDir` → `public/map/raw`，`outDir` → `public/map/json`。  
   - **理由**：与运行时、规范单一路径。

3b. **txt→JSON 字段完整性**  
   - 脚本须解析 raw 中**全部** `"键" "值"` 对，写入 JSON 的 **`entries`** 数组（顺序一致、重复键全保留）；顶层仍输出 `scale`、`c4_base_damage`、`pos_x`、`pos_y` 数值供页面使用（取各键在文件中**最后一次**出现的值）。

4. **空目录清理**  
   - 迁移后删除空的 `public/json`、`public/png`。  
   - **理由**：避免双轨路径误导贡献者。

5. **raw txt 与 PNG 并存**  
   - **规则**：`public/map/raw/<id>.txt` 作为源文件**保留**，即使同图已有 `public/map/png/<id>_radar_psd.png`。  
   - **理由**：产品要求不删除原始 txt，便于再生成 JSON 与对照 Valve 源数据。

## Risks / Trade-offs

- **[Risk] 本地或 CI 仍有旧路径** → 迁移后全库 `rg "public/json"` / `public/png` / `public/map/de_` 并修正。  
- **[Risk] PNG 未纳入版本库** → 实现时仍须保证 `public/map/png` 存在；部署文档说明雷达图放入该目录。  

## Migration Plan

1. 建目录并移动文件（git mv 优先）。  
2. 改 `js/map-range.js` 与 `scripts/map-txt-to-json.mjs`。  
3. 运行 `node scripts/map-txt-to-json.mjs` 验证写入路径。  
4. 静态服务器自根目录打开 `pages/map-range.html` 手测选图与加载。

## Open Questions

- 无。
