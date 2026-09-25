<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  sub?: string
  trend?: string
  trendDir?: 'up' | 'down'
  color?: 'songs' | 'singers' | 'playlists' | 'users' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  trendDir: 'up',
  color: 'default',
})

const colorClass = `card-${props.color}`
</script>

<template>
  <div class="stat-card-overview" :class="colorClass" @click="$emit('click')">
    <div class="label">{{ label }}</div>
    <div class="number">{{ value }}</div>
    <div v-if="sub" class="sub" v-html="sub" />
    <div v-if="trend" class="trend" :class="trendDir">
      {{ trendDir === 'up' ? '↑' : '↓' }} {{ trend }}
    </div>
    <slot />
  </div>
</template>

<style scoped>
.stat-card-overview {
  background: #fff;
  border-radius: var(--card-radius);
  padding: 18px 20px;
  box-shadow: var(--card-shadow);
  border: 1px solid rgba(0, 0, 0, 0.02);
  transition: var(--transition);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card-overview::after {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  opacity: 0.06;
  pointer-events: none;
}

.card-songs::after { background: #589286; }
.card-singers::after { background: #10B981; }
.card-playlists::after { background: #F59E0B; }
.card-users::after { background: #589286; }

.stat-card-overview:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.09);
}

.label {
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 6px;
  font-weight: 500;
}

.number {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-800);
  letter-spacing: -0.5px;
}

.sub {
  font-size: 12px;
  color: var(--gray-400);
  margin-top: 4px;
}

.trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
  margin-top: 6px;
}

.trend.up {
  color: var(--success);
  background: rgba(16, 185, 129, 0.12);
}

.trend.down {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.12);
}
</style>
