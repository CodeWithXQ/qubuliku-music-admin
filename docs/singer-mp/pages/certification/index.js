const api = require('../../utils/request')

Page({
  data: {
    certStatus: 0,
    certRemark: '',
    submitting: false
  },

  onShow() {
    this.loadStatus()
  },

  async loadStatus() {
    try {
      const data = await api.get('/certification')
      this.setData({ certStatus: data.certStatus, certRemark: data.auditRemark || '' })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    }
  },

  onResubmit() {
    wx.showModal({
      title: '重新提交认证',
      content: '确认重新提交认证申请？',
      success: (res) => {
        if (!res.confirm) return
        this.setData({ submitting: true })
        api.post('/profile/resubmit').then(() => {
          wx.showToast({ title: '已重新提交', icon: 'success' })
          this.loadStatus()
        }).catch(err => {
          wx.showToast({ title: err.message, icon: 'none' })
        }).finally(() => this.setData({ submitting: false }))
      }
    })
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/index' })
  }
})
