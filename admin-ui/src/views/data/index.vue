<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { dataApi } from '@/api/modules/data'
import { dashboardApi } from '@/api/modules/dashboard'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const route = useRoute()
const overview = ref({ totalPlayCount: 0, dailyActiveUser: 0, newSongCount: 0, conversionRate: 0 })
const hotSongs = ref<{ rank: number; title: string; singerName: string; style: string; playCount: number }[]>([])

const playTrendOption = ref<any>({
  color: ['#4A90D9', '#E8963E', '#589286', '#7B61D9', '#D95B5B', '#5B9BD5'],
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  tooltip: { trigger: 'axis' as const },
  legend: { data: [] as string[], bottom: 0, textStyle: { fontSize: 12 } },
  xAxis: { type: 'category' as const, data: [] as string[] },
  yAxis: { type: 'value' as const, axisLabel: { formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : String(v) } },
  series: [] as any[],
})

const userGrowthOption = ref({
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  tooltip: { trigger: 'axis' },
  legend: { data: [] as string[], bottom: 0 },
  xAxis: { type: 'category', data: [] as string[] },
  yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v } },
  series: [] as { name: string; type: string; smooth: boolean; data: number[] }[],
})

function fmtWan(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return n.toLocaleString()
}

onMounted(async () => {
  try {
    const [ov, hs, trends, growth] = await Promise.all([
      dataApi.overviewStats(),
      dashboardApi.topSongs(10),
      dataApi.playTrends(30),
      dataApi.userGrowth(30),
    ])
    overview.value = ov
    hotSongs.value = hs

    // 播放趋势图表
    const months = trends.map((t: any) => t.month)
    const styles = Object.keys(trends[0] || {}).filter(k => k !== 'month')
    playTrendOption.value = {
      grid: { top: 20, right: 20, bottom: 40, left: 50 },
      tooltip: { trigger: 'axis' },
      legend: { data: styles, bottom: 0 },
      xAxis: { type: 'category', data: months, boundaryGap: false },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : String(v) } },
      series: styles.map(s => ({
        name: s, type: 'line', data: trends.map((t: any) => t[s] || 0),
      })),
    }

    // 用户增长图表
    const umonths = growth.map((g: any) => g.month)
    const keys = Object.keys(growth[0] || {}).filter(k => k !== 'month')
    userGrowthOption.value = {
      grid: { top: 20, right: 20, bottom: 40, left: 50 },
      tooltip: { trigger: 'axis' },
      legend: { data: keys, bottom: 0 },
      xAxis: { type: 'category', data: umonths, boundaryGap: true },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : String(v) } },
      series: keys.map(k => ({
        name: k, type: 'bar', data: growth.map((g: any) => g[k] || 0),
      })),
    }
  } catch { /* 使用默认数据 */ }

  if (route.hash === '#hot-songs') {
    await nextTick()
    const el = document.getElementById('hot-songs')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
</script>

<template>
  <div class="data-page">
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :lg="6">
        <StatCard label="总播放量" :value="fmtWan(overview.totalPlayCount)" sub="较昨日 +3.2%" trend="23%" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="日活跃用户" :value="overview.dailyActiveUser.toLocaleString()" sub="在线峰值 8,200" trend="15%" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="新增歌曲" :value="overview.newSongCount.toLocaleString()" sub="本月累计" trend="19%" />
      </el-col>
      <el-col :xs="12" :lg="6">
        <StatCard label="转化率" :value="overview.conversionRate + '%'" sub="免费→付费" trend="1.2p" />
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-4">
      <el-col :span="12" :xs="24">
        <el-card shadow="never">
          <template #header><span class="card-title"><el-icon><TrendCharts /></el-icon> 播放趋势 (近12月)</span></template>
          <VChart :option="playTrendOption" style="height:300px" />
        </el-card>
      </el-col>
      <el-col :span="12" :xs="24">
        <el-card shadow="never">
          <template #header><span class="card-title"><el-icon><UserFilled /></el-icon> 用户增长</span></template>
          <VChart :option="userGrowthOption" style="height:300px" />
        </el-card>
      </el-col>
    </el-row>

    <el-card id="hot-songs" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title"><el-icon><DataAnalysis /></el-icon> 热门歌曲排行</span>
        </div>
      </template>
      <el-table :data="hotSongs" stripe>
        <el-table-column prop="rank" label="#" width="50" />
        <el-table-column prop="title" label="歌曲" min-width="150" />
        <el-table-column prop="singerName" label="歌手" width="120" />
        <el-table-column prop="style" label="风格" width="80" />
        <el-table-column prop="playCount" label="播放量" width="100">
          <template #default="{ row }">{{ fmtWan(row.playCount) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.mb-4 { margin-bottom: 16px; }
</style>
