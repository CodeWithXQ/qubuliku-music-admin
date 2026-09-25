import { get } from '../request'
import type { TopSong, ChartDataItem } from '@/types'

export interface PlayTrend {
  style: string
  playCount: number
  trend: number
  date: string
}

export interface UserGrowth {
  newUsers: number
  activeUsers: number
  retentionRate: number
  vipRenewRate: number
  date: string
}

export const dataApi = {
  overviewStats: () =>
    get<{ totalPlayCount: number; dailyActiveUser: number; newSongCount: number; conversionRate: number }>('/data/overview-stats'),

  playTrends: (days?: number) =>
    get<PlayTrend[]>('/data/play-trends', { days: days ?? 7 }),

  userGrowth: (days?: number) =>
    get<UserGrowth[]>('/data/user-growth', { days: days ?? 7 }),

  hotSongs: (limit?: number) =>
    get<TopSong[]>('/data/hot-songs', { limit: limit ?? 10 }),
}
