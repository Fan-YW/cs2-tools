## Context

- `js/weapon-range-damage.js` 在 `redraw()` 中以圆心点 + `arc` 半径圆表示测距；距离计算本身已是两点欧氏距离 × `scale`，与「线段」语义一致。
- `scripts/weapon-xlsx-to-json.mjs` 用 `sheet_to_json` 首行表头 + 固定列索引，仅输出 `id`、`damage`、`headMul`、`rangeMod`、`weaponArmor`。
- Excel **Raw Values** 中 A 列武器标识可能对玩家不友好，注释中常有可读名称；表中通常还有类型/分类信息（或可通过某列表达为 `pistol` 等）。

## Goals / Non-Goals

**Goals:**

- 覆盖层改为**线段**（起点 → 当前/固定终点），去掉半径圆。
- 导出 JSON：**每条武器记录包含 Raw Values 表头下所有列的值**（结构化存储，键与表头一致或经一致化规则映射）；增加 **`weaponType`** 字符串（与源表分类一致，如 `pistol`）。
- A 列：**优先使用单元格注释作为展示名**；无注释时用单元格文本。稳定键 **`id`** 仍取自 A 列**单元格显示文本**（trim），与现有选项 value、计算查找一致。
- 前端下拉：**选项可见文本**为展示名；`value` 或内部键保持 `id` 不变。

**Non-Goals:**

- 不改变伤害/护甲公式与表格布局（除上述展示与数据源形状）。
- 不要求在 UI 中展示全部列（仅 JSON 与脚本全量保留）；不在此变更中重做地图页与 `map-range.html` 的完全行为对齐以外的交互。

## Decisions

1. **JSON 形状**  
   - 顶层仍为 `{ sourceXlsx, generatedAt, weapons }`。  
   - 每条 `weapons[i]`：**保留** `id`（A 列单元格文本）、**新增** `displayName`（注释优先，否则同 `id` 或同 A 列文本，以实现为准但须满足 spec）、**新增** `weaponType`、`columns`（或等价名 `raw`）：对象，键为表头字符串（trim），值为单元格原始导出类型（数字/字符串/布尔/null），与 xlsx 一致。  
   - **计算用字段**：前端从 `columns` 中按现有列名解析 `Damage`、`HeadshotMultiplier`、`RangeModifier`、`WeaporArmorRatio`（及别名），与脚本当前 `col()` 逻辑对齐；同时可在生成时冗余顶层 `damage` 等以兼容旧消费方——本设计**推荐**单一来源：仅 `columns` + 顶层 `id`/`displayName`/`weaponType`，由前端统一读取，避免重复与不一致（若任务阶段发现嵌入脚本体积敏感，可再评估冗余字段）。

2. **注释读取**  
   - 使用 SheetJS 工作表单元格对象（如 `sheet['A2']`）的注释字段：以库实际暴露为准（常见为 `c` / 内嵌数组或纯文本）。解析为**纯文本**展示名；多段注释取主文本或拼接规则在实现中固定并写清。

3. **`weaponType` 来源**  
   - **优先**：Raw Values 表中存在明确类型列（如 `Type`、`WeaponType`、`Category` 等）时，按表头匹配取行值并规范为小写英文 slug（如 `pistol`），与 xlsx 一致。  
   - **否则**：按表内**分段**（例如类型行仅填类型、武器行 A 列为空则继承上一类型）扫描实现；在 `Open Questions` 中若仓库内 xlsx 与实现不一致，以手检样本为准在任务中锁定规则。

4. **线段绘制**  
   - 保留起点小圆点（或等价锚点）；**删除** `ctx.arc(..., rMeas, ...)` 整圆。  
   - 增加 `moveTo`/`lineTo` 从起点 UV 转屏幕坐标到终点 UV；线宽/颜色与现测距描边一致或略调以保证可见性。

## Risks / Trade-offs

- **[Risk] JSON 体积增大** → 全列写入；可接受静态站点场景；`weapons.embed.js` 变大 → Mitigation：按需后续 gzip/拆分，本变更不阻塞。  
- **[Risk] 表头重复或空列** → Mitigation：生成时对键去重/跳过全空列策略在脚本中定义并在任务中测一条样本。  
- **[Risk] 注释 API 因 xlsx 版本差异** → Mitigation：对无注释路径已有回退；单测或手检 2～3 个带注释格。

## Migration Plan

1. 合并后运行 `npm run weapon:json`（或 `weapon:data`）重写 `weapons.json` 与 `weapons.embed.js`。  
2. 旧 JSON 仅五字段时将无法通过新校验 → 属预期 **BREAKING**；全仓库一次迁移。  
3. 回滚：还原脚本与前端并恢复旧 JSON 生成逻辑（git）。

## Open Questions

- 当前仓库内 xlsx 的**类型列名**或**分段样式**需在实现开头打开文件确认一行样本后固化到脚本注释（若与用户示例 `pistol` 不一致，以表为准）。
