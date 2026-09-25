// pages/stats/index.js
const api = require('../../utils/request')

Page({
  data: {
    period: 7,
    overview: null,
    topSongs: [],
    playsTrend: [],
    followerTrend: []
  },

  onShow() { this.loadStats() },

  onPullDownRefresh() {
    this.loadStats().then(() => wx.stopPullDownRefresh())
  },

  async loadStats() {
    try {
      const data = await api.get('/stats/overview', { period: this.data.period })
      this.setData({
        overview: data,
        topSongs: data.topSongs || [],
        playsTrend: data.playsTrend || [],
        followerTrend: data.followerTrend || []
      })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    }
  },

  onPeriodChange(e) {
    const period = parseInt(e.currentTarget.dataset.period)
    this.setData({ period })
    this.loadStats()
  },

  fmtWan(n) {
    if (!n) return '0'
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
    if (n >= 10000) return (n / 10000).toFixed(0) + '万'
    return n.toLocaleString()
  },

  maxVal(list, key) {
    if (!list || !list.length) return 1
    return Math.max(...list.map(i => i[key] || 0)) || 1
  }
})
