<template>
  <div :class="$style.surveyAnalytics" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Analytics Header -->
    <div :class="$style.analyticsHeader">
      <div :class="$style.headerIcon">
        <i class="fas fa-chart-line"></i>
      </div>
      <div :class="$style.headerContent">
        <h2 :class="$style.headerTitle">{{ t('survey.analytics.dashboard') }}</h2>
        <p :class="$style.headerSubtitle">{{ t('survey.analytics.dashboardDescription') }}</p>
      </div>
      <div :class="$style.headerActions">
        <button @click="refreshAnalytics" :class="$style.refreshButton" :disabled="loading">
          <i :class="['fas', 'fa-sync-alt', { [$style.spinning]: loading }]"></i>
          {{ t('common.refresh') }}
        </button>
      </div>
    </div>

    <!-- Date Filter Section -->
    <div :class="$style.filterSection">
      <div :class="$style.dateFilters">
        <div :class="$style.dateGroup">
          <label>{{ t('survey.analytics.startDate') }}</label>
          <input
            type="datetime-local"
            v-model="filters.start"
            :class="$style.dateInput"
            @change="onFiltersChange"
          />
        </div>
        <div :class="$style.dateGroup">
          <label>{{ t('survey.analytics.endDate') }}</label>
          <input
            type="datetime-local"
            v-model="filters.end"
            :class="$style.dateInput"
            @change="onFiltersChange"
          />
        </div>
        <div :class="$style.dateGroup">
          <label>{{ t('survey.analytics.groupBy') }}</label>
          <select v-model="filters.group_by" :class="$style.selectInput" @change="onFiltersChange">
            <option value="day">{{ t('survey.analytics.groupByDay') }}</option>
            <option value="week">{{ t('survey.analytics.groupByWeek') }}</option>
            <option value="month">{{ t('survey.analytics.groupByMonth') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- KPIs Section -->
    <div :class="$style.kpisSection">
      <div :class="$style.kpisGrid">
        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-users" style="color: #4CAF50;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatNumber(kpis.total_responses) }}</div>
            <div :class="$style.kpiLabel">{{ t('survey.analytics.totalResponses') }}</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-user-check" style="color: #2196F3;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatNumber(kpis.unique_respondents) }}</div>
            <div :class="$style.kpiLabel">{{ t('survey.analytics.uniqueRespondents') }}</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-percentage" style="color: #FF9800;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatPercentage(kpis.completion_rate) }}</div>
            <div :class="$style.kpiLabel">{{ t('survey.analytics.completionRate') }}</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-clock" style="color: #9C27B0;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatDuration(kpis.average_completion_time) }}</div>
            <div :class="$style.kpiLabel">{{ t('survey.analytics.avgCompletionTime') }}</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-shield-alt" style="color: #795548;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatNumber(kpis.authenticated_count) }}</div>
            <div :class="$style.kpiLabel">{{ t('survey.analytics.authenticatedResponses') }}</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-user-secret" style="color: #607D8B;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatNumber(kpis.anonymous_count) }}</div>
            <div :class="$style.kpiLabel">{{ t('survey.analytics.anonymousResponses') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div :class="$style.chartsSection">
      <!-- Time Series Chart -->
      <div :class="$style.chartCard">
        <div :class="$style.chartHeader">
          <h3 :class="$style.chartTitle">{{ t('survey.analytics.responsesOverTime') }}</h3>
          <div :class="$style.chartLegend">
            <div :class="$style.legendItem">
              <div :class="$style.legendColor" style="background-color: #4CAF50;"></div>
              <span>{{ t('survey.analytics.responses') }}</span>
            </div>
            <div :class="$style.legendItem">
              <div :class="$style.legendColor" style="background-color: #2196F3;"></div>
              <span>{{ t('survey.analytics.completionRate') }}</span>
            </div>
          </div>
        </div>
        <div :class="$style.chartContainer">
          <TimeSeriesChart
            :data="timeSeriesData"
            :loading="loading"
            @period-click="onPeriodClick"
          />
        </div>
      </div>

      <!-- Segments Charts Row -->
      <div :class="$style.chartsRow">
        <!-- Authentication Segmentation -->
        <div :class="$style.chartCard">
          <div :class="$style.chartHeader">
            <h3 :class="$style.chartTitle">{{ t('survey.analytics.responsesByAuth') }}</h3>
          </div>
          <div :class="$style.chartContainer">
            <DonutChart
              :data="authenticationSegments"
              :colors="['#4CAF50', '#FF5722']"
              :labels="[t('survey.analytics.authenticated'), t('survey.analytics.anonymous')]"
              :loading="loading"
            />
          </div>
        </div>

        <!-- Completion Segmentation -->
        <div :class="$style.chartCard">
          <div :class="$style.chartHeader">
            <h3 :class="$style.chartTitle">{{ t('survey.analytics.responsesByCompletion') }}</h3>
          </div>
          <div :class="$style.chartContainer">
            <DonutChart
              :data="completionSegments"
              :colors="['#4CAF50', '#FFC107']"
              :labels="[t('survey.analytics.completed'), t('survey.analytics.incomplete')]"
              :loading="loading"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Questions Summary Section -->
    <div :class="$style.questionsSection" v-if="questionsSummary.length > 0">
      <div :class="$style.sectionHeader">
        <h3 :class="$style.sectionTitle">{{ t('survey.analytics.questionsOverview') }}</h3>
        <p :class="$style.sectionDescription">{{ t('survey.analytics.questionsOverviewDescription') }}</p>
      </div>

      <div :class="$style.questionsGrid">
        <div
          v-for="(question, index) in questionsSummary"
          :key="question.id || index"
          :class="$style.questionSummaryCard"
          @click="onQuestionClick(question)"
        >
          <div :class="$style.questionSummaryHeader">
            <div :class="$style.questionNumber">Q{{ index + 1 }}</div>
            <div :class="$style.questionType">
              <i :class="getQuestionTypeIcon(question.question_type)"></i>
            </div>
          </div>
          
          <div :class="$style.questionSummaryContent">
            <h4 :class="$style.questionTitle">{{ question.question_text }}</h4>
            <div :class="$style.questionStats">
              <div :class="$style.statItem">
                <span :class="$style.statNumber">{{ formatNumber(question.response_count) }}</span>
                <span :class="$style.statLabel">{{ t('survey.analytics.responses') }}</span>
              </div>
              <div :class="$style.statItem">
                <span :class="$style.statNumber">{{ formatPercentage(question.answer_rate) }}</span>
                <span :class="$style.statLabel">{{ t('survey.analytics.answerRate') }}</span>
              </div>
            </div>
            <div v-if="question.top_response" :class="$style.topResponse">
              <strong>{{ t('survey.analytics.topResponse') }}:</strong>
              <span>{{ question.top_response }}</span>
            </div>
          </div>

          <div :class="$style.questionSummaryActions">
            <button :class="$style.detailsButton">
              <i class="fas fa-chart-bar"></i>
              {{ t('survey.analytics.viewDetails') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights Section -->
    <div :class="$style.insightsSection">
      <div :class="$style.sectionHeader">
        <h3 :class="$style.sectionTitle">{{ t('survey.analytics.insights') }}</h3>
      </div>
      
      <div :class="$style.insightsGrid">
        <div :class="$style.insightCard" v-if="kpis.response_rate_trend">
          <div :class="$style.insightIcon">
            <i :class="getTrendIcon(kpis.response_rate_trend)" :style="`color: ${getTrendColor(kpis.response_rate_trend)}`"></i>
          </div>
          <div :class="$style.insightContent">
            <h4 :class="$style.insightTitle">{{ t('survey.analytics.responseTrend') }}</h4>
            <p :class="$style.insightText">
              {{ getResponseTrendText(kpis.response_rate_trend) }}
            </p>
          </div>
        </div>

        <div :class="$style.insightCard">
          <div :class="$style.insightIcon">
            <i class="fas fa-calendar-alt" style="color: #2196F3;"></i>
          </div>
          <div :class="$style.insightContent">
            <h4 :class="$style.insightTitle">{{ t('survey.analytics.lastResponse') }}</h4>
            <p :class="$style.insightText">
              {{ formatDateTime(kpis.last_response_date) }}
            </p>
          </div>
        </div>

        <div :class="$style.insightCard">
          <div :class="$style.insightIcon">
            <i class="fas fa-globe" style="color: #FF9800;"></i>
          </div>
          <div :class="$style.insightContent">
            <h4 :class="$style.insightTitle">{{ t('survey.analytics.uniqueIPs') }}</h4>
            <p :class="$style.insightText">
              {{ formatNumber(kpis.unique_ips) }} {{ t('survey.analytics.uniqueIPsText') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import TimeSeriesChart from './TimeSeriesChart.vue'
import DonutChart from './DonutChart.vue'
import SingleChoiceAnalytics from './SingleChoiceAnalytics.vue'
import MultipleChoiceAnalytics from './MultipleChoiceAnalytics.vue'
import RatingAnalytics from './RatingAnalytics.vue'
import YesNoAnalytics from './YesNoAnalytics.vue'
import TextAnalytics from './TextAnalytics.vue'

// Props
interface Props {
  analytics: any
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  refresh: []
  questionClick: [question: any]
  periodClick: [period: any]
  filtersChange: [filters: any]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// State
const filters = ref({
  start: '',
  end: '',
  group_by: 'day'
})

// Track if this is the initial mount to prevent initial filter emissions
const isMounted = ref(false)

// Computed analytics data
const kpis = computed(() => props.analytics?.data?.kpis || {
  total_responses: 0,
  unique_respondents: 0,
  completion_rate: 0,
  average_completion_time: 0,
  authenticated_count: 0,
  anonymous_count: 0,
  unique_ips: 0,
  response_rate_trend: 0,
  last_response_date: null
})

const timeSeriesData = computed(() => {
  const timeSeries = props.analytics?.data?.time_series || []
  return timeSeries.map((item: any) => ({
    period: item.period,
    label: item.period_label,
    responses: item.response_count,
    uniqueRespondents: item.unique_respondents,
    completionRate: item.completion_rate
  }))
})

const authenticationSegments = computed(() => {
  const segments = props.analytics?.data?.segments?.by_authentication || []
  return segments.map((segment: any) => ({
    value: segment.count,
    percentage: segment.percentage
  }))
})

const completionSegments = computed(() => {
  const segments = props.analytics?.data?.segments?.by_completion || []
  return segments.map((segment: any) => ({
    value: segment.count,
    percentage: segment.percentage
  }))
})

const questionsSummary = computed(() => props.analytics?.data?.questions_summary || [])

// Methods
const formatNumber = (value: number) => {
  if (!value && value !== 0) return '0'
  return new Intl.NumberFormat().format(value)
}

const formatPercentage = (value: number) => {
  if (!value && value !== 0) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

const formatDuration = (seconds: number) => {
  if (!seconds && seconds !== 0) return '0s'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return t.value('common.never')
  
  const date = new Date(dateString)
  const locale = isRTL.value ? 'ar-SA' : 'en-US'
  
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getQuestionTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    text: 'fas fa-font',
    textarea: 'fas fa-align-left',
    single_choice: 'fas fa-dot-circle',
    multiple_choice: 'fas fa-check-square',
    rating: 'fas fa-star',
    yes_no: 'fas fa-toggle-on'
  }
  return icons[type] || 'fas fa-question'
}

const getTrendIcon = (trend: number) => {
  if (trend > 0.05) return 'fas fa-trending-up'
  if (trend < -0.05) return 'fas fa-trending-down'
  return 'fas fa-minus'
}

const getTrendColor = (trend: number) => {
  if (trend > 0.05) return '#4CAF50'
  if (trend < -0.05) return '#F44336'
  return '#FF9800'
}

const getResponseTrendText = (trend: number) => {
  const percentage = Math.abs(trend * 100).toFixed(1)
  if (trend > 0.05) {
    return `${t.value('survey.analytics.trendUp')} ${percentage}%`
  } else if (trend < -0.05) {
    return `${t.value('survey.analytics.trendDown')} ${percentage}%`
  }
  return t.value('survey.analytics.trendStable')
}

const refreshAnalytics = () => {
  emit('refresh')
}

const onQuestionClick = (question: any) => {
  emit('questionClick', question)
}

const onPeriodClick = (period: any) => {
  emit('periodClick', period)
}

const onFiltersChange = () => {
  // Only emit filter changes after component is properly mounted and data is available
  if (isMounted.value && props.analytics?.data) {
    emit('filtersChange', filters.value)
  }
}

// Set mounted flag after component initialization to prevent initial filter emissions
onMounted(() => {
  isMounted.value = true
})
</script>

<style module>
.surveyAnalytics {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header Styles */
.analyticsHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding: 24px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.headerIcon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand);
  border-radius: 50%;
  color: white;
  font-size: 20px;
}

.headerContent {
  flex: 1;
}

.headerTitle {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
}

.headerSubtitle {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.headerActions {
  display: flex;
  gap: 12px;
}

.refreshButton {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--surface-variant);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--ink);
  cursor: pointer;
  transition: all 0.2s ease;
}

.refreshButton:hover {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}

.refreshButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Filter Section */
.filterSection {
  margin-bottom: 32px;
  padding: 20px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dateFilters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.dateGroup {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dateGroup label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.dateInput,
.selectInput {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink);
  font-size: 14px;
}

.dateInput:focus,
.selectInput:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(161, 125, 35, 0.1);
}

/* KPIs Section */
.kpisSection {
  margin-bottom: 32px;
}

.kpisGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.kpiCard {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpiCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kpiIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(161, 125, 35, 0.1);
  font-size: 18px;
}

.kpiContent {
  flex: 1;
}

.kpiNumber {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 4px;
}

.kpiLabel {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Charts Section */
.chartsSection {
  margin-bottom: 32px;
}

.chartCard {
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.chartHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}

.chartTitle {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
}

.chartLegend {
  display: flex;
  gap: 16px;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.legendColor {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.chartContainer {
  padding: 20px;
  height: 300px;
}

.chartsRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* Questions Section */
.questionsSection {
  margin-bottom: 32px;
}

.sectionHeader {
  margin-bottom: 20px;
}

.sectionTitle {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--ink);
}

.sectionDescription {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.questionsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.questionSummaryCard {
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.questionSummaryCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.questionSummaryHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.questionNumber {
  background: var(--brand);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
}

.questionType {
  color: var(--muted);
  font-size: 16px;
}

.questionTitle {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.4;
}

.questionStats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.statItem {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.statNumber {
  font-size: 18px;
  font-weight: 700;
  color: var(--brand);
}

.statLabel {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.topResponse {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 16px;
  padding: 8px;
  background: var(--surface-variant);
  border-radius: 6px;
}

.questionSummaryActions {
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.detailsButton {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--brand);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.detailsButton:hover {
  color: var(--brand-dark);
}

/* Insights Section */
.insightsSection {
  margin-bottom: 32px;
}

.insightsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.insightCard {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.insightIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(161, 125, 35, 0.1);
  border-radius: 50%;
  font-size: 16px;
  flex-shrink: 0;
}

.insightContent {
  flex: 1;
}

.insightTitle {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.insightText {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}

/* Responsive Design */
@media (max-width: 768px) {
  .surveyAnalytics {
    padding: 16px;
  }

  .analyticsHeader {
    flex-direction: column;
    text-align: center;
  }

  .kpisGrid {
    grid-template-columns: 1fr;
  }

  .chartsRow {
    grid-template-columns: 1fr;
  }

  .questionsGrid {
    grid-template-columns: 1fr;
  }

  .insightsGrid {
    grid-template-columns: 1fr;
  }
}

/* Dark Theme */
.surveyAnalytics[data-theme="dark"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
  --brand-dark: #8b6914;
}

/* RTL Support */
.surveyAnalytics[dir="rtl"] .analyticsHeader {
  flex-direction: row-reverse;
}

.surveyAnalytics[dir="rtl"] .chartHeader {
  flex-direction: row-reverse;
}

.surveyAnalytics[dir="rtl"] .questionSummaryHeader {
  flex-direction: row-reverse;
}
</style>
