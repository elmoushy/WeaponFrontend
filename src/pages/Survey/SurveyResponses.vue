<template>
  <div :class="$style.responsesContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header Section -->
    <section :class="$style.headerSection">
      <div :class="$style.headerContent">
        <div :class="$style.titleSection">
          <button :class="$style.backButton" @click="goBack">
            <i class="fas fa-arrow-right" v-if="isRTL"></i>
            <i class="fas fa-arrow-left" v-if="!isRTL"></i>
            <span>{{ t('common.back') }}</span>
          </button>
          
        </div>
        
        <div :class="$style.headerActions">
          <button :class="$style.exportButton" @click="showExportModal = true" :disabled="responses.length === 0">
            <i class="fas fa-download"></i>
            {{ t('survey.responses.export') }}
          </button>
          
          <button :class="$style.refreshButton" @click="refreshData">
            <i class="fas fa-sync-alt" :class="{ [$style.spinning]: isLoading }"></i>
            {{ t('common.refresh') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Survey Overview -->
    <section v-if="survey" :class="$style.overviewSection">
      <div :class="$style.overviewGrid">
        <div :class="$style.overviewCard">
          <div :class="$style.overviewIcon">
            <i class="fas fa-users"></i>
          </div>
          <div :class="$style.overviewContent">
            <div :class="$style.overviewNumber">{{ survey.total_responses || 0 }}</div>
            <div :class="$style.overviewLabel">{{ t('survey.responses.totalResponses') }}</div>
          </div>
        </div>
        
        <div :class="$style.overviewCard">
          <div :class="$style.overviewIcon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div :class="$style.overviewContent">
            <div :class="$style.overviewNumber">{{ completedResponses }}</div>
            <div :class="$style.overviewLabel">{{ t('survey.responses.completed') }}</div>
          </div>
        </div>
        
        <div :class="$style.overviewCard">
          <div :class="$style.overviewIcon">
            <i class="fas fa-clock"></i>
          </div>
          <div :class="$style.overviewContent">
            <div :class="$style.overviewNumber">{{ incompleteResponses }}</div>
            <div :class="$style.overviewLabel">{{ t('survey.responses.incomplete') }}</div>
          </div>
        </div>
        
        <div :class="$style.overviewCard">
          <div :class="$style.overviewIcon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div :class="$style.overviewContent">
            <div :class="$style.overviewNumber">{{ getResponseRate() }}%</div>
            <div :class="$style.overviewLabel">{{ t('survey.responses.completionRate') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters and Search -->
    <!-- <section :class="$style.filtersSection">
      <div :class="$style.filtersGrid">
        <div :class="$style.searchGroup">
          <div :class="$style.searchInputWrapper">
            <i class="fas fa-search" :class="$style.searchIcon"></i>
            <input
              type="text"
              :class="$style.searchInput"
              :placeholder="t('survey.responses.searchPlaceholder')"
              v-model="searchQuery"
              @input="handleSearch"
            />
          </div>
        </div>
        
        <div :class="$style.filterGroup">
          <select :class="$style.filterSelect" v-model="completionFilter" @change="applyFilters">
            <option value="all">{{ t('survey.responses.filters.all') }}</option>
            <option value="complete">{{ t('survey.responses.filters.completed') }}</option>
            <option value="incomplete">{{ t('survey.responses.filters.incomplete') }}</option>
          </select>
          
          <select :class="$style.filterSelect" v-model="respondentFilter" @change="applyFilters">
            <option value="all">{{ t('survey.responses.filters.allRespondents') }}</option>
            <option value="authenticated">{{ t('survey.responses.filters.authenticated') }}</option>
            <option value="anonymous">{{ t('survey.responses.filters.anonymous') }}</option>
          </select>
          
          <select :class="$style.filterSelect" v-model="sortOrder" @change="applySorting">
            <option value="-submitted_at">{{ t('survey.responses.sorting.newest') }}</option>
            <option value="submitted_at">{{ t('survey.responses.sorting.oldest') }}</option>
          </select>
        </div>
        
        <div :class="$style.dateGroup">
          <input
            type="date"
            :class="$style.dateInput"
            v-model="startDate"
            @change="applyFilters"
            :title="t('survey.responses.dateRange.startDate')"
          />
          <span :class="$style.dateSeparator">{{ t('common.to') }}</span>
          <input
            type="date"
            :class="$style.dateInput"
            v-model="endDate"
            @change="applyFilters"
            :title="t('survey.responses.dateRange.endDate')"
          />
        </div>
      </div>
    </section> -->

    <!-- Responses List -->
    <section :class="$style.responsesSection">
      <div v-if="isLoading" :class="$style.loadingContainer">
        <div :class="$style.loadingSpinner"></div>
        <p :class="$style.loadingText">{{ t('survey.responses.loading') }}</p>
      </div>
      
      <div v-else-if="responses.length === 0" :class="$style.emptyState">
        <div :class="$style.emptyIcon">
          <i class="fas fa-inbox"></i>
        </div>
        <h3 :class="$style.emptyTitle">{{ t('survey.responses.noResponses') }}</h3>
        <p :class="$style.emptyDescription">{{ t('survey.responses.noResponsesDescription') }}</p>
      </div>
      
      <div v-else :class="$style.responsesList">
        <div
          v-for="response in responses"
          :key="response.id"
          :class="$style.responseCard"
          @click="expandResponse(response.id)"
        >
          <div :class="$style.responseHeader">
            <div :class="$style.respondentInfo">
              <div :class="$style.respondentAvatar">
                <i :class="response.respondent.type === 'authenticated' ? 'fas fa-user' : 'fas fa-user-secret'"></i>
              </div>
              <div :class="$style.respondentDetails">
                <div :class="$style.respondentName">
                  {{ response.respondent.email || t('survey.responses.anonymousUser') }}
                </div>
                <div :class="$style.respondentMeta">
                  <span :class="$style.respondentType">
                    {{ response.respondent.type === 'authenticated' ? t('survey.responses.authenticatedUser') : t('survey.responses.anonymousUser') }}
                  </span>
                  <span :class="$style.submissionDate">{{ formatDate(response.submitted_at) }}</span>
                </div>
              </div>
            </div>
            
            <div :class="$style.responseStatus">
              <span :class="[$style.statusBadge, response.is_complete ? $style.complete : $style.incomplete]">
                <i :class="response.is_complete ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                {{ response.is_complete ? t('survey.responses.completed') : t('survey.responses.incomplete') }}
              </span>
              
              <!-- <div :class="$style.responseActions">
                <button :class="$style.actionButton" @click.stop="viewResponseDetails(response)" :title="t('survey.responses.viewDetails')">
                  <i class="fas fa-eye"></i>
                </button>
                <button :class="$style.actionButton" @click.stop="exportSingleResponse(response)" :title="t('survey.responses.exportSingle')">
                  <i class="fas fa-download"></i>
                </button>
              </div> -->
            </div>
          </div>
          
          <div :class="$style.responsePreview">
            <div :class="$style.answersSummary">
              <span :class="$style.answersCount">
                {{ response.answer_count || response.answers.length }} {{ t('survey.responses.answersProvided') }}
              </span>
              <span :class="$style.progressBar">
                <div :class="$style.progressFill" :style="{ width: getCompletionPercentage(response) + '%' }"></div>
              </span>
            </div>
            
            <div v-if="expandedResponse === response.id" :class="$style.responseDetails">
              <div :class="$style.responseDetailsHeader">
                <div :class="$style.detailsHeaderIcon">
                  <i class="fas fa-clipboard-list"></i>
                </div>
                <h4 :class="$style.detailsHeaderTitle">الإجابات التفصيلية</h4>
                <div :class="$style.detailsHeaderBadge">
                  {{ response.answers.length }} {{ t('survey.responses.answers') }}
                </div>
              </div>
              
              <div :class="$style.answersGrid">
                <div v-for="answer in response.answers" :key="answer.question_id" :class="$style.answerCard">
                  <div :class="$style.answerCardHeader">
                    <div :class="$style.questionNumberBadge">
                      <span :class="$style.questionNumber">{{ answer.question_order }}</span>
                    </div>
                    <div :class="$style.questionTextContainer">
                      <div :class="$style.questionText">
                        {{ answer.question_text }}
                        <span v-if="answer.is_required" :class="$style.requiredMark">*</span>
                      </div>
                      <div :class="$style.questionMeta">
                        <div :class="$style.questionType">
                          <i :class="getQuestionTypeIcon(answer.question_type)"></i>
                          <span>{{ getQuestionTypeLabel(answer.question_type) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div :class="$style.answerValueContainer">
                    <div :class="$style.answerValueLabel">الإجابة:</div>
                    <div :class="$style.answerValue">
                      <div :class="$style.answerText">
                        {{ formatAnswer(answer) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Export Modal -->
    <div v-if="showExportModal" :class="$style.modalOverlay" @click="showExportModal = false">
      <div :class="$style.exportModal" @click.stop>
        <div :class="$style.modalHeader">
          <h3 :class="$style.modalTitle">
            <i class="fas fa-download"></i>
            {{ t('survey.responses.exportTitle') }}
          </h3>
          <button :class="$style.modalClose" @click="showExportModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div :class="$style.modalContent">
          <div :class="$style.exportOptions">
            <div :class="[$style.exportOption, { [$style.selected]: selectedExportFormat === 'csv' }]" @click="selectedExportFormat = 'csv'">
              <i class="fas fa-file-csv"></i>
              <span>{{ t('survey.responses.exportOptions.csv') }}</span>
              <p>{{ t('survey.responses.exportOptions.csvDescription') }}</p>
            </div>
            
            <div :class="[$style.exportOption, { [$style.selected]: selectedExportFormat === 'json' }]" @click="selectedExportFormat = 'json'">
              <i class="fas fa-file-code"></i>
              <span>{{ t('survey.responses.exportOptions.json') }}</span>
              <p>{{ t('survey.responses.exportOptions.jsonDescription') }}</p>
            </div>
          </div>
          
          <div :class="$style.exportSettings">
            <label :class="$style.checkboxLabel">
              <input type="checkbox" v-model="includeIncomplete" />
              <span>{{ t('survey.responses.exportOptions.includeIncomplete') }}</span>
            </label>
          </div>
        </div>
        
        <div :class="$style.modalActions">
          <button :class="$style.cancelButton" @click="showExportModal = false">
            {{ t('common.cancel') }}
          </button>
          <button :class="$style.exportConfirmButton" @click="performExport" :disabled="isExporting">
            <i v-if="isExporting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-download"></i>
            {{ isExporting ? t('survey.responses.exporting') : t('survey.responses.exportOptions.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Response Details Modal -->
    <div v-if="selectedResponse" :class="$style.modalOverlay" @click="selectedResponse = null">
      <div :class="$style.detailsModal" @click.stop>
        <div :class="$style.modalHeader">
          <h3 :class="$style.modalTitle">
            <i class="fas fa-clipboard-list"></i>
            {{ t('survey.responses.responseDetails') }}
          </h3>
          <button :class="$style.modalClose" @click="selectedResponse = null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div :class="$style.modalContent">
          <div :class="$style.responseMetadata">
            <div :class="$style.metadataGrid">
              <div :class="$style.metadataItem">
                <span :class="$style.metadataLabel">{{ t('survey.responses.respondent') }}:</span>
                <span :class="$style.metadataValue">{{ selectedResponse.respondent.email || t('survey.responses.anonymousUser') }}</span>
              </div>
              <div :class="$style.metadataItem">
                <span :class="$style.metadataLabel">{{ t('survey.responses.submittedAt') }}:</span>
                <span :class="$style.metadataValue">{{ formatDate(selectedResponse.submitted_at) }}</span>
              </div>
              <div :class="$style.metadataItem">
                <span :class="$style.metadataLabel">{{ t('survey.responses.status') }}:</span>
                <span :class="[$style.metadataValue, $style.statusBadge, selectedResponse.is_complete ? $style.complete : $style.incomplete]">
                  {{ selectedResponse.is_complete ? t('survey.responses.completed') : t('survey.responses.incomplete') }}
                </span>
              </div>
              <div :class="$style.metadataItem">
                <span :class="$style.metadataLabel">{{ t('survey.responses.ipAddress') }}:</span>
                <span :class="$style.metadataValue">{{ selectedResponse.ip_address || t('common.notAvailable') }}</span>
              </div>
            </div>
          </div>
          
          <div :class="$style.answersContainer">
            <h4 :class="$style.answersTitle">{{ t('survey.responses.answers') }}</h4>
            <div v-for="answer in selectedResponse.answers" :key="answer.question_id" :class="$style.answerDetailItem">
              <div :class="$style.questionHeader">
                <span :class="$style.questionNumber">{{ answer.question_order }}</span>
                <span :class="$style.questionText">{{ answer.question_text }}</span>
                <span v-if="answer.is_required" :class="$style.requiredMark">*</span>
              </div>
              <div :class="$style.questionMeta">
                <span :class="$style.questionType">
                  <i :class="getQuestionTypeIcon(answer.question_type)"></i>
                  {{ getQuestionTypeLabel(answer.question_type) }}
                </span>
              </div>
              <div :class="$style.answerValue">
                {{ formatAnswer(answer) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { apiClient } from '../../services/jwtAuthService'

// Props
interface Props {
  surveyId?: string
}
const props = defineProps<Props>()

// Router
const route = useRoute()
const router = useRouter()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// State
const survey = ref<any>(null)
const responses = ref<any[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const completionFilter = ref('all')
const respondentFilter = ref('all')
const sortOrder = ref('-submitted_at')
const startDate = ref('')
const endDate = ref('')
const expandedResponse = ref<string | null>(null)
const selectedResponse = ref<any>(null)

// Export modal state
const showExportModal = ref(false)
const selectedExportFormat = ref('csv')
const includeIncomplete = ref(true)
const isExporting = ref(false)

// Get survey ID from route or props
const surveyId = computed(() => props.surveyId || route.params.surveyId as string)

// Computed values
const completedResponses = computed(() => 
  responses.value.filter(response => response.is_complete).length
)

const incompleteResponses = computed(() => 
  responses.value.filter(response => !response.is_complete).length
)

// Methods
const loadSurveyResponses = async () => {
  try {
    isLoading.value = true
    
    const params = new URLSearchParams()
    if (completionFilter.value !== 'all') {
      params.append('is_complete', completionFilter.value === 'complete' ? 'true' : 'false')
    }
    if (respondentFilter.value !== 'all') {
      params.append('respondent_type', respondentFilter.value)
    }
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }
    if (startDate.value) {
      params.append('start_date', startDate.value + 'T00:00:00Z')
    }
    if (endDate.value) {
      params.append('end_date', endDate.value + 'T23:59:59Z')
    }
    if (sortOrder.value) {
      params.append('ordering', sortOrder.value)
    }
    
    const response = await apiClient.get(`/surveys/admin/surveys/${surveyId.value}/responses/?${params.toString()}`)
    
    // Handle the actual API response structure
    if (response.data) {
      // Extract survey data from the response
      survey.value = response.data.survey
      
      // Extract responses from the paginated results
      responses.value = response.data.results || []
      
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    // Logging removed for production
    
    // Fallback to empty state on error
    survey.value = {
      id: surveyId.value,
      title: 'Survey Title',
      description: 'Survey Description',
      total_responses: 0,
      total_questions: 0
    }
    
    responses.value = []
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  loadSurveyResponses()
}

const expandResponse = (responseId: string) => {
  expandedResponse.value = expandedResponse.value === responseId ? null : responseId
}

const performExport = async () => {
  try {
    isExporting.value = true
    
    const params = new URLSearchParams()
    params.append('format', selectedExportFormat.value)
    
    if (!includeIncomplete.value) {
      params.append('is_complete', 'true')
    }
    
    // Add current filters
    if (completionFilter.value !== 'all') {
      params.append('is_complete', completionFilter.value === 'complete' ? 'true' : 'false')
    }
    if (respondentFilter.value !== 'all') {
      params.append('respondent_type', respondentFilter.value)
    }
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }
    if (startDate.value) {
      params.append('start_date', startDate.value + 'T00:00:00Z')
    }
    if (endDate.value) {
      params.append('end_date', endDate.value + 'T23:59:59Z')
    }
    if (sortOrder.value) {
      params.append('ordering', sortOrder.value)
    }
    
    const response = await apiClient.get(`/surveys/admin/surveys/${surveyId.value}/responses/export/?${params.toString()}`, {
      responseType: 'blob'
    })
    
    if (response.status === 200) {
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const filename = `survey_${surveyId.value}_responses.${selectedExportFormat.value}`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showExportModal.value = false
    } else {
      throw new Error('Export failed')
    }
  } catch (error) {
    // Logging removed for production
    alert(t.value('survey.responses.exportError'))
  } finally {
    isExporting.value = false
  }
}

const getResponseRate = () => {
  const total = responses.value.length
  if (total === 0) return 0
  const completed = completedResponses.value
  return Math.round((completed / total) * 100)
}

const getCompletionPercentage = (response: any) => {
  if (!survey.value || !survey.value.total_questions) return 0
  const answered = response.answer_count || response.answers.length
  return Math.round((answered / survey.value.total_questions) * 100)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  
  // Check if current language is Arabic for RTL date formatting
  const isRTL = store.currentLanguage === 'ar'
  const locale = isRTL ? 'ar-SA' : 'en-US'
  
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatAnswer = (answer: any) => {
  if (!answer.answer_text) return t.value('survey.responses.noAnswer')
  
  if (answer.question_type === 'rating') {
    // Use the question_options length to determine the scale, or default to 5
    const maxRating = answer.question_options ? answer.question_options.length : 5
    return `${answer.answer_text}/${maxRating}`
  }
  
  if (answer.question_type === 'yes_no') {
    return answer.answer_text === 'yes' ? t.value('common.yes') : t.value('common.no')
  }
  
  if (answer.question_type === 'single_choice' || answer.question_type === 'multiple_choice') {
    return answer.answer_text
  }
  
  return answer.answer_text
}

const getQuestionTypeIcon = (type: string) => {
  const icons = {
    text: 'fas fa-font',
    textarea: 'fas fa-align-right',
    single_choice: 'fas fa-dot-circle',
    multiple_choice: 'fas fa-check-square',
    rating: 'fas fa-star',
    yes_no: 'fas fa-toggle-on'
  }
  return icons[type as keyof typeof icons] || 'fas fa-question'
}

const getQuestionTypeLabel = (type: string) => {
  const labels = {
    text: t.value('survey.questionTypes.text'),
    textarea: t.value('survey.questionTypes.textarea'),
    single_choice: t.value('survey.questionTypes.single_choice'),
    multiple_choice: t.value('survey.questionTypes.multiple_choice'),
    rating: t.value('survey.questionTypes.rating'),
    yes_no: t.value('survey.questionTypes.yes_no')
  }
  return labels[type as keyof typeof labels] || type
}

const goBack = () => {
  router.go(-1)
}

// Lifecycle
onMounted(() => {
  if (surveyId.value) {
    loadSurveyResponses()
  }
})
</script>

<style module src="./SurveyResponses.module.css">
/* CSS Module styles are imported from SurveyResponses.module.css */
</style>
