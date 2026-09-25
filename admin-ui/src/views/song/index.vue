<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, VideoPlay, WarningFilled, ArrowRight, Refresh } from '@element-plus/icons-vue'
import { songApi, type SongQuery } from '@/api/modules/song'
import { singerApi } from '@/api/modules/singer'
import { copyrightApi } from '@/api/modules/copyright'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { useExport } from '@/composables/useExport'
import { usePermission } from '@/composables/usePermission'
import { formatDate } from '@/utils'
import { StyleOptions, type Singer, type Song, type SongCopyright } from '@/types'

const { isAdmin, canEdit, canAudit, isAuditor } = usePermission('song')

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

const styleFilter = ref('')
const auditFilter = ref('')

const { data, total, loading, query, refresh, search } = useTable<Song>({
  fetchApi: (params) =>
    songApi.list({ ...params, style: styleFilter.value, auditStatus: auditFilter.value } as SongQuery),
})

// 审核员自动锁定只看待审核数据
watch(isAuditor, (val) => {
  if (val && auditFilter.value !== '0') {
    auditFilter.value = '0'
    refresh()
  }
}, { immediate: true })

const modal = reactive(useModal<Song>())
const readonlyMode = ref(false)

// ============ 版权到期提醒 ============
const copyrightAlerts = ref<SongCopyright[]>([])
const copyrightDialogVisible = ref(false)
const expiredCount = computed(() => copyrightAlerts.value.filter(c => c.status === 3).length)
const expiringCount = computed(() => copyrightAlerts.value.filter(c => c.status === 2).length)

async function fetchCopyrightAlerts() {
  try { copyrightAlerts.value = await copyrightApi.alerts() } catch { copyrightAlerts.value = [] }
}

function showCopyrightDialog() {
  copyrightDialogVisible.value = true
}

const copyrightStatusLabel: Record<number, string> = { 0: '待录入', 1: '已授权', 2: '即将到期', 3: '已过期' }
const copyrightStatusType: Record<number, string> = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }

onMounted(() => { fetchCopyrightAlerts() })

async function refreshCopyrightAlerts() {
  try {
    const result = await copyrightApi.refresh()
    ElMessage.success(result.msg || '版权状态已刷新')
    await fetchCopyrightAlerts()
  } catch { ElMessage.error('刷新失败') }
}

async function handleCopyrightSong(songId: number) {
  try {
    const song = await songApi.detail(songId)
    openEdit(song)
  } catch { ElMessage.warning('歌曲不存在或已被删除') }
}

async function handleUnpublishFromCopyright(songId: number) {
  try {
    await ElMessageBox.confirm(
      '确认下架该歌曲？版权已到期，下架后将从平台隐藏。',
      '版权到期下架确认',
      { type: 'warning', confirmButtonText: '确认下架' }
    )
    await songApi.unpublish(songId)
    ElMessage.success('歌曲已下架')
    await fetchCopyrightAlerts()
    refresh()
  } catch { /* 取消 */ }
}

function openEdit(row: Song) {
  readonlyMode.value = false
  modal.openEdit(row)
}

function handleView(row: Song) {
  readonlyMode.value = true
  modal.openEdit(row)
}

// ============ 文件上传 ============
const coverUploading = ref(false)
const audioUploading = ref(false)
const coverFileInput = ref<HTMLInputElement>()
const audioFileInput = ref<HTMLInputElement>()

// 歌手列表（供下拉选择）
const singerList = ref<Singer[]>([])
async function fetchSingers() {
  try {
    const result = await singerApi.list({ page: 1, pageSize: 200 })
    singerList.value = result.records ?? []
  } catch { /* 静默失败 */ }
}

async function handleCoverUpload(file: File) {
  coverUploading.value = true
  try {
    const result = await songApi.uploadCover(file)
    modal.formData!.coverUrl = result.url
    ElMessage.success('封面上传成功')
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '未知错误'
    ElMessage.error('封面上传失败：' + msg)
  } finally {
    coverUploading.value = false
  }
}

async function handleAudioUpload(file: File) {
  audioUploading.value = true
  try {
    const result = await songApi.uploadAudio(file)
    modal.formData!.audioUrl = result.url
    ElMessage.success('音频上传成功')
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '未知错误'
    ElMessage.error('音频上传失败：' + msg)
  } finally {
    audioUploading.value = false
  }
}

function triggerCoverInput() {
  coverFileInput.value?.click()
}

function triggerAudioInput() {
  audioFileInput.value?.click()
}

function onCoverFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  handleCoverUpload(file)
  input.value = ''
}

function onAudioFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  handleAudioUpload(file)
  input.value = ''
}

const songStats = reactive({ total: 0, pending: 0, publishedThisMonth: 0, totalPlays: 0, activeCount: 0 })
onMounted(async () => {
  try {
    const s = await songApi.stats()
    songStats.total = s.total ?? 0
    songStats.pending = s.pending ?? 0
    songStats.publishedThisMonth = s.publishedThisMonth ?? 0
    songStats.totalPlays = s.totalPlays ?? 0
    songStats.activeCount = s.total - songStats.pending
  } catch { /* 静默失败 */ }
})

function fmtWan(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return n.toLocaleString()
}
const { exporting, doExport } = useExport(() => songApi.export())

// ============ 批量管理 ============
const selectedSongs = ref<Song[]>([])

function handleSelectionChange(rows: Song[]) {
  selectedSongs.value = rows
}

const selectedCount = computed(() => selectedSongs.value.length)

const selectedStatuses = computed(() =>
  [...new Set(selectedSongs.value.map(s => s.auditStatus))]
)

const allSameStatus = computed(() => selectedStatuses.value.length === 1)

const canBatchAudit = computed(() =>
  allSameStatus.value && selectedStatuses.value[0] === 0
)
const canBatchPublish = computed(() =>
  allSameStatus.value && (selectedStatuses.value[0] === 1 || selectedStatuses.value[0] === 4)
)
const canBatchUnpublish = computed(() =>
  allSameStatus.value && selectedStatuses.value[0] === 3
)
const canBatchDelete = computed(() =>
  allSameStatus.value && (selectedStatuses.value[0] === 2 || selectedStatuses.value[0] === 4)
)

// 选中歌曲的标签（用于批量操作提示）
const selectedStatusLabel = computed(() => {
  if (!allSameStatus.value) return ''
  return auditLabel(selectedStatuses.value[0])
})

// ============ 批量审核 ============
async function batchAudit(action: 'pass' | 'reject') {
  if (selectedSongs.value.length === 0) {
    ElMessage.warning('请先勾选需要操作的歌曲')
    return
  }
  const label = action === 'pass' ? '批量通过' : '批量驳回'
  let remark = ''
  if (action === 'reject') {
    try {
      const { value } = await ElMessageBox.prompt('请输入驳回原因', `批量驳回 — ${selectedSongs.value.length} 首歌曲`, {
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
      `确认${label}已选中的 ${selectedSongs.value.length} 首歌曲？${remark ? `\n驳回原因：${remark}` : ''}`,
      `${label}确认`,
      { type: 'warning' }
    )
    await songApi.batchAudit(selectedSongs.value.map(s => s.id), action, remark)
    ElMessage.success(`${label}成功`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 批量上架 / 批量下架 ============
async function batchPublish() {
  try {
    await ElMessageBox.confirm(
      `确认上架已选中的 ${selectedSongs.value.length} 首歌曲？上架后将对所有用户可见。`,
      '批量上架确认',
      { type: 'warning', confirmButtonText: '确认上架' }
    )
    await songApi.batchPublish(selectedSongs.value.map(s => s.id))
    ElMessage.success(`已上架 ${selectedSongs.value.length} 首歌曲`)
    refresh()
  } catch { /* 取消 */ }
}

async function batchUnpublish() {
  try {
    await ElMessageBox.confirm(
      `确认下架已选中的 ${selectedSongs.value.length} 首歌曲？下架后将从平台隐藏，不会删除数据。`,
      '批量下架确认',
      { type: 'warning', confirmButtonText: '确认下架' }
    )
    await songApi.batchUnpublish(selectedSongs.value.map(s => s.id))
    ElMessage.success(`已下架 ${selectedSongs.value.length} 首歌曲`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 批量删除 ============
async function batchRemove() {
  if (selectedSongs.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的歌曲')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认永久删除已选中的 ${selectedSongs.value.length} 首歌曲？\n此操作不可恢复！`,
      '批量删除确认',
      { type: 'error', confirmButtonText: '确认删除' }
    )
    for (const s of selectedSongs.value) {
      await songApi.remove(s.id)
    }
    ElMessage.success(`已删除 ${selectedSongs.value.length} 首歌曲`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 单曲操作 ============
async function handleAuditPass(row: Song) {
  try {
    await ElMessageBox.confirm(`确认审核通过歌曲「${row.title}」？通过后将自动上架。`, '审核通过确认', { type: 'warning' })
    await songApi.audit(row.id, 'pass')
    await songApi.publish(row.id)
    ElMessage.success('审核通过，歌曲已自动上架')
    refresh()
  } catch { /* 取消 */ }
}

async function handleAuditReject(row: Song) {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', `驳回歌曲 — ${row.title}`, {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputPlaceholder: '请填写驳回原因…',
      inputValidator: (val) => val?.trim() ? true : '驳回原因不能为空',
      type: 'warning',
    })
    await songApi.audit(row.id, 'reject', value)
    ElMessage.success('歌曲已驳回')
    refresh()
  } catch { /* 取消 */ }
}

async function handlePublish(row: Song) {
  try {
    await ElMessageBox.confirm(
      `确认上架歌曲「${row.title}」？上架后将对所有用户可见。`,
      '上架确认',
      { type: 'warning', confirmButtonText: '确认上架' }
    )
    await songApi.publish(row.id)
    ElMessage.success(`歌曲「${row.title}」已上架`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleUnpublish(row: Song) {
  try {
    await ElMessageBox.confirm(
      `确认下架歌曲「${row.title}」？下架后将从平台隐藏。`,
      '下架确认',
      { type: 'warning', confirmButtonText: '确认下架' }
    )
    await songApi.unpublish(row.id)
    ElMessage.success(`歌曲「${row.title}」已下架`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleResubmit(row: Song) {
  try {
    await ElMessageBox.confirm(
      `确认将歌曲「${row.title}」重新提交审核？`,
      '重新提交确认',
      { type: 'warning', confirmButtonText: '确认提交' }
    )
    await songApi.resubmit(row.id)
    ElMessage.success(`歌曲「${row.title}」已重新提交审核`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleDelete(row: Song) {
  try {
    await ElMessageBox.confirm(
      `确认永久删除歌曲「${row.title}」？此操作不可恢复！`,
      '删除确认',
      { type: 'error', confirmButtonText: '确认删除' }
    )
    await songApi.remove(row.id)
    ElMessage.success(`歌曲「${row.title}」已删除`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleSubmit(formData: Song) {
  if (readonlyMode.value) { ElMessage.warning('当前为查看模式，无法编辑'); return }
  // ============ 必填字段验证 ============
  if (modal.mode === 'create') {
    if (!formData.title?.trim()) { ElMessage.warning('请输入歌曲名称'); return }
    if (!formData.duration || formData.duration <= 0) { ElMessage.warning('请输入歌曲时长'); return }
    if (!formData.style) { ElMessage.warning('请选择音乐风格'); return }
    if (!formData.releaseDate) { ElMessage.warning('请选择发行日期'); return }
    if (!formData.isrc?.trim()) { ElMessage.warning('请输入ISRC编码'); return }
    if (!formData.singerId) { ElMessage.warning('请选择歌手'); return }
    if (!formData.coverUrl?.trim()) { ElMessage.warning('请上传封面图片'); return }
    if (!formData.audioUrl?.trim()) { ElMessage.warning('请上传音频文件'); return }
  }

  if (modal.mode === 'create') {
    await songApi.create(formData)
    ElMessage.success('歌曲已添加，等待审核')
  } else {
    await songApi.update(formData.id, formData)
    ElMessage.success('歌曲信息已更新')
  }
  modal.close()
  refresh()
}

// ============ 工具函数 ============
function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtPlayCount(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return String(n)
}

function auditTagType(status: number) {
  const map: Record<number, string> = { 0: 'warning', 1: '', 2: 'danger', 3: 'success', 4: 'info' }
  return map[status] ?? 'info'
}

function auditLabel(status: number) {
  const map: Record<number, string> = { 0: '待审核', 1: '审核通过', 2: '已驳回', 3: '已上架', 4: '已下架' }
  return map[status] ?? '未知'
}

function styleTagColor(style: string) {
  const m: Record<string, string> = {
    '流行': 'tag-blue', '摇滚': 'tag-orange', '电子': 'tag-purple',
    '民谣': 'tag-green', '嘻哈': 'tag-green', '古典': 'tag-gray',
  }
  return m[style] ?? 'tag-gray'
}

</script>

<template>
  <div class="song-page">
    <!-- 概览卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :lg="6">
        <StatCard label="曲库总量" :value="songStats.total.toLocaleString()" sub="已上架" :trend="((songStats.total - songStats.pending) / Math.max(songStats.total, 1) * 100).toFixed(0) + '%'" trend-label="上架率" color="songs" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="待审核歌曲" :value="songStats.pending.toLocaleString()" sub="本月上架" :trend="songStats.publishedThisMonth.toLocaleString() + '首'" trend-dir="down" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="本月上架" :value="songStats.publishedThisMonth.toLocaleString()" sub="平台总播放" :trend="fmtWan(songStats.totalPlays)" trend-label="" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="平台总播放" :value="fmtWan(songStats.totalPlays)" sub="曲库总量" :trend="songStats.total.toLocaleString() + '首'" />
      </el-col>
    </el-row>

    <!-- 歌曲列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title"><el-icon><Headset /></el-icon> 歌曲列表</span>
          <div class="card-actions">
            <el-button v-if="canEdit" type="primary" size="small" @click="modal.openCreate()">
              <el-icon><Plus /></el-icon> 添加歌曲
            </el-button>
          </div>
        </div>
      </template>

      <!-- 版权到期提醒 -->
      <div
        v-if="copyrightAlerts.length > 0"
        style="display:flex;align-items:center;gap:10px;padding:10px 16px;margin-bottom:12px;border-radius:8px;cursor:pointer;background:#fef2f2;border:1px solid #fecaca;"
        @click="showCopyrightDialog"
      >
        <el-icon :size="18" color="#DC2626"><WarningFilled /></el-icon>
        <span style="font-weight:600;color:#991B1B;font-size:13px;">
          版权到期提醒：<b>{{ expiredCount }}</b> 条已过期，<b>{{ expiringCount }}</b> 条即将到期，点击查看详情并处理
        </span>
        <el-icon :size="14" color="#991B1B" style="margin-left:auto"><ArrowRight /></el-icon>
      </div>

      <!-- 搜索 + 批量操作栏 -->
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="搜索歌名/歌手/专辑..." :prefix-icon="Search" clearable class="search-inp" size="small" @input="search" />
        <el-select v-model="styleFilter" placeholder="全部风格" clearable size="small" style="width:110px" @change="refresh">
          <el-option v-for="s in StyleOptions" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-if="!isAuditor" v-model="auditFilter" placeholder="全部状态" clearable size="small" style="width:120px" @change="refresh">
          <el-option label="待审核" :value="0" />
          <el-option label="已驳回" :value="2" />
          <el-option label="已上架" :value="3" />
          <el-option label="已下架" :value="4" />
        </el-select>

        <!-- 批量操作按钮 — 根据选中歌曲状态动态显示 -->
        <template v-if="selectedCount > 0">
          <span class="selected-tip">已选 {{ selectedCount }} 首</span>
          <template v-if="canBatchAudit">
            <el-button size="small" type="success" @click="guardAudit(() => batchAudit('pass'))">批量通过</el-button>
            <el-button size="small" type="warning" @click="guardAudit(() => batchAudit('reject'))">批量驳回</el-button>
          </template>
          <template v-if="canBatchUnpublish">
            <el-button size="small" type="warning" @click="batchUnpublish">批量下架</el-button>
          </template>
          <template v-if="canBatchPublish">
            <el-button size="small" type="success" @click="batchPublish">批量上架</el-button>
          </template>
          <template v-if="canBatchDelete && !isAuditor">
            <el-button size="small" type="danger" plain @click="guardDelete(batchRemove)">批量删除</el-button>
          </template>
          <span v-if="!allSameStatus" class="mixed-tip">（不同状态，无法批量操作）</span>
        </template>

        <el-button size="small" :loading="exporting" @click="doExport(undefined, '歌曲列表.csv')">
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
        <el-table-column label="歌曲信息" min-width="200">
          <template #default="{ row }">
            <div class="song-cell">
              <el-avatar :size="40" :src="row.coverUrl" shape="square" class="cover-avatar">
                <el-icon :size="18"><Headset /></el-icon>
              </el-avatar>
              <div class="song-meta">
                <div class="song-title">{{ row.title }}</div>
                <div class="song-sub">{{ row.singerName || '未命名' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="专辑" width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.album || '未命名' }}</template>
        </el-table-column>
        <el-table-column label="风格" width="80">
          <template #default="{ row }">
            <span class="tag" :class="styleTagColor(row.style)">{{ row.style }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时长" width="75">
          <template #default="{ row }">{{ fmtDuration(row.duration) }}</template>
        </el-table-column>
        <el-table-column label="播放量" width="100" sortable prop="playCount">
          <template #default="{ row }">{{ fmtPlayCount(row.playCount) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag :type="auditTagType(row.auditStatus)" size="small" effect="plain">
                {{ auditLabel(row.auditStatus) }}
              </el-tag>
              <el-tooltip v-if="row.auditStatus === 2 && row.auditRemark" :content="row.auditRemark" placement="top">
                <el-icon class="remark-icon" :size="14"><WarningFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="上架时间" width="110">
          <template #default="{ row }">{{ formatDate(row.createdAt, 'YYYY-MM-DD') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <!-- 待审核：通过 / 驳回 / 查看（审核员）/ 编辑（编辑员）/ 删除（非审核员） -->
            <template v-if="row.auditStatus === 0">
              <el-button text type="success" size="small" @click="guardAudit(() => handleAuditPass(row))">通过</el-button>
              <el-button text type="warning" size="small" @click="guardAudit(() => handleAuditReject(row))">驳回</el-button>
              <el-button v-if="isAuditor" text type="info" size="small" @click="handleView(row)">查看</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="!isAuditor" text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 已驳回：重新提交 / 编辑 / 删除（审核员不可见） -->
            <template v-else-if="row.auditStatus === 2 && !isAuditor">
              <el-button text type="warning" size="small" @click="handleResubmit(row)">重新提交</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 已上架：下架 / 编辑 / 删除（审核员不可见） -->
            <template v-else-if="row.auditStatus === 3 && !isAuditor">
              <el-button text type="warning" size="small" @click="handleUnpublish(row)">下架</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 已下架：重新上架 / 编辑 / 删除（审核员不可见） -->
            <template v-else-if="row.auditStatus === 4 && !isAuditor">
              <el-button text type="success" size="small" @click="handlePublish(row)">重新上架</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 兜底（含旧数据状态1审核通过）：编辑 / 删除（审核员不可见） -->
            <template v-else-if="!isAuditor">
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
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
      :title="readonlyMode ? `查看歌曲 — ${modal.formData?.title}` : (modal.mode === 'create' ? '添加新歌曲' : `编辑歌曲 — ${modal.formData?.title}`)"
      width="620px"
      @closed="modal.close()"
      @open="fetchSingers"
    >
      <el-form v-if="modal.formData" :model="modal.formData" label-width="80px" :disabled="readonlyMode">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="歌曲名称">
              <el-input v-model="modal.formData.title" placeholder="请输入歌曲名称" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="时长(秒)">
              <el-input-number v-model="modal.formData.duration" :min="1" :max="3600" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="歌手">
              <el-select
                v-model="modal.formData.singerId"
                placeholder="请选择歌手"
                style="width:100%"
                filterable
                @focus="fetchSingers"
              >
                <el-option
                  v-for="s in singerList"
                  :key="s.id"
                  :label="s.name"
                  :value="s.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专辑">
              <el-input v-model="modal.formData.album" placeholder='留空则显示"未命名"' />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="风格">
              <el-select v-model="modal.formData.style" style="width:100%">
                <el-option v-for="s in StyleOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发行日期">
              <el-date-picker v-model="modal.formData.releaseDate" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="ISRC">
          <el-input v-model="modal.formData.isrc" placeholder="如 CN-A01-23-00456" />
        </el-form-item>
        <!-- 封面图上传 -->
        <el-form-item label="封面图" required>
          <div class="upload-row">
            <input
              ref="coverFileInput"
              type="file"
              style="display:none"
              @change="onCoverFileChange"
            />
            <el-button :loading="coverUploading" :icon="Upload" size="small" @click="triggerCoverInput">
              {{ coverUploading ? '上传中...' : '选择封面图片' }}
            </el-button>
            <span v-if="modal.formData.coverUrl" class="upload-done">已上传</span>
          </div>
          <div v-if="modal.formData.coverUrl" class="cover-preview">
            <el-image :src="modal.formData.coverUrl" fit="cover" style="width:100px;height:100px;border-radius:6px">
              <template #error><div class="img-error">加载失败</div></template>
            </el-image>
          </div>
          <div v-else class="upload-hint">请上传歌曲封面图片（必填）</div>
        </el-form-item>

        <!-- 音频上传 + 试听 -->
        <el-form-item label="音频文件" required>
          <div class="upload-row">
            <input
              ref="audioFileInput"
              type="file"
              style="display:none"
              @change="onAudioFileChange"
            />
            <el-button :loading="audioUploading" :icon="VideoPlay" size="small" @click="triggerAudioInput">
              {{ audioUploading ? '上传中...' : '选择音频文件' }}
            </el-button>
            <span v-if="modal.formData.audioUrl" class="upload-done">已上传</span>
            <audio v-if="modal.formData.audioUrl" :src="modal.formData.audioUrl" controls class="inline-audio" />
          </div>
          <div v-if="!modal.formData.audioUrl" class="upload-hint">请上传歌曲音频文件（必填）</div>
        </el-form-item>
        <el-form-item label="歌词">
          <el-input v-model="modal.formData.lyric" type="textarea" :rows="4" placeholder="歌词内容..." />
        </el-form-item>

        <!-- 版权信息（可选） -->
        <el-divider content-position="left" style="margin:12px 0">版权信息（可选）</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作词人">
              <el-input v-model="modal.formData.lyricAuthor" placeholder="作词人（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作曲人">
              <el-input v-model="modal.formData.composer" placeholder="作曲人（可选）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="版权公司">
          <el-input v-model="modal.formData.copyrightCompany" placeholder="版权所属公司（可选）" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="授权开始">
              <el-date-picker v-model="modal.formData.licenseStart" type="date" placeholder="开始日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权结束">
              <el-date-picker v-model="modal.formData.licenseEnd" type="date" placeholder="结束日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="modal.close()">{{ readonlyMode ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!readonlyMode" type="primary" @click="handleSubmit(modal.formData!)">
          {{ modal.mode === 'create' ? '确认添加' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 版权到期提醒详情弹窗 -->
    <el-dialog
      v-model="copyrightDialogVisible"
      title="版权到期提醒 - 受影响歌曲列表"
      width="750px"
      @closed="fetchCopyrightAlerts"
    >
      <div v-if="copyrightAlerts.length === 0" style="text-align:center;padding:30px;color:var(--gray-400)">
        暂无版权到期提醒，所有版权状态正常 🎉
      </div>
      <el-table v-else :data="copyrightAlerts" stripe border max-height="420">
        <el-table-column type="index" label="#" width="44" />
        <el-table-column label="歌曲ID" prop="songId" width="72" />
        <el-table-column label="版权状态" width="90">
          <template #default="{ row }">
            <el-tag :type="copyrightStatusType[row.status] || 'info'" size="small" effect="plain">
              {{ copyrightStatusLabel[row.status] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版权公司" prop="copyrightCompany" min-width="120" show-overflow-tooltip />
        <el-table-column label="词作者" prop="lyricAuthor" width="80" />
        <el-table-column label="曲作者" prop="composer" width="80" />
        <el-table-column label="授权截止" width="105">
          <template #default="{ row }">{{ row.licenseEnd || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="copyrightDialogVisible = false; handleCopyrightSong(row.songId)">
              查看
            </el-button>
            <el-button text type="danger" size="small" @click="handleUnpublishFromCopyright(row.songId)">
              下架
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="copyrightAlerts.length > 0" style="margin-top:12px;font-size:12px;color:var(--gray-500)">
        <el-icon :size="14" color="#DC2626"><WarningFilled /></el-icon>
        已过期版权对应的歌曲存在合规风险，建议及时下架或联系版权方续约
      </div>
      <template #footer>
        <el-button @click="copyrightDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyrightDialogVisible = false; refreshCopyrightAlerts()">
          <el-icon><Refresh /></el-icon> 刷新状态
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-header {
  display: flex; align-items: center; justify-content: space-between;
}
.card-title {
  font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px;
}
.mb-4 { margin-bottom: 16px; }
/* 搜索行 */
.search-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
}
.search-inp { width: 200px; }
.selected-tip {
  font-size: 12px; color: var(--primary); font-weight: 600; white-space: nowrap;
}
.mixed-tip {
  font-size: 12px; color: var(--gray-400); white-space: nowrap;
}

/* 歌曲信息 */
.song-cell {
  display: flex; align-items: center; gap: 10px;
}
.cover-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #589286, #7db8ac);
  color: #fff;
}
.song-meta { min-width: 0; }
.song-title { font-weight: 600; color: var(--gray-800); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.song-sub { font-size: 12px; color: var(--gray-400); margin-top: 2px; }

/* 状态列 */
.status-cell { display: flex; align-items: center; gap: 4px; }
.remark-icon { color: var(--danger); cursor: help; }

/* 分页 */
.pagination-wrap {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 14px; gap: 12px; flex-wrap: wrap;
}
.page-info { font-size: 13px; color: var(--gray-500); }

/* ============ 文件上传 ============ */
.upload-row {
  display: flex; align-items: center; gap: 10px;
}
.upload-done {
  font-size: 12px; color: #589286; font-weight: 500;
}
.upload-hint {
  font-size: 12px; color: var(--gray-400); margin-top: 4px;
}
.cover-preview {
  margin-top: 8px;
}
.audio-preview {
  margin-top: 8px;
}
.inline-audio {
  height: 32px; max-width: 280px; flex-shrink: 1; min-width: 0;
}
</style>
