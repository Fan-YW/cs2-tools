## Context

仓库为静态 HTML/CSS/JS，地图工具在 `pages/map-range.html`，数据在 `public/map/`。用户计划在 `public/weapon/` 存放 CS2 武器 xlsx（文件名含 `Last Weapon Update` 与日期）。

## Goals / Non-Goals

**Goals:**

- 新页与 `map-range` 视觉与布局一致：左地图、右栏地图选择 + 距离 + 武器伤害表。
- 从 **Raw Value** 表读取每把武器的 `Damage`、`HeadShotMultiplier`、`RangeModifier`、`WeaponArmor`（列名以表头行为准，实现阶段做稳定映射；若表头别名在 tasks 中处理）。
- 按用户给定公式计算并填表；距离使用与地图页相同的「游戏单位」距离（由地图交互得出）。

**Non-Goals:**

- 不修改 C4 伤害公式与现有 `map-range-viewer` 规范条目。
- 不在浏览器内无用户许可时上传 xlsx；仅 fetch 仓库内静态文件。

## Decisions

1. **「最新 xlsx」在纯静态下的解析**  
   - 浏览器无法列出目录。采用 **`public/weapon/manifest.json`**，形如 `{ "xlsx": "CS2 Weapon Spreadsheet (Last Weapon Update_ March 18, 2026).xlsx" }`。  
   - 提供可选 **`scripts/weapon-manifest.mjs`**：扫描 `public/weapon/*.xlsx`，从文件名中解析 `Last Weapon Update_ <date>`，选最新日期写入 manifest（实现细节：解析日期字符串或使用文件 mtime 由脚本决定）。  
   - **备选**：维护者每次更新表格后手工改 manifest 或固定 symlink 名 `weapon-latest.xlsx`（Windows 可用复制覆盖）。

2. **xlsx 在浏览器内解析**  
   - 使用 **SheetJS**（如 `xlsx.full.min.js`）自 CDN 加载，`fetch(manifest 指向的相对 URL)` 后 `read` + 取 sheet `Raw Value`。  
   - **理由**：符合「无打包」；数据更新只需换 xlsx + 重跑 manifest 脚本。

3. **武器选择**  
   - 右栏在「距离」行下增加 **武器下拉框**；选项来自 Raw Value 表中每一数据行（主键列为表内武器名/ID 列，实现时以首列或明确列名锁定，写入 tasks 验证）。

4. **距离与地图**  
   - 复用 `map-range` 的地图、缩放、测距得出距离；新页可 **嵌入同一 JS 模块** 或 **复制初始化逻辑**（design 倾向：抽取共享 `js/map-viewport.js` 为可选后续任务；MVP 允许在新页引用精简版或 duplicate 最小测距绑定——tasks 择一）。

5. **表格列与有护甲列**  
   - 第 2 行第 6–8 列仅为 **头 / 胸/手臂 / 腹**（与用户需求一致）；**腿**仅在无护甲第 2–5 列中展示。有护甲伤害为三列：`无护甲对应部位伤害 × (WeaponArmor/2)`（按用户给定规则）。

6. **护甲减少行**  
   - 第 6–8 列公式按用户给出的头/胸/腹；**腿**不设护甲减少列（以 `-` 或空白不适用——第 4 行仅三列整数，与列对齐）。

7. **指数项**  
   - 统一记 \(R = \text{RangeModifier}^{(\text{距离}/500)}\)，距离为当前游戏单位距离。

## Risks / Trade-offs

- **[Risk] 表头列名与语言** → 首版在 tasks 中要求对照真实 xlsx 填映射表；加载失败时右栏错误提示。  
- **[Risk] xlsx 体积** → 首次解析可能卡顿；可接受或后续加 Web Worker。  
- **[Risk] WeaponArmor 语义** → 公式按用户原文实现；若与游戏内定义不符，后续单开平衡修正。

## Migration Plan

1. 添加 manifest +（可选）生成脚本。  
2. 新页面 + JS 拉 xlsx + 填表。  
3. `index.html` 加链接。  
4. 手测：换距离、换武器、对比 Excel 抽样。

## Open Questions

- **Raw Value** 中武器名所在列、是否有表头行偏移：实现首周从真实文件确认。  
- 用户未写 **腿部** 的「有护甲伤害」与「护甲减少」：当前按 **仅无护甲列展示腿**、有护甲三列不含腿执行。
