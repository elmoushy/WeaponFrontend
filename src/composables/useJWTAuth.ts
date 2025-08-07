import { ref, computed } from 'vue'
import { authAPI, handleApiError } from '../services/jwtAuthService'
import type { UserProfile, LoginResponse } from '../types/auth.types'

// Reactive state
const isAuthenticated = ref(false)
const user = ref<UserProfile | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Initialize auth state from localStorage
const initializeAuth = (): void => {
  const storedUser = localStorage.getItem('user')
  const accessToken = localStorage.getItem('access_token')
  
  if (storedUser && accessToken) {
    try {
      user.value = JSON.parse(storedUser)
      isAuthenticated.value = true
    } catch (err) {
      console.error('Failed to parse stored user data:', err)
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }
}

export const useJWTAuth = () => {
  // Login with email and password
  const login = async (email: string, password: string): Promise<{ success: boolean; errors?: any }> => {
    try {
      isLoading.value = true
      error.value = null
      
      const response: LoginResponse = await authAPI.login(email, password)
      
      // Update reactive state
      user.value = response.user
      isAuthenticated.value = true
      
      return { success: true }
    } catch (err: any) {
      console.error('Login error:', err)
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
    } catch (err: any) {
      console.error('Logout error:', err)
      // Continue with logout even if API call fails
    } finally {
      // Always clear local state
      user.value = null
      isAuthenticated.value = false
      isLoading.value = false
      
      // Redirect to login page
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
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.user))
    } catch (err: any) {
      console.error('Get current user error:', err)
      error.value = handleApiError(err)
      
      // If unauthorized, clear auth state
      if (err.response?.status === 401) {
        user.value = null
        isAuthenticated.value = false
        localStorage.removeItem('user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
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
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return { success: true }
    } catch (err: any) {
      console.error('Update profile error:', err)
      error.value = handleApiError(err)
      return { success: false, errors: err }
    } finally {
      isLoading.value = false
    }
  }

  // Check if user is authenticated
  const checkAuth = async (): Promise<boolean> => {
    const accessToken = localStorage.getItem('access_token')
    
    if (!accessToken) {
      user.value = null
      isAuthenticated.value = false
      return false
    }
    
    try {
      await getCurrentUser()
      return true
    } catch (err: any) {
      console.error('Auth check failed:', err)
      return false
    }
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

  // Initialize on composable creation
  initializeAuth()

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
