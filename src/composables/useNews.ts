import { ref, computed } from 'vue'
import { publicNewsAPI, adminNewsAPI, newsUtils } from '../services/newsService'
import type {
  SliderNews,
  Achievement,
  CardsNews,
  NewsQueryParams,
  CreateSliderNewsRequest,
  CreateAchievementRequest,
  CreateCardsNewsRequest
} from '../types/news.types'

// Public News Composable (for Welcome page)
export function usePublicNews() {
  const sliderNews = ref<SliderNews[]>([])
  const cardsNews = ref<CardsNews[]>([])
  const achievements = ref<Achievement[]>([])
  const pagination = ref({
    count: 0,
    total_pages: 0,
    current_page: 1,
    page_size: 12,
    has_previous: false,
    has_next: false,
    previous_page: null as number | null,
    next_page: null as number | null
  })
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load slider news for homepage
  const loadSliderNews = async (params?: Omit<NewsQueryParams, 'page' | 'page_size'>) => {
    try {
      loading.value = true
      error.value = null
      
      const data = await publicNewsAPI.getSliderNews({
        ordering: '-priority',
        is_active: true,
        ...params
      })
      
      sliderNews.value = Array.isArray(data) ? data : []
    } catch (err: any) {
      error.value = err.message || 'Failed to load slider news'
      console.error('Error loading slider news:', err)
      sliderNews.value = [] // Ensure it's always an array on error
    } finally {
      loading.value = false
    }
  }

  // Load cards news with pagination
  const loadCardsNews = async (params?: NewsQueryParams) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await publicNewsAPI.getCardsNews({
        page: 1,
        page_size: 12,
        ordering: '-date',
        is_active: true,
        ...params
      })
      
      cardsNews.value = Array.isArray(response.results) ? response.results : []
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.message || 'Failed to load cards news'
      console.error('Error loading cards news:', err)
      cardsNews.value = [] // Ensure it's always an array on error
    } finally {
      loading.value = false
    }
  }

  // Load more cards news (for infinite scroll)
  const loadMoreCardsNews = async (params?: NewsQueryParams) => {
    if (!pagination.value.has_next || loading.value) return

    try {
      loading.value = true
      
      const response = await publicNewsAPI.getCardsNews({
        page: pagination.value.next_page!,
        page_size: pagination.value.page_size,
        ordering: '-date',
        is_active: true,
        ...params
      })
      
      if (Array.isArray(response.results)) {
        cardsNews.value.push(...response.results)
      }
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.message || 'Failed to load more cards news'
      console.error('Error loading more cards news:', err)
    } finally {
      loading.value = false
    }
  }

  // Load achievements
  const loadAchievements = async (params?: Omit<NewsQueryParams, 'page' | 'page_size'>) => {
    try {
      loading.value = true
      error.value = null
      
      const data = await publicNewsAPI.getAchievements({
        ordering: '-achievement_date',
        is_active: true,
        ...params
      })
      
      achievements.value = Array.isArray(data) ? data : []
    } catch (err: any) {
      error.value = err.message || 'Failed to load achievements'
      console.error('Error loading achievements:', err)
      achievements.value = [] // Ensure it's always an array on error
    } finally {
      loading.value = false
    }
  }

  // Get specific cards news (with view count increment)
  const getCardsNewsById = async (id: number): Promise<CardsNews | null> => {
    try {
      const newsItem = await publicNewsAPI.getCardsNewsById(id)
      return newsItem
    } catch (err: any) {
      error.value = err.message || 'Failed to load news item'
      console.error('Error loading news item:', err)
      return null
    }
  }

  // Computed properties
  const featuredSliderNews = computed(() => 
    Array.isArray(sliderNews.value) ? sliderNews.value.filter(item => item.is_featured) : []
  )

  const featuredCardsNews = computed(() => 
    Array.isArray(cardsNews.value) ? cardsNews.value.filter(item => item.is_featured) : []
  )

  const featuredAchievements = computed(() => 
    Array.isArray(achievements.value) ? achievements.value.filter(item => item.is_featured) : []
  )

  const hasMoreCardsNews = computed(() => pagination.value.has_next)

  return {
    // State
    sliderNews,
    cardsNews,
    achievements,
    pagination,
    loading,
    error,
    
    // Computed
    featuredSliderNews,
    featuredCardsNews,
    featuredAchievements,
    hasMoreCardsNews,
    
    // Methods
    loadSliderNews,
    loadCardsNews,
    loadMoreCardsNews,
    loadAchievements,
    getCardsNewsById,
    
    // Utils
    formatDate: newsUtils.formatDate,
    getRelativeTime: newsUtils.getRelativeTime
  }
}

// Admin News Composable (for Control Panel)
export function useAdminNews() {
  const sliderNews = ref<SliderNews[]>([])
  const cardsNews = ref<CardsNews[]>([])
  const achievements = ref<Achievement[]>([])
  const selectedItem = ref<SliderNews | CardsNews | Achievement | null>(null)
  
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Slider News Operations
  const sliderNewsOps = {
    async loadAll(params?: NewsQueryParams) {
      try {
        loading.value = true
        error.value = null
        
        const data = await adminNewsAPI.sliderNews.getAll({
          ordering: '-created_at',
          ...params
        })
        
        sliderNews.value = Array.isArray(data) ? data : []
      } catch (err: any) {
        error.value = err.message || 'Failed to load slider news'
        console.error('Error loading slider news:', err)
        sliderNews.value = [] // Ensure it's always an array on error
      } finally {
        loading.value = false
      }
    },

    async create(data: CreateSliderNewsRequest) {
      try {
        saving.value = true
        error.value = null
        
        const newItem = await adminNewsAPI.sliderNews.create(data)
        sliderNews.value.unshift(newItem)
        successMessage.value = 'Slider news created successfully'
        
        return newItem
      } catch (err: any) {
        error.value = err.message || 'Failed to create slider news'
        console.error('Error creating slider news:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async update(id: number, data: Partial<CreateSliderNewsRequest>) {
      try {
        saving.value = true
        error.value = null
        
        const updatedItem = await adminNewsAPI.sliderNews.update(id, data)
        const index = sliderNews.value.findIndex(item => item.id === id)
        if (index !== -1) {
          sliderNews.value[index] = updatedItem
        }
        successMessage.value = 'Slider news updated successfully'
        
        return updatedItem
      } catch (err: any) {
        error.value = err.message || 'Failed to update slider news'
        console.error('Error updating slider news:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async delete(id: number) {
      try {
        saving.value = true
        error.value = null
        
        await adminNewsAPI.sliderNews.delete(id)
        sliderNews.value = sliderNews.value.filter(item => item.id !== id)
        successMessage.value = 'Slider news deleted successfully'
      } catch (err: any) {
        error.value = err.message || 'Failed to delete slider news'
        console.error('Error deleting slider news:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async updateMainImage(id: number, imageFile: File) {
      try {
        saving.value = true
        error.value = null
        
        const base64Image = await newsUtils.fileToBase64(imageFile)
        const updatedItem = await adminNewsAPI.sliderNews.updateMainImage(id, {
          main_image: base64Image
        })
        
        const index = sliderNews.value.findIndex(item => item.id === id)
        if (index !== -1) {
          sliderNews.value[index] = updatedItem
        }
        
        successMessage.value = 'Main image updated successfully'
        return updatedItem
      } catch (err: any) {
        error.value = err.message || 'Failed to update main image'
        console.error('Error updating main image:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async uploadImages(id: number, imageFiles: File[]) {
      try {
        saving.value = true
        error.value = null
        
        const images = await Promise.all(
          imageFiles.map(async (file, index) => ({
            image_data: await newsUtils.fileToBase64(file),
            caption: '',
            alt_text: file.name,
            order: index
          }))
        )
        
        const updatedItem = await adminNewsAPI.sliderNews.uploadImages(id, { images })
        const index = sliderNews.value.findIndex(item => item.id === id)
        if (index !== -1) {
          sliderNews.value[index] = updatedItem
        }
        
        successMessage.value = 'Images uploaded successfully'
        return updatedItem
      } catch (err: any) {
        error.value = err.message || 'Failed to upload images'
        console.error('Error uploading images:', err)
        throw err
      } finally {
        saving.value = false
      }
    }
  }

  // Cards News Operations (similar structure)
  const cardsNewsOps = {
    async loadAll(params?: NewsQueryParams) {
      try {
        loading.value = true
        error.value = null
        
        const response = await adminNewsAPI.cardsNews.getAll({
          ordering: '-created_at',
          page: 1,
          page_size: 50,
          ...params
        })
        
        cardsNews.value = Array.isArray(response.results) ? response.results : []
      } catch (err: any) {
        error.value = err.message || 'Failed to load cards news'
        console.error('Error loading cards news:', err)
        cardsNews.value = [] // Ensure it's always an array on error
      } finally {
        loading.value = false
      }
    },

    async create(data: CreateCardsNewsRequest) {
      try {
        saving.value = true
        error.value = null
        
        const newItem = await adminNewsAPI.cardsNews.create(data)
        cardsNews.value.unshift(newItem)
        successMessage.value = 'Cards news created successfully'
        
        return newItem
      } catch (err: any) {
        error.value = err.message || 'Failed to create cards news'
        console.error('Error creating cards news:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async update(id: number, data: Partial<CreateCardsNewsRequest>) {
      try {
        saving.value = true
        error.value = null
        
        const updatedItem = await adminNewsAPI.cardsNews.update(id, data)
        const index = cardsNews.value.findIndex(item => item.id === id)
        if (index !== -1) {
          cardsNews.value[index] = updatedItem
        }
        successMessage.value = 'Cards news updated successfully'
        
        return updatedItem
      } catch (err: any) {
        error.value = err.message || 'Failed to update cards news'
        console.error('Error updating cards news:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async delete(id: number) {
      try {
        saving.value = true
        error.value = null
        
        await adminNewsAPI.cardsNews.delete(id)
        cardsNews.value = cardsNews.value.filter(item => item.id !== id)
        successMessage.value = 'Cards news deleted successfully'
      } catch (err: any) {
        error.value = err.message || 'Failed to delete cards news'
        console.error('Error deleting cards news:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async updateMainImage(id: number, imageFile: File) {
      try {
        saving.value = true
        error.value = null
        
        const base64Image = await newsUtils.fileToBase64(imageFile)
        const updatedItem = await adminNewsAPI.cardsNews.updateMainImage(id, {
          main_image: base64Image
        })
        
        const index = cardsNews.value.findIndex(item => item.id === id)
        if (index !== -1) {
          cardsNews.value[index] = updatedItem
        }
        
        successMessage.value = 'Main image updated successfully'
        return updatedItem
      } catch (err: any) {
        error.value = err.message || 'Failed to update main image'
        console.error('Error updating main image:', err)
        throw err
      } finally {
        saving.value = false
      }
    }
  }

  // Achievements Operations (similar structure)
  const achievementsOps = {
    async loadAll(params?: NewsQueryParams) {
      try {
        loading.value = true
        error.value = null
        
        const data = await adminNewsAPI.achievements.getAll({
          ordering: '-created_at',
          ...params
        })
        
        achievements.value = Array.isArray(data) ? data : []
      } catch (err: any) {
        error.value = err.message || 'Failed to load achievements'
        console.error('Error loading achievements:', err)
        achievements.value = [] // Ensure it's always an array on error
      } finally {
        loading.value = false
      }
    },

    async create(data: CreateAchievementRequest) {
      try {
        saving.value = true
        error.value = null
        
        const newItem = await adminNewsAPI.achievements.create(data)
        achievements.value.unshift(newItem)
        successMessage.value = 'Achievement created successfully'
        
        return newItem
      } catch (err: any) {
        error.value = err.message || 'Failed to create achievement'
        console.error('Error creating achievement:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async update(id: number, data: Partial<CreateAchievementRequest>) {
      try {
        saving.value = true
        error.value = null
        
        const updatedItem = await adminNewsAPI.achievements.update(id, data)
        const index = achievements.value.findIndex(item => item.id === id)
        if (index !== -1) {
          achievements.value[index] = updatedItem
        }
        successMessage.value = 'Achievement updated successfully'
        
        return updatedItem
      } catch (err: any) {
        error.value = err.message || 'Failed to update achievement'
        console.error('Error updating achievement:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async delete(id: number) {
      try {
        saving.value = true
        error.value = null
        
        await adminNewsAPI.achievements.delete(id)
        achievements.value = achievements.value.filter(item => item.id !== id)
        successMessage.value = 'Achievement deleted successfully'
      } catch (err: any) {
        error.value = err.message || 'Failed to delete achievement'
        console.error('Error deleting achievement:', err)
        throw err
      } finally {
        saving.value = false
      }
    },

    async updateMainImage(id: number, imageFile: File) {
      try {
        saving.value = true
        error.value = null
        
        const base64Image = await newsUtils.fileToBase64(imageFile)
        const updatedItem = await adminNewsAPI.achievements.updateMainImage(id, {
          main_image: base64Image
        })
        
        const index = achievements.value.findIndex(item => item.id === id)
        if (index !== -1) {
          achievements.value[index] = updatedItem
        }
        
        successMessage.value = 'Main image updated successfully'
        return updatedItem
      } catch (err: any) {
        error.value = err.message || 'Failed to update main image'
        console.error('Error updating main image:', err)
        throw err
      } finally {
        saving.value = false
      }
    }
  }

  // Utility methods
  const clearMessages = () => {
    error.value = null
    successMessage.value = null
  }

  const validateImageFile = (file: File) => {
    return newsUtils.validateImageFile(file)
  }

  return {
    // State
    sliderNews,
    cardsNews,
    achievements,
    selectedItem,
    loading,
    saving,
    error,
    successMessage,
    
    // Operations
    sliderNewsOps,
    cardsNewsOps,
    achievementsOps,
    
    // Utils
    clearMessages,
    validateImageFile,
    formatDate: newsUtils.formatDate,
    getRelativeTime: newsUtils.getRelativeTime
  }
}
