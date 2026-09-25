// pages/distribution/distribution.js
Page({
  data: {
    // 用户信息（从 storage 同步，与个人中心页面共享）
    userInfo: {
      nickname: '',
      avatar: '',
      memberId: '',
      level: 'bronze',
      levelName: '铜牌股东',
      levelIcon: '✓'
    },
    // 股东身份信息
    isShareholder: true, // 是否已成为股东
    shareholderStatus: 'approved', // 审核状态: pending/approved/rejected
    
    // 股东信息
    shareholderInfo: {
      shareholderId: 'SH001',
      levelName: '铜牌股东',
      levelClass: 'bronze', // bronze/silver/gold/diamond
      commissionRate: 10, // 返佣比例%
      balanceExpireDays: 90, // 储值金有效期
      nextLevel: '银牌股东',
      needAmount: 800, // 还需推广金额升级
      totalReferral: 37, // 累计推广人数
      createdAt: '2024-03-15', // 开通股东时间
      status: 'normal' // 状态: normal/frozen/closed
    },
    
    // 储值金账户
    balance: {
      available: '156.80', // 可用余额
      totalCommission: '548.26', // 累计返佣
      used: '320.00', // 已使用
      expiring: '50.00', // 即将过期（7天内）
      expireDate: '2024-06-15' // 过期日期
    },
    
    // 阶梯等级配置（根据文档）
    levelConfig: [
      { name: '铜牌股东', level: 'bronze', condition: '默认等级', rate: 10, benefits: '基础分润' },
      { name: '银牌股东', level: 'silver', condition: '月推广满1000元', rate: 12, benefits: '每月1次免费手护' },
      { name: '金牌股东', level: 'gold', condition: '月推广满3000元', rate: 15, benefits: '季度专属新款优先体验' },
      { name: '钻石股东', level: 'diamond', condition: '月推广满5000元', rate: 18, benefits: '所有项目8折+专属客服' }
    ],
    
    // 推广业绩 - tab切换
    incomeTab: 'today',
    performanceData: {
      newCustomers: 5, // 新增客户
      totalCustomers: 37, // 累计推广
      orders: 23, // 推广订单
      orderAmount: '2399.99', // 消费总额
      commissionCount: 18, // 获得返佣笔数
      commissionAmount: '239.99' // 返佣总额
    },
    
    // 推广明细列表（新客消费记录）
    referralDetailList: [
      {
        orderId: 'ORD20240508001',
        customerName: '王*姐',
        orderAmount: 198.00,
        commissionAmount: 19.80,
        commissionRate: 10,
        serviceName: '纯色美甲',
        orderTime: '2024-05-08 14:30',
        status: 'completed'
      },
      {
        orderId: 'ORD20240507002',
        customerName: '李*妹',
        orderAmount: 368.00,
        commissionAmount: 36.80,
        commissionRate: 10,
        serviceName: '光疗延长甲',
        orderTime: '2024-05-07 10:15',
        status: 'completed'
      },
      {
        orderId: 'ORD20240506003',
        customerName: '张*子',
        orderAmount: 128.00,
        commissionAmount: 12.80,
        commissionRate: 10,
        serviceName: '基础护理',
        orderTime: '2024-05-06 16:45',
        status: 'completed'
      }
    ],
    
    // 储值金流水记录
    balanceLogList: [
      {
        id: 1,
        type: 'income', // income/consume/expired/adjust
        typeName: '推广返佣入账',
        amount: '+19.80',
        balanceAfter: 156.80,
        source: '佣金',
        remark: '王*姐消费198元',
        time: '2024-05-08 14:35'
      },
      {
        id: 2,
        type: 'consume',
        typeName: '消费抵扣',
        amount: '-50.00',
        balanceAfter: 137.00,
        source: '消费',
        remark: '纯色美甲服务',
        time: '2024-05-05 11:20'
      },
      {
        id: 3,
        type: 'income',
        typeName: '推广返佣入账',
        amount: '+36.80',
        balanceAfter: 187.00,
        source: '佣金',
        remark: '李*妹消费368元',
        time: '2024-05-07 10:20'
      }
    ],
    
    // 股东排行榜
    rankTab: 'commission', // 当前选中的Tab：commission/referrer
    rankList: [
      { 
        rank: 1, 
        nickname: '孙之怡', 
        avatar: 'https://picsum.photos/id/1011/80/80',
        totalAmount: '6453.42',
        referralCount: 89 
      },
      { 
        rank: 2, 
        nickname: '刺客阿七弦...', 
        avatar: 'https://picsum.photos/id/1012/80/80',
        totalAmount: '6453.42',
        referralCount: 67 
      },
      { 
        rank: 3, 
        nickname: '孙之怡', 
        avatar: 'https://picsum.photos/id/1013/80/80',
        totalAmount: '6453.42',
        referralCount: 56 
      },
      { 
        rank: 4, 
        nickname: '美甲控', 
        avatar: 'https://picsum.photos/id/1014/80/80',
        totalAmount: '4890.00',
        referralCount: 45 
      },
      { 
        rank: 5, 
        nickname: '一只小蘑菇', 
        avatar: 'https://picsum.photos/id/1005/80/80',
        totalAmount: '3856.80',
        referralCount: 37,
        isMe: true 
      }
    ],
    
    // 绑定提示
    bindTip: {
      show: false,
      referrerName: '',
      referrerAvatar: ''
    },
    
    // 数据中心 - tab切换
    statsTab: 'month',
    statsData: {
      scanCount: 156, // 扫码次数
      bindCount: 37, // 绑定人数
      conversionRate: 23.7, // 转化率
      avgOrderAmount: '104.35', // 客单价
      repurchaseRate: 45.2, // 复购率
      totalRevenue: '3856.80' // 总营收
    },
    
    // 推广码弹窗
    showPromotionModal: false,
    promotionCode: {
      qrCodeUrl: '', // 二维码图片URL
      promotionLink: '', // 推广链接
      promotionCode: 'PROMO20240508' // 推广码
    },
    
    // 店铺信息
    shopInfo: {
      shopName: '河狸家', // 店铺名称
      activityName: '共享股东计划', // 活动名称
      slogan: '分享创造价值，推荐赚取佣金', // 宣传标语
      logoUrl: 'https://picsum.photos/id/1005/80/80' // 店铺Logo
    },

    // 推广码弹窗步骤指引
    promotionSteps: [
      { icon: 'download', text: '1.保存推广码' },
      { icon: 'share', text: '2.分享给好友' },
      { icon: 'scan', text: '3.好友扫码绑定' }
    ],

    // ===== 欢迎弹窗相关数据 =====
    showWelcomeModal: false,
    welcomeIllustrationSrc: ''
  },

  /* ========== 生命周期 ========== */
  onLoad(options) {
    this.initData();
    
    // 处理扫码进入的绑定关系
    if (options.pid) {
      this.handleShareholderBinding(options.pid);
    }
    
    // 检查是否有绑定提示
    this.checkBindTip();

    // 检查首次进入，显示欢迎弹窗
    this.checkFirstVisitWelcome();
  },

  onShow() {
    this.refreshData();
  },

  /* ========== 数据初始化 ========== */
  initData() {
    // 同步用户基本信息（与个人中心页面共享同一份 storage 数据）
    this.syncUserInfo();

    // 从本地存储加载分销特有数据
    const savedData = wx.getStorageSync('distribution_data');
    if (savedData) {
      this.setData(savedData);
    }
  },

  refreshData() {
    // 每次显示时同步最新的用户信息
    this.syncUserInfo();
    console.log('刷新股东数据');
  },

  /**
   * 从 storage 同步用户信息
   * 与 pages/mine 共享同一份 userInfo 数据源，确保名称和头像一致
   */
  syncUserInfo() {
    const storedUser = wx.getStorageSync('userInfo');
    if (!storedUser) return;

    const nickname = storedUser.nickname || this.data.userInfo.nickname;
    const avatar = storedUser.avatar || this.data.userInfo.avatar;
    const memberId = storedUser._id || storedUser.userId || this.data.userInfo.memberId;

    this.setData({
      'userInfo.nickname': nickname,
      'userInfo.avatar': avatar,
      'userInfo.memberId': memberId,
      'userInfo.level': storedUser.level || 'bronze',
      'userInfo.levelName': storedUser.levelName || '铜牌股东',
      'userInfo.levelIcon': storedUser.levelIcon || '✓',
      // 用真实用户ID生成股东ID（模拟）
      'shareholderInfo.shareholderId': 'SH' + String(memberId).slice(-6).toUpperCase()
    });
  },
  
  /* ========== 绑定关系处理 ========== */
  // 处理股东绑定（新客扫码）
  handleShareholderBinding(shareholderId) {
    console.log('处理股东绑定:', shareholderId);
    
    // 检查是否已是股东
    if (this.data.isShareholder) {
      console.log('当前用户已是股东，跳过绑定');
      return;
    }
    
    // 检查是否已有绑定关系
    const existBind = wx.getStorageSync('referral_bind');
    if (existBind && existBind.shareholder_id) {
      console.log('已绑定股东，不覆盖:', existBind.shareholder_id);
      return;
    }
    
    // 执行绑定（TODO: 调用后端API）
    wx.setStorageSync('referral_bind', {
      shareholder_id: shareholderId,
      bind_time: new Date().toISOString(),
      bind_source: 'qrcode'
    });
    
    console.log('绑定股东成功:', shareholderId);
    wx.showToast({
      title: '绑定成功',
      icon: 'success'
    });
  },
  
  // 检查绑定提示
  checkBindTip() {
    const bindInfo = wx.getStorageSync('referral_bind');
    if (bindInfo && bindInfo.shareholder_id) {
      // TODO: 从后端获取推荐人信息
      this.setData({
        bindTip: {
          show: true,
          referrerName: '小王',
          referrerAvatar: 'https://picsum.photos/id/1005/50/50'
        }
      });
    }
  },

  /* ========== Tab切换 ========== */
  // 推广业绩tab切换
  switchIncomeTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      incomeTab: tab
    });
    
    // 根据tab加载不同数据
    this.loadPerformanceData(tab);
  },

  // 数据中心tab切换
  switchStatsTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      statsTab: tab
    });
    
    // 根据tab加载不同数据
    this.loadStatsData(tab);
  },

  /* ========== 数据加载 ========== */
  loadPerformanceData(tab) {
    console.log('加载推广业绩数据:', tab);
    // TODO: 根据tab从后端获取不同时间段的推广业绩数据
    // 模拟数据变化
    const mockData = {
      today: { newCustomers: 2, totalCustomers: 37, orders: 8, orderAmount: '856.00', commissionCount: 6, commissionAmount: '85.60' },
      yesterday: { newCustomers: 3, totalCustomers: 37, orders: 12, orderAmount: '1245.50', commissionCount: 9, commissionAmount: '124.55' },
      week: { newCustomers: 15, totalCustomers: 37, orders: 45, orderAmount: '4567.80', commissionCount: 32, commissionAmount: '456.78' },
      month: { newCustomers: 37, totalCustomers: 37, orders: 89, orderAmount: '8956.50', commissionCount: 67, commissionAmount: '895.65' }
    };
    this.setData({ performanceData: mockData[tab] || mockData.today });
  },

  loadStatsData(tab) {
    console.log('加载数据中心:', tab);
    // TODO: 根据tab从后端获取不同时间段的数据统计
    // 模拟数据变化
    const mockData = {
      today: { scanCount: 28, bindCount: 5, conversionRate: 17.9, avgOrderAmount: '107.00', repurchaseRate: 40.0, totalRevenue: '535.00' },
      yesterday: { scanCount: 45, bindCount: 8, conversionRate: 17.8, avgOrderAmount: '103.79', repurchaseRate: 42.5, totalRevenue: '830.33' },
      week: { scanCount: 234, bindCount: 28, conversionRate: 12.0, avgOrderAmount: '101.51', repurchaseRate: 38.6, totalRevenue: '2842.28' },
      month: { scanCount: 856, bindCount: 89, conversionRate: 10.4, avgOrderAmount: '100.63', repurchaseRate: 45.2, totalRevenue: '8956.50' }
    };
    this.setData({ statsData: mockData[tab] || mockData.month });
  },

  /* ========== 事件处理 ========== */
  // 显示推广明细
  showReferralDetail(e) {
    const type = e.currentTarget.dataset.type;
    console.log('查看推广明细:', type);
    
    // 跳转到推广明细页面或显示弹窗
    wx.showModal({
      title: '推广明细',
      content: `共有 ${this.data.performanceData.newCustomers} 位新增客户，累计返佣 ¥${this.data.performanceData.commissionAmount}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },
  
  // 查看推广明细列表
  viewReferralList() {
    console.log('查看推广明细列表');
    
    // 跳转到推广业绩榜单页面
    wx.navigateTo({
      url: '/pages/distribution/referral-list/referral-list'
    });
  },
  
  // 查看储值金流水
  viewBalanceLog() {
    console.log('查看储值金流水');
    
    // 跳转到储值金流水页面
    wx.navigateTo({
      url: '/pages/distribution/balance-log/balance-log'
    });
  },
  
  // 查看股东排行榜
  viewRankList() {
    console.log('查看股东排行榜');
    
    // 跳转到完整榜单页面，并传递当前Tab
    wx.navigateTo({
      url: `/pages/distribution/rank-list/rank-list?tab=${this.data.rankTab}`
    });
  },
  
  // 切换排行榜Tab
  switchRankTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.rankTab) return;
    
    console.log('切换排行榜Tab:', tab);
    this.setData({
      rankTab: tab
    });
    
    // TODO: 根据Tab加载不同的排行榜数据
    // if (tab === 'commission') {
    //   // 加载佣金榜单
    // } else if (tab === 'referrer') {
    //   // 加载推广人榜单
    // }
  },
  
  // 显示股东等级说明
  showLevelInfo() {
    wx.showModal({
      title: '股东等级说明',
      content: '铜牌股东：默认等级，10%返佣\n银牌股东：月推广满1000元，12%返佣\n金牌股东：月推广满3000元，15%返佣\n钻石股东：月推广满5000元，18%返佣',
      showCancel: false,
      confirmText: '知道了'
    });
  },
  
  // 申请成为股东
  applyShareholder() {
    console.log('申请成为股东');
    wx.showModal({
      title: '申请共享股东',
      content: '成为共享股东后，分享专属推广码即可获得10%返佣储值金。\n\n申请条件：\n1. 累计消费≥3次或消费金额≥500元\n2. 或充值满1000元自动升级',
      confirmText: '立即申请',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用后端API提交申请
          wx.showToast({
            title: '申请已提交',
            icon: 'success'
          });
          this.setData({
            shareholderStatus: 'pending'
          });
        }
      }
    });
  },

  // 显示储值金规则
  showBalanceRule() {
    wx.showModal({
      title: '储值金规则说明',
      content: '1. 储值金通过推广返佣获得\n2. 仅限本店消费抵扣，不可提现\n3. 有效期90天，到期前7天提醒\n4. 可与优惠券叠加使用',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 去消费（直接跳转到首页）
  goConsume() {
    console.log('跳转到首页去消费');
    wx.switchTab({
      url: '/pages/index/index',
      fail: (err) => {
        console.error('跳转首页失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 申请提现
  openWithdrawSheet() {
    console.log('申请提现');
    // 根据文档，储值金不可提现，仅限本店消费抵扣
    wx.showModal({
      title: '提示',
      content: '储值金仅限本店消费抵扣，不可提现\n\n您可以：\n1. 预约服务时自动抵扣\n2. 购买产品时使用储值金',
      confirmText: '去消费',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          // 跳转到预约页面
          wx.switchTab({
            url: '/pages/index/index',
            fail: () => {
              wx.navigateTo({
                url: '/pages/index/index'
              });
            }
          });
        }
      }
    });
  },

  // 跳转到推广码页面（改为显示弹窗）
  goToPromotionCode() {
    console.log('显示推广码弹窗');
    
    // 生成推广码数据（TODO: 从后端API获取）
    const promotionData = {
      qrCodeUrl: this.generateQRCode(),
      promotionLink: `https://example.com/invite?code=${this.data.userInfo.memberId}`,
      promotionCode: `PROMO${this.data.userInfo.memberId}`
    };
    
    this.setData({
      showPromotionModal: true,
      promotionCode: promotionData
    });
    
    // 禁止背景页面滚动
    this.disablePageScroll();
  },
  
  // 关闭推广码弹窗
  closePromotionModal() {
    this.setData({
      showPromotionModal: false
    });
    
    // 恢复背景页面滚动
    this.enablePageScroll();
  },
  
  // 禁止页面滚动
  disablePageScroll() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage) {
      // 设置页面的滚动状态
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      });
      
      // 通过修改 page 的样式来禁止滚动
      currentPage.setData({
        pageStyle: 'overflow: hidden; height: 100vh;'
      });
    }
  },
  
  // 恢复页面滚动
  enablePageScroll() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage) {
      // 恢复页面的滚动状态
      currentPage.setData({
        pageStyle: ''
      });
    }
  },
  
  // 保存推广码到相册
  savePromotionCode() {
    const qrCodeUrl = this.data.promotionCode.qrCodeUrl;
    
    wx.downloadFile({
      url: qrCodeUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '保存成功',
                icon: 'success'
              });
            },
            fail: () => {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 分享给微信好友
  shareToWechat() {
    console.log('分享给微信好友');
    
    // 使用微信分享API
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none'
    });
  },
  
  // 分享到朋友圈
  shareToMoments() {
    console.log('分享到朋友圈');
    
    // 使用微信朋友圈分享API
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareTimeline']
    });
    
    wx.showToast({
      title: '请点击右上角分享到朋友圈',
      icon: 'none'
    });
  },
  
  // 复制推广链接
  copyPromotionLink() {
    const link = this.data.promotionCode.promotionLink;
    
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 生成二维码（模拟）
  generateQRCode() {
    // TODO: 调用后端API生成二维码或调用微信API生成小程序码
    // 这里使用模拟的二维码图片
    return 'https://picsum.photos/id/1005/400/400';
  },

  /* ========== 业务方法 ========== */
  // 计算储值金抵扣
  calcBalanceDeduction(orderAmount) {
    const balance = parseFloat(this.data.balance.available);
    if (balance <= 0) {
      return {
        totalAmount: orderAmount,
        balanceUsed: 0,
        needPay: orderAmount
      };
    }
    
    // 储值金足够 → 全额抵扣
    if (balance >= orderAmount) {
      return {
        totalAmount: orderAmount,
        balanceUsed: orderAmount,
        needPay: 0
      };
    }
    
    // 储值金不足 → 部分抵扣 + 剩余微信支付
    return {
      totalAmount: orderAmount,
      balanceUsed: balance,
      needPay: orderAmount - balance
    };
  },
  
  // 计算返佣金额
  calcCommission(orderAmount, commissionRate) {
    return (orderAmount * commissionRate / 100).toFixed(2);
  },
  
  // 股东等级计算
  calcShareholderLevel(monthlyAmount) {
    if (monthlyAmount >= 5000) {
      return { name: '钻石股东', level: 'diamond', rate: 18 };
    } else if (monthlyAmount >= 3000) {
      return { name: '金牌股东', level: 'gold', rate: 15 };
    } else if (monthlyAmount >= 1000) {
      return { name: '银牌股东', level: 'silver', rate: 12 };
    }
    return { name: '铜牌股东', level: 'bronze', rate: 10 };
  },
  
  /* ========== 数据获取 ========== */
  // 从后端获取股东数据
  fetchShareholderData() {
    // TODO: 调用后端API获取股东数据
    console.log('获取股东数据');
    // wx.request({
    //   url: '/api/shareholder/dashboard',
    //   success: (res) => {
    //     this.setData(res.data);
    //   }
    // });
  },
  
  // 获取推广明细
  fetchReferralList(page = 1) {
    // TODO: 调用后端API获取推广明细
    console.log('获取推广明细:', page);
  },
  
  // 获取储值金流水
  fetchBalanceLog(page = 1) {
    // TODO: 调用后端API获取储值金流水
    console.log('获取储值金流水:', page);
  },
  
  // 获取股东排行榜
  fetchRankList() {
    // TODO: 调用后端API获取股东排行榜
    console.log('获取股东排行榜');
  },
  onShareAppMessage() {
    return {
      title: '河狸家共享股东 - 推荐好友赚储值金',
      path: '/pages/distribution/distribution',
      imageUrl: ''
    };
  },
  
  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '河狸家共享股东 - 推荐好友赚储值金',
      imageUrl: ''
    };
  },

  // ===== 欢迎弹窗相关方法 =====
  
  /**
   * 检查是否首次访问，决定是否显示欢迎弹窗
   */
  checkFirstVisitWelcome() {
    const hasShown = wx.getStorageSync('welcome_modal_shown');
    if (!hasShown) {
      // 生成插画图片源
      this.generateWelcomeIllustration();
      // 显示弹窗
      this.setData({ showWelcomeModal: true });
      // 标记已显示
      wx.setStorageSync('welcome_modal_shown', true);
    }
  },

  /**
   * 生成插画 SVG 的 Base64 编码图片源
   */
  generateWelcomeIllustration() {
    const svgContent = `<svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="80" height="60" rx="4" fill="#FFE066" opacity="0.6"/>
      <rect x="30" y="40" width="60" height="40" rx="2" fill="#FFF" opacity="0.8"/>
      <path d="M50 50 L70 50 L60 70 Z" fill="#333" opacity="0.1"/>
      <rect x="180" y="20" width="50" height="70" rx="3" fill="#FFE066" opacity="0.5"/>
      <rect x="20" y="130" width="240" height="8" rx="4" fill="#E8E0F0"/>
      <rect x="40" y="138" width="6" height="20" rx="3" fill="#D8D0E8"/>
      <rect x="230" y="138" width="6" height="20" rx="3" fill="#D8D0E8"/>
      <rect x="95" y="105" width="90" height="55" rx="4" fill="#FFF" stroke="#333" stroke-width="1.5"/>
      <rect x="100" y="110" width="80" height="45" rx="2" fill="#F5F5F5"/>
      <rect x="105" y="115" width="30" height="20" rx="2" fill="#E0E0E0"/>
      <circle cx="145" cy="125" r="6" fill="#FFE066"/>
      <path d="M142 125 L148 125 M145 122 L145 128" stroke="#FFF" stroke-width="1.5"/>
      <rect x="105" y="140" width="50" height="3" rx="1.5" fill="#DDD"/>
      <rect x="105" y="146" width="35" height="3" rx="1.5" fill="#DDD"/>
      <rect x="85" y="158" width="110" height="6" rx="3" fill="#FFF" stroke="#333" stroke-width="1.2"/>
      <rect x="200" y="118" width="14" height="18" rx="2" fill="#FFF" stroke="#333" stroke-width="1.2"/>
      <path d="M214 124 Q220 124 220 128 Q220 132 214 132" stroke="#333" stroke-width="1.2" fill="none"/>
      <rect x="202" y="114" width="10" height="4" rx="2" fill="#E8E0F0"/>
      <rect x="215" y="95" width="30" height="40" rx="3" fill="#FFF" stroke="#333" stroke-width="1.2" transform="rotate(8 230 115)"/>
      <line x1="222" y1="105" x2="238" y2="105" stroke="#333" stroke-width="1" transform="rotate(8 230 115)"/>
      <line x1="222" y1="112" x2="238" y2="112" stroke="#333" stroke-width="1" transform="rotate(8 230 115)"/>
      <line x1="222" y1="119" x2="232" y2="119" stroke="#333" stroke-width="1" transform="rotate(8 230 115)"/>
      <path d="M130 85 Q130 70 145 70 Q160 70 160 85 L165 105 L125 105 Z" fill="#7B68EE"/>
      <rect x="142" y="65" width="6" height="8" fill="#FFDAB9"/>
      <circle cx="145" cy="55" r="14" fill="#FFDAB9"/>
      <path d="M131 50 Q135 35 150 38 Q162 42 158 55 Q158 48 145 48 Q135 48 131 50" fill="#1A1A1A"/>
      <circle cx="152" cy="42" r="5" fill="#1A1A1A"/>
      <circle cx="141" cy="54" r="1.5" fill="#333"/>
      <circle cx="149" cy="54" r="1.5" fill="#333"/>
      <path d="M135 80 Q120 90 110 100" stroke="#7B68EE" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M155 80 Q170 90 180 95" stroke="#7B68EE" stroke-width="8" stroke-linecap="round" fill="none"/>
      <circle cx="108" cy="102" r="4" fill="#FFDAB9"/>
      <circle cx="182" cy="97" r="4" fill="#FFDAB9"/>
      <path d="M60 130 L60 90 Q60 70 80 60" stroke="#333" stroke-width="2" fill="none"/>
      <path d="M75 55 L95 65 L85 75 Z" fill="#FFE066" stroke="#333" stroke-width="1.2"/>
      <ellipse cx="85" cy="70" rx="15" ry="20" fill="#FFE066" opacity="0.3"/>
      <rect x="50" y="85" width="8" height="8" rx="2" fill="#FFE066" transform="rotate(15 54 89)"/>
      <circle cx="170" cy="40" r="4" fill="#7B68EE" opacity="0.6"/>
      <path d="M190 80 L195 85 L190 90 L185 85 Z" fill="#FFE066"/>
      <circle cx="70" cy="115" r="3" fill="#7B68EE" opacity="0.4"/>
      <path d="M45 45 L47 50 L52 50 L48 54 L50 59 L45 56 L40 59 L42 54 L38 50 L43 50 Z" fill="#FFE066"/>
      <path d="M240 50 L241 53 L244 53 L242 55 L243 58 L240 56 L237 58 L238 55 L236 53 L239 53 Z" fill="#FFE066" opacity="0.7"/>
    </svg>`;

    // Base64 编码
    const base64 = wx.arrayBufferToBase64(this.stringToArrayBuffer(svgContent));
    this.setData({
      welcomeIllustrationSrc: 'data:image/svg+xml;base64,' + base64
    });
  },

  /**
   * 字符串转 ArrayBuffer（用于 Base64）
   */
  stringToArrayBuffer(str) {
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i);
    }
    return buffer;
  },

  /**
   * 关闭欢迎弹窗
   */
  closeWelcomeModal() {
    this.setData({ showWelcomeModal: false });
  },

  /**
   * 点击“立即出发”按钮
   */
  onWelcomeCtaTap() {
    this.closeWelcomeModal();
    // 可在此添加跳转逻辑，例如跳转到首页
    // wx.switchTab({ url: '/pages/index/index' });
  },

  /**
   * 阻止事件冒泡（复用已有的方法名或新建）
   * 为了不影响其他逻辑，这里在欢迎弹窗内使用 stopPropagation
   */
  stopPropagation() {
    // 空函数，仅用于阻止冒泡
  }
});