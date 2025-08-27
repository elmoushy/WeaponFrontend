// src/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useSimpleAuth } from "../composables/useSimpleAuth";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresAdmin?: boolean;
  }
}

/* =========================
   Lazy-loaded Pages
   ========================= */

// Auth & Public
const JWTLogin = () => import("../pages/Auth/JWTLogin.vue");
// const Register = () => import('../pages/Auth/Register.vue') 

// Core
const Profile = () => import("../pages/Profile/Profile.vue");

// Development/Testing
const WebSocketTest = () => import("../components/WebSocketTest.vue");

// Control
const Control = () => import("../pages/Control/Control.vue");
const SurveyControl = () => import("../pages/Control/SurveyControl.vue");
const UserManagement = () =>
  import("../pages/Control/UserManagement/UserManagement.vue");

// Surveys
const Surveys = () => import("../pages/Survey/Surveys.vue");
const SurveyResponses = () => import("../pages/Survey/SurveyResponses.vue");
const SurveyAnalytics = () => import("../pages/Survey/SurveyAnalytics.vue");
const PublicSurveyView = () => import("../pages/Survey/PublicSurveyView.vue");
const PasswordProtectedSurveyView = () =>
  import("../pages/Survey/PasswordProtectedSurveyView.vue");
const AuthSurveyView = () => import("../pages/Survey/AuthSurveyView.vue");

// Notifications
const Notifications = () => import("../pages/Notifications");

/* =========================
   Routes
   ========================= */
const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/login" },

  {
    path: "/login",
    name: "Login",
    component: JWTLogin,
    meta: { title: "Login - WPC | WeaponpowerCloud App", requiresGuest: true },
  },
  /*
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: 'Register - WPC | WeaponpowerCloud App', requiresGuest: true }
  },
  */

  // ✅ Public survey routes 
  {
    path: "/survey/public/:token",
    name: "PublicSurvey",
    component: PublicSurveyView,
    meta: { title: "Public Survey - WPC | WeaponpowerCloud App" },
  },
  {
    path: "/survey/password/:token",
    name: "PasswordProtectedSurvey",
    component: PasswordProtectedSurveyView,
    meta: { title: "Protected Survey - WPC | WeaponpowerCloud App" },
  },

  // Authenticated app
  {
    path: "/surveys",
    name: "Surveys",
    component: Surveys,
    meta: { title: "Surveys - WPC | WeaponpowerCloud App", requiresAuth: true },
  },
  {
    path: "/surveys/take/:id",
    name: "AuthSurveyTake",
    component: AuthSurveyView,
    meta: {
      title: "Take Survey - WPC | WeaponpowerCloud App",
      requiresAuth: true,
    },
  },

  // Notifications
  {
    path: "/notifications",
    name: "Notifications",
    component: Notifications,
    meta: { title: "Notifications - WPC | WeaponpowerCloud App", requiresAuth: true },
  },

  // WebSocket Test (Development only)
  {
    path: "/websocket-test",
    name: "WebSocketTest",
    component: WebSocketTest,
    meta: { title: "WebSocket Test - WPC | WeaponpowerCloud App", requiresAuth: true },
  },

  // Control (Admins only)
  {
    path: "/control",
    name: "Control",
    component: Control,
    meta: {
      title: "Control Panel - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/surveys",
    name: "SurveyControl",
    component: SurveyControl,
    meta: {
      title: "Survey Management - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/users",
    name: "UserManagement",
    component: UserManagement,
    meta: {
      title: "User Management - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/surveys/:surveyId/responses",
    name: "SurveyResponses",
    component: SurveyResponses,
    meta: {
      title: "Survey Responses - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/surveys/:surveyId/analytics",
    name: "SurveyAnalytics",
    component: SurveyAnalytics,
    meta: {
      title: "Survey Analytics - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/responses",
    name: "AllSurveyResponses",
    component: SurveyResponses,
    meta: {
      title: "All Survey Responses - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { title: "Profile - WPC | WeaponpowerCloud App", requiresAuth: true },
  },

  // ✅ 404 fallback
  { path: "/:pathMatch(.*)*", redirect: "/surveys" },
];

/* =========================
   Router
   ========================= */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // ✅ BASE_URL مهم للديبلوي تحت ساب-باث
  routes,
});

/* =========================
   Global Guards
   ========================= */

router.beforeEach(async (to, _from, next) => {
  
  if (to.path.startsWith("/survey/")) {
    return next();
  }

  const { isAuthenticated, checkAuth, user } = useSimpleAuth();

  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth);
  const requiresGuest = to.matched.some((r) => r.meta?.requiresGuest);
  const requiresAdmin = to.matched.some((r) => r.meta?.requiresAdmin);

  let authenticated = isAuthenticated.value;

  if (requiresAuth && !authenticated) {
    try {
      authenticated = await checkAuth();
    } catch {
      authenticated = false;
    }

    if (!authenticated) {
      const redirectPath = to.fullPath !== "/" ? to.fullPath : "/surveys";
      return next({ path: "/login", query: { redirect: redirectPath } });
    }
  }

  if (requiresGuest && authenticated) {
    const redirectTo = (to.query.redirect as string) || "/surveys";
    return next(redirectTo);
  }

  if (requiresAdmin && authenticated) {
    const currentUser = user.value;
    const ADMIN_ROLES = new Set(["admin", "super_admin"]);
    if (!currentUser || !ADMIN_ROLES.has(currentUser.role)) {
      return next("/surveys");
    }
  }

  return next();
});

/* =========================
   Title Handling
   ========================= */
router.afterEach(() => {
  document.title = "WHSO Survey";
});

export default router;
