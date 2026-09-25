// pages/distribution/promotion-code/promotion-code.js
Page({
  data: {
    // 用户推广信息
    promotionCode: {
      userId: 'DL20260001',
      userName: '一只小蘑菇'
    },
    // 小程序码图片URL
    qrcodeImageUrl: '',
    // 分享链接
    shareLink: '',
    // 推广数据统计
    promoStats: {
      scanCount: 156,
      bindCount: 37,
      orderCount: 23
    }
  },

  /* ========== 生命周期 ========== */
  onLoad(options) {
    this.initPromotionCode();
  },

  onShow() {
    this.refreshPromoStats();
  },

  /* ========== 初始化推广码 ========== */
  initPromotionCode() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.userId) {
      this.setData({
        'promotionCode.userId': 'DL' + userInfo.userId,
        'promotionCode.userName': userInfo.nickname || '用户'
      });
    }

    // 生成分享链接
    this.generateShareLink();

    // 生成小程序码
    this.generateQRCode();
  },

  /* ========== 生成分享链接 ========== */
  generateShareLink() {
    const userId = this.data.promotionCode.userId;
    // 构建带参数的分享链接
    const shareLink = `https://yourdomain.com/distribution?ref=${userId}`;
    this.setData({
      shareLink: shareLink
    });
  },

  /* ========== 生成小程序码 ========== */
  generateQRCode() {
    // 实际项目中应该调用后端API生成小程序码
    // 这里使用canvas绘制模拟二维码
    
    const userId = this.data.promotionCode.userId;
    const page = `pages/index/index?ref=${userId}`;
    
    // 调用后端API生成小程序码
    // wx.cloud.callFunction({
    //   name: 'generateQRCode',
    //   data: {
    //     page: page,
    //     width: 430
    //   }
    // }).then(res => {
    //   this.setData({
    //     qrcodeImageUrl: res.result.imageUrl
    //   });
    // });

    // 模拟生成过程
    setTimeout(() => {
      // 这里使用占位图，实际项目中应替换为真实的小程序码
      this.setData({
        qrcodeImageUrl: 'https://picsum.photos/400/400'
      });
    }, 500);
  },

  /* ========== 刷新推广数据 ========== */
  refreshPromoStats() {
    // 从本地存储或服务器获取最新数据
    const savedStats = wx.getStorageSync('promoStats');
    if (savedStats) {
      this.setData({
        promoStats: savedStats
      });
    }
  },

  /* ========== 复制分享链接 ========== */
  copyShareLink() {
    const link = this.data.shareLink;
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success',
          duration: 2000
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

  /* ========== 分享给微信好友 ========== */
  shareToWechat() {
    // 使用微信小程序的分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });

    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none',
      duration: 2000
    });
  },

  /* ========== 分享到朋友圈 ========== */
  shareToMoments() {
    // 使用微信小程序的朋友圈分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareTimeline']
    });

    wx.showToast({
      title: '请点击右上角分享到朋友圈',
      icon: 'none',
      duration: 2000
    });
  },

  /* ========== 保存到相册 ========== */
  saveToAlbum() {
    if (!this.data.qrcodeImageUrl) {
      wx.showToast({
        title: '推广码生成中',
        icon: 'none'
      });
      return;
    }

    // 下载图片到本地
    wx.downloadFile({
      url: this.data.qrcodeImageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '保存成功',
                icon: 'success',
                duration: 2000
              });
            },
            fail: (err) => {
              console.error('保存失败:', err);
              if (err.errMsg.includes('auth deny')) {
                // 用户拒绝授权
                wx.showModal({
                  title: '需要相册权限',
                  content: '请在设置中允许访问相册',
                  showCancel: false,
                  confirmText: '去设置',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting();
                    }
                  }
                });
              } else {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                });
              }
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

  /* ========== 分享配置 ========== */
  onShareAppMessage() {
    const userId = this.data.promotionCode.userId;
    return {
      title: '河狸家分销中心 - 邀请好友赚佣金',
      path: `/pages/index/index?ref=${userId}`,
      imageUrl: this.data.qrcodeImageUrl || ''
    };
  },

  // 分享到朋友圈配置
  onShareTimeline() {
    const userId = this.data.promotionCode.userId;
    return {
      title: '河狸家分销中心 - 邀请好友赚佣金',
      query: `ref=${userId}`,
      imageUrl: this.data.qrcodeImageUrl || ''
    };
  }
});
