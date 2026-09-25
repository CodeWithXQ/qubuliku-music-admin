const api = require('../../utils/request')

Page({
  data: {
    song: null,
    copyright: null,
    resubmitting: false
  },

  onLoad(options) {
    if (options.id) this.loadDetail(options.id)
  },

  async loadDetail(id) {
    try {
      const song = await api.get(`/songs/${id}`)
      this.setData({ song })
      // 拉版权信息
      try { this.setData({ copyright: await api.get(`/songs/${id}/copyright`) }) } catch {}
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    }
  },

  onResubmit() {
    wx.showModal({
      title: '重新提交审核',
      content: '确认将该歌曲重新提交审核？',
      success: (res) => {
        if (!res.confirm) return
        this.setData({ resubmitting: true })
        api.post(`/songs/${this.data.song.id}/resubmit`).then(() => {
          wx.showToast({ title: '已重新提交', icon: 'success' })
          this.loadDetail(this.data.song.id)
        }).catch(err => {
          wx.showToast({ title: err.message, icon: 'none' })
        }).finally(() => this.setData({ resubmitting: false }))
      }
    })
  },

  auditLabel(s) {
    return { 0: '待审核', 1: '审核通过', 2: '已驳回', 3: '已上架', 4: '已下架' }[s] || '?'
  },

  copyrightLabel(s) {
    return { 0: '待录入', 1: '已授权', 2: '即将到期', 3: '已过期' }[s] || '?'
  },

  fmtWan(n) {
    if (!n) return '0'
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
    if (n >= 10000) return (n / 10000).toFixed(0) + '万'
    return n.toString()
  }
})
