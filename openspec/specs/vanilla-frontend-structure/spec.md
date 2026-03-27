# vanilla-frontend-structure 规范

## 目的

约定本仓库以 **Vue 3 + Vite** 组织前端源码与静态数据，构建产物为可托管于 GitHub Pages 等环境的纯静态站点。

## 需求

### Requirement: Page markup separate from CSS and JS

Each user-facing tool view MUST be implemented as a Vue 3 component (Single-File Component or equivalent modular unit under the source tree). Styles for that view MUST be authored as component-scoped CSS, CSS modules, or a documented global layer co-located with the Vue app, and MUST be emitted by the Vite build rather than hand-maintained parallel files under a legacy `css/` tree. Application behavior MUST be authored as ES modules consumed by Vite (not as ad hoc global scripts required per HTML page). Long-running style or script bodies MUST NOT remain embedded in the root `index.html` except for narrowly scoped exceptions (for example Vite entry mounts), and any such exception MUST be justified in code review.

#### Scenario: Tool view uses Vue modules

- **WHEN** a contributor opens a tool route's Vue source
- **THEN** they MUST find the structure, styles, and logic in the Vue module graph, not as the bulk of inline content in a standalone HTML file under `pages/`

### Requirement: Directory roles at repository root

The Vue application source MUST live under a dedicated directory (for example `src/`). The repository MUST include a Vite root `index.html` that mounts the Vue app. End-user navigation (home and links to tools) MUST be implemented inside the Vue application (for example via `vue-router`). Shared static data for map and weapon tools MUST remain under `public/` with stable subfolders: map metadata JSON under **`public/map/json/`**, radar PNG under **`public/map/png/`**, and Valve overview source `.txt` files under **`public/map/raw/`** (all under `public/map/`). Source `.txt` MAY coexist with PNG and JSON for the same map; workflows MUST NOT delete raw txt solely because a radar PNG exists. Optional Node-based preprocessing scripts MUST reside under `scripts/` and MUST NOT be required in the browser at runtime. The build output directory (for example `dist/`) is the deployable static root for production, not the unbuilt repository root layout for the SPA.

#### Scenario: Locating static data

- **WHEN** a contributor looks for map metadata, radar images, or source txt files
- **THEN** they MUST locate JSON under `public/map/json/`, PNG under `public/map/png/`, and source txt under `public/map/raw/`, not at `public/json/` or `public/png/` at repository root

### Requirement: Vite build and GitHub Pages compatible hosting

The project MUST use Vite to compile and bundle user-facing code for production. Deployment MUST be satisfiable by uploading only the Vite build output to static hosting (including GitHub Pages). The Vite `base` option MUST be set consistently with the documented hosting URL (including repository subpaths). Asset references to files under `public/` MUST resolve correctly in the built output for that `base`.

#### Scenario: Built site loads public data

- **WHEN** a user opens the deployed site from the build output and navigates to map or weapon tools
- **THEN** requests for map JSON/PNG and weapon `manifest.json` / weapons JSON MUST succeed without manual path rewriting beyond `base`

#### Scenario: Documented build for contributors

- **WHEN** a new contributor follows the README
- **THEN** they MUST find explicit commands for development (`vite dev`) and production build (`vite build`) and where the static output is written
