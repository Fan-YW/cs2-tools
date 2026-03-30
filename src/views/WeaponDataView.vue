<script setup lang="ts">
import {
  buildWeaponColumnsById,
  loadWeaponsJson,
  normalizeWeaponsPayload,
  type WeaponRow,
  getColumn,
} from "@/lib/weaponLoader";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const weaponsList = ref<WeaponRow[]>([]);
const weaponColumnsById = ref<Map<string, Record<string, unknown>>>(new Map());
const loading = ref(false);
const error = ref("");

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

function spreadComponent(columns: Record<string, unknown>): number {
  const s = numFrom(columns, "Spread");
  return Number.isFinite(s) ? s : 0;
}

function effectiveInaccuracy(inacc: number, spread: number): number {
  if (!Number.isFinite(inacc)) return NaN;
  return inacc + spread;
}

function getInaccuracyNote(note: Record<string, number> | undefined, type: 'stand' | 'crouch' | 'move'): string {
  if (!note) return '';
  
  const decayKey = `Inaccuracy${type.charAt(0).toUpperCase() + type.slice(1)}Decay` as keyof typeof note;
  const decayValue = note[decayKey];
  
  if (!Number.isFinite(decayValue)) return '';
  
  return `Due to inaccuracy decay when charging the best inaccuracy is: ${fmtNum(decayValue / 1000, 5)}`;
}

function getAccurateRangeNote(note: Record<string, number> | undefined, type: 'stand' | 'crouch' | 'move'): string {
  if (!note) return '';
  
  const decayKey = `Inaccuracy${type.charAt(0).toUpperCase() + type.slice(1)}Decay` as keyof typeof note;
  const decayValue = note[decayKey];
  
  if (!Number.isFinite(decayValue) || decayValue <= 0) return '';
  
  return `Due to inaccuracy decay when charging the best Accurate Range is: ${fmtNum(152.4 / decayValue, 2)}`;
}

interface TableWeapon {
  id: string;
  displayName: string;
  weaponType: string;
  armorPen: string;
  baseDamage: string;
  rangeMod: string;
  headMul: string;
  rpm: string;
  price: string;
  killAward: string;
  maxSpeed: string;
  walkSpeed: string;
  crouchSpeed: string;
  standInacc: string;
  standInaccDist: string;
  crouchInacc: string;
  crouchInaccDist: string;
  moveInacc: string;
  moveInaccDist: string;
  standInaccAlt: string;
  standInaccDistAlt: string;
  crouchInaccAlt: string;
  crouchInaccDistAlt: string;
  moveInaccAlt: string;
  moveInaccDistAlt: string;
  clip: string;
  reserve: string;
  maxRange: string;
  pellets: string;
  maxHeadRange: string;
  maxHeadArmorRange: string;
  note?: Record<string, number>;
}

const tableData = computed((): TableWeapon[] => {
  return weaponsList.value.map((w) => {
    const cols = weaponColumnsById.value.get(w.id) ?? {};
    const note = cols.note as Record<string, number> | undefined;

    const armorRatio = numFrom(cols, ["WeaporArmorRatio", "WeaponArmor", "WeaponArmorRatio"]);
    const armorPen = Number.isFinite(armorRatio) ? `${fmtNum((armorRatio / 2) * 100, 2)}%` : "—";

    const damage = numFrom(cols, "Damage");
    const baseDamage = Number.isFinite(damage) ? String(Math.round(damage)) : "—";

    const rangeMod = numFrom(cols, "RangeModifier");
    const rangeModStr = Number.isFinite(rangeMod) ? fmtNum(rangeMod, 4) : "—";

    const head = numFrom(cols, ["HeadshotMultiplier", "HeadShotMultiplier"]);
    const headMul = Number.isFinite(head) ? fmtNum(head, 3) : "—";

    const cycle = numFrom(cols, "CycleTime");
    const rpm = Number.isFinite(cycle) && cycle > 0 ? `${fmtNum(60 / cycle, 1)}` : "—";

    const price = numFrom(cols, "WeaponPrice");
    const priceStr = Number.isFinite(price) ? `$${Math.round(price)}` : "—";

    const killAward = numFrom(cols, "KillAward");
    const killAwardStr = Number.isFinite(killAward) ? `$${Math.round(killAward)}` : "—";

    const maxSpd = numFrom(cols, "MaxPlayerSpeed");
    const maxSpeed = Number.isFinite(maxSpd) ? fmtNum(maxSpd, 1) : "—";
    const walkSpeed = Number.isFinite(maxSpd) ? fmtNum(maxSpd * 0.52, 1) : "—";
    const crouchSpeed = Number.isFinite(maxSpd) ? fmtNum(maxSpd * 0.34, 1) : "—";

    const spread = spreadComponent(cols);
    
    const standI = effectiveInaccuracy(numFrom(cols, "InaccuracyStand"), spread);
    const standInacc = Number.isFinite(standI) && standI > 0 ? fmtNum(standI / 1000, 5) : "—";
    const standInaccDist = Number.isFinite(standI) && standI > 0 ? fmtNum(152.4 / standI, 2) : "—";
    
    const crouchI = effectiveInaccuracy(numFrom(cols, "InaccuracyCrouch"), spread);
    const crouchInacc = Number.isFinite(crouchI) && crouchI > 0 ? fmtNum(crouchI / 1000, 5) : "—";
    const crouchInaccDist = Number.isFinite(crouchI) && crouchI > 0 ? fmtNum(152.4 / crouchI, 2) : "—";
    
    const moveI = effectiveInaccuracy(numFrom(cols, "InaccuracyMove"), spread);
    const moveInacc = Number.isFinite(moveI) && moveI > 0 ? fmtNum(moveI / 1000, 5) : "—";
    const moveInaccDist = Number.isFinite(moveI) && moveI > 0 ? fmtNum(152.4 / moveI, 2) : "—";

    const spreadAlt = numFrom(cols, "SpreadAlt");
    let standInaccAlt = "—";
    let standInaccDistAlt = "—";
    let crouchInaccAlt = "—";
    let crouchInaccDistAlt = "—";
    let moveInaccAlt = "—";
    let moveInaccDistAlt = "—";

    if (Number.isFinite(spreadAlt)) {
      const standIAlt = effectiveInaccuracy(numFrom(cols, "InaccuracyStandAlt"), spreadAlt);
      if (Number.isFinite(standIAlt) && standIAlt > 0) {
        standInaccAlt = fmtNum(standIAlt / 1000, 5);
        standInaccDistAlt = fmtNum(152.4 / standIAlt, 2);
      }

      const crouchIAlt = effectiveInaccuracy(numFrom(cols, "InaccuracyCrouchAlt"), spreadAlt);
      if (Number.isFinite(crouchIAlt) && crouchIAlt > 0) {
        crouchInaccAlt = fmtNum(crouchIAlt / 1000, 5);
        crouchInaccDistAlt = fmtNum(152.4 / crouchIAlt, 2);
      }

      const moveIAlt = effectiveInaccuracy(numFrom(cols, "InaccuracyMoveAlt"), spreadAlt);
      if (Number.isFinite(moveIAlt) && moveIAlt > 0) {
        moveInaccAlt = fmtNum(moveIAlt / 1000, 5);
        moveInaccDistAlt = fmtNum(152.4 / moveIAlt, 2);
      }
    }

    const clip = numFrom(cols, ["clip_size", "Clip_size", "ClipSize"]);
    const clipStr = Number.isFinite(clip) ? String(Math.round(clip)) : "—";

    const reserve = numFrom(cols, "m_nPrimaryReserveAmmoMax");
    const reserveAsClips = asBool(getColumn(cols, "m_bReserveAmmoAsClips"));
    let reserveStr = "—";
    if (Number.isFinite(reserve)) {
      const unit = reserveAsClips ? t("weaponDetail.reserveUnitClip") : t("weaponDetail.reserveUnitRound");
      reserveStr = `${Math.round(reserve)} ${unit}`;
    }

    const range = numFrom(cols, "Range");
    const maxRange = Number.isFinite(range) ? String(Math.round(range)) : "—";

    const pellets = numFrom(cols, "Bullets");
    const pelletsStr = Number.isFinite(pellets) && pellets > 1 ? String(Math.round(pellets)) : "—";

    // 计算最远爆头距离
    let maxHeadRange = "—";
    let maxHeadArmorRange = "—";
    if (Number.isFinite(damage) && damage > 0 && Number.isFinite(head) && head > 0 && Number.isFinite(rangeMod) && rangeMod > 0 && rangeMod < 1) {
      // 最远爆头距离 = 500 * (LOG(100 / baseDamage / 爆头倍数) / log(距离衰减))
      const headRange = 500 * (Math.log(100 / damage / head) / Math.log(rangeMod));
      if (Number.isFinite(headRange) && headRange > 0) {
        const finalHeadRange = Number.isFinite(range) && range > 0 ? Math.min(headRange, range) : headRange;
        maxHeadRange = fmtNum(finalHeadRange, 2);
      }

      // 最远爆头距离（头盔） = 500 * (LOG(100 / 护甲衰减 / baseDamage / 爆头倍数) / log(距离衰减))
      if (Number.isFinite(armorRatio) && armorRatio > 0) {
        const armorPenetration = armorRatio / 2; // 护甲衰减
        const headArmorRange = 500 * (Math.log(100 / armorPenetration / damage / head) / Math.log(rangeMod));
        if (Number.isFinite(headArmorRange) && headArmorRange > 0) {
          const finalHeadArmorRange = Number.isFinite(range) && range > 0 ? Math.min(headArmorRange, range) : headArmorRange;
          maxHeadArmorRange = fmtNum(finalHeadArmorRange, 2);
        }
      }
    }

    const wType = getColumn(cols, "WeaponType");
    const weaponType = typeof wType === "string" && wType.trim() ? wType.trim() : "—";

    return {
      id: w.id,
      displayName: w.displayName,
      weaponType,
      armorPen,
      baseDamage,
      rangeMod: rangeModStr,
      headMul,
      rpm,
      price: priceStr,
      killAward: killAwardStr,
      maxSpeed,
      walkSpeed,
      crouchSpeed,
      standInacc,
      standInaccDist,
      crouchInacc,
      crouchInaccDist,
      moveInacc,
      moveInaccDist,
      standInaccAlt,
      standInaccDistAlt,
      crouchInaccAlt,
      crouchInaccDistAlt,
      moveInaccAlt,
      moveInaccDistAlt,
      clip: clipStr,
      reserve: reserveStr,
      maxRange,
      pellets: pelletsStr,
      maxHeadRange,
      maxHeadArmorRange,
      note
    };
  });
});

onMounted(async () => {
  loading.value = true;
  error.value = "";
  try {
    const data = await loadWeaponsJson();
    weaponColumnsById.value = buildWeaponColumnsById(data);
    weaponsList.value = normalizeWeaponsPayload(data);
  } catch (e) {
    error.value = t("weaponData.error", {
      msg: e instanceof Error ? e.message : String(e),
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="app weapon-data-page">
    <div class="weapon-data-container">
      
      <div v-if="loading" class="loading">
        {{ t("weaponData.loading") }}
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else class="table-wrapper">
        <div class="table-scroll">
          <table class="weapon-data-table">
            <thead>
              <tr>
                <th>{{ t("weaponData.colName") }}</th>
                <th>{{ t("weaponData.colType") }}</th>
                <th>{{ t("weaponData.colArmorPen") }}</th>
                <th>{{ t("weaponData.colDamage") }}</th>
                <th>{{ t("weaponData.colRangeMod") }}</th>
                <th>{{ t("weaponData.colHeadMul") }}</th>
                <th>{{ t("weaponData.colRpm") }}</th>
                <th>{{ t("weaponData.colPrice") }}</th>
                <th>{{ t("weaponData.colKillAward") }}</th>
                <th>{{ t("weaponData.colMaxSpeed") }}</th>
                <th>{{ t("weaponData.colWalkSpeed") }}</th>
                <th>{{ t("weaponData.colCrouchSpeed") }}</th>
                <th>{{ t("weaponData.colStandInacc") }}</th>
                <th class="header-with-note" :title="t('weaponData.accDistNote')">{{ t("weaponData.colStandInaccDist") }}</th>
                <th>{{ t("weaponData.colCrouchInacc") }}</th>
                <th class="header-with-note" :title="t('weaponData.accDistNote')">{{ t("weaponData.colCrouchInaccDist") }}</th>
                <th>{{ t("weaponData.colMoveInacc") }}</th>
                <th class="header-with-note" :title="t('weaponData.accDistNote')">{{ t("weaponData.colMoveInaccDist") }}</th>
                <th class="header-with-note" :title="t('weaponData.altNote')">{{ t("weaponData.colStandInaccAlt") }}</th>
                <th class="header-with-note" :title="t('weaponData.accDistNote') + ' ' + t('weaponData.altNote')">{{ t("weaponData.colStandInaccDistAlt") }}</th>
                <th class="header-with-note" :title="t('weaponData.altNote')">{{ t("weaponData.colCrouchInaccAlt") }}</th>
                <th class="header-with-note" :title="t('weaponData.accDistNote') + ' ' + t('weaponData.altNote')">{{ t("weaponData.colCrouchInaccDistAlt") }}</th>
                <th class="header-with-note" :title="t('weaponData.altNote')">{{ t("weaponData.colMoveInaccAlt") }}</th>
                <th class="header-with-note" :title="t('weaponData.accDistNote') + ' ' + t('weaponData.altNote')">{{ t("weaponData.colMoveInaccDistAlt") }}</th>
                <th>{{ t("weaponData.colClip") }}</th>
                <th>{{ t("weaponData.colReserve") }}</th>
                <th>{{ t("weaponData.colMaxRange") }}</th>
                <th>{{ t("weaponData.colPellets") }}</th>
                <th>{{ t("weaponData.colMaxHeadRange") }}</th>
                <th>{{ t("weaponData.colMaxHeadArmorRange") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="weapon in tableData" :key="weapon.id">
                <td class="name-cell">{{ weapon.displayName }}</td>
                <td>{{ weapon.weaponType }}</td>
                <td>{{ weapon.armorPen }}</td>
                <td>{{ weapon.baseDamage }}</td>
                <td>{{ weapon.rangeMod }}</td>
                <td>{{ weapon.headMul }}</td>
                <td>{{ weapon.rpm }}</td>
                <td>{{ weapon.price }}</td>
                <td>{{ weapon.killAward }}</td>
                <td>{{ weapon.maxSpeed }}</td>
                <td>{{ weapon.walkSpeed }}</td>
                <td>{{ weapon.crouchSpeed }}</td>
                <td><span :class="{ 'comment-triangle': weapon.id === 'revolver' && weapon.note }" :title="weapon.id === 'revolver' ? getInaccuracyNote(weapon.note, 'stand') : ''">{{ weapon.standInacc }}</span></td>
                <td><span :class="{ 'comment-triangle': weapon.id === 'revolver' && weapon.note }" :title="weapon.id === 'revolver' ? getAccurateRangeNote(weapon.note, 'stand') : ''">{{ weapon.standInaccDist }}</span></td>
                <td><span :class="{ 'comment-triangle': weapon.id === 'revolver' && weapon.note }" :title="weapon.id === 'revolver' ? getInaccuracyNote(weapon.note, 'crouch') : ''">{{ weapon.crouchInacc }}</span></td>
                <td><span :class="{ 'comment-triangle': weapon.id === 'revolver' && weapon.note }" :title="weapon.id === 'revolver' ? getAccurateRangeNote(weapon.note, 'crouch') : ''">{{ weapon.crouchInaccDist }}</span></td>
                <td><span :class="{ 'comment-triangle': weapon.id === 'revolver' && weapon.note }" :title="weapon.id === 'revolver' ? getInaccuracyNote(weapon.note, 'move') : ''">{{ weapon.moveInacc }}</span></td>
                <td><span :class="{ 'comment-triangle': weapon.id === 'revolver' && weapon.note }" :title="weapon.id === 'revolver' ? getAccurateRangeNote(weapon.note, 'move') : ''">{{ weapon.moveInaccDist }}</span></td>
                <td>{{ weapon.standInaccAlt }}</td>
                <td>{{ weapon.standInaccDistAlt }}</td>
                <td>{{ weapon.crouchInaccAlt }}</td>
                <td>{{ weapon.crouchInaccDistAlt }}</td>
                <td>{{ weapon.moveInaccAlt }}</td>
                <td>{{ weapon.moveInaccDistAlt }}</td>
                <td>{{ weapon.clip }}</td>
                <td>{{ weapon.reserve }}</td>
                <td>{{ weapon.maxRange }}</td>
                <td>{{ weapon.pellets }}</td>
                <td>{{ weapon.maxHeadRange }}</td>
                <td>{{ weapon.maxHeadArmorRange }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.weapon-data-container {
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  height: calc(100vh - 56px - 2rem);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--rk-text);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--rk-border);
}

.loading,
.error {
  padding: 2rem;
  text-align: center;
  color: var(--rk-text-secondary);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error {
  color: #dc2626;
}

.table-wrapper {
  flex: 1;
  width: 100%;
  border: 1px solid var(--rk-border);
  border-radius: 10px;
  background: var(--rk-bg);
  box-shadow: 0 1px 3px var(--rk-shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.table-scroll {
  flex: 1;
  overflow: auto;
  position: relative;
}

.weapon-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  min-width: 1800px;
  table-layout: auto;
}

.weapon-data-table thead th {
  background: var(--rk-surface);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  border-bottom: 2px solid var(--rk-border);
  padding: 0.4rem 0.3rem;
  text-align: center;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.3;
  min-height: 2.6rem;
  vertical-align: middle;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--rk-surface);
}

.weapon-data-table th,
.weapon-data-table td {
  border: 1px solid var(--rk-border);
  padding: 0.5rem 0.5rem;
  text-align: center;
  white-space: nowrap;
  background: var(--rk-bg);
}

.weapon-data-table td:not(:first-child):not(:nth-child(2)) {
  text-align: right;
}

.weapon-data-table tbody tr:nth-child(even) td {
  background: #f8f9fa;
}

.weapon-data-table tbody tr:hover td {
  background: #e3f2fd;
}

.weapon-data-table th {
  background: var(--rk-surface);
}

.weapon-data-table th:first-child,
.weapon-data-table td:first-child {
  text-align: left;
  position: sticky;
  left: 0;
  background: var(--rk-bg);
  z-index: 1;
}

.weapon-data-table th:first-child {
  z-index: 3;
  background: var(--rk-surface);
}

.weapon-data-table tbody tr:nth-child(even) td:first-child {
  background: #f8f9fa;
}

.weapon-data-table tbody tr:hover td:first-child {
  background: #e3f2fd;
}

.name-cell {
  font-weight: 500;
  white-space: nowrap;
  position: sticky;
  left: 0;
  background: var(--rk-bg);
  z-index: 1;
}
.comment-triangle {
  position: relative;
  display: inline;
}

.comment-triangle::after {
  content: "";
  position: absolute;
  top: -5px;
  right: -5px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-top: 5px solid #dc2626;
}

.header-with-note {
  position: relative;
}

.header-with-note::after {
  content: "";
  position: absolute;
  top: 5px;
  right: 5px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-top: 5px solid #dc2626;
}


</style>
