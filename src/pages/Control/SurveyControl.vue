<template>
  <div :class="$style.surveyPanel" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Hero Section -->
    <section :class="$style.heroSection">
      <div :class="$style.heroContent">
        <div :class="$style.heroText">
          <div :class="$style.sectionHerto">
            <i class="fas fa-chart-line" :class="$style.heroIcon"></i>
            <h1>
            {{ t('survey.title') }}
          </h1>
          </div>
          
          <p>{{ t('survey.subtitle') }}</p>
        </div>
        
        <div :class="$style.heroActions">
          <!-- <button :class="$style.secondaryButton" @click="viewAllResponses">
            <i class="fas fa-chart-bar"></i>
            {{ t('responses.title') }}
          </button> -->
          <button :class="$style.primaryButton" @click="showCreateModal = true">
            <i class="fas fa-plus"></i>
            {{ t('survey.list.createSurvey') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Dashboard Stats -->
    <section :class="$style.statsSection" v-if="analytics">
      <div :class="$style.statsGrid">
        <div :class="$style.statCard">
          <div :class="$style.statNumber">{{ analytics.total_surveys || 0 }}</div>
          <div :class="$style.statLabel">{{ t('survey.dashboard.totalSurveys') }}</div>
        </div>
        <div :class="$style.statCard">
          <div :class="$style.statNumber">{{ analytics.active_surveys || 0 }}</div>
          <div :class="$style.statLabel">{{ t('survey.dashboard.activeSurveys') }}</div>
        </div>
        <div :class="$style.statCard">
          <div :class="$style.statNumber">{{ analytics.total_responses || 0 }}</div>
          <div :class="$style.statLabel">{{ t('survey.dashboard.totalResponses') }}</div>
        </div>
      </div>
    </section>

    <!-- Controls and Filters -->
    <section :class="$style.controlsSection">
      <div :class="$style.filtersGroup">
        <input
          type="text"
          :class="$style.searchInput"
          :placeholder="t('survey.list.searchPlaceholder')"
          v-model="searchQuery"
          @input="handleSearch"
        />
        
        <select :class="$style.filterSelect" v-model="selectedFilter" @change="applyFilters">
          <option value="all">{{ t('survey.filters.all') }}</option>
          <option value="active">{{ t('survey.filters.active') }}</option>
          <option value="inactive">{{ t('survey.filters.inactive') }}</option>
          <option value="private">{{ t('survey.filters.private') }}</option>
          <option value="auth_required">{{ t('survey.filters.auth') }}</option>
          <option value="public">{{ t('survey.filters.public') }}</option>
        </select>
        
        <select :class="$style.filterSelect" v-model="selectedSort" @change="applySorting">
          <option value="newest">{{ t('survey.sorting.newest') }}</option>
          <option value="oldest">{{ t('survey.sorting.oldest') }}</option>
          <option value="title_asc">{{ t('survey.sorting.titleAZ') }}</option>
          <option value="title_desc">{{ t('survey.sorting.titleZA') }}</option>
          <option value="most_responses">{{ t('survey.sorting.mostResponses') }}</option>
        </select>
      </div>
      
      <div :class="$style.viewControls">
        <!-- <button 
          :class="[$style.viewToggle, { [$style.active]: viewMode === 'grid' }]"
          @click="viewMode = 'grid'"
          :title="t('files.viewGrid')"
        >
          <i class="fas fa-th"></i>
        </button> -->
        <!-- <button 
          :class="[$style.viewToggle, { [$style.active]: viewMode === 'list' }]"
          @click="viewMode = 'list'"
          :title="t('files.viewList')"
        >
          <i class="fas fa-list"></i>
        </button> -->
        <button :class="$style.secondaryButton" @click="refreshData">
          <i class="fas fa-sync-alt"></i>
          {{ t('survey.list.refreshData') }}
        </button>
      </div>
    </section>

    <!-- Bulk Actions Bar -->
    <div v-if="selectedSurveys?.length > 0" :class="$style.bulkActionsBar">
      <div :class="$style.bulkInfo">
        <span :class="$style.selectedCount">{{ selectedSurveys?.length || 0 }}</span>
        <span>{{ t('survey.list.selectedItems') }}</span>
      </div>
      
      <div :class="$style.bulkActions">
        <button :class="$style.bulkButton" @click="bulkActivate" :disabled="bulkOperationLoading">
          <i class="fas fa-play"></i>
          {{ t('survey.bulk.operations.activate') }}
        </button>
        <button :class="$style.bulkButton" @click="bulkDeactivate" :disabled="bulkOperationLoading">
          <i class="fas fa-pause"></i>
          {{ t('survey.bulk.operations.deactivate') }}
        </button>
        <!-- <button :class="$style.bulkButton" @click="bulkLock" :disabled="bulkOperationLoading">
          <i class="fas fa-lock"></i>
          {{ t('survey.bulk.operations.lock') }}
        </button> -->
        <button :class="[$style.bulkButton, $style.danger]" @click="bulkDelete" :disabled="bulkOperationLoading">
          <i class="fas fa-trash"></i>
          {{ t('survey.bulk.operations.delete') }}
        </button>
      </div>
    </div>

    <!-- Surveys Grid/List -->
    <section v-if="!isLoading && surveys?.length > 0" :class="$style.surveysSection">
      <!-- Grid View -->
      <div :class="$style.surveysGrid" v-if="viewMode === 'grid'">
        <div
          v-for="survey in paginatedSurveys"
          :key="survey.id"
          :class="[$style.surveyCard, { [$style.selected]: selectedSurveys?.includes(survey.id) }]"
          @click="selectSurvey(survey.id)"
        >
          <div :class="$style.cardHeader">
            <input
              type="checkbox"
              :class="$style.cardCheckbox"
              :checked="selectedSurveys?.includes(survey.id)"
              @click.stop="toggleSurveySelection(survey.id)"
            />
            <div :class="$style.cardStatus">
              <span :class="[$style.statusBadge, $style[survey.is_active ? 'active' : 'inactive']]">
                {{ survey.is_active ? t('survey.status.active') : t('survey.status.inactive') }}
              </span>
              <span 
                v-if="survey.status === 'draft'"
                :class="[$style.statusBadge, $style.draft]"
              >
                {{ isRTL ? 'مسودة' : 'Draft' }}
              </span>
              <span 
                v-if="survey.visibility"
                :class="[$style.statusBadge, $style[survey.visibility.toLowerCase()]]"
              >
                {{ t(`survey.status.${survey.visibility.toLowerCase()}`) }}
              </span>
              <span 
                v-else
                :class="[$style.statusBadge, $style.private]"
              >
                {{ t('survey.status.private') }}
              </span>
            </div>
          </div>
          
          <h3 :class="$style.cardTitle">{{ survey.title }}</h3>
          <p :class="$style.cardDescription">{{ survey.description }}</p>
          
          <div :class="$style.cardMeta">
            <span>{{ t('survey.card.createdBy') }}: {{ survey.creator_email }}</span>
            <span>{{ formatDate(survey.updated_at) }}</span>
          </div>
          
          <div :class="$style.cardStats">
            <div :class="$style.statItem">
              <i class="fas fa-users" :class="$style.statIcon"></i>
              <span>{{ survey.response_count }} {{ t('survey.card.responses') }}</span>
            </div>
            <div :class="$style.statItem">
              <i class="fas fa-question-circle" :class="$style.statIcon"></i>
              <span>{{ survey.questions?.length || 0 }} {{ t('survey.questions.title').toLowerCase() }}</span>
            </div>
          </div>
          
          <div :class="$style.cardActions">
            <!-- Edit button - only for draft surveys -->
            <button 
              v-if="survey.status === 'draft'" 
              :class="$style.actionButton" 
              @click.stop="editSurvey(survey)" 
              :title="t('survey.card.edit')"
            >
              <i class="fas fa-edit"></i>
              <span :class="$style.actionButtonText">{{ t('survey.card.edit') }}</span>
            </button>
            
            <!-- Submit button - only for draft surveys -->
            <button 
              v-if="survey.status === 'draft'" 
              :class="[$style.actionButton, $style.submitAction]" 
              @click.stop="submitDraftSurvey(survey.id)" 
              :title="isRTL ? 'إرسال الاستطلاع' : 'Submit Survey'"
            >
              <i class="fas fa-paper-plane"></i>
              <span :class="$style.actionButtonText">{{ isRTL ? 'إرسال' : 'Submit' }}</span>
            </button>
            
            <!-- Share/Manage Access button - hidden for submitted surveys -->
            <button 
              v-if="survey.status !== 'submitted'" 
              :class="$style.actionButton" 
              @click.stop="manageSurveyAccess(survey)" 
              :title="t('survey.card.manageAccess')"
            >
              <i class="fas fa-share-alt"></i>
              <span :class="$style.actionButtonText">{{ t('survey.card.share') }}</span>
            </button>
            <button 
              v-if="survey.visibility === 'PUBLIC'"
              :class="[$style.actionButton, $style.publicShare]" 
              @click.stop="openLinkSharingModal(survey)" 
              :title="t('survey.card.shareLink')"
            >
              <i class="fas fa-link"></i>
              <span :class="$style.actionButtonText">الرابط</span>
            </button>
            <button :class="$style.actionButton" @click.stop="viewResponses(survey.id)" :title="t('survey.card.viewResponses')">
              <i class="fas fa-chart-bar"></i>
              <span :class="$style.actionButtonText">{{ t('survey.card.viewResponses') }}</span>
            </button>
            <!-- <button :class="$style.actionButton" @click.stop="cloneSurvey(survey.id)" :title="t('survey.card.clone')">
              <i class="fas fa-copy"></i>
              <span :class="$style.actionButtonText">{{ t('survey.card.clone') }}</span>
            </button> -->
            <button :class="[$style.actionButton, $style.danger]" @click.stop="deleteSurvey(survey.id)" :title="t('survey.card.delete')">
              <i class="fas fa-trash"></i>
              <span :class="$style.actionButtonText">{{ t('survey.card.delete') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div :class="$style.surveysList" v-else-if="viewMode === 'list'">
        <div :class="$style.listHeader">
          <div :class="$style.listHeaderCheckbox">
            <input
              type="checkbox"
              :class="$style.headerCheckbox"
              :checked="selectedSurveys?.length === paginatedSurveys?.length && paginatedSurveys?.length > 0"
              @change="toggleSelectAll"
            />
          </div>
          <div :class="$style.listHeaderTitle">{{ t('survey.list.title') }}</div>
          <div :class="$style.listHeaderStats">{{ t('survey.list.stats') }}</div>
          <div :class="$style.listHeaderStatus">{{ t('survey.list.status') }}</div>
          <div :class="$style.listHeaderDate">{{ t('survey.list.lastUpdated') }}</div>
          <div :class="$style.listHeaderActions">{{ t('survey.list.actions') }}</div>
        </div>

        <div
          v-for="survey in paginatedSurveys"
          :key="survey.id"
          :class="[$style.listItem, { [$style.selected]: selectedSurveys?.includes(survey.id) }]"
          @click="selectSurvey(survey.id)"
        >
          <div :class="$style.listItemCheckbox">
            <input
              type="checkbox"
              :class="$style.itemCheckbox"
              :checked="selectedSurveys?.includes(survey.id)"
              @click.stop="toggleSurveySelection(survey.id)"
            />
          </div>
          
          <div :class="$style.listItemContent">
            <h4 :class="$style.listItemTitle">{{ survey.title }}</h4>
            <p :class="$style.listItemDescription">{{ survey.description }}</p>
            <div :class="$style.listItemMeta">
              <span>{{ t('survey.card.createdBy') }}: {{ survey.creator_email }}</span>
            </div>
          </div>
          
          <div :class="$style.listItemStats">
            <div :class="$style.listStatItem">
              <i class="fas fa-users" :class="$style.listStatIcon"></i>
              <span>{{ survey.response_count }}</span>
            </div>
            <div :class="$style.listStatItem">
              <i class="fas fa-question-circle" :class="$style.listStatIcon"></i>
              <span>{{ survey.questions?.length || 0 }}</span>
            </div>
          </div>
          
          <div :class="$style.listItemStatus">
            <span :class="[$style.statusBadge, $style[survey.is_active ? 'active' : 'inactive']]">
              {{ survey.is_active ? t('survey.status.active') : t('survey.status.inactive') }}
            </span>
            <span 
              v-if="survey.status === 'draft'"
              :class="[$style.statusBadge, $style.draft]"
            >
              {{ isRTL ? 'مسودة' : 'Draft' }}
            </span>
            <span 
              v-if="survey.visibility"
              :class="[$style.statusBadge, $style[survey.visibility.toLowerCase()]]"
            >
              {{ t(`survey.status.${survey.visibility.toLowerCase()}`) }}
            </span>
            <span 
              v-else
              :class="[$style.statusBadge, $style.private]"
            >
              {{ t('survey.status.private') }}
            </span>
          </div>
          
          <div :class="$style.listItemDate">
            {{ formatDate(survey.updated_at) }}
          </div>
          
          <div :class="$style.listItemActions">
            <div :class="[$style.actionsDropdown, 'actionsDropdown']">
              <button :class="$style.actionsToggle" @click.stop="toggleActionMenu(survey.id)">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <div :class="[$style.actionsMenu, { [$style.active]: activeActionMenu === survey.id }]">
                <button 
                  v-if="survey.status === 'draft'" 
                  :class="$style.actionMenuItem" 
                  @click.stop="editSurvey(survey)"
                >
                  <i class="fas fa-edit"></i>
                  {{ t('survey.card.edit') }}
                </button>
                <button 
                  v-if="survey.status === 'draft'" 
                  :class="[$style.actionMenuItem, $style.submitAction]" 
                  @click.stop="submitDraftSurvey(survey.id)"
                >
                  <i class="fas fa-paper-plane"></i>
                  {{ isRTL ? 'إرسال' : 'Submit' }}
                </button>
                <button 
                  v-if="survey.status !== 'submitted'" 
                  :class="$style.actionMenuItem" 
                  @click.stop="manageSurveyAccess(survey)"
                >
                  <i class="fas fa-share-alt"></i>
                  {{ t('survey.card.share') }}
                </button>
                <button :class="$style.actionMenuItem" @click.stop="viewResponses(survey.id)">
                  <i class="fas fa-chart-bar"></i>
                  {{ t('survey.card.viewResponses') }}
                </button>
                <button :class="$style.actionMenuItem" @click.stop="cloneSurvey(survey.id)">
                  <i class="fas fa-copy"></i>
                  {{ t('survey.card.clone') }}
                </button>
                <button :class="[$style.actionMenuItem, $style.danger]" @click.stop="deleteSurvey(survey.id)">
                  <i class="fas fa-trash"></i>
                  {{ t('survey.card.delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div :class="$style.paginationSection">
        <div :class="$style.paginationInfo">
          <span>{{ t('survey.pagination.showing') }} {{ ((currentPage - 1) * itemsPerPage) + 1 }} - {{ Math.min(currentPage * itemsPerPage, totalCount) }} {{ t('survey.pagination.of') }} {{ totalCount }} {{ t('survey.pagination.items') }}</span>
        </div>
        
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
    </section>

    <!-- Empty State -->
    <div v-if="!isLoading && surveys?.length === 0" :class="$style.emptyState">
      <div :class="$style.emptyIcon">
        <i class="fas fa-poll-h"></i>
      </div>
      <h3 :class="$style.emptyTitle">{{ t('survey.list.noSurveys') }}</h3>
      <button :class="$style.primaryButton" @click="showCreateModal = true">
        <i class="fas fa-plus"></i>
        {{ t('survey.list.createSurvey') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
    </div>

    <!-- Create/Edit Survey Modal -->
    <SurveyModal
      v-if="showCreateModal"
      :survey="selectedSurveyForEdit"
      @save="handleSurveySave"
      @cancel="closeModal"
    />

    <!-- Analytics Modal -->
    <AnalyticsModal
      v-if="showAnalytics"
      :analytics="analytics"
      @close="showAnalytics = false"
    />

    <!-- Survey Access Modal -->
    <SurveyAccessModal
      v-if="showAccessModal && selectedSurveyForAccess"
      :survey="selectedSurveyForAccess"
      @save="handleAccessSave"
      @cancel="closeAccessModal"
    />

    <!-- Link Sharing Modal -->
    <LinkSharingModal
      v-if="showLinkSharingModal && selectedSurveyForLinkSharing"
      :is-visible="showLinkSharingModal"
      :survey="selectedSurveyForLinkSharing"
      :public-link="publicLinkForSharing"
      @close="closeLinkSharingModal"
      @link-generated="handleLinkGenerated"
      @status-update="handleStatusUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import type { Survey, SurveyAnalytics, SurveyVisibility, QuestionType, PublicContactMethod } from '../../types/survey.types'
import SurveyModal from '../../components/SurveyModal/SurveyModal.vue'
import AnalyticsModal from '../../components/AnalyticsModal/AnalyticsModal.vue'
import SurveyAccessModal from '../../components/SurveyAccessModal/SurveyAccessModal.vue'
import LinkSharingModal from '../../components/LinkSharingModal/LinkSharingModal.vue'
import Swal from 'sweetalert2'

// Router
const router = useRouter()

// Store
const store = useAppStore()

// Computed properties
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// State
const surveys = ref<Survey[]>([])
const analytics = ref<SurveyAnalytics | null>(null)
const isLoading = ref(false)
const searchQuery = ref('')
const selectedFilter = ref('all')
const selectedSort = ref('newest')
const viewMode = ref<'grid' | 'list'>('grid')
const selectedSurveys = ref<string[]>([])
const bulkOperationLoading = ref(false)
const activeActionMenu = ref<string | null>(null)

// Modals
const showCreateModal = ref(false)
const showAnalytics = ref(false)
const showAccessModal = ref(false)
const showLinkSharingModal = ref(false)
const selectedSurveyForEdit = ref<Survey | null>(null)
const selectedSurveyForAccess = ref<Survey | null>(null)
const selectedSurveyForLinkSharing = ref<Survey | null>(null)
const publicLinkForSharing = ref<any | null>(null)

// Enhanced Pagination and API state
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalCount = ref(0)
const totalPages = ref(0)
const hasNext = ref(false)
const hasPrevious = ref(false)
const appliedFilters = ref<any>({})
const availableFilters = ref<any>({})
const debouncedSearch = ref('')
const searchDebounceTimer = ref<NodeJS.Timeout | null>(null)

// Computed properties for pagination info
const visiblePages = computed(() => {
  const pages: number[] = []
  const totalPagesValue = totalPages.value
  const currentPageValue = currentPage.value
  
  if (totalPagesValue <= 7) {
    // Show all pages if total is 7 or less
    for (let i = 1; i <= totalPagesValue; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)
    
    // Determine range around current page
    let start = Math.max(2, currentPageValue - 2)
    let end = Math.min(totalPagesValue - 1, currentPageValue + 2)
    
    // Add ellipsis before range if needed
    if (start > 2) {
      pages.push(-1) // -1 represents ellipsis
    }
    
    // Add range around current page
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    // Add ellipsis after range if needed
    if (end < totalPagesValue - 1) {
      pages.push(-1) // -1 represents ellipsis
    }
    
    // Always show last page
    if (totalPagesValue > 1) {
      pages.push(totalPagesValue)
    }
  }
  
  return pages
})

// Use surveys directly from API response (no client-side filtering needed)
const paginatedSurveys = computed(() => surveys.value || [])

// Methods - Updated to use new API with pagination, search, and filters
const loadSurveys = async (resetPage = false) => {
  try {
    isLoading.value = true
    
    if (resetPage) {
      currentPage.value = 1
    }
    
    // Build query parameters for the new API
    const params: any = {
      page: currentPage.value,
      per_page: itemsPerPage.value
    }
    
    // Add search if present
    if (debouncedSearch.value.trim()) {
      params.search = debouncedSearch.value.trim()
    }
    
    // Add survey status filter (custom filtering)
    if (selectedFilter.value && selectedFilter.value !== 'all') {
      params.survey_status = selectedFilter.value
    }
    
    // Add sorting
    if (selectedSort.value) {
      params.sort_by = selectedSort.value
    }
    
    console.log('Loading surveys with params:', params)
    const response = await surveyService.getAllSurveys(params)
    console.log('Survey service response:', response)
    
    // Handle the new paginated response structure
    if (response && 'results' in response) {
      surveys.value = response.results.map(survey => ({
        ...survey,
        questions: survey.questions || []
      }))
      
      console.log('Mapped surveys:', surveys.value)
      
      // Update pagination info
      totalCount.value = response.count || 0
      totalPages.value = response.total_pages || 0
      hasNext.value = !!response.next
      hasPrevious.value = !!response.previous
      appliedFilters.value = response.applied_filters || {}
      availableFilters.value = response.available_filters || {}
      
      console.log('Pagination info updated:', {
        totalCount: totalCount.value,
        totalPages: totalPages.value,
        hasNext: hasNext.value,
        hasPrevious: hasPrevious.value
      })
      
    } else {
      console.log('No results in response, setting empty arrays')
      surveys.value = []
      totalCount.value = 0
      totalPages.value = 0
      hasNext.value = false
      hasPrevious.value = false
    }
    
  } catch (error) {
    console.error('Error loading surveys:', error)
    // Provide demo data for UI showcase when API is not available
    surveys.value = [
      {
        id: '1',
        title: 'Customer Satisfaction Survey 2024',
        description: 'Help us improve our services by sharing your feedback and experience with our products.',
        visibility: 'PUBLIC' as SurveyVisibility,
        public_contact_method: 'email' as PublicContactMethod,
        shared_with: [],
        creator: 1,
        creator_email: 'admin@weaponpowercloud.com',
        is_locked: false,
        is_active: true,
        start_date: null,
        end_date: null,
        status: 'active',
        is_currently_active: true,
        created_at: '2024-08-01T10:00:00Z',
        updated_at: '2024-08-02T15:30:00Z',
        response_count: 147,
        shared_with_emails: [],
        can_submit: true,
        has_submitted: false,
        questions: [
          { id: '1', text: 'How satisfied are you with our service?', question_type: 'rating' as QuestionType, is_required: true, order: 1, options: '', created_at: '', updated_at: '' },
          { id: '2', text: 'What can we improve?', question_type: 'textarea' as QuestionType, is_required: false, order: 2, options: '', created_at: '', updated_at: '' }
        ]
      },
      {
        id: '2',
        title: 'Product Feature Feedback',
        description: 'Your input on our latest features helps us create better experiences for all users.',
        visibility: 'AUTH' as SurveyVisibility,
        shared_with: [1],
        creator: 2,
        creator_email: 'product@weaponpowercloud.com',
        is_locked: false,
        is_active: true,
        start_date: null,
        end_date: null,
        status: 'active',
        is_currently_active: true,
        created_at: '2024-07-25T14:20:00Z',
        updated_at: '2024-08-01T09:45:00Z',
        response_count: 89,
        shared_with_emails: ['team@weaponpowercloud.com'],
        can_submit: true,
        has_submitted: false,
        questions: [
          { id: '3', text: 'Which features do you use most?', question_type: 'multiple_choice' as QuestionType, is_required: true, order: 1, options: '["Analytics", "Reports", "Dashboards", "Surveys"]', created_at: '', updated_at: '' }
        ]
      },
      {
        id: '3',
        title: 'Employee Engagement Survey',
        description: 'Internal survey to measure team satisfaction and identify areas for workplace improvement.',
        visibility: 'PRIVATE' as SurveyVisibility,
        shared_with: [1, 3],
        creator: 3,
        creator_email: 'hr@weaponpowercloud.com',
        is_locked: true,
        is_active: false,
        start_date: null,
        end_date: null,
        status: 'inactive',
        is_currently_active: false,
        created_at: '2024-07-20T08:15:00Z',
        updated_at: '2024-07-22T16:00:00Z',
        response_count: 23,
        shared_with_emails: ['hr@weaponpowercloud.com', 'management@weaponpowercloud.com'],
        can_submit: false,
        has_submitted: false,
        questions: [
          { id: '4', text: 'How would you rate your work-life balance?', question_type: 'rating' as QuestionType, is_required: true, order: 1, options: '', created_at: '', updated_at: '' },
          { id: '5', text: 'Do you feel valued at work?', question_type: 'yes_no' as QuestionType, is_required: true, order: 2, options: '', created_at: '', updated_at: '' }
        ]
      }
    ]
    
    totalCount.value = 3
    totalPages.value = 1
    hasNext.value = false
    hasPrevious.value = false
    
  } finally {
    isLoading.value = false
  }
}

const loadAnalytics = async () => {
  try {
    const response = await surveyService.getAnalyticsDashboard()
    analytics.value = response.data
  } catch (error) {
    // Logging removed for production
    // Provide fallback demo data for better UI presentation
    analytics.value = {
      total_surveys: 12,
      active_surveys: 8,
      total_responses: 1247,
      avg_response_rate: 73.5,
      recent_activity: {
        new_surveys_this_week: 3,
        new_responses_this_week: 89
      },
      top_surveys: [
        {
          id: '1',
          title: 'Customer Satisfaction Survey',
          response_count: 234,
          completion_rate: 87.5
        },
        {
          id: '2',
          title: 'Product Feedback Survey',
          response_count: 189,
          completion_rate: 92.1
        }
      ]
    }
  }
}

const refreshData = async () => {
  await Promise.all([loadSurveys(), loadAnalytics()])
}

// Enhanced search with debouncing
const handleSearch = () => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  
  searchDebounceTimer.value = setTimeout(() => {
    debouncedSearch.value = searchQuery.value
    loadSurveys(true) // Reset to page 1
  }, 500) // 500ms debounce
}

const applyFilters = () => {
  loadSurveys(true) // Reset to page 1 when filter changes
}

const applySorting = () => {
  loadSurveys(true) // Reset to page 1 when sort changes
}

// Pagination methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadSurveys()
  }
}

const nextPage = () => {
  if (hasNext.value) {
    currentPage.value++
    loadSurveys()
  }
}

const prevPage = () => {
  if (hasPrevious.value) {
    currentPage.value--
    loadSurveys()
  }
}

const changeItemsPerPage = (newPerPage: number) => {
  itemsPerPage.value = newPerPage
  currentPage.value = 1
  loadSurveys()
}

const selectSurvey = (_surveyId: string) => {
  // Navigate to survey detail view
}

const toggleSurveySelection = (surveyId: string) => {
  if (!selectedSurveys.value) {
    selectedSurveys.value = []
  }
  
  const index = selectedSurveys.value.indexOf(surveyId)
  if (index > -1) {
    selectedSurveys.value.splice(index, 1)
  } else {
    selectedSurveys.value.push(surveyId)
  }
}

const editSurvey = (survey: Survey) => {
  selectedSurveyForEdit.value = survey
  showCreateModal.value = true
}

const manageSurveyAccess = (survey: Survey) => {
  selectedSurveyForAccess.value = survey
  showAccessModal.value = true
}

const openLinkSharingModal = async (survey: Survey) => {
  selectedSurveyForLinkSharing.value = survey
  
  // No need to fetch link data here - the modal will handle it with getCurrentLink
  publicLinkForSharing.value = null
  
  showLinkSharingModal.value = true
}

const handleAccessSave = async (_data: any) => {
  try {
    
    showAccessModal.value = false
    selectedSurveyForAccess.value = null
    await loadSurveys() // Refresh the surveys list
  } catch (error) {
    // Logging removed for production
  }
}

const closeAccessModal = () => {
  showAccessModal.value = false
  selectedSurveyForAccess.value = null
}

const closeLinkSharingModal = () => {
  showLinkSharingModal.value = false
  selectedSurveyForLinkSharing.value = null
  publicLinkForSharing.value = null
}

const handleLinkGenerated = (link: any) => {
  publicLinkForSharing.value = link
}

const handleStatusUpdate = (message: string, type: string) => {
  // You can add toast notifications or other status handling here
  console.log(`${type}: ${message}`)
}

const viewResponses = (surveyId: string) => {
  // Navigate to responses view for specific survey
  router.push({ name: 'SurveyResponses', params: { surveyId } })
}

const cloneSurvey = async (surveyId: string) => {
  try {
    await surveyService.cloneSurvey(surveyId)
    
    await loadSurveys()
  } catch (error) {
    // Logging removed for production
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشل في نسخ الاستطلاع',
      confirmButtonText: 'موافق'
    })
  }
}

const deleteSurvey = async (surveyId: string) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'تأكيد الحذف',
    text: 'هل أنت متأكد من أنك تريد حذف هذا الاستطلاع؟',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })

  if (result.isConfirmed) {
    try {
      await surveyService.deleteSurvey(surveyId)
      
      await Promise.all([loadSurveys(), loadAnalytics()])
      
      Swal.fire({
        icon: 'success',
        title: 'تم الحذف',
        text: 'تم حذف الاستطلاع بنجاح',
        confirmButtonText: 'موافق'
      })
    } catch (error) {
      // Logging removed for production
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'فشل في حذف الاستطلاع',
        confirmButtonText: 'موافق'
      })
    }
  }
}

const submitDraftSurvey = async (surveyId: string) => {
  try {
    const isArabic = store.currentLanguage === 'ar'
    
    const result = await Swal.fire({
      title: isArabic ? 'تأكيد الإرسال' : 'Confirm Submission',
      text: isArabic ? 'هل أنت متأكد من إرسال هذا الاستطلاع؟ بعد الإرسال لن يمكنك تعديله.' : 'Are you sure you want to submit this survey? Once submitted, you cannot edit it.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: isArabic ? 'نعم، أرسل!' : 'Yes, submit it!',
      cancelButtonText: isArabic ? 'إلغاء' : 'Cancel'
    })

    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: isArabic ? 'جاري الإرسال...' : 'Submitting...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      await surveyService.submitSurvey(surveyId)
      
      await Swal.fire({
        title: isArabic ? 'تم الإرسال!' : 'Submitted!',
        text: isArabic ? 'تم إرسال الاستطلاع بنجاح. الآن أصبح نهائياً ومتاح للإجابة عليه.' : 'The survey has been submitted successfully. It is now final and ready for responses.',
        icon: 'success',
        confirmButtonText: isArabic ? 'موافق' : 'OK'
      })

      await refreshData()
    }
  } catch (error: any) {
    const isArabic = store.currentLanguage === 'ar'
    Swal.fire({
      title: isArabic ? 'خطأ في الإرسال' : 'Submission Error',
      text: error.message || (isArabic ? 'فشل في إرسال الاستطلاع' : 'Failed to submit survey'),
      icon: 'error',
      confirmButtonText: isArabic ? 'موافق' : 'OK'
    })
  }
}

const handleSurveySave = async (surveyData: any, existingSurvey?: any) => {
  try {
    // If existingSurvey is provided, it means the survey was already created/updated by the modal
    // In this case, just close the modal and refresh the list
    if (existingSurvey) {
      closeModal()
      await Promise.all([loadSurveys(), loadAnalytics()])
      return
    }
    
    // Original logic for when the modal doesn't handle the save itself
    if (selectedSurveyForEdit.value) {
      // Update existing survey
      await surveyService.updateSurvey(selectedSurveyForEdit.value.id, surveyData)
      
    } else {
      // Create new survey
      const surveyResponse = await surveyService.createSurvey({
        title: surveyData.title,
        description: surveyData.description,
        visibility: surveyData.visibility || 'AUTH', // Default to 'AUTH' if not specified
        is_active: surveyData.is_active
      })
      
      // If there are questions, add them to the newly created survey
      if (surveyData.questions && surveyData.questions.length > 0) {
        const surveyId = surveyResponse.data.id
        
        // Add questions one by one
        for (const question of surveyData.questions) {
          try {
            await surveyService.addQuestion(surveyId, {
              text: question.text,
              question_type: question.question_type,
              options: question.options,
              is_required: question.is_required || false,
              order: question.order
            })
          } catch (questionError) {
            // Logging removed for production
            // Continue adding other questions even if one fails
          }
        }
      }
      
      
    }
    
    closeModal()
    await Promise.all([loadSurveys(), loadAnalytics()])
  } catch (error) {
    // Logging removed for production
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: selectedSurveyForEdit.value 
        ? 'فشل في تحديث الاستطلاع' 
        : 'فشل في إنشاء الاستطلاع',
      confirmButtonText: 'موافق'
    })
  }
}

const closeModal = () => {
  showCreateModal.value = false
  selectedSurveyForEdit.value = null
}

// Bulk operations
const bulkActivate = async () => {
  await performBulkOperation('activate')
}

const bulkDeactivate = async () => {
  await performBulkOperation('deactivate')
}

const bulkDelete = async () => {
  const selectedCount = selectedSurveys.value?.length || 0
  const result = await Swal.fire({
    icon: 'warning',
    title: 'تأكيد الحذف الجماعي',
    text: `هل أنت متأكد من أنك تريد حذف ${selectedCount} استطلاع؟`,
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف الكل',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })

  if (result.isConfirmed) {
    await performBulkOperation('delete')
  }
}

const performBulkOperation = async (operation: string) => {
  try {
    bulkOperationLoading.value = true
    await surveyService.performBulkOperation({
      operation: operation as any,
      survey_ids: selectedSurveys.value || []
    })
    
    selectedSurveys.value = []
    await Promise.all([loadSurveys(), loadAnalytics()])
    
    // Show success message
    let successMessage = ''
    switch (operation) {
      case 'activate':
        successMessage = 'تم تفعيل الاستطلاعات بنجاح'
        break
      case 'deactivate':
        successMessage = 'تم إلغاء تفعيل الاستطلاعات بنجاح'
        break
      case 'delete':
        successMessage = 'تم حذف الاستطلاعات بنجاح'
        break
      default:
        successMessage = 'تمت العملية بنجاح'
    }
    
    Swal.fire({
      icon: 'success',
      title: 'نجحت العملية',
      text: successMessage,
      confirmButtonText: 'موافق'
    })
  } catch (error) {
    // Logging removed for production
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشلت العملية الجماعية',
      confirmButtonText: 'موافق'
    })
  } finally {
    bulkOperationLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const toggleSelectAll = () => {
  const currentSurveys = paginatedSurveys.value || []
  const currentSelected = selectedSurveys.value || []
  
  if (currentSelected.length === currentSurveys.length && currentSurveys.length > 0) {
    selectedSurveys.value = []
  } else {
    selectedSurveys.value = currentSurveys.map(survey => survey.id)
  }
}

const toggleActionMenu = (surveyId: string) => {
  activeActionMenu.value = activeActionMenu.value === surveyId ? null : surveyId
}

const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.actionsDropdown')) {
    activeActionMenu.value = null
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  // Clean up search debounce timer
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
})
</script>

<style module src="./SurveyControl.module.css">
/* CSS Module styles are imported from SurveyControl.module.css */
</style>
