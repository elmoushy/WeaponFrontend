import { ref, computed } from 'vue'
import { authAPI, handleApiError, silentRefreshAccessToken } from '../services/jwtAuthService'
import type { UserProfile, LoginResponse } from '../types/auth.types'

// Reactive state
const isAuthenticated = ref(false)
const user = ref<UserProfile | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Initialize auth state (attempt silent refresh then load profile)
const initializeAuth = async (): Promise<void> => {
  try {
    isLoading.value = true
    // Attempt to obtain an access token if refresh cookie exists
    const token = await silentRefreshAccessToken()
    if (token) {
      // Fetch user profile
      try {
        const profile = await authAPI.getCurrentUser()
        user.value = profile.user
        isAuthenticated.value = true
      } catch {
        // Failed to fetch profile – treat as unauthenticated
        isAuthenticated.value = false
        user.value = null
      }
    } else {
      isAuthenticated.value = false
      user.value = null
    }
  } finally {
    isLoading.value = false
  }
}

export const useJWTAuth = () => {
  // Login with email and password
  const login = async (email: string, password: string): Promise<{ success: boolean; errors?: any }> => {
    try {
      isLoading.value = true
      error.value = null
      const response: LoginResponse = await authAPI.login(email, password)
      user.value = response.user
      isAuthenticated.value = true
      return { success: true }
    } catch (err: any) {
      error.value = handleApiError(err)
      return { success: false, errors: err }
    } finally {
      isLoading.value = false
    }
  }

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      await authAPI.logout()
    } catch {
      // continue regardless
    } finally {
      user.value = null
      isAuthenticated.value = false
      isLoading.value = false
      window.location.href = '/login'
    }
  }

  // Get current user profile
  const getCurrentUser = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      const response = await authAPI.getCurrentUser()
      user.value = response.user
      isAuthenticated.value = true
    } catch (err: any) {
      error.value = handleApiError(err)
      if (err.response?.status === 401) {
        user.value = null
        isAuthenticated.value = false
      }
    } finally {
      isLoading.value = false
    }
  }

  // Update user profile
  const updateProfile = async (userData: { first_name?: string; last_name?: string }): Promise<{ success: boolean; errors?: any }> => {
    try {
      isLoading.value = true
      error.value = null
      const response = await authAPI.updateUserProfile(userData)
      user.value = response.user
      return { success: true }
    } catch (err: any) {
      error.value = handleApiError(err)
      return { success: false, errors: err }
    } finally {
      isLoading.value = false
    }
  }

  // Check if user is authenticated (ensure access token present by trying profile fetch)
  const checkAuth = async (): Promise<boolean> => {
    if (!isAuthenticated.value) {
      await initializeAuth()
    }
    return isAuthenticated.value
  }

  // Clear error
  const clearError = (): void => {
    error.value = null
  }

  // Computed properties
  const isLoggedIn = computed(() => isAuthenticated.value)
  const currentUser = computed(() => user.value)
  const hasError = computed(() => !!error.value)
  const userFullName = computed(() => {
    if (!user.value) return ''
    return user.value.full_name || `${user.value.first_name} ${user.value.last_name}`.trim()
  })
  const userInitials = computed(() => {
    if (!user.value) return ''
    const firstName = user.value.first_name?.charAt(0) || ''
    const lastName = user.value.last_name?.charAt(0) || ''
    return (firstName + lastName).toUpperCase()
  })

  return {
    // Reactive state
    isAuthenticated: isLoggedIn,
    user: currentUser,
    isLoading,
    error,
    hasError,
    userFullName,
    userInitials,

    // Methods
    login,
    logout,
    getCurrentUser,
    updateProfile,
    checkAuth,
    clearError,
    initializeAuth
  }
}

// Kick off initial silent auth attempt (do not await)
initializeAuth()
