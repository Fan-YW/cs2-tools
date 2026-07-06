export const IMAGE = 1024;
export const DRAG_THRESHOLD = 5;
export const MM_PER_UNIT = 25.4;

export const MAPS_C4 = [
  "de_ancient",
  "de_anubis",
  "de_cache",
  "de_dust2",
  "de_inferno",
  "de_mirage",
  "de_nuke",
  "de_overpass",
  "de_train",
  "de_vertigo"
] as const;

export const MAPS_WEAPON = [
  "cs_italy",
  "cs_office",
  "de_ancient",
  "de_anubis",
  "de_cache",
  "de_dust2",
  "de_inferno",
  "de_mirage",
  "de_nuke",
  "de_overpass",
  "de_train",
  "de_vertigo"
] as const;

export type MapId = (typeof MAPS_WEAPON)[number];
export type MapIdC4 = (typeof MAPS_C4)[number];

export type Landmark = { type: string; label: string; x: number; y: number };

export const MAP_META_C4: Record<
  MapIdC4,
  { scale: number; c4_base_damage: number; pos_x: number; pos_y: number; landmarks: Landmark[] }
> = {
  de_ancient: { scale: 5, c4_base_damage: 650, pos_x: -2953, pos_y: 2164, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.51, y: 0.17 },
    { type: "TSpawn", label: "T", x: 0.485, y: 0.87 },
    { type: "bombA", label: "A", x: 0.31, y: 0.25 },
    { type: "bombB", label: "B", x: 0.8, y: 0.4 }
  ] },
  de_anubis: { scale: 5.22, c4_base_damage: 450, pos_x: -2796, pos_y: 3328, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.41, y: 0.22 },
    { type: "TSpawn", label: "T", x: 0.48, y: 0.93 },
    { type: "bombA", label: "A", x: 0.75, y: 0.26 },
    { type: "bombB", label: "B", x: 0.325, y: 0.49 }
  ] },
  de_cache: { scale: 5.5, c4_base_damage: 600, pos_x: -2000, pos_y: 3250, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.09775, y: 0.473 },
    { type: "TSpawn", label: "T", x: 0.887, y: 0.585 },
    { type: "bombA", label: "A", x: 0.325, y: 0.26 },
    { type: "bombB", label: "B", x: 0.345, y: 0.79 }
  ] },
  de_dust2: { scale: 4.4, c4_base_damage: 700, pos_x: -2476, pos_y: 3239, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.62, y: 0.21 },
    { type: "TSpawn", label: "T", x: 0.39, y: 0.91 },
    { type: "bombA", label: "A", x: 0.8, y: 0.16 },
    { type: "bombB", label: "B", x: 0.21, y: 0.12 }
  ] },
  de_inferno: { scale: 4.9, c4_base_damage: 600, pos_x: -2087, pos_y: 3870, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.9, y: 0.35 },
    { type: "TSpawn", label: "T", x: 0.1, y: 0.67 },
    { type: "bombA", label: "A", x: 0.81, y: 0.69 },
    { type: "bombB", label: "B", x: 0.49, y: 0.22 }
  ] },
  de_mirage: { scale: 5, c4_base_damage: 650, pos_x: -3230, pos_y: 1713, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.28, y: 0.7 },
    { type: "TSpawn", label: "T", x: 0.87, y: 0.36 },
    { type: "bombA", label: "A", x: 0.54, y: 0.76 },
    { type: "bombB", label: "B", x: 0.23, y: 0.28 }
  ] },
  de_nuke: { scale: 7, c4_base_damage: 650, pos_x: -3453, pos_y: 2887, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.82, y: 0.45 },
    { type: "TSpawn", label: "T", x: 0.19, y: 0.54 },
    { type: "bombA", label: "A", x: 0.58, y: 0.48 },
    { type: "bombB", label: "B", x: 0.58, y: 0.58 }
  ] },
  de_overpass: { scale: 5.2, c4_base_damage: 650, pos_x: -4831, pos_y: 1781, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.49, y: 0.2 },
    { type: "TSpawn", label: "T", x: 0.66, y: 0.93 },
    { type: "bombA", label: "A", x: 0.55, y: 0.23 },
    { type: "bombB", label: "B", x: 0.7, y: 0.31 }
  ] },
  de_train: { scale: 4.082077, c4_base_damage: 500, pos_x: -2308, pos_y: 2078, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.86, y: 0.77 },
    { type: "TSpawn", label: "T", x: 0.12, y: 0.25 },
    { type: "bombA", label: "A", x: 0.63, y: 0.49 },
    { type: "bombB", label: "B", x: 0.52, y: 0.76 }
  ] },
  de_vertigo: { scale: 4, c4_base_damage: 500, pos_x: -3168, pos_y: 1762, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.54, y: 0.25 },
    { type: "TSpawn", label: "T", x: 0.2, y: 0.75 },
    { type: "bombA", label: "A", x: 0.705, y: 0.585 },
    { type: "bombB", label: "B", x: 0.222, y: 0.223 }
  ] },
};

export const MAP_META_WEAPON: Record<MapId, { scale: number; pos_x: number; pos_y: number; landmarks: Landmark[] }> = {
  cs_italy: { scale: 4.6, pos_x: -2647, pos_y: 2592, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.41, y: 0.91 },
    { type: "TSpawn", label: "T", x: 0.6, y: 0.1 },
    { type: "Hostage1", label: "H", x: 0.43, y: 0.29 },
    { type: "Hostage2", label: "H", x: 0.48, y: 0.24 },
    { type: "Hostage3", label: "H", x: 0.64, y: 0.03 },
    { type: "Hostage4", label: "H", x: 0.72, y: 0.05 }
  ] },
  cs_office: { scale: 4.1, pos_x: -1838, pos_y: 1858, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.16, y: 0.89 },
    { type: "TSpawn", label: "T", x: 0.78, y: 0.3 },
    { type: "Hostage1", label: "H", x: 0.84, y: 0.27 },
    { type: "Hostage2", label: "H", x: 0.84, y: 0.48 },
    { type: "Hostage3", label: "H", x: 0.91, y: 0.48 },
    { type: "Hostage4", label: "H", x: 0.77, y: 0.48 },
    { type: "Hostage5", label: "H", x: 0.77, y: 0.55 }
  ] },
  de_ancient: { scale: 5, pos_x: -2953, pos_y: 2164, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.51, y: 0.17 },
    { type: "TSpawn", label: "T", x: 0.485, y: 0.87 },
    { type: "bombA", label: "A", x: 0.31, y: 0.25 },
    { type: "bombB", label: "B", x: 0.8, y: 0.4 }
  ] },
  de_anubis: { scale: 5.22, pos_x: -2796, pos_y: 3328, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.41, y: 0.22 },
    { type: "TSpawn", label: "T", x: 0.48, y: 0.93 },
    { type: "bombA", label: "A", x: 0.75, y: 0.26 },
    { type: "bombB", label: "B", x: 0.325, y: 0.49 }
  ] },
  de_cache: { scale: 5.5, pos_x: -2000, pos_y: 3250, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.09775, y: 0.473 },
    { type: "TSpawn", label: "T", x: 0.887, y: 0.585 },
    { type: "bombA", label: "A", x: 0.325, y: 0.26 },
    { type: "bombB", label: "B", x: 0.345, y: 0.79 }
  ] },
  de_dust2: { scale: 4.4, pos_x: -2476, pos_y: 3239, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.62, y: 0.21 },
    { type: "TSpawn", label: "T", x: 0.39, y: 0.91 },
    { type: "bombA", label: "A", x: 0.8, y: 0.16 },
    { type: "bombB", label: "B", x: 0.21, y: 0.12 }
  ] },
  de_inferno: { scale: 4.9, pos_x: -2087, pos_y: 3870, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.9, y: 0.35 },
    { type: "TSpawn", label: "T", x: 0.1, y: 0.67 },
    { type: "bombA", label: "A", x: 0.81, y: 0.69 },
    { type: "bombB", label: "B", x: 0.49, y: 0.22 }
  ] },
  de_mirage: { scale: 5, pos_x: -3230, pos_y: 1713, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.28, y: 0.7 },
    { type: "TSpawn", label: "T", x: 0.87, y: 0.36 },
    { type: "bombA", label: "A", x: 0.54, y: 0.76 },
    { type: "bombB", label: "B", x: 0.23, y: 0.28 }
  ] },
  de_nuke: { scale: 7, pos_x: -3453, pos_y: 2887, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.82, y: 0.45 },
    { type: "TSpawn", label: "T", x: 0.19, y: 0.54 },
    { type: "bombA", label: "A", x: 0.58, y: 0.48 },
    { type: "bombB", label: "B", x: 0.58, y: 0.58 }
  ] },
  de_overpass: { scale: 5.2, pos_x: -4831, pos_y: 1781, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.49, y: 0.2 },
    { type: "TSpawn", label: "T", x: 0.66, y: 0.93 },
    { type: "bombA", label: "A", x: 0.55, y: 0.23 },
    { type: "bombB", label: "B", x: 0.7, y: 0.31 }
  ] },
  de_train: { scale: 4.082077, pos_x: -2308, pos_y: 2078, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.86, y: 0.77 },
    { type: "TSpawn", label: "T", x: 0.12, y: 0.25 },
    { type: "bombA", label: "A", x: 0.63, y: 0.49 },
    { type: "bombB", label: "B", x: 0.52, y: 0.76 }
  ] },
  de_vertigo: { scale: 4, pos_x: -3168, pos_y: 1762, landmarks: [
    { type: "CTSpawn", label: "CT", x: 0.54, y: 0.25 },
    { type: "TSpawn", label: "T", x: 0.2, y: 0.75 },
    { type: "bombA", label: "A", x: 0.705, y: 0.585 },
    { type: "bombB", label: "B", x: 0.222, y: 0.223 }
  ] },
};

export function unitsToMeters(units: number): number {
  return (units * MM_PER_UNIT) / 1000;
}
