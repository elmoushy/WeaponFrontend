<template>
  <div :class="$style.surveysContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header Section -->
    <section :class="$style.headerSection">
      <div :class="$style.headerContent">
        <div :class="$style.glassMorphTitle">
          <div :class="$style.titleGradientBg">
            <div :class="$style.titleIconContainer">
              <i class="fas fa-chart-bar"></i>
            </div>
            <div :class="$style.titleContent">
              <h1 :class="$style.modernPageTitle">
                نظرة عامة
              </h1>
              <p :class="$style.modernPageSubtitle">
                على الاستبيانات ومؤشرات الأداء الرئيسية
              </p>
              <div :class="$style.titleAccent"></div>
            </div>
              <div :class="$style.headerActions">
              <button :class="$style.refreshButton" @click="refreshData" :disabled="isLoading">
                <i class="fas fa-sync-alt" :class="{ [$style.spinning]: isLoading }"></i>
                {{ t('common.refresh') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Overview Section -->
    <section v-if="accessSummary" :class="$style.overviewSection">
      <div :class="$style.overviewGrid">
        <div :class="$style.overviewCard">
          <div :class="$style.overviewIcon">
            <i class="fas fa-share-alt"></i>
          </div>
          <div :class="$style.overviewContent">
            <div :class="$style.overviewNumber">{{ accessSummary.auth_surveys + accessSummary.private_shared }}</div>
            <div :class="$style.overviewLabel">{{ t('survey.shared.overview.totalShared') }}</div>
          </div>
        </div>
        
        <div :class="$style.overviewCard">
          <div :class="$style.overviewIcon">
            <i class="fas fa-globe"></i>
          </div>
          <div :class="$style.overviewContent">
            <div :class="$style.overviewNumber">{{ accessSummary.auth_surveys }}</div>
            <div :class="$style.overviewLabel">{{ t('survey.shared.overview.authSurveys') }}</div>
          </div>
        </div>
        
        <div :class="$style.overviewCard">
          <div :class="$style.overviewIcon">
            <i class="fas fa-user-friends"></i>
          </div>
          <div :class="$style.overviewContent">
            <div :class="$style.overviewNumber">{{ accessSummary.private_shared }}</div>
            <div :class="$style.overviewLabel">{{ t('survey.shared.overview.privateShared') }}</div>
          </div>
        </div>
        
        <div :class="$style.overviewCard">
          <div :class="$style.overviewIcon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div :class="$style.overviewContent">
            <div :class="$style.overviewNumber">{{ availableSurveysCount }}</div>
            <div :class="$style.overviewLabel">{{ t('survey.shared.overview.available') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters and Search -->
    <section :class="$style.filtersSection">
      <div :class="$style.filtersGrid">
        <div :class="$style.searchGroup">
          <div :class="$style.searchInputWrapper">
            <i class="fas fa-search" :class="$style.searchIcon"></i>
            <input
              type="text"
              :class="$style.searchInput"
              :placeholder="t('survey.shared.search.placeholder')"
              v-model="searchQuery"
              @input="handleSearch"
            />
          </div>
        </div>
        
        <div :class="$style.filterGroup">
          <select :class="$style.filterSelect" v-model="visibilityFilter" @change="applyFilters">
            <option value="">{{ t('survey.shared.filters.allShared') }}</option>
            <option value="AUTH">{{ t('survey.shared.filters.authOnly') }}</option>
            <option value="PUBLIC">{{ t('survey.shared.filters.publicOnly') }}</option>
            <option value="PRIVATE">{{ t('survey.shared.filters.privateOnly') }}</option>
            <option value="GROUPS">{{ t('survey.shared.filters.groupsOnly') }}</option>
          </select>
          
          <select :class="$style.filterSelect" v-model="activeFilter" @change="applyFilters">
            <option value="">{{ t('survey.filters.all') }}</option>
            <option value="true">{{ t('survey.shared.filters.activeOnly') }}</option>
            <option value="false">{{ t('survey.filters.inactive') }}</option>
          </select>
          
          <select :class="$style.filterSelect" v-model="lockedFilter" @change="applyFilters">
            <option value="">{{ t('survey.filters.all') }}</option>
            <option value="false">{{ t('survey.shared.filters.unlockedOnly') }}</option>
            <option value="true">{{ t('survey.filters.locked') }}</option>
          </select>
          
          <select :class="$style.filterSelect" v-model="sortOrder" @change="applyFilters">
            <option value="-created_at">{{ t('survey.sorting.newest') }}</option>
            <option value="created_at">{{ t('survey.sorting.oldest') }}</option>
            <option value="title">{{ t('survey.sorting.titleAZ') }}</option>
            <option value="-title">{{ t('survey.sorting.titleZA') }}</option>
            <option value="-updated_at">{{ t('survey.sorting.lastUpdated') }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Surveys Grid -->
    <section :class="$style.surveysSection">
      <!-- Loading State -->
      <div v-if="isLoading" :class="$style.loadingState">
        <div :class="$style.loadingSpinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>جاري تحميل الاستطلاعات...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" :class="$style.errorState">
        <div :class="$style.errorIcon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>فشل في تحميل الاستطلاعات</h3>
        <p>{{ error }}</p>
        <button :class="$style.retryButton" @click="refreshData">
          <i class="fas fa-redo"></i>
          إعادة المحاولة
        </button>
      </div>

      <!-- Timeout Error State -->
      <div v-else-if="timeoutError" :class="$style.errorState">
        <div :class="$style.errorIcon">
          <i class="fas fa-clock"></i>
        </div>
        <h3>انتهت مهلة الطلب</h3>
        <p>فشل في تحميل الاستطلاعات خلال 15 ثانية</p>
        <div :class="$style.errorActions">
          <button :class="$style.retryButton" @click="refreshData">
            <i class="fas fa-redo"></i>
            إعادة المحاولة
          </button>
          <button :class="$style.refreshButton" @click="refreshPage">
            <i class="fas fa-sync-alt"></i>
            تحديث الصفحة
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="surveys.length === 0" :class="$style.emptyState">
        <div :class="$style.emptyIcon">
          <i class="fas fa-inbox"></i>
        </div>
        <h3>{{ searchQuery ? t('survey.shared.search.noResults') : t('survey.shared.search.emptyState') }}</h3>
        <p v-if="!searchQuery">{{ t('survey.shared.search.emptyState') }}</p>
      </div>

      <!-- Surveys Grid -->
      <div v-else :class="$style.surveysGrid">
        <div 
          v-for="survey in surveys" 
          :key="survey.id" 
          :class="[$style.surveyCard, { [$style.nonClickable]: !canTakeSurvey(survey) && !survey.access_info.has_submitted }]"
          @click="canTakeSurvey(survey) || survey.access_info.has_submitted ? handleSurveyClick(survey) : null"
        >
          <!-- Card Header -->
          <div :class="$style.cardHeader">
            <div :class="$style.cardTitle">{{ survey.title }}</div>
            <!-- <div :class="$style.accessTypeBadge" :data-type="survey.reason">
              {{ getAccessTypeLabel(survey.reason) }}
            </div> -->
          </div>

          <!-- Card Content -->
          <div :class="$style.cardContent">
            <p :class="$style.cardDescription">{{ survey.description || 'لا يوجد وصف' }}</p>
            
            <div :class="$style.cardMeta">
              <div :class="$style.metaItem">
                <i class="fas fa-user"></i>
                <span>{{ t('survey.shared.card.createdBy') }}: {{ survey.creator.name || survey.creator.email }}</span>
              </div>
              
              <div :class="$style.metaItem">
                <i class="fas fa-question-circle"></i>
                <span>{{ survey.questions_count }} {{ t('survey.shared.card.questionsCount') }}</span>
              </div>
              
            </div>

            <!-- Survey Status -->
            <div :class="$style.statusIndicators">
              <div v-if="survey.status === 'scheduled'" :class="[$style.statusBadge, $style.scheduled]">
                <i class="fas fa-calendar-alt"></i>
                {{ t('survey.shared.card.isScheduled') }}
              </div>
              
              <div v-if="!survey.is_active" :class="[$style.statusBadge, $style.inactive]">
                <i class="fas fa-pause"></i>
                {{ t('survey.shared.card.isInactive') }}
              </div>
              
              <div v-if="survey.is_locked" :class="[$style.statusBadge, $style.locked]">
                <i class="fas fa-lock"></i>
                {{ t('survey.shared.card.isLocked') }}
              </div>
              
              <div v-if="survey.access_info.has_submitted" :class="[$style.statusBadge, $style.submitted]">
                <i class="fas fa-check"></i>
                {{ t('survey.shared.card.hasSubmitted') }}
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div :class="$style.cardActions">
            <button 
              v-if="canTakeSurvey(survey)" 
              :class="[$style.actionButton, $style.primary]"
              @click.stop="takeSurvey(survey)"
            >
              <i class="fas fa-play"></i>
              {{ t('survey.shared.card.takeNow') }}
            </button>
            
            <button 
              v-else-if="survey.access_info.has_submitted" 
              :class="[$style.actionButton, $style.completed]"
              disabled
            >
              <i class="fas fa-check"></i>
              {{ t('survey.shared.card.alreadySubmitted') }}
            </button>
            
            <button 
              v-else 
              :class="[$style.actionButton, $style.disabled]"
              disabled
            >
              <i class="fas fa-eye"></i>
              {{ t('survey.shared.card.viewOnly') }}
            </button>
          </div>

          <!-- Card Footer -->
          <div :class="$style.cardFooter">
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div :class="$style.paginationSection">
        <div :class="$style.paginationInfo">
          {{ t('common.pagination.showing') }} 
          {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} - 
          {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }} 
          {{ t('common.pagination.of') }} {{ pagination.total }}
        </div>
        
        <div :class="$style.paginationControls">
          <button 
            :class="$style.pageButton" 
            @click="changePage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage === 1"
          >
            <i class="fas fa-chevron-right" v-if="isRTL"></i>
            <i class="fas fa-chevron-left" v-if="!isRTL"></i>
            {{ t('common.pagination.previous') }}
          </button>
          
          <span :class="$style.pageNumbers">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              :class="[$style.pageNumber, { [$style.active]: page === pagination.currentPage }]"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
          </span>
          
          <button 
            :class="$style.pageButton" 
            @click="changePage(pagination.currentPage + 1)"
            :disabled="pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)"
          >
            {{ t('common.pagination.next') }}
            <i class="fas fa-chevron-left" v-if="isRTL"></i>
            <i class="fas fa-chevron-right" v-if="!isRTL"></i>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/hooks/useI18n'
import { surveyService } from '@/services/surveyService'
import Swal from 'sweetalert2'
import type { 
  SharedSurvey, 
  SharedSurveysResponse, 
  SharedSurveysAccessSummary,
  SharedSurveysFilters,
  ApiResponse,
  PaginatedApiResponse
} from '@/types/survey.types'

// Composables
const router = useRouter()
const { t, currentLanguage, currentTheme, isRTL } = useI18n()

// Reactive data
const surveys = ref<SharedSurvey[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const timeoutError = ref(false)
const accessSummary = ref<SharedSurveysAccessSummary | null>(null)

// Search and filters
const searchQuery = ref('')
const visibilityFilter = ref<string>('')
const activeFilter = ref<string>('')
const lockedFilter = ref<string>('')
const sortOrder = ref('-created_at')

// Pagination
const pagination = ref({
  currentPage: 1,
  pageSize: 12,
  total: 0
})

// Computed properties
const availableSurveysCount = computed(() => {
  return surveys.value.filter(survey => 
    survey.is_active && 
    !survey.is_locked && 
    survey.access_info.can_submit && 
    !survey.access_info.has_submitted
  ).length
})

const visiblePages = computed(() => {
  const totalPages = Math.ceil(pagination.value.total / pagination.value.pageSize)
  const current = pagination.value.currentPage
  const delta = 2
  const pages: number[] = []
  
  const start = Math.max(1, current - delta)
  const end = Math.min(totalPages, current + delta)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const loadSurveys = async () => {
  isLoading.value = true
  error.value = null
  timeoutError.value = false
  
  try {
    const filters: SharedSurveysFilters = {
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize,
      ordering: sortOrder.value
    }
    
    if (searchQuery.value.trim()) {
      filters.search = searchQuery.value.trim()
    }
    
    if (visibilityFilter.value) {
      filters.visibility = visibilityFilter.value as 'AUTH' | 'PUBLIC' | 'PRIVATE' | 'GROUPS'
    }
    
    if (activeFilter.value) {
      filters.is_active = activeFilter.value === 'true'
    }
    
    if (lockedFilter.value) {
      filters.is_locked = lockedFilter.value === 'true'
    }
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })
    
    const response = await Promise.race([
      surveyService.getMySharedSurveys(filters),
      timeoutPromise
    ]) as PaginatedApiResponse<SharedSurvey> | ApiResponse<SharedSurveysResponse>
    
    // Handle different response formats
    if ('count' in response) {
      // Paginated response
      const paginatedResponse = response as PaginatedApiResponse<SharedSurvey>
      surveys.value = paginatedResponse.results
      pagination.value.total = paginatedResponse.count
      
      // Estimate access summary from current page data
      const authCount = surveys.value.filter(s => s.visibility === 'AUTH' || s.visibility === 'PUBLIC').length
      const privateCount = surveys.value.filter(s => s.visibility === 'PRIVATE' || s.visibility === 'GROUPS').length
      accessSummary.value = {
        auth_surveys: authCount,
        private_shared: privateCount
      }
    } else {
      // Wrapped API response
      const apiResponse = response as ApiResponse<SharedSurveysResponse>
      surveys.value = apiResponse.data.surveys
      pagination.value.total = apiResponse.data.total_count
      accessSummary.value = apiResponse.data.access_summary
    }
    
  } catch (err: any) {
    if (err.message === 'TIMEOUT') {
      timeoutError.value = true
      await Swal.fire({
        title: 'انتهت مهلة الطلب',
        text: 'فشل في تحميل الاستطلاعات خلال 15 ثانية. يرجى المحاولة مرة أخرى.',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    } else {
      error.value = err.message || 'فشل في تحميل الاستطلاعات'
      await Swal.fire({
        title: 'خطأ في تحميل الاستطلاعات',
        text: err.message || 'فشل في تحميل الاستطلاعات',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    }
    // Logging removed for production
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  loadSurveys()
}

const refreshPage = () => {
  window.location.reload()
}

const handleSearch = () => {
  pagination.value.currentPage = 1
  loadSurveys()
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadSurveys()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= Math.ceil(pagination.value.total / pagination.value.pageSize)) {
    pagination.value.currentPage = page
    loadSurveys()
  }
}

const canTakeSurvey = (survey: SharedSurvey): boolean => {
  return survey.is_active && 
         !survey.is_locked && 
         survey.access_info.can_submit && 
         !survey.access_info.has_submitted
}

const takeSurvey = (survey: SharedSurvey) => {
  // Navigate to survey taking page
  router.push(`/surveys/take/${survey.id}`)
}

const handleSurveyClick = (survey: SharedSurvey) => {
  // Navigate to survey details or taking page
  if (canTakeSurvey(survey)) {
    takeSurvey(survey)
  } else {
    router.push(`/surveys/view/${survey.id}`)
  }
}

// Lifecycle
onMounted(() => {
  loadSurveys()
})

// Watchers
watch(() => currentLanguage, () => {
  // Reload data when language changes for proper date formatting
  loadSurveys()
})
</script>

<style module src="./Surveys.module.css"></style>
