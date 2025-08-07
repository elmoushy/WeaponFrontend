<template>
  <header :class="$style.header" :data-theme="currentTheme">
    <nav :class="$style.nav">
      <!-- Logo Section -->
      <!-- <div :class="$style.logo">
        <img src="/News-Logo.png" alt="WPC Logo" :class="$style.logoIcon" />
      </div> -->

      <!-- Navigation Links -->
      <div :class="$style.navLinks">
        <router-link 
          v-for="link in navigationLinks" 
          :key="link.name"
          :to="link.path" 
          :class="[$style.navLink, { [$style.active]: route.path === link.path }]"
          :title="link.title"
        >
          <i :class="link.icon"></i>
          <span>{{ t(link.label) }}</span>
        </router-link>
      </div>

      <!-- Right Section -->
      <div :class="$style.rightSection">
        <!-- Notifications -->
        <div :class="$style.notifications" @click.stop="toggleNotifications" data-dropdown>
          <i class="fas fa-bell"></i>
          <span v-if="notificationCount > 0" :class="$style.badge">{{ notificationCount }}</span>
          
          <!-- Notifications Dropdown -->
          <div v-if="showNotifications" :class="$style.dropdown" data-dropdown @click.stop>
            <div :class="$style.dropdownHeader">
              <h3>{{ t('header.notifications') }}</h3>
              <button @click="markAllAsRead" :class="$style.markAllRead">
                {{ t('header.markAllRead') }}
              </button>
            </div>
            <div :class="$style.notificationsList">
              <div 
                v-for="notification in notifications" 
                :key="notification.id"
                :class="[$style.notificationItem, { [$style.unread]: !notification.read }]"
              >
                <i :class="notification.icon"></i>
                <div :class="$style.notificationContent">
                  <p>{{ notification.message }}</p>
                  <span :class="$style.notificationTime">{{ notification.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Info -->
        <div :class="$style.userInfo" @click.stop="toggleUserMenu" data-dropdown>
          <div :class="$style.userAvatar">
            <img v-if="userDisplayName" :src="generateAvatarUrl(userEmail)" :alt="userDisplayName" />
            <i v-else class="fas fa-user"></i>
          </div>
          <span :class="$style.username">{{ userDisplayName || 'Guest' }}</span>
          <i class="fas fa-chevron-down" :class="{ [$style.rotated]: showUserMenu }"></i>
          
          <!-- User Dropdown -->
          <div v-if="showUserMenu" :class="$style.userDropdown" data-dropdown @click.stop>
            <!-- User Profile Header -->
            <div :class="$style.userDropdownHeader">
              <div :class="$style.userProfileSection">
                <div :class="$style.userAvatarLarge">
                  <img v-if="userDisplayName" :src="generateAvatarUrl(userEmail)" :alt="userDisplayName" />
                  <i v-else class="fas fa-user"></i>
                </div>
                <div :class="$style.userDetailsSection">
                  <div :class="$style.userDisplayName">{{ userDisplayName || 'Guest User' }}</div>
                  <div :class="$style.userEmailText">{{ userEmail || 'No email available' }}</div>
                  <div :class="$style.userStatus">
                    <div :class="$style.statusIndicator"></div>
                    <span>{{'Online' }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Dropdown Menu Items -->
            <div :class="$style.userDropdownContent">
              
              <div :class="$style.dropdownDivider"></div>
              
              <button @click="handleLogout" :class="[$style.userDropdownLink, $style.logoutButton]">
                <div :class="$style.linkIcon">
                  <i class="fas fa-sign-out-alt"></i>
                </div>
                <div :class="$style.linkContent">
                  <span :class="$style.linkTitle">{{ 'Sign Out' }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Settings -->
        <!-- <div :class="$style.settings" @click.stop="toggleSettings" data-dropdown>
          <i class="fas fa-cog"></i> -->
          
          <!-- Settings Dropdown -->
          <!-- <div v-if="showSettings" :class="$style.dropdown" data-dropdown @click.stop>
            <div :class="$style.dropdownHeader">
              <h3>{{ t('header.settings') }}</h3>
            </div> -->
            
            <!-- Language Section - Release One: Arabic Only -->
            <!-- <div :class="$style.settingItem">
              <i class="fas fa-language"></i>
              <span>{{ t('header.language') }}</span>
              <select v-model="currentLanguage" @change="changeLanguage" :class="$style.select" disabled>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div> -->

            <!-- Theme Toggle -->
            <!-- <div :class="$style.settingItem">
              <i class="fas fa-palette"></i>
              <span>{{ t('header.theme') }}</span>
              <button @click="toggleTheme" :class="$style.themeToggle">
                <i :class="currentTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon'"></i>
                {{ t(currentTheme === 'light' ? 'header.lightMode' : 'header.darkMode') }}
              </button>
            </div> -->

            <!-- Logout -->
            <!-- <div :class="$style.settingItem" @click="handleLogout">
              <i class="fas fa-sign-out-alt"></i>
              <span>{{ t('header.logout') }}</span>
            </div>
          </div>
        </div> -->

        <!-- Mobile Menu Toggle -->
        <button 
          :class="$style.mobileToggle" 
          @click.stop="toggleMobileMenu"
          :aria-expanded="showMobileMenu"
          aria-label="Toggle mobile menu"
          data-dropdown
        >
          <i :class="showMobileMenu ? 'fas fa-times' : 'fas fa-bars'"></i>
        </button>
      </div>
    </nav>

    <!-- Mobile Navigation -->
    <Transition name="mobile-menu">
      <div v-if="showMobileMenu" :class="$style.mobileNav" data-dropdown @click.stop>
        <router-link 
          v-for="link in navigationLinks" 
          :key="link.name"
          :to="link.path" 
          :class="[$style.mobileNavLink, { [$style.active]: route.path === link.path }]"
          @click="closeMobileMenu"
        >
          <i :class="link.icon"></i>
          <span>{{ t(link.label) }}</span>
        </router-link>
      </div>
    </Transition>

    <!-- Overlay for dropdowns -->
    <div 
      v-if="showSettings || showNotifications || showMobileMenu || showUserMenu" 
      :class="$style.overlay" 
      @click="closeAllDropdowns"
    ></div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { useJWTAuth } from '../../composables/useJWTAuth'

// Store and router
const store = useAppStore()
const router = useRouter()
const route = useRoute()

// JWT Authentication
const { 
  userFullName: userDisplayName, 
  user,
  logout: authLogout
} = useJWTAuth()

// Computed user email
const userEmail = computed(() => user.value?.email || '')

// Reactive state
const showSettings = ref(false)
const showNotifications = ref(false)
const showMobileMenu = ref(false)
const showUserMenu = ref(false)

// Computed properties
// Computed properties for template usage
// @ts-ignore - Used in template
const currentLanguage = computed({
  get: () => store.currentLanguage,
  set: (value) => store.setLanguage(value)
})

const currentTheme = computed(() => store.currentTheme)
const t = computed(() => store.t)

// Navigation links - Release One: Only Surveys and Control pages
const navigationLinks = ref([
  // Commented out for Release One - not required in production
  // { 
  //   name: 'Welcome', 
  //   path: '/welcome', 
  //   icon: 'fas fa-home', 
  //   label: 'navigation.welcome',
  //   title: 'Welcome Page'
  // },
  // { 
  //   name: 'Dashboard', 
  //   path: '/dashboard', 
  //   icon: 'fas fa-tachometer-alt', 
  //   label: 'navigation.dashboard',
  //   title: 'Dashboard'
  // },
  // { 
  //   name: 'Projects', 
  //   path: '/projects', 
  //   icon: 'fas fa-folder', 
  //   label: 'navigation.projects',
  //   title: 'Projects'
  // },
  
  // Release One: Required pages only
  { 
    name: 'Surveys', 
    path: '/surveys', 
    icon: 'fas fa-poll', 
    label: 'navigation.surveys',
    title: 'Surveys'
  },
  { 
    name: 'Control', 
    path: '/control', 
    icon: 'fas fa-cogs', 
    label: 'navigation.control',
    title: 'Control Panel'
  }
])

// Notifications data (replace with actual notifications from store/API)
const notifications = ref([
  {
    id: 1,
    icon: 'fas fa-upload',
    message: 'File upload completed successfully',
    time: '2 minutes ago',
    read: false
  },
  {
    id: 2,
    icon: 'fas fa-share',
    message: 'Document shared with team',
    time: '10 minutes ago',
    read: false
  },
  {
    id: 3,
    icon: 'fas fa-bell',
    message: 'System maintenance scheduled',
    time: '1 hour ago',
    read: true
  }
])

const notificationCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

// Methods
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showSettings.value = false
  showNotifications.value = false
  showMobileMenu.value = false
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showSettings.value = false
  showMobileMenu.value = false
  showUserMenu.value = false
}

const toggleMobileMenu = () => {
  // Use setTimeout to prevent immediate closing due to event bubbling
  setTimeout(() => {
    showMobileMenu.value = !showMobileMenu.value
    showSettings.value = false
    showNotifications.value = false
    showUserMenu.value = false
  }, 0)
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const closeAllDropdowns = () => {
  showSettings.value = false
  showNotifications.value = false
  showMobileMenu.value = false
  showUserMenu.value = false
}

// Generate avatar URL from email (using Gravatar as fallback)
const generateAvatarUrl = (email: string) => {
  if (!email) return ''
  
  // Use UI Avatars service as a fallback
  const name = userDisplayName.value ? encodeURIComponent(userDisplayName.value) : 'User'
  return `https://ui-avatars.com/api/?name=${name}&background=667eea&color=fff&size=128&rounded=true`
}

// Handle JWT logout
const handleLogout = async () => {
  try {
    await authLogout()
    // The authLogout function will handle redirecting to login page
  } catch (error) {
    console.error('Logout error:', error)
    // Fallback: redirect to login page
    router.push('/login')
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

// Handle clicks outside dropdowns
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  
  // Don't close if clicking on dropdown elements or mobile toggle
  if (!target.closest('[data-dropdown]')) {
    closeAllDropdowns()
  }
}

// Handle escape key to close dropdowns
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeAllDropdowns()
  }
}

// Prevent body scroll when dropdowns are open on mobile
const preventBodyScroll = () => {
  if (showSettings.value || showNotifications.value || showMobileMenu.value || showUserMenu.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Watch for dropdown state changes to handle body scroll
watch([showSettings, showNotifications, showMobileMenu, showUserMenu], () => {
  preventBodyScroll()
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
  // Reset body scroll on unmount
  document.body.style.overflow = ''
})
</script>

<style module src="./Navigation.module.css">
/* CSS Module styles are imported from Navigation.module.css */
</style>
