<template>
  <div :class="$style.npsGauge" :data-theme="currentTheme">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">جاري التحميل...</p>
    </div>

    <div v-else-if="!hasData" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-tachometer-alt"></i>
      </div>
      <p :class="$style.emptyText">لا توجد بيانات NPS</p>
    </div>

    <div v-else :class="$style.gaugeContainer">
      <!-- Gauge Chart -->
      <svg :class="$style.gaugeSvg" :width="size" :height="size * 0.65" :viewBox="`0 0 ${size} ${size * 0.65}`">
        <!-- Background Arc -->
        <path
          :d="backgroundArcPath"
          fill="none"
          :stroke="backgroundColor"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
        />
        
        <!-- Progress Arc -->
        <path
          :d="progressArcPath"
          fill="none"
          :stroke="scoreColor"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          :class="$style.progressArc"
        />
        
        <!-- Center Score -->
        <text
          :x="size / 2"
          :y="size * 0.45"
          :class="$style.scoreText"
          text-anchor="middle"
          :fill="scoreColor"
        >
          {{ Math.round(npsScore) }}
        </text>
        
        <!-- Label -->
        <text
          :x="size / 2"
          :y="size * 0.55"
          :class="$style.labelText"
          text-anchor="middle"
          fill="var(--muted)"
        >
          {{ interpretation }}
        </text>
      </svg>

      <!-- Breakdown -->
      <div :class="$style.breakdown">
        <div :class="$style.breakdownItem" style="--color: #4CAF50">
          <div :class="$style.breakdownHeader">
            <div :class="$style.breakdownDot"></div>
            <span :class="$style.breakdownLabel">المروجون (9-10)</span>
          </div>
          <div :class="$style.breakdownValue">{{ promotersPct }}%</div>
          <div :class="$style.breakdownCount">{{ promotersCount }} من {{ totalResponses }}</div>
        </div>

        <div :class="$style.breakdownItem" style="--color: #FFC107">
          <div :class="$style.breakdownHeader">
            <div :class="$style.breakdownDot"></div>
            <span :class="$style.breakdownLabel">المحايدون (7-8)</span>
          </div>
          <div :class="$style.breakdownValue">{{ passivesPct }}%</div>
          <div :class="$style.breakdownCount">{{ passivesCount }} من {{ totalResponses }}</div>
        </div>

        <div :class="$style.breakdownItem" style="--color: #F44336">
          <div :class="$style.breakdownHeader">
            <div :class="$style.breakdownDot"></div>
            <span :class="$style.breakdownLabel">المنتقدون (0-6)</span>
          </div>
          <div :class="$style.breakdownValue">{{ detractorsPct }}%</div>
          <div :class="$style.breakdownCount">{{ detractorsCount }} من {{ totalResponses }}</div>
        </div>
      </div>

      <!-- Distribution Chart (if available) -->
      <div v-if="distribution && distribution.length > 0" :class="$style.distribution">
        <div :class="$style.distributionTitle">توزيع الدرجات</div>
        <div :class="$style.distributionBars">
          <div
            v-for="item in distribution"
            :key="item.score"
            :class="$style.distributionBar"
            :title="`${item.score}: ${item.count} (${(item.percentage || 0).toFixed(1)}%)`"
          >
            <div
              :class="$style.distributionBarFill"
              :style="{
                height: `${(item.count / maxDistributionCount) * 100}%`,
                backgroundColor: getScoreColor(item.score)
              }"
            >
              <span :class="$style.distributionBarLabel">{{ item.count }}</span>
            </div>
            <span :class="$style.distributionBarScore">{{ item.score }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

interface Props {
  npsData: {
    score: number
    promoters_count: number
    passives_count: number
    detractors_count: number
    promoters_pct: number
    passives_pct: number
    detractors_pct: number
    total_responses: number
    interpretation?: string
    distribution?: Array<{
      score: number
      count: number
      percentage: number
    }>
  } | null
  loading?: boolean
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  size: 280
})

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)

const hasData = computed(() => props.npsData && props.npsData.total_responses > 0)

const npsScore = computed(() => props.npsData?.score || 0)
const promotersCount = computed(() => props.npsData?.promoters_count || 0)
const passivesCount = computed(() => props.npsData?.passives_count || 0)
const detractorsCount = computed(() => props.npsData?.detractors_count || 0)
const promotersPct = computed(() => (props.npsData?.promoters_pct || 0).toFixed(1))
const passivesPct = computed(() => (props.npsData?.passives_pct || 0).toFixed(1))
const detractorsPct = computed(() => (props.npsData?.detractors_pct || 0).toFixed(1))
const totalResponses = computed(() => props.npsData?.total_responses || 0)
const interpretation = computed(() => props.npsData?.interpretation || 'غير متوفر')

const distribution = computed(() => {
  if (!props.npsData?.distribution || !Array.isArray(props.npsData.distribution)) {
    return []
  }
  return props.npsData.distribution
})

const maxDistributionCount = computed(() => {
  if (!distribution.value || distribution.value.length === 0) {
    return 1
  }
  return Math.max(...distribution.value.map(d => d.count || 0), 1)
})

const strokeWidth = computed(() => props.size * 0.15)
const radius = computed(() => (props.size / 2) - (strokeWidth.value / 2))
const backgroundColor = computed(() => '#e2e8f0')

// Convert NPS score (-100 to 100) to angle (0 to 180 degrees)
const scoreAngle = computed(() => {
  const normalized = (npsScore.value + 100) / 200 // Convert to 0-1 range
  return normalized * 180
})

const scoreColor = computed(() => {
  const score = npsScore.value
  if (score >= 50) return '#4CAF50' // Excellent - Green
  if (score >= 30) return '#8BC34A' // Good - Light Green
  if (score >= 10) return '#FFC107' // Fair - Yellow
  if (score >= -10) return '#FF9800' // Poor - Orange
  return '#F44336' // Critical - Red
})

const backgroundArcPath = computed(() => {
  return describeArc(
    props.size / 2,
    props.size * 0.5,
    radius.value,
    180,
    0
  )
})

const progressArcPath = computed(() => {
  return describeArc(
    props.size / 2,
    props.size * 0.5,
    radius.value,
    180,
    180 - scoreAngle.value
  )
})

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  }
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ')
}

function getScoreColor(score: number): string {
  if (score >= 9) return '#4CAF50' // Promoters
  if (score >= 7) return '#FFC107' // Passives
  return '#F44336' // Detractors
}
</script>

<style module>
.npsGauge {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 400px;
}

.loadingContainer,
.emptyContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
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

.gaugeContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.gaugeSvg {
  flex-shrink: 0;
  display: block;
  margin: 0 auto;
}

.progressArc {
  transition: stroke-dashoffset 1s ease-out;
}

.scoreText {
  font-size: 56px;
  font-weight: 700;
  transition: fill 0.3s ease;
  dominant-baseline: middle;
}

.labelText {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  dominant-baseline: middle;
}

.breakdown {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
}

.breakdownItem {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--surface-variant);
  border-radius: 12px;
  border-left: 4px solid var(--color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.breakdownItem:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.breakdownHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.breakdownDot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color);
  flex-shrink: 0;
}

.breakdownLabel {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.breakdownValue {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  margin-top: 4px;
}

.breakdownCount {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.distribution {
  width: 100%;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.distributionTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 16px;
  text-align: center;
}

.distributionBars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  height: 120px;
  padding: 0 4px;
}

.distributionBar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.distributionBarFill {
  width: 100%;
  min-height: 4px;
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  transition: height 0.5s ease-out, background-color 0.3s ease;
  position: relative;
}

.distributionBarFill:hover {
  opacity: 0.9;
}

.distributionBarLabel {
  font-size: 10px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  line-height: 1;
}

.distributionBarScore {
  font-size: 11px;
  color: var(--ink);
  font-weight: 600;
  background: var(--surface-variant);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Dark theme */
.npsGauge[data-theme="dark"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
}

.npsGauge[data-theme="dark"] .breakdownItem {
  background: #1a202c;
}

.npsGauge[data-theme="dark"] .distributionBarScore {
  background: #1a202c;
}

/* Responsive */
@media (max-width: 768px) {
  .npsGauge {
    padding: 16px;
    min-height: 350px;
  }

  .gaugeContainer {
    gap: 24px;
  }

  .breakdown {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .breakdownItem {
    padding: 12px;
  }

  .scoreText {
    font-size: 42px;
  }
  
  .labelText {
    font-size: 12px;
  }

  .breakdownValue {
    font-size: 20px;
  }
  
  .distributionBars {
    height: 100px;
    gap: 4px;
  }

  .distributionBarLabel {
    font-size: 9px;
  }

  .distributionBarScore {
    font-size: 10px;
    padding: 2px 4px;
  }
}

@media (max-width: 480px) {
  .scoreText {
    font-size: 36px;
  }

  .breakdownValue {
    font-size: 18px;
  }

  .distributionBars {
    height: 80px;
    gap: 3px;
  }
}
</style>
