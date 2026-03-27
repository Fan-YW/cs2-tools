## Context

项目为 Vue 3 + Vite + vue-router 的静态 SPA，壳层顶栏与首页入口文案目前硬编码在 `App.vue`、`HomeView.vue` 等组件中（见现有 `shell-header` / `RouterLink` 文案）。需在不影响 GitHub Pages 部署与现有 `base` 的前提下引入国际化，并满足设备语言默认与顶栏开关切换。

## Goals / Non-Goals

**Goals:**

- 集成 `vue-i18n`（与 Vue 3 官方生态一致），提供 `zh` 与 `en` 两套消息。
- 首次加载时根据 `navigator.language`（或 `navigator.languages[0]`）解析语言标签：若以 `zh` 为语言主标签（例如 `zh`、`zh-CN`、`zh-TW`）则默认中文，否则默认英文。
- 在顶栏右上角提供类似开关的控件，在中英之间切换；切换后界面立即反映当前语言。
- 将用户显式选择的语言持久化到 `localStorage`（例如键 `cs2-locale`），下次访问优先于设备默认（若产品后续要求「始终跟随系统」可再改策略）。

**Non-Goals:**

- 不一次性翻译所有工具页内全部长文案与数据驱动字符串（可分阶段迁移）；本变更以壳层、首页与导航为先。
- 不引入服务端渲染或按路由分包语言文件（除非后续规模需要）；首期可采用单文件或按模块拆分的静态 JSON/TS 对象。
- 不增加除 `vue-i18n` 以外的重型 i18n 基础设施。

## Decisions

1. **选用 `vue-i18n`（`vue-i18n@9` for Vue 3）**  
   - **理由**：与 Vue 组合式 API 集成成熟，`t` / `useI18n` 用法清晰，社区与文档齐全。  
   - **备选**：自研简单字典 + `provide/inject`——代码量少但缺少复数、占位符约定与生态工具，长期可维护性较差。

2. **语言枚举使用 `zh` 与 `en`**  
   - **理由**：与用户需求「zh 用中文、其余英文」一致；`createI18n` 的 `locale` 与消息键 `zh` / `en` 对齐。  
   - **备选**：仅用 `zh-CN` / `en-US`——更细但默认规则需额外映射到「是否中文」，增加复杂度。

3. **默认语言解析**  
   - 使用 `Intl.Locale` 或字符串前缀判断：对 `navigator.language` 规范化后，若 `language.startsWith('zh')` 则 `zh`，否则 `en`。  
   - **理由**：覆盖 `zh-Hans`、`zh-CN` 等常见标签。  
   - **备选**：完整 BCP 47 列表——过度设计。

4. **持久化优先于设备默认**  
   - 若 `localStorage` 中存在合法已存 locale，则启动时使用该值；否则按设备语言规则。  
   - **理由**：用户通过开关表达的偏好应稳定保留。  
   - **备选**：每次会话仅内存——刷新即丢，体验较差。

5. **顶栏布局**  
   - 将 `shell-header` 调整为：左侧品牌、中间或偏左导航链接、**右侧**为语言开关（`margin-left: auto` 或独立 flex 子项），保证开关视觉固定在右上角区域且小屏可换行时不遮挡品牌。  
   - **开关 UI**：使用 Reka UI `Switch`（项目已依赖 `reka-ui`）或语义化 `button` + `role="switch"`，一侧表示中文、一侧表示英文，并设 `aria-label`（随当前语言翻译）。

6. **Vite 集成**  
   - 在 `main.ts` 中 `app.use(i18n)`，在 `createI18n` 中注入 `locale` 与 `fallbackLocale: 'en'`（或按需设为 `zh`，与产品一致；建议 fallback 为 `en` 以免缺键时混入中文）。

## Risks / Trade-offs

- **[Risk]** 仅部分页面翻译导致语言混杂 → **缓解**：优先迁移壳层与首页；后续任务中列出各视图迁移顺序。  
- **[Risk]** `localStorage` 在隐私模式不可用 → **缓解**：`try/catch` 静默回退到设备默认。  
- **[Trade-off]** 消息文件随仓库增长 → 接受；后续可按路由懒加载 locale。

## Migration Plan

1. 添加依赖并配置 `createI18n` 与入口注册。  
2. 抽取 `App.vue` / `HomeView.vue`（及首期约定的其他组件）文案到 `zh` / `en` 消息。  
3. 实现默认语言与 `localStorage` 读写逻辑（单一模块，例如 `src/i18n/locale.ts`）。  
4. 实现顶栏开关并自测中英切换与刷新后持久化。  
5. `npm run build` 验证静态产物；无需服务端迁移。

## Open Questions

- 工具页内大量表格与地图控件的文案是否在本迭代一并抽取，或仅壳层+首页（提案已倾向分阶段，实施时以 `tasks.md` 为准）。
