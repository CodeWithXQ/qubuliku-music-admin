import { ref, reactive, watch, onMounted, onBeforeUnmount, getCurrentInstance, type Ref } from 'vue'
import type { PageResult } from '@/types'

interface TableOptions<T> {
  fetchApi: (params: Record<string, unknown>) => Promise<PageResult<T>>
  defaultPageSize?: number
  immediate?: boolean
}

export function useTable<T>(options: TableOptions<T>) {
  const { fetchApi, defaultPageSize = 20, immediate = true } = options

  const data: Ref<T[]> = ref([])
  const total = ref(0)
  const loading = ref(false)

  const query = reactive<Record<string, unknown>>({
    page: 1,
    pageSize: defaultPageSize,
    keyword: '',
  })

  // 防止组件卸载后的异步状态更新导致 DOM 崩溃
  let mounted = true
  onBeforeUnmount(() => { mounted = false })

  async function refresh() {
    loading.value = true
    try {
      const result = await fetchApi({ ...query })
      if (!mounted) return
      data.value = result.records ?? []
      total.value = result.total ?? 0
    } catch {
      if (!mounted) return
      data.value = []
      total.value = 0
    } finally {
      if (mounted) loading.value = false
    }
  }

  function search(keyword: string) {
    query.keyword = keyword
    query.page = 1
    refresh()
  }

  function onPageChange(page: number) {
    query.page = page
    refresh()
  }

  function onPageSizeChange(pageSize: number) {
    query.pageSize = pageSize
    query.page = 1
    refresh()
  }

  // 监听筛选条件变更（排除 page/pageSize，因为它们由分页事件触发）
  watch(
    () => ({ keyword: query.keyword }),
    () => {
      query.page = 1
      refresh()
    }
  )

  if (immediate) {
    onMounted(refresh)
  }

  return {
    data,
    total,
    loading,
    query,
    refresh,
    search,
    onPageChange,
    onPageSizeChange,
  }
}
