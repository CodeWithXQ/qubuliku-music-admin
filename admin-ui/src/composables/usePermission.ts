import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 三层权限模型 composable
 *
 * 核心规则：
 *   admin    → 全部权限（canEdit + canAudit + canDelete）
 *   editor   → 可编辑不可审核不可删除（canEdit）
 *   auditor  → 可审核不可编辑不可删除（canAudit, isAuditor）
 *
 * 每个页面只需传入自己的 module 名（如 'song'/'playlist'/'singer'），
 * 或用 '*' 表示不需要模块级权限的页面（如 dashboard/profile）。
 */
export function usePermission(module: string) {
  const userStore = useUserStore()

  /** 是否超级管理员 */
  const isAdmin = computed(() => userStore.roles.includes('admin'))

  /** 可编辑（admin 或 editor） */
  const canEdit = module === '*'
    ? computed(() => userStore.roles.includes('admin'))
    : computed(() => isAdmin.value || userStore.hasPermission(`${module}:edit`))

  /** 可审核（admin 或 auditor） */
  const canAudit = module === '*'
    ? computed(() => false)
    : computed(() => isAdmin.value || userStore.hasPermission(`${module}:audit`))

  /** 纯审核员（有审核权限但无编辑权限，用于隐藏非审核相关UI） */
  const isAuditor = computed(() => canAudit.value && !canEdit.value)

  return { isAdmin, canEdit, canAudit, isAuditor }
}
