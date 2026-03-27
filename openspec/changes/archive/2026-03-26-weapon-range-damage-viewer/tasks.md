## 1. 数据与清单

- [x] 1.1 在 `public/weapon/` 增加 `manifest.json`，指向当前应加载的 xlsx 文件名（与仓库内实际文件名一致）
- [x] 1.2 新增 `scripts/weapon-manifest.mjs`（可选但推荐）：扫描 `public/weapon/*.xlsx`，按文件名中 `Last Weapon Update_` 后日期选取最新，写入 `manifest.json`
- [x] 1.3 打开真实 xlsx，确认 **Raw Value** 表精确名称、表头行号、武器名列及 `Damage` / `HeadShotMultiplier` / `RangeModifier` / `WeaponArmor` 列索引或列名映射

## 2. 页面与样式

- [x] 2.1 新建 `pages/weapon-range-damage.html`：Pico CDN、左侧地图结构对齐 `map-range.html`（视口、canvas、scale-hint 等按复用策略实现）
- [x] 2.2 新建 `css/weapon-range-damage.css`（及按需复用 `map-range.css` 中的布局类），保证右栏可容纳表格与下拉框
- [x] 2.3 右栏实现 4×8 表格：第 1 行 colspan、第 2–4 行按规范填标签与占位

## 3. 逻辑与 xlsx

- [x] 3.1 新建 `js/weapon-range-damage.js`：从 `../public/weapon/manifest.json` 读取文件名，再 `fetch` xlsx；引入 SheetJS（CDN）解析 **Raw Value**
- [x] 3.2 填充武器 `<select>`；绑定地图选择、距离读数（与地图测距状态同步，可复用或抽取与 `map-range.js` 共享的最小逻辑）
- [x] 3.3 实现 \(R=\text{RangeModifier}^{(d/500)}\) 及无护甲 / 有护甲 / 护甲减少（floor）全部公式，更新表格单元格（伤害两位小数，护甲减少整数）
- [x] 3.4 错误处理：缺文件、缺表、缺列、无有效距离时的 UI 提示

## 4. 集成

- [x] 4.1 在根目录 `index.html` 的导航中增加「武器距离伤害」链接至新页面
- [x] 4.2 手测：多武器、多距离、与 Excel 手工抽样对比；更新 manifest 后刷新仍加载正确文件

## 5. 规范合并

- [x] 5.1 实现完成后将 `specs/weapon-range-damage-viewer/spec.md` 合并入 `openspec/specs/weapon-range-damage-viewer/spec.md`（或于归档时同步）
