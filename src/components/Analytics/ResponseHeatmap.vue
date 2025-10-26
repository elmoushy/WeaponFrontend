<template>
  <div :class="$style.heatmapWrapper" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Loading State -->
    <div v-if="loading" :class="$style.loadingState">
      <div :class="$style.loadingSpinner"></div>
      <span :class="$style.loadingText">{{ isRTL ? 'جاري تحميل البيانات...' : 'Loading data...' }}</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" :class="$style.emptyState">
      <div :class="$style.emptyIcon">
        <i class="fas fa-chart-area"></i>
      </div>
      <h3 :class="$style.emptyTitle">{{ isRTL ? 'لا توجد بيانات' : 'No Data Available' }}</h3>
      <p :class="$style.emptyDescription">{{ isRTL ? 'لم يتم تسجيل أي ردود حتى الآن' : 'No responses have been recorded yet' }}</p>
    </div>

    <!-- Heatmap Content -->
    <div v-else :class="$style.heatmapContainer">
      <!-- Stats Summary Bar -->
      <div :class="$style.statsBar">
        <div :class="$style.statCard">
          <i class="fas fa-comments"></i>
          <div :class="$style.statContent">
            <span :class="$style.statValue">{{ grandTotal.toLocaleString() }}</span>
            <span :class="$style.statLabel">{{ isRTL ? 'إجمالي الردود' : 'Total Responses' }}</span>
          </div>
        </div>
        <div :class="$style.statCard">
          <i class="fas fa-fire"></i>
          <div :class="$style.statContent">
            <span :class="$style.statValue">{{ peakHour }}</span>
            <span :class="$style.statLabel">{{ isRTL ? 'ذروة النشاط' : 'Peak Hour' }}</span>
          </div>
        </div>
        <div :class="$style.statCard">
          <i class="fas fa-calendar-day"></i>
          <div :class="$style.statContent">
            <span :class="$style.statValue">{{ peakDay }}</span>
            <span :class="$style.statLabel">{{ isRTL ? 'أنشط يوم' : 'Busiest Day' }}</span>
          </div>
        </div>
      </div>

      <!-- Main Heatmap Grid -->
      <div :class="$style.gridContainer">
        <!-- Time Labels (Top) -->
        <div :class="$style.timeLabels">
          <div :class="$style.cornerLabel"></div>
          <div
            v-for="hour in 24"
            :key="`hour-${hour}`"
            :class="$style.timeLabel"
          >
            {{ formatHour(hour - 1) }}
          </div>
        </div>

        <!-- Days + Heatmap Cells -->
        <div :class="$style.gridBody">
          <div
            v-for="(dayRow, dayIndex) in heatmapData.matrix"
            :key="`day-${dayIndex}`"
            :class="$style.dayRow"
          >
            <!-- Day Label -->
            <div :class="$style.dayLabel">
              <span :class="$style.dayName">{{ dayNames[dayIndex] }}</span>
              <span :class="$style.dayTotal">{{ heatmapData.totals_by_day[dayIndex] }}</span>
            </div>

            <!-- Hour Cells -->
            <div :class="$style.cellsRow">
              <div
                v-for="(value, hourIndex) in dayRow"
                :key="`cell-${dayIndex}-${hourIndex}`"
                :class="[$style.cell, { [$style.cellActive]: value > 0 }]"
                :data-intensity="getIntensityLevel(value)"
                @mouseenter="showTooltip($event, dayIndex, hourIndex, value)"
                @mouseleave="hideTooltip"
              >
                <div :class="$style.cellInner" :style="getCellStyle(value)">
                  <span v-if="value > 0 && value >= maxValue * 0.3" :class="$style.cellText">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div :class="$style.legendContainer">
        <div :class="$style.legendContent">
          <span :class="$style.legendTitle">{{ isRTL ? 'كثافة الردود:' : 'Response Intensity:' }}</span>
          <div :class="$style.legendScale">
            <span :class="$style.legendLabel">{{ isRTL ? 'منخفض' : 'Low' }}</span>
            <div :class="$style.legendGradient">
              <div
                v-for="i in 10"
                :key="`grad-${i}`"
                :class="$style.gradientStep"
                :style="{ background: getColorForIntensity((i - 1) / 9) }"
              ></div>
            </div>
            <span :class="$style.legendLabel">{{ isRTL ? 'مرتفع' : 'High' }}</span>
          </div>
          <div :class="$style.legendStats">
            <span :class="$style.legendStat">{{ isRTL ? 'الحد الأدنى:' : 'Min:' }} {{ minValue }}</span>
            <span :class="$style.legendStat">{{ isRTL ? 'الحد الأقصى:' : 'Max:' }} {{ maxValue }}</span>
          </div>
        </div>
      </div>

      <!-- Tooltip -->
      <Transition name="tooltip">
        <div
          v-if="tooltip.visible"
          :class="$style.tooltip"
          :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
          <div :class="$style.tooltipHeader">
            <i class="fas fa-clock"></i>
            <strong>{{ tooltip.day }} at {{ tooltip.hour }}</strong>
          </div>
          <div :class="$style.tooltipBody">
            <span :class="$style.tooltipValue">{{ tooltip.value }}</span>
            <span :class="$style.tooltipLabel">{{ tooltip.value === 1 ? (isRTL ? 'رد' : 'response') : (isRTL ? 'ردود' : 'responses') }}</span>
          </div>
          <div :class="$style.tooltipFooter">
            <span :class="$style.tooltipPercentage">{{ tooltip.percentage }}% {{ isRTL ? 'من الإجمالي' : 'of total' }}</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { HeatmapData } from '../../types/survey.types'

interface Props {
  heatmapData: HeatmapData
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// Tooltip state
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  day: '',
  hour: '',
  value: 0,
  percentage: 0
})

// Day names
const dayNames = computed(() => {
  if (isRTL.value) {
    return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  }
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
})

// Check if data is empty
const isEmpty = computed(() => {
  return props.heatmapData.matrix.every(row => row.every(cell => cell === 0))
})

// Calculate grand total
const grandTotal = computed(() => {
  return props.heatmapData.totals_by_day.reduce((sum, val) => sum + val, 0)
})

// Calculate max value for intensity scaling
const maxValue = computed(() => {
  const flatValues = props.heatmapData.matrix.flat()
  return Math.max(...flatValues, 1) // Ensure minimum of 1 to avoid division by zero
})

// Calculate min value for legend
const minValue = computed(() => {
  const flatValues = props.heatmapData.matrix.flat().filter(v => v > 0)
  return flatValues.length > 0 ? Math.min(...flatValues) : 0
})

// Find peak hour
const peakHour = computed(() => {
  const maxHourValue = Math.max(...props.heatmapData.totals_by_hour)
  const hourIndex = props.heatmapData.totals_by_hour.indexOf(maxHourValue)
  return formatHour(hourIndex)
})

// Find peak day
const peakDay = computed(() => {
  const maxDayValue = Math.max(...props.heatmapData.totals_by_day)
  const dayIndex = props.heatmapData.totals_by_day.indexOf(maxDayValue)
  return dayNames.value[dayIndex]
})

// Format hour for display
const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

// Get color based on intensity (0-1 scale)
const getColorForIntensity = (intensity: number): string => {
  const isDark = currentTheme.value === 'night'
  
  if (isDark) {
    // Dark theme: Deep blues to bright cyan
    const colors = [
      '#0a1628', // Very dark blue
      '#1a2942', // Dark blue
      '#2a3f5f', // Medium dark blue
      '#3a5a7c', // Medium blue
      '#4a7599', // Medium light blue
      '#5a90b6', // Light blue
      '#6aabd3', // Bright blue
      '#7ac6f0', // Cyan blue
      '#8ad1ff', // Light cyan
      '#9adcff'  // Bright cyan
    ]
    const index = Math.min(Math.floor(intensity * 10), 9)
    return colors[index]
  } else {
    // Light theme: Greens (GitHub-style)
    const colors = [
      '#ebedf0', // Very light gray
      '#c6e48b', // Light green
      '#9bd171', // Medium light green
      '#7bc96f', // Medium green
      '#68b35c', // Medium green 2
      '#49af5d', // Medium dark green
      '#3a9b4e', // Dark green
      '#2e7d32', // Darker green
      '#1b5e20', // Very dark green
      '#0d4715'  // Almost black green
    ]
    const index = Math.min(Math.floor(intensity * 10), 9)
    return colors[index]
  }
}

// Get cell background style
const getCellStyle = (value: number) => {
  if (value === 0) {
    return {
      background: currentTheme.value === 'night' ? '#0f1419' : '#f5f7fa',
      border: '1px solid ' + (currentTheme.value === 'night' ? '#1a2332' : '#e1e4e8')
    }
  }
  
  const intensity = value / maxValue.value
  const color = getColorForIntensity(intensity)
  
  return {
    background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -10)} 100%)`,
    border: '1px solid ' + adjustBrightness(color, -15),
    boxShadow: value > maxValue.value * 0.7 ? `0 0 8px ${adjustBrightness(color, 20)}` : 'none'
  }
}

// Get intensity level (0-10) for data attribute
const getIntensityLevel = (value: number): number => {
  if (value === 0) return 0
  return Math.min(Math.ceil((value / maxValue.value) * 10), 10)
}

// Adjust color brightness
const adjustBrightness = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

// Show tooltip
const showTooltip = (event: MouseEvent, dayIndex: number, hourIndex: number, value: number) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const containerRect = target.closest('[class*="heatmapWrapper"]')?.getBoundingClientRect()
  
  if (containerRect) {
    tooltip.x = rect.left - containerRect.left + rect.width / 2
    tooltip.y = rect.top - containerRect.top - 10
  }
  
  tooltip.day = dayNames.value[dayIndex]
  tooltip.hour = formatHour(hourIndex)
  tooltip.value = value
  tooltip.percentage = grandTotal.value > 0 ? parseFloat(((value / grandTotal.value) * 100).toFixed(1)) : 0
  tooltip.visible = true
}

// Hide tooltip
const hideTooltip = () => {
  tooltip.visible = false
}
</script>

<style module>
/* Wrapper */
.heatmapWrapper {
  width: 100%;
  padding: 2rem;
  position: relative;
  background: var(--surface);
  border-radius: 16px;
}

/* Loading State */
.loadingState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  min-height: 400px;
}

.loadingSpinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(161, 125, 35, 0.1);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loadingText {
  font-size: 0.95rem;
  color: var(--muted);
  font-weight: 500;
}

/* Empty State */
.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 400px;
  text-align: center;
}

.emptyIcon {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.1), rgba(161, 125, 35, 0.05));
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.emptyIcon i {
  font-size: 3rem;
  color: var(--brand);
  opacity: 0.6;
}

.emptyTitle {
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
}

.emptyDescription {
  margin: 0;
  font-size: 1rem;
  color: var(--muted);
  max-width: 400px;
}

/* Stats Bar */
.statsBar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.statCard {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, var(--surface-variant) 0%, var(--surface) 100%);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.statCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--brand);
}

.statCard i {
  font-size: 1.75rem;
  color: var(--brand);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.statCard:hover i {
  transform: scale(1.1);
  opacity: 1;
}

.statContent {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.statValue {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--ink);
  line-height: 1;
  letter-spacing: -0.5px;
}

.statLabel {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted);
  font-weight: 600;
}

/* Main Container */
.heatmapContainer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Grid Container */
.gridContainer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  background: var(--surface-variant);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow-x: auto;
}

.heatmapWrapper[data-theme="night"] .gridContainer {
  background: #0f1419;
  border-color: #1a2332;
}

/* Time Labels (Top) */
.timeLabels {
  display: flex;
  gap: 4px;
  margin-bottom: 0.5rem;
}

.cornerLabel {
  width: 120px;
  flex-shrink: 0;
}

.timeLabel {
  width: 32px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--ink);
  opacity: 0.7;
  text-align: center;
}

.heatmapWrapper[data-theme="night"] .timeLabel {
  color: #a0aec0;
}

/* Grid Body */
.gridBody {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Day Row */
.dayRow {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dayLabel {
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  flex-shrink: 0;
  gap: 0.5rem;
}

.dayName {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ink);
}

.dayTotal {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--brand);
  background: rgba(161, 125, 35, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
}

.heatmapWrapper[data-theme="night"] .dayName {
  color: #e0e0e0;
}

/* Cells Row */
.cellsRow {
  display: flex;
  gap: 4px;
  flex: 1;
}

/* Cell */
.cell {
  width: 32px;
  height: 32px;
  position: relative;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.cell:hover {
  transform: scale(1.15);
  z-index: 10;
}

.cellInner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.cellActive .cellInner {
  animation: cellPulse 2s ease-in-out infinite;
}

@keyframes cellPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.cellText {
  font-size: 0.7rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  line-height: 1;
}

/* Legend */
.legendContainer {
  padding: 1.5rem;
  background: var(--surface-variant);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.heatmapWrapper[data-theme="night"] .legendContainer {
  background: #0f1419;
  border-color: #1a2332;
}

.legendContent {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.legendTitle {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legendScale {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.legendLabel {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.legendGradient {
  display: flex;
  gap: 2px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.gradientStep {
  width: 24px;
  height: 24px;
  transition: all 0.2s ease;
}

.gradientStep:hover {
  transform: scaleY(1.3);
}

.legendStats {
  display: flex;
  gap: 2rem;
  font-size: 0.75rem;
  color: var(--muted);
}

.legendStat {
  font-weight: 600;
}

/* Tooltip */
.tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: var(--ink);
  color: white;
  padding: 0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  z-index: 1000;
  min-width: 180px;
  overflow: hidden;
}

.heatmapWrapper[data-theme="night"] .tooltip {
  background: #1a2332;
  border: 1px solid #2d3f5f;
}

.tooltipHeader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, var(--brand) 0%, #9a7335 100%);
  font-size: 0.8rem;
  font-weight: 600;
}

.tooltipHeader i {
  font-size: 0.85rem;
}

.tooltipBody {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  gap: 0.25rem;
}

.tooltipValue {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #FFD700, var(--brand));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.heatmapWrapper[data-theme="night"] .tooltipValue {
  color: #FFD700;
  -webkit-text-fill-color: #FFD700;
}

.tooltipLabel {
  font-size: 0.75rem;
  opacity: 0.8;
}

.tooltipFooter {
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.1);
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.9;
}

.heatmapWrapper[data-theme="night"] .tooltipFooter {
  background: rgba(255, 255, 255, 0.05);
}

/* Tooltip Transition */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.9);
}

/* Scrollbar */
.gridContainer::-webkit-scrollbar {
  height: 10px;
}

.gridContainer::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
}

.gridContainer::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--brand), #9a7335);
  border-radius: 5px;
  transition: background 0.3s ease;
}

.gridContainer::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #9a7335, var(--brand));
}

/* Responsive Design */
@media (max-width: 1024px) {
  .heatmapWrapper {
    padding: 1.5rem;
  }

  .cell {
    width: 28px;
    height: 28px;
  }

  .timeLabel {
    width: 28px;
  }

  .dayLabel {
    width: 100px;
  }
}

@media (max-width: 768px) {
  .heatmapWrapper {
    padding: 1rem;
  }

  .statsBar {
    grid-template-columns: 1fr;
  }

  .cell {
    width: 24px;
    height: 24px;
  }

  .timeLabel {
    width: 24px;
    font-size: 0.6rem;
  }

  .dayLabel {
    width: 80px;
    padding: 0 0.5rem;
  }

  .dayName {
    font-size: 0.7rem;
  }

  .dayTotal {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }

  .cellText {
    font-size: 0.6rem;
  }

  .gridContainer {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .cell {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  .timeLabel {
    width: 20px;
    font-size: 0.55rem;
  }

  .dayLabel {
    width: 70px;
  }

  .dayName {
    font-size: 0.65rem;
  }

  .cellText {
    font-size: 0.55rem;
  }

  .gradientStep {
    width: 20px;
    height: 20px;
  }

  .statValue {
    font-size: 1.5rem;
  }

  .statCard {
    padding: 1rem;
  }
}

/* Dark Theme Enhancements */
.heatmapWrapper[data-theme="night"] {
  background: #1a2332;
}

.heatmapWrapper[data-theme="night"] .statCard {
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  border-color: #2d3f5f;
}

.heatmapWrapper[data-theme="night"] .statValue {
  color: #f7fafc;
}

.heatmapWrapper[data-theme="night"] .emptyTitle {
  color: #f7fafc;
}

/* RTL Support */
.heatmapWrapper[dir="rtl"] .dayLabel {
  flex-direction: row-reverse;
}

.heatmapWrapper[dir="rtl"] .statCard {
  flex-direction: row-reverse;
}

.heatmapWrapper[dir="rtl"] .legendScale {
  flex-direction: row-reverse;
}
</style>
