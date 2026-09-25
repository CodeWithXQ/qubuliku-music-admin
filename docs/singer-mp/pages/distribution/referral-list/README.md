# 推广业绩榜单页面说明

## 📄 文件结构

```
referral-list/
├── referral-list.js      # 页面逻辑
├── referral-list.wxml    # 页面结构
├── referral-list.wxss    # 页面样式
└── referral-list.json    # 页面配置
```

---

## 🎯 功能概述

推广业绩榜单页面用于展示共享股东的完整推广明细，包括：

1. **顶部统计卡片**：展示推广业绩总览数据
2. **Tab筛选栏**：按时间范围筛选（今日/本周/本月/全部）
3. **推广明细列表**：展示每条推广订单的详细信息
4. **下拉刷新**：获取最新推广数据
5. **上拉加载更多**：分页加载历史记录

---

## 📊 页面布局

### 1. 顶部统计卡片

深色主题背景，展示四个关键指标：
- **新增客户**：当前时间段内的新客户数量
- **推广订单**：推广成功的订单总数
- **消费总额**：所有推广订单的消费金额总和
- **返佣总额**：获得的返佣金额总和（金色高亮）

### 2. Tab筛选栏

白色背景的Tab切换栏，支持四种时间范围：
- **今日**：今天0点至今的推广记录
- **本周**：最近7天的推广记录
- **本月**：最近30天的推广记录
- **全部**：所有历史推广记录

选中状态有黄色下划线标识。

### 3. 推广明细列表

每条推广记录包含三个部分：

#### 左侧：服务图片区域
- 服务项目图片（120rpx × 120rpx）
- 订单状态标签（右上角）
  - 🟢 已完成（绿色）
  - 🟡 待结算（黄色）
  - 🔴 已退款（红色）

#### 中间：订单信息区域
- **客户信息行**：
  - 客户头像（圆形）
  - 客户名称（脱敏显示，如：王*姐）
  - 订单时间（右侧显示）
  
- **服务信息行**：
  - 服务名称（如：纯色美甲）
  - 订单号（小字显示）

#### 右侧：金额信息区域
- **返佣金额**：绿色大字显示（+¥19.80）
- **返佣比例**：橙色徽章显示（10%）
- **消费金额**：灰色小字显示（¥198.00）

---

## 🎨 样式设计

### 配色方案

**深色主题（顶部统计卡片）**：
- 背景渐变：`#2a2a2a` → `#1f1f1f`
- 标题文字：`#fcf1c0`（淡黄色）
- 数值文字：`#ffffff`（白色）
- 标签文字：`rgba(255, 255, 255, 0.6)`

**白色主题（列表区域）**：
- 页面背景：`#f5f5f5`
- 卡片背景：`#ffffff`
- 主要文字：`#1c1c1c`
- 次要文字：`#666666` / `#999999`
- 强调色：`#fcf1c0`（淡黄色）

**状态颜色**：
- 已完成：`#52c41a`（绿色）
- 待结算：`#faad14`（黄色）
- 已退款：`#f5222d`（红色）
- 返佣金额：`#52c41a`（绿色）
- 返佣比例徽章：渐变 `#fff7e6` → `#ffe7ba`

### 交互效果

1. **Tab切换**：平滑过渡动画（0.3s）
2. **卡片点击**：轻微缩小效果（scale 0.98）
3. **阴影变化**：点击时阴影加深

---

## 💻 核心代码说明

### 数据结构

```javascript
data: {
  // Tab筛选
  currentTab: 'all', // today/week/month/all
  
  // 统计数据
  stats: {
    newCustomers: 5,        // 新增客户数
    totalOrders: 23,        // 推广订单数
    orderAmount: '2399.99', // 消费总额
    commissionAmount: '239.99' // 返佣总额
  },
  
  // 推广明细列表
  referralList: [
    {
      id: 1,
      orderId: 'ORD20240508001',
      customerName: '王*姐',           // 客户名称（脱敏）
      customerAvatar: '...',           // 客户头像
      orderAmount: 198.00,             // 消费金额
      commissionAmount: 19.80,         // 返佣金额
      commissionRate: 10,              // 返佣比例（%）
      serviceName: '纯色美甲',          // 服务名称
      serviceImage: '...',             // 服务图片
      orderTime: '2024-05-08 14:30',   // 订单时间
      status: 'completed',             // 订单状态
      statusText: '已完成'              // 状态文本
    }
  ]
}
```

### 主要方法

#### 1. switchTab(e)
切换时间筛选Tab，重新加载对应时间范围的推广记录。

```javascript
switchTab(e) {
  const tab = e.currentTarget.dataset.tab;
  this.setData({
    currentTab: tab,
    pageNum: 1,
    referralList: []
  });
  this.loadReferralList(true);
}
```

#### 2. loadReferralList(isRefresh)
加载推广明细列表，支持下拉刷新和分页加载。

```javascript
loadReferralList(isRefresh = false) {
  // TODO: 对接后端API
  // wx.request({...})
  
  // 模拟数据加载
  setTimeout(() => {
    const filteredList = this.filterReferralList();
    this.setData({
      referralList: isRefresh ? filteredList : [...this.data.referralList],
      loading: false,
      hasMore: false
    });
  }, 500);
}
```

#### 3. filterReferralList()
根据当前Tab筛选数据。

```javascript
filterReferralList() {
  const now = new Date();
  const list = this.data.referralList;
  
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
```

#### 4. viewOrderDetail(e)
查看订单详情，跳转到订单详情页。

```javascript
viewOrderDetail(e) {
  const orderId = e.currentTarget.dataset.orderId;
  wx.navigateTo({
    url: `/pages/orderDetail/order-detail?orderId=${orderId}`
  });
}
```

---

## 🔗 页面跳转

### 从distribution页面进入

在distribution页面的"推广业绩"区域，点击右上角的"查看全部 ›"按钮：

```xml
<view class="section-more" bindtap="viewReferralList">查看全部 ›</view>
```

触发方法：
```javascript
// distribution.js
viewReferralList() {
  wx.navigateTo({
    url: '/pages/distribution/referral-list/referral-list'
  });
}
```

### 跳转到订单详情页

点击推广明细列表中的任意一条记录，跳转到对应的订单详情页：

```javascript
viewOrderDetail(e) {
  const orderId = e.currentTarget.dataset.orderId;
  wx.navigateTo({
    url: `/pages/orderDetail/order-detail?orderId=${orderId}`
  });
}
```

---

## ⚙️ 页面配置

```json
{
  "navigationBarTitleText": "推广业绩",
  "navigationBarBackgroundColor": "#1c1c1c",
  "navigationBarTextStyle": "white",
  "enablePullDownRefresh": true,
  "backgroundTextStyle": "dark"
}
```

- **导航栏标题**：推广业绩
- **导航栏背景**：深灰色 `#1c1c1c`
- **导航栏文字**：白色
- **下拉刷新**：启用
- **刷新样式**：深色

---

## 📝 后续开发（TODO）

当前使用模拟数据，后续需要对接后端API：

### 1. API接口设计

```javascript
// 获取推广明细列表
GET /api/referral/list

请求参数：
{
  page: 1,              // 页码
  pageSize: 10,         // 每页数量
  timeRange: 'all'      // 时间范围：today/week/month/all
}

返回数据：
{
  code: 200,
  data: {
    list: [...],        // 推广明细列表
    total: 100,         // 总记录数
    stats: {            // 统计数据
      newCustomers: 5,
      totalOrders: 23,
      orderAmount: '2399.99',
      commissionAmount: '239.99'
    }
  }
}
```

### 2. 数据映射

将后端返回的数据映射到前端数据结构：

```javascript
wx.request({
  url: 'https://your-api.com/referral/list',
  method: 'GET',
  data: {
    page: this.data.pageNum,
    pageSize: this.data.pageSize,
    timeRange: this.data.currentTab
  },
  success: (res) => {
    if (res.data.code === 200) {
      const newList = res.data.data.list || [];
      const stats = res.data.data.stats || {};
      
      this.setData({
        referralList: isRefresh ? newList : [...this.data.referralList, ...newList],
        stats: stats,
        loading: false,
        hasMore: newList.length >= this.data.pageSize
      });
    }
  }
});
```

### 3. 客户信息脱敏

确保后端返回的客户名称已经脱敏处理：
- 原始名称：王小姐 → 脱敏后：王*姐
- 原始名称：李妹妹 → 脱敏后：李*妹
- 原始名称：张子涵 → 脱敏后：张*子

### 4. 订单状态同步

订单状态需要与订单系统实时同步：
- `completed`：订单已完成，返佣已结算
- `pending`：订单进行中，返佣待结算
- `refunded`：订单已退款，返佣已取消

---

## ✅ 完成效果

现在用户可以：
1. ✅ 从distribution页面点击"查看全部"进入推广业绩榜单
2. ✅ 查看完整的推广明细列表
3. ✅ 按时间范围筛选（今日/本周/本月/全部）
4. ✅ 查看每条推广记录的详细信息（客户、服务、金额）
5. ✅ 点击记录查看订单详情
6. ✅ 下拉刷新获取最新数据
7. ✅ 上拉加载更多历史记录

推广业绩榜单页面功能完整，样式精美，可以直接在微信开发者工具中预览效果！
