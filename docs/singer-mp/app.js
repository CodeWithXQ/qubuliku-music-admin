App({
  globalData: {
    baseUrl: 'http://localhost:8080/api/singer-mp',
    token: '',
    singerInfo: null,
    userInfo: null
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.checkLoginStatus()
    }
  },

  checkLoginStatus() {
    wx.request({
      url: `${this.globalData.baseUrl}/dashboard`,
      header: { Authorization: `Bearer ${this.globalData.token}` },
      success: (res) => {
        if (res.data.code === 200) {
          this.globalData.singerInfo = res.data.data
        } else {
          this.clearLogin()
        }
      },
      fail: () => this.clearLogin()
    })
  },

  clearLogin() {
    this.globalData.token = ''
    this.globalData.singerInfo = null
    wx.removeStorageSync('token')
    wx.reLaunch({ url: '/pages/login/index' })
  }
})
