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

    <!-- KPIs Section -->
    <div :class="$style.kpisSection">
      <div :class="$style.kpisGrid">
        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-users" style="color: #4CAF50;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatNumber(kpis.total_responses) }}</div>
            <div :class="$style.kpiLabel">إجمالي الردود</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-user-check" style="color: #2196F3;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatNumber(kpis.unique_respondents) }}</div>
            <div :class="$style.kpiLabel">المشاركون الفريدون</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-percentage" style="color: #FF9800;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatPercentage(kpis.completion_rate) }}</div>
            <div :class="$style.kpiLabel">معدل الإكمال</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-clock" style="color: #9C27B0;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatDuration(kpis.average_completion_time) }}</div>
            <div :class="$style.kpiLabel">متوسط زمن الإكمال</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-shield-alt" style="color: #795548;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatNumber(kpis.authenticated_count) }}</div>
            <div :class="$style.kpiLabel">ردود موثقة</div>
          </div>
        </div>

        <div :class="$style.kpiCard">
          <div :class="$style.kpiIcon">
            <i class="fas fa-user-secret" style="color: #607D8B;"></i>
          </div>
          <div :class="$style.kpiContent">
            <div :class="$style.kpiNumber">{{ formatNumber(kpis.anonymous_count) }}</div>
            <div :class="$style.kpiLabel">ردود مجهولة</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div :class="$style.chartsSection">
      <!-- Time Series Chart commented for now-->
      <!-- <div :class="$style.chartCard">
        <div :class="$style.chartHeader">
          <h3 :class="$style.chartTitle">الردود عبر الزمن</h3>
          <div :class="$style.chartLegend">
            <div :class="$style.legendItem">
              <div :class="$style.legendColor" style="background-color: #4CAF50;"></div>
              <span>الردود</span>
            </div>
            <div :class="$style.legendItem">
              <div :class="$style.legendColor" style="background-color: #2196F3;"></div>
              <span>معدل الإكمال</span>
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
      </div> -->


      <!-- Segments Charts Row -->
      <div :class="$style.chartsRow">
        <!-- Authentication Segmentation -->
        <div :class="$style.chartCard">
          <div :class="$style.chartHeader">
            <h3 :class="$style.chartTitle">الردود حسب التوثيق</h3>
          </div>
          <div :class="$style.chartContainer">
            <DonutChart
              :data="authenticationSegments"
              :colors="['#4CAF50', '#FF5722']"
              :labels="['موثق', 'مجهول']"
              :loading="loading"
            />
          </div>
        </div>

        <!-- Completion Segmentation -->
        <div :class="$style.chartCard">
          <div :class="$style.chartHeader">
            <h3 :class="$style.chartTitle">الردود حسب الإكمال</h3>
          </div>
          <div :class="$style.chartContainer">
            <DonutChart
              :data="completionSegments"
              :colors="['#4CAF50', '#FFC107']"
              :labels="['مكتمل', 'غير مكتمل']"
              :loading="loading"
            />
          </div>
        </div>
      </div>
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
          @click="onQuestionClick(question)"
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

    <!-- Insights Section -->
    <div :class="$style.insightsSection">
      <div :class="$style.sectionHeader">
        <h3 :class="$style.sectionTitle">استبصارات</h3>
      </div>
      
      <div :class="$style.insightsGrid">
        <div :class="$style.insightCard" v-if="kpis.response_rate_trend">
          <div :class="$style.insightIcon">
            <i :class="getTrendIcon(kpis.response_rate_trend)" :style="`color: ${getTrendColor(kpis.response_rate_trend)}`"></i>
          </div>
          <div :class="$style.insightContent">
            <h4 :class="$style.insightTitle">اتجاه الاستجابة</h4>
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
            <h4 :class="$style.insightTitle">آخر رد</h4>
            <p :class="$style.insightText">
              {{ formatDateTime(kpis.last_response_at) }}
            </p>
          </div>
        </div>

        <div :class="$style.insightCard">
          <div :class="$style.insightIcon">
            <i class="fas fa-calendar-check" style="color: #4CAF50;"></i>
          </div>
          <div :class="$style.insightContent">
            <h4 :class="$style.insightTitle">أول رد</h4>
            <p :class="$style.insightText">
              {{ formatDateTime(kpis.first_response_at) }}
            </p>
          </div>
        </div>
<!-- 
        <div :class="$style.insightCard">
          <div :class="$style.insightIcon">
            <i class="fas fa-globe" style="color: #FF9800;"></i>
          </div>
          <div :class="$style.insightContent">
            <h4 :class="$style.insightTitle">عناوين IP فريدة</h4>
            <p :class="$style.insightText">
              {{ formatNumber(kpis.unique_ips) }} عنوان IP
            </p>
          </div>
        </div> -->
      </div>
    </div>

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
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
// import TimeSeriesChart from './TimeSeriesChart.vue'
import DonutChart from './DonutChart.vue'
import QuestionDetailsModal from './QuestionDetailsModal'

// Props
interface Props { analytics?: any; loading?: boolean }
const props = withDefaults(defineProps<Props>(), { loading: false })

// Emits
const emit = defineEmits<{
  refresh: []
  questionClick: [question: any]
  questionDetailsClick: [data: { question: any, details: any }]
  periodClick: [period: any]
  filtersChange: [filters: any]
}>()

// Store (نستخدمه للثيم والاتجاه فقط)
const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// State
// const filters = ref({ start: '', end: '', group_by: 'day' })
const isMounted = ref(false)
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
  last_response_date: null,
  first_response_at: null,
  last_response_at: null
})

// const timeSeriesData = computed(() => {
//   const timeSeries = props.analytics?.data?.time_series || []
//   return timeSeries.map((item: any) => ({
//     period: item.period,
//     label: item.period_label,
//     responses: item.response_count,
//     uniqueRespondents: item.unique_respondents,
//     completionRate: item.completion_rate
//   }))
// })

const authenticationSegments = computed(() => {
  const segments = props.analytics?.data?.segments?.by_auth || []
  const total = segments.reduce((sum: number, segment: any) => sum + segment.count, 0)
  
  return segments.map((segment: any) => ({
    value: segment.count,
    percentage: total > 0 ? segment.count / total : 0
  }))
})

const completionSegments = computed(() => {
  const segments = props.analytics?.data?.segments?.by_completion || []
  const total = segments.reduce((sum: number, segment: any) => sum + segment.count, 0)
  
  return segments.map((segment: any) => ({
    value: segment.count,
    percentage: total > 0 ? segment.count / total : 0
  }))
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
const NEVER_TEXT = 'لم يحدث بعد'

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
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`
  return `${remainingSeconds}s`
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return NEVER_TEXT
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
  if (trend > 0.05) return `زادت بنسبة ${percentage}%`
  if (trend < -0.05) return `انخفضت بنسبة ${percentage}%`
  return 'مستقرة'
}

const refreshAnalytics = () => emit('refresh')
const onQuestionClick = (question: any) => emit('questionClick', question)

const onQuestionDetailsClick = async (question: any) => {
  try {
    selectedQuestion.value = question
    showQuestionDetails.value = true
    questionDetailsLoading.value = true
    questionDetails.value = null
    
    const surveyId = props.analytics?.data?.survey?.id
    const questionId = question.id
    
    if (!surveyId || !questionId) {
      console.error('Missing survey ID or question ID')
      questionDetailsLoading.value = false
      return
    }
    
    const response = await surveyService.getQuestionAnalytics(surveyId, questionId)
    
    if (response.status === 'success') {
      questionDetails.value = response.data
      emit('questionDetailsClick', {
        question: question,
        details: response.data
      })
    }
  } catch (error) {
    console.error('Error fetching question details:', error)
  } finally {
    questionDetailsLoading.value = false
  }
}

const closeQuestionDetails = () => {
  showQuestionDetails.value = false
  selectedQuestion.value = null
  questionDetails.value = null
}

const retryQuestionDetails = () => {
  if (selectedQuestion.value) {
    onQuestionDetailsClick(selectedQuestion.value)
  }
}

// const onPeriodClick = (period: any) => emit('periodClick', period)

// const onFiltersChange = () => {
//   if (isMounted.value && props.analytics?.data) emit('filtersChange', filters.value)
// }

onMounted(() => { isMounted.value = true })
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
  font-size: 13px;
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
