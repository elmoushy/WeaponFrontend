    <template>
      <div :class="$style.responsesContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
        <!-- Header Section -->
        <section :class="$style.headerSection">
          <div :class="$style.headerContent">
            <div :class="$style.titleSection">
              <button :class="$style.refreshButton" @click="refreshData">
                <i class="fas fa-sync-alt" :class="{ [$style.spinning]: isLoading }"></i>
                {{ t('common.refresh') }}
              </button>
            </div>
            
            <div :class="$style.headerActions">
              <button 
                :class="$style.downloadAllButton" 
                @click="downloadAllResponses"
                :disabled="isExporting"
                title="تحميل جميع الاستجابات"
              >
                <i v-if="isExporting" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-download"></i>
                <span>{{ isExporting ? 'جاري التحميل...' : 'تحميل الكل' }}</span>
              </button>
              
              <button :class="$style.backButton" @click="goBack">
                <i class="fas fa-arrow-right" v-if="isRTL"></i>
                <i class="fas fa-arrow-left" v-if="!isRTL"></i>
                <span>{{ t('common.back') }}</span>
              </button>
            </div>
          </div>

          <br>
          <!-- Navigation Tabs -->
          <div :class="$style.tabNavigation">
            <button 
              :class="[$style.tabButton, { [$style.active]: activeTab === 'responses' }]"
              @click="activeTab = 'responses'"
            >
              <i class="fas fa-list-ul"></i>
              {{ t('survey.responses.title') }}
              <span v-if="responses.length > 0" :class="$style.tabBadge">{{ responses.length }}</span>
            </button>
            <button 
              :class="[$style.tabButton, { [$style.active]: activeTab === 'analytics' }]"
              @click="switchToAnalytics"
            >
              <i class="fas fa-chart-line"></i>
              {{ t('survey.analytics.dashboard') }}
            </button>
          </div>
        </section>

        <!-- Tab Content -->
        <div :class="$style.tabContent">
          <!-- Responses Tab -->
          <div v-show="activeTab === 'responses'" :class="$style.tabPanel">
            <!-- Responses List -->


            <div :class="$style.responsesSection">
              <div v-if="isLoading" :class="$style.loadingContainer">
                <div :class="$style.loadingSpinner"></div>
                <p :class="$style.loadingText">جاري تحميل الردود...</p>
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
                >
                  <div :class="$style.responseHeader" @click="expandResponse(response.id)">
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
                    </div>
                  </div>
                  
                  <div :class="$style.responsePreview">
                    <div :class="$style.answersSummary">
                      <span :class="$style.answersCount">
                        {{ response.answer_count || response.answers?.length || 0 }} {{ t('survey.responses.answersProvided') }}
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
                          {{ response.answers?.length || 0 }} {{ t('survey.responses.answers') }}
                        </div>
                      </div>
                  <div :class="$style.answersGrid">
    <div v-for="answer in response.answers" :key="answer.question_id" :class="$style.answerCard">
      <div :class="$style.answerCardHeader">
        <div>
          <span :class="$style.questionNumber">{{ answer.question_order }}</span>
        </div>
        <div :class="$style.questionTextContainer">
          <div :class="$style.questionText">
            {{ answer.question_text }}
            <span v-if="answer.is_required" :class="$style.requiredMark">*</span>
          </div>
        
        </div>

        <div :class="$style.questionMeta">
            <div :class="$style.questionType">
              <i :class="getQuestionTypeIcon(answer.question_type)"></i>
              <span>{{ getQuestionTypeLabel(answer.question_type) }}</span>
            </div>
          </div>
      </div>

      <div :class="$style.answerValueContainer">
        <div :class="$style.answerValueLabel">الإجابة:</div>

        <!-- نعم/لا كبادج -->
        <div v-if="isYesNo(answer)" :class="$style.answerValue">
          <span :class="[$style.answerChip, normalizeYesNo(answer)==='نعم' ? $style.yes : $style.no]">
            <i :class="normalizeYesNo(answer)==='نعم' ? 'fas fa-check' : 'fas fa-times'"></i>
            {{ normalizeYesNo(answer) }}
          </span>
        </div>

        <!-- نص/اختيارات مع اختصار -->
        <div v-else :class="$style.answerValue">
          <div :class="$style.answerText">
            {{ truncated(answer) }}
          </div>
          <button
            v-if="needsClamp(answer)"
            :class="$style.moreBtn"
            @click="toggleExpand(answer.question_id)"
          >
            {{ isExpanded(answer.question_id) ? 'إظهار أقل' : 'إظهار المزيد' }}
          </button>
        </div>
      </div>
    </div>
  </div>

                </div>
              </div>
            </div>

            <!-- Pagination Controls -->
            <div v-if="!isLoading && responses.length > 0" :class="$style.paginationSection">
              <div :class="$style.paginationControls">
                <button 
                  :class="[$style.paginationButton, { [$style.disabled]: !hasPrevious }]"
                  @click="prevPage"
                  :disabled="!hasPrevious"
                >
                  <i class="fas fa-chevron-right"></i>
                  {{ t('survey.pagination.previous') }}
                </button>
                
                <div :class="$style.pageNumbers">
                  <template v-for="page in visiblePages" :key="page">
                    <span v-if="page === -1" :class="$style.ellipsis">...</span>
                    <button
                      v-else
                      :class="[$style.pageButton, { [$style.active]: page === currentPage }]"
                      @click="goToPage(page)"
                    >
                      {{ page }}
                    </button>
                  </template>
                </div>
                
                <button 
                  :class="[$style.paginationButton, { [$style.disabled]: !hasNext }]"
                  @click="nextPage"
                  :disabled="!hasNext"
                >
                  {{ t('survey.pagination.next') }}
                  <i class="fas fa-chevron-left"></i>
                </button>
              </div>
              
              <div :class="$style.itemsPerPageControl">
                <label for="itemsPerPage">{{ t('survey.pagination.itemsPerPage') }}:</label>
                <select 
                  id="itemsPerPage" 
                  :class="$style.itemsPerPageSelect" 
                  :value="itemsPerPage" 
                  @change="changeItemsPerPage(Number(($event.target as HTMLSelectElement).value))"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
          </div>

       
        </div>
           <!-- Analytics Dashboard Tab -->
          <div v-show="activeTab === 'analytics'" :class="$style.tabPanel">
            <div v-if="analyticsLoading" :class="$style.loadingContainer">
              <div :class="$style.loadingSpinner"></div>
              <p :class="$style.loadingText">{{ t('survey.analytics.loadingAnalytics') }}</p>
            </div>
            
            <div v-else-if="analyticsError" :class="$style.errorContainer">
              <div :class="$style.errorIcon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <h3 :class="$style.errorTitle">{{ t('survey.analytics.loadError') }}</h3>
              <p :class="$style.errorMessage">{{ analyticsError }}</p>
              <button @click="loadAnalytics" :class="$style.retryButton">
                <i class="fas fa-redo"></i>
                {{ t('common.retry') }}
              </button>
            </div>
            
        <div v-else-if="hasAnalyticsData">
  <SurveyAnalytics 
    :analytics="surveyAnalytics"
    :loading="analyticsLoading"
    @refresh="loadAnalytics"
    @question-click="onAnalyticsQuestionClick"
    @period-click="onAnalyticsPeriodClick"
    @filters-change="onAnalyticsFiltersChange"
  />
</div>

            <div v-else :class="$style.noDataContainer">
              <div :class="$style.noDataIcon">
                <i class="fas fa-chart-line"></i>
              </div>
              <h3 :class="$style.noDataTitle">{{ t('survey.analytics.noData') }}</h3>
              <p :class="$style.noDataMessage">{{ t('survey.analytics.noDataDescription') }}</p>
            </div>
          </div>

          <!-- Question Analytics Tab -->
          <div v-show="activeTab === 'questions'" :class="$style.tabPanel">
            <div v-if="analyticsLoading" :class="$style.loadingContainer">
              <div :class="$style.loadingSpinner"></div>
              <p :class="$style.loadingText">{{ t('survey.analytics.loadingAnalytics') }}</p>
            </div>
            
            <div v-else-if="analyticsError" :class="$style.errorContainer">
              <div :class="$style.errorIcon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <h3 :class="$style.errorTitle">{{ t('survey.analytics.loadError') }}</h3>
              <p :class="$style.errorMessage">{{ analyticsError }}</p>
              <button @click="loadAnalytics" :class="$style.retryButton">
                <i class="fas fa-redo"></i>
                {{ t('common.retry') }}
              </button>
            </div>
            
            <div v-else-if="hasQuestionAnalyticsData" :class="$style.questionAnalyticsContent">
              <div :class="$style.questionAnalyticsHeader">
                <h2 :class="$style.questionAnalyticsTitle">
                  <i class="fas fa-question-circle"></i>
                  {{ t('survey.analytics.questions') }}
                </h2>
                <p :class="$style.questionAnalyticsDescription">
                  {{ t('survey.analytics.questionsDescription') }}
                </p>
              </div>

              <div :class="$style.questionAnalyticsGrid">
                <div 
                v-for="question in normalizedQuestionAnalytics" 
                  :key="question.question_id"
                  :class="$style.questionAnalyticsCard"
                >
                  <div :class="$style.questionHeader">
                    <div :class="$style.questionNumber">Q{{ question.question_order }}</div>
                    <div :class="$style.questionTitle">{{ question.question_text }}</div>
                    <div :class="$style.questionType">
                      <i :class="getQuestionTypeIcon(question.question_type)"></i>
                      {{ getQuestionTypeLabel(question.question_type) }}
                    </div>
                  </div>

                  <div :class="$style.questionAnalyticsBody">
                    <!-- Only render component if analytics data is valid -->
                    <component
                      v-if="isValidQuestionAnalytics(question)"
      :is="getQuestionAnalyticsComponent(question.question_type)"
      :question="question"
      :analytics="question"
      :detailed="true"
                    />
                    <div v-else :class="$style.noQuestionData">
                      <div :class="$style.noQuestionDataIcon">
                        <i class="fas fa-chart-line"></i>
                      </div>
                      <p :class="$style.noQuestionDataText">
                        {{ t('survey.analytics.noDataForQuestion') }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else :class="$style.noDataContainer">
              <div :class="$style.noDataIcon">
                <i class="fas fa-question-circle"></i>
              </div>
              <h3 :class="$style.noDataTitle">{{ t('survey.analytics.noQuestionData') }}</h3>
              <p :class="$style.noDataMessage">{{ t('survey.analytics.noQuestionDataDescription') }}</p>
            </div>
          </div>

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
    </div>
    </template>

    <script setup lang="ts">
    import { ref, computed, onMounted, nextTick, watch } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useAppStore } from '../../stores/useAppStore'
    import { apiClient } from '../../services/jwtAuthService'
    import Swal from 'sweetalert2'
    
    // Analytics Components
    import SurveyAnalytics from '../../components/Analytics/SurveyAnalytics.vue'
    import SingleChoiceAnalytics from '../../components/Analytics/SingleChoiceAnalytics.vue'
    import MultipleChoiceAnalytics from '../../components/Analytics/MultipleChoiceAnalytics.vue'
    import RatingAnalytics from '../../components/Analytics/RatingAnalytics.vue'
    import YesNoAnalytics from '../../components/Analytics/YesNoAnalytics.vue'
    import TextAnalytics from '../../components/Analytics/TextAnalytics.vue'

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
    // توسيع/طي الإجابات الطويلة
  const expanded = ref<Set<string | number>>(new Set())

  const isYesNo = (a: any) => {
    const raw = (a?.raw_value ?? a?.answer_text ?? '').toString().trim().toLowerCase()
    return ['نعم','لا','yes','no','true','false','1','0'].includes(raw)
  }

  const normalizeYesNo = (a: any) => {
    const raw = (a?.raw_value ?? a?.answer_text ?? '').toString().trim().toLowerCase()
    if (['نعم','yes','true','1'].includes(raw)) return 'نعم'
    return 'لا'
  }

  const needsClamp = (a: any) => {
    const text = formatAnswer(a) || ''
    return !expanded.value.has(a.question_id) && text.length > 180
  }

  const truncated = (a: any) => {
    const text = formatAnswer(a) || '—'
    if (expanded.value.has(a.question_id)) return text
    return text.length > 180 ? text.slice(0, 180) + '…' : text
  }

  const toggleExpand = (id: string | number) => {
    const e = new Set(expanded.value)
    e.has(id) ? e.delete(id) : e.add(id)
    expanded.value = e
  }

  const isExpanded = (id: string | number) => expanded.value.has(id)


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

    // Pagination state
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

    // Export modal state
    const showExportModal = ref(false)
    const selectedExportFormat = ref('csv')
    const includeIncomplete = ref(true)
    const isExporting = ref(false)

    // Analytics state
    const activeTab = ref('responses')
    const analyticsLoading = ref(false)
    const analyticsError = ref<string | null>(null)
    const surveyAnalytics = ref<any>(null)
    const questionAnalytics = ref<any[]>([])
    const analyticsLoadingPromise = ref<Promise<void> | null>(null) // Track loading promise
    // Guards to prevent recursive updates from child emissions
    const isProgrammaticAnalyticsUpdate = ref(false)
    const lastAnalyticsFiltersKey = ref<string>('')
    const isHandlingAnalyticsFilters = ref(false)

    // Get survey ID from route or props
    const surveyId = computed(() => props.surveyId || route.params.surveyId as string)

    // Computed values
    // Keeping this computed value as it might be used elsewhere in the component
    // @ts-ignore - This is used in the template
    const completedResponses = computed(() => 
      responses.value.filter(response => response.is_complete).length
    )

    // Computed property to check if analytics data is ready to display
    const hasAnalyticsData = computed(() => {
      // Only show data if we're not loading and have valid data
      return !analyticsLoading.value && 
            !!(surveyAnalytics.value && (surveyAnalytics.value.data || surveyAnalytics.value.status === 'success'))
    })

    const hasQuestionAnalyticsData = computed(() => {
      // Only show data if we're not loading and have valid data
      return !analyticsLoading.value && 
            !!(questionAnalytics.value && questionAnalytics.value.length > 0)
    })

    // Pagination computed properties
    const hasPrevious = computed(() => currentPage.value > 1)
    const hasNext = computed(() => currentPage.value < totalPages.value)
    const visiblePages = computed(() => {
      const pages = []
      const total = totalPages.value
      const current = currentPage.value
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i)
          }
          pages.push(-1) // ellipsis
          pages.push(total)
        } else if (current >= total - 3) {
          pages.push(1)
          pages.push(-1) // ellipsis
          for (let i = total - 4; i <= total; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push(-1) // ellipsis
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i)
          }
          pages.push(-1) // ellipsis
          pages.push(total)
        }
      }
      
      return pages
    })

    // Watchers to reset pagination when filters change
    watch([searchQuery, completionFilter, respondentFilter, sortOrder, startDate, endDate], () => {
      currentPage.value = 1
      loadSurveyResponses()
    })

    // Removed unused computed property

    // Methods
    const loadSurveyResponses = async () => {
      try {
        isLoading.value = true
        
        const params = new URLSearchParams()
        
        // Add pagination parameters
        params.append('page', currentPage.value.toString())
        params.append('per_page', itemsPerPage.value.toString())
        
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
          // Check if data is nested (response.data.data) or direct (response.data)
          const dataContainer = response.data.data || response.data
          
          // Extract survey data from the response
          survey.value = dataContainer.survey
          
          // Extract responses from the paginated results
          responses.value = dataContainer.results || []
          
          // Update pagination data
          totalItems.value = dataContainer.count || 0
          
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
        totalItems.value = 0
      } finally {
        isLoading.value = false
      }
    }

    const refreshData = () => {
      currentPage.value = 1
      loadSurveyResponses()
    }

    // Pagination methods
    const prevPage = () => {
      if (hasPrevious.value) {
        currentPage.value--
        loadSurveyResponses()
      }
    }

    const nextPage = () => {
      if (hasNext.value) {
        currentPage.value++
        loadSurveyResponses()
      }
    }

    const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
        currentPage.value = page
        loadSurveyResponses()
      }
    }

    const changeItemsPerPage = (newItemsPerPage: number) => {
      itemsPerPage.value = newItemsPerPage
      currentPage.value = 1
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
        Swal.fire({
          title: 'خطأ في التصدير',
          text: 'فشل في تصدير البيانات',
          icon: 'error',
          confirmButtonText: 'موافق'
        })
      } finally {
        isExporting.value = false
      }
    }

    // Enhanced export function for downloading ALL responses (no pagination)
    const downloadAllResponses = async () => {
      try {
        isExporting.value = true
        
        // Fetch ALL responses using the direct endpoint
        const response = await apiClient.get(`/surveys/admin/surveys/${surveyId.value}/responses/?ordering=-submitted_at`)
        
        // Extract responses from the API response
        let allResponses: any[] = []
        if (response.data) {
          const dataContainer = response.data.data || response.data
          allResponses = dataContainer.results || dataContainer || []
        }
        
        if (allResponses.length === 0) {
          Swal.fire({
            title: 'لا توجد بيانات',
            text: 'لا توجد استجابات لتصديرها',
            icon: 'info',
            confirmButtonText: 'موافق'
          })
          return
        }
        
        // Generate CSV content with proper Arabic encoding
        const csvContent = generateArabicCSV(allResponses)
        
        // Create blob with proper UTF-8 BOM for Arabic text
        const BOM = '\uFEFF' // UTF-8 BOM for proper Arabic display in Excel
        const blob = new Blob([BOM + csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        })
        
        // Download file
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `جميع_استجابات_الاستبيان_${surveyId.value}_${timestamp}.csv`
        link.download = filename
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        Swal.fire({
          title: 'تم التصدير بنجاح',
          text: `تم تحميل ${allResponses.length} استجابة بنجاح`,
          icon: 'success',
          confirmButtonText: 'موافق'
        })
        
      } catch (error) {
        console.error('Export error:', error)
        Swal.fire({
          title: 'خطأ في التصدير',
          text: 'فشل في تحميل جميع الاستجابات',
          icon: 'error',
          confirmButtonText: 'موافق'
        })
      } finally {
        isExporting.value = false
      }
    }



    // Generate CSV content with proper Arabic support
    const generateArabicCSV = (responses: any[]) => {
      if (responses.length === 0) return ''
      
      // Get all unique questions from all responses
      const allQuestions = new Map()
      responses.forEach(response => {
        response.answers?.forEach((answer: any) => {
          if (!allQuestions.has(answer.question_id)) {
            allQuestions.set(answer.question_id, {
              order: answer.question_order || 0,
              text: answer.question_text || `سؤال ${answer.question_order || answer.question_id}`,
              type: answer.question_type || 'text'
            })
          }
        })
      })
      
      // Sort questions by order
      const sortedQuestions = Array.from(allQuestions.entries()).sort((a, b) => a[1].order - b[1].order)
      
      // Create header row with questions and answers
      const headers = [
        'رقم الاستجابة',
        'المستجيب',
        'نوع المستجيب',
        'تاريخ الإرسال',
        'نسبة الإكمال'
      ]
      
      // Add question-answer pairs to headers
      sortedQuestions.forEach(([_, q]) => {
        headers.push(`السؤال ${q.order}: ${q.text}`)
        headers.push(`الإجابة ${q.order}`)
      })
      
      // Create data rows
      const rows = responses.map((response, index) => {
        const answerMap = new Map()
        response.answers?.forEach((answer: any) => {
          answerMap.set(answer.question_id, {
            question: answer.question_text || `سؤال ${answer.question_order}`,
            answer: formatAnswerForCSV(answer),
            type: answer.question_type,
            order: answer.question_order
          })
        })
        
        const row = [
          index + 1,
          response.respondent?.email || 'مجهول',
          response.respondent?.type === 'authenticated' ? 'مسجل' : 'مجهول',
          formatDateForCSV(response.submitted_at),
          `${getCompletionPercentage(response)}%`
        ]
        
        // Add question-answer pairs to row
        sortedQuestions.forEach(([questionId]) => {
          const qa = answerMap.get(questionId)
          if (qa) {
            row.push(qa.question)
            row.push(qa.answer)
          } else {
            row.push('لا يوجد سؤال')
            row.push('لا يوجد إجابة')
          }
        })
        
        return row
      })
      
      // Combine headers and rows
      const allRows = [headers, ...rows]
      
      // Convert to CSV format with proper escaping
      return allRows.map(row => 
        row.map(cell => {
          const cellStr = String(cell || '')
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (cellStr.includes('"') || cellStr.includes(',') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      ).join('\n')
    }

    // Format answer for CSV export
    const formatAnswerForCSV = (answer: any) => {
      if (!answer.answer_text) return 'لا يوجد إجابة'
      
      let formattedAnswer = answer.answer_text.toString()
      
      // Handle different question types
      switch (answer.question_type) {
        case 'rating':
          const maxRating = answer.question_options ? answer.question_options.length : 5
          formattedAnswer = `${answer.answer_text}/${maxRating}`
          break
          
        case 'yes_no':
          formattedAnswer = answer.answer_text === 'yes' || answer.answer_text === 'نعم' || answer.answer_text === '1' ? 'نعم' : 'لا'
          break
          
        case 'multiple_choice':
          // Handle multiple selections
          if (Array.isArray(answer.answer_text)) {
            formattedAnswer = answer.answer_text.join('؛ ')
          }
          break
          
        case 'single_choice':
        case 'text':
        case 'textarea':
        default:
          // Keep original text, but clean up newlines for CSV
          formattedAnswer = formattedAnswer.replace(/\n/g, ' ').replace(/\r/g, ' ')
          break
      }
      
      return formattedAnswer
    }

    // Format date for CSV export
    const formatDateForCSV = (dateString: string) => {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      
      // Format in Arabic locale
      return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Riyadh' // Adjust timezone as needed
      })
    }

    // Keep this function since it uses completedResponses
    // @ts-ignore - This is used in the template
    const getResponseRate = () => {
      const total = responses.value.length
      if (total === 0) return 0
      const completed = completedResponses.value
      return Math.round((completed / total) * 100)
    }

    const getCompletionPercentage = (response: any) => {
      if (!survey.value || !survey.value.total_questions) return 0
      const answered = response.answer_count || response.answers?.length || 0
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

    // Analytics methods
    const switchToAnalytics = async () => {
      if (activeTab.value === 'analytics') return // Prevent unnecessary calls

      activeTab.value = 'analytics'
      
      // Wait for the DOM to update before checking if we need to load analytics
      await nextTick()
      
      // Only load analytics if we don't have data AND we're not already loading
      if (!surveyAnalytics.value && !analyticsLoadingPromise.value) {
        await loadAnalytics()
      }
    }

    // const switchToQuestionAnalytics = async () => {
    //   if (activeTab.value === 'questions') return // Prevent unnecessary calls

    //   activeTab.value = 'questions'
      
    //   // Wait for the DOM to update before checking if we need to load analytics
    //   await nextTick()
      
    //   // Only load analytics if we don't have data AND we're not already loading
    //   if ((!questionAnalytics.value || questionAnalytics.value.length === 0) && !analyticsLoadingPromise.value) {
    //     await loadAnalytics()
    //   }
    // }

      const loadAnalytics = async () => {
        // If already loading, return the existing promise to prevent concurrent calls
        if (analyticsLoadingPromise.value) {
          return analyticsLoadingPromise.value
        }
        
        const loadPromise = (async () => {
          try {
      // Mark as programmatic before any state changes to ignore child emissions
      isProgrammaticAnalyticsUpdate.value = true
            analyticsLoading.value = true
            analyticsError.value = null

            // Load survey-level analytics using the correct endpoint from JSON
            const surveyAnalyticsResponse = await apiClient.get(`/surveys/admin/surveys/${surveyId.value}/dashboard/`)

      if (surveyAnalyticsResponse.status === 200) {
              // Store the response data
              const responseData = surveyAnalyticsResponse?.data
              
              surveyAnalytics.value = responseData

              
              
              // Extract question analytics from the survey response if available
              if (responseData?.data?.questions_summary) {
                const extractedQuestions = responseData?.data?.questions_summary.map((question: any) => ({
                  ...question,
                  question_id: question.question_id,
                  question_order: question.order,
                  question_type: question.type,
                  question_text: question.question_text || `Question ${question.order}`,
                  analytics: question.distributions || {}
                }))
                questionAnalytics.value = extractedQuestions
                
              }
              // Default filters snapshot to avoid re-fetch from initial/default emissions
              if (!lastAnalyticsFiltersKey.value) {
                lastAnalyticsFiltersKey.value = JSON.stringify({ start: '', end: '', group_by: 'day' })
              }
            }

          } catch (error) {
            console.error('Analytics loading error:', error)
            analyticsError.value = error instanceof Error ? error.message : 'Failed to load analytics'
          } finally {
            analyticsLoading.value = false
            analyticsLoadingPromise.value = null // Clear the promise
      // Next tick to let children settle, then clear the programmatic flag
      await nextTick()
      isProgrammaticAnalyticsUpdate.value = false
          }
        })()
        
        analyticsLoadingPromise.value = loadPromise
        return loadPromise
      }

    const getQuestionAnalyticsComponent = (questionType: string) => {
      const componentMap: Record<string, any> = {
        'single_choice': SingleChoiceAnalytics,
        'multiple_choice': MultipleChoiceAnalytics,
        'rating': RatingAnalytics,
        'yes_no': YesNoAnalytics,
        'text': TextAnalytics,
        'textarea': TextAnalytics
      }
      return componentMap[questionType] || TextAnalytics
    }

    // Validate question analytics data before rendering
    const isValidQuestionAnalytics = (question: any): boolean => {
      if (!question) return false
      
      const questionType = question.question_type || question.type
      
      // For text/textarea questions, check if analytics data structure exists
      if (questionType === 'text' || questionType === 'textarea') {
        const transformed = transformQuestionAnalytics(question)
        
        // Check if the transformed data has the expected structure
        return !!(transformed.analytics?.analytics?.textual || 
                transformed.analytics?.textual ||
                transformed.textual ||
                (transformed.kpis && typeof transformed.kpis.answer_count === 'number'))
      }
      
      // For other question types, basic validation
      return !!(question.analytics || question.distributions || question.kpis)
    }

    // Transform question analytics data to match component expectations
    const transformQuestionAnalytics = (question: any) => {
      const transformed = { ...question }
      
      // If analytics is empty but distributions exist, move distributions to analytics.analytics
      if ((!transformed.analytics || Object.keys(transformed.analytics).length === 0) && transformed.distributions) {
        transformed.analytics = {
          analytics: transformed.distributions
        }
      }
      
      // Ensure textual analytics has the expected structure
      if (transformed.analytics?.textual) {
        transformed.analytics.analytics = {
          textual: {
            total_responses: transformed.analytics.textual.total_responses || transformed.kpis?.answer_count || 0,
            avg_words: transformed.analytics.textual.avg_words || 0,
            avg_word_count: transformed.analytics.textual.avg_words || 0,
            avg_char_count: transformed.analytics.textual.avg_chars || 0,
            response_lengths: transformed.analytics.textual.response_lengths || {}
          }
        }
      } else if (transformed.distributions?.textual) {
        transformed.analytics = {
          analytics: {
            textual: {
              total_responses: transformed.distributions.textual.total_responses || transformed.kpis?.answer_count || 0,
              avg_words: transformed.distributions.textual.avg_words || 0,
              avg_word_count: transformed.distributions.textual.avg_words || 0,
              avg_char_count: transformed.distributions.textual.avg_chars || 0,
              response_lengths: transformed.distributions.textual.response_lengths || {}
            }
          }
        }
      } else if ((transformed.type === 'text' || transformed.type === 'textarea') && (!transformed.analytics || Object.keys(transformed.analytics).length === 0)) {
        // For empty text analytics, provide default structure
        transformed.analytics = {
          analytics: {
            textual: {
              total_responses: transformed.kpis?.answer_count || 0,
              avg_words: 0,
              avg_word_count: 0,
              avg_char_count: 0,
              response_lengths: {}
            }
          }
        }
      }
      
      return transformed
    }

    // Analytics event handlers
    const onAnalyticsQuestionClick = (_question: any) => {
      // Switch to question analytics tab and highlight specific question
      activeTab.value = 'questions'
      
      // If we have question analytics loaded, scroll to specific question
      // You could implement scrolling to specific question here
    }

    const onAnalyticsPeriodClick = (_period: any) => {
      // Handle period click (could filter responses by this period)
      
      // Example: filter responses by this period
      // startDate.value = period.start
      // endDate.value = period.end
      // loadSurveyResponses()
    }

const onAnalyticsFiltersChange = async () => {
  if (isProgrammaticAnalyticsUpdate.value) return
  if (analyticsLoading.value || analyticsLoadingPromise.value || isHandlingAnalyticsFilters.value) return
  if (!surveyAnalytics.value) return

  // نفّذ مباشرة
  try {
    isHandlingAnalyticsFilters.value = true
    isProgrammaticAnalyticsUpdate.value = true
    analyticsLoading.value = true
    // build params + call API + set surveyAnalytics.value
  } finally {
    analyticsLoading.value = false
    await nextTick()
    isProgrammaticAnalyticsUpdate.value = false
    isHandlingAnalyticsFilters.value = false
  }
}

    // Lifecycle
    onMounted(() => {
      if (surveyId.value) {
        loadSurveyResponses()
      }
    })


// نفس منطق التحويل عندك لكن هنستدعيه مرة فقط
const normalizeQuestion = (q: any) => {
  const t = { ...q }
  if ((!t.analytics || Object.keys(t.analytics).length === 0) && t.distributions) {
    t.analytics = { analytics: t.distributions }
  }
  if (t.analytics?.textual) {
    t.analytics.analytics = {
      textual: {
        total_responses: t.analytics.textual.total_responses || t.kpis?.answer_count || 0,
        avg_words: t.analytics.textual.avg_words || 0,
        avg_word_count: t.analytics.textual.avg_words || 0,
        avg_char_count: t.analytics.textual.avg_chars || 0,
        response_lengths: t.analytics.textual.response_lengths || {}
      }
    }
  } else if (t.distributions?.textual) {
    t.analytics = {
      analytics: {
        textual: {
          total_responses: t.distributions.textual.total_responses || t.kpis?.answer_count || 0,
          avg_words: t.distributions.textual.avg_words || 0,
          avg_word_count: t.distributions.textual.avg_words || 0,
          avg_char_count: t.distributions.textual.avg_chars || 0,
          response_lengths: t.distributions.textual.response_lengths || {}
        }
      }
    }
  } else if ((t.type === 'text' || t.type === 'textarea') && (!t.analytics || Object.keys(t.analytics).length === 0)) {
    t.analytics = {
      analytics: {
        textual: {
          total_responses: t.kpis?.answer_count || 0,
          avg_words: 0, avg_word_count: 0, avg_char_count: 0, response_lengths: {}
        }
      }
    }
  }
  return t
}

// حافظ على مرجع ثابت لكل عنصر (لو نفس العنصر ما اتغيرش بالمرجع)
const _cache = new WeakMap<any, any>()
const normalizedQuestionAnalytics = computed(() => {
  return (questionAnalytics.value || []).map(q => {
    if (_cache.has(q)) return _cache.get(q)
    const nq = normalizeQuestion(q)
    _cache.set(q, nq)
    return nq
  })
})

    </script>

    <style module src="./SurveyResponses.module.css">
    /* CSS Module styles are imported from SurveyResponses.module.css */
    </style>
