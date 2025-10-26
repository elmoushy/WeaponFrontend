<template>
  <div :class="$style.surveyAnalytics" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Analytics Header -->
    <div :class="$style.analyticsHeader">
      <div :class="$style.headerIcon">
        <i class="fas fa-chart-line"></i>
      </div>
      <div :class="$style.headerContent">
        <h2 :class="$style.headerTitle">لوحة التحليلات</h2>
        <p :class="$style.headerSubtitle">نظرة عامة على أداء الاستبيان خلال الفترة المحددة.</p>
      </div>
      <div :class="$style.headerActions">
        <button @click="refreshAnalytics" :class="$style.refreshButton" :disabled="loading">
          <i :class="['fas', 'fa-sync-alt', { [$style.spinning]: loading }]"></i>
          تحديث
        </button>
      </div>
    </div>

    <!-- Date Filter Section -->
    <!-- <div :class="$style.filterSection">
      <div :class="$style.dateFilters">
        <div :class="$style.dateGroup">
          <label>تاريخ البداية</label>
          <input
            type="datetime-local"
            v-model="filters.start"
            :class="$style.dateInput"
            @change="onFiltersChange"
          />
        </div>
        <div :class="$style.dateGroup">
          <label>تاريخ النهاية</label>
          <input
            type="datetime-local"
            v-model="filters.end"
            :class="$style.dateInput"
            @change="onFiltersChange"
          />
        </div>
        <div :class="$style.dateGroup">
          <label>تجميع حسب</label>
          <select v-model="filters.group_by" :class="$style.selectInput" @change="onFiltersChange">
            <option value="day">اليوم</option>
            <option value="week">الأسبوع</option>
            <option value="month">الشهر</option>
          </select>
        </div>
      </div>
    </div> -->

    <!-- KPIs Section - REMOVED in v2 -->
    
    <!-- Charts Section -->
    <div :class="$style.chartsSection">
      <!-- Heatmap Row (NEW in v2) -->
      <div :class="$style.heatmapRow">
        <div :class="[$style.chartCard, $style.fullWidthCard]">
          <div :class="$style.chartHeader">
            <div>
              <h3 :class="$style.chartTitle">{{ isRTL ? 'خريطة الحرارة للردود' : 'Response Heatmap' }}</h3>
              <p :class="$style.chartSubtitle">{{ isRTL ? 'توزيع الردود حسب اليوم والساعة' : 'Response distribution by day and hour' }}</p>
            </div>
          </div>
          <div :class="$style.chartContainer">
            <ResponseHeatmap
              :heatmap-data="heatmapData"
              :loading="loading"
            />
          </div>
        </div>
      </div>

      <!-- NPS & CSAT Row -->
      <div :class="$style.chartsRow" v-if="hasNPSData || hasCSATData">
        <!-- NPS Tracking -->
        <div v-if="hasNPSData" :class="[$style.chartCard, { [$style.fullWidth]: !hasCSATData }]">
          <div :class="$style.chartHeader">
            <div>
              <h3 :class="$style.chartTitle">مؤشر صافي الترويج (NPS)</h3>
              <p :class="$style.chartSubtitle">مقياس ولاء العملاء واحتمالية التوصية</p>
            </div>
          </div>
          <div :class="$style.chartContainer">
            <NPSGauge
              :nps-data="npsData"
              :loading="loading"
              :compact="true"
            />
          </div>
        </div>

        <!-- CSAT Tracking (UPDATED in v2) -->
        <div v-if="hasCSATData" :class="[$style.chartCard, { [$style.fullWidth]: !hasNPSData }]">
          <div :class="$style.chartHeader">
            <div>
              <h3 :class="$style.chartTitle">رضا العملاء (CSAT)</h3>
              <p :class="$style.chartSubtitle">مستوى رضا العملاء عن الخدمات</p>
            </div>
          </div>
          <div :class="$style.chartContainer">
            <CSATTracking
              :csat-data="csatTrackingData"
              :loading="loading"
              :compact="true"
            />
          </div>
        </div>
      </div>

      <!-- Segments Charts Row - REMOVED in v2 -->
    </div>

    <!-- Questions Summary Section -->
    <div :class="$style.questionsSection" v-if="questionsSummary.length > 0">
      <div :class="$style.sectionHeader">
        <h3 :class="$style.sectionTitle">ملخص الأسئلة</h3>
        <p :class="$style.sectionDescription">أداء كل سؤال ونسبة الإجابات عليه.</p>
      </div>

      <div :class="$style.questionsGrid">
        <div
          v-for="(question, index) in questionsSummary"
          :key="question.id || index"
          :class="$style.questionSummaryCard"
        >
          <div :class="$style.questionSummaryHeader">
            <div :class="$style.questionNumber">Q{{ index + 1 }}</div>
            <div :class="$style.questionType">
              <i :class="getQuestionTypeIcon(question.type)"></i>
            </div>
          </div>
          
          <div :class="$style.questionSummaryContent">
            <h4 :class="$style.questionTitle">{{ question.question_text }}</h4>
            <div :class="$style.questionMeta">
              <span :class="$style.questionRequired" v-if="question.is_required">
                <i class="fas fa-asterisk"></i>
                مطلوب
              </span>
              <span :class="$style.questionOptional" v-else>
                <i class="fas fa-circle"></i>
                اختياري
              </span>
            </div>
            <div :class="$style.questionStats">
              <div :class="$style.statItem">
                <span :class="$style.statNumber">{{ formatNumber(question.response_count) }}</span>
                <span :class="$style.statLabel">الردود</span>
              </div>
              <div :class="$style.statItem">
                <span :class="$style.statNumber">{{ formatPercentage(question.answer_rate) }}</span>
                <span :class="$style.statLabel">معدل الإجابة</span>
              </div>
              <div :class="$style.statItem" v-if="question.skipped_count > 0">
                <span :class="$style.statNumber">{{ formatNumber(question.skipped_count) }}</span>
                <span :class="$style.statLabel">تم التخطي</span>
              </div>
            </div>
            <div v-if="question.top_response && question.type !== 'text' && question.type !== 'textarea'" :class="$style.topResponse">
              <strong>أكثر إجابة شيوعًا:</strong>
              <span>{{ question.top_response }}</span>
            </div>
            <br v-else-if="question.type === 'text' || question.type === 'textarea'" />
          </div>

          <div :class="$style.questionSummaryActions">
            <button :class="$style.detailsButton" @click.stop="onQuestionDetailsClick(question)">
              <i class="fas fa-chart-bar"></i>
              عرض التفاصيل
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights Section - REMOVED in v2 -->

    <!-- Question Details Modal -->
    <QuestionDetailsModal
      :is-visible="showQuestionDetails"
      :question="selectedQuestion"
      :details="questionDetails"
      :loading="questionDetailsLoading"
      @close="closeQuestionDetails"
      @retry="retryQuestionDetails"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import ResponseHeatmap from './ResponseHeatmap.vue'
import NPSGauge from './NPSGauge.vue'
import CSATTracking from './CSATTracking.vue'
import QuestionDetailsModal from './QuestionDetailsModal'
import type { HeatmapData, NPSData, CSATTrackingPoint } from '../../types/survey.types'

// Props
interface Props { analytics?: any; loading?: boolean }
const props = withDefaults(defineProps<Props>(), { loading: false })

// Emits
const emit = defineEmits<{
  refresh: []
  questionDetailsClick: [data: { question: any, details: any }]
  periodClick: [period: any]
  filtersChange: [filters: any]
}>()

// Store (نستخدمه للثيم والاتجاه فقط)
const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// State
const surveyDetails = ref<any>(null)

// Question details modal state
const showQuestionDetails = ref(false)
const selectedQuestion = ref<any>(null)
const questionDetails = ref<any>(null)
const questionDetailsLoading = ref(false)

// Watch for analytics data changes to fetch survey details
watch(() => props.analytics?.data?.survey?.id, async (surveyId) => {
  if (surveyId && !surveyDetails.value) {
    try {
      const response = await surveyService.getSurvey(surveyId)
      if (response.status === 'success') {
        surveyDetails.value = response.data
      }
    } catch (error) {
      console.error('Error fetching survey details:', error)
    }
  }
}, { immediate: true })

// Computed analytics data (v2 API structure)
const heatmapData = computed<HeatmapData>(() => props.analytics?.data?.heatmap || {
  matrix: Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0)),
  totals_by_day: Array.from({ length: 7 }, () => 0),
  totals_by_hour: Array.from({ length: 24 }, () => 0)
})

const npsData = computed<NPSData | null>(() => props.analytics?.data?.nps || null)

const csatTrackingData = computed<CSATTrackingPoint[]>(() => props.analytics?.data?.csat_tracking || [])

const hasNPSData = computed(() => {
  return npsData.value && npsData.value.total_responses > 0
})

const hasCSATData = computed(() => {
  return csatTrackingData.value && csatTrackingData.value.length > 0
})

const questionsSummary = computed(() => {
  const rawSummary = props.analytics?.data?.questions_summary || []
  return rawSummary.map((question: any) => ({
    id: question.question_id,
    question_text: getQuestionText(question),
    type: question.type,
    response_count: question.answer_count,
    answer_rate: calculateAnswerRate(question),
    top_response: getTopResponse(question),
    order: question.order,
    is_required: question.is_required,
    skipped_count: question.skipped_count
  }))
})

// Helper functions for question summary processing
const getQuestionText = (question: any) => {
  if (surveyDetails.value?.questions) {
    const questionDetail = surveyDetails.value.questions.find((q: any) => q.id === question.question_id)
    if (questionDetail) {
      return questionDetail.question_text || questionDetail.text || `السؤال ${question.order}`
    }
  }
  return `السؤال ${question.order}`
}

const calculateAnswerRate = (question: any) => {
  const totalResponses = question.answer_count + question.skipped_count
  if (totalResponses === 0) return 0
  return question.answer_count / totalResponses
}

const getTopResponse = (question: any) => {
  const distributions = question.distributions
  
  if (!distributions) return null
  
  // Handle different question types
  switch (question.type) {
    case 'yes_no':
      if (distributions.yes_no) {
        const topChoice = distributions.yes_no.reduce((prev: any, current: any) => 
          prev.count > current.count ? prev : current
        )
        return topChoice.value === 'yes' ? 'نعم' : 'لا'
      }
      break
      
    case 'rating':
      if (distributions.rating) {
        return `متوسط التقييم: ${distributions.rating.avg.toFixed(1)}`
      }
      break
      
    case 'multiple_choice':
    case 'single_choice':
      if (distributions.options) {
        const topOption = distributions.options.reduce((prev: any, current: any) => 
          prev.count > current.count ? prev : current
        )
        return topOption.count > 0 ? topOption.label : 'لا توجد إجابات'
      }
      break
      
    case 'text':
    case 'textarea':
      if (distributions.textual) {
        const avgWords = distributions.textual.avg_words
        return avgWords > 0 ? `متوسط الكلمات: ${avgWords.toFixed(1)}` : 'لا توجد إجابات نصية'
      }
      break
      
    default:
      return null
  }
  
  return null
}

// Helpers
const formatNumber = (value: number) => {
  if (!value && value !== 0) return '0'
  return new Intl.NumberFormat().format(value)
}

const formatPercentage = (value: number) => {
  if (!value && value !== 0) return '0%'
  return `${(value * 100).toFixed(1)}%`
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

const refreshAnalytics = () => emit('refresh')

const onQuestionDetailsClick = async (question: any) => {
  console.log('🔵 Question Details Click:', question)
  try {
    selectedQuestion.value = question
    showQuestionDetails.value = true
    questionDetailsLoading.value = true
    questionDetails.value = null
    
    const surveyId = props.analytics?.data?.survey?.id
    const questionId = question.id
    
    console.log('🔵 Survey ID:', surveyId, 'Question ID:', questionId)
    
    if (!surveyId || !questionId) {
      console.error('❌ Missing survey ID or question ID', { surveyId, questionId })
      questionDetailsLoading.value = false
      return
    }
    
    console.log('🔵 Calling API: getQuestionAnalytics')
    const response = await surveyService.getQuestionAnalytics(surveyId, questionId)
    console.log('✅ API Response:', response)
    
    if (response.status === 'success') {
      questionDetails.value = response.data
      emit('questionDetailsClick', {
        question: question,
        details: response.data
      })
    } else {
      console.error('❌ API returned non-success status:', response)
    }
  } catch (error) {
    console.error('❌ Error fetching question details:', error)
    // Keep the modal open to show error state
  } finally {
    questionDetailsLoading.value = false
  }
}

const closeQuestionDetails = () => {
  console.log('🔵 Closing question details modal')
  showQuestionDetails.value = false
  selectedQuestion.value = null
  questionDetails.value = null
}

const retryQuestionDetails = () => {
  console.log('🔵 Retry question details clicked')
  if (selectedQuestion.value) {
    console.log('🔵 Retrying with question:', selectedQuestion.value)
    onQuestionDetailsClick(selectedQuestion.value)
  } else {
    console.error('❌ No selected question to retry')
  }
}

// const onPeriodClick = (period: any) => emit('periodClick', period)

// const onFiltersChange = () => {
//   if (isMounted.value && props.analytics?.data) emit('filtersChange', filters.value)
// }

// Debug watchers
watch(() => questionsSummary.value, (newVal) => {
  console.log('🔵 questionsSummary updated:', newVal)
  if (newVal && newVal.length > 0) {
    console.log('🔵 First question:', newVal[0])
  }
}, { immediate: true })

watch(() => props.analytics, (newVal) => {
  console.log('🔵 Analytics prop updated:', newVal)
  if (newVal?.data?.survey?.id) {
    console.log('🔵 Survey ID from analytics:', newVal.data.survey.id)
  }
}, { immediate: true })
</script>


<style module>
.surveyAnalytics {
  padding: 24px;
  max-width: auto;
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
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

.chartSubtitle {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: var(--muted);
}

.chartLegend {
  display: flex;
  gap: 16px;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.legendColor {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.chartContainer {
  padding: 0px;
  /* height: 300px; */

  font-size: 10px;
}

.heatmapRow {
  margin-bottom: 24px;
}

.fullWidthCard {
  width: 100%;
}

.chartsRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chartCard.fullWidth {
  grid-column: 1 / -1;
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
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.4;
}

.questionMeta {
  margin-bottom: 12px;
}

.questionRequired {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #F44336;
  background: rgba(244, 67, 54, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.questionOptional {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--muted);
  background: var(--surface-variant);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
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

  .chartCard {
    grid-column: 1 / -1;
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
