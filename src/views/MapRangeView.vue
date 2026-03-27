<script setup lang="ts">
import DamageCurveModal from "@/components/DamageCurveModal.vue";
import { useRadarMap } from "@/composables/useRadarMap";
import { MAP_META_C4, MAPS } from "@/lib/mapConstants";
import {
  SelectContent,
  SelectItem,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from "reka-ui";
import { computed, ref } from "vue";
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
  hp,
  armor,
  outDist,
  outDistM,
  outBase,
  outDmg,
  outOutcomeText,
  outcomeDead,
  baseDamage,
  calcDamage,
} = useRadarMap("c4", MAP_META_C4);

const hpSlider = computed({
  get: () => [hp.value],
  set: (v: number[] | undefined) => {
    if (v?.length === 1) hp.value = v[0]!;
  },
});

const armorSlider = computed({
  get: () => [armor.value],
  set: (v: number[] | undefined) => {
    if (v?.length === 1) armor.value = v[0]!;
  },
});

const curveOpen = ref(false);
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
        <div class="scale-hint">
          {{ scaleHintText }}
        </div>
        <div class="scale-hint dist-hint">
          {{ outDist + t("radar.gameUnits") + outDistM }}
        </div>
      </div>
    </div>
    <aside class="panel rk-panel">
      <SelectRoot v-model="mapId">
        <SelectTrigger class="rk-select-trigger" :aria-label="t('a11y.selectMap')">
          <!-- 关闭下拉时 SelectItem 可能卸载，SelectValue 无法从 optionsSet 取文案，故用插槽直接显示当前值 -->
          <SelectValue :placeholder="t('mapRange.mapPlaceholder')">
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
      <p><strong>{{ t("mapRange.baseDamage") }}</strong> {{ outBase }}</p>
      <p><strong>{{ t("mapRange.calcDamage") }}</strong> {{ outDmg }}</p>
      <hr class="sep">
      <div class="slider-row">
        <label class="field-label">{{ t("mapRange.initialHp", { n: hp }) }}</label>
        <SliderRoot
          v-model="hpSlider"
          :min="0"
          :max="100"
          :step="1"
          class="rk-slider-root"
        >
          <SliderTrack class="rk-slider-track">
            <SliderRange class="rk-slider-range" />
          </SliderTrack>
          <SliderThumb :index="0" class="rk-slider-thumb" />
        </SliderRoot>
      </div>
      <div class="slider-row">
        <label class="field-label">{{ t("mapRange.initialArmor", { n: armor }) }}</label>
        <SliderRoot
          v-model="armorSlider"
          :min="0"
          :max="100"
          :step="1"
          class="rk-slider-root"
        >
          <SliderTrack class="rk-slider-track">
            <SliderRange class="rk-slider-range" />
          </SliderTrack>
          <SliderThumb :index="0" class="rk-slider-thumb" />
        </SliderRoot>
      </div>
      <p :class="outcomeDead ? 'outcome-dead' : 'outcome-ok'">
        {{ outOutcomeText }}
      </p>
      <hr class="sep">
      <DamageCurveModal
        v-model:open="curveOpen"
        :base-damage="baseDamage"
        :calc-damage="calcDamage"
      />
      <p
        class="muted help"
        v-html="t('mapRange.help', { click: t('mapRange.clickStrong') })"
      />
    </aside>
  </main>
</template>

<style scoped>
.outcome-dead {
  color: #dc2626;
  font-weight: 600;
}

.outcome-ok {
  color: inherit;
}

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

.slider-row {
  margin-bottom: 0.75rem;
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

.scale-hint {
  position: absolute;
  left: 8px;
  bottom: 8px;
  font-size: 12px;
  opacity: 0.85;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.7);
  color: rgba(230, 230, 230, 0.9);
  padding: 2px 4px;
  border-radius: 2px;
}

.dist-hint {
  left: auto;
  right: 8px;
  text-align: right;
}
</style>
