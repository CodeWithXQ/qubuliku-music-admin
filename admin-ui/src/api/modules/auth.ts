import { post, get } from '../request'
import type { LoginForm, LoginResult, UserInfo } from '@/types'

export const authApi = {
  login: (data: LoginForm) => post<LoginResult>('/auth/login', data as unknown as Record<string, unknown>),
  logout: () => post<void>('/auth/logout'),
  getInfo: () => get<UserInfo>('/auth/info'),
}
