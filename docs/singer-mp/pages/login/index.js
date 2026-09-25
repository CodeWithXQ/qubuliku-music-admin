const api = require('../../utils/request')
const app = getApp()

Page({
  data: {
    phone: '',
    code: '',
    smsCountdown: 0,
    loading: false
  },

  // ===== 微信手机号一键登录 =====
  onWechatLogin(e) {
    if (!e.detail.code && !e.detail.errMsg.includes('ok')) {
      wx.showToast({ title: '授权取消', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    wx.login({
      success: (loginRes) => {
        api.post('/login/wechat', {
          wxCode: loginRes.code,
          phoneCode: e.detail.code
        }).then(data => {
          this.handleLoginSuccess(data)
        }).catch(err => {
          wx.showToast({ title: err.message, icon: 'none' })
        }).finally(() => this.setData({ loading: false }))
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  },

  // ===== 手机验证码登录 =====
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onCodeInput(e) { this.setData({ code: e.detail.value }) },

  sendSms() {
    const phone = this.data.phone
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    api.post('/sms/send', { phone }).then(() => {
      wx.showToast({ title: '验证码已发送', icon: 'success' })
      this.setData({ smsCountdown: 60 })
      this.startCountdown()
    }).catch(err => {
      wx.showToast({ title: err.message, icon: 'none' })
    })
  },

  startCountdown() {
    const timer = setInterval(() => {
      if (this.data.smsCountdown <= 1) {
        clearInterval(timer)
        this.setData({ smsCountdown: 0 })
      } else {
        this.setData({ smsCountdown: this.data.smsCountdown - 1 })
      }
    }, 1000)
  },

  onPhoneLogin() {
    const { phone, code } = this.data
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (code.length !== 6) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    api.post('/login/phone', { phone, smsCode: code }).then(data => {
      this.handleLoginSuccess(data)
    }).catch(err => {
      wx.showToast({ title: err.message, icon: 'none' })
    }).finally(() => this.setData({ loading: false }))
  },

  // ===== Demo 开发登录 =====
  onDemoLogin() {
    this.setData({ loading: true })
    api.post('/login/wechat', {}).then(data => {
      this.handleLoginSuccess(data)
    }).finally(() => this.setData({ loading: false }))
  },

  // ===== 登录成功处理 =====
  handleLoginSuccess(data) {
    wx.setStorageSync('token', data.token)
    app.globalData.token = data.token
    app.globalData.singerInfo = data.singerInfo
    // 同步写入 storage，供 distribution 等其他模块读取
    wx.setStorageSync('token', data.token)
    wx.setStorageSync('userInfo', {
      nickname: data.singerInfo?.name || '音乐人',
      avatar: data.singerInfo?.avatar || '',
      userId: data.singerInfo?.id || ''
    })

    if (data.isNewUser) {
      wx.navigateTo({ url: '/pages/register/index' })
    } else {
      wx.switchTab({ url: '/pages/dashboard/index' })
    }
  }
})
