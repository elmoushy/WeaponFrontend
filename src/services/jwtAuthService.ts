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
  withCredentials: true, // send/receive HttpOnly cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  }
})

// JWT Token Management (in-memory only)
let accessToken: string | null = null
let refreshToken: string | null = null // kept for backward compatibility if backend still returns it

// Set JWT tokens for API requests (access token only in memory)
export const setAuthTokens = (access: string | null, refresh: string | null = null): void => {
  accessToken = access
  if (refresh) {
    // we do NOT persist refresh token – expect backend to store it in HttpOnly cookie
    refreshToken = refresh
  }
  if (access) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

// Attempt to silently obtain a new access token using refresh cookie
export const silentRefreshAccessToken = async (): Promise<string | null> => {
  try {
    // Cookie-based refresh: backend should read refresh token from HttpOnly cookie
    const response = await apiClient.post<TokenRefreshResponse>("/auth/token/refresh/", {})
    if (response.status === 200 && response.data.access) {
      setAuthTokens(response.data.access, response.data.refresh || null)
      return response.data.access
    }
    return null
  } catch {
    clearTokens()
    return null
  }
}

// Refresh access token using available method (cookie preferred)
const refreshAccessToken = async (): Promise<string | null> => {
  // Prefer cookie-based refresh path; fall back to legacy body-based if we still retained refreshToken
  try {
    const token = await silentRefreshAccessToken()
    if (token) return token

    if (!refreshToken) return null
    // Legacy fallback (if backend still expects token in body)
    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken }, { withCredentials: true })
    if (response.status === 200 && response.data?.access) {
      setAuthTokens(response.data.access, response.data.refresh || refreshToken)
      return response.data.access
    }
    clearTokens()
    redirectToLogin()
    return null
  } catch {
    clearTokens()
    redirectToLogin()
    return null
  }
}

// Clear all tokens (memory only)
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
    const token = accessToken
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<AuthError>) => {
    const originalRequest = error.config as any
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }
    }
    return Promise.reject(error)
  }
)

// Authentication API Service
export const authAPI = {
  // Login with email and password
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login/', { email, password })
      if (response.status === 200) {
        const { tokens, user } = response.data
        // Store access in memory only
        setAuthTokens(tokens.access || null, tokens.refresh || null)
        // Refresh token assumed to be set as HttpOnly cookie by backend (ignore persisting)
        return { ...response.data, user }
      }
      throw new Error('Login failed')
    } catch (error: any) {
      if (error.response?.data?.errors) {
        throw error.response.data.errors
      }
      throw { general: ['Login failed. Please try again.'] }
    }
  },

  // Refresh access token (cookie-based)
  refreshToken: async (): Promise<TokenRefreshResponse> => {
    const response = await apiClient.post<TokenRefreshResponse>('/auth/token/refresh/', {})
    if (response.status === 200) {
      setAuthTokens(response.data.access || null, response.data.refresh || null)
    }
    return response.data
  },

  // Logout user and invalidate refresh cookie
  logout: async (): Promise<LogoutResponse> => {
    try {
      const response = await apiClient.post<LogoutResponse>('/auth/logout/', {})
      clearTokens() // always clear local state
      return response.data
    } catch (error) {
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

export { apiClient }
