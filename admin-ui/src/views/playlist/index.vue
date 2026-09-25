<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Headset, Remove, Download } from '@element-plus/icons-vue'
import { playlistApi, type PlaylistQuery } from '@/api/modules/playlist'
import { songApi } from '@/api/modules/song'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { usePermission } from '@/composables/usePermission'
import { useExport } from '@/composables/useExport'
import { formatDate } from '@/utils'
import { StyleOptions, type Playlist, type Song } from '@/types'

const { isAdmin, canEdit, canAudit, isAuditor } = usePermission('playlist')

function guardDelete(action: () => void) {
  if (!isAdmin.value) {
    ElMessage.warning('当前角色没有删除权限，请联系超级管理员！')
    return
  }
  action()
}

function guardAudit(action: () => void) {
  if (!canAudit.value) {
    ElMessage.warning('当前角色没有审核权限，请联系超级管理员！')
    return
  }
  action()
}

const categoryFilter = ref('')
const statusFilter = ref('')

const { data, total, loading, query, refresh, search } = useTable<Playlist>({
  fetchApi: (params) =>
    playlistApi.list({ ...params, category: categoryFilter.value, status: statusFilter.value } as PlaylistQuery),
})

// 审核员自动锁定只看待审核数据
watch(isAuditor, (val) => {
  if (val && statusFilter.value !== '0') {
    statusFilter.value = '0'
    refresh()
  }
}, { immediate: true })

const modal = reactive(useModal<Playlist>())
const readonlyMode = ref(false)

const plStats = reactive({ total: 0, userPlaylists: 0, totalFavorites: 0 })
onMounted(async () => {
  try { Object.assign(plStats, await playlistApi.stats()) } catch { /* */ }
})

const { exporting, doExport } = useExport(() => playlistApi.export())

// ============ 封面上传 ============
const coverUploading = ref(false)
const coverFileInput = ref<HTMLInputElement>()

async function handleCoverUpload(file: File) {
  coverUploading.value = true
  try {
    const result = await playlistApi.uploadCover(file)
    modal.formData!.coverUrl = result.url
    ElMessage.success('封面上传成功')
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '未知错误'
    ElMessage.error('封面上传失败：' + msg)
  } finally {
    coverUploading.value = false
  }
}

function triggerCoverInput() { coverFileInput.value?.click() }

function onCoverFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  handleCoverUpload(file)
  input.value = ''
}

// ============ 歌曲选择器 ============
const songPickerVisible = ref(false)
const songPickerLoading = ref(false)
const songPickerData = ref<Song[]>([])
const songPickerTotal = ref(0)
const songPickerKeyword = ref('')
const songPickerStyle = ref('')
const songPickerSelected = ref<Song[]>([])
const songPickerPage = reactive({ page: 1, pageSize: 20 })

// ============ 编辑模式下的歌单歌曲管理 ============
const playlistSongs = ref<Song[]>([])
const playlistSongsLoading = ref(false)
const removedSongIds = reactive<Set<number>>(new Set())
const addedSongs = ref<Song[]>([])

async function loadPlaylistSongs(playlistId: number) {
  playlistSongsLoading.value = true
  try {
    playlistSongs.value = await playlistApi.getSongs(playlistId)
    removedSongIds.clear()
    addedSongs.value = []
  } catch {
    playlistSongs.value = []
  } finally {
    playlistSongsLoading.value = false
  }
}

async function openEditWithSongs(row: Playlist) {
  readonlyMode.value = false
  modal.openEdit(row)
  await loadPlaylistSongs(row.id)
}

async function handleView(row: Playlist) {
  readonlyMode.value = true
  modal.openEdit(row)
  await loadPlaylistSongs(row.id)
}

function removeSongFromPlaylist(song: Song) {
  removedSongIds.add(song.id)
  playlistSongs.value = playlistSongs.value.filter(s => s.id !== song.id)
  addedSongs.value = addedSongs.value.filter(s => s.id !== song.id)
}

function removeSongFromPicker(song: Song) {
  songPickerSelected.value = songPickerSelected.value.filter(s => s.id !== song.id)
}

// 发布时间模式：立即 / 定时
const publishMode = ref<'now' | 'scheduled'>('now')
const scheduledTime = ref('')

// 编辑模式下歌单中已有歌曲的 ID 集合，用于选择器中过滤重复
const existingSongIds = computed(() => {
  if (modal.mode !== 'edit') return new Set<number>()
  return new Set(playlistSongs.value.map(s => s.id))
})

async function fetchSongsForPicker() {
  songPickerLoading.value = true
  try {
    const params: Record<string, unknown> = {
      page: songPickerPage.page,
      pageSize: songPickerPage.pageSize,
      keyword: songPickerKeyword.value || undefined,
      style: songPickerStyle.value || undefined,
    }
    const result = await songApi.list(params as any)
    songPickerData.value = result.records ?? []
    songPickerTotal.value = result.total ?? 0
  } catch {
    songPickerData.value = []
  } finally {
    songPickerLoading.value = false
  }
}

function openCreateDialog() {
  songPickerSelected.value = []
  publishMode.value = 'now'
  scheduledTime.value = ''
  modal.openCreate()
}

function openSongPicker() {
  songPickerKeyword.value = ''
  songPickerStyle.value = ''
  songPickerPage.page = 1
  songPickerVisible.value = true
  fetchSongsForPicker()
}

function onSongPickerSearch() {
  songPickerPage.page = 1
  fetchSongsForPicker()
}

function onSongPickerPageChange() {
  fetchSongsForPicker()
}

function handleSongPickerSelection(rows: Song[]) {
  songPickerSelected.value = rows
}

function confirmSongPicker() {
  if (modal.mode === 'edit') {
    // 编辑模式：过滤已在歌单中的歌曲，将新选歌曲加入歌单
    const existingIds = new Set(playlistSongs.value.map(s => s.id))
    const newSongs = songPickerSelected.value.filter(s => !existingIds.has(s.id))
    if (newSongs.length === 0) {
      ElMessage.warning('所选歌曲已在歌单中，无需重复添加')
      songPickerVisible.value = false
      return
    }
    playlistSongs.value = [...playlistSongs.value, ...newSongs]
    addedSongs.value = [...addedSongs.value, ...newSongs]
    songPickerVisible.value = false
    ElMessage.success(`已添加 ${newSongs.length} 首歌曲到歌单`)
    return
  }
  // 创建模式：暂存选中歌曲，等歌单创建后再关联
  if (songPickerSelected.value.length === 0) {
    ElMessage.warning('请至少选择一首歌曲')
    return
  }
  songPickerVisible.value = false
  ElMessage.success(`已选择 ${songPickerSelected.value.length} 首歌曲`)
}
function fmtWan(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return n.toLocaleString()
}

// ============ 批量管理 ============
const selectedItems = ref<Playlist[]>([])

function handleSelectionChange(rows: Playlist[]) {
  selectedItems.value = rows
}

const selectedCount = computed(() => selectedItems.value.length)

const selectedStatuses = computed(() =>
  [...new Set(selectedItems.value.map(s => s.status))]
)

const allSameStatus = computed(() => selectedStatuses.value.length === 1)

const canBatchAudit = computed(() =>
  allSameStatus.value && selectedStatuses.value[0] === 0
)
const canBatchPublish = computed(() =>
  allSameStatus.value && (selectedStatuses.value[0] === 1 || selectedStatuses.value[0] === 4)
)
const canBatchUnpublish = computed(() =>
  allSameStatus.value && selectedStatuses.value[0] === 2
)
const canBatchDelete = computed(() =>
  allSameStatus.value && (selectedStatuses.value[0] === 3 || selectedStatuses.value[0] === 4)
)

// ============ 批量审核 ============
async function batchAudit(action: 'pass' | 'reject') {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先勾选需要操作的歌单')
    return
  }
  const label = action === 'pass' ? '批量通过' : '批量驳回'
  let remark = ''
  if (action === 'reject') {
    try {
      const { value } = await ElMessageBox.prompt('请输入驳回原因', `批量驳回 — ${selectedItems.value.length} 个歌单`, {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        inputPlaceholder: '请填写驳回原因...',
        inputValidator: (val) => val?.trim() ? true : '驳回原因不能为空',
        type: 'warning',
      })
      remark = value || ''
    } catch { return }
  }
  try {
    await ElMessageBox.confirm(
      `确认${label}已选中的 ${selectedItems.value.length} 个歌单？${remark ? `\n驳回原因：${remark}` : ''}`,
      `${label}确认`,
      { type: 'warning' }
    )
    await playlistApi.batchAudit(selectedItems.value.map(s => s.id), action, remark)
    ElMessage.success(`${label}成功`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 批量上架 ============
async function batchPublish() {
  try {
    await ElMessageBox.confirm(
      `确认上架已选中的 ${selectedItems.value.length} 个歌单？上架后将对所有用户可见。`,
      '批量上架确认',
      { type: 'warning', confirmButtonText: '确认上架' }
    )
    await playlistApi.batchPublish(selectedItems.value.map(s => s.id))
    ElMessage.success(`已上架 ${selectedItems.value.length} 个歌单`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 批量下架 ============
async function batchUnpublish() {
  try {
    await ElMessageBox.confirm(
      `确认下架已选中的 ${selectedItems.value.length} 个歌单？下架后将从平台隐藏。`,
      '批量下架确认',
      { type: 'warning', confirmButtonText: '确认下架' }
    )
    await playlistApi.batchUnpublish(selectedItems.value.map(s => s.id))
    ElMessage.success(`已下架 ${selectedItems.value.length} 个歌单`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 批量删除 ============
async function batchRemove() {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的歌单')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认永久删除已选中的 ${selectedItems.value.length} 个歌单？\n此操作不可恢复！`,
      '批量删除确认',
      { type: 'error', confirmButtonText: '确认删除' }
    )
    for (const item of selectedItems.value) {
      await playlistApi.remove(item.id)
    }
    ElMessage.success(`已删除 ${selectedItems.value.length} 个歌单`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 单曲操作 ============
async function handleAuditPass(row: Playlist) {
  try {
    await ElMessageBox.confirm(`确认审核通过歌单「${row.name}」？通过后将自动发布。`, '审核通过确认', { type: 'warning' })
    await playlistApi.audit(row.id, 'pass')
    await playlistApi.publish(row.id)
    ElMessage.success('审核通过，歌单已自动发布')
    refresh()
  } catch { /* 取消 */ }
}

async function handleAuditReject(row: Playlist) {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', `驳回歌单 — ${row.name}`, {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputPlaceholder: '请填写驳回原因…',
      inputValidator: (val) => val?.trim() ? true : '驳回原因不能为空',
      type: 'warning',
    })
    await playlistApi.audit(row.id, 'reject', value)
    ElMessage.success('歌单已驳回')
    refresh()
  } catch { /* 取消 */ }
}

async function handleUnpublish(row: Playlist) {
  try {
    await ElMessageBox.confirm(
      `确认下架歌单「${row.name}」？下架后将从平台隐藏。`,
      '下架确认',
      { type: 'warning', confirmButtonText: '确认下架' }
    )
    await playlistApi.unpublish(row.id)
    ElMessage.success(`歌单「${row.name}」已下架`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleRepublish(row: Playlist) {
  try {
    await ElMessageBox.confirm(
      `确认重新上架歌单「${row.name}」？上架后将对所有用户可见。`,
      '重新上架确认',
      { type: 'warning', confirmButtonText: '确认上架' }
    )
    await playlistApi.publish(row.id)
    ElMessage.success(`歌单「${row.name}」已重新上架`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleResubmit(row: Playlist) {
  try {
    await ElMessageBox.confirm(
      `确认将歌单「${row.name}」重新提交审核？`,
      '重新提交确认',
      { type: 'warning', confirmButtonText: '确认提交' }
    )
    await playlistApi.resubmit(row.id)
    ElMessage.success(`歌单「${row.name}」已重新提交审核`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleDelete(row: Playlist) {
  try {
    await ElMessageBox.confirm(`确认永久删除歌单「${row.name}」？`, '删除确认', { type: 'error', confirmButtonText: '确认删除' })
    await playlistApi.remove(row.id)
    ElMessage.success(`歌单「${row.name}」已删除`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleTogglePin(row: Playlist) {
  await playlistApi.togglePin(row.id)
  ElMessage.success(row.isPinned ? '已取消置顶' : '已置顶')
  refresh()
}

async function handleSubmit(formData: Playlist) {
  if (readonlyMode.value) { ElMessage.warning('当前为查看模式，无法编辑'); return }
  if (modal.mode === 'create') {
    if (!formData.name?.trim()) { ElMessage.warning('请输入歌单名称'); return }
    if (!formData.category?.trim()) { ElMessage.warning('请选择歌单分类'); return }
    if (!formData.coverUrl?.trim()) { ElMessage.warning('请上传歌单封面'); return }
    if (!formData.description?.trim()) { ElMessage.warning('请输入歌单描述'); return }
    if (publishMode.value === 'scheduled' && !scheduledTime.value) { ElMessage.warning('请选择定时发布时间'); return }
    // 设置发布时间
    formData.publishTime = publishMode.value === 'now' ? null : scheduledTime.value
    const created = await playlistApi.create(formData)
    // 关联歌曲（保留排序）
    if (songPickerSelected.value.length > 0) {
      await playlistApi.addSongs(created.id, songPickerSelected.value.map(s => s.id))
    }
    ElMessage.success(songPickerSelected.value.length > 0
      ? `歌单创建成功，已关联 ${songPickerSelected.value.length} 首歌曲，等待审核`
      : '歌单创建成功，等待审核')
    songPickerSelected.value = []
    publishMode.value = 'now'
    scheduledTime.value = ''
  } else {
    if (!formData.name?.trim()) { ElMessage.warning('请输入歌单名称'); return }
    if (!formData.coverUrl?.trim()) { ElMessage.warning('请上传歌单封面'); return }
    if (!formData.description?.trim()) { ElMessage.warning('请输入歌单描述'); return }
    await playlistApi.update(formData.id, formData)
    // 同步歌曲变更：添加新歌曲
    if (addedSongs.value.length > 0) {
      await playlistApi.addSongs(formData.id, addedSongs.value.map(s => s.id))
    }
    // 同步歌曲变更：移除被删除的歌曲
    for (const songId of removedSongIds) {
      await playlistApi.removeSong(formData.id, songId)
    }
    const changes: string[] = []
    if (addedSongs.value.length > 0) changes.push(`新增 ${addedSongs.value.length} 首`)
    if (removedSongIds.size > 0) changes.push(`移除 ${removedSongIds.size} 首`)
    ElMessage.success(changes.length > 0 ? `歌单已更新，${changes.join('，')}` : '歌单已更新')
    playlistSongs.value = []
    addedSongs.value = []
    removedSongIds.clear()
  }
  modal.close()
  refresh()
}

// ============ 工具 ============
function statusTagType(status: number) {
  const map: Record<number, string> = { 0: 'warning', 1: '', 2: 'success', 3: 'danger', 4: 'info' }
  return map[status] ?? 'info'
}
function statusLabel(status: number) {
  const map: Record<number, string> = { 0: '待审核', 1: '审核通过', 2: '已发布', 3: '已驳回', 4: '已下架' }
  return map[status] ?? '未知'
}

function playlistStatusLabel(status: number) {
  if (status === 1) return '审核通过'
  return statusLabel(status)
}

function fmtCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return String(n)
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function styleTagColor(style: string): string {
  const m: Record<string, string> = {
    '流行': 'tag-blue', '摇滚': 'tag-orange', '电子': 'tag-purple',
    '民谣': 'tag-green', '嘻哈': 'tag-green', '古典': 'tag-gray',
  }
  return m[style] ?? 'tag-gray'
}
</script>

<template>
  <div class="playlist-page">
    <!-- 概览卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :lg="6">
        <StatCard label="歌单总量" :value="plStats.total.toLocaleString()" sub="官方精选" :trend="(plStats.total - plStats.userPlaylists).toLocaleString() + '个'" color="playlists" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="用户歌单" :value="plStats.userPlaylists.toLocaleString()" sub="总收藏数" :trend="fmtWan(plStats.totalFavorites)" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="总收藏数" :value="fmtWan(plStats.totalFavorites)" sub="歌单总量" :trend="plStats.total.toLocaleString() + '个'" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="人均歌单" :value="(plStats.userPlaylists / Math.max((plStats.total - plStats.userPlaylists), 1)).toFixed(1)" sub="用户创建活跃度" :trend="plStats.userPlaylists.toLocaleString() + '个'" />
      </el-col>
    </el-row>

    <!-- 歌单列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title"><el-icon><Collection /></el-icon> 歌单列表</span>
          <el-button v-if="canEdit" type="primary" size="small" @click="openCreateDialog()">
            <el-icon><Plus /></el-icon> 创建歌单
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="搜索歌单名称..." :prefix-icon="Search" clearable class="search-inp" size="small" @input="search" />
        <el-select v-model="categoryFilter" placeholder="全部分类" clearable size="small" style="width:120px" @change="refresh">
          <el-option label="排行榜" value="排行榜" />
          <el-option label="每日推荐" value="每日推荐" />
          <el-option label="场景歌单" value="场景歌单" />
          <el-option label="风格歌单" value="风格歌单" />
          <el-option label="主题歌单" value="主题歌单" />
          <el-option label="编辑精选" value="编辑精选" />
        </el-select>
        <el-select v-if="!isAuditor" v-model="statusFilter" placeholder="全部状态" clearable size="small" style="width:110px" @change="refresh">
          <el-option label="待审核" :value="0" />
          <el-option label="审核通过" :value="1" />
          <el-option label="已发布" :value="2" />
          <el-option label="已驳回" :value="3" />
          <el-option label="已下架" :value="4" />
        </el-select>

        <!-- 批量操作 -->
        <template v-if="selectedCount > 0">
          <span class="selected-tip">已选 {{ selectedCount }} 个</span>
          <template v-if="canBatchAudit">
            <el-button size="small" type="success" @click="guardAudit(() => batchAudit('pass'))">批量通过</el-button>
            <el-button size="small" type="warning" @click="guardAudit(() => batchAudit('reject'))">批量驳回</el-button>
          </template>
          <template v-if="canBatchPublish && !isAuditor">
            <el-button size="small" type="success" @click="batchPublish">批量上架</el-button>
          </template>
          <template v-if="canBatchUnpublish && !isAuditor">
            <el-button size="small" type="warning" @click="batchUnpublish">批量下架</el-button>
          </template>
          <template v-if="canBatchDelete && !isAuditor">
            <el-button size="small" type="danger" plain @click="guardDelete(batchRemove)">批量删除</el-button>
          </template>
          <span v-if="!allSameStatus" class="mixed-tip">（不同状态，无法批量操作）</span>
        </template>
        <el-button size="small" :loading="exporting" @click="doExport(undefined, '歌单列表.csv')">
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
        <el-table-column label="歌单信息" min-width="180">
          <template #default="{ row }">
            <div class="pl-cell">
              <el-avatar :size="40" :src="row.coverUrl" shape="square" class="pl-cover">
                <el-icon :size="16"><Collection /></el-icon>
              </el-avatar>
              <div class="pl-meta">
                <div class="pl-name">{{ row.name }}</div>
                <div class="pl-desc">{{ row.description?.slice(0, 18) }}{{ (row.description?.length ?? 0) > 18 ? '…' : '' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建者" width="100" />
        <el-table-column prop="songCount" label="歌曲数" width="80" sortable />
        <el-table-column label="分类" width="90">
          <template #default="{ row }">
            <span class="tag" :class="row.category ? 'tag-teal' : 'tag-gray'">{{ row.category || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="plain">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="播放量" width="100" sortable prop="playCount">
          <template #default="{ row }">{{ fmtCount(row.playCount) }}</template>
        </el-table-column>
        <el-table-column label="收藏数" width="80" sortable prop="favoriteCount">
          <template #default="{ row }">{{ fmtCount(row.favoriteCount) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="110">
          <template #default="{ row }">{{ formatDate(row.createdAt, 'YYYY-MM-DD') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <!-- 待审核(0)：通过 / 驳回 / 查看（审核员）/ 编辑 / 删除 -->
            <template v-if="row.status === 0">
              <el-button text type="success" size="small" @click="guardAudit(() => handleAuditPass(row))">通过</el-button>
              <el-button text type="warning" size="small" @click="guardAudit(() => handleAuditReject(row))">驳回</el-button>
              <el-button v-if="isAuditor" text type="info" size="small" @click="handleView(row)">查看</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEditWithSongs(row)">编辑</el-button>
              <el-button v-if="!isAuditor" text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 审核通过(1)：发布 / 编辑 / 置顶 / 删除（审核员不可见） -->
            <template v-else-if="row.status === 1 && !isAuditor">
              <el-button text type="success" size="small" @click="handleRepublish(row)">发布</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEditWithSongs(row)">编辑</el-button>
              <el-button text size="small" @click="handleTogglePin(row)">
                {{ row.isPinned ? '取消置顶' : '置顶' }}
              </el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 已发布(2)：下架 / 编辑 / 取消置顶 / 删除（审核员不可见） -->
            <template v-else-if="row.status === 2 && !isAuditor">
              <el-button text type="warning" size="small" @click="handleUnpublish(row)">下架</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEditWithSongs(row)">编辑</el-button>
              <el-button text size="small" @click="handleTogglePin(row)">
                {{ row.isPinned ? '取消置顶' : '置顶' }}
              </el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 已驳回(3)：重新提交 / 编辑 / 删除（审核员不可见） -->
            <template v-else-if="row.status === 3 && !isAuditor">
              <el-button text type="warning" size="small" @click="handleResubmit(row)">重新提交</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEditWithSongs(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 已下架(4)：重新上架 / 编辑 / 删除（审核员不可见） -->
            <template v-else-if="row.status === 4 && !isAuditor">
              <el-button text type="success" size="small" @click="handleRepublish(row)">重新上架</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEditWithSongs(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 兜底：编辑 / 删除（审核员不可见） -->
            <template v-else-if="!isAuditor">
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEditWithSongs(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
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
      :title="readonlyMode ? `查看歌单 - ${modal.formData?.name}` : (modal.mode === 'create' ? '创建新歌单' : `编辑歌单 - ${modal.formData?.name}`)"
      width="780px"
      @closed="modal.close()"
    >
      <el-form v-if="modal.formData" :model="modal.formData" label-width="90px" :disabled="readonlyMode">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="歌单名称" required>
              <el-input v-model="modal.formData.name" placeholder="请输入歌单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="分类" required>
              <el-select v-model="modal.formData.category" style="width:100%" placeholder="请选择分类">
                <el-option label="排行榜" value="排行榜" />
                <el-option label="每日推荐" value="每日推荐" />
                <el-option label="场景歌单" value="场景歌单" />
                <el-option label="风格歌单" value="风格歌单" />
                <el-option label="主题歌单" value="主题歌单" />
                <el-option label="编辑精选" value="编辑精选" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 封面上传 -->
        <el-form-item label="封面" required>
          <div class="upload-row">
            <input ref="coverFileInput" type="file" style="display:none" @change="onCoverFileChange" />
            <el-button :loading="coverUploading" :icon="Upload" size="small" @click="triggerCoverInput">
              {{ coverUploading ? '上传中...' : '选择封面图片' }}
            </el-button>
            <span v-if="modal.formData.coverUrl" class="upload-done">已上传</span>
          </div>
          <div v-if="modal.formData.coverUrl" class="cover-preview">
            <el-image :src="modal.formData.coverUrl" fit="cover" style="width:120px;height:80px;border-radius:6px">
              <template #error><div class="img-error">加载失败</div></template>
            </el-image>
          </div>
          <div v-else class="upload-hint">请上传歌单封面图片（必填）</div>
        </el-form-item>

        <!-- 创建者：自动设为当前管理员，不可编辑 -->
        <el-form-item v-if="modal.mode === 'create'" label="创建者">
          <el-input model-value="当前管理员（自动）" disabled style="width:220px" />
        </el-form-item>
        <el-form-item v-else label="创建者">
          <el-input v-model="modal.formData.creatorName" disabled style="width:220px" />
        </el-form-item>

        <el-form-item label="描述" required>
          <el-input v-model="modal.formData.description" type="textarea" :rows="3" placeholder="请输入歌单描述（必填）" />
        </el-form-item>

        <!-- 发布时间 -->
        <el-form-item v-if="modal.mode === 'create'" label="发布时间" required>
          <el-radio-group v-model="publishMode" style="margin-right:12px">
            <el-radio value="now">立即发布（审核通过后自动上架）</el-radio>
            <el-radio value="scheduled">定时发布</el-radio>
          </el-radio-group>
          <el-date-picker
            v-if="publishMode === 'scheduled'"
            v-model="scheduledTime"
            type="datetime"
            placeholder="选择发布时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width:220px;margin-top:8px"
          />
        </el-form-item>

      </el-form>

      <!-- 歌曲管理区域（创建/编辑均显示） -->
      <div class="pl-songs-section">
        <div class="pl-songs-header">
          <span class="pl-songs-title">
            <el-icon><Headset /></el-icon>
            {{ modal.mode === 'create' ? '已选歌曲' : '歌单歌曲' }}
            ({{ modal.mode === 'create' ? songPickerSelected.length : playlistSongs.length }} 首)
          </span>
          <el-button type="success" size="small" @click="openSongPicker">
            <el-icon><Plus /></el-icon> 从曲库添加
          </el-button>
        </div>
        <el-table
          :data="modal.mode === 'create' ? songPickerSelected : playlistSongs"
          v-loading="playlistSongsLoading"
          stripe border max-height="280"
          empty-text="暂未添加歌曲，请点击「从曲库添加」"
          row-key="id"
        >
          <el-table-column type="index" label="排序" width="56" />
          <el-table-column label="歌曲名称" prop="title" min-width="160" show-overflow-tooltip />
          <el-table-column label="歌手" prop="singerName" width="100" show-overflow-tooltip />
          <el-table-column label="风格" width="68">
            <template #default="{ row }">
              <span class="tag" :class="styleTagColor(row.style)">{{ row.style }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时长" width="62">
            <template #default="{ row }">{{ fmtDuration(row.duration) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="56" fixed="right">
            <template #default="{ row }">
              <el-button text type="danger" size="small"
                @click="modal.mode === 'create' ? removeSongFromPicker(row) : removeSongFromPlaylist(row)">
                <el-icon><Remove /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="modal.mode === 'edit' && (addedSongs.length > 0 || removedSongIds.size > 0)" class="pl-songs-pending">
          <template v-if="addedSongs.length > 0">
            <span class="pending-add">+{{ addedSongs.length }} 首待添加</span>
          </template>
          <template v-if="removedSongIds.size > 0">
            <span class="pending-remove">-{{ removedSongIds.size }} 首待移除</span>
          </template>
          <span class="pending-hint">（点击"保存修改"后生效）</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="modal.close()">{{ readonlyMode ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!readonlyMode" type="primary" @click="handleSubmit(modal.formData!)">
          {{ modal.mode === 'create' ? '确认创建' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 歌曲选择器弹窗 -->
    <el-dialog
      v-model="songPickerVisible"
      title="从曲库选择歌曲"
      width="700px"
      @closed="songPickerSelected = (modal.mode === 'edit' ? [] : songPickerSelected)"
    >
      <div class="song-picker-search">
        <el-input v-model="songPickerKeyword" placeholder="搜索歌曲名称..." :prefix-icon="Search" clearable class="picker-search-inp" size="small" @input="onSongPickerSearch" />
        <el-select v-model="songPickerStyle" placeholder="全部风格" clearable size="small" style="width:110px" @change="onSongPickerSearch">
          <el-option v-for="s in StyleOptions" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
      <el-table
        :data="songPickerData" v-loading="songPickerLoading" stripe border
        @selection-change="handleSongPickerSelection"
        row-key="id"
        max-height="360"
      >
        <el-table-column type="selection" width="42" reserve-selection :selectable="(row: Song) => !existingSongIds.has(row.id)" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="歌曲名称" prop="title" min-width="160" show-overflow-tooltip />
        <el-table-column label="风格" width="80">
          <template #default="{ row }">
            <span class="tag" :class="styleTagColor(row.style)">{{ row.style }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时长" width="70">
          <template #default="{ row }">{{ fmtDuration(row.duration) }}</template>
        </el-table-column>
      </el-table>
      <div class="picker-pagination">
        <span class="page-info">共 {{ songPickerTotal }} 首</span>
        <el-pagination
          v-model:current-page="songPickerPage.page"
          v-model:page-size="songPickerPage.pageSize"
          :total="songPickerTotal"
          :page-sizes="[20, 50]"
          layout="prev, pager, next, sizes"
          small
          @change="onSongPickerPageChange"
        />
      </div>
      <template #footer>
        <el-button @click="songPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSongPicker">
          确认选择 ({{ songPickerSelected.length }})
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
.mixed-tip { font-size: 12px; color: var(--gray-400); white-space: nowrap; }

/* 歌单信息 */
.pl-cell { display: flex; align-items: center; gap: 10px; }
.pl-cover { flex-shrink: 0; background: linear-gradient(135deg, #EC4899, #589286); color: #fff; }
.pl-meta { min-width: 0; }
.pl-name { font-weight: 600; color: var(--gray-800); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-desc { font-size: 12px; color: var(--gray-400); margin-top: 2px; }

.pagination-wrap { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; gap: 12px; flex-wrap: wrap; }
.page-info { font-size: 13px; color: var(--gray-500); }

/* 封面上传 */
.upload-row { display: flex; align-items: center; gap: 10px; }
.upload-done { font-size: 12px; color: #589286; font-weight: 500; }
.upload-hint { font-size: 12px; color: var(--gray-400); margin-top: 4px; }
.cover-preview { margin-top: 8px; }

/* 歌曲选择提示 */
.song-count-tip { font-size: 12px; color: #589286; font-weight: 600; margin-left: 8px; }

/* 歌曲选择器 */
.song-picker-search { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.picker-search-inp { width: 200px; }
.picker-pagination { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; gap: 8px; flex-wrap: wrap; }

/* 编辑模式歌单歌曲管理 */
.pl-songs-section {
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--border, #ebeef5);
}
.pl-songs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.pl-songs-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800, #303133);
  display: flex;
  align-items: center;
  gap: 6px;
}
.pl-songs-pending {
  margin-top: 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pending-add {
  color: #589286;
  font-weight: 600;
}
.pending-remove {
  color: #e6492d;
  font-weight: 600;
}
.pending-hint {
  color: var(--gray-400, #909399);
}
</style>
