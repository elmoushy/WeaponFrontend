import { ref, computed } from 'vue'
import { 
  PublicClientApplication, 
  type Configuration, 
  type AccountInfo, 
  InteractionRequiredAuthError,
  type RedirectRequest,
  type SilentRequest,
  type EndSessionRequest
} from '@azure/msal-browser'

// MSAL Configuration for Single-Page Application (SPA)
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '91ce101f-58e6-4d4c-8f0b-599b713c3101',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || '61032d68-6ef9-4d5f-9b9e-46c6556b6f47'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || (window.location.origin + '/auth/complete/azuread-oauth2/'),
    postLogoutRedirectUri: import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI || (window.location.origin + '/login'),
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use sessionStorage for better security in SPA
    storeAuthStateInCookie: false, // Set to true if you have issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, _message, containsPii) => {
        if (containsPii) {
          return
        }
        switch (level) {
          case 1: // Error
            // Logging removed for production
            break
          case 2: // Warning
            // Logging removed for production
            break
          case 3: // Info
            if (import.meta.env.VITE_ENVIRONMENT === 'development') {
              // Logging removed for production
            }
            break
          case 4: // Verbose
            if (import.meta.env.VITE_ENVIRONMENT === 'development') {
              // Logging removed for production
            }
            break
        }
      }
    }
  }
}

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig)

// Scopes for token requests
const loginRequest: RedirectRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  prompt: 'select_account'
}

// Reactive state
const isAuthenticated = ref(false)
const user = ref<AccountInfo | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useAuth = () => {
  // Initialize MSAL - call this on app startup
  const initialize = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      await msalInstance.initialize()
      
      // Handle redirect response if coming back from Microsoft login
      const response = await msalInstance.handleRedirectPromise()
      
      if (response) {
        // Successfully authenticated via redirect
        setActiveAccount(response.account)
      } else {
        // Check if there's an active account in cache
        const accounts = msalInstance.getAllAccounts()
        if (accounts.length > 0) {
          setActiveAccount(accounts[0])
        }
      }
    } catch (err) {
      // Logging removed for production
      error.value = 'Failed to initialize authentication'
    } finally {
      isLoading.value = false
    }
  }

  // Set the active account and update reactive state
  const setActiveAccount = (account: AccountInfo | null): void => {
    user.value = account
    isAuthenticated.value = !!account
    msalInstance.setActiveAccount(account)
  }

  // Login using redirect
  const login = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      await msalInstance.loginRedirect(loginRequest)
    } catch (err) {
      // Logging removed for production
      error.value = 'Login failed'
      isLoading.value = false
    }
  }

  // Login using popup (alternative method)
  const loginPopup = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await msalInstance.loginPopup(loginRequest)
      setActiveAccount(response.account)
    } catch (err) {
      // Logging removed for production
      error.value = 'Login failed'
    } finally {
      isLoading.value = false
    }
  }

  // Get access token silently
  const getAccessToken = async (scopes: string[] = ['User.Read']): Promise<string | null> => {
    try {
      if (!user.value) {
        throw new Error('No active account')
      }

      const silentRequest: SilentRequest = {
        scopes,
        account: user.value,
      }

      const response = await msalInstance.acquireTokenSilent(silentRequest)
      return response.accessToken
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        // Token acquisition requires user interaction
        try {
          await msalInstance.acquireTokenRedirect({
            scopes,
            account: user.value || undefined,
          })
          // After redirect, the token will be available in the next session
          return null
        } catch (redirectErr) {
          // Logging removed for production
          error.value = 'Failed to acquire token'
          return null
        }
      } else {
        // Logging removed for production
        error.value = 'Failed to acquire token'
        return null
      }
    }
  }

  // Get access token using popup (alternative method)
  const getAccessTokenPopup = async (scopes: string[] = ['User.Read']): Promise<string | null> => {
    try {
      if (!user.value) {
        throw new Error('No active account')
      }

      const silentRequest: SilentRequest = {
        scopes,
        account: user.value,
      }

      try {
        const response = await msalInstance.acquireTokenSilent(silentRequest)
        return response.accessToken
      } catch (silentErr) {
        if (silentErr instanceof InteractionRequiredAuthError) {
          const response = await msalInstance.acquireTokenPopup({
            scopes,
            account: user.value,
          })
          return response.accessToken
        }
        throw silentErr
      }
    } catch (err) {
      // Logging removed for production
      error.value = 'Failed to acquire token'
      return null
    }
  }

  // Get ID token silently (preferred for backend authentication)
  const getIdToken = async (): Promise<string | null> => {
    try {
      if (!user.value) {
        throw new Error('No active account')
      }

      const silentRequest: SilentRequest = {
        scopes: ['openid', 'profile', 'email'],
        account: user.value,
      }

      const response = await msalInstance.acquireTokenSilent(silentRequest)
      return response.idToken
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        // Token acquisition requires user interaction
        try {
          await msalInstance.acquireTokenRedirect({
            scopes: ['openid', 'profile', 'email'],
            account: user.value || undefined,
          })
          // After redirect, the token will be available in the next session
          return null
        } catch (redirectErr) {
          // Logging removed for production
          error.value = 'Failed to acquire ID token'
          return null
        }
      } else {
        // Logging removed for production
        error.value = 'Failed to acquire ID token'
        return null
      }
    }
  }

  // Get ID token using popup (alternative method)
  const getIdTokenPopup = async (): Promise<string | null> => {
    try {
      if (!user.value) {
        throw new Error('No active account')
      }

      const silentRequest: SilentRequest = {
        scopes: ['openid', 'profile', 'email'],
        account: user.value,
      }

      try {
        const response = await msalInstance.acquireTokenSilent(silentRequest)
        return response.idToken
      } catch (silentErr) {
        if (silentErr instanceof InteractionRequiredAuthError) {
          const response = await msalInstance.acquireTokenPopup({
            scopes: ['openid', 'profile', 'email'],
            account: user.value,
          })
          return response.idToken
        }
        throw silentErr
      }
    } catch (err) {
      // Logging removed for production
      error.value = 'Failed to acquire ID token'
      return null
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const logoutRequest: EndSessionRequest = {
        account: user.value,
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
      }

      setActiveAccount(null)
      await msalInstance.logoutRedirect(logoutRequest)
    } catch (err) {
      // Logging removed for production
      error.value = 'Logout failed'
      isLoading.value = false
    }
  }

  // Logout using popup (alternative method)
  const logoutPopup = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const logoutRequest: EndSessionRequest = {
        account: user.value,
      }

      await msalInstance.logoutPopup(logoutRequest)
      setActiveAccount(null)
    } catch (err) {
      // Logging removed for production
      error.value = 'Logout failed'
    } finally {
      isLoading.value = false
    }
  }

  // Computed properties for easier access to user info
  const userDisplayName = computed(() => user.value?.name || user.value?.username || '')
  const userEmail = computed(() => user.value?.username || '')
  const userId = computed(() => user.value?.localAccountId || '')

  // Clear error
  const clearError = (): void => {
    error.value = null
  }

  return {
    // State
    isAuthenticated: computed(() => isAuthenticated.value),
    user: computed(() => user.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // User info
    userDisplayName,
    userEmail,
    userId,
    
    // Methods
    initialize,
    login,
    loginPopup,
    logout,
    logoutPopup,
    getAccessToken,
    getAccessTokenPopup,
    getIdToken,
    getIdTokenPopup,
    clearError,
    
    // Direct access to MSAL instance if needed
    msalInstance
  }
}
