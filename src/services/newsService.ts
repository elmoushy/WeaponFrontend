import { apiClient } from './jwtAuthService'
import type {
  SliderNews,
  Achievement,
  CardsNews,
  StandaloneNewsImage,
  NewsApiResponse,
  PaginatedNewsResponse,
  CreateSliderNewsRequest,
  CreateAchievementRequest,
  CreateCardsNewsRequest,
  UpdateMainImageRequest,
  UploadImagesRequest,
  CreateStandaloneImageRequest,
  NewsQueryParams
} from '../types/news.types'

// Public News API (No authentication required)
export const publicNewsAPI = {
  // Get slider news for homepage
  getSliderNews: async (params?: Omit<NewsQueryParams, 'page' | 'page_size'>): Promise<SliderNews[]> => {
    const queryParams = new URLSearchParams()
    
    if (params?.search) queryParams.append('search', params.search)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString())
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
    if (params?.ordering) queryParams.append('ordering', params.ordering)
    
    const url = `/news/slider-news/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await apiClient.get<any>(url)
    
    let data: any[] = []
    
    // Handle the nested API response structure
    if (response.data?.data?.results?.data) {
      data = response.data.data.results.data || []
    } else {
      // Fallback to direct data access for backwards compatibility
      data = response.data?.data || []
    }
    
    // Transform data to include category_display
    return newsUtils.transformNewsArray(data) as SliderNews[]
  },

  // Get paginated cards news
  getCardsNews: async (params?: NewsQueryParams): Promise<PaginatedNewsResponse<CardsNews>['data']> => {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString())
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
    if (params?.ordering) queryParams.append('ordering', params.ordering)
    
    const url = `/news/cards-news/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await apiClient.get<any>(url)
    
    // Handle the nested API response structure for paginated data
    if (response.data?.data?.results?.data) {
      const transformedResults = newsUtils.transformNewsArray(response.data.data.results.data || []) as CardsNews[]
      return {
        results: transformedResults,
        pagination: response.data.data.results.pagination || {
          count: 0,
          total_pages: 0,
          current_page: 1,
          page_size: 12,
          has_previous: false,
          has_next: false,
          previous_page: null,
          next_page: null
        }
      }
    }
    
    // Fallback to direct data access for backwards compatibility
    const fallbackData = response.data?.data || { results: [], pagination: {} }
    const transformedResults = newsUtils.transformNewsArray(fallbackData.results || []) as CardsNews[]
    
    return {
      results: transformedResults,
      pagination: fallbackData.pagination || {
        count: 0,
        total_pages: 0,
        current_page: 1,
        page_size: 12,
        has_previous: false,
        has_next: false,
        previous_page: null,
        next_page: null
      }
    }
  },

  // Get specific cards news item (increments view count)
  getCardsNewsById: async (id: number): Promise<CardsNews> => {
    const response = await apiClient.get<NewsApiResponse<CardsNews>>(`/news/cards-news/${id}/`)
    return response.data.data!
  },

  // Get achievements
  getAchievements: async (params?: Omit<NewsQueryParams, 'page' | 'page_size'>): Promise<Achievement[]> => {
    const queryParams = new URLSearchParams()
    
    if (params?.search) queryParams.append('search', params.search)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString())
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
    if (params?.ordering) queryParams.append('ordering', params.ordering)
    
    const url = `/news/achievements/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await apiClient.get<any>(url)
    
    let data: any[] = []
    
    // Handle the nested API response structure
    if (response.data?.data?.results?.data) {
      data = response.data.data.results.data || []
    } else {
      // Fallback to direct data access for backwards compatibility
      data = response.data?.data || []
    }
    
    // Transform data to include category_display
    return newsUtils.transformNewsArray(data) as Achievement[]
  },

  // Get specific achievement
  getAchievementById: async (id: number): Promise<Achievement> => {
    const response = await apiClient.get<NewsApiResponse<Achievement>>(`/news/achievements/${id}/`)
    return response.data.data!
  },

  // Get specific slider news
  getSliderNewsById: async (id: number): Promise<SliderNews> => {
    const response = await apiClient.get<NewsApiResponse<SliderNews>>(`/news/slider-news/${id}/`)
    return response.data.data!
  }
}

// Admin News API (Authentication required)
export const adminNewsAPI = {
  // Slider News Admin Operations
  sliderNews: {
    // Create new slider news
    create: async (data: CreateSliderNewsRequest): Promise<SliderNews> => {
      const response = await apiClient.post<any>('/news/slider-news/', data)
      
      // Handle nested response structure  
      let item = response.data?.data?.data || response.data?.data
      
      // Transform to include category_display
      return newsUtils.transformNewsItem(item) as SliderNews
    },

    // Update slider news (text fields only)
    update: async (id: number, data: Partial<CreateSliderNewsRequest>): Promise<SliderNews> => {
      const response = await apiClient.patch<any>(`/news/slider-news/${id}/`, data)
      
      // Handle nested response structure  
      let item = response.data?.data?.data || response.data?.data
      
      // Transform to include category_display
      return newsUtils.transformNewsItem(item) as SliderNews
    },

    // Delete slider news
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/news/slider-news/${id}/`)
    },

    // Update main image
    updateMainImage: async (id: number, data: UpdateMainImageRequest): Promise<SliderNews> => {
      const response = await apiClient.post<any>(`/news/slider-news/${id}/update_main_image/`, data)
      
      // Handle nested response structure  
      let item = response.data?.data?.data || response.data?.data
      
      // Transform to include category_display
      return newsUtils.transformNewsItem(item) as SliderNews
    },

    // Upload gallery images
    uploadImages: async (id: number, data: UploadImagesRequest): Promise<SliderNews> => {
      const response = await apiClient.post<NewsApiResponse<SliderNews>>(`/news/slider-news/${id}/upload_images/`, data)
      return response.data.data!
    },

    // Get all (admin view)
    getAll: async (params?: NewsQueryParams): Promise<SliderNews[]> => {
      const queryParams = new URLSearchParams()
      
      if (params?.search) queryParams.append('search', params.search)
      if (params?.category) queryParams.append('category', params.category)
      if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString())
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
      if (params?.ordering) queryParams.append('ordering', params.ordering)
      
      const url = `/news/slider-news/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await apiClient.get<any>(url)
      
      let data: any[] = []
      
      // Handle the nested API response structure
      if (response.data?.data?.results?.data) {
        data = response.data.data.results.data || []
      } else {
        // Fallback to direct data access for backwards compatibility
        data = response.data?.data || []
      }
      
      // Transform data to include category_display
      return newsUtils.transformNewsArray(data)
    }
  },

  // Cards News Admin Operations
  cardsNews: {
    // Create new cards news
    create: async (data: CreateCardsNewsRequest): Promise<CardsNews> => {
      const response = await apiClient.post<any>('/news/cards-news/', data)
      
      // Handle nested response structure  
      let item = response.data?.data?.data || response.data?.data
      
      // Transform to include category_display
      return newsUtils.transformNewsItem(item) as CardsNews
    },

    // Update cards news (text fields only)
    update: async (id: number, data: Partial<CreateCardsNewsRequest>): Promise<CardsNews> => {
      const response = await apiClient.patch<any>(`/news/cards-news/${id}/`, data)
      
      // Handle nested response structure  
      let item = response.data?.data?.data || response.data?.data
      
      // Transform to include category_display
      return newsUtils.transformNewsItem(item) as CardsNews
    },

    // Delete cards news
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/news/cards-news/${id}/`)
    },

    // Update main image
    updateMainImage: async (id: number, data: UpdateMainImageRequest): Promise<CardsNews> => {
      const response = await apiClient.post<NewsApiResponse<CardsNews>>(`/news/cards-news/${id}/update_main_image/`, data)
      return response.data.data!
    },

    // Upload gallery images
    uploadImages: async (id: number, data: UploadImagesRequest): Promise<CardsNews> => {
      const response = await apiClient.post<NewsApiResponse<CardsNews>>(`/news/cards-news/${id}/upload_images/`, data)
      return response.data.data!
    },

    // Get all (admin view with pagination)
    getAll: async (params?: NewsQueryParams): Promise<PaginatedNewsResponse<CardsNews>['data']> => {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.category) queryParams.append('category', params.category)
      if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString())
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
      if (params?.ordering) queryParams.append('ordering', params.ordering)
      
      const url = `/news/cards-news/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await apiClient.get<any>(url)
      
      // Handle the nested API response structure for paginated data
      if (response.data?.data?.results?.data) {
        const transformedResults = newsUtils.transformNewsArray(response.data.data.results.data || []) as CardsNews[]
        return {
          results: transformedResults,
          pagination: response.data.data.results.pagination || {
            count: 0,
            total_pages: 0,
            current_page: 1,
            page_size: 12,
            has_previous: false,
            has_next: false,
            previous_page: null,
            next_page: null
          }
        }
      }
      
      // Fallback to direct data access for backwards compatibility
      const fallbackData = response.data?.data || { results: [], pagination: {} }
      const transformedResults = newsUtils.transformNewsArray(fallbackData.results || []) as CardsNews[]
      
      return {
        results: transformedResults,
        pagination: fallbackData.pagination || {
          count: 0,
          total_pages: 0,
          current_page: 1,
          page_size: 12,
          has_previous: false,
          has_next: false,
          previous_page: null,
          next_page: null
        }
      }
    }
  },

  // Achievements Admin Operations
  achievements: {
    // Create new achievement
    create: async (data: CreateAchievementRequest): Promise<Achievement> => {
      const response = await apiClient.post<any>('/news/achievements/', data)
      
      // Handle nested response structure  
      let item = response.data?.data?.data || response.data?.data
      
      // Transform to include category_display
      return newsUtils.transformNewsItem(item) as Achievement
    },

    // Update achievement (text fields only)
    update: async (id: number, data: Partial<CreateAchievementRequest>): Promise<Achievement> => {
      const response = await apiClient.patch<any>(`/news/achievements/${id}/`, data)
      
      // Handle nested response structure  
      let item = response.data?.data?.data || response.data?.data
      
      // Transform to include category_display
      return newsUtils.transformNewsItem(item) as Achievement
    },

    // Delete achievement
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/news/achievements/${id}/`)
    },

    // Update main image
    updateMainImage: async (id: number, data: UpdateMainImageRequest): Promise<Achievement> => {
      const response = await apiClient.post<NewsApiResponse<Achievement>>(`/news/achievements/${id}/update_main_image/`, data)
      return response.data.data!
    },

    // Upload gallery images
    uploadImages: async (id: number, data: UploadImagesRequest): Promise<Achievement> => {
      const response = await apiClient.post<NewsApiResponse<Achievement>>(`/news/achievements/${id}/upload_images/`, data)
      return response.data.data!
    },

    // Get all (admin view)
    getAll: async (params?: NewsQueryParams): Promise<Achievement[]> => {
      const queryParams = new URLSearchParams()
      
      if (params?.search) queryParams.append('search', params.search)
      if (params?.category) queryParams.append('category', params.category)
      if (params?.is_featured !== undefined) queryParams.append('is_featured', params.is_featured.toString())
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
      if (params?.ordering) queryParams.append('ordering', params.ordering)
      
      const url = `/news/achievements/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await apiClient.get<any>(url)
      
      let data: any[] = []
      
      // Handle the nested API response structure
      if (response.data?.data?.results?.data) {
        data = response.data.data.results.data || []
      } else {
        // Fallback to direct data access for backwards compatibility
        data = response.data?.data || []
      }
      
      // Transform data to include category_display
      return newsUtils.transformNewsArray(data) as Achievement[]
    }
  },

  // Standalone Images Admin Operations
  images: {
    // Get all images
    getAll: async (): Promise<StandaloneNewsImage[]> => {
      const response = await apiClient.get<NewsApiResponse<StandaloneNewsImage[]>>('/news/images/')
      return response.data.data || []
    },

    // Create standalone image
    create: async (data: CreateStandaloneImageRequest): Promise<StandaloneNewsImage> => {
      const response = await apiClient.post<NewsApiResponse<StandaloneNewsImage>>('/news/images/', data)
      return response.data.data!
    },

    // Delete standalone image
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/news/images/${id}/`)
    }
  }
}

// Utility functions
export const newsUtils = {
  // Convert file to base64
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
      reader.readAsDataURL(file)
    })
  },

  // Validate image file
  validateImageFile: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, GIF, or WebP.' }
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large. Maximum size is 10MB.' }
    }

    return { valid: true }
  },

  // Get category display name
  getCategoryDisplay: (category: string): string => {
    const categoryMap: Record<string, string> = {
      'general': 'General',
      'military': 'Military',
      'technology': 'Technology',
      'training': 'Training',
      'announcement': 'Announcement',
      'press_release': 'Press Release',
      'event': 'Event',
      'other': 'Other'
    }
    return categoryMap[category] || category
  },

  // Format base64 image string to proper data URL
  formatBase64Image: (base64String: string): string => {
    if (!base64String) return ''
    
    // If it already has the data URL prefix, return as is
    if (base64String.startsWith('data:')) {
      return base64String
    }
    
    // Add the data URL prefix for JPEG (most common format)
    // You can make this more sophisticated by detecting the format if needed
    return `data:image/jpeg;base64,${base64String}`
  },

  // Transform news item to include category_display and missing fields
  transformNewsItem: <T extends { category: string; main_image?: string }>(item: T): T & { category_display: string; view_count?: number; main_image?: string } => {
    return {
      view_count: 0, // Default view count
      ...item,
      category_display: newsUtils.getCategoryDisplay(item.category),
      main_image: item.main_image ? newsUtils.formatBase64Image(item.main_image) : item.main_image
    }
  },

  // Transform news array to include category_display and missing fields
  transformNewsArray: <T extends { category: string }>(items: T[]): (T & { category_display: string; view_count?: number })[] => {
    return items.map(item => newsUtils.transformNewsItem(item))
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // Get relative time (e.g., "2h ago")
  getRelativeTime: (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`
    return `${Math.floor(diffInSeconds / 31536000)}y`
  }
}
