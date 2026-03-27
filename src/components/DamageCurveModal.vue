<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "reka-ui";
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const props = defineProps<{
  baseDamage: number;
  calcDamage: (d: number) => number | null;
}>();

const open = defineModel<boolean>("open", { default: false });

const canvasRef = ref<HTMLCanvasElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);
const tooltipText = ref("");
const tooltipHidden = ref(true);
const tooltipStyle = ref({ left: "0px", top: "0px" });

type Layout = {
  cssW: number;
  cssH: number;
  pad: { left: number; right: number; top: number; bottom: number };
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  plotW: number;
  plotH: number;
};

let curveLayout: Layout | null = null;
let damageCurvePoint: { d: number; dmg: number; armorApplied: boolean } | null = null;

function drawDamageCurves() {
  const canvas = canvasRef.value;
  if (!canvas || !curveLayout) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { cssW, cssH, pad, xMin, xMax, yMin, yMax } = curveLayout;
  const plotW = cssW - pad.left - pad.right;
  const plotH = cssH - pad.top - pad.bottom;
  curveLayout.plotW = plotW;
  curveLayout.plotH = plotH;

  ctx.clearRect(0, 0, cssW, cssH);

  const xToPx = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const yToPx = (y: number) => pad.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const bd = props.baseDamage;
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;

  const xGridValues = [0, bd, 2 * bd, 3 * bd, 3.5 * bd];
  for (const x of xGridValues) {
    if (x < xMin || x > xMax) continue;
    const px = xToPx(x);
    ctx.beginPath();
    ctx.moveTo(px, pad.top);
    ctx.lineTo(px, pad.top + plotH);
    ctx.stroke();
  }

  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const y = yMin + ((yMax - yMin) * i) / yTicks;
    const py = yToPx(y);
    ctx.beginPath();
    ctx.moveTo(pad.left, py);
    ctx.lineTo(pad.left + plotW, py);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + plotH);
  ctx.lineTo(pad.left + plotW, pad.top + plotH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + plotH);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 1;

  const xTickValues = [0, bd, 2 * bd, 3 * bd, 3.5 * bd];
  for (const x of xTickValues) {
    if (x < xMin || x > xMax) continue;
    const px = xToPx(x);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(px, pad.top + plotH);
    ctx.lineTo(px, pad.top + plotH + 5);
    ctx.stroke();
    ctx.fillText(String(Math.round(x)), px, pad.top + plotH + 18);
  }

  ctx.textAlign = "right";
  for (let i = 0; i <= yTicks; i++) {
    const y = yMin + ((yMax - yMin) * i) / yTicks;
    const py = yToPx(y);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(pad.left, py);
    ctx.lineTo(pad.left - 5, py);
    ctx.stroke();
    ctx.fillText(String(Math.round(y)), pad.left - 8, py + 4);
  }

  locale.value;
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t("damageCurve.axisDistance"), pad.left + plotW / 2, pad.top + plotH + 40);
  ctx.save();
  ctx.translate(22, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(t("damageCurve.axisDamage"), 0, 0);
  ctx.restore();

  const N = 240;
  ctx.lineWidth = 2.2;

  function drawCurve(getY: (x: number) => number, color: string) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = xMin + ((xMax - xMin) * i) / N;
      const y = getY(x);
      const px = xToPx(x);
      const py = yToPx(y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const colNoArmor = "rgba(37, 99, 235, 0.95)";
  const colArmor = "rgba(234, 88, 12, 0.95)";

  drawCurve((d) => props.calcDamage(d) ?? 0, colNoArmor);
  drawCurve((d) => (props.calcDamage(d) ?? 0) * 0.5, colArmor);

  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  ctx.textAlign = "right";
  const legendRight = pad.left + plotW - 10;
  ctx.fillText(t("damageCurve.legendNoArmor"), legendRight - 25, pad.top + 14);
  ctx.fillText(t("damageCurve.legendArmor"), legendRight - 25, pad.top + 32);
  ctx.strokeStyle = colNoArmor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(legendRight - 20, pad.top + 20);
  ctx.lineTo(legendRight, pad.top + 20);
  ctx.stroke();
  ctx.strokeStyle = colArmor;
  ctx.beginPath();
  ctx.moveTo(legendRight - 20, pad.top + 38);
  ctx.lineTo(legendRight, pad.top + 38);
  ctx.stroke();

  if (damageCurvePoint) {
    const px = xToPx(damageCurvePoint.d);
    const py = yToPx(damageCurvePoint.dmg);
    ctx.fillStyle = "rgba(220, 38, 38, 1)";
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getCurveHoverAndPoint(dMouseX: number, dMouseY: number) {
  if (!curveLayout) return null;
  const { pad, xMin, xMax, yMin, yMax, plotW, plotH } = curveLayout;
  if (plotW <= 0 || plotH <= 0) return null;

  const x = xMin + ((dMouseX - pad.left) / plotW) * (xMax - xMin);
  const d = Math.max(0, Math.min(xMax, x));
  const dmgNo = props.calcDamage(d) ?? 0;
  const dmgArmor = dmgNo * 0.5;

  const xToPx = (xx: number) => pad.left + ((xx - xMin) / (xMax - xMin)) * plotW;
  const yToPx = (yy: number) => pad.top + plotH - ((yy - yMin) / (yMax - yMin)) * plotH;

  const pxNo = xToPx(d);
  const pyNo = yToPx(dmgNo);
  const pyArmor = yToPx(dmgArmor);

  const distNo = Math.abs(dMouseY - pyNo);
  const distArmor = Math.abs(dMouseY - pyArmor);

  const hovered = distNo <= distArmor ? "noArmor" : "armor";

  return {
    d,
    dmgNo,
    dmgArmor,
    hovered,
    distNo,
    distArmor,
  };
}

function resizeAndDraw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const cssW = rect.width || 720;
  const cssH = rect.height || 420;
  if (rect.width < 1 || rect.height < 1) {
    window.requestAnimationFrame(resizeAndDraw);
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const bd = props.baseDamage;
  curveLayout = {
    cssW,
    cssH,
    pad: { left: 70, right: 20, top: 30, bottom: 55 },
    xMin: 0,
    xMax: 3.5 * bd,
    yMin: 0,
    yMax: 100,
    plotW: 0,
    plotH: 0,
  };
  drawDamageCurves();
}

watch(open, (v) => {
  if (v) {
    damageCurvePoint = null;
    tooltipHidden.value = true;
    nextTick(() => {
      window.requestAnimationFrame(resizeAndDraw);
    });
  }
});

watch(
  () => props.baseDamage,
  () => {
    if (open.value) resizeAndDraw();
  },
);

watch(locale, () => {
  if (open.value) nextTick(() => resizeAndDraw());
});

function onCanvasMove(e: MouseEvent) {
  if (!open.value || !curveLayout) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const r = getCurveHoverAndPoint(mx, my);
  if (!r) return;

  const thresholdPx = 7;
  const showNo = r.distNo <= thresholdPx;
  const showArmor = r.distArmor <= thresholdPx;

  if (!showNo && !showArmor) {
    tooltipHidden.value = true;
    return;
  }

  const useArmor = showArmor && r.distArmor <= r.distNo;
  const d = r.d;
  const y = useArmor ? r.dmgArmor : r.dmgNo;
  tooltipText.value = `(${d.toFixed(2)}, ${y.toFixed(2)})`;
  tooltipHidden.value = false;
  tooltipStyle.value = { left: `${mx}px`, top: `${my}px` };
}

function onCanvasClick(e: MouseEvent) {
  if (!open.value || !curveLayout || damageCurvePoint) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const r = getCurveHoverAndPoint(mx, my);
  if (!r) return;

  const useArmor = r.distArmor <= r.distNo;
  damageCurvePoint = {
    d: r.d,
    dmg: useArmor ? r.dmgArmor : r.dmgNo,
    armorApplied: useArmor,
  };
  drawDamageCurves();
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <button type="button" class="rk-btn rk-btn-secondary">{{ t("damageCurve.showButton") }}</button>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content" @pointer-down-outside="open = false">
        <DialogTitle class="dialog-title">{{ t("damageCurve.title") }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t("damageCurve.desc") }}
        </DialogDescription>
        <div class="chart-wrap">
          <canvas
            ref="canvasRef"
            class="curve-canvas"
            width="720"
            height="420"
            @mousemove="onCanvasMove"
            @click="onCanvasClick"
          />
          <div
            v-show="!tooltipHidden"
            ref="tooltipRef"
            class="curve-tooltip"
            :style="tooltipStyle"
          >
            {{ tooltipText }}
          </div>
        </div>
        <p class="muted small-gap">{{ t("damageCurve.legendHint") }}</p>
        <DialogClose as-child>
          <button type="button" class="rk-btn">{{ t("damageCurve.close") }}</button>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  width: 100%;
  min-height: 280px;
  flex: 1;
  min-width: 0;
}

.curve-canvas {
  width: 100%;
  height: 42vh;
  max-height: 480px;
  display: block;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
}

.curve-tooltip {
  position: absolute;
  pointer-events: none;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--rk-text);
  background: var(--rk-bg);
  border: 1px solid var(--rk-border);
  border-radius: 6px;
  box-shadow: 0 2px 8px var(--rk-shadow-lg);
  transform: translate(8px, -100%);
}

.muted {
  opacity: 0.75;
  font-size: 0.9rem;
  margin: 0;
}

.small-gap {
  margin-top: 0.5rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(92vw, 820px);
  max-height: 90vh;
  padding: 1.25rem;
  color: var(--rk-text);
  background: var(--rk-bg);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  box-shadow: 0 20px 50px var(--rk-shadow-lg);
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
}
</style>
