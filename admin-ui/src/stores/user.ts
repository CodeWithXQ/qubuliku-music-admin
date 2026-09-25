import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/modules/auth'
import { systemApi } from '@/api/modules/system'
import { setToken, removeToken, getToken } from '@/utils'
import type { UserInfo, LoginForm } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken())
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])
  const roles = ref<string[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username ?? '')
  const avatar = computed(() => userInfo.value?.avatar ?? '')
  const displayName = computed(() => userInfo.value?.realName || userInfo.value?.username || '管理员')

  /** 检查是否有某个权限 */
  function hasPermission(perm: string): boolean {
    if (roles.value.includes('admin')) return true
    return permissions.value.includes(perm)
  }

  /** 登录 */
  async function login(form: LoginForm) {
    const result = await authApi.login(form)
    token.value = result.token
    setToken(result.token)
    await fetchUserInfo()
  }

  /** 获取当前用户信息 */
  async function fetchUserInfo() {
    const info = await authApi.getInfo()
    userInfo.value = info
    permissions.value = info.permissions ?? []
    roles.value = info.roles ?? []
  }

  /** 初始化：有 token 则恢复用户信息，失败则清除 */
  async function init() {
    if (!token.value) return
    try {
      await fetchUserInfo()
    } catch {
      token.value = ''
      userInfo.value = null
      permissions.value = []
      roles.value = []
      removeToken()
    }
  }

  /** 更新个人信息 */
  async function updateProfile(data: Partial<UserInfo>) {
    await systemApi.updateProfile(data)
    if (userInfo.value) {
      Object.assign(userInfo.value, data)
    }
  }

  /** 登出 */
  async function logout() {
    try {
      await authApi.logout()
    } finally {
      token.value = ''
      userInfo.value = null
      permissions.value = []
      roles.value = []
      removeToken()
    }
  }

  return {
    token,
    userInfo,
    permissions,
    roles,
    isLoggedIn,
    username,
    avatar,
    displayName,
    hasPermission,
    login,
    fetchUserInfo,
    init,
    updateProfile,
    logout,
  }
}, {
  persist: {
    key: 'music-sys-user',
    pick: ['token'],
  },
})
