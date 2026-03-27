## 1. 数据转换：txt -> json

- [x] 1.1 修改 `scripts/map-txt-to-json.mjs`：从 `public/map/raw/<id>.txt` 中提取 `pos_x` 与 `pos_y`（兼容负号与可选小数）
- [x] 1.2 将 `pos_x`、`pos_y` 写入 `public/map/json/<id>.json`（保留现有 `scale` 与 `c4_base_damage` 字段）
- [x] 1.3 在缺失字段时给出明确错误/跳过策略，确保脚本可复跑且不会产出不完整 JSON

## 2. 前端：从 json 读取 pos_x/pos_y

- [x] 2.1 修改 `pages/map-range.html` / `js/map-range.js`：在 `loadMap()` 加载成功后，从 JSON 直接读取 `pos_x/pos_y` 并设置 `mapOriginJson`
- [x] 2.2 调整 `loadMap()` 的数据流：主路径不再依赖运行时解析 `public/map/raw/<id>.txt`（必要时保留兼容回退逻辑，但不作为唯一来源）
- [x] 2.3 当 JSON 缺少 `pos_x/pos_y` 时进行降级：刻度与坐标不绘制/给出提示，并避免运行时报错

## 3. 生成与验证

- [x] 3.1 运行 `node scripts/map-txt-to-json.mjs` 重新生成 `public/map/json/de_*.json`
- [x] 3.2 验证每张地图的 `public/map/json` 新字段存在且为数值类型（`pos_x/pos_y` 不为 `null/NaN`）
- [ ] 3.3 人工回归：在 `pages/map-range.html` 中逐图选择地图，确认左侧/上侧刻度与坐标随缩放正确更新
- [ ] 3.4 针对主刻度因子规则做验证：当主刻度步长属于 `1/2/5 * 10^n` 时，`1/5` 因子段出现 4 个副刻度、`2` 因子段出现 3 个副刻度（例如主刻度 `3000/3500/4000` 对应副刻度 `3100/3200/...` 的可见部分）

