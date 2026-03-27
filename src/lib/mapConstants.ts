export const IMAGE = 1024;
export const DRAG_THRESHOLD = 5;
/** 游戏单位与米：1 unit = 25.4 mm */
export const MM_PER_UNIT = 25.4;

export const MAPS = [
  "de_ancient",
  "de_anubis",
  "de_dust2",
  "de_inferno",
  "de_mirage",
  "de_nuke",
  "de_overpass",
] as const;

export type MapId = (typeof MAPS)[number];

/** 与 map-range.js 内联一致，含 C4 元数据 */
export const MAP_META_C4: Record<
  MapId,
  { scale: number; c4_base_damage: number; pos_x: number; pos_y: number }
> = {
  de_ancient: { scale: 5, c4_base_damage: 650, pos_x: -2953, pos_y: 2164 },
  de_anubis: { scale: 5.22, c4_base_damage: 450, pos_x: -2796, pos_y: 3328 },
  de_dust2: { scale: 4.4, c4_base_damage: 700, pos_x: -2476, pos_y: 3239 },
  de_inferno: { scale: 4.9, c4_base_damage: 600, pos_x: -2087, pos_y: 3870 },
  de_mirage: { scale: 5, c4_base_damage: 650, pos_x: -3230, pos_y: 1713 },
  de_nuke: { scale: 7, c4_base_damage: 650, pos_x: -3453, pos_y: 2887 },
  de_overpass: { scale: 5.2, c4_base_damage: 650, pos_x: -4831, pos_y: 1781 },
};

/** 与 weapon-range-damage.js 内联一致 */
export const MAP_META_WEAPON: Record<MapId, { scale: number; pos_x: number; pos_y: number }> = {
  de_ancient: { scale: 5, pos_x: -2953, pos_y: 2164 },
  de_anubis: { scale: 5.22, pos_x: -2796, pos_y: 3328 },
  de_dust2: { scale: 4.4, pos_x: -2476, pos_y: 3239 },
  de_inferno: { scale: 4.9, pos_x: -2087, pos_y: 3870 },
  de_mirage: { scale: 5, pos_x: -3230, pos_y: 1713 },
  de_nuke: { scale: 7, pos_x: -3453, pos_y: 2887 },
  de_overpass: { scale: 5.2, pos_x: -4831, pos_y: 1781 },
};

export function unitsToMeters(units: number): number {
  return (units * MM_PER_UNIT) / 1000;
}
