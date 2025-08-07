<template>
  <div class="dashboard-page">
    <Navigation />
    <main :class="styles.dashboard">
      <div :class="styles.container">
        <!-- Dashboard Header -->
        <header :class="styles.header">
          <div>
            <h1 :class="styles.title">{{ appStore.t('dashboard.title') }}</h1>
            <p :class="styles.subtitle">{{ appStore.t('dashboard.overview') }}</p>
          </div>
          <div :class="styles.controls">
            <button 
              :class="styles.refreshBtn" 
              @click="refreshData"
              :disabled="isLoading"
            >
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i>
              {{ appStore.t('common.refresh') }}
            </button>
            
            <div :class="styles.timeRangeSelector">
              <button 
                v-for="range in timeRanges" 
                :key="range"
                :class="[styles.timeRangeBtn, { [styles.active]: selectedTimeRange === range }]"
                @click="updateTimeRange(range)"
              >
                {{ appStore.t(`dashboard.${range}`) }}
              </button>
            </div>
          </div>
        </header>

        <!-- Loading State -->
        <div v-if="isLoading" :class="styles.loading">
          <div :class="styles.loadingSpinner"></div>
          {{ appStore.t('common.loading') }}
        </div>

        <template v-else>
          <!-- Stats Grid -->
          <div :class="styles.statsGrid">
            <!-- Total Users -->
            <div :class="styles.statCard">
              <div :class="styles.statHeader">
                <div>
                  <p :class="styles.statLabel">{{ appStore.t('dashboard.totalUsers') }}</p>
                  <h3 :class="styles.statValue">{{ dashboardData.stats.totalUsers.toLocaleString() }}</h3>
                  <p :class="styles.statSubtext">+{{ Math.floor(Math.random() * 50) + 10 }} {{ appStore.t('dashboard.thisMonth') }}</p>
                </div>
                <div :class="styles.statIcon">
                  <i class="fas fa-users"></i>
                </div>
              </div>
            </div>

            <!-- Private Files -->
            <div :class="styles.statCard">
              <div :class="styles.statHeader">
                <div>
                  <p :class="styles.statLabel">{{ appStore.t('dashboard.privateFiles') }}</p>
                  <h3 :class="styles.statValue">{{ dashboardData.stats.privateFiles.toLocaleString() }}</h3>
                  <p :class="styles.statSubtext">{{ appStore.t('dashboard.files') }}</p>
                </div>
                <div :class="styles.statIcon">
                  <i class="fas fa-lock"></i>
                </div>
              </div>
            </div>

            <!-- Storage Usage -->
            <div :class="styles.statCard">
              <div :class="styles.statHeader">
                <div>
                  <p :class="styles.statLabel">{{ appStore.t('dashboard.storageUsage') }}</p>
                  <h3 :class="styles.statValue">{{ dashboardData.stats.usedStorage }}</h3>
                  <p :class="styles.statSubtext">{{ appStore.t('dashboard.totalStorage') }}: {{ dashboardData.stats.totalStorage }}</p>
                </div>
                <div :class="styles.statIcon">
                  <i class="fas fa-hdd"></i>
                </div>
              </div>
              <div :class="styles.progressBar">
                <div 
                  :class="styles.progressFill" 
                  :style="{ width: `${dashboardData.stats.usedStoragePercentage}%` }"
                ></div>
              </div>
            </div>

            <!-- Security Status -->
            <div :class="styles.statCard">
              <div :class="styles.statHeader">
                <div>
                  <p :class="styles.statLabel">{{ appStore.t('dashboard.security') }}</p>
                  <h3 :class="styles.statValue">{{ appStore.t('dashboard.secure') }}</h3>
                  <p :class="styles.statSubtext">{{ dashboardData.securityMetrics.blockedAttempts }} {{ appStore.t('common.blocked') }}</p>
                </div>
                <div :class="styles.statIcon">
                  <i class="fas fa-shield-alt"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content Grid -->
          <div :class="styles.mainGrid">
            <!-- Sidebar -->
            <div :class="styles.sidebar">
              <!-- Top Storage Users -->
              <div :class="styles.sidebarCard">
                <div :class="styles.sidebarHeader">
                  <h3 :class="styles.sidebarTitle">{{ appStore.t('dashboard.topStorageUsers') }}</h3>
                </div>
                <div :class="styles.sidebarContent">
                  <ul :class="styles.usersList">
                    <li v-for="user in dashboardData.topStorageUsers" :key="user.id" :class="styles.userItem">
                      <div :class="styles.userAvatar">
                        {{ user.name.split(' ')[0][0] }}{{ user.name.split(' ')[1]?.[0] || '' }}
                      </div>
                      <div :class="styles.userInfo">
                        <p :class="styles.userName">{{ user.name }}</p>
                        <p :class="styles.userDepartment">{{ user.department }}</p>
                      </div>
                      <div :class="styles.userStorage">
                        <p :class="styles.storageAmount">{{ user.storageUsed }}</p>
                        <div :class="styles.storageProgress">
                          <div 
                            :class="styles.storageProgressFill" 
                            :style="{ width: `${user.storagePercentage}%` }"
                          ></div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Storage Breakdown -->
              <div :class="styles.sidebarCard">
                <div :class="styles.sidebarHeader">
                  <h3 :class="styles.sidebarTitle">{{ appStore.t('dashboard.storageUsage') }}</h3>
                </div>
                <div :class="styles.sidebarContent">
                  <div :class="styles.storageBreakdown">
                    <DoughnutChart :data="storageBreakdownChart" />
                    <div :class="styles.storageItems">
                      <div :class="styles.storageItem">
                        <div :class="styles.storageIcon">📄</div>
                        <p :class="styles.storagePercentage">{{ dashboardData.storageBreakdown.documents }}%</p>
                        <p :class="styles.storageType">{{ appStore.t('common.documents') }}</p>
                      </div>
                      <div :class="styles.storageItem">
                        <div :class="styles.storageIcon">🖼️</div>
                        <p :class="styles.storagePercentage">{{ dashboardData.storageBreakdown.images }}%</p>
                        <p :class="styles.storageType">{{ appStore.t('common.images') }}</p>
                      </div>
                      <div :class="styles.storageItem">
                        <div :class="styles.storageIcon">🎥</div>
                        <p :class="styles.storagePercentage">{{ dashboardData.storageBreakdown.videos }}%</p>
                        <p :class="styles.storageType">{{ appStore.t('common.videos') }}</p>
                      </div>
                      <div :class="styles.storageItem">
                        <div :class="styles.storageIcon">📦</div>
                        <p :class="styles.storagePercentage">{{ dashboardData.storageBreakdown.others }}%</p>
                        <p :class="styles.storageType">{{ appStore.t('common.others') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Charts Section -->
            <div :class="styles.chartSection">
              <!-- User Activity Chart -->
              <div :class="styles.chartCard">
                <div :class="styles.chartHeader">
                  <h3 :class="styles.chartTitle">{{ appStore.t('dashboard.userActivity') }}</h3>
                  <p :class="styles.chartSubtitle">{{ appStore.t('dashboard.analytics') }}</p>
                </div>
                <LineChart :data="dashboardData.chartData.userActivity" />
              </div>

              <!-- Storage Usage Chart -->
              <div :class="[styles.chartCard, styles.chartCardStorageUsage]">
                <div :class="styles.chartHeader">
                  <h3 :class="styles.chartTitle">{{ appStore.t('dashboard.storageUsage') }}</h3>
                  <p :class="styles.chartSubtitle">{{ appStore.t('dashboard.analytics') }}</p>
                </div>
                <LineChart :data="dashboardData.chartData.storageUsage" />
              </div>

              <!-- Recent Activity -->
              <div :class="styles.sidebarCard">
                <div :class="styles.sidebarHeader">
                  <h3 :class="styles.sidebarTitle">{{ appStore.t('dashboard.recentActivity') }}</h3>
                </div>
                <div :class="styles.sidebarContent">
                  <ul :class="styles.activityList">
                    <li v-for="activity in recentActivityItems" :key="activity.id" :class="styles.activityItem">
                      <div :class="[styles.activityIcon, styles[activity.type]]">
                        <i :class="getActivityIcon(activity.type)"></i>
                      </div>
                      <div :class="styles.activityContent">
                        <p :class="styles.activityText">
                          <strong>{{ activity.user }}</strong> {{ appStore.t(`dashboard.${activity.action}`) }}
                        </p>
                        <p :class="styles.activityTime">{{ formatTimeAgo(activity.timestamp, appStore.t) }}</p>
                        <p v-if="activity.details" :class="styles.activityDetails">{{ activity.details }}</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { useDashboard } from '../../composables/useDashboard'
import Navigation from '../../components/Navigation/Navigation.vue'
import LineChart from '../../components/Charts/LineChart.vue'
import DoughnutChart from '../../components/Charts/DoughnutChart.vue'
import styles from './Dashboard.module.css'
import type { TimeRange } from '../../types/dashboard.types'

const appStore = useAppStore()
const {
  dashboardData,
  isLoading,
  selectedTimeRange,
  updateTimeRange,
  formatTimeAgo,
  refreshData,
  recentActivityItems
} = useDashboard()

const timeRanges: TimeRange[] = ['week', 'month', 'year']

// Storage breakdown chart data
const storageBreakdownChart = computed(() => ({
  labels: [
    appStore.t('common.documents'),
    appStore.t('common.images'),
    appStore.t('common.videos'),
    appStore.t('common.others')
  ],
  datasets: [{
    data: [
      dashboardData.storageBreakdown.documents,
      dashboardData.storageBreakdown.images,
      dashboardData.storageBreakdown.videos,
      dashboardData.storageBreakdown.others
    ],
    backgroundColor: [
      '#997A51',
      '#CFA365',
      '#AE5D5A',
      '#E5D2BA'
    ],
    borderColor: [
      '#997A51',
      '#CFA365',
      '#AE5D5A',
      '#E5D2BA'
    ]
  }]
}))

// Get activity icon based on type
const getActivityIcon = (type: string): string => {
  const icons = {
    upload: 'fas fa-upload',
    share: 'fas fa-share-alt',
    register: 'fas fa-user-plus',
    alert: 'fas fa-exclamation-triangle'
  }
  return icons[type as keyof typeof icons] || 'fas fa-info-circle'
}

// Initialize dashboard
onMounted(() => {
  refreshData()
})
</script>
