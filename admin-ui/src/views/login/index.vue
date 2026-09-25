<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { LoginForm } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = reactive<LoginForm>({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: '请输入账号或姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e: any) {
    ElMessage.error(e?.message || '账号或密码错误')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 左侧背景 -->
    <div class="login-left">
      <img src="/login-bg-v2.png" alt="bg" class="bg-img" />
    </div>

    <!-- 右侧卡片 -->
    <div class="login-right">
      <div class="login-card">
        <div class="login-header">
          <img src="/logo.png" alt="logo" class="logo-img" />
          <div class="login-titles">
            <h1>曲不离库<span class="accent"> · 后台管理</span></h1>
            <p class="subtitle">余音绕梁 · 音乐库后台智能管理系统</p>
          </div>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="handleLogin">
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" placeholder="请输入账号或中文姓名" :prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" size="large" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" size="large" class="w-full" @click="handleLogin">
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  height: 100vh;
}

/* ======== 左侧背景 ======== */
.login-left {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.bg-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

/* ======== 右侧卡片区 ======== */
.login-right {
  width: 460px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 40px;
}

.login-card {
  width: 100%;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
}

/* ======== 头部 ======== */
.login-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 36px;
}

.logo-img {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: block;
  object-fit: contain;
}

.login-titles {
  min-width: 0;
}

.login-header h1 {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
  white-space: nowrap;
}

.login-header .accent {
  color: #589286;
}

.subtitle {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  white-space: nowrap;
}

/* ======== 按钮主题色 ======== */
:deep(.el-button--primary) {
  --el-button-bg-color: #589286;
  --el-button-border-color: #589286;
  --el-button-hover-bg-color: #4a7d73;
  --el-button-hover-border-color: #4a7d73;
  --el-button-active-bg-color: #3d6b62;
  --el-button-active-border-color: #3d6b62;
}

/* ======== 输入框选中/聚焦色 ======== */
:deep(.el-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #589286 inset;
}
:deep(.el-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #b8d4cf inset;
}

.w-full {
  width: 100%;
}

/* 小屏适配 */
@media (max-width: 768px) {
  .login-left {
    display: none;
  }
  .login-right {
    width: 100%;
  }
}
</style>
