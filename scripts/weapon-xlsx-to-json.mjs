/**
 * 从 manifest.json 指定的 xlsx 读取「Raw Values」表，写出 public/weapon/weapons.json
 * 及 weapons.embed.js（供 file:// 打开页面时使用，避免 fetch 本地文件失败）。
 *
 * 源表结构（CS2 Weapon Spreadsheet，以仓库内当前 xlsx 为准）：
 * - 工作表名：`Raw Values`（名称匹配策略见 findRawValuesSheetName）。
 * - 第 1 行（Excel 行 1）为表头：A 列表头为「Pistols」，表示武器内部 id 列；其余列为参数名。
 * - 表中每隔若干武器会出现**子表头行**：A 列为分类标题（如 Shotguns、SMGs），B 列为「WeaporArmorRatio」
 *   与首行表头对齐——此类行不生成武器，仅跳过。
 * - 空行跳过。
 * - 武器行：A 列为内部 id（如 deagle）；A 列单元格可带注释（comment），注释文本为展示名（如 Desert Eagle）。
 * - `WeaponType` 列（表头名大小写一致）为类型标签，如 Pistol、Shotgun；导出为 **weaponType** 小写英文（pistol、shotgun）。
 * - 每条记录包含首行表头下**全部列**的键值对象 `columns`（列名 trim，与首行对齐）。
 *
 * 用法: node scripts/weapon-xlsx-to-json.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const weaponDir = join(root, "public", "weapon");

function findRawValuesSheetName(wb) {
  const names = wb.SheetNames || [];
  const exact = names.find((n) => /^raw\s*values?$/i.test(String(n).trim()));
  if (exact) return exact;
  return names.find((n) => /raw/i.test(n) && /value/i.test(n)) || null;
}

/** 子表头行：第二列为 WeaporArmorRatio（与首行对齐） */
function isSubHeaderRow(row) {
  return String(row[1] ?? "").trim() === "WeaporArmorRatio";
}

function cellCommentText(cell) {
  if (!cell || !cell.c) return "";
  const parts = Array.isArray(cell.c) ? cell.c : [cell.c];
  const texts = [];
  for (const p of parts) {
    if (p && p.t != null && String(p.t).trim()) texts.push(String(p.t).trim());
  }
  return texts.join(" ").trim();
}

function colCI(columns, want) {
  const w = want.toLowerCase();
  for (const k of Object.keys(columns)) {
    if (k.toLowerCase() === w) return columns[k];
  }
  return undefined;
}

function numFromColumns(columns, names) {
  const list = Array.isArray(names) ? names : [names];
  for (const n of list) {
    const raw = colCI(columns, n);
    if (raw === undefined || raw === "") continue;
    const x = Number(raw);
    if (Number.isFinite(x)) return x;
  }
  return NaN;
}

function normalizeWeaponType(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return s.toLowerCase();
}

function buildColumnsObject(header, row) {
  const columns = {};
  for (let i = 0; i < header.length; i++) {
    const key = header[i];
    if (!key) continue;
    let v = row[i];
    if (v === undefined) v = "";
    columns[key] = v;
  }
  return columns;
}

function parseRawValuesSheet(wb) {
  const sheetName = findRawValuesSheetName(wb);
  if (!sheetName) throw new Error("未找到 Raw Values 工作表");
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (!rows.length) throw new Error("表为空");

  const header = rows[0].map((c) => String(c).trim());
  const weapons = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row.length) continue;
    if (isSubHeaderRow(row)) continue;

    const id = String(row[0] ?? "").trim();
    if (!id) continue;

    const columns = buildColumnsObject(header, row);

    const damage = numFromColumns(columns, "Damage");
    const headMul = numFromColumns(columns, ["HeadshotMultiplier", "HeadShotMultiplier"]);
    const rangeMod = numFromColumns(columns, "RangeModifier");
    const weaponArmor = numFromColumns(columns, [
      "WeaporArmorRatio",
      "WeaponArmor",
      "WeaponArmorRatio",
    ]);
    if (![damage, headMul, rangeMod, weaponArmor].every(Number.isFinite)) continue;

    const addr = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = sheet[addr];
    const comment = cellCommentText(cell);
    const displayName = comment || id;

    const wtRaw = colCI(columns, "WeaponType");
    const weaponType = normalizeWeaponType(wtRaw);

    weapons.push({
      id,
      displayName,
      weaponType,
      columns,
    });
  }

  if (!weapons.length) throw new Error("未解析到有效武器行");
  return weapons;
}

const manifestPath = join(weaponDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const xlsxName = manifest.xlsx;
if (!xlsxName || typeof xlsxName !== "string") {
  console.error("manifest.json 缺少 xlsx 字段");
  process.exit(1);
}
const xlsxPath = join(weaponDir, xlsxName);
const buf = readFileSync(xlsxPath);
const wb = XLSX.read(buf, { type: "buffer" });
const weapons = parseRawValuesSheet(wb);

const outName =
  manifest.weaponsJson && typeof manifest.weaponsJson === "string"
    ? manifest.weaponsJson
    : "weapons.json";
const outPath = join(weaponDir, outName);
const payload = {
  sourceXlsx: xlsxName,
  generatedAt: new Date().toISOString(),
  weapons,
};
writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log("wrote", outPath, "(" + weapons.length + " weapons)");

const embedPath = join(weaponDir, "weapons.embed.js");
const embedBody =
  '"use strict";window.__CS2_WEAPON_DATA__=' +
  JSON.stringify(payload) +
  ";\n";
writeFileSync(embedPath, embedBody, "utf8");
console.log("wrote", embedPath);
