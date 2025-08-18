import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSimpleAuth } from '../composables/useSimpleAuth'
import JWTLogin from '../pages/Auth/JWTLogin.vue'
// import Register from '../pages/Auth/Register.vue' // Temporarily disabled until JWT registration is implemented
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
import PasswordProtectedSurveyView from '../pages/Survey/PasswordProtectedSurveyView.vue'
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
  /*
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: 'Register - WPC | WeaponpowerCloud App',
      requiresGuest: true // Only accessible when not authenticated
    }
  },
  */
  {
    path: '/survey/public/:token',
    name: 'PublicSurvey',
    component: PublicSurveyView,
    meta: {
      title: 'Public Survey - WPC | WeaponpowerCloud App'
      // NO AUTH REQUIREMENTS AT ALL
    }
  },
  {
    path: '/survey/password/:token',
    name: 'PasswordProtectedSurvey',
    component: PasswordProtectedSurveyView,
    meta: {
      title: 'Protected Survey - WPC | WeaponpowerCloud App'
      // NO AUTH REQUIREMENTS AT ALL
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
  // ABSOLUTE BYPASS: Survey routes are completely public and separate from the main app
  if (to.path.startsWith('/survey/')) {
    console.log('SURVEY ROUTE DETECTED - COMPLETE BYPASS:', to.path)
    next()
    return
  }

  // Only check auth for non-survey routes
  const { isAuthenticated, checkAuth, user } = useSimpleAuth()
  const requiresAuth = to.meta?.requiresAuth
  const requiresGuest = to.meta?.requiresGuest
  const requiresAdmin = to.meta?.requiresAdmin

  let authenticated = isAuthenticated.value
  
  // Only check auth if route requires it
  if (requiresAuth && !authenticated) {
    try {
      authenticated = await checkAuth()
    } catch {
      authenticated = false
    }
    
    if (!authenticated) {
      const redirectPath = to.fullPath !== '/' ? to.fullPath : '/surveys'
      next({ path: '/login', query: { redirect: redirectPath } })
      return
    }
  }
  
  if (requiresGuest && authenticated) {
    const redirectTo = (from.query.redirect as string) || '/surveys'
    next(redirectTo)
  } else if (requiresAdmin && authenticated) {
    const currentUser = user.value
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      next('/surveys')
    } else {
      next()
    }
  } else {
    next()
  }
})

// Update page title on route change - Always set to "Survey"
router.beforeEach(() => {
  // Always set title to "Survey" regardless of route
  document.title = "WHSO Survey"
})

export default router
