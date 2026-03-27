import { publicUrl } from "@/lib/publicUrl";
import type { WeaponCalcInput } from "@/lib/weaponDamageCore";

export type WeaponRow = WeaponCalcInput & {
  id: string;
  displayName: string;
  weaponType: string;
};

const TYPE_PLURALS: Record<string, string> = {
  pistol: "Pistols",
  smg: "SMGs",
  rifle: "Rifles",
  sniper: "Snipers",
  shotgun: "Shotguns",
  machinegun: "Machineguns",
  heavy: "Heavies",
};

export type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

const CATEGORY_I18N_KEYS: Record<string, string> = {
  pistol: "weapon.category.pistol",
  smg: "weapon.category.smg",
  rifle: "weapon.category.rifle",
  sniper: "weapon.category.sniper",
  shotgun: "weapon.category.shotgun",
  machinegun: "weapon.category.machinegun",
  heavy: "weapon.category.heavy",
};

/** 武器分组标签（用于「全选/清除」按钮），随界面语言切换 */
export function weaponCategoryLabel(type: string, t: TranslateFn): string {
  const key = (type || "").toLowerCase();
  const k = CATEGORY_I18N_KEYS[key];
  if (k) return t(k);
  if (!type) return t("weapon.category.other");
  return type;
}

export function typePlural(type: string): string {
  const key = (type || "").toLowerCase();
  if (TYPE_PLURALS[key]) return TYPE_PLURALS[key];
  if (!type) return "Weapons";
  if (/[sxz]$/i.test(type)) return `${type}es`;
  return `${type}s`;
}

/** 按列名大小写不敏感读取 `columns` 中的原始值。 */
export function getColumn(columns: Record<string, unknown>, name: string): unknown {
  const w = name.toLowerCase();
  for (const k of Object.keys(columns)) {
    if (k.toLowerCase() === w) return columns[k];
  }
  return undefined;
}

function numFromColumns(columns: Record<string, unknown>, names: string | string[]): number {
  const list = Array.isArray(names) ? names : [names];
  for (const n of list) {
    const raw = getColumn(columns, n);
    if (raw === undefined || raw === "") continue;
    const x = Number(raw);
    if (Number.isFinite(x)) return x;
  }
  return NaN;
}

export function normalizeWeaponsPayload(data: unknown): WeaponRow[] {
  const raw = Array.isArray(data) ? data : (data as { weapons?: unknown })?.weapons;
  if (!Array.isArray(raw)) {
    throw new Error("Invalid data: expected a JSON array or { weapons: [] }");
  }
  const out: WeaponRow[] = [];
  for (const w of raw) {
    if (!w || typeof w !== "object") continue;
    const o = w as Record<string, unknown>;
    if (typeof o.id !== "string" || !o.id.trim()) continue;
    const id = o.id.trim();
    let damage: number;
    let headMul: number;
    let rangeMod: number;
    let weaponArmor: number;
    let bullets: number;
    let range: number;
    const cols = o.columns;
    if (cols && typeof cols === "object") {
      const c = cols as Record<string, unknown>;
      damage = numFromColumns(c, "Damage");
      headMul = numFromColumns(c, ["HeadshotMultiplier", "HeadShotMultiplier"]);
      rangeMod = numFromColumns(c, "RangeModifier");
      weaponArmor = numFromColumns(c, ["WeaporArmorRatio", "WeaponArmor", "WeaponArmorRatio"]);
      bullets = numFromColumns(c, "Bullets");
      range = numFromColumns(c, "Range");
    } else {
      damage = Number(o.damage);
      headMul = Number(o.headMul);
      rangeMod = Number(o.rangeMod);
      weaponArmor = Number(o.weaponArmor);
      bullets = Number(o.bullets);
      range = Number(o.range);
    }
    if (![damage, headMul, rangeMod, weaponArmor].every(Number.isFinite)) {
      continue;
    }
    const displayName =
      typeof o.displayName === "string" && o.displayName.trim()
        ? o.displayName.trim()
        : id;
    const weaponType = typeof o.weaponType === "string" ? o.weaponType.trim() : "";
    out.push({
      id,
      displayName,
      weaponType,
      damage,
      headMul,
      rangeMod,
      weaponArmor,
      bullets: Number.isFinite(bullets) && bullets > 0 ? bullets : 1,
      range: Number.isFinite(range) && range > 0 ? range : Infinity,
    });
  }
  if (!out.length) {
    throw new Error(
      "No valid weapon entries (need id and Damage etc. in columns or legacy top-level fields)",
    );
  }
  return out;
}

/**
 * 与 `normalizeWeaponsPayload` 相同的有效条目规则下，构建 `id → columns` 映射（供详情模态等读取未归一化列）。
 */
export function buildWeaponColumnsById(data: unknown): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  const raw = Array.isArray(data) ? data : (data as { weapons?: unknown })?.weapons;
  if (!Array.isArray(raw)) return map;
  for (const w of raw) {
    if (!w || typeof w !== "object") continue;
    const o = w as Record<string, unknown>;
    if (typeof o.id !== "string" || !o.id.trim()) continue;
    const id = o.id.trim();
    let damage: number;
    let headMul: number;
    let rangeMod: number;
    let weaponArmor: number;
    let bullets: number;
    let range: number;
    const cols = o.columns;
    if (cols && typeof cols === "object") {
      const c = cols as Record<string, unknown>;
      damage = numFromColumns(c, "Damage");
      headMul = numFromColumns(c, ["HeadshotMultiplier", "HeadShotMultiplier"]);
      rangeMod = numFromColumns(c, "RangeModifier");
      weaponArmor = numFromColumns(c, ["WeaporArmorRatio", "WeaponArmor", "WeaponArmorRatio"]);
      bullets = numFromColumns(c, "Bullets");
      range = numFromColumns(c, "Range");
    } else {
      damage = Number(o.damage);
      headMul = Number(o.headMul);
      rangeMod = Number(o.rangeMod);
      weaponArmor = Number(o.weaponArmor);
      bullets = Number(o.bullets);
      range = Number(o.range);
    }
    if (![damage, headMul, rangeMod, weaponArmor].every(Number.isFinite)) {
      continue;
    }
    const c =
      cols && typeof cols === "object" ? ({ ...(cols as Record<string, unknown>) } as Record<string, unknown>) : {};
    map.set(id, c);
  }
  return map;
}

export async function loadWeaponsJson(): Promise<unknown> {
  const manifestRes = await fetch(publicUrl("weapon/manifest.json"));
  if (!manifestRes.ok) throw new Error("Cannot read manifest.json");
  const manifest = (await manifestRes.json()) as { weaponsJson?: string };
  const jsonName =
    manifest.weaponsJson && typeof manifest.weaponsJson === "string"
      ? manifest.weaponsJson
      : "weapons.json";
  const dataRes = await fetch(publicUrl(`weapon/${encodeURIComponent(jsonName)}`));
  if (!dataRes.ok) {
    throw new Error(
      `Cannot load ${jsonName}. Run npm run weapon:json (or npm run weapon:data) first.`,
    );
  }
  return dataRes.json();
}
