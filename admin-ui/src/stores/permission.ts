import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'

export const usePermissionStore = defineStore('permission', () => {
  const userStore = useUserStore()

  /** 检查路由权限 */
  function canAccess(perm?: string): boolean {
    if (!perm) return true
    return userStore.hasPermission(perm)
  }

  /** 生成侧边栏可见菜单 */
  function visibleRoutes(menuItems: MenuItem[]): MenuItem[] {
    return menuItems.filter(item => {
      if (item.children) {
        item.children = visibleRoutes(item.children)
      }
      return !item.meta?.perm || userStore.hasPermission(item.meta.perm as string)
    })
  }

  return { canAccess, visibleRoutes }
})

export interface MenuItem {
  path: string
  name: string
  meta?: {
    title: string
    icon: string
    perm?: string
  }
  children?: MenuItem[]
}
