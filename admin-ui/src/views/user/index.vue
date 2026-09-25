<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Download } from '@element-plus/icons-vue'
import { userApi, type UserQuery } from '@/api/modules/user'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { usePermission } from '@/composables/usePermission'
import { useExport } from '@/composables/useExport'
import { formatDate } from '@/utils'
import { type AppUser } from '@/types'

const { isAdmin } = usePermission('*')

function guardDelete(action: () => void) {
  if (!isAdmin.value) {
    ElMessage.warning('当前角色没有删除权限，请联系超级管理员！')
    return
  }
  action()
}

function guardManage(action: () => void) {
  if (!isAdmin.value) {
    ElMessage.warning('当前角色没有管理用户权限，请联系超级管理员！')
    return
  }
  action()
}

const statusFilter = ref('')
const typeFilter = ref('')

const { data, total, loading, query, refresh, search } = useTable<AppUser>({
  fetchApi: (params) =>
    userApi.list({ ...params, status: statusFilter.value, userType: typeFilter.value } as UserQuery),
})

const modal = reactive(useModal<AppUser>())

const { exporting, doExport } = useExport(() => userApi.export())

// ============ 头像上传 ============
const avatarUploading = ref(false)
const avatarFileInput = ref<HTMLInputElement>()

async function handleAvatarUpload(file: File) {
  avatarUploading.value = true
  try {
    const result = await userApi.uploadAvatar(file)
    modal.formData!.avatar = result.url
    ElMessage.success('头像上传成功')
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '未知错误'
    ElMessage.error('头像上传失败：' + msg)
  } finally {
    avatarUploading.value = false
  }
}

function triggerAvatarInput() { avatarFileInput.value?.click() }

function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  handleAvatarUpload(file)
  input.value = ''
}

const userStats = reactive({ total: 0, vipCount: 0, newToday: 0, retention7d: 0 })
onMounted(async () => {
  try { Object.assign(userStats, await userApi.stats()) } catch { /* */ }
})

// ============ 批量管理 ============
const selectedUsers = ref<AppUser[]>([])

function handleSelectionChange(rows: AppUser[]) {
  selectedUsers.value = rows
}

const selectedCount = computed(() => selectedUsers.value.length)

async function batchToggleStatus(action: 'disable' | 'activate') {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先勾选需要操作的用户')
    return
  }
  const label = action === 'activate' ? '激活' : '禁用'
  try {
    await ElMessageBox.confirm(
      `确认${label}已选中的 ${selectedUsers.value.length} 个用户？`,
      `批量${label}确认`,
      { type: 'warning' }
    )
    const targetStatus = action === 'activate' ? 1 : 0
    for (const u of selectedUsers.value) {
      await userApi.updateStatus(u.id, targetStatus)
    }
    ElMessage.success(`已${label} ${selectedUsers.value.length} 个用户`)
    refresh()
  } catch { /* 取消 */ }
}

async function batchRemove() {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的用户')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除已选中的 ${selectedUsers.value.length} 个用户？此操作不可恢复！`,
      '批量删除确认',
      { type: 'warning', confirmButtonText: '确认删除' }
    )
    for (const u of selectedUsers.value) {
      await userApi.remove(u.id)
    }
    ElMessage.success(`已删除 ${selectedUsers.value.length} 个用户`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 单用户操作 ============
async function handleToggleStatus(row: AppUser) {
  const newStatus = row.status === 1 ? 0 : 1
  await userApi.updateStatus(row.id, newStatus)
  ElMessage.success(newStatus === 1 ? '用户已激活' : '用户已禁用')
  refresh()
}

async function handleDelete(row: AppUser) {
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.nickname}」？`, '删除确认', { type: 'warning' })
    await userApi.remove(row.id)
    ElMessage.success('用户已删除')
    refresh()
  } catch { /* 取消 */ }
}

async function handleSubmit(formData: AppUser) {
  if (modal.mode === 'create') {
    if (!formData.nickname?.trim()) { ElMessage.warning('请输入用户昵称'); return }
    if (!formData.phone?.trim()) { ElMessage.warning('请输入手机号'); return }
    if (!formData.avatar?.trim()) { ElMessage.warning('请上传用户头像'); return }
    if (formData.userType === undefined || formData.userType === null) { ElMessage.warning('请选择用户类型'); return }
    if (formData.status === undefined || formData.status === null) { ElMessage.warning('请选择用户状态'); return }
    if (!formData.password?.trim()) { ElMessage.warning('请设置初始密码'); return }
    await userApi.create(formData)
    ElMessage.success('用户添加成功')
  } else {
    await userApi.update(formData.id, formData)
    ElMessage.success('用户信息已更新')
  }
  modal.close()
  refresh()
}

// ============ 工具 ============
function userTypeLabel(type: number) {
  const map: Record<number, string> = { 0: '普通用户', 1: 'VIP会员', 2: '音乐人' }
  return map[type] ?? '未知'
}
function userTypeTagClass(type: number) {
  if (type === 1) return 'tag-purple'
  if (type === 2) return 'tag-orange'
  return 'tag-blue'
}

function userStatusTagType(status: number) {
  if (status === 1) return 'success'
  if (status === 2) return 'warning'
  return 'danger'
}
function userStatusLabel(status: number) {
  const map: Record<number, string> = { 1: '正常', 2: '待激活', 0: '已禁用' }
  return map[status] ?? '未知'
}
</script>

<template>
  <div class="user-page">
    <!-- 概览卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :lg="6">
        <StatCard label="注册用户" :value="userStats.total.toLocaleString()" sub="VIP会员" :trend="userStats.vipCount.toLocaleString() + '人'" color="users" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="VIP会员" :value="userStats.vipCount.toLocaleString()" sub="付费转化率" :trend="(userStats.vipCount / Math.max(userStats.total, 1) * 100).toFixed(1) + '%'" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="今日新增" :value="userStats.newToday.toLocaleString()" sub="注册用户" :trend="userStats.total.toLocaleString() + '人'" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="7日留存" value="62.8%" sub="较上周" trend="+1.5%" />
      </el-col>
    </el-row>

    <!-- 用户列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title"><el-icon><User /></el-icon> 用户列表</span>
          <el-button v-if="isAdmin" type="primary" size="small" @click="modal.openCreate()">
            <el-icon><Plus /></el-icon> 添加用户
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="搜索昵称/手机号..." :prefix-icon="Search" clearable class="search-inp" size="small" @input="search" />
        <el-select v-model="statusFilter" placeholder="全部状态" clearable size="small" style="width:110px" @change="refresh">
          <el-option label="正常" :value="1" />
          <el-option label="已禁用" :value="0" />
          <el-option label="待激活" :value="2" />
        </el-select>
        <el-select v-model="typeFilter" placeholder="全部类型" clearable size="small" style="width:110px" @change="refresh">
          <el-option label="普通用户" :value="0" />
          <el-option label="VIP会员" :value="1" />
          <el-option label="音乐人" :value="2" />
        </el-select>
        <div class="batch-actions" v-if="selectedCount > 0">
          <span class="selected-tip">已选 {{ selectedCount }} 人</span>
          <el-button size="small" type="success" @click="guardManage(() => batchToggleStatus('activate'))">批量激活</el-button>
          <el-button size="small" type="warning" @click="guardManage(() => batchToggleStatus('disable'))">批量禁用</el-button>
          <el-button size="small" type="danger" plain @click="guardDelete(batchRemove)">批量删除</el-button>
        </div>
        <el-button size="small" :loading="exporting" @click="doExport(undefined, '用户列表.csv')">
          <el-icon><Download /></el-icon> 导出
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table
        :data="data" v-loading="loading" stripe border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="42" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="38" :src="row.avatar" class="user-avatar">
                {{ row.nickname?.[0]?.toUpperCase() ?? 'U' }}
              </el-avatar>
              <div class="user-meta">
                <div class="user-name">{{ row.nickname }}</div>
                <div class="user-phone">{{ row.phone || '未填写' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <span class="tag" :class="userTypeTagClass(row.userType)">
              {{ userTypeLabel(row.userType) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="userStatusTagType(row.status)" size="small">
              {{ userStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="favoriteCount" label="收藏数" width="80" sortable />
        <el-table-column prop="playlistCount" label="歌单数" width="80" sortable />
        <el-table-column label="最后登录" width="160">
          <template #default="{ row }">{{ formatDate(row.lastLoginAt, 'YYYY-MM-DD HH:mm') }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="110">
          <template #default="{ row }">{{ formatDate(row.registeredAt, 'YYYY-MM-DD') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button v-if="isAdmin" text type="primary" size="small" @click="modal.openEdit(row)">编辑</el-button>
            <el-button v-if="isAdmin" text size="small" @click="guardManage(() => handleToggleStatus(row))">
              {{ row.status === 1 ? '禁用' : '激活' }}
            </el-button>
            <el-button v-if="isAdmin" text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <span class="page-info">共 {{ total }} 条记录</span>
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="prev, pager, next, sizes, jumper"
          @change="refresh"
        />
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="modal.visible"
      :title="modal.mode === 'create' ? '添加新用户' : `编辑用户 - ${modal.formData?.nickname}`"
      width="560px"
      @closed="modal.close()"
    >
      <el-form v-if="modal.formData" :model="modal.formData" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="昵称" required>
              <el-input v-model="modal.formData.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" required>
              <el-input v-model="modal.formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 头像上传 -->
        <el-form-item label="头像" required>
          <div class="upload-row">
            <input ref="avatarFileInput" type="file" style="display:none" @change="onAvatarFileChange" />
            <el-button :loading="avatarUploading" :icon="Upload" size="small" @click="triggerAvatarInput">
              {{ avatarUploading ? '上传中...' : '选择头像图片' }}
            </el-button>
            <span v-if="modal.formData.avatar" class="upload-done">已上传</span>
          </div>
          <div v-if="modal.formData.avatar" class="avatar-preview">
            <el-image :src="modal.formData.avatar" fit="cover" style="width:72px;height:72px;border-radius:50%">
              <template #error><div class="img-error">加载失败</div></template>
            </el-image>
          </div>
          <div v-else class="upload-hint">请上传用户头像（必填）</div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户类型" required>
              <el-select v-model="modal.formData.userType" style="width:100%" placeholder="请选择">
                <el-option label="普通用户" :value="0" />
                <el-option label="VIP会员" :value="1" />
                <el-option label="音乐人" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" required>
              <el-select v-model="modal.formData.status" style="width:100%" placeholder="请选择">
                <el-option label="正常" :value="1" />
                <el-option label="已禁用" :value="0" />
                <el-option label="待激活" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="modal.mode === 'create'" :gutter="16">
          <el-col :span="12">
            <el-form-item label="初始密码" required>
              <el-input v-model="modal.formData.password" type="password" placeholder="设置登录密码" show-password />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="modal.close()">取消</el-button>
        <el-button type="primary" @click="handleSubmit(modal.formData!)">
          {{ modal.mode === 'create' ? '确认添加' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.mb-4 { margin-bottom: 16px; }
.search-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.search-inp { width: 180px; }
.selected-tip { font-size: 12px; color: var(--primary); font-weight: 600; white-space: nowrap; }
.batch-actions { display: flex; align-items: center; gap: 6px; }

/* 用户信息 */
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar { flex-shrink: 0; background: linear-gradient(135deg, #589286, #7db8ac); color: #fff; font-weight: 600; font-size: 13px; }
.user-meta { min-width: 0; }
.user-name { font-weight: 600; color: var(--gray-800); }
.user-phone { font-size: 12px; color: var(--gray-400); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pagination-wrap { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; gap: 12px; flex-wrap: wrap; }
.page-info { font-size: 13px; color: var(--gray-500); }

/* 头像上传 */
.upload-row { display: flex; align-items: center; gap: 10px; }
.upload-done { font-size: 12px; color: #589286; font-weight: 500; }
.upload-hint { font-size: 12px; color: var(--gray-400); margin-top: 4px; }
.avatar-preview { margin-top: 8px; }
</style>
