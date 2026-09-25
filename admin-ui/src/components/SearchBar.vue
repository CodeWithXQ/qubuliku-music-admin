<script setup lang="ts">
interface Props {
  placeholder?: string
  filters?: { label: string; options: { label: string; value: string }[]; value: string; key: string }[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索...',
  filters: () => [],
})

const emit = defineEmits<{
  search: [keyword: string]
  filterChange: [key: string, value: string]
  reset: []
}>()

const keyword = defineModel<string>('keyword', { default: '' })

function onSearch() {
  emit('search', keyword.value)
}

function onFilterChange(key: string, value: string) {
  emit('filterChange', key, value)
}

function onReset() {
  keyword.value = ''
  emit('reset')
}
</script>

<template>
  <div class="search-bar">
    <el-input
      v-model="keyword"
      :placeholder="placeholder"
      :prefix-icon="Search"
      clearable
      class="search-input"
      @input="onSearch"
      @clear="onSearch"
    />
    <el-select
      v-for="f in filters"
      :key="f.key"
      :model-value="f.value"
      :placeholder="f.label"
      clearable
      class="filter-select"
      @change="(val: string) => onFilterChange(f.key, val)"
    >
      <el-option
        v-for="opt in f.options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>
    <el-button @click="onReset" text>重置</el-button>
    <slot name="actions" />
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.search-input {
  width: 240px;
  flex-shrink: 0;
}

.filter-select {
  width: 140px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
