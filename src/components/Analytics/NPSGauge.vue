<template>
  <div :class="[$style.npsGauge, { [$style.compact]: compact }]" :data-theme="currentTheme">
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
      <!-- Main Score Display -->
      <div :class="$style.scoreSection">
        <div :class="$style.scoreCircle" :style="{ borderColor: scoreColor }">
          <div :class="$style.scoreValue" :style="{ color: scoreColor }">
            {{ Math.round(npsScore) }}
          </div>
          <div :class="$style.scoreLabel">NPS</div>
        </div>
        <div :class="$style.scoreInterpretation">
          <div :class="$style.interpretationText">{{ interpretation }}</div>
          <div :class="$style.scaleInfo">{{ scaleInfo }}</div>
          <div :class="$style.totalResponses">{{ totalResponses }} {{ isRTL ? 'إجمالي الردود' : 'Total Responses' }}</div>
        </div>
      </div>

      <!-- Horizontal Breakdown Bars -->
      <div :class="$style.breakdownBars">
        <div :class="$style.barItem">
          <div :class="$style.barHeader">
            <span :class="$style.barLabel">{{ promoterLabel }}</span>
            <span :class="$style.barValue">{{ promotersCount }} ({{ promotersPct }}%)</span>
          </div>
          <div :class="$style.barTrack">
            <div 
              :class="$style.barFill" 
              :style="{ width: `${promotersPct}%`, backgroundColor: '#4CAF50' }"
            ></div>
          </div>
        </div>

        <div :class="$style.barItem">
          <div :class="$style.barHeader">
            <span :class="$style.barLabel">{{ passiveLabel }}</span>
            <span :class="$style.barValue">{{ passivesCount }} ({{ passivesPct }}%)</span>
          </div>
          <div :class="$style.barTrack">
            <div 
              :class="$style.barFill" 
              :style="{ width: `${passivesPct}%`, backgroundColor: '#FFC107' }"
            ></div>
          </div>
        </div>

        <div :class="$style.barItem">
          <div :class="$style.barHeader">
            <span :class="$style.barLabel">{{ detractorLabel }}</span>
            <span :class="$style.barValue">{{ detractorsCount }} ({{ detractorsPct }}%)</span>
          </div>
          <div :class="$style.barTrack">
            <div 
              :class="$style.barFill" 
              :style="{ width: `${detractorsPct}%`, backgroundColor: '#F44336' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Compact Distribution -->
      <div v-if="distribution && distribution.length > 0" :class="$style.miniDistribution">
        <div :class="$style.distributionTitle">{{ isRTL ? 'توزيع الدرجات' : 'Score Distribution' }}</div>
        <div :class="$style.distributionDots">
          <div
            v-for="item in distribution"
            :key="item.score"
            :class="[$style.distributionDot, { [$style.hasData]: item.count > 0 }]"
            :style="{ 
              backgroundColor: getScoreColor(item.score),
              opacity: item.count > 0 ? 1 : 0.2,
              transform: `scale(${0.5 + (item.count / maxDistributionCount) * 0.5})`
            }"
            :title="`${item.score}: ${item.count} (${((item.pct || item.percentage || 0)).toFixed(1)}%)`"
          >
            <span v-if="item.count > 0" :class="$style.dotCount">{{ item.count }}</span>
            <span :class="$style.dotScore">{{ item.score }}</span>
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
    question_id?: string
    question_text?: string
    scale_min?: number
    scale_max?: number
    detractor_range?: string
    passive_range?: string
    promoter_range?: string
    distribution?: Array<{
      score: number
      count: number
      pct?: number
      percentage?: number
    }>
  } | null
  loading?: boolean
  compact?: boolean
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  compact: false,
  size: 280
})

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

const hasData = computed(() => props.npsData && props.npsData.total_responses > 0)

const npsScore = computed(() => props.npsData?.score || 0)
const promotersCount = computed(() => props.npsData?.promoters_count || 0)
const passivesCount = computed(() => props.npsData?.passives_count || 0)
const detractorsCount = computed(() => props.npsData?.detractors_count || 0)
const promotersPct = computed(() => (props.npsData?.promoters_pct || 0).toFixed(1))
const passivesPct = computed(() => (props.npsData?.passives_pct || 0).toFixed(1))
const detractorsPct = computed(() => (props.npsData?.detractors_pct || 0).toFixed(1))
const totalResponses = computed(() => props.npsData?.total_responses || 0)
const interpretation = computed(() => props.npsData?.interpretation || (isRTL.value ? 'غير متوفر' : 'Not available'))

// Dynamic labels based on scale ranges
const promoterLabel = computed(() => {
  const range = props.npsData?.promoter_range || '9-10'
  return isRTL.value ? `المروجون (${range})` : `Promoters (${range})`
})

const passiveLabel = computed(() => {
  const range = props.npsData?.passive_range || '7-8'
  return isRTL.value ? `المحايدون (${range})` : `Passives (${range})`
})

const detractorLabel = computed(() => {
  const range = props.npsData?.detractor_range || '0-6'
  return isRTL.value ? `المنتقدون (${range})` : `Detractors (${range})`
})

// Scale info
const scaleInfo = computed(() => {
  const min = props.npsData?.scale_min ?? 0
  const max = props.npsData?.scale_max ?? 10
  return isRTL.value ? `المقياس: ${min}-${max}` : `Scale: ${min}-${max}`
})

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

const scoreColor = computed(() => {
  const score = npsScore.value
  if (score >= 50) return '#4CAF50' // Excellent - Green
  if (score >= 30) return '#8BC34A' // Good - Light Green
  if (score >= 10) return '#FFC107' // Fair - Yellow
  if (score >= -10) return '#FF9800' // Poor - Orange
  return '#F44336' // Critical - Red
})

function getScoreColor(score: number): string {
  // Use dynamic ranges if available
  if (props.npsData?.detractor_range && props.npsData?.passive_range && props.npsData?.promoter_range) {
    const detractorMax = parseInt(props.npsData.detractor_range.split('-')[1])
    const passiveMin = parseInt(props.npsData.passive_range.split('-')[0])
    const passiveMax = parseInt(props.npsData.passive_range.split('-')[1])
    const promoterMin = parseInt(props.npsData.promoter_range.split('-')[0])
    
    if (score >= promoterMin) return '#4CAF50' // Promoters
    if (score >= passiveMin && score <= passiveMax) return '#FFC107' // Passives
    if (score <= detractorMax) return '#F44336' // Detractors
  }
  
  // Fallback to default 0-10 scale
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
  padding: 24px;
  min-height: 300px;
}

.npsGauge.compact {
  padding: 16px;
  min-height: auto;
}

.loadingContainer,
.emptyContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
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
  gap: 24px;
  width: 100%;
}

.compact .gaugeContainer {
  gap: 20px;
}

/* Score Section */
.scoreSection {
  display: flex;
  align-items: center;
  gap: 24px;
}

.scoreCircle {
  width: 100px;
  height: 100px;
  border: 8px solid;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.scoreCircle:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.scoreValue {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.scoreLabel {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.scoreInterpretation {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.interpretationText {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.scaleInfo {
  font-size: 12px;
  color: var(--muted);
}

.totalResponses {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

/* Breakdown Bars */
.breakdownBars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.barItem {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.barHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.barLabel {
  font-weight: 600;
  color: var(--ink);
}

.barValue {
  color: var(--muted);
  font-size: 12px;
}

.barTrack {
  height: 24px;
  background: var(--surface-variant);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.barFill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Mini Distribution */
.miniDistribution {
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.distributionTitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.distributionDots {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.distributionDot {
  flex: 1;
  min-width: 36px;
  max-width: 48px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: white;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.distributionDot:hover {
  transform: scale(1.15) translateY(-4px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.distributionDot.hasData {
  cursor: pointer;
}

.dotCount {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.dotScore {
  font-size: 9px;
  opacity: 0.9;
  margin-top: 2px;
}

/* Dark theme */
.npsGauge[data-theme="night"] .scoreCircle {
  background: #1a202c;
}

.npsGauge[data-theme="night"] .barTrack {
  background: #2d3748;
}

/* Responsive */
@media (max-width: 768px) {
  .scoreSection {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .scoreCircle {
    width: 90px;
    height: 90px;
  }

  .scoreValue {
    font-size: 28px;
  }

  .interpretationText {
    font-size: 14px;
  }

  .breakdownBars {
    gap: 10px;
  }

  .barTrack {
    height: 20px;
  }

  .distributionDots {
    gap: 6px;
  }

  .distributionDot {
    min-width: 32px;
    max-width: 40px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .npsGauge {
    padding: 16px;
  }

  .scoreCircle {
    width: 80px;
    height: 80px;
    border-width: 6px;
  }

  .scoreValue {
    font-size: 24px;
  }

  .barHeader {
    font-size: 12px;
  }

  .barValue {
    font-size: 11px;
  }

  .distributionDots {
    gap: 4px;
  }

  .distributionDot {
    min-width: 28px;
    max-width: 36px;
    height: 28px;
  }
}
</style>
