<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import SidebarNav from './SidebarNav.vue'
import PageHeader from './PageHeader.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const sidebarWidth = computed(() =>
  appStore.sidebarCollapsed ? '64px' : '220px'
)

// 检查路由权限（用 watch 替代顶层副作用，避免竞态）
watch(
  () => route.path,
  (path) => {
    if (path === '/403') return
    const perm = route.meta.perm as string | undefined
    if (!permissionStore.canAccess(perm)) {
      router.replace('/403')
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside class="app-sidebar" :style="{ width: sidebarWidth }">
      <SidebarNav />
    </aside>

    <!-- 主区域 -->
    <div class="app-main">
      <PageHeader />
      <div class="app-content">
        <router-view v-slot="{ Component, route: viewRoute }">
          <transition name="page-fade">
            <component :is="Component" :key="viewRoute.fullPath" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-sidebar {
  flex-shrink: 0;
  transition: width 0.3s ease;
  z-index: 100;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--gray-50);
}

.app-content {
  flex: 1;
  padding: 20px 28px 28px 28px;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .app-content {
    padding: 16px;
  }
}
</style>
