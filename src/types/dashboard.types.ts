export interface DashboardStats {
  totalUsers: number
  privateFiles: number
  totalStorage: string
  usedStorage: string
  availableStorage: string
  usedStoragePercentage: number
}

export interface TopStorageUser {
  id: string
  name: string
  department: string
  storageUsed: string
  storagePercentage: number
  avatar?: string
}

export interface ActivityData {
  date: string
  uploads: number
  downloads: number
  shares: number
  users: number
}

export interface ActivityItem {
  id: string
  type: 'upload' | 'share' | 'register' | 'alert'
  user: string
  action: string
  timestamp: Date
  details?: string
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
    tension?: number
  }[]
}

export interface StorageBreakdown {
  documents: number
  images: number
  videos: number
  others: number
}

export interface SecurityMetrics {
  status: 'secure' | 'warning' | 'critical'
  activeThreats: number
  blockedAttempts: number
  lastScan: Date
}

export interface UserActivityMetrics {
  activeUsers: number
  totalLogins: number
  averageSessionTime: string
  peakHours: string[]
}

export type TimeRange = 'week' | 'month' | 'year'

export interface DashboardData {
  stats: DashboardStats
  topStorageUsers: TopStorageUser[]
  recentActivity: ActivityItem[]
  chartData: {
    userActivity: ChartData
    storageUsage: ChartData
    fileSharing: ChartData
  }
  storageBreakdown: StorageBreakdown
  securityMetrics: SecurityMetrics
  userActivityMetrics: UserActivityMetrics
}
