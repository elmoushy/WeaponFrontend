import { getAccessToken } from '../services/jwtAuthService'
import { useSimpleAuth } from '../composables/useSimpleAuth'

/**
 * Debug utility for WebSocket authentication issues
 */
export class WebSocketDebugger {
  static checkAuthenticationState() {
    const { isAuthenticated, user } = useSimpleAuth()
    const token = getAccessToken()
    
    console.group('🔍 WebSocket Authentication Debug')
    console.log('🔐 Is Authenticated:', isAuthenticated.value)
    console.log('👤 User:', user.value)
    console.log('🎫 JWT Token Available:', !!token)
    console.log('🎫 JWT Token Length:', token ? token.length : 0)
    console.log('🎫 JWT Token Preview:', token ? `${token.substring(0, 20)}...` : 'None')
    
    // Check if token looks valid (basic JWT format check)
    if (token) {
      try {
        const parts = token.split('.')
        console.log('🔍 JWT Parts Count:', parts.length)
        console.log('✅ JWT Format Valid:', parts.length === 3)
        
        // Try to decode payload (without verification)
        const payload = JSON.parse(atob(parts[1]))
        console.log('📋 JWT Payload:', payload)
        console.log('⏰ JWT Expires At:', payload.exp ? new Date(payload.exp * 1000) : 'No expiration')
        console.log('⏰ JWT Is Expired:', payload.exp ? Date.now() > payload.exp * 1000 : 'Cannot determine')
      } catch (error) {
        console.error('❌ JWT Decode Error:', error)
      }
    }
    
    console.groupEnd()
    
    return {
      isAuthenticated: isAuthenticated.value,
      hasUser: !!user.value,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    }
  }
  
  static logWebSocketAttempt() {
    const auth = this.checkAuthenticationState()
    
    if (!auth.isAuthenticated) {
      console.warn('🚫 WebSocket Connection Blocked: User not authenticated')
      return false
    }
    
    if (!auth.hasToken) {
      console.warn('🚫 WebSocket Connection Blocked: No JWT token available')
      return false
    }
    
    console.log('✅ WebSocket Connection Ready: All authentication checks passed')
    return true
  }
}

// Export for use in components
export const debugWebSocket = WebSocketDebugger
