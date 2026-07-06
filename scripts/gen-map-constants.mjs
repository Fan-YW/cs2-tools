/**
 * 从 public/map/json/*.json 读取地图元数据，生成 src/lib/mapConstants.ts。
 * 用法: node scripts/gen-map-constants.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const jsonDir = join(root, "public", "map", "json");
const outFile = join(root, "src", "lib", "mapConstants.ts");

const files = readdirSync(jsonDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const mapsC4 = [];
const mapsWeapon = [];
const metaC4 = {};
const metaWeapon = {};

for (const file of files) {
  const text = readFileSync(join(jsonDir, file), "utf8");
  const data = JSON.parse(text);
  const id = data.id;

  mapsWeapon.push(id);

  if (file.startsWith("de_")) {
    mapsC4.push(id);
    metaC4[id] = {
      scale: data.scale,
      c4_base_damage: data.c4_base_damage,
      pos_x: data.pos_x,
      pos_y: data.pos_y,
      landmarks: data.landmarks || [],
    };
  }

  metaWeapon[id] = {
    scale: data.scale,
    pos_x: data.pos_x,
    pos_y: data.pos_y,
    landmarks: data.landmarks || [],
  };
}

function formatArray(arr) {
  return arr.map((s) => `  "${s}"`).join(",\n");
}

function formatLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return "[]";
  const items = landmarks.map(lm => 
    `{ type: "${lm.type}", label: "${lm.label}", x: ${lm.x}, y: ${lm.y} }`
  );
  return `[\n    ${items.join(",\n    ")}\n  ]`;
}

function formatRecord(obj, typeName) {
  const lines = [];
  for (const [key, val] of Object.entries(obj)) {
    const lm = val.landmarks;
    const props = Object.entries(val)
      .filter(([k]) => k !== "landmarks")
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    const lmStr = lm && lm.length > 0 ? `, landmarks: ${formatLandmarks(lm)}` : "";
    lines.push(`  ${key}: { ${props}${lmStr} },`);
  }
  return lines.join("\n");
}

const code = `export const IMAGE = 1024;
export const DRAG_THRESHOLD = 5;
export const MM_PER_UNIT = 25.4;

export const MAPS_C4 = [
${formatArray(mapsC4)}
] as const;

export const MAPS_WEAPON = [
${formatArray(mapsWeapon)}
] as const;

export type MapId = (typeof MAPS_WEAPON)[number];
export type MapIdC4 = (typeof MAPS_C4)[number];

export type Landmark = { type: string; label: string; x: number; y: number };

export const MAP_META_C4: Record<
  MapIdC4,
  { scale: number; c4_base_damage: number; pos_x: number; pos_y: number; landmarks: Landmark[] }
> = {
${formatRecord(metaC4)}
};

export const MAP_META_WEAPON: Record<MapId, { scale: number; pos_x: number; pos_y: number; landmarks: Landmark[] }> = {
${formatRecord(metaWeapon)}
};

export function unitsToMeters(units: number): number {
  return (units * MM_PER_UNIT) / 1000;
}
`;

writeFileSync(outFile, code, "utf8");
console.log(`写入 ${outFile}`);
console.log(`C4 地图: ${mapsC4.length} 个`);
console.log(`武器地图: ${mapsWeapon.length} 个`);