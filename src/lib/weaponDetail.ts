import { getColumn } from "@/lib/weaponLoader";

export type WeaponDetailRow = { label: string; value: string };

/** 与 vue-i18n `t` 兼容的最小类型 */
export type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

function fmtNum(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return "—";
  return (Math.round(x * 10 ** digits) / 10 ** digits).toFixed(digits);
}

function numFrom(cols: Record<string, unknown>, names: string | string[]): number {
  const list = Array.isArray(names) ? names : [names];
  for (const n of list) {
    const raw = getColumn(cols, n);
    if (raw === undefined || raw === "") continue;
    const x = Number(raw);
    if (Number.isFinite(x)) return x;
  }
  return NaN;
}

function asBool(v: unknown): boolean {
  if (v === true || v === "true" || v === 1) return true;
  return false;
}

/** `Spread` 与姿态 `Inaccuracy` 同单位相加；缺失或非有限数时按 0。 */
function spreadComponent(columns: Record<string, unknown>): number {
  const s = numFrom(columns, "Spread");
  return Number.isFinite(s) ? s : 0;
}

function effectiveInaccuracy(inacc: number, spread: number): number {
  if (!Number.isFinite(inacc)) return NaN;
  return inacc + spread;
}

/**
 * 从 `weapons.json` 的 `columns` 生成详情模态中的「标签 / 值」行（与 OpenSpec 约定一致）。
 */
export function buildWeaponDetailRows(
  columns: Record<string, unknown>,
  t: TranslateFn,
): WeaponDetailRow[] {
  const rows: WeaponDetailRow[] = [];

  const wType = getColumn(columns, "WeaponType");
  rows.push({
    label: t("weaponDetail.weaponType"),
    value: typeof wType === "string" && wType.trim() ? wType.trim() : "—",
  });

  const armorRatio = numFrom(columns, ["WeaporArmorRatio", "WeaponArmor", "WeaponArmorRatio"]);
  if (Number.isFinite(armorRatio)) {
    const pct = (armorRatio / 2) * 100;
    rows.push({ label: t("weaponDetail.armorPen"), value: `${fmtNum(pct, 2)}%` });
  } else {
    rows.push({ label: t("weaponDetail.armorPen"), value: "—" });
  }

  const damage = numFrom(columns, "Damage");
  rows.push({
    label: t("weaponDetail.baseDamage"),
    value: Number.isFinite(damage) ? String(Math.round(damage)) : "—",
  });

  const rangeMod = numFrom(columns, "RangeModifier");
  rows.push({
    label: t("weaponDetail.rangeMod"),
    value: Number.isFinite(rangeMod) ? fmtNum(rangeMod, 4) : "—",
  });

  const head = numFrom(columns, ["HeadshotMultiplier", "HeadShotMultiplier"]);
  rows.push({
    label: t("weaponDetail.headMul"),
    value: Number.isFinite(head) ? fmtNum(head, 2) : "—",
  });

  const cycle = numFrom(columns, "CycleTime");
  if (Number.isFinite(cycle) && cycle > 0) {
    const rpm = 60 / cycle;
    rows.push({ label: t("weaponDetail.rpm"), value: `${fmtNum(rpm, 1)} rpm (${cycle} s)` });
  } else {
    rows.push({ label: t("weaponDetail.rpm"), value: "—" });
  }

  const price = numFrom(columns, "WeaponPrice");
  rows.push({
    label: t("weaponDetail.price"),
    value: Number.isFinite(price) ? `$ ${Math.round(price)}` : "—",
  });

  const killAward = numFrom(columns, "KillAward");
  rows.push({
    label: t("weaponDetail.killAward"),
    value: Number.isFinite(killAward) ? `$ ${Math.round(killAward)}` : "—",
  });

  const maxSpd = numFrom(columns, "MaxPlayerSpeed");
  if (Number.isFinite(maxSpd)) {
    rows.push({ label: t("weaponDetail.maxSpeed"), value: `${fmtNum(maxSpd, 1)} unit/s` });
    rows.push({ label: t("weaponDetail.walkSpeed"), value: `${fmtNum(maxSpd * 0.52, 1)} unit/s` });
    rows.push({ label: t("weaponDetail.crouchSpeed"), value: `${fmtNum(maxSpd * 0.34, 1)} unit/s` });
  } else {
    rows.push({ label: t("weaponDetail.maxSpeed"), value: "—" });
    rows.push({ label: t("weaponDetail.walkSpeed"), value: "—" });
    rows.push({ label: t("weaponDetail.crouchSpeed"), value: "—" });
  }

  const spread = spreadComponent(columns);
  const spreadAlt = numFrom(columns, "SpreadAlt");

  const standI = effectiveInaccuracy(numFrom(columns, "InaccuracyStand"), spread);
  if (Number.isFinite(standI) && standI > 0) {
    const rad = standI / 1000;
    const distM = 152.4 / standI;
    rows.push({ label: t("weaponDetail.standInacc"), value: fmtNum(rad, 5) + ' rad'});
    rows.push({ label: t("weaponDetail.standInaccDist"), value: fmtNum(distM, 2) + " m" });
  } else {
    rows.push({ label: t("weaponDetail.standInacc"), value: "—" });
    rows.push({ label: t("weaponDetail.standInaccDist"), value: "—" });
  }

  const crouchI = effectiveInaccuracy(numFrom(columns, "InaccuracyCrouch"), spread);
  if (Number.isFinite(crouchI) && crouchI > 0) {
    const rad = crouchI / 1000;
    const distM = 152.4 / crouchI;
    rows.push({ label: t("weaponDetail.crouchInacc"), value: fmtNum(rad, 5) + ' rad'});
    rows.push({ label: t("weaponDetail.crouchInaccDist"), value: fmtNum(distM, 2) + " m" });
  } else {
    rows.push({ label: t("weaponDetail.crouchInacc"), value: "—" });
    rows.push({ label: t("weaponDetail.crouchInaccDist"), value: "—" });
  }

  const moveI = effectiveInaccuracy(numFrom(columns, "InaccuracyMove"), spread);
  if (Number.isFinite(moveI) && moveI > 0) {
    const rad = moveI / 1000;
    const distM = 152.4 / moveI;
    rows.push({ label: t("weaponDetail.moveInacc"), value: fmtNum(rad, 5) + ' rad'});
    rows.push({ label: t("weaponDetail.moveInaccDist"), value: fmtNum(distM, 2) + " m" });
  } else {
    rows.push({ label: t("weaponDetail.moveInacc"), value: "—" });
    rows.push({ label: t("weaponDetail.moveInaccDist"), value: "—" });
  }

  if (Number.isFinite(spreadAlt)) {
    const crouchIAlt = effectiveInaccuracy(numFrom(columns, "InaccuracyCrouchAlt"), spreadAlt);
    if (Number.isFinite(crouchIAlt) && crouchIAlt > 0) {
      const rad = crouchIAlt / 1000;
      const distM = 152.4 / crouchIAlt;
      rows.push({ label: t("weaponDetail.crouchInacc") + "(Alt)", value: fmtNum(rad, 5) + ' rad'});
      rows.push({ label: t("weaponDetail.crouchInaccDist") + "(Alt)", value: fmtNum(distM, 2) + " m" });
    }

    const standIAlt = effectiveInaccuracy(numFrom(columns, "InaccuracyStandAlt"), spreadAlt);
    if (Number.isFinite(standIAlt) && standIAlt > 0) {
      const rad = standIAlt / 1000;
      const distM = 152.4 / standIAlt;
      rows.push({ label: t("weaponDetail.standInacc") + "(Alt)", value: fmtNum(rad, 5) + ' rad'});
      rows.push({ label: t("weaponDetail.standInaccDist") + "(Alt)", value: fmtNum(distM, 2) + " m" });
    }

    const moveIAlt = effectiveInaccuracy(numFrom(columns, "InaccuracyMoveAlt"), spreadAlt);
    if (Number.isFinite(moveIAlt) && moveIAlt > 0) {
      const rad = moveIAlt / 1000;
      const distM = 152.4 / moveIAlt;
      rows.push({ label: t("weaponDetail.moveInacc") + "(Alt)", value: fmtNum(rad, 5) + ' rad'});
      rows.push({ label: t("weaponDetail.moveInaccDist") + "(Alt)", value: fmtNum(distM, 2) + " m" });
    }
  }

  const clip = numFrom(columns, ["clip_size", "Clip_size", "ClipSize"]);
  rows.push({
    label: t("weaponDetail.clip"),
    value: Number.isFinite(clip) ? String(Math.round(clip)) : "—",
  });

  const reserve = numFrom(columns, "m_nPrimaryReserveAmmoMax");
  const reserveAsClips = asBool(getColumn(columns, "m_bReserveAmmoAsClips"));
  if (Number.isFinite(reserve)) {
    const unit = reserveAsClips ? t("weaponDetail.reserveUnitClip") : t("weaponDetail.reserveUnitRound");
    rows.push({ label: t("weaponDetail.reserve"), value: `${Math.round(reserve)} ${unit}` });
  } else {
    rows.push({ label: t("weaponDetail.reserve"), value: "—" });
  }


  const range = numFrom(columns, "Range");
  rows.push({
    label: t("weaponDetail.maxRange"),
    value: Number.isFinite(range) ? String(Math.round(range)) : "—",
  });


  const pellets = numFrom(columns, "Bullets");
  if (Number.isFinite(pellets) && pellets > 1) {
    rows.push({ label: t("weaponDetail.pellets"), value: String(Math.round(pellets)) });
  }

  return rows;
}
