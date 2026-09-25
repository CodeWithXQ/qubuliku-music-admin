import { ref, onBeforeUnmount } from 'vue'

/** 返回一个 mounted 标记，组件卸载后自动变 false，防止异步回调操作已销毁的 DOM */
export function useMounted() {
  const mounted = ref(true)
  onBeforeUnmount(() => { mounted.value = false })
  return mounted
}
