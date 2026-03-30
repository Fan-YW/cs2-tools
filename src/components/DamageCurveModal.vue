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
import * as echarts from "echarts";
import { nextTick, ref, watch, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const props = defineProps<{
  baseDamage: number;
  calcDamage: (d: number) => number | null;
}>();

const open = defineModel<boolean>("open", { default: false });

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const damageCurvePoint = ref<{ d: number; dmg: number; armorApplied: boolean } | null>(null);

function generateChartData() {
  const bd = props.baseDamage;
  const xMax = 3.5 * bd;
  const N = 240;
  const noArmorData: [number, number][] = [];
  const armorData: [number, number][] = [];

  for (let i = 0; i <= N; i++) {
    const x = (xMax * i) / N;
    const dmgNo = props.calcDamage(x) ?? 0;
    const dmgArmor = dmgNo * 0.5;
    noArmorData.push([x, dmgNo]);
    armorData.push([x, dmgArmor]);
  }

  return { noArmorData, armorData, xMax };
}

function initChart() {
  if (!chartRef.value) return;

  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = echarts.init(chartRef.value);
  updateChartOption();

  chartInstance.on("click", (params: any) => {
    if (params.componentType === "series" && !damageCurvePoint.value) {
      const armorApplied = params.seriesName === t("damageCurve.legendArmor");
      damageCurvePoint.value = {
        d: params.value[0],
        dmg: params.value[1],
        armorApplied,
      };
      updateChartOption();
    }
  });

  window.addEventListener("resize", handleResize);
}

function handleResize() {
  chartInstance?.resize();
}

function updateChartOption() {
  if (!chartInstance) return;

  const { noArmorData, armorData, xMax } = generateChartData();
  const bd = props.baseDamage;

  const markPointData: any[] = [];
  if (damageCurvePoint.value) {
    markPointData.push({
      coord: [damageCurvePoint.value.d, damageCurvePoint.value.dmg],
      symbol: "circle",
      symbolSize: 10,
      itemStyle: {
        color: "#dc2626",
        borderColor: "#fff",
        borderWidth: 2,
      },
    });
  }

  const option: echarts.EChartsOption = {
    backgroundColor: "transparent",
    grid: {
      left: 70,
      right: 20,
      top: 30,
      bottom: 55,
    },
    xAxis: {
      type: "value",
      min: 0,
      max: xMax,
      name: t("damageCurve.axisDistance"),
      nameLocation: "middle",
      nameGap: 35,
      nameTextStyle: {
        color: "rgba(0,0,0,0.82)",
        fontSize: 14,
      },
      axisLine: {
        lineStyle: {
          color: "rgba(0,0,0,0.22)",
        },
      },
      axisTick: {
        lineStyle: {
          color: "rgba(0,0,0,0.35)",
        },
      },
      axisLabel: {
        color: "rgba(0,0,0,0.72)",
        fontSize: 11,
        formatter: (value: number) => Math.round(value).toString(),
      },
      splitLine: {
        lineStyle: {
          color: "rgba(0,0,0,0.08)",
        },
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      name: t("damageCurve.axisDamage"),
      nameLocation: "middle",
      nameGap: 45,
      nameTextStyle: {
        color: "rgba(0,0,0,0.82)",
        fontSize: 14,
      },
      axisLine: {
        lineStyle: {
          color: "rgba(0,0,0,0.22)",
        },
      },
      axisTick: {
        lineStyle: {
          color: "rgba(0,0,0,0.35)",
        },
      },
      axisLabel: {
        color: "rgba(0,0,0,0.72)",
        fontSize: 11,
        formatter: (value: number) => Math.round(value).toString(),
      },
      splitLine: {
        lineStyle: {
          color: "rgba(0,0,0,0.08)",
        },
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "var(--rk-bg)",
      borderColor: "var(--rk-border)",
      borderWidth: 1,
      textStyle: {
        color: "var(--rk-text)",
        fontSize: 12,
      },
      formatter: (params: any) => {
        const x = params[0].value[0];
        let result = `(${x.toFixed(2)})<br/>`;
        params.forEach((param: any) => {
          const y = param.value[1];
          result += `${param.marker} ${param.seriesName}: ${y.toFixed(2)}<br/>`;
        });
        return result;
      },
    },
    legend: {
      data: [t("damageCurve.legendNoArmor"), t("damageCurve.legendArmor")],
      right: 10,
      top: 5,
      textStyle: {
        color: "rgba(0,0,0,0.82)",
        fontSize: 13,
      },
    },
    series: [
      {
        name: t("damageCurve.legendNoArmor"),
        type: "line",
        smooth: false,
        symbol: "none",
        lineStyle: {
          color: "rgba(37, 99, 235, 0.95)",
          width: 2.2,
        },
        data: noArmorData,
        markPoint: {
          data: damageCurvePoint.value && !damageCurvePoint.value.armorApplied ? markPointData : [],
          animation: false,
        },
      },
      {
        name: t("damageCurve.legendArmor"),
        type: "line",
        smooth: false,
        symbol: "none",
        lineStyle: {
          color: "rgba(234, 88, 12, 0.95)",
          width: 2.2,
        },
        data: armorData,
        markPoint: {
          data: damageCurvePoint.value && damageCurvePoint.value.armorApplied ? markPointData : [],
          animation: false,
        },
      },
    ],
  };

  chartInstance.setOption(option);
}

watch(open, (v) => {
  if (v) {
    damageCurvePoint.value = null;
    nextTick(() => {
      initChart();
    });
  } else {
    window.removeEventListener("resize", handleResize);
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
  }
});

watch(
  () => props.baseDamage,
  () => {
    if (open.value) {
      updateChartOption();
    }
  },
);

watch(locale, () => {
  if (open.value) {
    nextTick(() => {
      updateChartOption();
    });
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
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
          <div ref="chartRef" class="curve-chart" />
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

.curve-chart {
  width: 100%;
  height: 42vh;
  max-height: 480px;
  background: var(--rk-surface);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
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
