<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { systemApi, type PasswordForm } from '@/api/modules/system'

const userStore = useUserStore()

onMounted(() => {
  userStore.fetchUserInfo()
})

// ============ 头像系统 ============
const avatarColors = [
  '#589286', '#7C3AED', '#DB2777', '#DC2626', '#EA580C',
  '#CA8A04', '#16A34A', '#589286', '#7db8ac', '#9333EA',
  '#0F766E', '#B91C1C', '#4a7d73', '#A21CAF', '#15803D',
]

const avatarVisible = ref(false)
const pickingType = ref<'text' | 'image'>('text')
const pickingColor = ref(avatarColors[0])
const pickingInitials = ref('')
const pickingImageUrl = ref('')

// 生成文字头像的 Data URL (SVG)
function textAvatarUrl(name: string, bgColor: string): string {
  const initials = (name || '管').slice(0, 2).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${bgColor}" rx="30"/>
    <text x="100" y="132" text-anchor="middle" font-family="sans-serif"
      font-size="90" font-weight="700" fill="#fff">${initials}</text></svg>`
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

function openAvatarPicker() {
  const info = userStore.userInfo
  const currentAvatar = info?.avatar || ''
  if (currentAvatar.startsWith('data:') || currentAvatar.startsWith('http')) {
    pickingType.value = 'image'
    pickingImageUrl.value = currentAvatar
  } else {
    pickingType.value = 'text'
    pickingColor.value = avatarColors[0]
    pickingInitials.value = (info?.realName || info?.username || '管').slice(0, 2).toUpperCase()
  }
  avatarVisible.value = true
}

function selectTextAvatar(color: string) {
  pickingColor.value = color
  pickingType.value = 'text'
}

function selectImageAvatar() {
  pickingType.value = 'image'
}

function previewAvatar(): string {
  if (pickingType.value === 'text') {
    return textAvatarUrl(pickingInitials.value, pickingColor.value)
  }
  return pickingImageUrl.value || textAvatarUrl(pickingInitials.value, '#589286')
}

async function confirmAvatar() {
  try {
    const avatar = previewAvatar()
    await userStore.updateProfile({ avatar })
    ElMessage.success('头像已更新')
    avatarVisible.value = false
  } catch {
    ElMessage.error('头像更新失败')
  }
}

// ============ 编辑资料弹窗 ============
const editVisible = ref(false)
const saving = ref(false)

const profileForm = reactive({
  realName: '',
  employeeId: '',
  phone: '',
  position: '',
  department: '',
  avatar: '',
})

function openEdit() {
  const u = userStore.userInfo
  if (!u) return
  profileForm.realName = u.realName || ''
  profileForm.employeeId = u.employeeId || ''
  profileForm.phone = u.phone || ''
  profileForm.position = u.position || ''
  profileForm.department = u.department || ''
  profileForm.avatar = u.avatar || ''
  editVisible.value = true
}

async function saveProfile() {
  saving.value = true
  try {
    await userStore.updateProfile({ ...profileForm })
    ElMessage.success('个人资料已更新')
    editVisible.value = false
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// ============ 修改密码 ============
const passwordForm = ref<PasswordForm>({ oldPassword: '', newPassword: '', confirmPassword: '' })
const changingPwd = ref(false)

async function updatePassword() {
  if (!passwordForm.value.oldPassword) return ElMessage.warning('请输入当前密码')
  if (passwordForm.value.newPassword.length < 8) return ElMessage.warning('新密码至少8位')
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) return ElMessage.warning('两次密码不一致')
  changingPwd.value = true
  try {
    await systemApi.updatePassword(passwordForm.value)
    ElMessage.success('密码修改成功')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || '密码修改失败'
    ElMessage.error(msg)
  } finally {
    changingPwd.value = false
  }
}

const userInfo = computed(() => userStore.userInfo)
</script>

<template>
  <div class="profile-page">
    <!-- ========== 管理员信息卡片 ========== -->
    <el-card shadow="never" class="mb-4 profile-hero">
      <div class="hero-layout">
        <div class="avatar-wrapper" @click="openAvatarPicker">
          <el-avatar :size="88" :src="userInfo?.avatar" :style="{ backgroundColor: !userInfo?.avatar?.startsWith('http') ? '#589286' : undefined }" class="hero-avatar">
            {{ !userInfo?.avatar?.startsWith('http') ? (userInfo?.realName?.[0]?.toUpperCase() || '管') : '' }}
          </el-avatar>
          <div class="avatar-overlay">
            <el-icon :size="22"><Camera /></el-icon>
            <span class="overlay-text">更换头像</span>
          </div>
        </div>
        <div class="hero-info">
          <div class="hero-name">{{ userInfo?.realName || '未设置姓名' }}</div>
          <div class="hero-sub">
            <span class="hero-item"><el-icon><Briefcase /></el-icon>{{ userInfo?.position || '未设置职务' }}</span>
            <span class="hero-sep">|</span>
            <span class="hero-item"><el-icon><OfficeBuilding /></el-icon>{{ userInfo?.department || '未设置部门' }}</span>
            <span class="hero-sep">|</span>
            <span class="hero-item"><el-icon><Ticket /></el-icon>工号 {{ userInfo?.employeeId || '—' }}</span>
          </div>
          <div class="hero-contact">
            <span class="hero-item"><el-icon><Phone /></el-icon>{{ userInfo?.phone || '—' }}</span>
          </div>
          <div class="hero-login">
            <span class="text-muted fs-12">登录账号：{{ userInfo?.username }}</span>
            <span class="hero-sep">|</span>
            <span class="text-muted fs-12">最后登录：{{ userInfo?.lastLoginTime || '首次登录' }}</span>
            <span class="hero-sep">|</span>
            <span class="text-muted fs-12">IP：{{ userInfo?.lastLoginIp || '—' }}</span>
          </div>
        </div>
        <el-button type="primary" plain size="small" class="hero-edit-btn" @click="openEdit">
          <el-icon><EditPen /></el-icon> 编辑资料
        </el-button>
      </div>
    </el-card>

    <!-- ========== 下方：修改密码 + 账号安全 同行同高 ========== -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :span="12" :xs="24">
        <el-card shadow="never" class="equal-card">
          <template #header>
            <span class="card-title"><el-icon><Lock /></el-icon> 修改密码</span>
          </template>
          <el-form :model="passwordForm" label-width="90px">
            <el-form-item label="当前密码">
              <el-input v-model="passwordForm.oldPassword" type="password" placeholder="输入当前密码" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.newPassword" type="password" placeholder="至少8位含数字字母" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="再次输入新密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="changingPwd" @click="updatePassword">更新密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12" :xs="24">
        <el-card shadow="never" class="equal-card">
          <template #header>
            <span class="card-title"><el-icon><InfoFilled /></el-icon> 账号安全</span>
          </template>
          <div class="info-item">
            <span class="info-label">账号状态</span>
            <span class="info-value" style="color:var(--success)">正常</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后登录IP</span>
            <span class="info-value">{{ userInfo?.lastLoginIp || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后登录时间</span>
            <span class="info-value">{{ userInfo?.lastLoginTime || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">账号创建</span>
            <span class="info-value">{{ userInfo?.createdAt || '—' }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 头像选择弹窗 ========== -->
    <el-dialog v-model="avatarVisible" title="更换头像" width="520px">
      <div class="avatar-picker-body">
        <!-- 预览 -->
        <div class="avatar-preview-section">
          <el-avatar :size="88" :src="previewAvatar()" class="preview-avatar">
            {{ pickingType === 'text' ? pickingInitials : '' }}
          </el-avatar>
          <div class="preview-info">
            <span class="preview-name">{{ userInfo?.realName || userInfo?.username }}</span>
            <span class="preview-hint">预览效果</span>
          </div>
        </div>

        <!-- 选项卡 -->
        <div class="avatar-tabs">
          <span class="avatar-tab" :class="{ active: pickingType === 'text' }" @click="pickingType = 'text'">文字头像</span>
          <span class="avatar-tab" :class="{ active: pickingType === 'image' }" @click="pickingType = 'image'">图片链接</span>
        </div>

        <!-- 文字头像：颜色选择 -->
        <div v-if="pickingType === 'text'" class="color-grid">
          <div
            v-for="color in avatarColors"
            :key="color"
            class="color-chip"
            :class="{ 'color-selected': pickingColor === color }"
            :style="{ backgroundColor: color }"
            @click="selectTextAvatar(color)"
          >
            <span class="color-initials">{{ pickingInitials }}</span>
            <el-icon v-if="pickingColor === color" class="color-check"><Check /></el-icon>
          </div>
        </div>

        <!-- 图片头像 -->
        <div v-else class="image-url-section">
          <el-input v-model="pickingImageUrl" placeholder="输入头像图片URL地址" clearable>
            <template #prepend>URL</template>
          </el-input>
          <p class="image-hint">支持 jpg / png / gif / webp 等常见图片格式，建议正方形图片</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="avatarVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAvatar">确认更换</el-button>
      </template>
    </el-dialog>

    <!-- ========== 编辑资料弹窗 ========== -->
    <el-dialog v-model="editVisible" title="编辑个人资料" width="520px">
      <el-form :model="profileForm" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="工号">
              <el-input :model-value="profileForm.employeeId" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名">
              <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="profileForm.department" style="width:100%">
                <el-option label="技术研发部" value="技术研发部" />
                <el-option label="内容运营部" value="内容运营部" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职务">
              <el-select v-model="profileForm.position" style="width:100%">
                <el-option-group label="技术研发部">
                  <el-option label="技术总监" value="技术总监" />
                  <el-option label="高级工程师" value="高级工程师" />
                </el-option-group>
                <el-option-group label="内容运营部">
                  <el-option label="运营主管" value="运营主管" />
                  <el-option label="运营专员" value="运营专员" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="手机号码">
              <el-input v-model="profileForm.phone" placeholder="手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="头像链接">
          <el-input v-model="profileForm.avatar" placeholder="头像图片URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.mb-4 { margin-bottom: 16px; }
.fs-12 { font-size: 12px; }

/* ========== Hero 卡片 ========== */
.profile-hero :deep(.el-card__body) {
  padding: 24px 28px;
}
.hero-layout {
  display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap;
}

/* 头像可点击 */
.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 50%;
}
.hero-avatar {
  border: 3px solid var(--gray-200);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  transition: filter 0.2s;
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none;
}
.avatar-overlay .overlay-text {
  font-size: 11px;
  white-space: nowrap;
}
.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}
.avatar-wrapper:hover .hero-avatar {
  filter: brightness(0.9);
}

.hero-info { flex: 1; min-width: 0; }
.hero-name {
  font-size: 22px; font-weight: 700; color: var(--gray-800);
  margin-bottom: 6px;
}
.hero-sub, .hero-contact, .hero-login {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.hero-sub { margin-bottom: 4px; }
.hero-contact { margin-bottom: 4px; }
.hero-item {
  font-size: 13px; color: var(--gray-600);
  display: inline-flex; align-items: center; gap: 4px;
}
.hero-sep { color: var(--gray-300); }
.hero-edit-btn {
  flex-shrink: 0;
  align-self: center;
}

/* ========== 头像选择弹窗 ========== */
.avatar-picker-body { padding: 4px 0; }
.avatar-preview-section {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 0 20px;
  border-bottom: 1px solid var(--gray-100);
  margin-bottom: 16px;
}
.preview-avatar { flex-shrink: 0; }
.preview-info { display: flex; flex-direction: column; gap: 2px; }
.preview-name { font-size: 16px; font-weight: 600; color: var(--gray-800); }
.preview-hint { font-size: 12px; color: var(--gray-400); }

.avatar-tabs { display: flex; gap: 0; margin-bottom: 16px; border-bottom: 2px solid var(--gray-100); }
.avatar-tab {
  padding: 8px 20px; cursor: pointer; font-size: 13px; font-weight: 500;
  color: var(--gray-500); border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}
.avatar-tab:hover { color: var(--gray-700); }
.avatar-tab.active { color: var(--primary); border-bottom-color: var(--primary); }

.color-grid {
  display: grid; grid-template-columns: repeat(5, 1fr);
  gap: 14px; justify-items: center; padding: 4px 0;
}
.color-chip {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  border: 3px solid transparent; transition: transform 0.15s, border-color 0.2s;
}
.color-chip:hover { transform: scale(1.1); }
.color-selected { border-color: var(--gray-900); transform: scale(1.08); }
.color-initials { color: #fff; font-size: 20px; font-weight: 700; pointer-events: none; }
.color-check {
  position: absolute; bottom: -2px; right: -2px;
  width: 20px; height: 20px; background: #111827; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px;
}

.image-url-section { padding: 4px 0; }
.image-hint { font-size: 12px; color: var(--gray-400); margin-top: 8px; }

/* ========== 底部卡片等高等宽 ========== */
.bottom-row {
  align-items: stretch;
}
.bottom-row :deep(.el-col) {
  display: flex;
}
.equal-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.equal-card :deep(.el-card__body) {
  flex: 1;
}

/* ========== 信息项 ========== */
.info-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--gray-100);
}
.info-item:last-child { border-bottom: none; }
.info-label { font-size: 12px; color: var(--gray-400); display: block; margin-bottom: 4px; }
.info-value { font-size: 14px; font-weight: 500; color: var(--gray-700); }

</style>
