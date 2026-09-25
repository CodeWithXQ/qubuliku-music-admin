const BASE = 'http://localhost:8080/api/singer-mp'

// 开发模式：true 时网络不通自动降级为 Mock 数据，false 时走真实后端
const DEV_MODE = true

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function request({ url, method = 'GET', data = {}, header = {} }) {
  const token = wx.getStorageSync('token')

  // 开发模式：直接走 Mock
  if (DEV_MODE) {
    return mockRequest(url, method, data)
  }

  // 生产模式：走真实后端
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...header
      },
      success(res) {
        if (res.data.code === 200) {
          resolve(res.data.data)
        } else if (res.data.code === 401) {
          wx.removeStorageSync('token')
          wx.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期'))
        } else {
          reject(new Error(res.data.msg || '请求失败'))
        }
      },
      fail(err) {
        // 网络不通时尝试 Mock 降级
        tryMockFallback(url, method, data).then(resolve).catch(() => {
          wx.showToast({ title: '网络异常', icon: 'none', duration: 1500 })
          reject(err)
        })
      }
    })
  })
}

// Mock 请求
async function mockRequest(url, method, data) {
  await sleep(200) // 模拟网络延迟
  const mock = require('./mock')
  const result = mock.match(url, data)
  if (result !== null) return result
  return {}
}

// 真实请求失败时尝试 Mock（静默降级）
async function tryMockFallback(url, method, data) {
  try {
    const result = await mockRequest(url, method, data)
    if (result && Object.keys(result).length > 0) return result
    throw new Error('no mock')
  } catch {
    throw new Error('网络不可用')
  }
}

function get(url, data) { return request({ url, method: 'GET', data }) }
function post(url, data) { return request({ url, method: 'POST', data }) }
function put(url, data) { return request({ url, method: 'PUT', data }) }

function uploadFile(url, filePath, name = 'file', formData = {}) {
  if (DEV_MODE) {
    return sleep(300).then(() => require('./mock').match(url, {}) || { url: 'https://picsum.photos/seed/music/200/200' })
  }

  const token = wx.getStorageSync('token')
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE + url,
      filePath,
      name,
      formData,
      header: { Authorization: token ? `Bearer ${token}` : '' },
      success(res) {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) resolve(data.data)
          else reject(new Error(data.msg))
        } catch { reject(new Error('解析失败')) }
      },
      fail(err) {
        // 降级 Mock
        try {
          const mock = require('./mock')
          resolve(mock.match(url, {}) || { url: 'https://picsum.photos/seed/music/200/200' })
        } catch {
          reject(err)
        }
      }
    })
  })
}

module.exports = { get, post, put, uploadFile }
