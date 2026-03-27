function asFiniteOr(value, fallback) {
  const x = Number(value);
  return Number.isFinite(x) ? x : fallback;
}

function safePositive(value, fallback) {
  const x = Number(value);
  return Number.isFinite(x) && x > 0 ? x : fallback;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function rangeFactor(rangeMod, distance) {
  const d = asFiniteOr(distance, NaN);
  const rm = safePositive(rangeMod, NaN);
  if (!Number.isFinite(d) || d < 0) return NaN;
  if (!Number.isFinite(rm)) return NaN;
  return Math.pow(rm, d / 500);
}

function makeZeroRow() {
  return {
    overRange: true,
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

function calcWeaponRow(w, distance) {
  const d = asFiniteOr(distance, NaN);
  if (!Number.isFinite(d) || d < 0) return null;

  const rangeLimit = safePositive(w && w.range, Infinity);
  if (d > rangeLimit) return makeZeroRow();

  const dmg = asFiniteOr(w && w.damage, NaN);
  const headMul = asFiniteOr(w && w.headMul, NaN);
  const weaponArmor = asFiniteOr(w && w.weaponArmor, NaN);
  const bullets = safePositive(w && w.bullets, 1);
  const R = rangeFactor(w && w.rangeMod, d);
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
    overRange: false,
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

function shouldHighlight(value) {
  if (!Number.isFinite(value)) return false;
  return value >= 100;
}

module.exports = {
  calcWeaponRow,
  shouldHighlight,
  round2,
};
