/**
 * 扫描 public/weapon/*.xlsx，按文件名中 Last Weapon Update_ 后日期选取最新，写入 manifest.json
 * 用法: node scripts/weapon-manifest.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dir = join(root, "public", "weapon");

function parseDateFromFilename(name) {
  const m = name.match(/Last Weapon Update_\s*([^)]+)\)/i);
  if (!m) return 0;
  const t = Date.parse(m[1].trim());
  return Number.isFinite(t) ? t : 0;
}

const files = readdirSync(dir).filter((f) => f.endsWith(".xlsx"));
if (files.length === 0) {
  console.error("public/weapon 下无 xlsx 文件");
  process.exit(1);
}
files.sort((a, b) => parseDateFromFilename(b) - parseDateFromFilename(a));
const latest = files[0];
const manifestPath = join(dir, "manifest.json");
let weaponsJson = "weapons.json";
if (existsSync(manifestPath)) {
  try {
    const prev = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (prev.weaponsJson && typeof prev.weaponsJson === "string") {
      weaponsJson = prev.weaponsJson;
    }
  } catch {
    /* ignore */
  }
}
const out = { xlsx: latest, weaponsJson };
writeFileSync(manifestPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("manifest.json ->", latest);
