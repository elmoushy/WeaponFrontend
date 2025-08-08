// Authentication and User Types
export interface UserProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: string
  is_active: boolean
  date_joined: string
  last_login: string | null
}

export interface UserInfo {
  id: number
  email: string
  name: string
  first_name: string
  last_name: string
  is_active: boolean
}

export interface UserStats {
  user_id: number
  stats: {
    account_age_days: number
    last_login_days_ago: number
    is_first_login: boolean
    account_status: string
    profile_completion: number
  }
}

export interface HealthCheckResponse {
  status: string
  authenticated: boolean
  user: string
  message: string
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  detail?: string
  errors?: Record<string, string[]>
}

export interface UserUpdateRequest {
  first_name?: string
  last_name?: string
}

export interface AuthError {
  detail: string
  status?: number
  errors?: Record<string, string[]>
}

// JWT Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  user: UserProfile
  tokens: {
    access: string
    refresh: string
  }
}

export interface TokenRefreshRequest {
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
  refresh: string
}

// API Response wrappers
export interface UserProfileResponse extends ApiResponse<never> {
  user: UserProfile
}

export interface UserStatsResponse extends ApiResponse<never> {
  user_id: number
  stats: UserStats['stats']
}

export interface LogoutResponse extends ApiResponse<never> {
  message: string
  detail: string
}
