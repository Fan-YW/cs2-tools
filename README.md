# CS2 工具集

Vue 3 + Vite + [Reka UI](https://reka-ui.com/) 前端；地图测距、C4 伤害与武器距离伤害计算器。静态构建产物可部署到 **GitHub Pages**。

## 开发

```bash
npm install
npm run dev
```

本地开发默认 `base` 为 `/`，浏览器访问终端提示的地址即可。

## 生产构建

```bash
npm run build
```

输出目录为 `dist/`。使用任意静态服务器托管该目录（例如 `npx serve dist`）。

### GitHub Pages（项目站）

若站点 URL 为 `https://<user>.github.io/<repo>/`，构建前必须设置 **Vite `base`** 为 `/<repo>/`：

```bash
# PowerShell
$env:VITE_BASE="/你的仓库名/"; npm run build

# bash
VITE_BASE=/你的仓库名/ npm run build
```

在 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables** 中可添加 `VITE_BASE`（例如 `/cs2/`），工作流 `.github/workflows/pages.yml` 会读取；未设置时默认 `/`。

## 武器数据

从 xlsx 生成 JSON（详见 `scripts/`）：

```bash
npm run weapon:json
# 或
npm run weapon:data
```

## 测试

```bash
npm run test:weapon-damage
```

## 规格

行为需求见 `openspec/specs/`（`map-range-viewer`、`weapon-range-damage-viewer`、`vanilla-frontend-structure`）。
