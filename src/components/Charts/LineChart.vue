<template>
  <div :class="$style.chartContainer">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { ChartData } from '../../types/dashboard.types'

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  data: ChartData
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const createChart = async () => {
  await nextTick()
  
  if (!chartRef.value) return

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartRef.value.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.data.labels,
      datasets: props.data.datasets.map(dataset => ({
        ...dataset,
        fill: true,
        pointBackgroundColor: dataset.borderColor,
        pointBorderColor: dataset.borderColor,
        pointHoverBackgroundColor: dataset.borderColor,
        pointHoverBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 6
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              family: 'system-ui, -apple-system, sans-serif'
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#997A51',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: 'rgba(153, 122, 81, 0.1)'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(153, 122, 81, 0.1)'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      elements: {
        line: {
          borderWidth: 2
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutCubic'
      }
    }
  })
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })
</script>

<style module>
.chartContainer {
  position: relative;
  width: 100%;
  height: 300px;
  padding: 1rem;
}

.chartContainer canvas {
  max-height: 100%;
}
</style>
