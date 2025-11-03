<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation/Navigation.vue'
import Sidebar from './components/Sidebar/Sidebar.vue'
import { useSimpleAuth } from './composables/useSimpleAuth'
import { useAppStore } from './stores/useAppStore'

const route = useRoute()
const showNavigation = computed(
  () => route.meta?.requiresAuth === true && route.meta?.hideNavigation !== true
)

const store = useAppStore()

// Map store theme ('light' | 'night') to Sidebar prop ('day' | 'night')
const sidebarTheme = computed<'day' | 'night'>(() =>
  store.currentTheme === 'night' ? 'night' : 'day'
)
const toggleTheme = () => store.toggleTheme()

const { user, logout } = useSimpleAuth()
const userRole = computed(() => user.value?.role ?? null)

const sidebarCollapsed = ref(false)
const isRTL = computed(() => document?.dir === 'rtl')
const autoCollapsedForMobile = ref(false)

/* ===== Responsive width logic ===== */
const vw = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1440)
const onResize = () => { vw.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize, { passive: true }))
onUnmounted(() => window.removeEventListener('resize', onResize))

const handleLogout = async () => {
  await logout()
}

/** Expanded width ~ clamp(260px, 22vw, 360px) */
const expandedWidth = computed(() => {
  const min = 160, max = 270, preferred = vw.value * 0.22
  return Math.min(max, Math.max(min, Math.round(preferred)))
})

/** Collapsed width ~ clamp(72px, 6.5vw, 104px) */
const collapsedWidth = computed(() => {
  const min = 72, max = 104, preferred = vw.value * 0.065
  return Math.min(max, Math.max(min, Math.round(preferred)))
})

/** The number you were hard-coding before */
const sidebarWidth = computed(() =>
  sidebarCollapsed.value ? collapsedWidth.value : expandedWidth.value
)

/** Pass CSS vars to Sidebar so its internal CSS (var(--sb-width)) stays in sync */
const sidebarStyleVars = computed(() => ({
  '--sb-width': `${expandedWidth.value}px`,
  '--sb-width-collapsed': `${collapsedWidth.value}px`,
} as Record<string, string>))

/** Offset the content. On tablets/phones we let the sidebar overlay (no margin). */
const contentOffsetStyle = computed(() => {
  if (!showNavigation.value) return {}
  if (vw.value <= 1024) return {} // overlay behavior on small screens
  const px = `${sidebarWidth.value}px`
  return isRTL.value ? { marginRight: px } : { marginLeft: px }
})

watch(
  vw,
  (width) => {
    const isMobile = width <= 1024
    if (isMobile && !autoCollapsedForMobile.value) {
      sidebarCollapsed.value = true
      autoCollapsedForMobile.value = true
    } else if (!isMobile && autoCollapsedForMobile.value) {
      sidebarCollapsed.value = false
      autoCollapsedForMobile.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div :data-theme="store.currentTheme">
    <Sidebar
      v-if="showNavigation"
      v-model="sidebarCollapsed"
      :theme="sidebarTheme"
      :user-role="userRole"
      :style="sidebarStyleVars"    
      @toggleTheme="toggleTheme"
      @logout="handleLogout"
    />

    <main :style="contentOffsetStyle" class="app-main">
      <Navigation v-if="showNavigation" />
      <RouterView />
    </main>
  </div>
</template>

<style>
.app-main { transition: margin-left .25s ease, margin-right .25s ease; }

/* When the sidebar becomes an overlay, keep content full width */
@media (max-width: 1024px) {
  .app-main { margin-left: 0 !important; margin-right: 0 !important; }
}
</style>
