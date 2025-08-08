import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { authService, AuthState } from '../services/authService'

// Route meta interface
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
    requiresAdmin?: boolean
    title?: string
    allowedStates?: AuthState[]
  }
}

// JWT Auth helper function
const getJWTAuthState = () => {
  const token = localStorage.getItem('access_token')
  const user = localStorage.getItem('user')
  
  if (token && user) {
    try {
      return {
        isAuthenticated: true,
        user: JSON.parse(user),
        token
      }
    } catch {
      return {
        isAuthenticated: false,
        user: null,
        token: null
      }
    }
  }
  
  return {
    isAuthenticated: false,
    user: null,
    token: null
  }
}

// Enhanced authentication guard
export const setupAuthGuards = (router: Router): void => {
  // Primary authentication guard
  router.beforeEach(async (to, from, next) => {
    const context = authService.getContext()
    const jwtAuth = getJWTAuthState()
    
    // Wait for initialization if needed
    if (context.state === AuthState.UNINITIALIZED) {
      try {
        await authService.initialize()
      } catch {
        // Logging removed for production
      }
    }
    
    const { state } = authService.getContext()
    const requiresAuth = to.meta?.requiresAuth === true
    const requiresGuest = to.meta?.requiresGuest === true
    const requiresAdmin = to.meta?.requiresAdmin === true
    const allowedStates = to.meta?.allowedStates || []
    
    // Check if route has specific state requirements
    if (allowedStates.length > 0 && !allowedStates.includes(state)) {
      handleUnauthorizedAccess(to, from, next, state)
      return
    }
    
    // Handle routes that require authentication
    if (requiresAuth) {
      // Check JWT authentication first
      if (jwtAuth.isAuthenticated) {
        // Check admin requirement if specified
        if (requiresAdmin) {
          const userRole = jwtAuth.user.role
          
          // Allow access for admin and super_admin roles
          if (userRole !== 'admin' && userRole !== 'super_admin') {
            next('/surveys') // Redirect non-admin users to surveys page
            return
          }
        }
        next()
        return
      }
      // Fallback to Azure auth
      else if (state === AuthState.AUTHENTICATED) {
        // Check admin requirement if specified
        if (requiresAdmin) {
          // For JWT auth, check user role from localStorage
          try {
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
              const user = JSON.parse(storedUser)
              const userRole = user.role
              
              // Allow access for admin and super_admin roles
              if (userRole !== 'admin' && userRole !== 'super_admin') {
                next('/surveys') // Redirect non-admin users to surveys page
                return
              }
            } else {
              // No user data found, redirect to login
              redirectToLogin(to, next)
              return
            }
          } catch {
            // Error parsing user data, redirect to login
            redirectToLogin(to, next)
            return
          }
        }
        next()
      } else if ([AuthState.AUTHENTICATING, AuthState.BACKEND_SYNC, AuthState.TOKEN_REFRESH].includes(state)) {
        // User is in process of authenticating, wait
        waitForAuthentication(to, from, next)
      } else {
        // Not authenticated, redirect to login
        redirectToLogin(to, next)
      }
      return
    }
    
    // Handle routes that require guest (not authenticated)
    if (requiresGuest) {
      // Check JWT authentication first
      if (jwtAuth.isAuthenticated) {
        // Already authenticated, redirect to intended page or surveys
        const redirectTo = getIntendedRedirect(from) || '/surveys'
        next(redirectTo)
        return
      }
      // Fallback to Azure auth
      else if (state === AuthState.AUTHENTICATED) {
        // Already authenticated, redirect to intended page or surveys
        const redirectTo = getIntendedRedirect(from) || '/surveys'
        next(redirectTo)
      } else if ([AuthState.AUTHENTICATING, AuthState.BACKEND_SYNC].includes(state)) {
        // In process of authenticating, wait and then redirect
        waitForAuthentication(to, from, next, '/surveys')
      } else {
        next()
      }
      return
    }
    
    // No special requirements, allow access
    next()
  })

  // Title guard
  router.beforeEach((to) => {
    if (to.meta?.title) {
      document.title = to.meta.title as string
    }
  })

  // Loading state management
  router.beforeEach((to, from, next) => {
    // Clear any existing loading states when navigating
    const context = authService.getContext()
    if (context.error && to.path !== from.path) {
      authService.clearError()
    }
    next()
  })
}

// Helper functions
function redirectToLogin(to: RouteLocationNormalized, next: NavigationGuardNext): void {
  const redirectPath = to.fullPath !== '/' ? to.fullPath : '/surveys'
  next({
    path: '/login',
    query: { redirect: redirectPath }
  })
}

function handleUnauthorizedAccess(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  currentState: AuthState
): void {
  // Logging removed for production
  
  switch (currentState) {
    case AuthState.FAILED:
      next('/login?error=auth_failed')
      break
    case AuthState.UNAUTHENTICATED:
      redirectToLogin(to, next)
      break
    default:
      // Fallback to previous route or login
      if (from.path && from.path !== to.path) {
        next(false) // Stay on current route
      } else {
        next('/login')
      }
  }
}

function waitForAuthentication(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
  fallbackRoute?: string
): void {
  const maxWaitTime = 10000 // 10 seconds
  const startTime = Date.now()
  
  const checkAuth = () => {
    const context = authService.getContext()
    
    if (context.state === AuthState.AUTHENTICATED) {
      next()
    } else if (context.state === AuthState.FAILED || context.state === AuthState.UNAUTHENTICATED) {
      if (fallbackRoute) {
        next(fallbackRoute)
      } else {
        redirectToLogin(to, next)
      }
    } else if (Date.now() - startTime > maxWaitTime) {
      // Timeout
      // Logging removed for production
      if (fallbackRoute) {
        next(fallbackRoute)
      } else {
        redirectToLogin(to, next)
      }
    } else {
      // Continue waiting
      setTimeout(checkAuth, 100)
    }
  }
  
  checkAuth()
}

function getIntendedRedirect(from: RouteLocationNormalized): string | null {
  return from.query.redirect as string || null
}

// Route definitions with enhanced meta
export const enhancedRoutes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    meta: {
      title: 'Login - WPC | WeaponpowerCloud App',
      requiresGuest: true,
      allowedStates: [AuthState.UNAUTHENTICATED, AuthState.FAILED]
    }
  },
  {
    path: '/register',
    name: 'Register',
    meta: {
      title: 'Register - WPC | WeaponpowerCloud App',
      requiresGuest: true,
      allowedStates: [AuthState.UNAUTHENTICATED, AuthState.FAILED]
    }
  },
  {
    path: '/auth/complete/azuread-oauth2/',
    name: 'AuthCallback',
    meta: {
      title: 'Completing authentication...',
      allowedStates: [
        AuthState.AUTHENTICATING, 
        AuthState.BACKEND_SYNC, 
        AuthState.AUTHENTICATED,
        AuthState.FAILED
      ]
    }
  },
  {
    path: '/welcome',
    name: 'Welcome',
    meta: {
      title: 'Welcome - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: {
      title: 'Dashboard - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/projects',
    name: 'Projects',
    meta: {
      title: 'Projects - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    meta: {
      title: 'Analytics - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    meta: {
      title: 'Profile - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/news',
    name: 'News',
    meta: {
      title: 'News - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  }
] as const
