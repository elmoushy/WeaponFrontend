<template>
  <div :class="$style.donutChart" :data-theme="currentTheme">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.analytics.loadingChart') }}</p>
    </div>

    <div v-else-if="!data || data.length === 0 || total === 0" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-chart-pie"></i>
      </div>
      <p :class="$style.emptyText">{{ t('survey.analytics.noData') }}</p>
    </div>

    <div v-else :class="$style.chartContainer">
      <!-- Chart SVG -->
      <svg
        :class="$style.chartSvg"
        :width="size"
        :height="size"
        :viewBox="`0 0 ${size} ${size}`"
      >
        <!-- Donut segments -->
        <g :transform="`translate(${center}, ${center})`">
          <path
            v-for="(segment, index) in segments"
            :key="index"
            :d="segment.path"
            :fill="segment.color"
            :class="$style.donutSegment"
            @mouseover="onSegmentHover(segment, index, $event)"
            @mouseleave="onSegmentLeave"
            @click="onSegmentClick(segment, index)"
          />
        </g>
        
        <!-- Center text -->
        <g :transform="`translate(${center}, ${center})`">
          <text
            :class="$style.centerTotal"
            text-anchor="middle"
            dy="0"
          >
            {{ formatNumber(total) }}
          </text>
          <text
            :class="$style.centerLabel"
            text-anchor="middle"
            dy="20"
          >
            {{ t('survey.analytics.total') }}
          </text>
        </g>
      </svg>

      <!-- Legend -->
      <div :class="$style.legend">
        <div
          v-for="(item, index) in legendItems"
          :key="index"
          :class="[$style.legendItem, { [$style.highlighted]: highlightedIndex === index }]"
          @mouseover="onLegendHover(index)"
          @mouseleave="onLegendLeave"
          @click="onLegendClick(item, index)"
        >
          <div
            :class="$style.legendColor"
            :style="{ backgroundColor: item.color }"
          ></div>
          <div :class="$style.legendContent">
            <div :class="$style.legendLabel">{{ item.label }}</div>
            <div :class="$style.legendStats">
              <span :class="$style.legendValue">{{ formatNumber(item.value) }}</span>
              <span :class="$style.legendPercentage">({{ formatPercentage(item.percentage) }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip -->
      <div
        v-if="tooltip.show"
        :class="$style.tooltip"
        :style="{
          left: tooltip.x + 'px',
          top: tooltip.y + 'px'
        }"
      >
        <div :class="$style.tooltipHeader">
          {{ tooltip.data.label }}
        </div>
        <div :class="$style.tooltipContent">
          <div :class="$style.tooltipItem">
            <span :class="$style.tooltipColor" :style="{ backgroundColor: tooltip.data.color }"></span>
            <span :class="$style.tooltipLabel">{{ t('survey.analytics.count') }}:</span>
            <span :class="$style.tooltipValue">{{ formatNumber(tooltip.data.value) }}</span>
          </div>
          <div :class="$style.tooltipItem">
            <span :class="$style.tooltipColor" :style="{ backgroundColor: tooltip.data.color }"></span>
            <span :class="$style.tooltipLabel">{{ t('survey.analytics.percentage') }}:</span>
            <span :class="$style.tooltipValue">{{ formatPercentage(tooltip.data.percentage) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

// Props
interface Props {
  data: Array<{
    value: number
    percentage?: number
  }>
  colors?: string[]
  labels?: string[]
  loading?: boolean
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  colors: () => ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#795548'],
  labels: () => [],
  loading: false,
  size: 200
})

// Emits
const emit = defineEmits<{
  segmentClick: [data: any, index: number]
  segmentHover: [data: any, index: number]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const t = computed(() => store.t)

// Chart configuration
const innerRadius = computed(() => props.size * 0.3)
const outerRadius = computed(() => props.size * 0.45)
const center = computed(() => props.size / 2)

// State
const highlightedIndex = ref<number | null>(null)
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  data: null as any
})

// Computed data
const total = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  return props.data.reduce((sum, item) => sum + item.value, 0)
})

const segments = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  let currentAngle = 0
  
  return props.data.map((item, index) => {
    const percentage = item.percentage ?? (item.value / total.value)
    const angle = percentage * 2 * Math.PI
    const color = props.colors[index % props.colors.length]
    const label = props.labels[index] || `Segment ${index + 1}`
    
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    // Calculate path for donut segment
    const startX = Math.cos(startAngle - Math.PI / 2) * outerRadius.value
    const startY = Math.sin(startAngle - Math.PI / 2) * outerRadius.value
    const endX = Math.cos(endAngle - Math.PI / 2) * outerRadius.value
    const endY = Math.sin(endAngle - Math.PI / 2) * outerRadius.value
    
    const innerStartX = Math.cos(startAngle - Math.PI / 2) * innerRadius.value
    const innerStartY = Math.sin(startAngle - Math.PI / 2) * innerRadius.value
    const innerEndX = Math.cos(endAngle - Math.PI / 2) * innerRadius.value
    const innerEndY = Math.sin(endAngle - Math.PI / 2) * innerRadius.value
    
    const largeArcFlag = angle > Math.PI ? 1 : 0
    
    const path = [
      `M ${startX} ${startY}`,
      `A ${outerRadius.value} ${outerRadius.value} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L ${innerEndX} ${innerEndY}`,
      `A ${innerRadius.value} ${innerRadius.value} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
      'Z'
    ].join(' ')
    
    currentAngle += angle
    
    return {
      path,
      color,
      label,
      value: item.value,
      percentage,
      angle,
      startAngle,
      endAngle
    }
  })
})

const legendItems = computed(() => {
  return segments.value.map((segment, index) => ({
    label: segment.label,
    value: segment.value,
    percentage: segment.percentage,
    color: segment.color,
    index
  }))
})

// Methods
const formatNumber = (value: number) => {
  if (!value && value !== 0) return '0'
  return new Intl.NumberFormat().format(Math.round(value))
}

const formatPercentage = (value: number) => {
  if (!value && value !== 0) return '0%'
  return `${Math.round(value * 100)}%`
}

const onSegmentHover = async (segment: any, index: number, event: MouseEvent) => {
  highlightedIndex.value = index
  emit('segmentHover', segment, index)
  
  await nextTick()
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const containerRect = (event.target as HTMLElement).closest('.donutChart')?.getBoundingClientRect()
  
  if (containerRect) {
    tooltip.value = {
      show: true,
      x: rect.left - containerRect.left + 10,
      y: rect.top - containerRect.top - 10,
      data: segment
    }
  }
}

const onSegmentLeave = () => {
  highlightedIndex.value = null
  tooltip.value.show = false
}

const onSegmentClick = (segment: any, index: number) => {
  emit('segmentClick', segment, index)
}

const onLegendHover = (index: number) => {
  highlightedIndex.value = index
}

const onLegendLeave = () => {
  highlightedIndex.value = null
}

const onLegendClick = (item: any, index: number) => {
  emit('segmentClick', item, index)
}
</script>

<style module>
.donutChart {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  position: relative;
}

.loadingContainer,
.emptyContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.loadingSpinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top: 3px solid var(--brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loadingText,
.emptyText {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.emptyIcon {
  font-size: 48px;
  color: var(--muted);
  opacity: 0.5;
}

.chartContainer {
  display: flex;
  align-items: center;
  gap: 32px;
  width: 100%;
  height: 100%;
  position: relative;
}

.chartSvg {
  flex-shrink: 0;
}

.donutSegment {
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: center;
}

.donutSegment:hover {
  opacity: 0.8;
  transform: scale(1.02);
}

.centerTotal {
  font-size: 24px;
  font-weight: 700;
  fill: var(--ink);
}

.centerLabel {
  font-size: 12px;
  fill: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 200px;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.legendItem:hover,
.legendItem.highlighted {
  background-color: var(--surface-variant);
  transform: translateX(4px);
}

.legendColor {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legendContent {
  flex: 1;
  min-width: 0;
}

.legendLabel {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legendStats {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legendValue {
  font-size: 14px;
  font-weight: 700;
  color: var(--brand);
}

.legendPercentage {
  font-size: 11px;
  color: var(--muted);
}

.tooltip {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  pointer-events: none;
  min-width: 150px;
}

.tooltipHeader {
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 8px;
  font-size: 13px;
}

.tooltipContent {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltipItem {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.tooltipColor {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.tooltipLabel {
  color: var(--muted);
  flex: 1;
}

.tooltipValue {
  color: var(--ink);
  font-weight: 600;
}

/* Dark theme */
.donutChart[data-theme="dark"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
}

/* Responsive */
@media (max-width: 768px) {
  .chartContainer {
    flex-direction: column;
    gap: 20px;
  }
  
  .legend {
    max-width: none;
    width: 100%;
  }
  
  .legendItem {
    padding: 6px;
  }
  
  .centerTotal {
    font-size: 20px;
  }
  
  .centerLabel {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .donutChart {
    gap: 16px;
  }
  
  .legend {
    gap: 8px;
  }
  
  .legendItem {
    padding: 4px;
  }
  
  .legendLabel {
    font-size: 12px;
  }
  
  .legendValue {
    font-size: 13px;
  }
  
  .legendPercentage {
    font-size: 10px;
  }
}
</style>
