<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
  scaleHintText: string;
  outDist: string;
  outDistM: string;
  mouseU?: number | null;
  mouseV?: number | null;
  mapOrigin?: { pos_x: number; pos_y: number } | null;
  scale?: number;
}

const props = defineProps<Props>();

function calculateWorldCoords(): string {
  const { mouseU, mouseV, mapOrigin, scale } = props;
  
  if (mouseU == null || mouseV == null || !mapOrigin || !scale || !Number.isFinite(scale)) {
    return "(0, 0)";
  }
  
  const worldX = mapOrigin.pos_x + mouseU * scale;
  const worldY = mapOrigin.pos_y - mouseV * scale;
  
  return `(${Math.round(worldX)}, ${Math.round(worldY)})`;
}
</script>

<template>
  <div class="scale-hint">
    {{ scaleHintText }}
  </div>
  <div class="scale-hint dist-hint">
    {{ outDist + t("radar.gameUnits") + outDistM }}
  </div>
  <div class="scale-hint coord-hint">
    {{ calculateWorldCoords() }}
  </div>
</template>

<style scoped>
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

.coord-hint {
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

</style>