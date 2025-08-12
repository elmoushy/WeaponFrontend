<template>
  <div :class="$style.chartContainer">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
Chart.register(ArcElement, DoughnutController, Tooltip, Legend)

interface Props {
  data: {
    labels: string[]
    datasets: {
      data: number[]
      backgroundColor: string[]
      borderColor?: string[]
      borderWidth?: number
    }[]
  }
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
    type: 'doughnut',
    data: {
      labels: props.data.labels,
      datasets: props.data.datasets.map(dataset => ({
        ...dataset,
        borderWidth: 2,
        hoverOffset: 8
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#997A51',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
              const percentage = Math.round((value / total) * 100)
              return `${label}: ${percentage}%`
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeInOutCubic'
      },
      cutout: '60%'
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.chartContainer canvas {
  max-height: 100%;
}
</style>
