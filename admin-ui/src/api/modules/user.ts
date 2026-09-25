import { get, post, put, del, upload, downloadGet } from '../request'
import type { AppUser, PageParams, PageResult } from '@/types'

export interface UserQuery extends PageParams {
  keyword?: string
  status?: string
  userType?: string
}

export const userApi = {
  list: (params: UserQuery) =>
    get<PageResult<AppUser>>('/users', params as unknown as Record<string, unknown>),

  detail: (id: number) => get<AppUser>(`/users/${id}`),

  create: (data: Partial<AppUser>) =>
    post<AppUser>('/users', data as unknown as Record<string, unknown>),

  update: (id: number, data: Partial<AppUser>) =>
    put<AppUser>(`/users/${id}`, data as unknown as Record<string, unknown>),

  updateStatus: (id: number, status: number) =>
    put<void>(`/users/${id}/status`, { status }),

  remove: (id: number) => del<void>(`/users/${id}`),

  // 头像上传
  uploadAvatar: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return upload<{ url: string }>('/users/upload/avatar', fd)
  },

  stats: () => get<Record<string, number>>('/users/stats'),

  export: (params?: UserQuery) =>
    downloadGet('/users/export', params as unknown as Record<string, unknown>),

  profile: (id: number) => get<AppUser>(`/users/${id}/profile`),
}
