import { ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

export function useExport(exportApi: (params?: Record<string, unknown>) => Promise<Blob>) {
  const exporting = ref(false)
  let mounted = true
  onBeforeUnmount(() => { mounted = false })

  async function doExport(params?: Record<string, unknown>, filename = 'export.csv') {
    exporting.value = true
    try {
      const blob = await exportApi(params)
      if (!mounted) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    } catch {
      if (mounted) ElMessage.error('导出失败')
    } finally {
      if (mounted) exporting.value = false
    }
  }

  return { exporting, doExport }
}
