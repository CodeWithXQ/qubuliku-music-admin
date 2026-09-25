const api = require('../../utils/request')

Page({
  data: {
    songs: [],
    page: 1,
    pageSize: 20,
    total: 0,
    filter: '',
    loading: false,
    noMore: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function') this.getTabBar().setData({ selected: 1 })
    this.setData({ page: 1, songs: [], noMore: false })
    this.loadSongs()
  },

  onReachBottom() {
    if (this.data.noMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadSongs()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, songs: [], noMore: false })
    this.loadSongs().then(() => wx.stopPullDownRefresh())
  },

  async loadSongs() {
    this.setData({ loading: true })
    try {
      const data = await api.get('/songs', {
        page: this.data.page,
        pageSize: this.data.pageSize,
        auditStatus: this.data.filter || undefined
      })
      const songs = this.data.page === 1 ? data.records : [...this.data.songs, ...data.records]
      this.setData({
        songs,
        total: data.total,
        noMore: songs.length >= data.total
      })
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ filter, page: 1, songs: [], noMore: false })
    this.loadSongs()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/songs/detail?id=${id}` })
  },

  goUpload() {
    wx.navigateTo({ url: '/pages/songs/upload' })
  },

  auditLabel(s) {
    return { 0: '待审核', 1: '审核通过', 2: '已驳回', 3: '已上架', 4: '已下架' }[s] || '?'
  },

  fmtWan(n) {
    if (!n) return '0'
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
    if (n >= 10000) return (n / 10000).toFixed(0) + '万'
    return n.toString()
  }
})
