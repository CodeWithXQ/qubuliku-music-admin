const api = require('../../utils/request')

Page({
  data: {
    singerInfo: null,
    pendingCount: 0,
    weekPlays: [],
    latestSongs: [],
    showCertTip: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function') this.getTabBar().setData({ selected: 0 })
    this.loadDashboard()
  },

  onPullDownRefresh() {
    this.loadDashboard().then(() => wx.stopPullDownRefresh())
  },

  async loadDashboard() {
    try {
      const data = await api.get('/dashboard')
      const fmt = this.fmtWan
      this.setData({
        singerInfo: data,
        pendingCount: data.pendingSongCount || 0,
        weekPlays: data.weekPlays || [],
        latestSongs: (data.latestSongs || []).slice(0, 5),
        showCertTip: data.certStatus === 1 || data.certStatus === 3,
        // 预格式化统计数值
        displayPlayCount: fmt(data.playCount || 0),
        displayFollowerCount: fmt(data.followerCount || 0),
        displaySongCount: data.songCount || 0
      })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    }
  },

  goUpload() {
    wx.navigateTo({ url: '/pages/songs/upload' })
  },

  goSongs() {
    wx.switchTab({ url: '/pages/songs/list' })
  },

  goCertification() {
    wx.navigateTo({ url: '/pages/certification/index' })
  },

  goStats() {
    wx.navigateTo({ url: '/pages/stats/index' })
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/index' })
  },

  fmtWan(n) {
    if (!n) return '0'
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
    if (n >= 10000) return (n / 10000).toFixed(0) + '万'
    return n.toLocaleString()
  },

  auditLabel(s) {
    return { 0: '待审核', 1: '审核通过', 2: '已驳回', 3: '已上架', 4: '已下架' }[s] || '未知'
  }
})
