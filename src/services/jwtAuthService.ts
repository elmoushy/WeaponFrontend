import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import type { 
  HealthCheckResponse,
  UserProfileResponse,
  UserStatsResponse,
  LogoutResponse,
  UserUpdateRequest,
  AuthError,
  LoginResponse,
  TokenRefreshResponse
} from '../types/auth.types'

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Create axios instance for API calls
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// JWT Token Management
let accessToken: string | null = null
let refreshToken: string | null = null

// Set JWT tokens for API requests
export const setAuthTokens = (access: string | null, refresh: string | null = null): void => {
  accessToken = access
  if (refresh) {
    refreshToken = refresh
  }
  
  if (access) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`
    localStorage.setItem('access_token', access)
    if (refresh) {
      localStorage.setItem('refresh_token', refresh)
    }
  } else {
    delete apiClient.defaults.headers.common['Authorization']
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

// Get stored JWT tokens on app initialization
export const initializeAuthTokens = (): boolean => {
  const storedAccessToken = localStorage.getItem('access_token')
  const storedRefreshToken = localStorage.getItem('refresh_token')
  
  if (storedAccessToken) {
    setAuthTokens(storedAccessToken, storedRefreshToken)
    return true
  }
  return false
}

// Refresh access token using refresh token
const refreshAccessToken = async (): Promise<string | null> => {
  const currentRefreshToken = refreshToken || localStorage.getItem('refresh_token')
  if (!currentRefreshToken) {
    return null
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: currentRefreshToken
    })
    
    const data = response.data
    
    if (response.status === 200) {
      // Update stored tokens
      setAuthTokens(data.access, data.refresh || currentRefreshToken)
      return data.access
    } else {
      // Refresh token expired, clear tokens and redirect to login
      clearTokens()
      redirectToLogin()
      return null
    }
  } catch (error) {
    // Logging removed for production
    clearTokens()
    redirectToLogin()
    return null
  }
}

// Clear all tokens
const clearTokens = (): void => {
  setAuthTokens(null, null)
  accessToken = null
  refreshToken = null
}

// Redirect to login page
const redirectToLogin = (): void => {
  if (window.location.pathname !== '/') {
    window.location.href = '/'
  }
}

// Request interceptor to ensure token is present
apiClient.interceptors.request.use(
  (config) => {
    // Ensure we have the latest access token
    const token = accessToken || localStorage.getItem('access_token')
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log the request for debugging
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
      // Logging removed for production} ${config.url}`)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
      // Logging removed for production} ${response.config.url}`)
    }
    return response
  },
  async (error: AxiosError<AuthError>) => {
    const originalRequest = error.config as any
    
    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Try to refresh token
      const newToken = await refreshAccessToken()
      if (newToken) {
        // Retry original request with new token
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }
    }
    
    // Log API errors in development
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
      // Logging removed for production} ${error.config?.url}`)
      // Logging removed for production
    }
    
    return Promise.reject(error)
  }
)

// Authentication API Service
export const authAPI = {
  // Login with email and password
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login/', {
        email,
        password
      })
      
      if (response.status === 200) {
        const { tokens, user } = response.data
        // Store tokens and user data
        setAuthTokens(tokens.access, tokens.refresh)
        localStorage.setItem('user', JSON.stringify(user))
        return response.data
      }
      
      throw new Error('Login failed')
    } catch (error: any) {
      if (error.response?.data?.errors) {
        throw error.response.data.errors
      }
      throw { general: ['Login failed. Please try again.'] }
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<TokenRefreshResponse> => {
    const currentRefreshToken = refreshToken || localStorage.getItem('refresh_token')
    if (!currentRefreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await apiClient.post<TokenRefreshResponse>('/auth/token/refresh/', {
      refresh: currentRefreshToken
    })
    
    if (response.status === 200) {
      setAuthTokens(response.data.access, response.data.refresh)
    }
    
    return response.data
  },

  // Logout user and blacklist tokens
  logout: async (): Promise<LogoutResponse> => {
    try {
      const currentRefreshToken = refreshToken || localStorage.getItem('refresh_token')
      const response = await apiClient.post<LogoutResponse>('/auth/logout/', {
        refresh_token: currentRefreshToken
      })
      
      // Always clear tokens regardless of response
      clearTokens()
      
      return response.data
    } catch (error) {
      // Clear tokens even if logout request fails
      clearTokens()
      throw error
    }
  },

  // Get current authenticated user information
  getCurrentUser: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<UserProfileResponse>('/auth/me/')
    return response.data
  },

  // Update user profile
  updateUserProfile: async (userData: UserUpdateRequest): Promise<UserProfileResponse> => {
    const response = await apiClient.patch<UserProfileResponse>('/auth/me/', userData)
    return response.data
  },

  // Get user stats
  getUserStats: async (): Promise<UserStatsResponse> => {
    const response = await apiClient.get<UserStatsResponse>('/auth/me/stats/')
    return response.data
  },

  // Health check endpoint
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>('/health/')
    return response.data
  }
}

// Error handling utility
export const handleApiError = (error: AxiosError<AuthError>): string => {
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors
    if (errors.non_field_errors && errors.non_field_errors.length > 0) {
      return errors.non_field_errors[0]
    }
    if (errors.email && errors.email.length > 0) {
      return errors.email[0]
    }
    if (errors.password && errors.password.length > 0) {
      return errors.password[0]
    }
    return 'An error occurred'
  }
  
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  
  if (error.message) {
    return error.message
  }
  
  return 'Network error occurred'
}

// Initialize auth tokens on service creation
initializeAuthTokens()

export { apiClient }
