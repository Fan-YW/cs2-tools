<script setup lang="ts">
import { useRadarMap } from "@/composables/useRadarMap";
import {
  calcWeaponRow,
  shouldHighlight,
} from "@/lib/weaponDamageCore";
import { MAP_META_WEAPON, MAPS } from "@/lib/mapConstants";
import WeaponDetailModal from "@/components/WeaponDetailModal.vue";
import WeaponSelectorPanel from "@/components/WeaponSelectorPanel.vue";
import MapScaleDisplay from "@/components/MapScaleDisplay.vue";
import {
  buildWeaponColumnsById,
  loadWeaponsJson,
  normalizeWeaponsPayload,
  type WeaponRow,
} from "@/lib/weaponLoader";
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

const {
  viewportRef,
  panzoomRef,
  mapimgRef,
  canvasRef,
  mapId,
  scaleHintText,
  metaErrKey,
  outDist,
  outDistM,
  distanceGame,
  mouseU,
  mouseV,
  mapOriginJson,
  scale,
} = useRadarMap("weapon", MAP_META_WEAPON);

const weaponsList = ref<WeaponRow[]>([]);
const weaponColumnsById = ref<Map<string, Record<string, unknown>>>(new Map());
const weaponErr = ref("");
const selectedIds = ref<string[]>([]);

const detailOpen = ref(false);
const detailWeaponId = ref<string | null>(null);

const detailDisplayName = computed(() => {
  if (!detailWeaponId.value) return "";
  const w = weaponsList.value.find((x) => x.id === detailWeaponId.value);
  return w?.displayName ?? detailWeaponId.value;
});

const detailColumns = computed(() => {
  if (!detailWeaponId.value) return null;
  return weaponColumnsById.value.get(detailWeaponId.value) ?? null;
});

function openWeaponDetail(weaponId: string) {
  detailWeaponId.value = weaponId;
  detailOpen.value = true;
}

function fmt2(x: number | null) {
  if (x == null || !Number.isFinite(x)) return "—";
  return (Math.round(x * 100) / 100).toFixed(2);
}

function armoredCell(dmg: number, reduced: number) {
  return `${fmt2(dmg)}(${String(reduced)})`;
}

function toggleWeapon(id: string) {
  const s = new Set(selectedIds.value);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  selectedIds.value = [...s];
}

function bulkToggle(type: string, items: WeaponRow[]) {
  const allSelected = items.every((w) => selectedIds.value.includes(w.id));
  const s = new Set(selectedIds.value);
  if (allSelected) {
    items.forEach((w) => s.delete(w.id));
  } else {
    items.forEach((w) => s.add(w.id));
  }
  selectedIds.value = [...s];
}

const weaponGroups = computed(() => {
  const groups = new Map<string, WeaponRow[]>();
  for (const w of weaponsList.value) {
    const key = w.weaponType || "other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(w);
  }
  return [...groups.entries()];
});

type TableRow =
  | { kind: "msg"; text: string }
  | {
      kind: "data";
      name: string;
      cells: { text: string; high: boolean; nameCell?: boolean }[];
    };

const tableRows = computed((): TableRow[] => {
  const d = distanceGame.value;
  const selected = weaponsList.value.filter((w) => selectedIds.value.includes(w.id));
  if (!selected.length) {
    return [{ kind: "msg", text: t("weaponRange.pickOneWeapon") }];
  }
  const rows: TableRow[] = [];
  for (const w of selected) {
    const row = calcWeaponRow(w, d);
    const cells = [
      { text: w.displayName, high: false, nameCell: true },
      {
        text: row ? fmt2(row.noHead) : "—",
        high: row ? shouldHighlight(row.noHead) : false,
      },
      {
        text: row ? fmt2(row.noChest) : "—",
        high: row ? shouldHighlight(row.noChest) : false,
      },
      {
        text: row ? fmt2(row.noAbd) : "—",
        high: row ? shouldHighlight(row.noAbd) : false,
      },
      {
        text: row ? fmt2(row.noLeg) : "—",
        high: row ? shouldHighlight(row.noLeg) : false,
      },
      {
        text: row ? armoredCell(row.armHead, row.redHead) : "—",
        high: row ? shouldHighlight(row.armHead) : false,
      },
      {
        text: row ? armoredCell(row.armChest, row.redChest) : "—",
        high: row ? shouldHighlight(row.armChest) : false,
      },
      {
        text: row ? armoredCell(row.armAbd, row.redAbd) : "—",
        high: row ? shouldHighlight(row.armAbd) : false,
      },
    ];
    rows.push({ kind: "data", name: w.id, cells });
  }
  return rows;
});

onMounted(async () => {
  weaponErr.value = "";
  try {
    const data = await loadWeaponsJson();
    weaponColumnsById.value = buildWeaponColumnsById(data);
    weaponsList.value = normalizeWeaponsPayload(data);
    selectedIds.value = [];
  } catch (e) {
    weaponErr.value = t("weapon.error.loadFailed", {
      msg: e instanceof Error ? e.message : String(e),
    });
  }
});
</script>

<template>
  <main class="app tool-page">
    <div class="map-wrap">
      <div
        ref="viewportRef"
        class="map-viewport"
        :aria-label="t('a11y.mapViewport')"
      >
        <div ref="panzoomRef" class="panzoom">
          <img
            ref="mapimgRef"
            :alt="t('a11y.mapRadarAlt')"
            width="1024"
            height="1024"
            draggable="false"
            class="map-img"
          >
        </div>
        <canvas ref="canvasRef" class="overlay-canvas" />
        <MapScaleDisplay
          :scale-hint-text="scaleHintText"
          :out-dist="outDist"
          :out-dist-m="outDistM"
          :mouse-u="mouseU"
          :mouse-v="mouseV"
          :map-origin="mapOriginJson"
          :scale="scale"
        />
      </div>
    </div>
    <aside class="panel rk-panel weapon-panel">
      <SelectRoot v-model="mapId">
        <SelectTrigger class="rk-select-trigger" :aria-label="t('a11y.selectMap')">
          <SelectValue :placeholder="t('weaponRange.mapPlaceholder')">
            <template #default>
              {{ mapId }}
            </template>
          </SelectValue>
        </SelectTrigger>
        <SelectPortal>
          <SelectContent class="rk-select-content" position="popper">
            <SelectViewport>
              <SelectItem
                v-for="m in MAPS"
                :key="m"
                :value="m"
                class="rk-select-item"
              >
                {{ m }}
              </SelectItem>
            </SelectViewport>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
      <p v-if="metaErrKey" class="err">
        {{ t(metaErrKey) }}
      </p>
      <hr class="sep">
      <p v-if="weaponErr" class="err">
        {{ weaponErr }}
      </p>
      <WeaponSelectorPanel
        v-else
        :weapon-groups="weaponGroups"
        :selected-ids="selectedIds"
        @toggle-weapon="toggleWeapon"
        @bulk-toggle="bulkToggle"
      />
      <hr class="sep">
      <div class="weapon-table-wrap">
        <table class="weapon-table">
          <thead>
            <tr>
              <th>{{ t("weaponRange.tableWeapon") }}</th>
              <th>{{ t("weaponRange.thHead") }}</th>
              <th>{{ t("weaponRange.thChest") }}</th>
              <th>{{ t("weaponRange.thAbd") }}</th>
              <th>{{ t("weaponRange.thLeg") }}</th>
              <th>{{ t("weaponRange.thHeadArmor") }}</th>
              <th>{{ t("weaponRange.thChestArmor") }}</th>
              <th>{{ t("weaponRange.thAbdArmor") }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, idx) in tableRows" :key="idx">
              <tr v-if="row.kind === 'msg'">
                <td colspan="8" class="weapon-name-cell">
                  {{ row.text }}
                </td>
              </tr>
              <tr v-else>
                <td class="weapon-name-cell">
                  <button
                    type="button"
                    class="weapon-name-btn"
                    @click="openWeaponDetail(row.name)"
                  >
                    {{ row.cells[0].text }}
                  </button>
                </td>
                <td
                  v-for="(cell, ci) in row.cells.slice(1)"
                  :key="ci"
                  :class="cell.high ? 'weapon-dmg-high' : ''"
                >
                  {{ cell.text }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <p
        class="muted help"
        v-html="t('weaponRange.help', { click: t('weaponRange.clickStrong') })"
      />
      <WeaponDetailModal
        v-model:open="detailOpen"
        :display-name="detailDisplayName"
        :columns="detailColumns"
      />
    </aside>
  </main>
</template>

<style scoped>
.err {
  color: #b91c1c;
  font-size: 0.9rem;
  margin: 0.35rem 0 0;
}

.sep {
  border: none;
  border-top: 1px solid var(--rk-border);
  margin: 0.75rem 0;
}

.field-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

.weapon-panel {
  max-height: calc(100vh - 56px - 2rem);
  overflow-y: auto;
}

.weapon-table-wrap {
  overflow: auto;
  max-width: 100%;
  border: 1px solid var(--rk-border);
  border-radius: 10px;
  background: var(--rk-bg);
  box-shadow: 0 1px 3px var(--rk-shadow);
}

.weapon-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.weapon-table thead th {
  background: var(--rk-surface);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  border-bottom: 2px solid var(--rk-border);
}

.weapon-table tbody tr:nth-child(even) td {
  background: rgba(0, 0, 0, 0.02);
}

.weapon-table th,
.weapon-table td {
  border: 1px solid var(--rk-border);
  padding: 0.45rem 0.55rem;
  text-align: right;
}

.weapon-table th:first-child,
.weapon-table td:first-child {
  text-align: left;
}

.weapon-name-cell {
  font-weight: 500;
  padding: 0.25rem 0.55rem;
}

.weapon-name-btn {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0.2rem 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
}

.weapon-name-btn:hover {
  text-decoration: underline;
}

.weapon-name-btn:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.45);
  outline-offset: 1px;
}

.weapon-dmg-high {
  color: #dc2626;
  font-weight: 600;
}

.help {
  font-size: 0.85rem;
  line-height: 1.45;
}

.map-img {
  display: block;
  width: 1024px;
  height: 1024px;
  max-width: none;
  user-select: none;
}

.overlay-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}


</style>
