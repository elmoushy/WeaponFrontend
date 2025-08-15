<template>
  <div class="analytics-page">
    <Header />
    <Navigation />
    <main style="margin-top: 140px; padding: 2rem;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <h1>{{ appStore.t('analytics.title') }}</h1>
        <p>Analytics page coming soon...</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/useAppStore'
import Navigation from '../../components/Navigation/Navigation.vue'

const appStore = useAppStore()
</script>
