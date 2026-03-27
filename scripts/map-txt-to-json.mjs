/**
 * 从 public/map/raw/*.txt 解析全部 Valve 风格 "键" "值" 对，写入 public/map/json/<id>.json。
 * - `entries`：按文件顺序保留每一对 [键, 值]（字符串），不丢字段，重复键也全部保留。
 * - 顶层 `scale`、`c4_base_damage`、`pos_x`、`pos_y`：由同名键最后一次出现解析为数字，供地图页使用。
 * 用法: node scripts/map-txt-to-json.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mapDir = join(root, "public", "map", "raw");
const outDir = join(root, "public", "map", "json");
mkdirSync(outDir, { recursive: true });

/** 还原 \" \\ \n 等简单转义（与常见 Valve 文本一致） */
function unescapeValveString(s) {
  return s.replace(/\\(.)/g, (_, c) => {
    if (c === "n") return "\n";
    if (c === "t") return "\t";
    if (c === "r") return "\r";
    return c;
  });
}

/**
 * 自文本中按出现顺序提取所有 "key" "value"（值内未转义的 " 会破坏解析）。
 */
function extractQuotedPairs(text) {
  const pairs = [];
  const re = /"((?:[^"\\]|\\.)*)"\s+"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    pairs.push([unescapeValveString(m[1]), unescapeValveString(m[2])]);
  }
  return pairs;
}

function lastRawValue(pairs, key) {
  for (let i = pairs.length - 1; i >= 0; i--) {
    if (pairs[i][0] === key) return pairs[i][1];
  }
  return null;
}

const files = readdirSync(mapDir).filter((f) => f.endsWith(".txt"));

for (const file of files) {
  const text = readFileSync(join(mapDir, file), "utf8");
  const id = file.replace(/\.txt$/i, "");
  const entries = extractQuotedPairs(text);

  if (entries.length === 0) {
    console.warn(`跳过 ${file}: 未解析到任何 "键" "值" 对`);
    continue;
  }

  const scaleRaw = lastRawValue(entries, "scale");
  const dmgRaw = lastRawValue(entries, "c4_base_damage");
  const posXRaw = lastRawValue(entries, "pos_x");
  const posYRaw = lastRawValue(entries, "pos_y");

  if (scaleRaw == null) {
    console.warn(`跳过 ${file}: 无 scale 键`);
    continue;
  }
  if (dmgRaw == null) {
    throw new Error(`解析失败：${file} 缺少 "c4_base_damage"`);
  }
  if (posXRaw == null || posYRaw == null) {
    throw new Error(`解析失败：${file} 缺少 "pos_x"/"pos_y"`);
  }

  const scale = parseFloat(scaleRaw);
  const c4_base_damage = parseFloat(dmgRaw);
  const pos_x = Number(posXRaw);
  const pos_y = Number(posYRaw);

  if (!Number.isFinite(scale)) {
    throw new Error(`解析失败：${file} 的 scale 不是有效数字`);
  }
  if (!Number.isFinite(c4_base_damage)) {
    throw new Error(`解析失败：${file} 的 c4_base_damage 不是有效数字`);
  }
  if (!Number.isFinite(pos_x) || !Number.isFinite(pos_y)) {
    throw new Error(`解析失败：${file} 的 pos_x/pos_y 不是有限数字`);
  }

  const obj = {
    id,
    entries,
    scale,
    c4_base_damage,
    pos_x,
    pos_y,
  };
  writeFileSync(join(outDir, `${id}.json`), JSON.stringify(obj) + "\n", "utf8");
  console.log(`写入 map/json/${id}.json（${entries.length} 个字段对）`);
}
