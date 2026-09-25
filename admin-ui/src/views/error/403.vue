<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-code">403</div>
      <div class="error-text">抱歉，您没有权限访问此页面</div>
      <el-button type="primary" @click="router.push('/dashboard')">返回首页</el-button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.error-card {
  text-align: center;
}

.error-code {
  font-size: 72px;
  font-weight: 800;
  color: var(--gray-300);
  line-height: 1;
  margin-bottom: 12px;
}

.error-text {
  font-size: 16px;
  color: var(--gray-500);
  margin-bottom: 24px;
}
</style>
