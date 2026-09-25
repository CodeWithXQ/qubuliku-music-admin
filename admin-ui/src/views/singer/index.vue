<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Headset, Remove, VideoPlay, Plus, WarningFilled } from '@element-plus/icons-vue'
import { singerApi, type SingerQuery } from '@/api/modules/singer'
import { songApi } from '@/api/modules/song'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { useExport } from '@/composables/useExport'
import { usePermission } from '@/composables/usePermission'
import { formatDate } from '@/utils'
import { StyleOptions, type Singer, type Song } from '@/types'

const { isAdmin, canEdit, canAudit, isAuditor } = usePermission('singer')

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
const statusFilter = ref('')

const { data, total, loading, query, refresh, search } = useTable<Singer>({
  fetchApi: (params) =>
    singerApi.list({
      ...params,
      style: styleFilter.value || undefined,
      certStatus: statusFilter.value || undefined,
    } as unknown as SingerQuery),
})

// 审核员自动锁定只看待认证数据
watch(isAuditor, (val) => {
  if (val && statusFilter.value !== '1') {
    statusFilter.value = '1'
    refresh()
  }
}, { immediate: true })

const modal = reactive(useModal<Singer>())
const readonlyMode = ref(false)
const { exporting, doExport } = useExport(() => singerApi.export())

// ============ 头像上传 ============
const avatarUploading = ref(false)
const avatarFileInput = ref<HTMLInputElement>()

async function handleAvatarUpload(file: File) {
  avatarUploading.value = true
  try {
    const result = await singerApi.uploadAvatar(file)
    modal.formData!.avatar = result.url
    ElMessage.success('头像上传成功')
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '未知错误'
    ElMessage.error('头像上传失败：' + msg)
  } finally {
    avatarUploading.value = false
  }
}

function triggerAvatarInput() {
  avatarFileInput.value?.click()
}

function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  handleAvatarUpload(file)
  input.value = ''
}

// ============ 歌曲选择器（参考歌单管理） ============
const songPickerVisible = ref(false)
const songPickerLoading = ref(false)
const songPickerData = ref<Song[]>([])
const songPickerTotal = ref(0)
const songPickerKeyword = ref('')
const songPickerStyle = ref('')
const songPickerSelected = ref<Song[]>([])
const songPickerPage = reactive({ page: 1, pageSize: 20 })

// 编辑模式下的歌手歌曲管理
const singerSongs = ref<Song[]>([])
const singerSongsLoading = ref(false)
const addedSongs = ref<Song[]>([])
const removedSongIds = reactive<Set<number>>(new Set())

async function loadSingerSongs(singerId: number) {
  singerSongsLoading.value = true
  try {
    // 获取该歌手的所有歌曲
    const params = { page: 1, pageSize: 999, keyword: '' }
    const result = await songApi.list(params as any)
    singerSongs.value = (result.records ?? []).filter(s => s.singerId === singerId)
    removedSongIds.clear()
    addedSongs.value = []
  } catch {
    singerSongs.value = []
  } finally {
    singerSongsLoading.value = false
  }
}

async function openEditWithSongs(row: Singer) {
  readonlyMode.value = false
  modal.openEdit(row)
  await loadSingerSongs(row.id)
}

async function handleView(row: Singer) {
  readonlyMode.value = true
  modal.openEdit(row)
  await loadSingerSongs(row.id)
}

const existingSongIds = computed(() => {
  if (modal.mode !== 'edit') return new Set<number>()
  return new Set(singerSongs.value.map(s => s.id))
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

function openSongPicker() {
  songPickerSelected.value = []
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
    const existingIds = new Set(singerSongs.value.map(s => s.id))
    // 同时排除已移除的
    const newSongs = songPickerSelected.value.filter(s => !existingIds.has(s.id))
    if (newSongs.length === 0) {
      ElMessage.warning('所选歌曲已在该歌手名下，无需重复添加')
      songPickerVisible.value = false
      return
    }
    singerSongs.value = [...singerSongs.value, ...newSongs]
    addedSongs.value = [...addedSongs.value, ...newSongs]
    // 从已移除列表中恢复（如果之前移除后又加回来）
    newSongs.forEach(s => removedSongIds.delete(s.id))
    songPickerVisible.value = false
    ElMessage.success(`已添加 ${newSongs.length} 首歌曲到该歌手`)
    return
  }
  if (songPickerSelected.value.length === 0) {
    ElMessage.warning('请至少选择一首歌曲')
    return
  }
  songPickerVisible.value = false
  ElMessage.success(`已选择 ${songPickerSelected.value.length} 首歌曲`)
}

function removeSongFromSinger(song: Song) {
  removedSongIds.add(song.id)
  singerSongs.value = singerSongs.value.filter(s => s.id !== song.id)
  addedSongs.value = addedSongs.value.filter(s => s.id !== song.id)
}

// ============ 新建歌曲（从歌手弹窗内发起） ============
const songCreateVisible = ref(false)
const songCreateSaving = ref(false)
const songCoverUploading = ref(false)
const songAudioUploading = ref(false)
const songCoverFileInput = ref<HTMLInputElement>()
const songAudioFileInput = ref<HTMLInputElement>()

// 创建模式下暂存的新建歌曲（等歌手创建后再提交）
const pendingSongs = ref<SongCreateForm[]>([])

interface SongCreateForm {
  title: string; duration: number; album: string; style: string
  isrc: string; releaseDate: string; coverUrl: string; audioUrl: string
  lyric: string
  lyricAuthor: string; composer: string; copyrightCompany: string
  licenseStart: string; licenseEnd: string
}

const songCreateForm = reactive<SongCreateForm>({
  title: '', duration: 180, album: '', style: '',
  isrc: '', releaseDate: '', coverUrl: '', audioUrl: '',
  lyric: '',
  lyricAuthor: '', composer: '', copyrightCompany: '',
  licenseStart: '', licenseEnd: '',
})

function resetSongCreateForm() {
  Object.assign(songCreateForm, {
    title: '', duration: 180, album: '', style: '',
    isrc: '', releaseDate: '', coverUrl: '', audioUrl: '',
    lyric: '',
    lyricAuthor: '', composer: '', copyrightCompany: '',
    licenseStart: '', licenseEnd: '',
  })
}

function openSongCreate() {
  resetSongCreateForm()
  songCreateVisible.value = true
}

function triggerSongCoverInput() { songCoverFileInput.value?.click() }
function triggerSongAudioInput() { songAudioFileInput.value?.click() }

function onSongCoverFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  handleSongCoverUpload(file)
  input.value = ''
}

function onSongAudioFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  handleSongAudioUpload(file)
  input.value = ''
}

async function handleSongCoverUpload(file: File) {
  songCoverUploading.value = true
  try {
    const result = await songApi.uploadCover(file)
    songCreateForm.coverUrl = result.url
    ElMessage.success('封面上传成功')
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '未知错误'
    ElMessage.error('封面上传失败：' + msg)
  } finally {
    songCoverUploading.value = false
  }
}

async function handleSongAudioUpload(file: File) {
  songAudioUploading.value = true
  try {
    const result = await songApi.uploadAudio(file)
    songCreateForm.audioUrl = result.url
    ElMessage.success('音频上传成功')
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '未知错误'
    ElMessage.error('音频上传失败：' + msg)
  } finally {
    songAudioUploading.value = false
  }
}

async function confirmSongCreate() {
  if (!songCreateForm.title?.trim()) { ElMessage.warning('请输入歌曲名称'); return }
  if (!songCreateForm.duration || songCreateForm.duration <= 0) { ElMessage.warning('请输入歌曲时长'); return }
  if (!songCreateForm.style) { ElMessage.warning('请选择音乐风格'); return }
  if (!songCreateForm.releaseDate) { ElMessage.warning('请选择发行日期'); return }
  if (!songCreateForm.coverUrl?.trim()) { ElMessage.warning('请上传封面图片'); return }
  if (!songCreateForm.audioUrl?.trim()) { ElMessage.warning('请上传音频文件'); return }

  songCreateSaving.value = true
  try {
    const isEditMode = modal.mode === 'edit' && modal.formData?.id

    if (isEditMode) {
      // 编辑模式：歌手已存在，直接创建歌曲并关联
      const songData: any = {
        title: songCreateForm.title.trim(),
        singerId: modal.formData!.id,
        duration: songCreateForm.duration,
        album: songCreateForm.album?.trim() || undefined,
        style: songCreateForm.style,
        isrc: songCreateForm.isrc?.trim() || '',
        coverUrl: songCreateForm.coverUrl,
        audioUrl: songCreateForm.audioUrl,
        lyric: songCreateForm.lyric?.trim() || undefined,
        releaseDate: songCreateForm.releaseDate,
      }
      const created = await songApi.create(songData)
      ElMessage.success('歌曲创建成功，已关联到当前歌手')
      songCreateVisible.value = false
      // 加入歌手歌曲列表
      singerSongs.value = [...singerSongs.value, created]
      addedSongs.value = [...addedSongs.value, created]
      removedSongIds.delete(created.id)
    } else {
      // 创建模式：歌手尚未创建，暂存歌曲数据，等歌手创建后再提交
      pendingSongs.value.push({ ...songCreateForm })
      ElMessage.success('歌曲已暂存，将在歌手创建后自动关联')
      songCreateVisible.value = false
    }
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '未知错误'
    ElMessage.error('歌曲创建失败：' + msg)
  } finally {
    songCreateSaving.value = false
  }
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const singerStats = reactive({ total: 0, newThisMonth: 0, totalSongs: 0, totalFollowers: 0 })
onMounted(async () => {
  try { Object.assign(singerStats, await singerApi.stats()) } catch { /* */ }
})
function fmtWan(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return n.toLocaleString()
}

// ============ 批量管理 ============
const selectedSingers = ref<Singer[]>([])

function handleSelectionChange(rows: Singer[]) {
  selectedSingers.value = rows
}

const selectedCount = computed(() => selectedSingers.value.length)

async function batchRemove() {
  if (selectedSingers.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的歌手')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认删除已选中的 ${selectedSingers.value.length} 位歌手？此操作不可恢复！`,
      '批量删除确认',
      { type: 'warning', confirmButtonText: '确认删除' }
    )
    for (const s of selectedSingers.value) {
      await singerApi.remove(s.id)
    }
    ElMessage.success(`已删除 ${selectedSingers.value.length} 位歌手`)
    refresh()
  } catch { /* 取消 */ }
}

// ============ 单曲操作 ============
async function handleCertify(row: Singer) {
  try {
    await ElMessageBox.confirm(
      `确认认证通过歌手「${row.name}」？通过后该歌手将获得完整平台权限。`,
      '认证通过确认',
      { type: 'warning', confirmButtonText: '确认通过' }
    )
    await singerApi.certify(row.id, 'pass')
    ElMessage.success(`歌手「${row.name}」已通过认证`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleCertifyReject(row: Singer) {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', `驳回认证 — ${row.name}`, {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputPlaceholder: '请填写驳回原因...',
      inputValidator: (val) => val?.trim() ? true : '驳回原因不能为空',
      type: 'warning',
    })
    await singerApi.certify(row.id, 'reject', value)
    ElMessage.success(`歌手「${row.name}」认证已驳回`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleResubmit(row: Singer) {
  try {
    await ElMessageBox.confirm(
      `确认将歌手「${row.name}」重新提交认证？`,
      '重新提交确认',
      { type: 'warning', confirmButtonText: '确认提交' }
    )
    await singerApi.resubmit(row.id)
    ElMessage.success(`歌手「${row.name}」已重新提交认证`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleDelete(row: Singer) {
  try {
    await ElMessageBox.confirm(
      `确认删除歌手「${row.name}」？将同时下架其所有歌曲。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除' }
    )
    await singerApi.remove(row.id)
    ElMessage.success(`歌手「${row.name}」已删除`)
    refresh()
  } catch { /* 取消 */ }
}

async function handleSubmit(formData: Singer) {
  // 只读模式不允许保存
  if (readonlyMode.value) { ElMessage.warning('当前为查看模式，无法编辑'); return }
  if (modal.mode === 'create') {
    if (!formData.name?.trim()) { ElMessage.warning('请输入歌手名称'); return }
    if (!formData.style) { ElMessage.warning('请选择音乐风格'); return }
    if (!formData.avatar?.trim()) { ElMessage.warning('请上传歌手头像'); return }
    if (!formData.intro?.trim()) { ElMessage.warning('请输入歌手简介'); return }
    // 新建时默认待认证（如果未手动选择）
    if (formData.certStatus === undefined || formData.certStatus === null) {
      formData.certStatus = 1
    }
    const created = await singerApi.create(formData)
    // 关联从曲库选择的已有歌曲
    if (songPickerSelected.value.length > 0) {
      for (const song of songPickerSelected.value) {
        await songApi.update(song.id, { singerId: created.id } as any)
      }
    }
    // 创建暂存的新建歌曲（带完整上传信息）
    for (const sf of pendingSongs.value) {
      await songApi.create({
        title: sf.title.trim(),
        singerId: created.id,
        duration: sf.duration,
        album: sf.album?.trim() || undefined,
        style: sf.style,
        isrc: sf.isrc?.trim() || '',
        coverUrl: sf.coverUrl,
        audioUrl: sf.audioUrl,
        lyric: sf.lyric?.trim() || undefined,
        releaseDate: sf.releaseDate,
      } as any)
    }
    const totalSongs = songPickerSelected.value.length + pendingSongs.value.length
    if (totalSongs > 0) {
      ElMessage.success(`歌手添加成功，已关联 ${totalSongs} 首歌曲`)
    } else {
      ElMessage.success('歌手添加成功')
    }
    songPickerSelected.value = []
    pendingSongs.value = []
  } else {
    await singerApi.update(formData.id, formData)
    // 同步歌曲变更：关联新歌曲
    for (const song of addedSongs.value) {
      await songApi.update(song.id, { singerId: formData.id } as any)
    }
    // 同步歌曲变更：解除被移除的歌曲
    for (const songId of removedSongIds) {
      await songApi.update(songId, { singerId: 0 } as any)
    }
    const changes: string[] = []
    if (addedSongs.value.length > 0) changes.push(`新增 ${addedSongs.value.length} 首`)
    if (removedSongIds.size > 0) changes.push(`移除 ${removedSongIds.size} 首`)
    ElMessage.success(changes.length > 0 ? `歌手信息已更新，${changes.join('，')}` : '歌手信息已更新')
    singerSongs.value = []
    addedSongs.value = []
    removedSongIds.clear()
  }
  modal.close()
  refresh()
}

// ============ 工具 ============
function certTagType(status: number) {
  if (status === 2) return 'success'
  if (status === 1) return 'warning'
  if (status === 3) return 'danger'
  return 'info'
}

function certLabel(status: number) {
  const map: Record<number, string> = { 2: '已认证', 1: '待认证', 0: '入驻中', 3: '已驳回' }
  return map[status] ?? '未知'
}

function styleTagColor(style: string): string {
  const map: Record<string, string> = {
    '流行': 'tag-blue', '摇滚': 'tag-orange', '电子': 'tag-purple',
    '民谣': 'tag-green', '嘻哈': 'tag-green', '古典': 'tag-gray',
  }
  return map[style] ?? 'tag-gray'
}

function fmtFollower(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return String(n)
}
</script>

<template>
  <div class="singer-page">
    <!-- 概览卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :lg="6">
        <StatCard label="合作艺人" :value="singerStats.total.toLocaleString()" sub="本月入驻" :trend="singerStats.newThisMonth.toLocaleString() + '位'" color="singers" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="本月入驻" :value="singerStats.newThisMonth.toLocaleString()" sub="作品总量" :trend="fmtWan(singerStats.totalSongs)" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="作品总量" :value="fmtWan(singerStats.totalSongs)" sub="人均作品" :trend="(singerStats.totalSongs / Math.max(singerStats.total, 1)).toFixed(0) + '首'" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="粉丝覆盖" :value="fmtWan(singerStats.totalFollowers)" sub="合作艺人" :trend="singerStats.total.toLocaleString() + '位'" />
      </el-col>
    </el-row>

    <!-- 歌手列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title"><el-icon><Mic /></el-icon> 歌手列表</span>
          <el-button v-if="canEdit" type="primary" size="small" @click="modal.openCreate()">
            <el-icon><Plus /></el-icon> 添加歌手
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="搜索歌手名称..." :prefix-icon="Search" clearable class="search-inp" size="small" @input="search" />
        <el-select v-model="styleFilter" placeholder="全部风格" clearable size="small" style="width:110px" @change="refresh">
          <el-option v-for="s in StyleOptions" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-if="!isAuditor" v-model="statusFilter" placeholder="全部状态" clearable size="small" style="width:110px" @change="refresh">
          <el-option label="已认证" value="2" />
          <el-option label="待认证" value="1" />
          <el-option label="已驳回" value="3" />
          <el-option label="入驻中" value="0" />
        </el-select>
        <div class="batch-actions" v-if="selectedCount > 0">
          <span class="selected-tip">已选 {{ selectedCount }} 位</span>
          <el-button size="small" type="danger" plain @click="guardDelete(() => batchRemove())">批量删除</el-button>
        </div>
        <el-button size="small" :loading="exporting" @click="doExport(undefined, '歌手列表.csv')">
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
        <el-table-column label="歌手信息" min-width="180">
          <template #default="{ row }">
            <div class="singer-cell">
              <el-avatar :size="44" :src="row.avatar" class="singer-avatar">
                {{ row.name[0] }}
              </el-avatar>
              <div class="singer-meta">
                <div class="singer-name">{{ row.name }}</div>
                <div class="singer-intro">{{ row.intro?.slice(0, 20) }}{{ (row.intro?.length ?? 0) > 20 ? '…' : '' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="风格" width="80">
          <template #default="{ row }">
            <span class="tag" :class="styleTagColor(row.style)">{{ row.style }}</span>
          </template>
        </el-table-column>
        <el-table-column label="认证状态" width="100">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag :type="certTagType(row.certStatus)" size="small">
                {{ certLabel(row.certStatus) }}
              </el-tag>
              <el-tooltip v-if="row.certStatus === 3 && row.auditRemark" :content="row.auditRemark" placement="top">
                <el-icon class="remark-icon" :size="14"><WarningFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="songCount" label="歌曲数" width="80" sortable />
        <el-table-column label="粉丝数" width="100" sortable prop="followerCount">
          <template #default="{ row }">{{ fmtFollower(row.followerCount) }}</template>
        </el-table-column>
        <el-table-column label="入驻时间" width="110">
          <template #default="{ row }">{{ formatDate(row.createdAt, 'YYYY-MM-DD') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <!-- 待认证：审核/查看按钮 -->
            <template v-if="row.certStatus === 1">
              <el-button text type="success" size="small" @click="guardAudit(() => handleCertify(row))">通过</el-button>
              <el-button text type="warning" size="small" @click="guardAudit(() => handleCertifyReject(row))">驳回</el-button>
              <el-button v-if="isAuditor" text type="info" size="small" @click="handleView(row)">查看</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEditWithSongs(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 已驳回：重新提交 / 编辑 / 删除 -->
            <template v-else-if="row.certStatus === 3">
              <el-button text type="warning" size="small" @click="handleResubmit(row)">重新提交</el-button>
              <el-button v-if="canEdit" text type="primary" size="small" @click="openEditWithSongs(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="guardDelete(() => handleDelete(row))">删除</el-button>
            </template>
            <!-- 其他状态（入驻中 / 已认证）：编辑/删除 -->
            <template v-else>
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
      :title="readonlyMode ? `查看歌手 - ${modal.formData?.name}` : (modal.mode === 'create' ? '添加新歌手' : `编辑歌手 - ${modal.formData?.name}`)"
      :width="modal.mode === 'edit' ? '820px' : '580px'"
      @closed="modal.close()"
    >
      <el-form v-if="modal.formData" :model="modal.formData" label-width="90px" :disabled="readonlyMode">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="歌手名称" required>
              <el-input v-model="modal.formData.name" placeholder="请输入歌手名称" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="风格" required>
              <el-select v-model="modal.formData.style" style="width:100%" placeholder="请选择">
                <el-option v-for="s in StyleOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 头像 -->
        <el-form-item label="头像" required>
          <template v-if="!readonlyMode">
            <div class="upload-row">
              <input ref="avatarFileInput" type="file" style="display:none" @change="onAvatarFileChange" />
              <el-button :loading="avatarUploading" :icon="Upload" size="small" @click="triggerAvatarInput">
                {{ avatarUploading ? '上传中...' : '选择头像图片' }}
              </el-button>
              <span v-if="modal.formData.avatar" class="upload-done">已上传</span>
            </div>
          </template>
          <div v-if="modal.formData.avatar" class="avatar-preview">
            <el-image :src="modal.formData.avatar" fit="cover" style="width:80px;height:80px;border-radius:50%">
              <template #error><div class="img-error">加载失败</div></template>
            </el-image>
          </div>
          <div v-else-if="!readonlyMode" class="upload-hint">请上传歌手头像（必填）</div>
        </el-form-item>

        <!-- 认证状态：管理员可选择设置，新建默认待认证 -->
        <el-form-item label="认证状态" required>
          <el-select v-model="modal.formData.certStatus" style="width:200px" placeholder="请选择认证状态">
            <el-option label="入驻中" :value="0" />
            <el-option label="待认证" :value="1" />
            <el-option label="已认证" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="简介" required>
          <el-input v-model="modal.formData.intro" type="textarea" :rows="2" placeholder="请输入歌手简介（必填）" />
        </el-form-item>
        <el-form-item label="社交链接">
          <el-input v-model="modal.formData.socialLinks" placeholder="微博,抖音,小红书 等链接，逗号分隔（可选）" />
        </el-form-item>

        <!-- 创建模式：关联/新建歌曲 -->
        <el-form-item v-if="modal.mode === 'create' && !readonlyMode" label="关联歌曲">
          <div style="display:flex;gap:8px;align-items:center">
            <el-button type="success" size="small" @click="openSongPicker">
              <el-icon><Search /></el-icon> 从曲库选择
            </el-button>
            <el-button type="primary" size="small" @click="openSongCreate">
              <el-icon><Plus /></el-icon> 新建歌曲
            </el-button>
            <span v-if="songPickerSelected.length > 0 || pendingSongs.length > 0" class="song-count-tip">
              已选 {{ songPickerSelected.length }} 首 + 新建 {{ pendingSongs.length }} 首（保存后生效）
            </span>
            <span v-else class="song-count-tip" style="color:var(--gray-400)">可选：从曲库选择或新建歌曲</span>
          </div>
        </el-form-item>
      </el-form>

      <!-- 编辑模式：歌手歌曲管理 -->
      <div v-if="modal.mode === 'edit' && !readonlyMode" class="singer-songs-section">
        <div class="singer-songs-header">
          <span class="singer-songs-title">
            <el-icon><Headset /></el-icon> 名下歌曲 ({{ singerSongs.length }} 首)
          </span>
          <div style="display:flex;gap:6px">
            <el-button type="success" size="small" @click="openSongPicker">
              <el-icon><Search /></el-icon> 从曲库添加
            </el-button>
            <el-button type="primary" size="small" @click="openSongCreate">
              <el-icon><Plus /></el-icon> 新建歌曲
            </el-button>
          </div>
        </div>
        <el-table
          :data="singerSongs"
          v-loading="singerSongsLoading"
          stripe
          border
          max-height="280"
          empty-text="该歌手暂无关联歌曲，请点击「添加歌曲」"
        >
          <el-table-column type="index" label="#" width="44" />
          <el-table-column label="歌曲名称" prop="title" min-width="180" show-overflow-tooltip />
          <el-table-column label="风格" width="72">
            <template #default="{ row }">
              <span class="tag" :class="styleTagColor(row.style)">{{ row.style }}</span>
            </template>
          </el-table-column>
          <el-table-column label="时长" width="66">
            <template #default="{ row }">{{ fmtDuration(row.duration) }}</template>
          </el-table-column>
          <el-table-column label="播放量" width="90" sortable prop="playCount">
            <template #default="{ row }">{{ fmtWan(row.playCount) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="64" fixed="right">
            <template #default="{ row }">
              <el-button text type="danger" size="small" @click="removeSongFromSinger(row)">
                <el-icon><Remove /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="addedSongs.length > 0 || removedSongIds.size > 0" class="singer-songs-pending">
          <template v-if="addedSongs.length > 0">
            <span class="pending-add">+{{ addedSongs.length }} 首待关联</span>
          </template>
          <template v-if="removedSongIds.size > 0">
            <span class="pending-remove">-{{ removedSongIds.size }} 首待解除</span>
          </template>
          <span class="pending-hint">（点击"保存修改"后生效）</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="modal.close()">{{ readonlyMode ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!readonlyMode" type="primary" @click="handleSubmit(modal.formData!)">
          {{ modal.mode === 'create' ? '确认添加' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建歌曲弹窗（从歌手管理内发起） -->
    <el-dialog
      v-model="songCreateVisible"
      :title="modal.mode === 'edit' ? `为「${modal.formData?.name}」新建歌曲` : '新建歌曲（将关联到新歌手）'"
      width="620px"
      @closed="resetSongCreateForm"
    >
      <el-form :model="songCreateForm" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="歌曲名称" required>
              <el-input v-model="songCreateForm.title" placeholder="请输入歌曲名称" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="时长(秒)" required>
              <el-input-number v-model="songCreateForm.duration" :min="1" :max="3600" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="专辑">
              <el-input v-model="songCreateForm.album" placeholder='留空则显示"未命名"' />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风格" required>
              <el-select v-model="songCreateForm.style" style="width:100%" placeholder="请选择">
                <el-option v-for="s in StyleOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="ISRC">
              <el-input v-model="songCreateForm.isrc" placeholder="如 CN-A01-23-00456" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发行日期" required>
              <el-date-picker v-model="songCreateForm.releaseDate" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 封面上传 -->
        <el-form-item label="封面图片" required>
          <div class="upload-row">
            <input ref="songCoverFileInput" type="file" style="display:none" @change="onSongCoverFileChange" />
            <el-button :loading="songCoverUploading" :icon="Upload" size="small" @click="triggerSongCoverInput">
              {{ songCoverUploading ? '上传中...' : '选择封面图片' }}
            </el-button>
            <span v-if="songCreateForm.coverUrl" class="upload-done">已上传</span>
          </div>
          <div v-if="songCreateForm.coverUrl" class="cover-preview">
            <el-image :src="songCreateForm.coverUrl" fit="cover" style="width:100px;height:100px;border-radius:6px">
              <template #error><div class="img-error">加载失败</div></template>
            </el-image>
          </div>
          <div v-else class="upload-hint">请上传歌曲封面图片（必填）</div>
        </el-form-item>

        <!-- 音频上传 + 试听 -->
        <el-form-item label="音频文件" required>
          <div class="upload-row">
            <input ref="songAudioFileInput" type="file" style="display:none" @change="onSongAudioFileChange" />
            <el-button :loading="songAudioUploading" :icon="VideoPlay" size="small" @click="triggerSongAudioInput">
              {{ songAudioUploading ? '上传中...' : '选择音频文件' }}
            </el-button>
            <span v-if="songCreateForm.audioUrl" class="upload-done">已上传</span>
            <audio v-if="songCreateForm.audioUrl" :src="songCreateForm.audioUrl" controls class="inline-audio" />
          </div>
          <div v-if="!songCreateForm.audioUrl" class="upload-hint">请上传歌曲音频文件（必填）</div>
        </el-form-item>

        <el-form-item label="歌词">
          <el-input v-model="songCreateForm.lyric" type="textarea" :rows="3" placeholder="歌词内容（可选）" />
        </el-form-item>

        <!-- 版权信息 -->
        <el-divider content-position="left" style="margin:12px 0">版权信息（可选）</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作词人">
              <el-input v-model="songCreateForm.lyricAuthor" placeholder="作词人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作曲人">
              <el-input v-model="songCreateForm.composer" placeholder="作曲人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="版权公司">
          <el-input v-model="songCreateForm.copyrightCompany" placeholder="版权所属公司" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="授权开始">
              <el-date-picker v-model="songCreateForm.licenseStart" type="date" placeholder="开始日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权结束">
              <el-date-picker v-model="songCreateForm.licenseEnd" type="date" placeholder="结束日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="songCreateVisible = false">取消</el-button>
        <el-button type="primary" :loading="songCreateSaving" @click="confirmSongCreate">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 歌曲选择器弹窗 -->
    <el-dialog
      v-model="songPickerVisible"
      title="从曲库选择歌曲"
      width="700px"
      @closed="songPickerSelected = []"
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
        <el-table-column type="selection" width="42" :selectable="(row: Song) => !existingSongIds.has(row.id)" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="歌曲名称" prop="title" min-width="120" show-overflow-tooltip />
        <el-table-column label="歌手" prop="singerName" width="100" show-overflow-tooltip />
        <el-table-column label="风格" width="72">
          <template #default="{ row }">
            <span class="tag" :class="styleTagColor(row.style)">{{ row.style }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时长" width="66">
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
.card-header {
  display: flex; align-items: center; justify-content: space-between;
}
.card-title {
  font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px;
}
.mb-4 { margin-bottom: 16px; }

.search-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
}
.search-inp { width: 180px; }
.selected-tip {
  font-size: 12px; color: var(--primary); font-weight: 600; white-space: nowrap;
}
.batch-actions {
  display: flex; align-items: center; gap: 6px;
}

/* 歌手信息 */
.singer-cell {
  display: flex; align-items: center; gap: 10px;
}
.singer-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #589286, #7db8ac);
  color: #fff;
  font-weight: 600;
}
.singer-meta { min-width: 0; }
.singer-name { font-weight: 600; color: var(--gray-800); }
.singer-intro { font-size: 12px; color: var(--gray-400); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pagination-wrap {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 14px; gap: 12px; flex-wrap: wrap;
}
.page-info { font-size: 13px; color: var(--gray-500); }

/* 头像上传 */
.upload-row {
  display: flex; align-items: center; gap: 10px;
}
.upload-done {
  font-size: 12px; color: #589286; font-weight: 500;
}
.upload-hint {
  font-size: 12px; color: var(--gray-400); margin-top: 4px;
}
.avatar-preview {
  margin-top: 8px;
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

/* 歌曲选择提示 */
.song-count-tip { font-size: 12px; color: #589286; font-weight: 600; margin-left: 8px; }

/* 歌曲选择器 */
.song-picker-search { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.picker-search-inp { width: 200px; }
.picker-pagination { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; gap: 8px; flex-wrap: wrap; }

/* 编辑模式歌手歌曲管理 */
.singer-songs-section {
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--border, #ebeef5);
}
.singer-songs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.singer-songs-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800, #303133);
  display: flex;
  align-items: center;
  gap: 6px;
}
.singer-songs-pending {
  margin-top: 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pending-add { color: #589286; font-weight: 600; }
.pending-remove { color: #e6492d; font-weight: 600; }
.pending-hint { color: var(--gray-400, #909399); }

/* 认证状态 */
.status-cell { display: flex; align-items: center; gap: 4px; }
.remark-icon { color: var(--danger); cursor: help; }
</style>
