import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useJWTAuth } from '../composables/useJWTAuth'
import JWTLogin from '../pages/Auth/JWTLogin.vue'
import Register from '../pages/Auth/Register.vue'
import Welcome from '../pages/Welcome/Welcome.vue'
import Dashboard from '../pages/Dashboard/Dashboard.vue'
import Projects from '../pages/Projects/Projects.vue'
import Analytics from '../pages/Analytics/Analytics.vue'
import Profile from '../pages/Profile/Profile.vue'
import Control from '../pages/Control/Control.vue'
import NewsControl from '../pages/Control/NewsControl.vue'
import SurveyControl from '../pages/Control/SurveyControl.vue'
import UserManagement from '../pages/Control/UserManagement/UserManagement.vue'
import SurveyResponses from '../pages/Survey/SurveyResponses.vue'
import PublicSurveyView from '../pages/Survey/PublicSurveyView.vue'
import AuthSurveyView from '../pages/Survey/AuthSurveyView.vue'
import Surveys from '../pages/Survey/Surveys.vue'
import SurveyAccessTest from '../components/SurveyAccessTest.vue'

// Extend Vue Router's RouteMeta interface
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiresGuest?: boolean
    requiresAdmin?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login' // Default to login page for unauthorized users
  },
  {
    path: '/login',
    name: 'Login',
    component: JWTLogin,
    meta: {
      title: 'Login - WPC | WeaponpowerCloud App',
      requiresGuest: true // Only accessible when not authenticated
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: 'Register - WPC | WeaponpowerCloud App',
      requiresGuest: true // Only accessible when not authenticated
    }
  },
  {
    path: '/survey/public/:token',
    name: 'PublicSurvey',
    component: PublicSurveyView,
    meta: {
      title: 'Public Survey - WPC | WeaponpowerCloud App',
      requiresAuth: false // Public access, no authentication required
    }
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: Welcome,
    meta: {
      title: 'Welcome - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: Projects,
    meta: {
      title: 'Projects - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/surveys',
    name: 'Surveys',
    component: Surveys,
    meta: {
      title: 'Surveys - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/surveys/take/:id',
    name: 'AuthSurveyTake',
    component: AuthSurveyView,
    meta: {
      title: 'Take Survey - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/control',
    name: 'Control',
    component: Control,
    meta: {
      title: 'Control Panel - WPC | WeaponpowerCloud App',
      requiresAuth: true,
      requiresAdmin: true // Add admin requirement
    }
  },
  {
    path: '/control/news',
    name: 'NewsControl',
    component: NewsControl,
    meta: {
      title: 'News Management - WPC | WeaponpowerCloud App',
      requiresAuth: true,
      requiresAdmin: true // Add admin requirement
    }
  },
  {
    path: '/control/surveys',
    name: 'SurveyControl',
    component: SurveyControl,
    meta: {
      title: 'Survey Management - WPC | WeaponpowerCloud App',
      requiresAuth: true,
      requiresAdmin: true // Add admin requirement
    }
  },
  {
    path: '/control/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: {
      title: 'User Management - WPC | WeaponpowerCloud App',
      requiresAuth: true,
      requiresAdmin: true // Add admin requirement
    }
  },
  {
    path: '/control/surveys/:surveyId/responses',
    name: 'SurveyResponses',
    component: SurveyResponses,
    meta: {
      title: 'Survey Responses - WPC | WeaponpowerCloud App',
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/control/responses',
    name: 'AllSurveyResponses',
    component: SurveyResponses,
    meta: {
      title: 'All Survey Responses - WPC | WeaponpowerCloud App',
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics,
    meta: {
      title: 'Analytics - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: 'Profile - WPC | WeaponpowerCloud App',
      requiresAuth: true
    }
  },
  // Development/Testing routes
  ...(import.meta.env.DEV ? [
    {
      path: '/test/survey-access',
      name: 'SurveyAccessTest',
      component: SurveyAccessTest,
      meta: {
        title: 'Survey Access Test - Development',
        requiresAuth: true
      }
    }
  ] : [])
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Authentication guard using JWT
router.beforeEach(async (to, from, next) => {
  // Import composables inside the guard to avoid circular dependency
  const { isAuthenticated, checkAuth, user } = useJWTAuth()
  
  const requiresAuth = to.meta?.requiresAuth
  const requiresGuest = to.meta?.requiresGuest
  const requiresAdmin = to.meta?.requiresAdmin
  
  // Check authentication status
  let authenticated = isAuthenticated.value
  
  // If we don't have auth state, try to check from stored tokens
  if (!authenticated && localStorage.getItem('access_token')) {
    try {
      authenticated = await checkAuth()
    } catch {
      // Logging removed for production
    }
  }
  
  if (requiresAuth && !authenticated) {
    // Route requires authentication but user is not authenticated
    const redirectPath = to.fullPath !== '/' ? to.fullPath : '/surveys'
    next({
      path: '/',
      query: { redirect: redirectPath }
    })
  } else if (requiresGuest && authenticated) {
    // Route requires guest (not authenticated) but user is authenticated
    const redirectTo = (from.query.redirect as string) || '/surveys'
    next(redirectTo)
  } else if (requiresAdmin && authenticated) {
    // Route requires admin access - check user role
    const currentUser = user.value
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      // User is not admin or super_admin, redirect to surveys page
      next('/surveys')
    } else {
      // User is admin or super_admin, allow access
      next()
    }
  } else {
    // All good, proceed to route
    next()
  }
})

// Update page title on route change
router.beforeEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
})

export default router
