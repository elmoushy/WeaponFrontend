<template>
  <div :class="styles.controlPage" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header -->
    <header :class="styles.header">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col">
            <nav :class="styles.breadcrumb">
              <router-link to="/control" :class="styles.breadcrumbLink">
                <i class="fas fa-arrow-left"></i>
                {{ t('control.backToControlPanel') || 'Back to Control Panel' }}
              </router-link>
            </nav>
            <h1 :class="styles.title">{{ t('control.newsManagement.title') || 'News Management Control Panel' }}</h1>
            <p :class="styles.subtitle">{{ t('control.newsManagement.subtitle') || 'Manage slider news, cards news, and achievements' }}</p>
          </div>
          <div class="col-auto">
            <button @click="refreshAllData" :disabled="loading" :class="[styles.btnGlass, styles.btnOutline]">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-arrow-clockwise"></i>
              {{ t('control.refresh') || 'Refresh Data' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" :class="[styles.alertGlass, styles.alertSuccess]" role="alert">
      <div class="d-flex align-items-center">
        <i class="bi bi-check-circle-fill me-2"></i>
        {{ successMessage }}
        <button type="button" :class="styles.closeBtn" @click="clearMessages" style="margin-left: auto; background: none; border: none; color: inherit;">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
    
    <div v-if="error" :class="[styles.alertGlass, styles.alertError]" role="alert">
      <div class="d-flex align-items-center">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ error }}
        <button type="button" :class="styles.closeBtn" @click="clearMessages" style="margin-left: auto; background: none; border: none; color: inherit;">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <nav :class="styles.tabNav">
      <div class="container-fluid">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <button 
              @click="activeTab = 'slider'" 
              :class="['nav-link', { active: activeTab === 'slider' }]"
            >
              {{ t('control.tabs.slider') || 'Slider News' }} 
              <span class="badge bg-secondary ms-2">{{ Array.isArray(sliderNews) ? sliderNews.length : 0 }}</span>
            </button>
          </li>
          <li class="nav-item">
            <button 
              @click="activeTab = 'cards'" 
              :class="['nav-link', { active: activeTab === 'cards' }]"
            >
              {{ t('control.tabs.cards') || 'Cards News' }} 
              <span class="badge bg-secondary ms-2">{{ Array.isArray(cardsNews) ? cardsNews.length : 0 }}</span>
            </button>
          </li>
          <li class="nav-item">
            <button 
              @click="activeTab = 'achievements'" 
              :class="['nav-link', { active: activeTab === 'achievements' }]"
            >
              {{ t('control.tabs.achievements') || 'Achievements' }} 
              <span class="badge bg-secondary ms-2">{{ Array.isArray(achievements) ? achievements.length : 0 }}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Tab Content -->
    <main :class="styles.content">
      <div class="container-fluid">
        <!-- Slider News Tab -->
        <div v-if="activeTab === 'slider'" :class="styles.tabContent">
          <div class="row mb-4">
            <div class="col">
              <h2>{{ t('control.slider.title') || 'Slider News Management' }}</h2>
              <p class="text-muted">{{ t('control.slider.description') || 'Manage homepage slider/banner news items' }}</p>
            </div>
            <div class="col-auto">
              <button @click="openCreateModal('slider')" :disabled="loading" :class="[styles.btnGlass, styles.btnPrimary]">
                <i class="bi bi-plus-lg"></i>
                {{ t('control.slider.create') || 'Add Slider News' }}
              </button>
            </div>
          </div>

          <!-- Slider News List -->
          <div v-if="loading" :class="styles.loadingGlass">
            <div :class="styles.spinnerGlass"></div>
            <p class="mt-3 text-muted">{{ t('control.loading') || 'Loading slider news...' }}</p>
          </div>
          
          <div v-else-if="!Array.isArray(sliderNews) || sliderNews.length === 0" class="text-center py-5">
            <i class="bi bi-newspaper" style="font-size: 3rem; color: var(--text-muted);"></i>
            <p class="mt-3 text-muted">{{ t('control.slider.empty') || 'No slider news found. Create your first one!' }}</p>
          </div>
          
          <div v-else class="row g-4">
            <div v-for="item in Array.isArray(sliderNews) ? sliderNews.filter(item => item != null) : []" :key="item.id" class="col-12 col-lg-6 col-xl-4">
              <div :class="styles.newsCard">
                <div :class="styles.cardImage" :style="getCardImageStyle(item.main_image)">
                  <div :class="styles.cardOverlay">
                    <div :class="styles.cardActions">
                      <!-- <button 
                        @click="editItem('slider', item)" 
                        :disabled="saving" 
                        :class="[styles.actionBtn, styles.editBtn]"
                        :title="t('control.edit') || 'Edit'"
                      >
                        <i class="bi bi-pencil"></i>
                      </button> -->
                      <button 
                        @click="deleteItem('slider', item.id)" 
                        :disabled="saving"
                        :class="[styles.actionBtn, styles.deleteBtn]"
                        :title="t('control.delete') || 'Delete'"
                      >
                        <span v-if="saving" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div v-if="item.is_featured" :class="styles.featuredBadge">⭐</div>
                </div>
                <div :class="styles.cardContent">
                  <h5>{{ isRTL ? item.title_arabic : item.title_english }}</h5>
                  <p :class="styles.description">{{ item.description }}</p>
                  <div :class="styles.cardMeta">
                    <span :class="styles.date">{{ formatDate(item.date) }}</span>
                  </div>
                  <div :class="styles.cardFooter">
                    <span :class="[styles.status, item.is_active ? styles.active : styles.inactive]">
                      {{ item.is_active ? (t('control.status.active') || 'Active') : (t('control.status.inactive') || 'Inactive') }}
                    </span>
                    <span :class="styles.duration">{{ item.display_duration }}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cards News Tab -->
        <div v-if="activeTab === 'cards'" :class="styles.tabContent">
          <div class="row mb-4">
            <div class="col">
              <h2>{{ t('control.cards.title') || 'Cards News Management' }}</h2>
              <p class="text-muted">{{ t('control.cards.description') || 'Manage main news articles and cards' }}</p>
            </div>
            <div class="col-auto">
              <button @click="openCreateModal('cards')" :disabled="loading" :class="[styles.btnGlass, styles.btnPrimary]">
                <i class="bi bi-plus-lg"></i>
                {{ t('control.cards.create') || 'Add Cards News' }}
              </button>
            </div>
          </div>

          <!-- Cards News List -->
          <div v-if="loading" :class="styles.loadingGlass">
            <div :class="styles.spinnerGlass"></div>
            <p class="mt-3 text-muted">{{ t('control.loading') || 'Loading cards news...' }}</p>
          </div>
          
          <div v-else-if="!Array.isArray(cardsNews) || cardsNews.length === 0" class="text-center py-5">
            <i class="bi bi-card-text" style="font-size: 3rem; color: var(--text-muted);"></i>
            <p class="mt-3 text-muted">{{ t('control.cards.empty') || 'No cards news found. Create your first one!' }}</p>
          </div>
          
          <div v-else class="row g-4">
            <div v-for="item in Array.isArray(cardsNews) ? cardsNews.filter(item => item != null) : []" :key="item.id" class="col-12 col-lg-6 col-xl-4">
              <div :class="styles.newsCard">
                <div :class="styles.cardImage" :style="getCardImageStyle(item.main_image)">
                  <div :class="styles.cardOverlay">
                    <div :class="styles.cardActions">
                      <button 
                        @click="editItem('cards', item)" 
                        :disabled="saving" 
                        :class="[styles.actionBtn, styles.editBtn]"
                        :title="t('control.edit') || 'Edit'"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button 
                        @click="deleteItem('cards', item.id)" 
                        :disabled="saving"
                        :class="[styles.actionBtn, styles.deleteBtn]"
                        :title="t('control.delete') || 'Delete'"
                      >
                        <span v-if="saving" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div v-if="item.is_featured" :class="styles.featuredBadge">⭐</div>
                </div>
                <div :class="styles.cardContent">
                  <h5>{{ isRTL ? item.title_arabic : item.title_english }}</h5>
                  <p :class="styles.description">{{ item.description }}</p>
                  <div :class="styles.cardMeta">
                    <span :class="styles.date">{{ formatDate(item.date) }}</span>
                  </div>
                  <div :class="styles.cardFooter">
                    <span :class="[styles.status, item.is_active ? styles.active : styles.inactive]">
                      {{ item.is_active ? (t('control.status.active') || 'Active') : (t('control.status.inactive') || 'Inactive') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Achievements Tab -->
        <div v-if="activeTab === 'achievements'" :class="styles.tabContent">
          <div class="row mb-4">
            <div class="col">
              <h2>{{ t('control.achievements.title') || 'Achievements Management' }}</h2>
              <p class="text-muted">{{ t('control.achievements.description') || 'Manage achievements and accomplishments' }}</p>
            </div>
            <div class="col-auto">
              <button @click="openCreateModal('achievements')" :disabled="loading" :class="[styles.btnGlass, styles.btnPrimary]">
                <i class="bi bi-plus-lg"></i>
                {{ t('control.achievements.create') || 'Add Achievement' }}
              </button>
            </div>
          </div>

          <!-- Achievements List -->
          <div v-if="loading" :class="styles.loadingGlass">
            <div :class="styles.spinnerGlass"></div>
            <p class="mt-3 text-muted">{{ t('control.loading') || 'Loading achievements...' }}</p>
          </div>
          
          <div v-else-if="!Array.isArray(achievements) || achievements.length === 0" class="text-center py-5">
            <i class="bi bi-trophy" style="font-size: 3rem; color: var(--text-muted);"></i>
            <p class="mt-3 text-muted">{{ t('control.achievements.empty') || 'No achievements found. Create your first one!' }}</p>
          </div>
          
          <div v-else class="row g-4">
            <div v-for="item in Array.isArray(achievements) ? achievements.filter(item => item != null) : []" :key="item.id" class="col-12 col-lg-6 col-xl-4">
              <div :class="styles.newsCard">
                <div :class="styles.cardImage" :style="getCardImageStyle(item.main_image)">
                  <div :class="styles.cardOverlay">
                    <div :class="styles.cardActions">
                      <button 
                        @click="editItem('achievements', item)" 
                        :disabled="saving" 
                        :class="[styles.actionBtn, styles.editBtn]"
                        :title="t('control.edit') || 'Edit'"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button 
                        @click="deleteItem('achievements', item.id)" 
                        :disabled="saving"
                        :class="[styles.actionBtn, styles.deleteBtn]"
                        :title="t('control.delete') || 'Delete'"
                      >
                        <span v-if="saving" class="spinner-border spinner-border-sm"></span>
                        <i v-else class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div v-if="item.is_featured" :class="styles.featuredBadge">⭐</div>
                </div>
                <div :class="styles.cardContent">
                  <h5>{{ isRTL ? item.title_arabic : item.title_english }}</h5>
                  <p :class="styles.description">{{ item.description }}</p>
                  <div :class="styles.cardMeta">
                    <span :class="styles.date">{{ formatDate(item.achievement_date) }}</span>
                  </div>
                  <div :class="styles.cardFooter">
                    <span :class="[styles.status, item.is_active ? styles.active : styles.inactive]">
                      {{ item.is_active ? (t('control.status.active') || 'Active') : (t('control.status.inactive') || 'Inactive') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Control Modal Component -->
    <ControlModal
      :isVisible="showModal"
      :modalMode="modalMode"
      :modalType="modalType"
      :formData="formData"
      :mainImagePreview="mainImagePreview"
      :loading="saving"
      @close="closeModal"
      @submit="handleSubmitForm"
      @imageUpload="handleModalImageUpload"
      @imageRemove="removeImagePreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, nextTick } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import { useAdminNews } from '../../composables/useNews'
import ControlModal from '../../components/ControlModal/ControlModal.vue'
import type { 
  SliderNews, 
  CardsNews, 
  Achievement, 
  NewsCategory,
  CreateSliderNewsRequest,
  CreateCardsNewsRequest,
  CreateAchievementRequest
} from '../../types/news.types'
import styles from './NewsControl.module.css'

const { t, currentTheme, isRTL } = useI18n()

// Admin news composable
const {
  sliderNews,
  cardsNews,
  achievements,
  loading,
  saving,
  error,
  successMessage,
  sliderNewsOps,
  cardsNewsOps,
  achievementsOps,
  clearMessages,
  validateImageFile,
  formatDate
} = useAdminNews()

// UI State
const activeTab = ref<'slider' | 'cards' | 'achievements'>('slider')
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalType = ref<'slider' | 'cards' | 'achievements'>('slider')
const editingItem = ref<SliderNews | CardsNews | Achievement | null>(null)
const mainImagePreview = ref<string | null>(null)
const mainImageFile = ref<File | null>(null)
const firstInput = ref<HTMLInputElement | null>(null)

// Form Data
const formData = reactive({
  title_arabic: '',
  title_english: '',
  description: '',
  category: 'general' as NewsCategory,
  priority: 50,
  display_duration: 8,
  achievement_date: '',
  date: '',
  is_featured: false,
  is_active: true
})

// Initialize data
const initializeData = async () => {
  await Promise.all([
    sliderNewsOps.loadAll(),
    cardsNewsOps.loadAll(),
    achievementsOps.loadAll()
  ])
}

// Refresh all data
const refreshAllData = async () => {
  await initializeData()
}

// Reset form
const resetForm = () => {
  formData.title_arabic = ''
  formData.title_english = ''
  formData.description = ''
  formData.category = 'general'
  formData.priority = 50
  formData.display_duration = 8
  formData.achievement_date = ''
  formData.date = ''
  formData.is_featured = false
  formData.is_active = true
  mainImagePreview.value = null
  mainImageFile.value = null
  editingItem.value = null
}

// Open create modal
const openCreateModal = async (type: 'slider' | 'cards' | 'achievements') => {
  modalMode.value = 'create'
  modalType.value = type
  resetForm()
  showModal.value = true
  
  // Focus first input after modal is rendered
  await nextTick()
  firstInput.value?.focus()
}

// Edit item
const editItem = async (type: 'slider' | 'cards' | 'achievements', item: SliderNews | CardsNews | Achievement) => {
  modalMode.value = 'edit'
  modalType.value = type
  editingItem.value = item
  
  // Populate form
  formData.title_arabic = item.title_arabic
  formData.title_english = item.title_english
  formData.description = item.description
  formData.category = item.category
  formData.is_featured = item.is_featured
  formData.is_active = item.is_active
  
  if (type === 'slider' && 'priority' in item) {
    formData.priority = item.priority
    formData.display_duration = item.display_duration
  }
  
  if (type === 'achievements' && 'achievement_date' in item) {
    formData.achievement_date = item.achievement_date.split('T')[0] // Format for date input
  }
  
  if (type === 'cards' && 'date' in item) {
    formData.date = item.date.split('T')[0] // Format for date input
  }
  
  if (item.main_image) {
    mainImagePreview.value = item.main_image
  }
  
  showModal.value = true
  
  // Focus first input after modal is rendered
  await nextTick()
  firstInput.value?.focus()
}

// Close modal
const closeModal = () => {
  // Check for unsaved changes
  const hasChanges = formData.title_arabic || formData.title_english || formData.description || mainImageFile.value
  
  if (hasChanges && modalMode.value === 'create') {
    if (!confirm(t('control.confirmClose') || 'You have unsaved changes. Are you sure you want to close?')) {
      return
    }
  }
  
  showModal.value = false
  resetForm()
  clearMessages()
}

// Handle image upload from modal component (receives File directly)
const handleModalImageUpload = (file: File) => {
  // Validate image file
  const validation = validateImageFile(file)
  if (!validation.valid) {
    error.value = validation.error || 'Invalid image file'
    return
  }
  
  mainImageFile.value = file
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    mainImagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// Remove image preview
const removeImagePreview = () => {
  mainImagePreview.value = null
  mainImageFile.value = null
}

// Handle form submission from modal
const handleSubmitForm = (modalFormData: any, imageFile: File | null) => {
  // Update the main form data with data from modal
  Object.assign(formData, modalFormData)
  
  // Update image file if provided
  if (imageFile) {
    mainImageFile.value = imageFile
  }
  
  // Call the existing submit form method
  submitForm()
}

// Submit form
const submitForm = async () => {
  // Validate required fields
  if (!formData.title_arabic.trim()) {
    error.value = t('control.errors.titleArabicRequired') || 'Arabic title is required'
    return
  }
  
  if (!formData.title_english.trim()) {
    error.value = t('control.errors.titleEnglishRequired') || 'English title is required'
    return
  }
  
  if (!formData.description.trim()) {
    error.value = t('control.errors.descriptionRequired') || 'Description is required'
    return
  }
  
  // Validate priority for slider news
  if (modalType.value === 'slider' && (formData.priority < 1 || formData.priority > 100)) {
    error.value = t('control.errors.priorityRange') || 'Priority must be between 1 and 100'
    return
  }
  
  // Validate display duration for slider news
  if (modalType.value === 'slider' && (formData.display_duration < 3 || formData.display_duration > 30)) {
    error.value = t('control.errors.durationRange') || 'Display duration must be between 3 and 30 seconds'
    return
  }
  
  clearMessages() // Clear any previous error messages
  
  try {
    if (modalMode.value === 'create') {
      // Create new item
      let newItem: SliderNews | CardsNews | Achievement
      
      if (modalType.value === 'slider') {
        const data: CreateSliderNewsRequest = {
          title_arabic: formData.title_arabic,
          title_english: formData.title_english,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          display_duration: formData.display_duration,
          is_featured: formData.is_featured,
          is_active: formData.is_active
        }
        newItem = await sliderNewsOps.create(data)
      } else if (modalType.value === 'cards') {
        const data: CreateCardsNewsRequest = {
          title_arabic: formData.title_arabic,
          title_english: formData.title_english,
          description: formData.description,
          category: formData.category,
          date: formData.date || undefined,
          is_featured: formData.is_featured,
          is_active: formData.is_active
        }
        newItem = await cardsNewsOps.create(data)
      } else {
        const data: CreateAchievementRequest = {
          title_arabic: formData.title_arabic,
          title_english: formData.title_english,
          description: formData.description,
          category: formData.category,
          achievement_date: formData.achievement_date || undefined,
          is_featured: formData.is_featured,
          is_active: formData.is_active
        }
        newItem = await achievementsOps.create(data)
      }
      
      // Upload main image if provided
      if (mainImageFile.value && newItem) {
        if (modalType.value === 'slider') {
          await sliderNewsOps.updateMainImage(newItem.id, mainImageFile.value)
        } else if (modalType.value === 'cards') {
          await cardsNewsOps.updateMainImage(newItem.id, mainImageFile.value)
        } else if (modalType.value === 'achievements') {
          await achievementsOps.updateMainImage(newItem.id, mainImageFile.value)
        }
      }
    } else {
      // Update existing item
      if (!editingItem.value) return
      
      if (modalType.value === 'slider') {
        const data = {
          title_arabic: formData.title_arabic,
          title_english: formData.title_english,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          display_duration: formData.display_duration,
          is_featured: formData.is_featured,
          is_active: formData.is_active
        }
        await sliderNewsOps.update(editingItem.value.id, data)
        
        // Update main image if new one provided
        if (mainImageFile.value) {
          await sliderNewsOps.updateMainImage(editingItem.value.id, mainImageFile.value)
        }
      } else if (modalType.value === 'cards') {
        const data = {
          title_arabic: formData.title_arabic,
          title_english: formData.title_english,
          description: formData.description,
          category: formData.category,
          date: formData.date || undefined,
          is_featured: formData.is_featured,
          is_active: formData.is_active
        }
        await cardsNewsOps.update(editingItem.value.id, data)
        
        // Update main image if new one provided
        if (mainImageFile.value) {
          await cardsNewsOps.updateMainImage(editingItem.value.id, mainImageFile.value)
        }
      } else {
        const data = {
          title_arabic: formData.title_arabic,
          title_english: formData.title_english,
          description: formData.description,
          category: formData.category,
          achievement_date: formData.achievement_date || undefined,
          is_featured: formData.is_featured,
          is_active: formData.is_active
        }
        await achievementsOps.update(editingItem.value.id, data)
        
        // Update main image if new one provided
        if (mainImageFile.value) {
          await achievementsOps.updateMainImage(editingItem.value.id, mainImageFile.value)
        }
      }
    }
    
    closeModal()
    
    // Show success message based on action
    if (modalMode.value === 'create') {
      successMessage.value = t(`control.success.${modalType.value}Created`) || `${modalType.value} created successfully`
    } else {
      successMessage.value = t(`control.success.${modalType.value}Updated`) || `${modalType.value} updated successfully`
    }
    
  } catch (err: any) {
    console.error('Form submission error:', err)
    error.value = err.message || t('control.errors.submitFailed') || 'Failed to submit form'
  }
}

// Delete item
const deleteItem = async (type: 'slider' | 'cards' | 'achievements', id: number) => {
  const itemName = type === 'slider' ? 'slider news' : type === 'cards' ? 'cards news' : 'achievement'
  
  if (!confirm(t('control.confirmDelete') || `Are you sure you want to delete this ${itemName}?`)) {
    return
  }
  
  try {
    if (type === 'slider') {
      await sliderNewsOps.delete(id)
    } else if (type === 'cards') {
      await cardsNewsOps.delete(id)
    } else {
      await achievementsOps.delete(id)
    }
    
    successMessage.value = t(`control.success.${type}Deleted`) || `${itemName} deleted successfully`
  } catch (err: any) {
    console.error('Delete error:', err)
    error.value = err.message || t('control.errors.deleteFailed') || `Failed to delete ${itemName}`
  }
}

// Helper function to get card image style
const getCardImageStyle = (mainImage: string | undefined) => {
  if (!mainImage) {
    return { 
      backgroundImage: 'none',
      backgroundColor: 'var(--bg-secondary, #f8f9fa)'
    }
  }
  
  // Ensure the image has proper data URL format
  let imageUrl = mainImage
  if (!mainImage.startsWith('data:') && !mainImage.startsWith('http')) {
    imageUrl = `data:image/jpeg;base64,${mainImage}`
  }
  
  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
}

onMounted(async () => {
  await initializeData()
})
</script>
