import { ref, computed, watch } from 'vue'
import { useAuth } from './useAuth'
import { authAPI, handleApiError, setAuthTokens } from '../services/jwtAuthService'
import type { 
  UserInfo, 
  UserProfileResponse, 
  UserStatsResponse,
  UserUpdateRequest 
} from '../types/auth.types'

// Reactive state for backend authentication
const isBackendAuthenticated = ref(false)
const backendUser = ref<UserInfo | null>(null)
const userProfile = ref<UserProfileResponse | null>(null)
const userStats = ref<UserStatsResponse | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useBackendAuth = () => {
  const { user: azureUser, isAuthenticated: isAzureAuthenticated, getIdToken, getIdTokenPopup } = useAuth()

  // Clear all backend data
  const clearBackendData = (): void => {
    isBackendAuthenticated.value = false
    backendUser.value = null
    userProfile.value = null
    userStats.value = null
    setAuthTokens(null)
  }

  // Synchronize Azure AD authentication with backend
  const syncWithBackend = async (): Promise<boolean> => {
    if (!isAzureAuthenticated.value || !azureUser.value) {
      clearBackendData()
      return false
    }

    try {
      isLoading.value = true
      error.value = null

      // Get Azure AD ID token
      const idToken = await getIdToken()
      
      if (!idToken) {
        throw new Error('Failed to get Azure AD ID token')
      }

      // Set the token for API requests
      setAuthTokens(idToken)

      // Test backend connection with health check
      await authAPI.healthCheck()

      // Fetch user information from backend - commenting out since method doesn't exist
      // const userInfo = await authAPI.getUserInfo()

      // Update reactive state - create a compatible user object from Azure user data
      if (azureUser.value?.idTokenClaims) {
        backendUser.value = {
          id: 0, // Temporary ID - would normally come from backend
          email: azureUser.value.username || '',
          name: azureUser.value.name || azureUser.value.username || '',
          first_name: azureUser.value.idTokenClaims.given_name as string || '',
          last_name: azureUser.value.idTokenClaims.family_name as string || '',
          is_active: true
        }
      }
      isBackendAuthenticated.value = true

      return true

    } catch (err: any) {
      error.value = handleApiError(err)
      clearBackendData()
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Fetch full user profile from backend
  const fetchUserProfile = async (): Promise<UserProfileResponse | null> => {
    if (!isBackendAuthenticated.value) {
      return null
    }

    try {
      isLoading.value = true
      error.value = null

      const profile = await authAPI.getCurrentUser()
      userProfile.value = profile
      return profile

    } catch (err: any) {
      console.error('❌ Failed to fetch user profile:', err)
      error.value = handleApiError(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Fetch user statistics from backend
  const fetchUserStats = async (): Promise<UserStatsResponse | null> => {
    if (!isBackendAuthenticated.value) {
      return null
    }

    try {
      isLoading.value = true
      error.value = null

      const stats = await authAPI.getUserStats()
      userStats.value = stats
      return stats

    } catch (err: any) {
      error.value = handleApiError(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Update user profile
  const updateUserProfile = async (profileData: UserUpdateRequest): Promise<boolean> => {
    if (!isBackendAuthenticated.value) {
      return false
    }

    try {
      isLoading.value = true
      error.value = null

      const updatedProfile = await authAPI.updateUserProfile(profileData)
      userProfile.value = updatedProfile
      return true

    } catch (err: any) {
      error.value = handleApiError(err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Logout from backend
  const logoutFromBackend = async (): Promise<void> => {
    try {
      if (isBackendAuthenticated.value) {
        await authAPI.logout()
      }
    } catch (err: any) {
      console.error('❌ Backend logout error:', err)
    } finally {
      clearBackendData()
    }
  }

  // Try to acquire ID token with popup fallback
  const acquireIdTokenWithFallback = async (): Promise<string | null> => {
    try {
      // First try silent token acquisition
      const token = await getIdToken()
      if (token) return token

      // If silent fails, try popup
      const popupToken = await getIdTokenPopup()
      return popupToken

    } catch (err) {
      error.value = 'Failed to acquire authentication token'
      return null
    }
  }

  // Force refresh authentication (useful for debugging)
  const refreshAuthentication = async (): Promise<boolean> => {
    clearBackendData()
    return await syncWithBackend()
  }

  // Clear any errors
  const clearError = (): void => {
    error.value = null
  }

  // Watch for Azure AD authentication changes
  watch(
    () => isAzureAuthenticated.value,
    async (newValue) => {
      if (newValue) {
        await syncWithBackend()
      } else {
        clearBackendData()
      }
    },
    { immediate: true }
  )

  // Computed properties
  const userName = computed(() => backendUser.value?.name || userProfile.value?.user.first_name || 'User')
  const userEmail = computed(() => backendUser.value?.email || userProfile.value?.user.email || '')
  const isFullyAuthenticated = computed(() => isAzureAuthenticated.value && isBackendAuthenticated.value)

  return {
    // State
    isBackendAuthenticated: computed(() => isBackendAuthenticated.value),
    backendUser: computed(() => backendUser.value),
    userProfile: computed(() => userProfile.value),
    userStats: computed(() => userStats.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isFullyAuthenticated,
    userName,
    userEmail,

    // Methods
    syncWithBackend,
    fetchUserProfile,
    fetchUserStats,
    updateUserProfile,
    logoutFromBackend,
    acquireIdTokenWithFallback,
    refreshAuthentication,
    clearBackendData,
    clearError
  }
}
