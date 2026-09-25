import { get, put } from '../request'
import type { UserInfo } from '@/types'

export interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export interface Preferences {
  defaultPage: string
  pageSize: number
}

export const systemApi = {
  getProfile: () => get<UserInfo>('/system/profile'),

  updateProfile: (data: Partial<UserInfo>) =>
    put<void>('/system/profile', data as unknown as Record<string, unknown>),

  updatePassword: (data: PasswordForm) =>
    put<void>('/system/password', data as unknown as Record<string, unknown>),

  getPreferences: () => get<Preferences>('/system/preferences'),

  updatePreferences: (data: Preferences) =>
    put<void>('/system/preferences', data as unknown as Record<string, unknown>),
}
