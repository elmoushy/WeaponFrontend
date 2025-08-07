import { ref, computed, reactive } from 'vue'
import type { 
  DashboardData, 
  DashboardStats, 
  TopStorageUser, 
  ActivityItem, 
  TimeRange,
  StorageBreakdown,
  SecurityMetrics,
  UserActivityMetrics
} from '../types/dashboard.types'

export const useDashboard = () => {
  const isLoading = ref(false)
  const selectedTimeRange = ref<TimeRange>('month')

  // Mock data - In real app, this would come from API
  const mockStats: DashboardStats = {
    totalUsers: 1247,
    privateFiles: 3428,
    totalStorage: '15.2 TB',
    usedStorage: '8.7 TB',
    availableStorage: '6.5 TB',
    usedStoragePercentage: 57
  }

  const mockTopUsers: TopStorageUser[] = [
    {
      id: '1',
      name: 'أحمد محمد علي',
      department: 'العمليات الخاصة',
      storageUsed: '2.3 TB',
      storagePercentage: 85,
      avatar: '👤'
    },
    {
      id: '2', 
      name: 'فاطمة عبدالله',
      department: 'الاستخبارات',
      storageUsed: '1.8 TB',
      storagePercentage: 67,
      avatar: '👤'
    },
    {
      id: '3',
      name: 'خالد حسن',
      department: 'الأمن السيبراني',
      storageUsed: '1.5 TB',
      storagePercentage: 55,
      avatar: '👤'
    }
  ]

  const mockActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'upload',
      user: 'أحمد محمد',
      action: 'fileUploaded',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      details: 'تقرير_عمليات_سري.pdf'
    },
    {
      id: '2',
      type: 'share',
      user: 'فاطمة عبدالله',
      action: 'fileShared',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      details: 'مع قائد الوحدة'
    },
    {
      id: '3',
      type: 'register',
      user: 'محمد سالم',
      action: 'userRegistered',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      details: 'وحدة الاستطلاع'
    },
    {
      id: '4',
      type: 'alert',
      user: 'النظام',
      action: 'systemAlert',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      details: 'محاولة دخول مشبوهة'
    }
  ]

  const mockStorageBreakdown: StorageBreakdown = {
    documents: 45,
    images: 25,
    videos: 20,
    others: 10
  }

  const mockSecurityMetrics: SecurityMetrics = {
    status: 'secure',
    activeThreats: 0,
    blockedAttempts: 12,
    lastScan: new Date(Date.now() - 30 * 60 * 1000)
  }

  const mockUserActivityMetrics: UserActivityMetrics = {
    activeUsers: 245,
    totalLogins: 1683,
    averageSessionTime: '2h 34m',
    peakHours: ['09:00', '14:00', '20:00']
  }

  // Generate chart data based on time range
  const generateChartData = (timeRange: TimeRange) => {
    const now = new Date()
    const labels: string[] = []
    const userActivityData: number[] = []
    const storageData: number[] = []
    const sharingData: number[] = []

    let dataPoints: number
    let labelFormat: (date: Date) => string

    switch (timeRange) {
      case 'week':
        dataPoints = 7
        labelFormat = (date) => date.toLocaleDateString('ar-AE', { weekday: 'short' })
        break
      case 'month':
        dataPoints = 30
        labelFormat = (date) => date.getDate().toString()
        break
      case 'year':
        dataPoints = 12
        labelFormat = (date) => date.toLocaleDateString('ar-AE', { month: 'short' })
        break
    }

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now)
      if (timeRange === 'year') {
        date.setMonth(date.getMonth() - i)
      } else {
        date.setDate(date.getDate() - i)
      }
      
      labels.push(labelFormat(date))
      userActivityData.push(Math.floor(Math.random() * 100) + 50)
      storageData.push(Math.floor(Math.random() * 50) + 20)
      sharingData.push(Math.floor(Math.random() * 30) + 10)
    }

    return {
      userActivity: {
        labels,
        datasets: [{
          label: 'نشاط المستخدمين',
          data: userActivityData,
          borderColor: '#997A51',
          backgroundColor: 'rgba(153, 122, 81, 0.1)',
          tension: 0.4,
          borderWidth: 2
        }]
      },
      storageUsage: {
        labels,
        datasets: [{
          label: 'استخدام التخزين (GB)',
          data: storageData,
          borderColor: '#CFA365',
          backgroundColor: 'rgba(207, 163, 101, 0.1)',
          tension: 0.4,
          borderWidth: 2
        }]
      },
      fileSharing: {
        labels,
        datasets: [{
          label: 'مشاركة الملفات',
          data: sharingData,
          borderColor: '#AE5D5A',
          backgroundColor: 'rgba(174, 93, 90, 0.1)',
          tension: 0.4,
          borderWidth: 2
        }]
      }
    }
  }

  // Reactive dashboard data
  const dashboardData = reactive<DashboardData>({
    stats: mockStats,
    topStorageUsers: mockTopUsers,
    recentActivity: mockActivity,
    chartData: generateChartData(selectedTimeRange.value),
    storageBreakdown: mockStorageBreakdown,
    securityMetrics: mockSecurityMetrics,
    userActivityMetrics: mockUserActivityMetrics
  })

  // Update chart data when time range changes
  const updateTimeRange = (timeRange: TimeRange) => {
    selectedTimeRange.value = timeRange
    dashboardData.chartData = generateChartData(timeRange)
  }

  // Format time ago
  const formatTimeAgo = (date: Date, t: (key: string) => string): string => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('dashboard.minutes')}`
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} ${t('dashboard.hours')}`
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60))
      return `${days} ${t('dashboard.days')}`
    }
  }

  // Format storage size
  const formatStorageSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  // Refresh dashboard data
  const refreshData = async () => {
    isLoading.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update data with new mock values
      dashboardData.stats.totalUsers += Math.floor(Math.random() * 10)
      dashboardData.stats.privateFiles += Math.floor(Math.random() * 50)
      dashboardData.chartData = generateChartData(selectedTimeRange.value)
      
    } finally {
      isLoading.value = false
    }
  }

  // Computed properties
  const storageUsagePercentage = computed(() => 
    Math.round((parseFloat(dashboardData.stats.usedStorage) / parseFloat(dashboardData.stats.totalStorage)) * 100)
  )

  const recentActivityItems = computed(() => 
    dashboardData.recentActivity.slice(0, 5)
  )

  const securityStatusColor = computed(() => {
    switch (dashboardData.securityMetrics.status) {
      case 'secure': return '#997A51'
      case 'warning': return '#CFA365'
      case 'critical': return '#AE5D5A'
      default: return '#997A51'
    }
  })

  return {
    dashboardData,
    isLoading,
    selectedTimeRange,
    updateTimeRange,
    formatTimeAgo,
    formatStorageSize,
    refreshData,
    storageUsagePercentage,
    recentActivityItems,
    securityStatusColor
  }
}
