## 1. 目录与文件拆分

- [x] 1.1 新建 `pages/map-range.html`，从当前 `public/map-range.html` 迁出 HTML 骨架，移除内联 `<style>` / `<script>` 主体
- [x] 1.2 新建 `css/map-range.css`，迁入原内联样式；在 HTML 中用 `<link rel="stylesheet" href="../css/map-range.css">`（或按最终相对路径）引用
- [x] 1.3 新建 `js/map-range.js`，迁入原内联脚本；在 HTML 末尾用 `<script src="../js/map-range.js" defer></script>`（或等价非阻塞加载方式）引用
- [x] 1.4 将脚本中 `png/`、`json/` 等路径改为自 `pages/` 指向 `../public/png/`、`../public/json/`（与 design 一致）

## 2. 入口与清理

- [x] 2.1 更新根目录 `index.html` 中工具链接，指向 `pages/map-range.html`
- [x] 2.2 删除 `public/map-range.html`，避免双入口（若需旧 URL 兼容，可改为仅含跳转的薄页面，见 design「Open Questions」）
- [x] 2.3 全局检索是否仍有指向 `public/map-range.html` 的文档或注释并更新

## 3. 验证

- [x] 3.1 以仓库根为站点根启动静态服务器，验证首页导航与地图页加载 PNG/JSON、交互与测距逻辑正常
- [x] 3.2 对照 `openspec/changes/native-html-css-js-structure/specs/` 与 `openspec/specs/map-range-viewer/spec.md`，确认归档路径与运行时 URL 表述一致
