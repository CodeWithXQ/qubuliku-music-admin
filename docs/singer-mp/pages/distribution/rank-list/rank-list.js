// pages/distribution/rank-list/rank-list.js
/* ========== 股东排行榜单页面功能说明 ==========
 * 
 * 功能概述：
 * - 展示股东排行榜完整榜单
 * - 支持Tab切换（佣金榜单/推广人榜单）
 * - 前三名领奖台展示（金/银/铜牌）
 * - 显示用户头像、昵称、等级、排名
 * - 支持下拉刷新和上拉加载更多
 * - 突出显示自己的排名
 * 
 * 数据来源：
 * - 从后端API获取排行榜数据
 * - 当前使用模拟数据演示
 * 
 * 合规说明：
 * - 一级分销机制，符合微信平台规范
 * - 仅展示推广业绩数据
 * 
 * ================================ */

Page({
  data: {
    // Tab筛选
    rankTab: 'commission', // commission/referrer
    
    // 前三名数据
    topThree: [],
    
    // 排行榜列表（第4名及以后）
    rankList: [],
    
    // 更新时间
    updateTime: '',
    
    // 分页加载
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    console.log('股东排行榜单页面加载');
    // 可以从参数中获取初始Tab
    if (options.tab) {
      this.setData({
        rankTab: options.tab
      });
    }
    this.loadRankList();
  },

  onPullDownRefresh() {
    console.log('下拉刷新');
    this.setData({ pageNum: 1 });
    this.loadRankList(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  /* ========== 事件处理 ========== */
  
  // 切换Tab
  switchRankTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.rankTab) return;
    
    console.log('切换排行榜Tab:', tab);
    this.setData({
      rankTab: tab,
      pageNum: 1,
      rankList: []
    });
    this.loadRankList(true);
  },

  /* ========== 数据加载 ========== */
  
  // 加载排行榜数据
  loadRankList(isRefresh = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    // TODO: 从后端API获取数据
    // wx.request({
    //   url: 'https://your-api.com/rank-list',
    //   method: 'GET',
    //   data: {
    //     page: this.data.pageNum,
    //     pageSize: this.data.pageSize,
    //     type: this.data.rankTab // commission/referrer
    //   },
    //   success: (res) => {
    //     const newList = res.data.list || [];
    //     const topThree = newList.slice(0, 3);
    //     const rankList = newList.slice(3);
    //     
    //     this.setData({
    //       topThree: isRefresh ? topThree : this.data.topThree,
    //       rankList: isRefresh ? rankList : [...this.data.rankList, ...rankList],
    //       updateTime: this.formatTime(new Date()),
    //       loading: false,
    //       hasMore: newList.length >= this.data.pageSize
    //     });
    //   }
    // });
    
    // 模拟数据加载
    setTimeout(() => {
      const mockData = this.getMockData();
      const topThree = mockData.slice(0, 3);
      const rankList = mockData.slice(3);
      
      this.setData({
        topThree: topThree,  // 始终更新topThree
        rankList: isRefresh ? rankList : [...this.data.rankList, ...rankList],
        updateTime: this.formatTime(new Date()),
        loading: false,
        hasMore: false
      });
      
      if (isRefresh) {
        wx.stopPullDownRefresh();
      }
    }, 500);
  },

  // 加载更多
  loadMore() {
    this.setData({ pageNum: this.data.pageNum + 1 });
    this.loadRankList();
  },

  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 获取模拟数据
  getMockData() {
    const isCommission = this.data.rankTab === 'commission';
    
    return [
      { 
        rank: 1, 
        nickname: '孙之怡', 
        avatar: 'https://picsum.photos/id/1011/80/80',
        totalAmount: '6453.42',
        referralCount: 89,
        levelName: '钻石股东',
        isMe: false
      },
      { 
        rank: 2, 
        nickname: '刺客阿七弦...', 
        avatar: 'https://picsum.photos/id/1012/80/80',
        totalAmount: '5892.18',
        referralCount: 67,
        levelName: '金牌股东',
        isMe: false
      },
      { 
        rank: 3, 
        nickname: '小仙女', 
        avatar: 'https://picsum.photos/id/1013/80/80',
        totalAmount: '4521.65',
        referralCount: 52,
        levelName: '金牌股东',
        isMe: false
      },
      { 
        rank: 4, 
        nickname: '美甲达人', 
        avatar: 'https://picsum.photos/id/1014/80/80',
        totalAmount: '3856.23',
        referralCount: 45,
        levelName: '银牌股东',
        isMe: false
      },
      { 
        rank: 5, 
        nickname: '时尚博主', 
        avatar: 'https://picsum.photos/id/1015/80/80',
        totalAmount: '3245.89',
        referralCount: 38,
        levelName: '银牌股东',
        isMe: false
      },
      { 
        rank: 6, 
        nickname: '美丽心情', 
        avatar: 'https://picsum.photos/id/1016/80/80',
        totalAmount: '2891.45',
        referralCount: 32,
        levelName: '铜牌股东',
        isMe: true  // 标记为自己
      },
      { 
        rank: 7, 
        nickname: '优雅女士', 
        avatar: 'https://picsum.photos/id/1017/80/80',
        totalAmount: '2567.32',
        referralCount: 28,
        levelName: '铜牌股东',
        isMe: false
      },
      { 
        rank: 8, 
        nickname: '温柔姐姐', 
        avatar: 'https://picsum.photos/id/1018/80/80',
        totalAmount: '2134.56',
        referralCount: 24,
        levelName: '铜牌股东',
        isMe: false
      },
      { 
        rank: 9, 
        nickname: '可爱妹妹', 
        avatar: 'https://picsum.photos/id/1019/80/80',
        totalAmount: '1876.23',
        referralCount: 21,
        levelName: '铜牌股东',
        isMe: false
      },
      { 
        rank: 10, 
        nickname: '魅力女神', 
        avatar: 'https://picsum.photos/id/1020/80/80',
        totalAmount: '1654.89',
        referralCount: 18,
        levelName: '铜牌股东',
        isMe: false
      }
    ];
  }
});
