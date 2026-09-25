# 股东排行榜单页面 (rank-list)

## 📋 页面概述

股东排行榜单页面展示共享股东的推广业绩排名，支持佣金榜单和推广人榜单两种维度的排行展示。

## ✨ 核心功能

### 1. **双维度榜单切换**
- **佣金榜单**：按累计返佣金额排序
- **推广人榜单**：按推广人数排序
- 椭圆形Tab切换设计，选中态金黄色背景高亮

### 2. **前三名领奖台展示**
- 🥇 **第一名（金牌）**：最高位置，带皇冠图标👑
- 🥈 **第二名（银牌）**：中等高度
- 🥉 **第三名（铜牌）**：最低位置
- CSS渐变实现金/银/铜牌效果，无需外部图片
- 深色背景卡片，突出荣誉感

### 3. **完整榜单列表**
- 显示第4名及以后的所有股东
- 包含：排名、头像、昵称、等级、金额/人数
- **自己的排名高亮显示**：金黄色边框+渐变背景
- 实时更新的时间戳

### 4. **交互体验**
- ✅ 下拉刷新数据
- ✅ 上拉加载更多（预留接口）
- ✅ Tab切换即时响应
- ✅ 平滑的过渡动画

## 🎨 设计规范

### 配色方案
- **页面背景**：深色渐变 `linear-gradient(180deg, #1b1b1b 0%, #ffffff 35%)`
- **顶部标题**：金色文字 `#fcf1c0`
- **Tab容器**：淡黄色 `#fff7ec`
- **Tab选中**：金黄色 `#fed17c`
- **奖牌渐变**：
  - 金牌：`#ffd700 → #ffed4e → #ffd700`
  - 银牌：`#c0c0c0 → #e8e8e8 → #c0c0c0`
  - 铜牌：`#cd7f32 → #daa06d → #cd7f32`

### 样式特点
- 完全参考 [distribution.wxml](../distribution/distribution.wxml) 和 [distribution.wxss](../distribution/distribution.wxss) 的设计
- 保持与主页面一致的视觉风格
- 深色主题与白色主题的渐变过渡
- 椭圆形Tab容器，圆角50rpx
- 卡片式布局，圆角24rpx

## 📁 文件结构

```
rank-list/
├── rank-list.wxml      # 页面结构
├── rank-list.wxss      # 页面样式
├── rank-list.js        # 页面逻辑
├── rank-list.json      # 页面配置
└── README.md           # 功能说明
```

## 🔧 技术实现

### 数据结构

```javascript
{
  rankTab: 'commission',  // 当前Tab: commission/referrer
  topThree: [],           // 前三名数据
  rankList: [],           // 第4名及以后的列表
  updateTime: '',         // 更新时间
  loading: false,         // 加载状态
  hasMore: true          // 是否有更多数据
}
```

### 排行榜数据格式

```javascript
{
  rank: 1,                    // 排名
  nickname: '孙之怡',         // 昵称
  avatar: 'https://...',      // 头像URL
  totalAmount: '6453.42',     // 累计佣金
  referralCount: 89,          // 推广人数
  levelName: '钻石股东',      // 股东等级
  isMe: false                 // 是否为自己
}
```

### 关键方法

1. **switchRankTab()** - 切换榜单类型
2. **loadRankList()** - 加载排行榜数据
3. **getMockData()** - 获取模拟数据
4. **formatTime()** - 格式化时间

## 🚀 使用方式

### 从 distribution 页面跳转

```javascript
// distribution.js
viewRankList() {
  wx.navigateTo({
    url: '/pages/distribution/rank-list/rank-list'
  });
}
```

### 带参数跳转（指定初始Tab）

```javascript
wx.navigateTo({
  url: '/pages/distribution/rank-list/rank-list?tab=referrer'
});
```

## 📝 待对接API

### 获取排行榜数据

```javascript
wx.request({
  url: 'https://your-api.com/rank-list',
  method: 'GET',
  data: {
    page: 1,
    pageSize: 20,
    type: 'commission'  // commission/referrer
  },
  success: (res) => {
    // 处理返回数据
  }
});
```

### 返回数据格式

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "rank": 1,
        "nickname": "孙之怡",
        "avatar": "https://...",
        "totalAmount": "6453.42",
        "referralCount": 89,
        "levelName": "钻石股东"
      }
    ],
    "total": 100,
    "updateTime": "2024-05-08 15:30"
  }
}
```

## 🎯 页面特色

1. **视觉冲击力强**：前三名领奖台设计，营造竞争氛围
2. **荣誉激励**：金/银/铜牌+皇冠，激发用户推广热情
3. **实时反馈**：自己的排名高亮显示，增强参与感
4. **流畅体验**：Tab切换无延迟，下拉刷新即时响应
5. **设计规范**：完全遵循distribution页面的UI规范

## 📌 注意事项

1. 当前使用模拟数据，需对接真实API
2. 客户信息已脱敏处理（如需要）
3. 仅展示一级分销数据，符合微信平台规范
4. 建议定期更新排行榜数据，保持实时性

## 🔗 相关页面

- [distribution](../distribution/) - 共享股东中心主页
- [referral-list](../referral-list/) - 推广业绩明细页面
- [balance-log](../balance-log/) - 储值明细页面

---

**最后更新**: 2024-05-08  
**版本**: v1.0.0
