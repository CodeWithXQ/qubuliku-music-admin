// pages/distribution/referral-list/referral-list.js
/* ========== 推广业绩榜单页面功能说明 ==========
 * 
 * 功能概述：
 * - 展示推广业绩完整榜单（推广明细列表）
 * - 支持按时间筛选（今日/本周/本月/全部）
 * - 显示客户消费记录和返佣详情
 * - 支持下拉刷新和上拉加载更多
 * - 客户信息脱敏处理（保护隐私）
 * 
 * 数据来源：
 * - 从后端API获取推广订单列表
 * - 当前使用模拟数据演示
 * 
 * 合规说明：
 * - 一级分销机制，符合微信平台规范
 * - 客户名称脱敏（如：王*姐）
 * - 仅展示本人推广的订单
 * 
 * ================================ */

Page({
  data: {
    // Tab筛选
    currentTab: 'all', // all/today/week/month
    tabs: [
      { key: 'all', name: '全部' },
      { key: 'today', name: '今日' },
      { key: 'week', name: '本周' },
      { key: 'month', name: '本月' }
    ],
    
    // 统计数据
    stats: {
      newCustomers: 5,        // 新增客户数
      totalOrders: 23,        // 推广订单数
      orderAmount: '2399.99', // 消费总额
      commissionAmount: '239.99' // 返佣总额
    },
    
    // 原始完整数据（用于筛选）
    allReferralList: [
      {
        id: 1,
        orderId: 'ORD20240508001',
        customerName: '王*姐',
        customerAvatar: 'https://picsum.photos/id/1011/80/80',
        orderAmount: 198.00,
        commissionAmount: 19.80,
        commissionRate: 10,
        serviceName: '纯色美甲',
        serviceImage: 'https://picsum.photos/id/1060/120/120',
        orderTime: '2024-05-08 14:30',
        status: 'completed', // completed/pending/refunded
        statusText: '已完成'
      },
      {
        id: 2,
        orderId: 'ORD20240507002',
        customerName: '李*妹',
        customerAvatar: 'https://picsum.photos/id/1012/80/80',
        orderAmount: 368.00,
        commissionAmount: 36.80,
        commissionRate: 10,
        serviceName: '光疗延长甲',
        serviceImage: 'https://picsum.photos/id/1061/120/120',
        orderTime: '2024-05-07 10:15',
        status: 'completed',
        statusText: '已完成'
      },
      {
        id: 3,
        orderId: 'ORD20240506003',
        customerName: '张*子',
        customerAvatar: 'https://picsum.photos/id/1013/80/80',
        orderAmount: 128.00,
        commissionAmount: 12.80,
        commissionRate: 10,
        serviceName: '基础护理',
        serviceImage: 'https://picsum.photos/id/1062/120/120',
        orderTime: '2024-05-06 16:45',
        status: 'completed',
        statusText: '已完成'
      },
      {
        id: 4,
        orderId: 'ORD20240505004',
        customerName: '赵*丽',
        customerAvatar: 'https://picsum.photos/id/1014/80/80',
        orderAmount: 288.00,
        commissionAmount: 28.80,
        commissionRate: 10,
        serviceName: '法式美甲',
        serviceImage: 'https://picsum.photos/id/1063/120/120',
        orderTime: '2024-05-05 11:20',
        status: 'completed',
        statusText: '已完成'
      },
      {
        id: 5,
        orderId: 'ORD20240504005',
        customerName: '陈*婷',
        customerAvatar: 'https://picsum.photos/id/1015/80/80',
        orderAmount: 458.00,
        commissionAmount: 45.80,
        commissionRate: 10,
        serviceName: '日式渐变美甲',
        serviceImage: 'https://picsum.photos/id/1064/120/120',
        orderTime: '2024-05-04 15:30',
        status: 'pending',
        statusText: '待结算'
      },
      {
        id: 6,
        orderId: 'ORD20240503006',
        customerName: '刘*芳',
        customerAvatar: 'https://picsum.photos/id/1016/80/80',
        orderAmount: 168.00,
        commissionAmount: 16.80,
        commissionRate: 10,
        serviceName: '手部护理',
        serviceImage: 'https://picsum.photos/id/1065/120/120',
        orderTime: '2024-05-03 09:45',
        status: 'refunded',
        statusText: '已退款'
      }
    ],
    
    // 当前显示的推广明细列表（筛选后的）
    referralList: [],
    
    // 分页加载
    pageNum: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    console.log('推广业绩榜单页面加载');
    // 初始化显示列表
    this.setData({
      referralList: this.filterReferralList()
    });
  },

  onPullDownRefresh() {
    console.log('下拉刷新');
    this.setData({ pageNum: 1 });
    // 重新筛选数据
    const filteredList = this.filterReferralList();
    this.setData({
      referralList: filteredList,
      loading: false
    });
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  /* ========== 事件处理 ========== */
  
  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;
    
    console.log('切换Tab:', tab);
    this.setData({
      currentTab: tab,
      pageNum: 1
    });
    
    // 根据新的Tab筛选数据
    const filteredList = this.filterReferralList();
    this.setData({
      referralList: filteredList,
      hasMore: false
    });
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.orderId;
    console.log('查看订单详情:', orderId);
    
    wx.navigateTo({
      url: `/pages/orderDetail/order-detail?orderId=${orderId}`
    });
  },

  // 查看客户详情
  viewCustomerDetail(e) {
    const customerId = e.currentTarget.dataset.customerId;
    console.log('查看客户详情:', customerId);
    
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /* ========== 数据加载 ========== */
  
  // 加载更多（预留接口，当前模拟数据不分页）
  loadMore() {
    // TODO: 实现分页加载逻辑
    wx.showToast({
      title: '没有更多数据',
      icon: 'none'
    });
  },

  // 根据Tab筛选数据
  filterReferralList() {
    const now = new Date();
    const list = this.data.allReferralList; // 从原始完整数据中筛选
    
    if (this.data.currentTab === 'all') {
      return list;
    }
    
    return list.filter(item => {
      const orderDate = new Date(item.orderTime);
      const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
      
      switch (this.data.currentTab) {
        case 'today':
          return diffDays < 1;
        case 'week':
          return diffDays < 7;
        case 'month':
          return diffDays < 30;
        default:
          return true;
      }
    });
  }
});
