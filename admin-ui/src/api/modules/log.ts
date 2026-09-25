import { get, del, downloadGet } from '../request'
import type { OperationLog, PageParams, PageResult } from '@/types'

export interface LogQuery extends PageParams {
  keyword?: string
  opType?: string
  module?: string
  startDate?: string
  endDate?: string
}

export interface LogStats {
  todayCount: number
  successCount: number
  errorCount: number
  pendingCount: number
}

export const logApi = {
  list: (params: LogQuery) =>
    get<PageResult<OperationLog>>('/logs/operations', params as unknown as Record<string, unknown>),

  stats: () => get<LogStats>('/logs/operations/stats'),

  export: (params?: LogQuery) =>
    downloadGet('/logs/operations/export', params as unknown as Record<string, unknown>),

  remove: (id: number) => del<void>(`/logs/operations/${id}`),

  clear: () => del<{ msg: string }>('/logs/operations'),
}
