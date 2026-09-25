import { get, post, put, del, upload, downloadGet } from '../request'
import type { Song, PageParams, PageResult } from '@/types'

export interface SongQuery extends PageParams {
  keyword?: string
  style?: string
  auditStatus?: string
}

export const songApi = {
  list: (params: SongQuery) =>
    get<PageResult<Song>>('/songs', params as unknown as Record<string, unknown>),

  detail: (id: number) => get<Song>(`/songs/${id}`),

  create: (data: Partial<Song>) =>
    post<Song>('/songs', data as unknown as Record<string, unknown>),

  update: (id: number, data: Partial<Song>) =>
    put<Song>(`/songs/${id}`, data as unknown as Record<string, unknown>),

  remove: (id: number) => del<void>(`/songs/${id}`),

  // 审核：通过/驳回（驳回可附带原因）
  audit: (id: number, action: 'pass' | 'reject', remark?: string) =>
    post<void>(`/songs/${id}/audit`, { action, remark }),

  batchAudit: (ids: number[], action: 'pass' | 'reject', remark?: string) =>
    post<void>('/songs/batch-audit', { ids, action, remark }),

  // 上架 / 下架
  publish: (id: number) => post<void>(`/songs/${id}/publish`),

  unpublish: (id: number) => post<void>(`/songs/${id}/unpublish`),

  batchPublish: (ids: number[]) => post<void>('/songs/batch-publish', { ids }),

  batchUnpublish: (ids: number[]) => post<void>('/songs/batch-unpublish', { ids }),

  // 驳回后重新提交审核
  resubmit: (id: number) => post<void>(`/songs/${id}/resubmit`),

  fingerprint: (id: number) => post<void>(`/songs/${id}/fingerprint`),

  // 文件上传
  uploadCover: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return upload<{ url: string }>('/songs/upload/cover', fd)
  },

  uploadAudio: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return upload<{ url: string }>('/songs/upload/audio', fd)
  },

  stats: () => get<Record<string, number>>('/songs/stats'),

  export: (params?: SongQuery) =>
    downloadGet('/songs/export', params as unknown as Record<string, unknown>),
}
