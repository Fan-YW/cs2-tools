<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';

const { t } = useI18n();

const svGravity = ref(800);
const heightUnit = ref(220);
const serverTick = ref(64);
const tableScrollRef = ref<HTMLElement | null>(null);
const chartRef = ref<HTMLElement | null>(null);
const showChart = ref(false);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const heightMeters = computed(() => {
  return (heightUnit.value * 0.0254).toFixed(2);
});

const fallTime = computed(() => {
  if (svGravity.value <= 0 || heightUnit.value <= 0) return '0.0000000';
  const h = heightUnit.value;
  const g = svGravity.value;
  const t = Math.sqrt(2 * h / g);
  return t.toFixed(7);
});

const fallSpeed = computed(() => {
  if (svGravity.value <= 0 || heightUnit.value <= 0) return '0.00';
  const h = heightUnit.value;
  const g = svGravity.value;
  const v = Math.min(Math.sqrt(2 * g * h), 3500);
  return v.toFixed(2);
});

const ticks = computed(() => {
  const time = parseFloat(fallTime.value);
  return Math.floor(time * serverTick.value);
});

const tickSpeed = computed(() => {
  const speed = svGravity.value * (ticks.value / serverTick.value);
  const limitedSpeed = Math.min(speed, 3500);
  return limitedSpeed.toFixed(2);
});

const damage = computed(() => {
  const speed = parseFloat(tickSpeed.value);
  const dmg = (speed - 580) / 4.2;
  return Math.max(0, dmg).toFixed(3);
});

const tableData = computed(() => {
  const data = [];
  const gravity = svGravity.value;
  const tickRate = serverTick.value;

  if (gravity <= 0) return data;

  // 计算最低受伤tick数
  const timeToInjury = 580 / gravity;
  const minTicks = Math.ceil(timeToInjury * tickRate);

  // 第一行：0-最低受伤高度，伤害0
  const firstHeight = (gravity / 2) * Math.pow(minTicks / tickRate, 2);
  data.push({
    heightRange: `0.000 - ${firstHeight.toFixed(3)}`,
    ticks: '',
    time: '',
    speed: '',
    damage: '0.000'
  });

  // 接下来的行，直到高度超过8192
  let currentTicks = minTicks;
  while (true) {
    const currentTime = currentTicks / tickRate;
    const currentHeight = (gravity / 2) * Math.pow(currentTime, 2);
    const nextTicks = currentTicks + 1;
    const nextTime = nextTicks / tickRate;
    const nextHeight = (gravity / 2) * Math.pow(nextTime, 2);

    if (currentHeight > 8192) break;

    const currentSpeed = Math.min(gravity * currentTime, 3500);
    const currentDamage = (currentSpeed - 580) / 4.2;

    data.push({
      heightRange: `${currentHeight.toFixed(3)} - ${nextHeight.toFixed(3)}`,
      ticks: currentTicks.toString(),
      time: currentTime.toFixed(7),
      speed: currentSpeed.toFixed(2),
      damage: Math.max(0, currentDamage).toFixed(3)
    });

    currentTicks = nextTicks;
  }

  return data;
});

// 判断是否应该高亮该行
function shouldHighlightRow(index: number, item: any): boolean {
  // 如果是第一行，且当前ticks小于第二行的ticks，则高亮
  if (index === 0 && tableData.value.length > 1) {
    const secondRowTicks = tableData.value[1].ticks;
    if (secondRowTicks && ticks.value < parseInt(secondRowTicks)) {
      return true;
    }
  }
  // 否则，当ticks与该行的ticks相同时高亮
  return item.ticks === ticks.value.toString();
}

// 生成图表数据
const chartData = computed(() => {
  const data = [];
  const gravity = svGravity.value;
  const tickRate = serverTick.value;

  if (gravity <= 0) return data;

  // 计算最低受伤tick数
  const timeToInjury = 580 / gravity;
  const minTicks = Math.ceil(timeToInjury * tickRate);

  // 从 0 开始，到第一个受伤点之前伤害都是0
  const firstInjuryTime = minTicks / tickRate;
  const firstInjuryHeight = (gravity / 2) * Math.pow(firstInjuryTime, 2);

  // 添加起点 [0, 0]
  data.push([0, 0]);

  let currentTicks = minTicks;
  let prevDamage = 0;

  while (true) {
    const currentTime = currentTicks / tickRate;
    const currentHeight = (gravity / 2) * Math.pow(currentTime, 2);
    const currentSpeed = Math.min(gravity * currentTime, 3500);
    const currentDamage = Math.max(0, (currentSpeed - 580) / 4.2);

    if (currentHeight > 8192) break;

    // 模拟阶梯函数：在当前x减去微小值处生成一个点（使用上一个y值）
    // 这样可以形成水平线，然后垂直上升到当前点
    const epsilon = 0.000001;
    if (currentHeight > epsilon && currentDamage !== prevDamage) {
      data.push([currentHeight - epsilon, prevDamage]);
    }
    data.push([currentHeight, currentDamage]);

    prevDamage = currentDamage;
    currentTicks++;
  }

  // 添加边界点，确保折线延伸到最大x值8192
  const lastPoint = data[data.length - 1];
  if (lastPoint && lastPoint[0] < 8192) {
    data.push([8192, lastPoint[1]]);
  }

  return data;
});

// 初始化图表
function initChart() {
  if (!chartRef.value) return;
  
  chart = echarts.init(chartRef.value);
  
  // 监听容器大小变化
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartRef.value);
  }
  
  updateChart();
}

// 销毁图表
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

// 更新图表
function updateChart() {
  if (!chart) return;
  
  // 计算对应y范围0-100的x范围
  let xMax = 0;
  const gravity = svGravity.value;
  if (gravity > 0) {
    // 计算伤害达到100时的高度
    const targetSpeed = 580 + 100 * 4.2;
    const targetTime = targetSpeed / gravity;
    xMax = (gravity / 2) * Math.pow(targetTime, 2);
  }
  xMax = Math.min(xMax, 8192);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        axis: 'x',
        snap: false
      },
      formatter: function(params: any) {
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
    series: [{
      data: chartData.value,
      type: 'line',
      symbol: 'none',
      lineStyle: {
        width: 2
      },
      itemStyle: {
        color: '#5470c6'
      }
    }]
  };
  
  chart.setOption(option);
}

// 切换图表显示
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

// 监听gravity变化，更新图表
watch(
  () => svGravity.value,
  () => {
    if (showChart.value) {
      updateChart();
    }
  }
);

// 监听serverTick变化，更新图表
watch(
  () => serverTick.value,
  () => {
    if (showChart.value) {
      updateChart();
    }
  }
);

// 监听ticks变化，将对应的行滚动到表格中心
watch(
  () => ticks.value,
  async (newTicks) => {
    await nextTick();
    if (tableScrollRef.value) {
      const highlightRow = tableScrollRef.value.querySelector('.highlight-row');
      if (highlightRow) {
        const scrollContainer = tableScrollRef.value;
        const containerHeight = scrollContainer.clientHeight;
        
        // 使用scrollIntoView方法，更可靠地将元素滚动到视口中心
        highlightRow.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  },
  { immediate: true }
);

// 组件卸载时清理
onUnmounted(() => {
  destroyChart();
});
</script>

<template>
  <div class="fall-damage-view">
    <div class="layout-container">
      <div class="left-section">
        <div class="input-group tick-group">
          <label>{{ t('fallDamage.serverTick') }}</label>
          <div class="tick-toggle">
            <button
              :class="['tick-btn', { active: serverTick === 64 }]"
              @click="serverTick = 64"
            >64</button>
            <button
              :class="['tick-btn', { active: serverTick === 128 }]"
              @click="serverTick = 128"
            >128</button>
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
        <div class="result-group">
          <label>{{ t('fallDamage.landingTime') }}</label>
          <span>{{ fallTime }} {{ t('fallDamage.seconds') }}</span>
        </div>
        <div class="result-group">
          <label>{{ t('fallDamage.landingSpeed') }}</label>
          <span>{{ fallSpeed }} {{ t('fallDamage.unitPerSecond') }}</span>
        </div>
        <div class="result-group">
          <label>{{ t('fallDamage.landingTimeTick') }}</label>
          <span>{{ (ticks / serverTick).toFixed(7) }} {{ t('fallDamage.seconds') }} ({{ ticks }} ticks)</span>
        </div>
        <div class="result-group">
          <label>{{ t('fallDamage.landingSpeedTick') }}</label>
          <span>{{ tickSpeed }} {{ t('fallDamage.unitPerSecond') }}</span>
        </div>
        <div class="result-group">
          <label>{{ t('fallDamage.fallDamage') }}</label>
          <span>{{ damage }}</span>
        </div>
        <div class="button-group">
          <button @click="toggleChart" class="chart-button">
            {{ t('fallDamage.showChart') }}
          </button>
        </div>
      </div>
      <div class="right-section">
        <div class="table-wrapper">
          <div class="table-scroll" ref="tableScrollRef">
            <table class="damage-table">
              <thead>
                <tr>
                  <th style="width: 25%;">{{ t('fallDamage.heightRange') }}</th>
                  <th style="width: 15%;">{{ t('fallDamage.fallTimeTicks') }}</th>
                  <th style="width: 20%;">{{ t('fallDamage.fallTimeSeconds') }}</th>
                  <th style="width: 20%;">{{ t('fallDamage.landingSpeed') }}</th>
                  <th style="width: 20%;">{{ t('fallDamage.fallDamage') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in tableData" :key="index" :class="{ 'highlight-row': shouldHighlightRow(index, item) }">
              <td>{{ item.heightRange }}</td>
              <td>{{ item.ticks }}</td>
              <td>{{ item.time }}</td>
              <td>{{ item.speed }}</td>
              <td>{{ item.damage }}</td>
            </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 模态窗口 -->
    <div v-if="showChart" class="modal-overlay" @click="toggleChart">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ t('fallDamage.chartTitle') }}</h2>
          <button @click="toggleChart" class="close-button">×</button>
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

label {
  font-weight: 500;
  min-width: 200px;
}

input {
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
}

.tick-group {
  margin-top: 0;
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
  background-color: #4CAF50;
  color: white;
}

.button-group {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.chart-button {
  padding: 0.6rem 1.2rem;
  background-color: #4CAF50;
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

/* 模态窗口样式 */
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
  height: calc(100vh - 180px); /* 根据浏览器窗口高度动态调整 */
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
  background: var(--rk-surface);
}

.damage-table th,
.damage-table td {
  border: 1px solid var(--rk-border);
  padding: 0.5rem 0.5rem;
  text-align: right;
  white-space: nowrap;
  background: var(--rk-bg);
}

.damage-table tbody tr:nth-child(even) td {
  background: #f8f9fa;
}

.damage-table tbody tr:hover td {
  background: #e3f2fd;
}

.damage-table tbody tr.highlight-row td {
  background: #fff3cd !important;
}

h1 {
  margin-bottom: 2rem;
}

h2 {
  margin-bottom: 1rem;
}
</style>