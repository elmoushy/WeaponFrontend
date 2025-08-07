<template>
  <div :class="$style.responsesContainer">
    <!-- Header Section -->
    <div :class="$style.header">
      <div :class="$style.headerContent">
        <div :class="$style.titleSection">
          <h1 :class="$style.title">{{ t('responses.title') }}</h1>
          <div :class="$style.stats">
            <div :class="$style.statItem">
              <span :class="$style.statValue">{{ totalResponses }}</span>
              <span :class="$style.statLabel">{{ t('responses.totalResponses') }}</span>
            </div>
            <div :class="$style.statItem">
              <span :class="$style.statValue">{{ completedResponses }}</span>
              <span :class="$style.statLabel">{{ t('responses.completed') }}</span>
            </div>
          </div>
        </div>
        <div :class="$style.headerActions">
          <button :class="$style.refreshBtn" @click="fetchResponses" :disabled="loading">
            <span>{{ t('responses.refreshData') }}</span>
          </button>
          <button :class="$style.exportBtn" @click="showExportModal = true">
            <span>{{ t('responses.exportAction') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p>{{ t('responses.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="$style.errorContainer">
      <p>{{ t('responses.error') }}</p>
      <button :class="$style.retryBtn" @click="fetchResponses">
        {{ t('responses.retry') }}
      </button>
    </div>

    <!-- Main Content -->
    <div v-else :class="$style.mainContent">
      <!-- Filters and Search -->
      <div :class="$style.filtersSection">
        <div :class="$style.searchContainer">
          <input
            v-model="searchQuery"
            :class="$style.searchInput"
            :placeholder="t('responses.searchPlaceholder')"
            type="text"
          />
        </div>
        
        <div :class="$style.filtersContainer">
          <div :class="$style.filterGroup">
            <label :class="$style.filterLabel">{{ t('responses.filterBy') }}:</label>
            <select v-model="selectedFilter" :class="$style.filterSelect">
              <option value="all">{{ t('responses.filters.all') }}</option>
              <option value="completed">{{ t('responses.filters.completed') }}</option>
              <option value="incomplete">{{ t('responses.filters.incomplete') }}</option>
            </select>
          </div>
          
          <div :class="$style.filterGroup">
            <label :class="$style.filterLabel">{{ t('responses.sortBy') }}:</label>
            <select v-model="selectedSort" :class="$style.filterSelect">
              <option value="newest">{{ t('responses.sorting.newest') }}</option>
              <option value="oldest">{{ t('responses.sorting.oldest') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Responses Table -->
      <div :class="$style.tableContainer">
        <div v-if="filteredResponses.length === 0" :class="$style.noResponsesContainer">
          <h3>{{ t('responses.noResponses') }}</h3>
          <p>{{ t('responses.noResponsesDescription') }}</p>
        </div>

        <table v-else :class="$style.responsesTable">
          <thead>
            <tr>
              <th>{{ t('responses.responseId') }}</th>
              <th>{{ t('responses.surveyTitle') }}</th>
              <th>{{ t('responses.respondent') }}</th>
              <th>{{ t('responses.submittedAt') }}</th>
              <th>{{ t('responses.status') }}</th>
              <th :class="$style.actionsHeader">{{ t('responses.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="response in paginatedResponses" :key="response.id" :class="$style.responseRow">
              <td :class="$style.responseId">#{{ response.id }}</td>
              <td :class="$style.surveyTitle">{{ response.survey_title || 'Unknown Survey' }}</td>
              <td :class="$style.respondent">
                {{ response.user_email || t('responses.anonymousUser') }}
              </td>
              <td :class="$style.submittedAt">
                {{ formatDate(response.submitted_at) }}
              </td>
              <td>
                <span 
                  :class="[
                    $style.statusBadge,
                    response.is_complete ? $style.completed : $style.incomplete
                  ]"
                >
                  {{ response.is_complete ? t('responses.completed') : t('responses.incomplete') }}
                </span>
              </td>
              <td :class="$style.actions">
                <button 
                  :class="$style.viewBtn"
                  @click="viewResponseDetails(response)"
                >
                  {{ t('responses.viewDetails') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" :class="$style.pagination">
          <button 
            :class="$style.pageBtn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Previous
          </button>
          
          <span :class="$style.pageInfo">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          
          <button 
            :class="$style.pageBtn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" :class="$style.modalOverlay" @click="showExportModal = false">
      <div :class="$style.exportModal" @click.stop>
        <div :class="$style.modalHeader">
          <h3>{{ t('responses.exportTitle') }}</h3>
          <button :class="$style.closeBtn" @click="showExportModal = false">×</button>
        </div>
        
        <div :class="$style.modalContent">
          <div :class="$style.exportOptions">
            <div :class="$style.formatSection">
              <h4>{{ t('responses.export.csv') }}</h4>
              <p>{{ t('responses.export.csvDescription') }}</p>
              <button :class="$style.exportFormatBtn" @click="exportData('csv')">
                {{ t('responses.downloadCSV') }}
              </button>
            </div>
            
            <div :class="$style.formatSection">
              <h4>{{ t('responses.export.json') }}</h4>
              <p>{{ t('responses.export.jsonDescription') }}</p>
              <button :class="$style.exportFormatBtn" @click="exportData('json')">
                {{ t('responses.downloadJSON') }}
              </button>
            </div>
          </div>

          <div :class="$style.exportSettings">
            <div :class="$style.settingItem">
              <label>
                <input 
                  v-model="exportSettings.includeHeaders" 
                  type="checkbox" 
                  :class="$style.checkbox"
                />
                {{ t('responses.includeHeaders') }}
              </label>
            </div>
            
            <div :class="$style.settingItem">
              <label>
                <input 
                  v-model="exportSettings.includeDateRange" 
                  type="checkbox" 
                  :class="$style.checkbox"
                />
                {{ t('responses.includeDateRange') }}
              </label>
            </div>

            <div v-if="exportSettings.includeDateRange" :class="$style.dateRange">
              <div :class="$style.dateInput">
                <label>{{ t('responses.fromDate') }}:</label>
                <input 
                  v-model="exportSettings.startDate" 
                  type="date" 
                  :class="$style.dateField"
                />
              </div>
              <div :class="$style.dateInput">
                <label>{{ t('responses.toDate') }}:</label>
                <input 
                  v-model="exportSettings.endDate" 
                  type="date" 
                  :class="$style.dateField"
                />
              </div>
            </div>
          </div>
        </div>

        <div :class="$style.modalActions">
          <button :class="$style.cancelBtn" @click="showExportModal = false">
            {{ t('responses.close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Response Details Modal -->
    <div v-if="showDetailsModal" :class="$style.modalOverlay" @click="showDetailsModal = false">
      <div :class="$style.detailsModal" @click.stop>
        <div :class="$style.modalHeader">
          <h3>{{ t('responses.responseDetails') }}</h3>
          <button :class="$style.closeBtn" @click="showDetailsModal = false">×</button>
        </div>
        
        <div :class="$style.modalContent">
          <div v-if="selectedResponse" :class="$style.responseInfo">
            <div :class="$style.infoGrid">
              <div :class="$style.infoItem">
                <label>{{ t('responses.responseId') }}:</label>
                <span>#{{ selectedResponse.id }}</span>
              </div>
              <div :class="$style.infoItem">
                <label>{{ t('responses.submissionDate') }}:</label>
                <span>{{ formatDate(selectedResponse.submitted_at) }}</span>
              </div>
              <div :class="$style.infoItem">
                <label>{{ t('responses.respondent') }}:</label>
                <span>{{ selectedResponse.user_email || t('responses.anonymousUser') }}</span>
              </div>
              <div :class="$style.infoItem">
                <label>{{ t('responses.status') }}:</label>
                <span 
                  :class="[
                    $style.statusBadge,
                    selectedResponse.is_complete ? $style.completed : $style.incomplete
                  ]"
                >
                  {{ selectedResponse.is_complete ? t('responses.completed') : t('responses.incomplete') }}
                </span>
              </div>
            </div>

            <div :class="$style.answersSection">
              <h4>{{ t('responses.answers') }}</h4>
              <div v-if="selectedResponse.responses && selectedResponse.responses.length > 0" :class="$style.answersList">
                <div 
                  v-for="answer in selectedResponse.responses" 
                  :key="answer.question_id" 
                  :class="$style.answerItem"
                >
                  <div :class="$style.questionText">
                    {{ answer.question_text || `Question ${answer.question_id}` }}
                  </div>
                  <div :class="$style.answerValue">
                    {{ answer.answer || t('responses.noAnswer') }}
                  </div>
                </div>
              </div>
              <div v-else :class="$style.noAnswers">
                {{ t('responses.noAnswer') }}
              </div>
            </div>
          </div>
        </div>

        <div :class="$style.modalActions">
          <button :class="$style.cancelBtn" @click="showDetailsModal = false">
            {{ t('responses.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/hooks/useI18n'
import { apiClient } from '@/services/jwtAuthService'

const { t } = useI18n()

// Types
interface SurveyResponse {
  id: number
  survey_id: number
  survey_title?: string
  user_email?: string
  user_id?: number
  is_complete: boolean
  submitted_at: string
  responses?: Array<{
    question_id: number
    question_text?: string
    answer: string
  }>
}

interface ExportSettings {
  includeHeaders: boolean
  includeDateRange: boolean
  startDate: string
  endDate: string
}

// Reactive data
const route = useRoute()
const loading = ref(false)
const error = ref(false)
const responses = ref<SurveyResponse[]>([])
const searchQuery = ref('')
const selectedFilter = ref('all')
const selectedSort = ref('newest')
const currentPage = ref(1)
const itemsPerPage = ref(20)

// Modal states
const showExportModal = ref(false)
const showDetailsModal = ref(false)
const selectedResponse = ref<SurveyResponse | null>(null)

// Export settings
const exportSettings = ref<ExportSettings>({
  includeHeaders: true,
  includeDateRange: false,
  startDate: '',
  endDate: ''
})

// Computed properties
const surveyId = computed(() => route.params.surveyId as string)

const totalResponses = computed(() => responses.value.length)

const completedResponses = computed(() => 
  responses.value.filter(r => r.is_complete).length
)

const filteredResponses = computed(() => {
  let filtered = responses.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(response => 
      response.user_email?.toLowerCase().includes(query) ||
      response.survey_title?.toLowerCase().includes(query) ||
      response.id.toString().includes(query)
    )
  }

  // Apply completion filter
  if (selectedFilter.value === 'completed') {
    filtered = filtered.filter(r => r.is_complete)
  } else if (selectedFilter.value === 'incomplete') {
    filtered = filtered.filter(r => !r.is_complete)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const dateA = new Date(a.submitted_at).getTime()
    const dateB = new Date(b.submitted_at).getTime()
    
    if (selectedSort.value === 'newest') {
      return dateB - dateA
    } else {
      return dateA - dateB
    }
  })

  return filtered
})

const totalPages = computed(() => 
  Math.ceil(filteredResponses.value.length / itemsPerPage.value)
)

const paginatedResponses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredResponses.value.slice(start, end)
})

// Methods
const fetchResponses = async () => {
  loading.value = true
  error.value = false
  
  try {
    let endpoint = '/api/surveys/admin/responses/'
    
    // If we have a specific survey ID, get responses for that survey
    if (surveyId.value && surveyId.value !== 'all') {
      endpoint = `/api/surveys/admin/surveys/${surveyId.value}/responses/`
    }
    
    const result = await apiClient.get(endpoint)
    responses.value = result.data || []
  } catch (err) {
    console.error('Error fetching responses:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const viewResponseDetails = async (response: SurveyResponse) => {
  try {
    // Fetch detailed response data if not already loaded
    if (!response.responses) {
      const detailResult = await apiClient.get(`/api/surveys/admin/responses/${response.id}/`)
      selectedResponse.value = detailResult.data
    } else {
      selectedResponse.value = response
    }
    
    showDetailsModal.value = true
  } catch (err) {
    console.error('Error fetching response details:', err)
  }
}

const exportData = async (format: 'csv' | 'json') => {
  try {
    let data = filteredResponses.value

    // Apply date range filter if enabled
    if (exportSettings.value.includeDateRange && exportSettings.value.startDate && exportSettings.value.endDate) {
      const startDate = new Date(exportSettings.value.startDate)
      const endDate = new Date(exportSettings.value.endDate)
      
      data = data.filter(response => {
        const responseDate = new Date(response.submitted_at)
        return responseDate >= startDate && responseDate <= endDate
      })
    }

    if (format === 'csv') {
      exportToCSV(data)
    } else {
      exportToJSON(data)
    }
    
    showExportModal.value = false
  } catch (err) {
    console.error('Error exporting data:', err)
  }
}

const exportToCSV = (data: SurveyResponse[]) => {
  const headers = ['Response ID', 'Survey Title', 'Respondent', 'Submitted At', 'Status', 'Completion']
  const csvContent = []
  
  if (exportSettings.value.includeHeaders) {
    csvContent.push(headers.join(','))
  }
  
  data.forEach(response => {
    const row = [
      response.id,
      `"${response.survey_title || 'Unknown'}"`,
      `"${response.user_email || 'Anonymous'}"`,
      response.submitted_at,
      response.is_complete ? 'Complete' : 'Incomplete',
      response.is_complete ? '100%' : '0%'
    ]
    csvContent.push(row.join(','))
  })
  
  downloadFile(csvContent.join('\n'), `survey-responses-${Date.now()}.csv`, 'text/csv')
}

const exportToJSON = (data: SurveyResponse[]) => {
  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, `survey-responses-${Date.now()}.json`, 'application/json')
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  fetchResponses()
})
</script>

<style module src="./SurveyResponses.module.css"></style>
