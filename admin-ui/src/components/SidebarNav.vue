<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { pageTitles } from '@/router'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

interface NavItem {
  path: string
  title: string
  icon: string
  perm?: string
  badge?: string | number
}

const navSections = computed(() => {
  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: '导航菜单',
      items: [
        { path: '/dashboard', title: pageTitles.dashboard, icon: 'DataBoard' },
        { path: '/singers', title: pageTitles.singers, icon: 'Mic', perm: 'singer:list' },
        { path: '/songs', title: pageTitles.songs, icon: 'Headset', perm: 'song:list' },
        { path: '/playlists', title: pageTitles.playlists, icon: 'Collection', perm: 'playlist:list' },
        { path: '/users', title: pageTitles.users, icon: 'User', perm: 'user:list' },
      ],
    },
    {
      title: '智能分析',
      items: [
        { path: '/data', title: pageTitles.data, icon: 'DataLine', perm: 'data:view' },
      ],
    },
    {
      title: '系统管理',
      items: [
        { path: '/logs', title: pageTitles.logs, icon: 'Document', perm: 'log:list' },
        { path: '/profile', title: pageTitles.profile, icon: 'User' },
      ],
    },
  ]

  // 按权限过滤
  return sections.map(section => ({
    ...section,
    items: section.items.filter(item => permissionStore.canAccess(item.perm)),
  }))
})

function navigate(path: string) {
  if (route.path === path) return
  router.push(path)
}

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <div class="sidebar-container">
    <!-- Logo 区域 -->
    <div class="sidebar-brand">
      <div class="logo-icon">
        <img src="/logo.png" alt="logo" class="logo-img" />
      </div>
      <span v-show="!appStore.sidebarCollapsed" class="logo-text">
        曲不离库<span class="logo-accent"> · 后台管理</span>
      </span>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <template v-for="section in navSections" :key="section.title">
        <div
          v-show="!appStore.sidebarCollapsed && section.items.length > 0"
          class="nav-section-title"
        >
          {{ section.title }}
        </div>
        <div
          v-for="item in section.items"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="navigate(item.path)"
        >
          <el-icon :size="19"><component :is="item.icon" /></el-icon>
          <span v-show="!appStore.sidebarCollapsed">{{ item.title }}</span>
        </div>
      </template>
    </nav>

    <!-- 底部折叠按钮 -->
    <div class="sidebar-footer" @click="appStore.toggleSidebar()">
      <el-icon :size="18">
        <DArrowLeft v-if="!appStore.sidebarCollapsed" />
        <DArrowRight v-else />
      </el-icon>
    </div>
  </div>
</template>

<style scoped>
.sidebar-container {
  height: 100%;
  background: var(--sidebar-bg);
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.sidebar-brand {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.logo-text {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.logo-accent {
  color: #589286;
}

.sidebar-nav {
  flex: 1;
  padding: 14px 10px;
  overflow-y: auto;
}

.nav-section-title {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: rgba(255, 255, 255, 0.22);
  padding: 16px 13px 6px 13px;
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 13px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.68);
  transition: var(--transition);
  font-weight: 500;
  font-size: 13.5px;
  margin-bottom: 2px;
  user-select: none;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--sidebar-hover);
  color: #fff;
}

.nav-item.active {
  background: var(--sidebar-active);
  color: #fff;
  box-shadow: 0 4px 14px rgba(88, 146, 134, 0.4);
}

.sidebar-footer {
  padding: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: var(--transition);
}

.sidebar-footer:hover {
  color: rgba(255, 255, 255, 0.8);
}
</style>
