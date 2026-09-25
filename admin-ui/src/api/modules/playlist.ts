import { get, post, put, del, upload, downloadGet } from '../request'
import type { Playlist, Song, PageParams, PageResult } from '@/types'

export interface PlaylistQuery extends PageParams {
  keyword?: string
  category?: string
  status?: string
}

export const playlistApi = {
  list: (params: PlaylistQuery) =>
    get<PageResult<Playlist>>('/playlists', params as unknown as Record<string, unknown>),

  detail: (id: number) => get<Playlist>(`/playlists/${id}`),

  create: (data: Partial<Playlist>) =>
    post<Playlist>('/playlists', data as unknown as Record<string, unknown>),

  update: (id: number, data: Partial<Playlist>) =>
    put<Playlist>(`/playlists/${id}`, data as unknown as Record<string, unknown>),

  remove: (id: number) => del<void>(`/playlists/${id}`),

  // 审核
  audit: (id: number, action: 'pass' | 'reject', remark?: string) =>
    post<void>(`/playlists/${id}/audit`, { action, remark }),

  batchAudit: (ids: number[], action: 'pass' | 'reject', remark?: string) =>
    post<void>('/playlists/batch-audit', { ids, action, remark }),

  // 上架 / 下架
  publish: (id: number) => post<void>(`/playlists/${id}/publish`),

  unpublish: (id: number) => post<void>(`/playlists/${id}/unpublish`),

  batchPublish: (ids: number[]) => post<void>('/playlists/batch-publish', { ids }),

  batchUnpublish: (ids: number[]) => post<void>('/playlists/batch-unpublish', { ids }),

  // 驳回后重新提交审核
  resubmit: (id: number) => post<void>(`/playlists/${id}/resubmit`),

  togglePin: (id: number) => put<void>(`/playlists/${id}/pin`),

  // 获取歌单内的歌曲列表
  getSongs: (id: number) => get<Song[]>(`/playlists/${id}/songs`),

  addSongs: (id: number, songIds: number[]) =>
    post<void>(`/playlists/${id}/songs`, { songIds }),

  stats: () => get<Record<string, number>>('/playlists/stats'),

  export: (params?: PlaylistQuery) =>
    downloadGet('/playlists/export', params as unknown as Record<string, unknown>),

  removeSong: (playlistId: number, songId: number) =>
    del<void>(`/playlists/${playlistId}/songs/${songId}`),

  // 封面上传
  uploadCover: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return upload<{ url: string }>('/playlists/upload/cover', fd)
  },
}
