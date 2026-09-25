import { get, post, put, del, upload, downloadGet } from '../request'
import type { Singer, PageParams, PageResult } from '@/types'

export interface SingerQuery extends PageParams {
  keyword?: string
  style?: string
  certStatus?: string
}

export const singerApi = {
  list: (params: SingerQuery) =>
    get<PageResult<Singer>>('/singers', params as unknown as Record<string, unknown>),

  detail: (id: number) => get<Singer>(`/singers/${id}`),

  create: (data: Partial<Singer>) =>
    post<Singer>('/singers', data as unknown as Record<string, unknown>),

  update: (id: number, data: Partial<Singer>) =>
    put<Singer>(`/singers/${id}`, data as unknown as Record<string, unknown>),

  remove: (id: number) => del<void>(`/singers/${id}`),

  // 头像上传
  uploadAvatar: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return upload<{ url: string }>('/singers/upload/avatar', fd)
  },

  // 认证审核
  certify: (id: number, action: 'pass' | 'reject', remark?: string) =>
    post<void>(`/singers/${id}/certify`, { action, remark }),

  // 重新提交认证
  resubmit: (id: number) =>
    post<void>(`/singers/${id}/resubmit`),

  stats: () => get<Record<string, number>>('/singers/stats'),

  export: (params?: SingerQuery) =>
    downloadGet('/singers/export', params as unknown as Record<string, unknown>),
}
