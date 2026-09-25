const api = require('../../utils/request')
const app = getApp()
const STYLES = ['流行', '摇滚', '电子', '民谣', '嘻哈', '古典', '爵士', 'R&B']

Page({
  data: {
    profile: null,
    editing: false,
    styleList: STYLES,
    styleIndex: -1,
    saving: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function') this.getTabBar().setData({ selected: 3 })
    this.loadProfile()
  },

  async loadProfile() {
    try {
      const data = await api.get('/profile')
      const idx = STYLES.indexOf(data.style)
      this.setData({ profile: data, styleIndex: idx >= 0 ? idx : -1 })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    }
  },

  enableEdit() {
    this.setData({ editing: true })
  },

  cancelEdit() {
    this.setData({ editing: false })
    this.loadProfile()
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`profile.${field}`]: e.detail.value })
  },

  onStyleChange(e) {
    const idx = e.detail.value
    const p = this.data.profile
    p.style = STYLES[idx]
    this.setData({ styleIndex: idx, profile: p })
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles[0]
        api.uploadFile('/profile/avatar', file.tempFilePath, 'file')
          .then(data => {
            const p = this.data.profile
            p.avatar = data.url
            this.setData({ profile: p })
          })
          .catch(err => wx.showToast({ title: err.message, icon: 'none' }))
      }
    })
  },

  onSave() {
    const p = this.data.profile
    if (!p.name || !p.name.trim()) {
      return wx.showToast({ title: '歌手名称不能为空', icon: 'none' })
    }
    this.setData({ saving: true })
    api.put('/profile', {
      name: p.name, style: p.style, avatar: p.avatar,
      intro: p.intro, socialLinks: p.socialLinks
    }).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ editing: false })
      app.globalData.singerInfo = this.data.profile
    }).catch(err => {
      wx.showToast({ title: err.message, icon: 'none' })
    }).finally(() => this.setData({ saving: false }))
  },

  goCertification() {
    wx.navigateTo({ url: '/pages/certification/index' })
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出吗？',
      success: (res) => {
        if (res.confirm) app.clearLogin()
      }
    })
  }
})
