## 1. 页面结构与样式

- [x] 1.1 修改 `pages/weapon-range-damage.html`：将原武器下拉区域替换为按类型分组的 Tag 容器（含每行批量按钮占位）并更新结果表表头，新增最左 `Weapon` 列。
- [x] 1.2 更新 `css/weapon-range-damage.css`：实现类型分组行、Tag 选中态、批量按钮样式，以及多行结果表在宽屏下的可读性与滚动表现。

## 2. 交互与计算逻辑

- [x] 2.1 重构 `js/weapon-range-damage.js` 武器选择逻辑：按 `weaponType` 分组渲染 Tag，使用 `selectedIds` 管理多选状态，支持逐个选中/取消。
- [x] 2.2 实现类型行批量操作：根据该行是否全选切换 `All<TypePlural>` / `Clear<TypePlural>` 文案，并正确执行全选或全清。
- [x] 2.3 将结果表改为“每个选中武器一行”：选中时新增行、取消时删除对应行，并在首列展示 `displayName`。
- [x] 2.4 合并有护甲与护甲减少展示：有护甲三列输出 `XX.XX(XX)`，其中括号值沿用原护甲减少公式与取整规则。

## 3. 验证与规范同步

- [ ] 3.1 手动验证：不同类型武器混合多选、批量全选/清空、距离变化时多行数据同步刷新且无错行。
- [ ] 3.2 手动验证：取消某个 Tag 时仅移除对应武器行；重新选中后按当前距离重建正确数值。
- [x] 3.3 对照 `openspec/changes/weapon-tag-multi-select-table/specs/weapon-range-damage-viewer/spec.md` 完成实现一致性自检。
