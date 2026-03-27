# vanilla-frontend-structure 规范

## 目的

约定本仓库以无应用层打包器的原生 Web 技术组织页面源码与静态数据，使目录结构可被静态服务器直接托管并便于维护。

## ADDED Requirements

### Requirement: Page markup separate from CSS and JS

Each user-facing tool page MUST keep document structure in HTML, MUST load page-specific styles via `<link rel="stylesheet">` pointing to a file under `css/`, and MUST load page-specific behavior via `<script src>` pointing to a file under `js/`. Long-running style or script bodies MUST NOT remain embedded in the HTML file except for narrowly scoped exceptions (for example a few lines of critical inline CSS to avoid flash), and any such exception MUST be justified in code review.

#### Scenario: Tool page uses external assets

- **WHEN** a contributor opens a tool HTML file under `pages/`
- **THEN** they MUST find the matching stylesheet under `css/` and script under `js/`, and the HTML MUST not contain the bulk of that tool's CSS or JavaScript inline

### Requirement: Directory roles at repository root

The repository root MUST contain `index.html` as the navigation hub for tools. Standalone tool entry HTML files MUST live under a single dedicated directory named `pages/` (sibling to `css/`, `js/`, and `public/`). Shared static data such as map JSON, radar PNG, and source `.txt` used for generation MUST remain under `public/` with stable subfolders (for example `public/json/`, `public/png/`, `public/map/`). Optional Node-based preprocessing scripts MUST reside under `scripts/` and MUST NOT be required in the browser at runtime.

#### Scenario: Locating static data

- **WHEN** a contributor looks for map metadata or radar images
- **THEN** they MUST locate them under `public/` by type, not scattered next to arbitrary HTML files outside that layout

### Requirement: No application bundler for user-facing code

User-facing HTML, CSS, and JavaScript MUST run without executing a frontend bundler or transpiler as part of serving the app; deployment MUST be satisfiable by serving the repository (or its documented static root) as static files. The project MAY continue to use third-party CSS from a CDN (for example Pico) and MAY use browser-native features consistent with supported browsers.

#### Scenario: Static hosting without build step

- **WHEN** the site is served with only a static HTTP server from the repository root
- **THEN** navigation from `index.html` to tool pages and loading of `public/` data MUST succeed without a webpack, vite, or equivalent build
