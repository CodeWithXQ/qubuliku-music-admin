import { get } from '../request'
import type { DashboardOverview, ChartDataItem } from '@/types'

export interface TopSong {
  rank: number
  title: string
  style: string
  singerName: string
  playCount: number
}

export const dashboardApi = {
  overview: () => get<DashboardOverview>('/dashboard/overview'),

  topSongs: (limit?: number) =>
    get<TopSong[]>('/dashboard/top-songs', { limit: limit ?? 10 }),

  styleDistribution: () =>
    get<ChartDataItem[]>('/dashboard/style-distribution'),
}
