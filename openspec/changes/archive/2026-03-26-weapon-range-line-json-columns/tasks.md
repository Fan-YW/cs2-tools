## 1. xlsx → JSON（全列、注释、类型）

- [x] 1.1 打开当前 `manifest.json` 指向的 xlsx，确认 Raw Values 表头、A 列注释样本、武器类型列名或分段规则，并在 `weapon-xlsx-to-json.mjs` 注释中固化
- [x] 1.2 解析首行表头，按行遍历：从 `sheet['A'+row]` 等读取 A 列**注释**与**显示值**；输出 `id`（A 列文本）、`displayName`（注释优先否则 A 列文本）、`weaponType`（按列或分段继承）
- [x] 1.3 对每行将表头下各列写入对象（如 `columns`），值类型与 SheetJS 导出一致；跳过无效行；校验 `Damage` / `HeadshotMultiplier` / `RangeModifier` / `WeaporArmorRatio`（及别名）均可从 `columns` 解析
- [x] 1.4 写出 `weapons.json` 与 `weapons.embed.js`；运行 `npm run weapon:json` 手检条数与抽样字段

## 2. 前端地图与武器 UI

- [x] 2.1 修改 `weapon-range-damage.js` 的 `redraw()`：移除半径圆 `arc`；绘制起点锚点 + 起点到终点（`fixed`/`mouse`）的线段
- [x] 2.2 更新 `normalizeWeaponsPayload`（或等价）：接受新 JSON 形状，从 `columns` 取计算字段；`weaponSelect` 使用 `displayName` 为 `textContent`，`value` 为 `id`
- [x] 2.3 手测：测距线段、右键清除、file:// 与 HTTP、`npm run weapon:json` 后刷新

## 3. 文档与规格合并

- [x] 3.1 若 `pages/weapon-range-damage.html` 中用户可见提示需反映新 JSON 形状，更新文案
- [x] 3.2 实现完成后将本 change 的 `specs/weapon-range-damage-viewer/spec.md` 合并入 `openspec/specs/weapon-range-damage-viewer/spec.md`（或于归档时同步）
