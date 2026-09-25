import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { getToken, removeToken } from '@/utils'
import { ElMessage } from 'element-plus'
import { mockHandlers, type MockHandler } from '@/mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 30000,
})

// Mock 匹配（支持路径参数 /xxx/:id/yyy）
function findMockHandler(method: string, url: string): ((payload: any) => any) | null {
  const handlers = mockHandlers[method as keyof MockHandler]
  if (!handlers) return null
  // 1. 精确匹配
  if (handlers[url]) return handlers[url]
  // 2. 模式匹配（:id → 数字，:any → 任意）
  for (const pattern of Object.keys(handlers)) {
    if (!pattern.includes(':')) continue
    const regex = new RegExp('^' + pattern.replace(/:id/g, '\\d+').replace(/:any/g, '[^/]+') + '$')
    if (regex.test(url)) return handlers[pattern]
  }
  return null
}

// 请求拦截器 — Mock 匹配 + 附加 JWT Token
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (USE_MOCK) {
      const method = (config.method ?? 'get').toLowerCase()
      const handler = findMockHandler(method, config.url ?? '')
      if (handler) {
        config.adapter = (cfg) => {
          const isGet = method === 'get'
          const payload = isGet ? cfg.params : (() => { try { return JSON.parse(cfg.data as string || '{}') } catch { return {} } })()
          const result = handler(payload)
          const delay = 150 + Math.random() * 250

          return new Promise<AxiosResponse>((resolve) => {
            setTimeout(() => {
              resolve({
                data: { code: 200, message: 'success', data: result },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: cfg,
              })
            }, delay)
          })
        }
      }
    }

    // 附加 JWT Token
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 — 统一错误处理
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 文件下载直接返回
    if (response.config.responseType === 'blob') {
      return response
    }

    if (data.code === 200 || data.code === 0) {
      return response
    }

    // 是否为登录请求（登录失败由登录页自行展示错误）
    const isLoginRequest = response.config.url?.includes('/auth/login')

    // Token 过期（非登录接口）
    if ((data.code === 401 || data.code === 403)) {
      if (isLoginRequest) {
        return Promise.reject(new Error(data.msg || data.message || '认证失败'))
      }
      removeToken()
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
      return Promise.reject(new Error(data.msg || data.message || '认证失败'))
    }

    // 登录接口的错误不弹全局提示，交由登录页处理
    if (!isLoginRequest) {
      ElMessage.error(data.msg || data.message || '请求失败')
    }
    return Promise.reject(new Error(data.msg || data.message || '请求失败'))
  },
  (error) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      removeToken()
      window.location.href = '/login'
      return Promise.reject(error)
    }
    ElMessage.error(error.message || '网络异常')
    return Promise.reject(error)
  }
)

// 统一响应格式
export interface ApiResponse<T = unknown> {
  code: number
  message?: string
  msg?: string
  data: T
}

// 封装请求方法
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await instance.get<ApiResponse<T>>(url, { params })
  return res.data.data
}

export async function post<T>(url: string, data?: Record<string, unknown>): Promise<T> {
  const res = await instance.post<ApiResponse<T>>(url, data)
  return res.data.data
}

export async function put<T>(url: string, data?: Record<string, unknown>): Promise<T> {
  const res = await instance.put<ApiResponse<T>>(url, data)
  return res.data.data
}

export async function del<T>(url: string): Promise<T> {
  const res = await instance.delete<ApiResponse<T>>(url)
  return res.data.data
}

export async function upload<T>(url: string, formData: FormData): Promise<T> {
  const res = await instance.post<ApiResponse<T>>(url, formData)
  return res.data.data
}

/** 文件下载请求 — 返回 Blob 用于触发浏览器下载 */
export async function downloadGet(url: string, params?: Record<string, unknown>): Promise<Blob> {
  const res = await instance.get(url, { params, responseType: 'blob' })
  return res.data as Blob
}

export default instance
