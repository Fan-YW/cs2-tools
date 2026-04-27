<script setup lang="ts">
import {
  buildWeaponColumnsById,
  getColumn,
  loadWeaponsJson,
  normalizeWeaponsPayload,
  type WeaponRow,
} from "@/lib/weaponLoader";
import { asFiniteOr, rangeFactor } from "@/lib/weaponDamageCore";
import { publicUrl } from "@/lib/publicUrl";
import {
  SelectContent,
  SelectItem,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "reka-ui";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

type MaterialRow = { id: string; penetration: number };
type PresetRow = {
  id: string;
  material: string;
  thickness: number;
  angleDeg: number;
  distToWall: number;
  enemyDistToWall: number;
};

const weaponsList = ref<WeaponRow[]>([]);
const weaponColumnsById = ref<Map<string, Record<string, unknown>>>(new Map());
const materials = ref<MaterialRow[]>([]);
const presets = ref<PresetRow[]>([]);
const loadErr = ref("");

const materialId = ref("default");
const thickness = ref(20);
const angleDeg = ref(0);
const distToWall = ref(500);
const enemyDistToWall = ref(500);
const selectedPresetId = ref("");

function weaponPenetration(id: string): number {
  const cols = weaponColumnsById.value.get(id);
  if (!cols) return NaN;
  const raw = getColumn(cols, "Penetration");
  const x = Number(raw);
  return Number.isFinite(x) && x > 0 ? x : NaN;
}

const ZERO_DISPLAY = "-";

function fmtFixed(x: number | null | undefined, decimals: number): string {
  if (x == null || !Number.isFinite(x)) return t("common.emDash");
  const p = 10 ** decimals;
  const r = Math.round(x * p) / p;
  if (r === 0) return ZERO_DISPLAY;
  return r.toFixed(decimals);
}

/** 基本伤害：整数；无效为「—」，0 为「-」 */
function fmtInt(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return t("common.emDash");
  const n = Math.round(x);
  if (n === 0) return ZERO_DISPLAY;
  return String(n);
}

function fmt2(x: number | null | undefined) {
  return fmtFixed(x, 2);
}

function fmt3(x: number | null | undefined) {
  return fmtFixed(x, 3);
}

function fmt1(x: number | null | undefined) {
  return fmtFixed(x, 1);
}

function fmt4(x: number | null | undefined) {
  return fmtFixed(x, 4);
}

/** WeaporArmorRatio：显示为 (当前值/2)×100%，两位小数 + % */
function fmtArmorPenPercent(weaponArmor: number | null | undefined): string {
  if (weaponArmor == null || !Number.isFinite(weaponArmor)) return t("common.emDash");
  const pct = (weaponArmor / 2) * 100;
  const inner = fmtFixed(pct, 2);
  if (inner === ZERO_DISPLAY) return inner;
  return `${inner}%`;
}

const thicknessCm = computed(() => thickness.value * 2.54);
const distWallM = computed(() => distToWall.value * 0.0254);
const enemyDistWallM = computed(() => enemyDistToWall.value * 0.0254);

const selectedMaterial = computed(() => {
  return materials.value.find((m) => m.id === materialId.value) ?? materials.value[0];
});

function parseNumInput(v: string | number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return n;
}

/** 厚度/cos(角度)，与武器无关 */
const penetrationPathUnits = computed((): number | null => {
  const th = asFiniteOr(thickness.value, NaN);
  const ang = asFiniteOr(angleDeg.value, NaN);
  const cosA =
    Number.isFinite(ang) && ang >= 0 && ang <= 90
      ? Math.max(Math.cos((ang * Math.PI) / 180), 1e-9)
      : NaN;

  if (!Number.isFinite(th) || th < 0 || !Number.isFinite(cosA)) return null;
  return th / cosA;
});

/** 仅与材质、厚度、射击角有关，与武器无关 */
const thicknessAttenShared = computed((): number | null => {
  const matPen = selectedMaterial.value?.penetration;
  if (!Number.isFinite(matPen) || matPen <= 0) return null;

  const path = penetrationPathUnits.value;
  if (path == null) return null;
  return (path ** 2) / matPen;
});

const tableRows = computed(() => {
  const matPen = selectedMaterial.value?.penetration;
  if (!Number.isFinite(matPen) || matPen <= 0) return [];

  const thickAtten = thicknessAttenShared.value;
  if (thickAtten == null) return [];

  const th = asFiniteOr(thickness.value, NaN);
  const ang = asFiniteOr(angleDeg.value, NaN);
  const d1 = asFiniteOr(distToWall.value, NaN);
  const d2 = asFiniteOr(enemyDistToWall.value, NaN);
  const cosA =
    Number.isFinite(ang) && ang >= 0 && ang <= 90
      ? Math.max(Math.cos((ang * Math.PI) / 180), 1e-9)
      : NaN;

  if (![th, cosA, d1, d2].every(Number.isFinite) || th < 0 || d1 < 0 || d2 < 0) {
    return [];
  }

  const rows: {
    id: string;
    name: string;
    cells: (string | number)[];
  }[] = [];

  for (const w of weaponsList.value) {
    const wpnPen = weaponPenetration(w.id);
    const R = w.rangeMod;
    if (!Number.isFinite(R) || R <= 0 || !Number.isFinite(wpnPen) || wpnPen <= 0) {
      rows.push({
        id: w.id,
        name: w.displayName,
        cells: new Array(17).fill(t("common.emDash")),
      });
      continue;
    }

    const rf1 = rangeFactor(R, d1);
    const damageIn = w.damage * rf1;

    const matAtten = damageIn * 0.16 + 270 / matPen / wpnPen;
    const totalAtten = matAtten + thickAtten;
    const damageOutRaw = damageIn - totalAtten;
    const damageOut = Math.max(0, damageOutRaw);

    const rf2 = rangeFactor(R, d2);
    const toChar = Number.isFinite(rf2) ? damageOut * rf2 : NaN;

    const armMul = w.weaponArmor / 2;

    rows.push({
      id: w.id,
      name: w.displayName,
      cells: [
        fmtInt(w.damage),
        fmt2(R),
        fmt3(w.headMul),
        fmtArmorPenPercent(w.weaponArmor),
        fmt1(wpnPen),
        fmt4(damageIn),
        fmt4(matAtten),
        fmt4(totalAtten),
        fmt4(damageOut),
        fmt4(toChar),
        fmt4(toChar),
        fmt4(toChar * 1.25),
        fmt4(toChar * w.headMul),
        fmt4(toChar * 0.75),
        fmt4(toChar * armMul),
        fmt4(toChar * 1.25 * armMul),
        fmt4(toChar * w.headMul * armMul),
      ],
    });
  }

  return rows;
});

onMounted(async () => {
  loadErr.value = "";
  try {
    const [data, matRes, presetRes] = await Promise.all([
      loadWeaponsJson(),
      fetch(publicUrl("wall/materials.json")),
      fetch(publicUrl("wall/presets.json")),
    ]);
    if (!matRes.ok) throw new Error("materials.json");
    const matJson = (await matRes.json()) as unknown;
    const list = Array.isArray(matJson) ? matJson : [];
    materials.value = list
      .filter((x): x is MaterialRow => {
        if (!x || typeof x !== "object") return false;
        const o = x as Record<string, unknown>;
        return typeof o.id === "string" && Number.isFinite(Number(o.penetration));
      })
      .map((o) => ({
        id: String((o as MaterialRow).id),
        penetration: Number((o as MaterialRow).penetration),
      }));
    if (!materials.value.some((m) => m.id === materialId.value)) {
      materialId.value = materials.value[0]?.id ?? "default";
    }

    if (presetRes.ok) {
      const presetJson = (await presetRes.json()) as unknown;
      const presetList = Array.isArray(presetJson) ? presetJson : [];
      presets.value = presetList
        .filter((x): x is PresetRow => {
          if (!x || typeof x !== "object") return false;
          const o = x as Record<string, unknown>;
          return (
            typeof o.id === "string" &&
            typeof o.material === "string" &&
            Number.isFinite(Number(o.thickness))
          );
        })
        .map((o) => ({
          id: String(o.id),
          material: String(o.material),
          thickness: Number(o.thickness),
          angleDeg: Number.isFinite(Number(o.angleDeg)) ? Number(o.angleDeg) : 0,
          distToWall: Number.isFinite(Number(o.distToWall)) ? Number(o.distToWall) : 0,
          enemyDistToWall: Number.isFinite(Number(o.enemyDistToWall))
            ? Number(o.enemyDistToWall)
            : 0,
        }));
    }

    weaponColumnsById.value = buildWeaponColumnsById(data);
    weaponsList.value = normalizeWeaponsPayload(data);
  } catch (e) {
    loadErr.value = t("weapon.error.loadFailed", {
      msg: e instanceof Error ? e.message : String(e),
    });
  }
});

function materialLabel(id: string) {
  return t(`wallPen.material.${id}`);
}

function presetLabel(id: string) {
  return t(`wallPen.preset${id.charAt(0).toUpperCase() + id.slice(1)}`);
}

function applyPreset(preset: PresetRow) {
  selectedPresetId.value = preset.id;
  materialId.value = preset.material;
  thickness.value = preset.thickness;
  angleDeg.value = preset.angleDeg;
  distToWall.value = preset.distToWall;
  enemyDistToWall.value = preset.enemyDistToWall;
}

function clearPreset() {
  selectedPresetId.value = "";
  materialId.value = "default";
  thickness.value = 20;
  angleDeg.value = 0;
  distToWall.value = 500;
  enemyDistToWall.value = 500;
}
</script>

<template>
  <main class="app wall-pen-page">
    <aside class="panel rk-panel wall-pen-controls">
      <p v-if="loadErr" class="err">
        {{ loadErr }}
      </p>
      <template v-else>
        <div class="wall-pen-fields-grid">
          <div v-if="presets.length" class="wall-pen-field preset-field">
            <label class="wall-pen-label">{{ t("wallPen.presets") }}</label>
            <div class="preset-select-row">
              <SelectRoot v-model="selectedPresetId" @update:model-value="(val) => { const p = presets.find(p => p.id === val); if (p) applyPreset(p); }">
                <SelectTrigger class="rk-select-trigger" :aria-label="t('wallPen.presets')">
                  <SelectValue :placeholder="t('wallPen.presetsPlaceholder')">
                    <template #default>
                      {{ selectedPresetId ? presetLabel(selectedPresetId) : t("wallPen.presetsPlaceholder") }}
                    </template>
                  </SelectValue>
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent class="rk-select-content" position="popper">
                    <SelectViewport>
                      <SelectItem
                        v-for="p in presets"
                        :key="p.id"
                        :value="p.id"
                        class="rk-select-item"
                      >
                        {{ presetLabel(p.id) }}
                      </SelectItem>
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
              <button
                v-if="selectedPresetId"
                class="preset-clear-btn"
                type="button"
                :title="t('wallPen.presetsClear')"
                @click="clearPreset"
              >
                ×
              </button>
            </div>
          </div>

          <div v-if="materials.length" class="wall-pen-field">
            <label class="wall-pen-label">{{ t("wallPen.obstacleMaterial") }}</label>
            <SelectRoot v-model="materialId">
              <SelectTrigger class="rk-select-trigger" :aria-label="t('wallPen.obstacleMaterial')">
                <SelectValue :placeholder="t('wallPen.materialPlaceholder')">
                  <template #default>
                    {{ materialLabel(materialId) }}
                  </template>
                </SelectValue>
              </SelectTrigger>
              <SelectPortal>
                <SelectContent class="rk-select-content" position="popper">
                  <SelectViewport>
                    <SelectItem
                      v-for="m in materials"
                      :key="m.id"
                      :value="m.id"
                      class="rk-select-item"
                    >
                      {{ materialLabel(m.id) }}
                    </SelectItem>
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </div>

          <div class="wall-pen-field">
            <label class="wall-pen-label" for="wp-thickness">{{ t("wallPen.thickness") }}</label>
            <input
              id="wp-thickness"
              v-model.number="thickness"
              class="wall-pen-input"
              type="number"
              min="0"
              step="any"
            >
            <span class="muted wall-pen-hint">{{
              t("wallPen.thicknessHint", { cm: fmt2(thicknessCm) })
            }}</span>
          </div>

          <div class="wall-pen-field">
            <label class="wall-pen-label" for="wp-angle">{{ t("wallPen.shootAngle") }}</label>
            <input
              id="wp-angle"
              v-model.number="angleDeg"
              class="wall-pen-input"
              type="number"
              min="0"
              max="90"
              step="any"
            >
          </div>

          <div class="wall-pen-field">
            <label class="wall-pen-label" for="wp-dist1">{{ t("wallPen.distToObstacle") }}</label>
            <input
              id="wp-dist1"
              :value="distToWall"
              class="wall-pen-input"
              type="number"
              min="0"
              step="any"
              @input="distToWall = parseNumInput(($event.target as HTMLInputElement).value)"
            >
            <span class="muted wall-pen-hint">{{
              t("wallPen.distanceMetersHint", { m: fmt2(distWallM) })
            }}</span>
          </div>

          <div class="wall-pen-field">
            <label class="wall-pen-label" for="wp-dist2">{{ t("wallPen.enemyDistToObstacle") }}</label>
            <input
              id="wp-dist2"
              :value="enemyDistToWall"
              class="wall-pen-input"
              type="number"
              min="0"
              step="any"
              @input="
                enemyDistToWall = parseNumInput(($event.target as HTMLInputElement).value)
              "
            >
            <span class="muted wall-pen-hint">{{
              t("wallPen.distanceMetersHint", { m: fmt2(enemyDistWallM) })
            }}</span>
          </div>
        </div>
      </template>
    </aside>

    <section class="wall-pen-table-section">
      <div class="wall-pen-global-stats">
        <p class="wall-pen-global-stat">
          <span class="wall-pen-global-stat-label">{{ t("wallPen.actualPenetrationDistance") }}</span>
          <span class="wall-pen-global-stat-value">{{
              penetrationPathUnits != null ? fmt4(penetrationPathUnits) : t("common.emDash")
            }}</span>
        </p>
        <p class="wall-pen-global-stat">
          <span class="wall-pen-global-stat-label">{{ t("wallPen.colThicknessAtten") }}</span>
          <span class="wall-pen-global-stat-value">{{
              thicknessAttenShared != null ? fmt4(thicknessAttenShared) : t("common.emDash")
            }}</span>
        </p>
      </div>
      <div class="weapon-table-wrap wall-pen-table-wrap">
        <table class="weapon-table wall-pen-table">
          <thead>
            <tr>
              <th class="wall-pen-sticky-col">
                {{ t("wallPen.colWeapon") }}
              </th>
              <th>{{ t("wallPen.colBaseDamage") }}</th>
              <th>{{ t("wallPen.colRangeMod") }}</th>
              <th>{{ t("wallPen.colHeadshotMul") }}</th>
              <th>{{ t("wallPen.colArmorPenetration") }}</th>
              <th>{{ t("wallPen.colWeaponPenetration") }}</th>
              <th>{{ t("wallPen.colDamageEntering") }}</th>
              <th>{{ t("wallPen.colMatAtten") }}</th>
              <th>{{ t("wallPen.colTotalAtten") }}</th>
              <th>{{ t("wallPen.colDamageExiting") }}</th>
              <th>{{ t("wallPen.colCharDamage") }}</th>
              <th>{{ t("wallPen.colNoArmorBody") }}</th>
              <th>{{ t("wallPen.colNoArmorAbdomen") }}</th>
              <th>{{ t("wallPen.colNoArmorHead") }}</th>
              <th>{{ t("wallPen.colLeg") }}</th>
              <th>{{ t("wallPen.colArmorBody") }}</th>
              <th>{{ t("wallPen.colArmorAbdomen") }}</th>
              <th>{{ t("wallPen.colArmorHead") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableRows" :key="row.id">
              <td class="weapon-name-cell wall-pen-sticky-col">
                {{ row.name }}
              </td>
              <td v-for="(c, i) in row.cells" :key="i" class="num-cell">
                {{ c }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.wall-pen-page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  padding: 1rem;
  min-height: calc(100vh - 56px);
  max-height: calc(100vh - 56px);
  box-sizing: border-box;
  overflow: hidden;
}

.wall-pen-controls {
  flex: 0 0 auto;
  width: 100%;
  overflow: visible;
}

.wall-pen-table-section {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.wall-pen-global-stats {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin: 0 0 0.5rem;
}

.wall-pen-global-stat {
  flex: 1 1 auto;
  margin: 0;
  min-width: min(14rem, 100%);
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--rk-border);
  background: rgba(37, 99, 235, 0.06);
  font-size: 0.9rem;
}

.wall-pen-global-stat-label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.wall-pen-global-stat-value {
  font-variant-numeric: tabular-nums;
}

.wall-pen-fields-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem 1rem;
  align-items: start;
  min-width: 0;
}

.wall-pen-field {
  margin-bottom: 0;
}

.preset-select-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.preset-select-row .rk-select-trigger {
  flex: 1;
}

.preset-clear-btn {
  flex: 0 0 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--rk-border);
  background: var(--rk-input-bg);
  color: var(--rk-text);
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.preset-clear-btn:hover {
  background: var(--rk-border);
}

.wall-pen-label {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.wall-pen-input {
  width: 100%;
  min-height: 2.25rem;
  padding: 0 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--rk-border);
  background: var(--rk-input-bg);
  color: var(--rk-text);
  font-size: 0.9rem;
}

.wall-pen-hint {
  display: block;
  margin-top: 0.25rem;
}

.wall-pen-table-wrap {
  flex: 1;
  width: 100%;
  min-width: 0;
  overflow: auto;
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  background: var(--rk-surface);
}

.wall-pen-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.wall-pen-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--rk-surface);
  box-shadow: 0 1px 0 var(--rk-border);
}

.wall-pen-table thead th.wall-pen-sticky-col {
  z-index: 3;
  box-shadow:
    2px 0 0 var(--rk-border),
    0 1px 0 var(--rk-border);
}

.wall-pen-sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--rk-surface);
  box-shadow: 2px 0 0 var(--rk-border);
}

.err {
  color: #b91c1c;
  font-size: 0.9rem;
}

.num-cell {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
