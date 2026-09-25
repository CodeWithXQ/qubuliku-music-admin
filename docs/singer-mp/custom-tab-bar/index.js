Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/dashboard/index', text: '工作台', icon: '/images/tabbar/home.png', activeIcon: '/images/tabbar/home-active.png' },
      { pagePath: '/pages/songs/list', text: '歌曲', icon: '/images/tabbar/category.png', activeIcon: '/images/tabbar/category-active.png' },
      { pagePath: '/pages/notifications/index', text: '消息', icon: '/images/tabbar/order.png', activeIcon: '/images/tabbar/order-active.png' },
      { pagePath: '/pages/profile/index', text: '我的', icon: '/images/tabbar/mine.png', activeIcon: '/images/tabbar/mine-active.png' }
    ]
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const item = this.data.list[index]
      wx.switchTab({ url: item.pagePath })
    }
  }
})
