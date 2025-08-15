// News API Types
export interface NewsImage {
  id: number
  image_data: string  // Base64 encoded image data
  caption: string
  alt_text: string
  order: number
}

export interface SliderNews {
  id: number
  title_arabic: string
  title_english: string
  description: string
  main_image: string  // Base64 encoded main image
  priority: number
  display_duration: number
  date: string
  category: NewsCategory
  category_display: string
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
  is_active: boolean
  images: NewsImage[]
}

export interface Achievement {
  id: number
  title_arabic: string
  title_english: string
  description: string
  main_image: string  // Base64 encoded main image
  achievement_date: string
  category: NewsCategory
  category_display: string
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
  is_active: boolean
  images: NewsImage[]
}

export interface CardsNews {
  id: number
  title_arabic: string
  title_english: string
  description: string
  main_image: string  // Base64 encoded main image
  date: string
  category: NewsCategory
  category_display: string
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
  is_active: boolean
  images: NewsImage[]
}

export type NewsCategory = 
  | 'general'
  | 'military' 
  | 'technology'
  | 'training'
  | 'announcement'
  | 'press_release'
  | 'event'
  | 'other'

// API Request/Response Types
export interface NewsApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

export interface PaginatedNewsResponse<T> {
  success: boolean
  message: string
  data: {
    results: T[]
    pagination: {
      count: number
      total_pages: number
      current_page: number
      page_size: number
      has_previous: boolean
      has_next: boolean
      previous_page: number | null
      next_page: number | null
    }
  }
}

// Create/Update Request Types
export interface CreateSliderNewsRequest {
  title_arabic: string
  title_english: string
  description: string
  priority?: number
  display_duration?: number
  category?: NewsCategory
  is_featured?: boolean
  is_active?: boolean
}

export interface CreateAchievementRequest {
  title_arabic: string
  title_english: string
  description: string
  achievement_date?: string
  category?: NewsCategory
  is_featured?: boolean
  is_active?: boolean
}

export interface CreateCardsNewsRequest {
  title_arabic: string
  title_english: string
  description: string
  date?: string
  category?: NewsCategory
  is_featured?: boolean
  is_active?: boolean
}

export interface UpdateMainImageRequest {
  main_image: string  // Base64 encoded image
}

export interface UploadImagesRequest {
  images: {
    image_data: string  // Base64 encoded image
    caption?: string
    alt_text?: string
    order?: number
  }[]
}

// Query Parameters
export interface NewsQueryParams {
  page?: number
  page_size?: number
  search?: string
  category?: NewsCategory
  is_featured?: boolean
  is_active?: boolean
  ordering?: string
}

// Standalone News Image
export interface StandaloneNewsImage {
  id: number
  image_data: string
  caption: string
  alt_text: string
  upload_date: string
  is_active: boolean
}

export interface CreateStandaloneImageRequest {
  image_data: string
  caption?: string
  alt_text?: string
  is_active?: boolean
}
