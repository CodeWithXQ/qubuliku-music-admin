import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SidebarCollapseMode = 'full' | 'collapsed'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const breadcrumbTitle = ref('首页仪表盘')
  const loading = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setBreadcrumb(title: string) {
    breadcrumbTitle.value = title
  }

  function setLoading(val: boolean) {
    loading.value = val
  }

  return {
    sidebarCollapsed,
    breadcrumbTitle,
    loading,
    toggleSidebar,
    setBreadcrumb,
    setLoading,
  }
}, {
  persist: {
    key: 'music-sys-app',
    pick: ['sidebarCollapsed'],
  },
})
