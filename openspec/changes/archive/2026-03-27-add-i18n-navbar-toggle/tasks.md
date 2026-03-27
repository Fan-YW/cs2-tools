## 1. 依赖与 i18n 引导

- [x] 1.1 添加 `vue-i18n`（Vue 3 兼容版本）到 `package.json` 并安装依赖
- [x] 1.2 新增 `src/locales/zh.json`（或 `.ts`）与 `src/locales/en.json`，包含壳层与首页首期文案键值
- [x] 1.3 新增 `src/i18n/index.ts`：`createI18n`，合并消息、`fallbackLocale`，导出 `i18n` 实例
- [x] 1.4 在 `main.ts` 中 `app.use(i18n)`，确保路由与根组件可访问

## 2. 默认语言与持久化

- [x] 2.1 实现从 `navigator.language`（或 `navigator.languages[0]`）解析默认 locale：`zh*` → `zh`，否则 `en`
- [x] 2.2 实现 `localStorage` 读写（约定键名如 `cs2-locale`）：若存在合法值则优先于设备默认；读写失败时静默回退
- [x] 2.3 在 i18n 创建或 `app` 启动时合成最终初始 `locale` 并 `i18n.global.locale.value = ...`（或等价 API）

## 3. 顶栏布局与语言开关

- [x] 3.1 调整 `App.vue` 中 `shell-header` 结构：品牌、导航、**右侧**语言开关；样式上保证开关位于右上角（必要时 `margin-left: auto` 或独立 flex 区域）
- [x] 3.2 实现语言开关 UI：使用 Reka UI `Switch` 或 `role="switch"` 的按钮，中英两态清晰；`aria-label` 使用 i18n 文案
- [x] 3.3 绑定开关与 `locale`：切换时更新 `i18n` 当前语言并写入 `localStorage`

## 4. 文案迁移与验证

- [x] 4.1 将 `App.vue` 顶栏 `RouterLink` 与品牌文案改为 `t(...)` 键
- [x] 4.2 将 `HomeView.vue` 标题、工具入口与页脚说明改为翻译键并补齐中英消息
- [x] 4.3 手动验证：首次访问（清缓存）下中文/英文浏览器默认；切换开关后文案即时变化；刷新后保持用户选择
- [x] 4.4 运行 `npm run build` 确认无类型与构建错误
