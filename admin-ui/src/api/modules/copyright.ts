import { get, post, del } from '../request'
import type { SongCopyright } from '@/types'

export const copyrightApi = {
  /** 查某首歌的版权 */
  getBySong: (songId: number) =>
    get<SongCopyright | null>(`/songs/${songId}/copyright`),

  /** 保存/更新版权 */
  save: (songId: number, data: Partial<SongCopyright>) =>
    post<SongCopyright>(`/songs/${songId}/copyright`, data as Record<string, unknown>),

  /** 删除版权 */
  remove: (songId: number) =>
    del<void>(`/songs/${songId}/copyright`),

  /** 到期提醒列表 */
  alerts: () =>
    get<SongCopyright[]>('/songs/copyright/alerts'),

  /** 手动刷新版权状态 */
  refresh: () =>
    post<{ expiringSoon: number; expired: number; msg: string }>('/songs/copyright/refresh'),
}
