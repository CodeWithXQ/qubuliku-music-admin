import { ref } from 'vue'

export function useModal<T = Record<string, unknown>>() {
  const visible = ref(false)
  const mode = ref<'create' | 'edit'>('create')
  const formData = ref<T | null>(null) as ReturnType<typeof ref<T | null>>

  function openCreate(initial?: Partial<T>) {
    mode.value = 'create'
    formData.value = (initial ?? {}) as T
    visible.value = true
  }

  function openEdit(data: T) {
    mode.value = 'edit'
    formData.value = { ...data }
    visible.value = true
  }

  function close() {
    visible.value = false
    formData.value = null
  }

  return { visible, mode, formData, openCreate, openEdit, close }
}
