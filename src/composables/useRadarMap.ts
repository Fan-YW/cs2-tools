import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { publicUrl } from "@/lib/publicUrl";
import {
  DRAG_THRESHOLD,
  IMAGE,
  MM_PER_UNIT,
  type MapId,
  unitsToMeters,
} from "@/lib/mapConstants";

export type RadarVariant = "c4" | "weapon";

const LONG_PRESS_MS = 260;

type MapOrigin = { pos_x: number; pos_y: number };

type EmbeddedC4 = { scale: number; c4_base_damage: number; pos_x: number; pos_y: number };
type EmbeddedWeapon = { scale: number; pos_x: number; pos_y: number };

export function useRadarMap(
  variant: RadarVariant,
  embedded: Record<MapId, EmbeddedC4 | EmbeddedWeapon>,
) {
  const { t, locale } = useI18n();
  const viewportRef = ref<HTMLElement | null>(null);
  const panzoomRef = ref<HTMLElement | null>(null);
  const mapimgRef = ref<HTMLImageElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const mapId = ref<MapId>("de_dust2");
  const S = ref(512);
  const scale = ref(4.4);
  const baseDamage = ref(700);
  const zoom = ref(1);
  const tx = ref(0);
  const ty = ref(0);
  const mapOriginJson = shallowRef<MapOrigin | null>(null);

  const centerU = ref<number | null>(null);
  const centerV = ref<number | null>(null);
  const mouseU = ref<number | null>(null);
  const mouseV = ref<number | null>(null);
  const fixed = ref(false);
  const fixedU = ref<number | null>(null);
  const fixedV = ref<number | null>(null);

  let leftDown = false;
  let downX = 0;
  let downY = 0;
  let panning = false;
  let startTx = 0;
  let startTy = 0;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let longPressFired = false;
  let defaultCursor = "crosshair";

  const metaErrKey = ref<string | null>(null);
  const hp = ref(100);
  const armor = ref(100);
  const outDist = ref("0.00");
  const outDistM = ref(" (0.00 m)");
  const outBase = ref("—");
  const outDmg = ref("—");
  const outOutcomeText = ref("—");
  const outcomeDead = ref(false);

  function zoomMax(): number {
    return Math.max(1, (IMAGE * scale.value) / S.value);
  }

  function unitsPerScreenPixel(): number {
    return (IMAGE * scale.value) / (S.value * zoom.value);
  }

  const scaleHintText = computed(() => {
    locale.value;
    return t("radar.scaleHint", { n: unitsPerScreenPixel().toFixed(4) });
  });

  function clampPan() {
    const w = S.value * zoom.value;
    const minT = S.value - w;
    tx.value = Math.max(minT, Math.min(0, tx.value));
    ty.value = Math.max(minT, Math.min(0, ty.value));
  }

  function applyPanZoom() {
    const pz = panzoomRef.value;
    if (!pz) return;
    pz.style.width = `${S.value * zoom.value}px`;
    pz.style.height = `${S.value * zoom.value}px`;
    pz.style.transform = `translate(${tx.value}px,${ty.value}px)`;
  }

  function screenToUV(clientX: number, clientY: number) {
    const viewport = viewportRef.value!;
    const r = viewport.getBoundingClientRect();
    const sx = clientX - r.left;
    const sy = clientY - r.top;
    const u = ((sx - tx.value) / (S.value * zoom.value)) * IMAGE;
    const v = ((sy - ty.value) / (S.value * zoom.value)) * IMAGE;
    return { u, v, sx, sy };
  }

  function calcDamage(d: number): number | null {
    if (!Number.isFinite(d)) return null;
    const bd = baseDamage.value;
    if (!Number.isFinite(bd) || bd <= 0) return null;
    if (d > 3.5 * bd) return 0;
    return bd * Math.exp(-(((6 * d) / (7 * bd)) ** 2) / 2);
  }

  function distanceForTargetDamage(T: number | null): number | null {
    const bd = baseDamage.value;
    if (T == null || !(T > 0) || !(bd > 0)) return null;
    if (T > bd) return null;
    const ratio = T / bd;
    const inner = -2 * Math.log(ratio);
    if (inner < 0 || !Number.isFinite(inner)) return null;
    return (7 * bd / 6) * Math.sqrt(inner);
  }

  function applyHpArmorOutcome(damage: number | null, hpInit: number, armorInit: number) {
    if (damage == null || !Number.isFinite(damage) || damage <= 0) {
      return { hp: hpInit, armor: armorInit, hpNeg: false };
    }
    if (armorInit > damage * 0.5) {
      const armorLoss = Math.floor(damage * 0.5);
      const hpLoss = damage * 0.5;
      const hpOut = hpInit - hpLoss;
      const armorOut = armorInit - armorLoss;
      return { hp: hpOut, armor: armorOut, hpNeg: hpOut < 0 };
    }
    const hpLoss = damage - armorInit;
    const hpOut = hpInit - hpLoss;
    return { hp: hpOut, armor: 0, hpNeg: hpOut < 0 };
  }

  function updateOutcomeRow(damage: number | null) {
    const hpInit = hp.value;
    const armorInit = armor.value;
    if (damage == null || !Number.isFinite(damage)) {
      outOutcomeText.value = "—";
      outcomeDead.value = false;
      return;
    }
    const o = applyHpArmorOutcome(damage, hpInit, armorInit);
    if (o.hpNeg) {
      outOutcomeText.value = t("radar.outcomeDead");
      outcomeDead.value = true;
      return;
    }
    outcomeDead.value = false;
    outOutcomeText.value = t("radar.outcomeLive", {
      hp: o.hp.toFixed(2),
      hpCeil: String(Math.ceil(o.hp)),
      armor: String(Math.round(o.armor)),
    });
  }

  /** 当前用于公式与 HUD 的游戏单位距离；无圆心或坐标未就绪时为 0。 */
  function currentDistanceGame(): number {
    if (centerU.value == null) return 0;
    const mu = fixed.value ? fixedU.value : mouseU.value;
    const mv = fixed.value ? fixedV.value : mouseV.value;
    if (mu == null || mv == null) return 0;
    return Math.hypot(mu - centerU.value, mv - centerV.value!) * scale.value;
  }

  const distanceGame = computed(() => currentDistanceGame());

  function updateReadouts() {
    if (variant !== "c4") {
      updateWeaponReadouts();
      return;
    }
    const distVal = currentDistanceGame();
    outDist.value = distVal.toFixed(2);
    outDistM.value = t("radar.distMeters", { m: unitsToMeters(distVal).toFixed(2) });
    if (outBase.value === "—") {
      outDmg.value = "—";
      outOutcomeText.value = "—";
      outcomeDead.value = false;
      return;
    }
    const dmg = calcDamage(distVal);
    outDmg.value = dmg != null ? String(Math.round(dmg * 100) / 100) : "—";
    updateOutcomeRow(dmg);
  }

  function updateWeaponReadouts() {
    const distVal = currentDistanceGame();
    outDist.value = distVal.toFixed(2);
    outDistM.value = t("radar.distMeters", { m: unitsToMeters(distVal).toFixed(2) });
  }

  function drawWorldTicks(ctx: CanvasRenderingContext2D) {
    if (!mapOriginJson.value) return;
    if (!Number.isFinite(scale.value) || scale.value <= 0) return;

    const { pos_x, pos_y } = mapOriginJson.value;
    const worldUnitsPerPx = unitsPerScreenPixel();
    if (!Number.isFinite(worldUnitsPerPx) || worldUnitsPerPx <= 0) return;

    const targetMajorPx = 110;
    const targetMajorWorld = targetMajorPx * worldUnitsPerPx;
    const exp = Math.floor(Math.log10(Math.max(1e-9, targetMajorWorld)));

    const candidates: number[] = [];
    for (let e = exp - 1; e <= exp + 1; e++) {
      const p10 = 10 ** e;
      for (const m of [1, 2, 5]) candidates.push(m * p10);
    }
    candidates.sort(
      (a, b) => Math.abs(a - targetMajorWorld) - Math.abs(b - targetMajorWorld),
    );
    const majorStepWorld = candidates[0];

    const majorLeadingPow = 10 ** Math.floor(Math.log10(majorStepWorld));
    const majorLeadingDigit = Math.round(majorStepWorld / majorLeadingPow);
    const minorStepWorld = majorLeadingDigit === 2 ? majorStepWorld / 4 : majorStepWorld / 5;

    const uLeft = ((0 - tx.value) / (S.value * zoom.value)) * IMAGE;
    const uRight = ((S.value - tx.value) / (S.value * zoom.value)) * IMAGE;
    const vTop = ((0 - ty.value) / (S.value * zoom.value)) * IMAGE;
    const vBottom = ((S.value - ty.value) / (S.value * zoom.value)) * IMAGE;

    const uMin = Math.max(0, Math.min(uLeft, uRight));
    const uMax = Math.min(IMAGE, Math.max(uLeft, uRight));
    const vMin = Math.max(0, Math.min(vTop, vBottom));
    const vMax = Math.min(IMAGE, Math.max(vTop, vBottom));

    const worldXMin = pos_x + uMin * scale.value;
    const worldXMax = pos_x + uMax * scale.value;

    const worldY1 = pos_y - vMin * scale.value;
    const worldY2 = pos_y - vMax * scale.value;
    const worldYMin = Math.min(worldY1, worldY2);
    const worldYMax = Math.max(worldY1, worldY2);

    const majorLen = 9;
    const minorLen = 5;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(230, 230, 230, 0.32)";
    ctx.fillStyle = "rgba(230, 230, 230, 0.75)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    ctx.textAlign = "left";

    function drawXTicks(step: number, len: number, showLabel: boolean) {
      if (!Number.isFinite(step) || step <= 0) return;
      const start = Math.ceil(worldXMin / step) * step;
      for (let wx = start; wx <= worldXMax + step * 0.5; wx += step) {
        const u = (wx - pos_x) / scale.value;
        const x = tx.value + (u / IMAGE) * S.value * zoom.value;
        if (x < -2 || x > S.value + 2) continue;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, len);
        ctx.stroke();

        if (showLabel) {
          ctx.fillText(String(Math.round(wx)), x + 2, 14);
        }
      }
    }

    function drawYTicks(step: number, len: number, showLabel: boolean) {
      if (!Number.isFinite(step) || step <= 0) return;
      const start = Math.ceil(worldYMin / step) * step;
      for (let wy = start; wy <= worldYMax + step * 0.5; wy += step) {
        const v = (pos_y - wy) / scale.value;
        const y = ty.value + (v / IMAGE) * S.value * zoom.value;
        if (y < -2 || y > S.value + 2) continue;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(len, y);
        ctx.stroke();

        if (showLabel) {
          ctx.fillText(String(Math.round(wy)), 6, y - 2);
        }
      }
    }

    drawXTicks(minorStepWorld, minorLen, false);
    drawXTicks(majorStepWorld, majorLen, true);

    drawYTicks(minorStepWorld, minorLen, false);
    drawYTicks(majorStepWorld, majorLen, true);
    ctx.restore();
  }

  function rScreen(rGame: number): number {
    return (rGame / scale.value) * ((S.value * zoom.value) / IMAGE);
  }

  function redraw() {
    const canvas = canvasRef.value;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(S.value * dpr);
    canvas.height = Math.round(S.value * dpr);
    canvas.style.width = `${S.value}px`;
    canvas.style.height = `${S.value}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S.value, S.value);

    drawWorldTicks(ctx);
    if (centerU.value == null) return;

    const cx = tx.value + (centerU.value / IMAGE) * S.value * zoom.value;
    const cy = ty.value + (centerV.value! / IMAGE) * S.value * zoom.value;

    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(120, 200, 255, 0.95)";
    ctx.stroke();

    const mu = fixed.value ? fixedU.value : mouseU.value;
    const mv = fixed.value ? fixedV.value : mouseV.value;

    if (variant === "c4") {
      const hpInit = hp.value;
      const armorInit = armor.value;
      let T: number | null = null;
      if (hpInit >= armorInit) T = hpInit + armorInit;
      else T = hpInit * 2;
      const dGreen = baseDamage.value * 3.5;
      if (T != null && T > 0) {
        const dRedRaw = distanceForTargetDamage(T);
        if (dRedRaw != null && Number.isFinite(dRedRaw) && dRedRaw >= 0) {
          const dRed = Math.min(dRedRaw, dGreen);
          ctx.beginPath();
          ctx.arc(cx, cy, rScreen(dRed), 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255, 70, 70, 0.9)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(cx, cy, rScreen(dGreen), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 210, 100, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (mu != null && mv != null) {
        const rMeas = Math.hypot(mu - centerU.value, mv - centerV.value!) * ((S.value * zoom.value) / IMAGE);
        ctx.beginPath();
        ctx.arc(cx, cy, rMeas, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(120, 200, 255, 0.95)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (mu != null && mv != null) {
      const ex = tx.value + (mu / IMAGE) * S.value * zoom.value;
      const ey = ty.value + (mv / IMAGE) * S.value * zoom.value;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = "rgba(120, 200, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function applyMapMetaC4(j: EmbeddedC4): boolean {
    scale.value = j.scale;
    baseDamage.value = j.c4_base_damage;
    if (!Number.isFinite(baseDamage.value) || !Number.isFinite(scale.value)) {
      metaErrKey.value = "radar.metaMissingC4";
      outBase.value = "—";
      outDmg.value = "—";
      outOutcomeText.value = "—";
      outcomeDead.value = false;
      updateReadouts();
      return false;
    }
    metaErrKey.value = null;
    outBase.value = String(baseDamage.value);
    resetViewAndMeasure();
    return true;
  }

  function applyMapMetaWeapon(j: { scale: number }): boolean {
    scale.value = j.scale;
    if (!Number.isFinite(scale.value)) {
      metaErrKey.value = "radar.metaMissingScale";
      return false;
    }
    metaErrKey.value = null;
    resetViewAndMeasure();
    return true;
  }

  function loadMap(id: MapId) {
    const img = mapimgRef.value;
    if (img) {
      img.src = publicUrl(`map/png/${id}_radar_psd.png`);
    }
    mapOriginJson.value = null;

    const emb = embedded[id];
    if (emb) {
      if (variant === "c4") {
        applyMapMetaC4(emb as EmbeddedC4);
        const e = emb as EmbeddedC4;
        if (Number.isFinite(e.pos_x) && Number.isFinite(e.pos_y)) {
          mapOriginJson.value = { pos_x: e.pos_x, pos_y: e.pos_y };
          metaErrKey.value = null;
        } else {
          mapOriginJson.value = null;
          metaErrKey.value = "radar.metaMissingPosEmbeddedC4";
        }
      } else {
        applyMapMetaWeapon(emb);
        const e = emb as EmbeddedWeapon;
        if (Number.isFinite(e.pos_x) && Number.isFinite(e.pos_y)) {
          mapOriginJson.value = { pos_x: e.pos_x, pos_y: e.pos_y };
          metaErrKey.value = null;
        } else {
          mapOriginJson.value = null;
          metaErrKey.value = "radar.metaMissingPosEmbeddedWeapon";
        }
      }
      nextTick(redraw);
      return;
    }

    fetch(publicUrl(`map/json/${id}.json`))
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((j: Record<string, unknown>) => {
        if (variant === "c4") {
          applyMapMetaC4(j as unknown as EmbeddedC4);
          const pos_x = Number(j.pos_x);
          const pos_y = Number(j.pos_y);
          if (Number.isFinite(pos_x) && Number.isFinite(pos_y)) {
            mapOriginJson.value = { pos_x, pos_y };
            metaErrKey.value = null;
          } else {
            mapOriginJson.value = null;
            metaErrKey.value = "radar.metaMissingPosFetchC4";
          }
        } else {
          applyMapMetaWeapon({ scale: Number(j.scale) });
          const pos_x = Number(j.pos_x);
          const pos_y = Number(j.pos_y);
          if (Number.isFinite(pos_x) && Number.isFinite(pos_y)) {
            mapOriginJson.value = { pos_x, pos_y };
            metaErrKey.value = null;
          } else {
            mapOriginJson.value = null;
            metaErrKey.value = "radar.metaMissingPosFetchWeapon";
          }
        }
        nextTick(redraw);
      })
      .catch(() => {
        metaErrKey.value =
          variant === "c4" ? "radar.metaFetchFailedC4" : "radar.metaFetchFailedWeapon";
        if (variant === "c4") {
          outBase.value = "—";
          outDmg.value = "—";
          outOutcomeText.value = "—";
          outcomeDead.value = false;
          updateReadouts();
        } else {
          updateWeaponReadouts();
        }
        nextTick(redraw);
      });
  }

  function resetViewAndMeasure() {
    zoom.value = 1;
    tx.value = 0;
    ty.value = 0;
    centerU.value = null;
    centerV.value = null;
    mouseU.value = null;
    mouseV.value = null;
    fixedU.value = null;
    fixedV.value = null;
    fixed.value = false;
    if (variant === "c4") {
      updateReadouts();
    } else {
      updateWeaponReadouts();
    }
    clampPan();
    applyPanZoom();
    nextTick(redraw);
  }

  function handleLeftClickUp(clientX: number, clientY: number) {
    const p = screenToUV(clientX, clientY);
    if (centerU.value == null) {
      centerU.value = p.u;
      centerV.value = p.v;
      mouseU.value = p.u;
      mouseV.value = p.v;
      fixed.value = false;
      fixedU.value = null;
      fixedV.value = null;
      updateReadouts();
      redraw();
      return;
    }
    if (!fixed.value) {
      fixed.value = true;
      fixedU.value = p.u;
      fixedV.value = p.v;
      mouseU.value = p.u;
      mouseV.value = p.v;
      updateReadouts();
      redraw();
    }
  }

  function clearMeasure() {
    centerU.value = null;
    centerV.value = null;
    mouseU.value = null;
    mouseV.value = null;
    fixedU.value = null;
    fixedV.value = null;
    fixed.value = false;
    if (variant === "c4") {
      updateReadouts();
    } else {
      updateWeaponReadouts();
    }
    redraw();
  }

  function measureViewport() {
    const viewport = viewportRef.value;
    if (!viewport) return;
    const w = viewport.clientWidth;
    S.value = w || 512;
    clampPan();
    applyPanZoom();
    redraw();
  }

  let ro: ResizeObserver | null = null;

  function onMove(e: MouseEvent) {
    const viewport = viewportRef.value;
    if (!viewport) return;
    if (leftDown) {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (!panning && dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        panning = true;
        viewport.style.cursor = "grab";
      }
      if (panning) {
        tx.value = startTx + (e.clientX - downX);
        ty.value = startTy + (e.clientY - downY);
        clampPan();
        applyPanZoom();
        redraw();
      }
    }
    if (!leftDown && centerU.value != null && !fixed.value) {
      const p = screenToUV(e.clientX, e.clientY);
      mouseU.value = p.u;
      mouseV.value = p.v;
      updateReadouts();
      redraw();
    }
  }

  function onUp(e: MouseEvent) {
    const viewport = viewportRef.value;
    if (!viewport) return;
    if (e.button !== 0) return;
    if (leftDown) {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (!panning && dx * dx + dy * dy <= DRAG_THRESHOLD * DRAG_THRESHOLD) {
        handleLeftClickUp(e.clientX, e.clientY);
      }
      leftDown = false;
      panning = false;
      longPressFired = false;
      if (longPressTimer) window.clearTimeout(longPressTimer);
      longPressTimer = null;
      viewport.style.cursor = defaultCursor;
    }
  }

  function onWheel(e: WheelEvent) {
    const viewport = viewportRef.value;
    if (!viewport) return;
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const zMax = zoomMax();
    const factor = e.deltaY > 0 ? 0.92 : 1.09;
    let newZoom = Math.max(1, Math.min(zMax, zoom.value * factor));
    if (newZoom === zoom.value) return;
    tx.value = cx - (newZoom / zoom.value) * (cx - tx.value);
    ty.value = cy - (newZoom / zoom.value) * (cy - ty.value);
    zoom.value = newZoom;
    clampPan();
    applyPanZoom();
    redraw();
    updateReadouts();
  }

  watch(mapId, (id) => loadMap(id));

  watch([hp, armor], () => {
    if (variant === "c4") {
      updateReadouts();
      redraw();
    }
  });

  watch(locale, () => {
    if (variant === "c4") updateReadouts();
    else updateWeaponReadouts();
  });

  onMounted(() => {
    nextTick(() => {
      const viewport = viewportRef.value;
      if (viewport) {
        defaultCursor = window.getComputedStyle(viewport).cursor || "crosshair";
      }
      ro = new ResizeObserver(() => measureViewport());
      if (viewport) ro.observe(viewport);

      viewport?.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        leftDown = false;
        panning = false;
        longPressFired = false;
        if (longPressTimer) window.clearTimeout(longPressTimer);
        longPressTimer = null;
        if (viewport) viewport.style.cursor = defaultCursor;
        clearMeasure();
      });

      viewport?.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        leftDown = true;
        longPressFired = false;
        if (longPressTimer) window.clearTimeout(longPressTimer);
        longPressTimer = window.setTimeout(() => {
          if (leftDown && viewport) {
            viewport.style.cursor = "grab";
            longPressFired = true;
          }
        }, LONG_PRESS_MS);
        if (viewport) viewport.style.cursor = defaultCursor;
        downX = e.clientX;
        downY = e.clientY;
        panning = false;
        startTx = tx.value;
        startTy = ty.value;
      });

      viewport?.addEventListener("wheel", onWheel, { passive: false });

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);

      loadMap(mapId.value);
      measureViewport();
    });
  });

  onUnmounted(() => {
    ro?.disconnect();
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    if (longPressTimer) window.clearTimeout(longPressTimer);
  });

  return {
    viewportRef,
    panzoomRef,
    mapimgRef,
    canvasRef,
    mapId,
    S,
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
    distanceGame,
    baseDamage,
    redraw,
    measureViewport,
    calcDamage,
    currentDistanceGame,
  };
}
