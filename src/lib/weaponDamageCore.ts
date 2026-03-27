/** 与 `js/weapon-damage-core.cjs`（Node 测试）逻辑一致，供 Vue 使用 */

export function asFiniteOr(value: unknown, fallback: number): number {
  const x = Number(value);
  return Number.isFinite(x) ? x : fallback;
}

export function safePositive(value: unknown, fallback: number): number {
  const x = Number(value);
  return Number.isFinite(x) && x > 0 ? x : fallback;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function rangeFactor(rangeMod: unknown, distance: unknown): number {
  const d = asFiniteOr(distance, NaN);
  const rm = safePositive(rangeMod, NaN);
  if (!Number.isFinite(d) || d < 0) return NaN;
  if (!Number.isFinite(rm)) return NaN;
  return rm ** (d / 500);
}

export type WeaponCalcInput = {
  damage: number;
  headMul: number;
  rangeMod: number;
  weaponArmor: number;
  bullets: number;
  range: number;
};

export function makeZeroRow() {
  return {
    overRange: true as const,
    noHead: 0,
    noChest: 0,
    noAbd: 0,
    noLeg: 0,
    armHead: 0,
    armChest: 0,
    armAbd: 0,
    redHead: 0,
    redChest: 0,
    redAbd: 0,
  };
}

export function calcWeaponRow(w: WeaponCalcInput | null, distance: unknown) {
  const d = asFiniteOr(distance, NaN);
  if (!Number.isFinite(d) || d < 0) return null;

  const rangeLimit = safePositive(w?.range, Infinity);
  if (d > rangeLimit) return makeZeroRow();

  const dmg = asFiniteOr(w?.damage, NaN);
  const headMul = asFiniteOr(w?.headMul, NaN);
  const weaponArmor = asFiniteOr(w?.weaponArmor, NaN);
  const bullets = safePositive(w?.bullets, 1);
  const R = rangeFactor(w?.rangeMod, d);
  if (![dmg, headMul, weaponArmor, R].every(Number.isFinite) || R <= 0) return null;

  const noHead = dmg * headMul * R * bullets;
  const noChest = dmg * R * bullets;
  const noAbd = dmg * 1.25 * R * bullets;
  const noLeg = dmg * 0.75 * R * bullets;

  const armFac = weaponArmor / 2;
  const fac = (2 - weaponArmor) / 4;
  const redHead = Math.floor(dmg * headMul * fac * R * bullets);
  const redChest = Math.floor(dmg * fac * R * bullets);
  const redAbd = Math.floor(dmg * 1.25 * fac * R * bullets);

  return {
    overRange: false as const,
    noHead,
    noChest,
    noAbd,
    noLeg,
    armHead: noHead * armFac,
    armChest: noChest * armFac,
    armAbd: noAbd * armFac,
    redHead,
    redChest,
    redAbd,
  };
}

export function shouldHighlight(value: unknown): boolean {
  if (!Number.isFinite(value)) return false;
  return (value as number) >= 100;
}
