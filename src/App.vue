<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation/Navigation.vue'

// Check if current route needs navigation
const route = useRoute()
const showNavigation = computed(() => {
  // Show navigation on all authenticated pages
  return route.meta?.requiresAuth === true
})
</script>

<template>
  <div>
    <!-- Navigation for authenticated pages -->
    <Navigation v-if="showNavigation" />
    
    <!-- Main content with proper spacing when navigation is shown -->
    <main :style="{ paddingTop: showNavigation ? '70px' : '0' }">
      <RouterView />
    </main>
  </div>
</template>
