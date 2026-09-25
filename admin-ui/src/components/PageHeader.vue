<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const currentTitle = computed(() => (route.meta.title as string) || '首页仪表盘')
const displayName = computed(() => userStore.displayName || '管理员')

async function handleLogout() {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <header class="page-header">
    <div class="breadcrumb">
      <span>后台</span>
      <span class="sep">/</span>
      <span class="current">{{ currentTitle }}</span>
    </div>
    <div class="header-actions">
      <el-dropdown trigger="click" popper-class="user-dropdown">
        <div class="user-trigger">
          <el-avatar
            :size="34"
            :src="userStore.avatar"
            class="avatar"
          />
          <span class="user-name">{{ displayName }}</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/profile')">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  height: var(--header-height);
  background: #fff;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  padding: 0 28px;
  flex-shrink: 0;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--gray-500);
}

.breadcrumb .current {
  color: var(--gray-800);
  font-weight: 600;
}

.breadcrumb .sep {
  color: var(--gray-300);
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 用户下拉触发器 */
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: var(--gray-50);
}

.avatar {
  border: 2px solid var(--gray-200);
  transition: var(--transition);
  flex-shrink: 0;
}

.user-trigger:hover .avatar {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(88, 146, 134, 0.25);
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-700);
  white-space: nowrap;
}

.arrow-icon {
  font-size: 12px;
  color: var(--gray-400);
  transition: transform 0.2s;
}
</style>

<style>
/* 全局下拉面板样式（非 scoped） */
.user-dropdown {
  min-width: 150px !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid var(--gray-200) !important;
  padding: 4px 0 !important;
}

.user-dropdown .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-size: 13px;
}

.user-dropdown .el-dropdown-menu__item .el-icon {
  font-size: 16px;
}
</style>
