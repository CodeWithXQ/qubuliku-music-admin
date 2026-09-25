<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardApi } from '@/api/modules/dashboard'
import type { DashboardOverview, ChartDataItem } from '@/types'

const router = useRouter()
const overview = ref<DashboardOverview | null>(null)
const topSongs = ref<{ rank: number; title: string; style: string; singerName: string; playCount: number }[]>([])
const styleDistribution = ref<ChartDataItem[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const [ov, ts, sd] = await Promise.all([
      dashboardApi.overview(),
      dashboardApi.topSongs(10),
      dashboardApi.styleDistribution(),
    ])
    overview.value = ov
    topSongs.value = ts
    styleDistribution.value = sd
  } finally {
    loading.value = false
  }
})

// 跳转到数据看板的热门歌曲区域
function goToFullChart() {
  router.push('/data#hot-songs')
}

function formatPlayCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(0) + '万'
  return String(n)
}

function rankClass(r: number): string {
  if (r === 1) return 'top1'
  if (r === 2) return 'top2'
  if (r === 3) return 'top3'
  return ''
}

// 平台营销数据总览 — 动态从 overview 读取
const stats = computed(() => {
  const o = overview.value
  if (!o) return []
  return [
    { label: '有效播放量(万次)', value: (o.totalPlays / 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','), change: '+23%', pos: true },
    { label: '总播放时长(万小时)', value: (o.totalListenHours / 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','), change: '+16%', pos: true },
    { label: '歌单收藏总数(万)', value: (o.playlistSaves / 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','), change: '+27%', pos: true },
    { label: '评论总数(万)', value: (o.commentCount / 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','), change: '+19%', pos: true },
    { label: '用户分享次数(万)', value: (o.shareCount / 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','), change: '+31%', pos: true },
    { label: '今日新增用户', value: o.newUserToday.toLocaleString(), change: '+8%', pos: true },
  ]
})
</script>

<template>
  <div class="dashboard-page" v-loading="loading">
    <!-- 概览卡片 -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="12" :sm="12" :lg="6">
        <StatCard label="曲库总量" :value="(overview?.songCount ?? 0).toLocaleString()" :sub="'本月新增 <strong>' + (overview?.activeSongCount ?? 0).toLocaleString() + '</strong>'" :trend="(overview?.songTrend ?? 0) + '%'" trend-dir="up" color="songs" />
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <StatCard label="合作艺人" :value="(overview?.singerCount ?? 0).toLocaleString()" :sub="'独家签约 <strong>' + (overview?.certifiedSingerCount ?? 0).toLocaleString() + '</strong>'" :trend="(overview?.singerTrend ?? 0) + '%'" trend-dir="up" color="singers" />
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <StatCard label="歌单总量" :value="(overview?.playlistCount ?? 0).toLocaleString()" :sub="'官方精选 <strong>' + (overview?.officialPlaylistCount ?? 0).toLocaleString() + '</strong>'" :trend="(overview?.playlistTrend ?? 0) + '%'" trend-dir="up" color="playlists" />
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <StatCard label="注册用户" :value="(overview?.userCount ?? 0).toLocaleString()" :sub="'日活 <strong>' + (overview?.dailyActiveUser ?? 0).toLocaleString() + '</strong>'" :trend="(overview?.userTrend ?? 0) + '%'" trend-dir="up" color="users" />
      </el-col>
    </el-row>

    <!-- 热门歌曲 + 风格播放量分布 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="12" :xs="24">
        <el-card shadow="never" class="twin-card">
          <template #header>
            <div class="card-header">
              <span class="card-title"><el-icon><Trophy /></el-icon> 热门歌曲 TOP 10</span>
              <el-button text type="primary" @click="goToFullChart">完整榜单 <el-icon><ArrowRight /></el-icon></el-button>
            </div>
          </template>
          <div class="rank-list">
            <div v-for="song in topSongs.slice(0, 5)" :key="song.rank" class="rank-item">
              <span class="rank-num" :class="rankClass(song.rank)">{{ song.rank }}</span>
              <div class="rank-info">
                <div class="rank-name">{{ song.title }}</div>
                <div class="rank-desc">{{ song.style }} · {{ song.singerName }}</div>
              </div>
              <span class="rank-value">{{ formatPlayCount(song.playCount) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" :xs="24">
        <el-card shadow="never" class="twin-card">
          <template #header>
            <div class="card-header">
              <span class="card-title"><el-icon><PieChart /></el-icon> 歌曲风格播放量分布</span>
              <span class="tag tag-blue">本月</span>
            </div>
          </template>
          <div class="bar-chart">
            <div v-for="(item, idx) in styleDistribution" :key="item.label" class="bar-row" :style="{ animationDelay: `${idx * 0.08}s` }">
              <span class="bar-dot" :style="{ background: item.color ?? '#589286' }" />
              <span class="bar-tag">{{ item.label }}</span>
              <div class="bar-wrap">
                <div
                  class="bar-fill"
                  :style="{
                    width: `${item.percent}%`,
                    background: `linear-gradient(90deg, ${item.color ?? '#589286'}, ${item.color ?? '#589286'}cc)`,
                    boxShadow: `0 0 10px ${item.color ?? '#589286'}40`,
                  }"
                />
              </div>
              <span class="bar-pct">{{ item.percent }}%</span>
            </div>
          </div>
          <div class="text-center mt-3 text-muted fs-12" style="display:flex;align-items:center;justify-content:center;gap:6px;">
            <span v-for="(item, idx) in styleDistribution.slice(0,4)" :key="item.label" class="inline-dot" :style="{ background: item.color ?? '#589286' }" />
            共覆盖 <strong style="color:var(--gray-700);margin:0 2px;">{{ styleDistribution.length }}</strong> 种音乐风格
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 平台营销数据总览 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title"><el-icon><DataAnalysis /></el-icon> 平台营销数据总览</span>
          <el-button text type="primary" @click="router.push('/data')">详细看板 <el-icon><ArrowRight /></el-icon></el-button>
        </div>
      </template>
      <el-row :gutter="10">
        <el-col v-for="stat in stats" :key="stat.label" :span="8" :sm="12" :xs="24" class="mb-2">
          <div class="stat-box">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-change" :class="stat.pos ? 'pos' : 'neg'">↑ {{ stat.change }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.mt-2 { margin-top: 8px; }
.text-center { text-align: center; }
.fs-12 { font-size: 12px; }

/* 等高双卡片 */
.twin-card :deep(.el-card__body) {
  min-height: 310px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Rank list */
.rank-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
}

.rank-item:last-child { border-bottom: none; }
.rank-item:hover { background: var(--gray-50); margin: 0 -8px; padding: 8px; border-radius: 6px; }

.rank-num {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: var(--gray-400);
  background: var(--gray-100); flex-shrink: 0;
}
.rank-num.top1 { background: #F59E0B; color: #fff; }
.rank-num.top2 { background: #94A3B8; color: #fff; }
.rank-num.top3 { background: #CD7F32; color: #fff; }

.rank-info { flex: 1; min-width: 0; }
.rank-name { font-weight: 500; color: var(--gray-700); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.rank-desc { font-size: 12px; color: var(--gray-400); }
.rank-value { font-weight: 600; color: var(--gray-700); font-size: 13px; flex-shrink: 0; }

/* Bar chart */
.bar-chart { flex: 1; display: flex; flex-direction: column; justify-content: space-around; gap: 6px; }
.bar-row {
  display: flex; align-items: center; gap: 10px;
  animation: barIn 0.5s ease both;
  padding: 3px 0;
  border-radius: 8px;
  transition: background 0.2s;
}
.bar-row:hover { background: var(--gray-50); }
@keyframes barIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

.bar-dot {
  width: 10px; height: 10px; border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}
.bar-tag { font-size: 12px; color: var(--gray-600); width: 36px; flex-shrink: 0; font-weight: 500; }
.bar-wrap { flex: 1; height: 20px; background: var(--gray-100); border-radius: 10px; overflow: hidden; }
.bar-fill {
  height: 100%; border-radius: 10px;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.bar-fill::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 60%);
  border-radius: 10px;
}
.bar-pct { font-size: 13px; font-weight: 700; color: var(--gray-700); width: 44px; text-align: right; }

/* 底部色点图例 */
.inline-dot {
  width: 8px; height: 8px; border-radius: 50%;
  opacity: 0.7;
}

.mt-3 { margin-top: 12px; }

/* Stats grid */
.stat-box {
  background: var(--gray-50);
  border-radius: 8px;
  padding: 12px 14px;
  transition: var(--transition);
  cursor: pointer;
  border: 1px solid transparent;
}
.stat-box:hover { background: #fff; border-color: var(--gray-200); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.stat-label { font-size: 11.5px; color: var(--gray-500); font-weight: 500; }
.stat-value { font-size: 18px; font-weight: 700; color: var(--gray-800); margin-top: 2px; }
.stat-change { font-size: 11px; font-weight: 500; margin-top: 2px; }
.stat-change.pos { color: var(--success); }
.stat-change.neg { color: var(--danger); }
</style>
