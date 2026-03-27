import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// GitHub Pages 项目站：构建前设置环境变量 VITE_BASE=/仓库名/
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  plugins: [vue()],
  base,
  publicDir: "public",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
