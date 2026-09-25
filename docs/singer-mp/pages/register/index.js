// pages/register/index.js
const api = require('../../utils/request')
const app = getApp()
const STYLES = ['流行', '摇滚', '电子', '民谣', '嘻哈', '古典', '爵士', 'R&B']

Page({
  data: {
    nickname: '',
    styleIndex: -1,
    styleList: STYLES,
    intro: '',
    submitting: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  onStyleChange(e) {
    this.setData({ styleIndex: e.detail.value })
  },

  onSubmit() {
    const { nickname, styleIndex, intro } = this.data
    if (!nickname.trim()) return wx.showToast({ title: '请输入歌手名称', icon: 'none' })
    if (styleIndex < 0) return wx.showToast({ title: '请选择音乐风格', icon: 'none' })

    this.setData({ submitting: true })
    api.post('/register', {
      nickname: nickname.trim(),
      style: STYLES[styleIndex],
      intro: intro.trim()
    }).then(data => {
      wx.setStorageSync('token', data.token)
      app.globalData.token = data.token
      app.globalData.singerInfo = data.singerInfo
      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/dashboard/index' }), 1000)
    }).catch(err => {
      wx.showToast({ title: err.message, icon: 'none' })
    }).finally(() => this.setData({ submitting: false }))
  }
})
