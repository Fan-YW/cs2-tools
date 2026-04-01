<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';
import { runFallSimulation } from '@/lib/fallSimulation';

const { t } = useI18n();

type GameEdition = 'cs2' | 'go';
type InitialAction = 'fall' | 'jump';

const gameEdition = ref<GameEdition>('cs2');
const goTickRate = ref(64);
const subTickStep = ref(0);
const initialAction = ref<InitialAction>('fall');

const svGravity = ref(800);
const heightUnit = ref(220);
const chartRef = ref<HTMLElement | null>(null);
const showChart = ref(false);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const heightMeters = computed(() => {
  return (heightUnit.value * 0.0254).toFixed(2);
});

const tickRate = computed(() => (gameEdition.value === 'cs2' ? 64 : goTickRate.value));

const initTick = computed(() => {
  if (gameEdition.value === 'go') return 0;
  return (subTickStep.value / 65536) * 64;
});

/** 与 INIT_TICK 一致：step/1024 tick；秒 = step/65536 */
const subTickSliderCaption = computed(() => {
  const step = subTickStep.value;
  const sec = step / 65536;
  const tickFrac = step / 1024;
  return `${sec.toFixed(6)} s = ${tickFrac.toFixed(4)} tick`;
});

/**
 * 跳跃初速计算：
 * - CS2 或 CSGO 128tick: 302 - SV_GRAVITY/256
 * - CSGO 64tick: 302 - SV_GRAVITY/128
 */

const initVelocity = computed(() => {
  if (initialAction.value === 'fall') return 0;
  if (gameEdition.value === 'cs2' || (gameEdition.value === 'go' && goTickRate.value === 128)) {
    return -(302 - svGravity.value / 256);
  }
  return -(302 - svGravity.value / 128);
});

const simulation = computed(() =>
  runFallSimulation({
    tickRate: tickRate.value,
    initTick: initTick.value,
    initVelocity: initVelocity.value,
    startHeightFloor: heightUnit.value,
    svGravity: svGravity.value
  })
);

const tableRows = computed(() => simulation.value.rows);

/** `height_floor` 最大的一行（同值取最先出现） */
const maxHeightFloorRowIndex = computed(() => {
  const rows = tableRows.value;
  if (!rows.length) return -1;
  let idx = 0;
  let max = rows[0].heightFloor;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].heightFloor > max) {
      max = rows[i].heightFloor;
      idx = i;
    }
  }
  return idx;
});

const lastRow = computed(() => {
  const r = tableRows.value;
  return r.length ? r[r.length - 1] : null;
});

const extendedTableRows = computed(() => {
  const rows = [...tableRows.value];
  if (!rows.length) return [];
  
  // 添加多一个tick的值，按照正常计算逻辑
  const last = rows[rows.length - 1];
  const tickIncrement = last.currTick - (rows.length > 1 ? rows[rows.length - 2].currTick : 0);
  const nextTick = last.currTick + tickIncrement;
  const nextTime = nextTick / tickRate.value;
  
  // 计算新的速度和位移
  const INIT_TIME = initTick.value / tickRate.value;
  const g = svGravity.value;
  const initV = initVelocity.value;
  
  const nextVelocity = (nextTime - INIT_TIME) * g + initV;
  const velocityDisplay = Math.min(nextVelocity, 3500); // 3500是速度上限
  
  // 计算位移
  const dt = (nextTick - last.currTick) / tickRate.value;
  let disp = 0;
  const v0 = last.uncappedVelocity || last.velocityDisplay;
  const v1 = nextVelocity;
  
  if (v0 >= 3500) {
    disp = 3500 * dt;
  } else if (v1 > 3500) {
    const t1 = (3500 - v0) / g;
    if (t1 > 0 && t1 < dt) {
      disp = v0 * t1 + 0.5 * g * t1 * t1 + 3500 * (dt - t1);
    } else {
      disp = v0 * dt + 0.5 * g * dt * dt;
    }
  } else {
    disp = v0 * dt + 0.5 * g * dt * dt;
  }
  
  // 计算新的高度
  const nextHeightStart = last.heightStart - disp;
  const nextHeightFloor = last.heightFloor - disp;
  
  rows.push({
    currTick: nextTick,
    time: nextTime,
    velocityDisplay,
    uncappedVelocity: nextVelocity,
    heightStart: nextHeightStart,
    heightFloor: nextHeightFloor
  });
  
  return rows;
});

const landingDamageDisplay = computed(() => simulation.value.landingDamage.toFixed(3));

const summaryLandingTimeTick = computed(() => {
  const row = lastRow.value;
  if (!row) return t('fallDamage.emptyDash');
  const initT = initTick.value;
  const rate = tickRate.value;
  const initTime = initT / rate;
  const deltaSec = row.time - initTime;
  const deltaTick = row.currTick - initT;
  const tickStr = Number(deltaTick.toFixed(6)).toString();
  return `${deltaSec.toFixed(7)} ${t('fallDamage.seconds')} (${tickStr} ${t('fallDamage.ticks')})`;
});

const summaryLandingSpeedTick = computed(() => {
  const row = lastRow.value;
  if (!row) return t('fallDamage.emptyDash');
  return `${row.velocityDisplay.toFixed(6)} ${t('fallDamage.unitPerSecond')}`;
});

const summaryLastTickHeightFloor = computed(() => {
  const row = lastRow.value;
  if (!row) return t('fallDamage.emptyDash');
  return row.heightFloor.toFixed(6);
});

function formatRowTick(v: number) {
  if (gameEdition.value === 'go') {
    return String(Math.round(v));
  }
  return v.toFixed(6);
}
function formatRowTime(v: number) {
  if (gameEdition.value === 'go') {
    const decimals = goTickRate.value === 128 ? 7 : 6;
    return v.toFixed(decimals);
  }
  return v.toFixed(6);
}
function formatRowVelocity(v: number) {
  return v.toFixed(6);
}
function formatRowHeight(v: number) {
  return v.toFixed(6);
}

/**
 * Chart aligned with tick simulation: each table row → (height_floor, damage at displayed velocity).
 * Not the legacy sqrt(2h/g) ladder.
 */
const chartData = computed(() => {
  const rows = tableRows.value;
  if (!rows.length) return [];
  const pts: [number, number][] = [];
  for (const row of rows) {
    const dmg = Math.max(0, (row.velocityDisplay - 580) / 4.2);
    pts.push([row.heightFloor, dmg]);
  }
  pts.sort((a, b) => a[0] - b[0]);
  return pts;
});

function initChart() {
  if (!chartRef.value) return;

  chart = echarts.init(chartRef.value);

  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartRef.value);
  }

  updateChart();
}

function destroyChart() {
  if (chart) {
    chart.dispose();
    chart = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}

function updateChart() {
  if (!chart) return;

  const data = chartData.value;
  let xMax = 8192;
  if (data.length) {
    xMax = Math.min(8192, Math.max(...data.map((p) => p[0]), 1));
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        axis: 'x',
        snap: false
      },
      formatter: function (params: any) {
        return `${t('fallDamage.chartTooltipHeight')}: ${params[0].value[0].toFixed(2)}\n${t('fallDamage.chartTooltipDamage')}: ${params[0].value[1].toFixed(3)}`;
      }
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'all',
          title: {
            zoom: t('fallDamage.chartZoom'),
            back: t('fallDamage.chartZoomReset')
          }
        },
        restore: {
          title: t('fallDamage.chartRestore')
        },
        saveAsImage: {
          title: t('fallDamage.chartSaveImage')
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        start: 0,
        end: Math.min(100, (xMax / 8192) * 100)
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        start: 0,
        end: 100
      }
    ],
    xAxis: {
      type: 'value',
      name: t('fallDamage.chartAxisHeight'),
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 8192
    },
    yAxis: {
      type: 'value',
      name: t('fallDamage.chartAxisDamage'),
      nameLocation: 'middle',
      nameGap: 40,
      min: 0
    },
    series: [
      {
        data: chartData.value,
        type: 'line',
        symbol: 'none',
        lineStyle: {
          width: 2
        },
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  };

  chart.setOption(option);
}

function toggleChart() {
  if (showChart.value) {
    destroyChart();
    showChart.value = false;
  } else {
    showChart.value = true;
    nextTick(() => {
      initChart();
    });
  }
}

watch(
  () => [svGravity.value, tickRate.value, initTick.value, initVelocity.value, heightUnit.value, gameEdition.value],
  () => {
    if (showChart.value) {
      updateChart();
    }
  }
);

onUnmounted(() => {
  destroyChart();
});
</script>

<template>
  <div class="fall-damage-view">
    <div class="layout-container">
      <div class="left-section">
        <div class="input-group tick-group">
          <label>{{ t('fallDamage.gameEdition') }}</label>
          <div class="tick-toggle">
            <button
              :class="['tick-btn', { active: gameEdition === 'cs2' }]"
              type="button"
              @click="gameEdition = 'cs2'"
            >
              CS2
            </button>
            <button
              :class="['tick-btn', { active: gameEdition === 'go' }]"
              type="button"
              @click="gameEdition = 'go'"
            >
              CS:GO
            </button>
          </div>
        </div>

        <div class="input-group tick-group">
          <label>{{ t('fallDamage.serverTick') }}</label>
          <template v-if="gameEdition === 'cs2'">
            <span class="tick-readonly">{{ t('fallDamage.tickMode64Sub') }}</span>
          </template>
          <div v-else class="tick-toggle">
            <button
              :class="['tick-btn', { active: goTickRate === 64 }]"
              type="button"
              @click="goTickRate = 64"
            >
              64
            </button>
            <button
              :class="['tick-btn', { active: goTickRate === 128 }]"
              type="button"
              @click="goTickRate = 128"
            >
              128
            </button>
          </div>
        </div>

        <div v-if="gameEdition === 'cs2'" class="input-group slider-group">
          <label>{{ t('fallDamage.subTickOffset') }}</label>
          <div class="slider-row">
            <input v-model.number="subTickStep" type="range" min="0" max="1023" step="1" class="subtick-slider" />
            <span class="slider-meta">{{ subTickSliderCaption }}</span>
          </div>
        </div>

        <div class="input-group">
          <label>{{ t('fallDamage.svGravity') }}</label>
          <input type="number" v-model.number="svGravity" min="0" />
        </div>
        <div class="input-group">
          <label>{{ t('fallDamage.heightUnit') }}</label>
          <input type="number" v-model.number="heightUnit" min="0" max="8192" />
          <span class="unit-display">{{ heightMeters }} {{ t('fallDamage.meters') }}</span>
        </div>

        <div class="input-group tick-group">
          <label>{{ t('fallDamage.initialAction') }}</label>
          <div class="tick-toggle">
            <button
              :class="['tick-btn', { active: initialAction === 'fall' }]"
              type="button"
              @click="initialAction = 'fall'"
            >
              {{ t('fallDamage.actionFall') }}
            </button>
            <button
              :class="['tick-btn', { active: initialAction === 'jump' }]"
              type="button"
              @click="initialAction = 'jump'"
            >
              {{ t('fallDamage.actionJump') }}
            </button>
          </div>
        </div>

        <div v-if="initialAction === 'jump'" class="result-group">
          <label>{{ t('fallDamage.initialVelocity') }}</label>
          <span>{{ initVelocity !== undefined && initVelocity !== null ? initVelocity.toFixed(6) : '0.000000' }} {{ t('fallDamage.unitPerSecond') }}</span>
        </div>

        <div class="result-group">
          <label>{{ t('fallDamage.landingTimeTick') }}</label>
          <span>{{ summaryLandingTimeTick }}</span>
        </div>
        <div class="result-group">
          <label>{{ t('fallDamage.landingSpeedTick') }}</label>
          <span>{{ summaryLandingSpeedTick }}</span>
        </div>
        <div class="result-group">
          <label>{{ t('fallDamage.lastTickHeightFloor') }}</label>
          <span>{{ summaryLastTickHeightFloor }}</span>
        </div>
        <div class="result-group">
          <label>{{ t('fallDamage.fallDamage') }}</label>
          <span>{{ landingDamageDisplay }}</span>
        </div>
        <div class="button-group">
          <button type="button" @click="toggleChart" class="chart-button">
            {{ t('fallDamage.showChart') }}
          </button>
        </div>
      </div>
      <div class="right-section">
        <div class="table-wrapper">
          <div class="table-scroll">
            <table class="damage-table">
              <thead>
                <tr>
                  <th>{{ t('fallDamage.colTick') }}</th>
                  <th>{{ t('fallDamage.colTime') }}</th>
                  <th>{{ t('fallDamage.colVelocity') }}</th>
                  <th>{{ t('fallDamage.colHeightStart') }}</th>
                  <th>{{ t('fallDamage.colHeightFloor') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in extendedTableRows"
                  :key="index"
                  :class="{
                    'height-max-row': index === maxHeightFloorRowIndex,
                    'last-row': index === tableRows.length - 1,
                    'extended-row': index === extendedTableRows.length - 1
                  }"
                >
                  <td>{{ formatRowTick(item.currTick) }}</td>
                  <td>{{ formatRowTime(item.time) }}</td>
                  <td>{{ formatRowVelocity(item.velocityDisplay) }}</td>
                  <td>{{ formatRowHeight(item.heightStart) }}</td>
                  <td>{{ formatRowHeight(item.heightFloor) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showChart" class="modal-overlay" @click="toggleChart">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ t('fallDamage.chartTitle') }}</h2>
          <button type="button" @click="toggleChart" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div ref="chartRef" class="chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fall-damage-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.layout-container {
  display: flex;
  gap: 2rem;
}

.left-section {
  flex: 1;
  min-width: 480px;
}

.right-section {
  flex: 2;
  min-width: 800px;
}

.input-group,
.result-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.slider-group {
  align-items: flex-start;
  flex-wrap: wrap;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 200px;
}

.subtick-slider {
  width: 100%;
  max-width: 320px;
}

.slider-meta {
  font-size: 0.85rem;
  color: #666;
}

.tick-readonly {
  font-weight: 500;
  color: #333;
}

label {
  font-weight: 500;
  min-width: 200px;
}

input[type='number'] {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 160px;
}

.unit-display {
  font-weight: 500;
  color: #666;
}

.result-group span {
  font-weight: 500;
  color: #333;
  min-width: 150px;
  flex: 1;
}

.tick-group {
  margin-top: 0;
}

.tick-group:not(:first-child) {
  margin-top: 1rem;
}

.tick-toggle {
  display: flex;
  gap: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.tick-btn {
  padding: 0.5rem 1rem;
  border: none;
  background-color: #f5f5f5;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  min-width: 60px;
}

.tick-btn:hover {
  background-color: #e0e0e0;
}

.tick-btn.active {
  background-color: #4caf50;
  color: white;
}

.button-group {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.chart-button {
  padding: 0.6rem 1.2rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.chart-button:hover {
  background-color: #45a049;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 80vw;
  height: 80vh;
  background-color: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.modal-body {
  flex: 1;
  padding: 1rem;
  overflow: hidden;
}

.chart {
  width: 100%;
  height: 100%;
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
  height: calc(100vh - 180px);
}

.table-scroll {
  flex: 1;
  overflow: auto;
  position: relative;
}

.damage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  min-width: 100%;
  table-layout: fixed;
}

.damage-table th,
.damage-table td {
  word-wrap: break-word;
  white-space: normal;
}

.damage-table thead th {
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
}

.damage-table th,
.damage-table td {
  border: 1px solid var(--rk-border);
  padding: 0.5rem 0.5rem;
  text-align: right;
  white-space: nowrap;
  background: var(--rk-bg);
  font-variant-numeric: tabular-nums;
}

.damage-table tbody tr:nth-child(even) td {
  background: #f8f9fa;
}

.damage-table tbody tr:hover td {
  background: #e3f2fd;
}

.damage-table tbody tr.height-max-row td {
  background: #c8e6c9 !important;
}

.damage-table tbody tr.height-max-row:hover td {
  background: #a5d6a7 !important;
}

.damage-table tbody tr.last-row td {
  background: #ffcccc !important;
  font-weight: bold;
}

.damage-table tbody tr.last-row:hover td {
  background: #ffaaaa !important;
}

.damage-table tbody tr.extended-row td {
  color: #999;
}

h1 {
  margin-bottom: 2rem;
}

h2 {
  margin-bottom: 1rem;
}
</style>
