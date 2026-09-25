<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete } from '@element-plus/icons-vue'
import { logApi } from '@/api/modules/log'
import { useTable } from '@/composables/useTable'
import { useExport } from '@/composables/useExport'
import { usePermission } from '@/composables/usePermission'
import { formatDate } from '@/utils'
import type { OperationLog } from '@/types'

const { isAdmin } = usePermission('*')

const opTypeFilter = ref('')
const startDate = ref('')

const { data, total, loading, query, refresh, search } = useTable<OperationLog>({
  fetchApi: (params) =>
    logApi.list({ ...params, opType: opTypeFilter.value, startDate: startDate.value } as any),
})

const { exporting, doExport } = useExport(() => logApi.export())

function resultTag(result: number) {
  return result === 1 ? 'success' : 'danger'
}

function opTypeColor(type: string) {
  const map: Record<string, string> = { 'ADD': 'tag-green', 'EDIT': 'tag-blue', 'DELETE': 'tag-orange', 'LOGIN': 'tag-purple', 'AUDIT': 'tag-green' }
  return map[type] ?? 'tag-gray'
}

async function handleDeleteLog(row: OperationLog) {
  try {
    await ElMessageBox.confirm(`确认删除该条操作日志？`, '删除确认', { type: 'warning' })
    await logApi.remove(row.id)
    ElMessage.success('日志已删除')
    refresh()
  } catch { /* 取消 */ }
}

async function handleClearLogs() {
  try {
    await ElMessageBox.confirm(
      '确认清空全部操作日志？此操作不可恢复！',
      '清空确认',
      { type: 'error', confirmButtonText: '确认清空' }
    )
    const res = await logApi.clear()
    ElMessage.success((res as any)?.msg || '日志已清空')
    refresh()
  } catch { /* 取消 */ }
}
</script>

<template>
  <div class="log-page">
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :lg="6"><StatCard label="今日操作" value="1,248" sub="成功 1,180" trend="12%" /></el-col>
      <el-col :xs="12" :lg="6"><StatCard label="异常操作" value="23" sub="待处理 8" trend="5%" trend-dir="down" /></el-col>
      <el-col :xs="12" :lg="6"><StatCard label="活跃管理员" value="6" sub="在线 3" /></el-col>
      <el-col :xs="12" :lg="6"><StatCard label="日志保留" value="90天" sub="自动归档" /></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title"><el-icon><Notebook /></el-icon> 操作日志列表</span>
          <div style="display:flex;gap:8px">
            <el-button v-if="isAdmin" type="danger" plain size="small" @click="handleClearLogs">
              <el-icon><Delete /></el-icon> 清空日志
            </el-button>
            <el-button :loading="exporting" @click="doExport(undefined, '操作日志.csv')">
              <el-icon><Download /></el-icon> 导出
            </el-button>
          </div>
        </div>
      </template>

      <div class="search-row">
        <el-input v-model="query.keyword" placeholder="搜索操作人或IP..." :prefix-icon="Search" clearable class="search-inp" size="small" @input="search" />
        <el-select v-model="opTypeFilter" placeholder="全部类型" clearable size="small" style="width:100px" @change="refresh">
          <el-option label="新增" value="ADD" />
          <el-option label="编辑" value="EDIT" />
          <el-option label="删除" value="DELETE" />
          <el-option label="登录" value="LOGIN" />
        </el-select>
        <el-date-picker v-model="startDate" type="date" placeholder="选择日期" size="small" style="width:130px" @change="refresh" />
        <el-button size="small" @click="refresh">查询</el-button>
      </div>

      <el-table :data="data" v-loading="loading" stripe border size="small">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="ipAddress" label="IP地址" width="130" />
        <el-table-column label="操作类型" width="80">
          <template #default="{ row }"><span class="tag" :class="opTypeColor(row.opType)">{{ row.opType === 'ADD' ? '新增' : row.opType === 'EDIT' ? '编辑' : row.opType === 'DELETE' ? '删除' : row.opType === 'LOGIN' ? '登录' : row.opType }}</span></template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="90" />
        <el-table-column prop="detail" label="详情" min-width="200" />
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="resultTag(row.result)" size="small">{{ row.result === 1 ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <el-button v-if="isAdmin" text type="danger" size="small" @click="handleDeleteLog(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

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
  </div>
</template>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.mb-4 { margin-bottom: 16px; }
.search-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.search-inp { width: 160px; }
.pagination-wrap { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; gap: 12px; flex-wrap: wrap; }
.page-info { font-size: 13px; color: var(--gray-500); }
</style>
