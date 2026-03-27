## 1. 目录与文件迁移

- [x] 1.1 创建 `public/map/raw/`，将现有 `public/map/*.txt` 移入（保持文件名不变）
- [x] 1.2 创建 `public/map/json/`，将 `public/json/*.json` 移入；删除迁空后的 `public/json/`（若为空）
- [x] 1.3 创建 `public/map/png/`，将 `public/png/` 下文件移入（若该目录不存在或为空则仅创建目标目录并保留约定）；删除迁空后的 `public/png/`（若为空）
- [x] 1.4 ~~**raw 清理**（已废止）~~：**保留** `public/map/raw/<id>.txt`，不因存在 `public/map/png/<id>_radar_psd.png` 而删除

## 2. 代码与脚本

- [x] 2.1 更新 `js/map-range.js`：将 `../public/png/`、`../public/json/`、`../public/map/`（txt）分别改为 `../public/map/png/`、`../public/map/json/`、`../public/map/raw/`（仅针对 `.txt` 路径）
- [x] 2.2 更新 `scripts/map-txt-to-json.mjs`：从 `public/map/raw` 读取 `.txt`，写入 `public/map/json`；同步文件头注释与日志文案
- [x] 2.3 运行 `node scripts/map-txt-to-json.mjs`，确认 `public/map/json/*.json` 生成正常

## 3. 文档与规范合并

- [x] 3.1 全库检索 `public/json`、`public/png`、指向 `public/map/*.txt`（根下 txt）的说明并改为新路径
- [x] 3.2 实现完成后将本变更的 delta 合并入 `openspec/specs/map-range-viewer/spec.md` 与 `openspec/specs/vanilla-frontend-structure/spec.md`（或在归档步骤中同步）

## 4. 验证

- [x] 4.1 以仓库根为站点根启动静态服务，打开 `pages/map-range.html`，切换地图并确认 PNG/JSON 加载与交互正常
