// pages/distribution/balance-log/balance-log.js
/* ========== 储值明细页面功能说明 ==========
 * 
 * 功能概述：
 * - 展示储值金的完整流水记录
 * - 支持按类型筛选（全部/入账/消费/过期）
 * - 时间线样式展示，清晰直观
 * - 支持下拉刷新和上拉加载更多
 * 
 * 数据来源：
 * - 从后端API获取储值金流水记录
 * - 当前使用模拟数据演示
 * 
 * 合规说明：
 * - 储值金不可提现，仅限本店消费抵扣
 * - 90天有效期，过期自动清零
 * - 所有变动记录可追溯
 * 
 * ================================ */

Page({
  data: {
    // 储值金账户信息
    balanceInfo: {
      available: '156.80',
      totalCommission: '548.26',
      used: '320.00'
    },
    
    // Tab筛选
    currentTab: 'all', // all/income/consume/expired
    tabs: [
      { key: 'all', name: '全部' },
      { key: 'income', name: '入账' },
      { key: 'consume', name: '消费' },
      { key: 'expired', name: '过期' }
    ],
        
    // 原始完整流水记录（用于筛选）
    allLogList: [
      {
        id: 1,
        type: 'income',
        typeName: '推广返佣入账',
        amount: '+19.80',
        balanceAfter: 156.80,
        source: '佣金',
        remark: '王*姐消费198元',
        time: '2024-05-08 14:35',
        icon: '↗'
      },
      {
        id: 2,
        type: 'consume',
        typeName: '消费抵扣',
        amount: '-50.00',
        balanceAfter: 137.00,
        source: '消费',
        remark: '纯色美甲服务',
        time: '2024-05-05 11:20',
        icon: '↘'
      },
      {
        id: 3,
        type: 'income',
        typeName: '推广返佣入账',
        amount: '+36.80',
        balanceAfter: 187.00,
        source: '佣金',
        remark: '李*妹消费368元',
        time: '2024-05-07 10:20',
        icon: '↗'
      },
      {
        id: 4,
        type: 'expired',
        typeName: '储值金过期',
        amount: '-20.00',
        balanceAfter: 167.00,
        source: '过期',
        remark: '90天未使用自动清零',
        time: '2024-05-01 00:00',
        icon: '⏰'
      },
      {
        id: 5,
        type: 'income',
        typeName: '推广返佣入账',
        amount: '+28.80',
        balanceAfter: 187.00,
        source: '佣金',
        remark: '赵*丽消费288元',
        time: '2024-04-28 16:45',
        icon: '↗'
      },
      {
        id: 6,
        type: 'consume',
        typeName: '消费抵扣',
        amount: '-80.00',
        balanceAfter: 158.20,
        source: '消费',
        remark: '光疗延长甲服务',
        time: '2024-04-25 14:30',
        icon: '↘'
      }
    ],
        
    // 当前显示的流水记录列表（筛选后的）
    logList: [],
    
    // 分页相关
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    console.log('储值明细页面加载');
    // 首次加载需要传入true，确保从allLogList中筛选数据
    this.loadBalanceLogList(true);
  },

  // 加载储值金流水列表
  loadBalanceLogList(isRefresh = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    // TODO: 从后端API获取数据
    // wx.request({
    //   url: 'https://your-api.com/balance-log',
    //   method: 'GET',
    //   data: {
    //     page: this.data.pageNum,
    //     pageSize: this.data.pageSize,
    //     type: this.data.currentTab
    //   },
    //   success: (res) => {
    //     const newList = res.data.list || [];
    //     this.setData({
    //       logList: isRefresh ? newList : [...this.data.logList, ...newList],
    //       loading: false,
    //       hasMore: newList.length >= this.data.pageSize
    //     });
    //   }
    // });
    
    // 模拟数据加载
    setTimeout(() => {
      const filteredList = this.filterLogList();
      
      this.setData({
        logList: filteredList,  // 始终使用筛选后的数据
        loading: false,
        hasMore: false // 模拟数据已全部加载
      });
    }, 500);
  },

  // 根据Tab筛选列表
  filterLogList() {
    const { currentTab, allLogList } = this.data;
    
    if (currentTab === 'all') {
      return allLogList;
    }
    
    return allLogList.filter(item => item.type === currentTab);
  },

  // Tab切换
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab,
      pageNum: 1
    });
    
    this.loadBalanceLogList(true);
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ pageNum: 1 });
    this.loadBalanceLogList(true);
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore) return;
    
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    
    this.loadBalanceLogList();
  }
});
