const api = require('../../utils/request')

Page({
  data: {
    notifications: [],
    page: 1,
    loading: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function') this.getTabBar().setData({ selected: 2 })
    this.setData({ page: 1, notifications: [] })
    this.loadNotifications()
  },

  onReachBottom() {
    this.setData({ page: this.data.page + 1 })
    this.loadNotifications()
  },

  async loadNotifications() {
    this.setData({ loading: true })
    try {
      const data = await api.get('/notifications', {
        page: this.data.page,
        pageSize: 20
      })
      const list = this.data.page === 1 ? data.records : [...this.data.notifications, ...data.records]
      this.setData({ notifications: list })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onTapItem(e) {
    const item = e.currentTarget.dataset.item
    // 标记已读
    if (!item.isRead) {
      api.put(`/notifications/${item.id}/read`).catch(() => {})
      item.isRead = true
    }
    // 跳转消息详情页
    wx.navigateTo({
      url: `/pages/notifications/detail?id=${item.id}`,
      success(res) {
        res.eventChannel.emit('sendNotifyItem', { data: item })
      }
    })
  },

  typeIcon(type) {
    const icons = {
      'song_audit': '🎵',
      'certification': '✅',
      'copyright': '⏰',
      'system': '📢'
    }
    return icons[type] || '📌'
  },

  typeLabel(type) {
    const labels = {
      'song_audit': '歌曲审核',
      'certification': '认证通知',
      'copyright': '版权提醒',
      'system': '系统消息'
    }
    return labels[type] || '通知'
  },

  formatTime(t) {
    if (!t) return ''
    const d = new Date(t)
    const now = new Date()
    const diff = now - d
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
})
