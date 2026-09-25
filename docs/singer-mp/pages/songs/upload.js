const api = require('../../utils/request')

const STYLES = ['流行', '摇滚', '电子', '民谣', '嘻哈', '古典', '爵士', 'R&B']

Page({
  data: {
    form: {
      title: '', album: '', style: '', duration: '',
      isrc: '', lyric: '', releaseDate: '',
      lyricAuthor: '', composer: '', copyrightCompany: '',
      licenseStart: '', licenseEnd: ''
    },
    coverUrl: '', audioUrl: '',
    coverUploading: false, audioUploading: false, submitting: false,
    styleList: STYLES, styleIndex: -1,
    showCopyright: false
  },

  // ===== 封面上传 =====
  chooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles[0]
        this.setData({ coverUploading: true })
        api.uploadFile('/songs/upload/cover', file.tempFilePath, 'file')
          .then(data => {
            this.setData({ coverUrl: data.url })
            wx.showToast({ title: '封面上传成功', icon: 'success' })
          })
          .catch(err => wx.showToast({ title: err.message, icon: 'none' }))
          .finally(() => this.setData({ coverUploading: false }))
      }
    })
  },

  // ===== 音频上传 =====
  chooseAudio() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['mp3', 'wav', 'flac', 'm4a'],
      success: (res) => {
        const file = res.tempFiles[0]
        if (file.size > 50 * 1024 * 1024) {
          wx.showToast({ title: '文件不能超过50MB', icon: 'none' })
          return
        }
        this.setData({ audioUploading: true })
        api.uploadFile('/songs/upload/audio', file.path, 'file')
          .then(data => {
            this.setData({ audioUrl: data.url })
            wx.showToast({ title: '音频上传成功', icon: 'success' })
          })
          .catch(err => wx.showToast({ title: err.message, icon: 'none' }))
          .finally(() => this.setData({ audioUploading: false }))
      }
    })
  },

  // ===== 表单输入 =====
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  // ===== 风格选择 =====
  onStyleChange(e) {
    const idx = e.detail.value
    this.setData({ styleIndex: idx, 'form.style': STYLES[idx] })
  },

  // ===== 日期选择 =====
  onDateChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  // ===== 版权折叠 =====
  toggleCopyright() {
    this.setData({ showCopyright: !this.data.showCopyright })
  },

  // ===== 提交 =====
  onSubmit() {
    const f = this.data.form
    if (!f.title.trim()) return wx.showToast({ title: '请输入歌曲名称', icon: 'none' })
    if (!f.style) return wx.showToast({ title: '请选择音乐风格', icon: 'none' })
    if (!f.duration || parseInt(f.duration) <= 0) return wx.showToast({ title: '请输入有效时长(秒)', icon: 'none' })
    if (!this.data.coverUrl) return wx.showToast({ title: '请上传封面图片', icon: 'none' })
    if (!this.data.audioUrl) return wx.showToast({ title: '请上传音频文件', icon: 'none' })

    this.setData({ submitting: true })
    api.post('/songs', {
      ...f,
      duration: parseInt(f.duration),
      coverUrl: this.data.coverUrl,
      audioUrl: this.data.audioUrl
    }).then(() => {
      wx.showToast({ title: '提交成功，等待审核', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(err => {
      wx.showToast({ title: err.message, icon: 'none' })
    }).finally(() => this.setData({ submitting: false }))
  }
})
