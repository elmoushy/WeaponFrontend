import { ref, computed, onMounted, onUnmounted } from 'vue'
import { authService, type AuthContext, AuthState } from '../services/authService'
import type { UserProfileResponse, UserStatsResponse, HealthCheckResponse } from '../types/auth.types'

// Composable for the new authentication system
export const useAuth = () => {
  // Reactive state
  const authContext = ref<AuthContext>(authService.getContext())
  let unsubscribe: (() => void) | null = null

  // Subscribe to auth service changes
  onMounted(() => {
    unsubscribe = authService.subscribe((context) => {
      authContext.value = context
    })
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  // Computed properties
  const isAuthenticated = computed(() => authService.isAuthenticated())
  const isLoading = computed(() => authService.isLoading())
  const state = computed(() => authContext.value.state)
  const error = computed(() => authContext.value.error)
  const azureAccount = computed(() => authContext.value.azureAccount)
  const backendUser = computed(() => authContext.value.backendUser)
  const userProfile = computed(() => authContext.value.userProfile)

  // User info computed properties
  const userName = computed(() => {
    return backendUser.value?.name || 
           userProfile.value?.user.first_name || 
           azureAccount.value?.name ||
           'User'
  })

  const userEmail = computed(() => {
    return backendUser.value?.email || 
           userProfile.value?.user.email || 
           azureAccount.value?.username ||
           ''
  })

  const userInitials = computed(() => {
    const name = userName.value
    if (name === 'User') return 'U'
    
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  // Authentication methods
  const initialize = async (): Promise<void> => {
    await authService.initialize()
  }

  const login = async (method: 'redirect' | 'popup' = 'redirect'): Promise<void> => {
    await authService.login(method)
  }

  const logout = async (reason?: string): Promise<void> => {
    await authService.logout(reason)
  }

  const retry = (): void => {
    authService.retry()
  }

  const clearError = (): void => {
    authService.clearError()
  }

  // Data fetching methods
  const fetchUserProfile = async (): Promise<UserProfileResponse | null> => {
    return await authService.fetchUserProfile()
  }

  // State checking helpers
  const isState = (targetState: AuthState): boolean => {
    return state.value === targetState
  }

  const canRetry = computed(() => {
    return [AuthState.FAILED].includes(state.value)
  })

  const isInitializing = computed(() => {
    return [AuthState.UNINITIALIZED, AuthState.INITIALIZING].includes(state.value)
  })

  const isAuthenticating = computed(() => {
    return [AuthState.AUTHENTICATING, AuthState.BACKEND_SYNC].includes(state.value)
  })

  // Loading state helpers
  const loadingMessage = computed(() => {
    switch (state.value) {
      case AuthState.INITIALIZING:
        return 'Initializing authentication...'
      case AuthState.AUTHENTICATING:
        return 'Signing in with Microsoft...'
      case AuthState.BACKEND_SYNC:
        return 'Connecting to backend...'
      case AuthState.TOKEN_REFRESH:
        return 'Refreshing session...'
      default:
        return 'Loading...'
    }
  })

  return {
    // State
    isAuthenticated,
    isLoading,
    state,
    error,
    authContext: computed(() => authContext.value),
    
    // User data
    azureAccount,
    backendUser,
    userProfile,
    userName,
    userEmail,
    userInitials,
    
    // Methods
    initialize,
    login,
    logout,
    retry,
    clearError,
    fetchUserProfile,
    
    // Helpers
    isState,
    canRetry,
    isInitializing,
    isAuthenticating,
    loadingMessage,
    
    // State enum for components
    AuthState
  }
}

// Separate composable for backend API operations
export const useBackendAPI = () => {
  const { isAuthenticated, error } = useAuth()
  const isLoading = ref(false)
  const operationError = ref<string | null>(null)

  const executeWithErrorHandling = async <T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<T | null> => {
    if (!isAuthenticated.value) {
      operationError.value = 'User not authenticated'
      return null
    }

    try {
      isLoading.value = true
      operationError.value = null
      return await operation()
    } catch (err: any) {
      // Logging removed for production
      operationError.value = err.message || errorMessage
      return null
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserStats = async (): Promise<UserStatsResponse | null> => {
    return executeWithErrorHandling(
      () => import('../services/jwtAuthService').then(({ authAPI }) => authAPI.getUserStats()),
      'Failed to fetch user statistics'
    )
  }

  const updateUserProfile = async (data: any): Promise<boolean> => {
    const result = await executeWithErrorHandling(
      () => import('../services/jwtAuthService').then(({ authAPI }) => authAPI.updateUserProfile(data)),
      'Failed to update user profile'
    )
    return result !== null
  }

    const healthCheck = async (): Promise<HealthCheckResponse | null> => {
    return executeWithErrorHandling(
      () => import('../services/jwtAuthService').then(({ authAPI }) => authAPI.healthCheck()),
      'Health check failed'
    )
  }

  const clearOperationError = (): void => {
    operationError.value = null
  }

  return {
    // State
    isLoading: computed(() => isLoading.value),
    error: computed(() => operationError.value || error.value),
    
    // Methods
    fetchUserStats,
    updateUserProfile,
    healthCheck,
    clearOperationError,
    executeWithErrorHandling
  }
}
