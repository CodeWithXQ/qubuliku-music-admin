const api = require('../../utils/request')

Page({
  data: {
    item: null,
    relatedData: null
  },

  onLoad(options) {
    const id = options.id
    if (!id) return wx.navigateBack()

    // 从通知列表页传过来的数据
    const channel = this.getOpenerEventChannel ? this.getOpenerEventChannel() : null
    if (channel) {
      channel.on('sendNotifyItem', (data) => {
        this.setData({ item: data.data })
        if (data.data.isRead === false) {
          api.put(`/notifications/${data.data.id}/read`).catch(() => {})
          data.data.isRead = true
        }
      })
    }

    // 无传参时通过 API 加载（Mock 兜底）
    if (!this.data.item) {
      api.get(`/notifications/${id}`).then(item => {
        this.setData({ item })
        if (item.isRead === false) {
          api.put(`/notifications/${id}/read`).catch(() => {})
        }
      }).catch(() => {
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
    }
  },

  typeIcon(type) {
    const icons = { song_audit: '🎵', certification: '✅', copyright: '⏰', system: '📢' }
    return icons[type] || '📌'
  },

  typeLabel(type) {
    const labels = { song_audit: '歌曲审核', certification: '认证通知', copyright: '版权提醒', system: '系统消息' }
    return labels[type] || '通知'
  },

  formatTime(t) {
    if (!t) return ''
    const d = new Date(t)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  },

  // 跳转关联页面
  goRelated() {
    const item = this.data.item
    if (!item || !item.relatedId) return
    if (item.type === 'song_audit') {
      wx.navigateTo({ url: `/pages/songs/detail?id=${item.relatedId}` })
    } else if (item.type === 'certification') {
      wx.navigateTo({ url: '/pages/certification/index' })
    }
  }
})
