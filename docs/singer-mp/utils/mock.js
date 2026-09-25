// utils/mock.js — 开发阶段模拟数据，无需后端即可运行全部页面

const singerInfo = {
  id: 1,
  name: '周杰伦',
  avatar: 'https://singerimg.kugou.com/uploadpic/softhead/400/20230510/20230510173043311.jpg',
  style: '流行',
  certStatus: 2,
  certRemark: '',
  songCount: 156,
  playCount: 56800000000,
  followerCount: 8926000,
  pendingSongCount: 2,
  weekPlays: [
    { date: '06/21', count: 8620000 }, { date: '06/22', count: 9130000 },
    { date: '06/23', count: 8780000 }, { date: '06/24', count: 9510000 },
    { date: '06/25', count: 10230000 }, { date: '06/26', count: 9860000 },
    { date: '06/27', count: 10450000 }
  ],
  latestSongs: [
    { id: 1, title: '晴天', coverUrl: 'https://picsum.photos/seed/jay1/200/200', playCount: 2850000000, auditStatus: 3 },
    { id: 2, title: '说好不哭', coverUrl: 'https://picsum.photos/seed/jay2/200/200', playCount: 1520000000, auditStatus: 3 },
    { id: 3, title: 'Mojito', coverUrl: 'https://picsum.photos/seed/jay3/200/200', playCount: 980000000, auditStatus: 3 }
  ],
  phone: '138****8888',
  intro: '华语乐坛天王，亚洲流行音乐标杆。出道至今创作数百首经典，融合R&B、中国风、嘻哈等多种曲风，开创华语流行新纪元。',
  socialLinks: '微博@周杰伦,Instagram@jaychou'
}

const jaySongs = [
  { title: '晴天',         album: '叶惠美',         duration: 289, style: '流行', releaseDate: '2003-07-31', playCount: 2850000000, favoriteCount: 18600000 },
  { title: '七里香',       album: '七里香',         duration: 299, style: '流行', releaseDate: '2004-08-03', playCount: 2620000000, favoriteCount: 17200000 },
  { title: '夜曲',         album: '十一月的萧邦',   duration: 303, style: '流行', releaseDate: '2005-11-01', playCount: 2480000000, favoriteCount: 16500000 },
  { title: '稻香',         album: '魔杰座',         duration: 291, style: '流行', releaseDate: '2008-10-15', playCount: 2350000000, favoriteCount: 15800000 },
  { title: '青花瓷',       album: '我很忙',         duration: 298, style: '中国风', releaseDate: '2007-11-02', playCount: 2280000000, favoriteCount: 15200000 },
  { title: '简单爱',       album: '范特西',         duration: 270, style: 'R&B', releaseDate: '2001-09-14', playCount: 2180000000, favoriteCount: 14800000 },
  { title: '听妈妈的话',   album: '依然范特西',     duration: 312, style: '嘻哈', releaseDate: '2006-09-05', playCount: 2080000000, favoriteCount: 14200000 },
  { title: '发如雪',       album: '十一月的萧邦',   duration: 296, style: '中国风', releaseDate: '2005-11-01', playCount: 1950000000, favoriteCount: 13500000 },
  { title: '蒲公英的约定', album: '我很忙',         duration: 289, style: '流行', releaseDate: '2007-11-02', playCount: 1880000000, favoriteCount: 12800000 },
  { title: '说好的幸福呢', album: '魔杰座',         duration: 305, style: '流行', releaseDate: '2008-10-15', playCount: 1820000000, favoriteCount: 12400000 },
  { title: '彩虹',         album: '我很忙',         duration: 310, style: '流行', releaseDate: '2007-11-02', playCount: 1780000000, favoriteCount: 12100000 },
  { title: '安静',         album: '范特西',         duration: 332, style: '流行', releaseDate: '2001-09-14', playCount: 1720000000, favoriteCount: 11800000 },
  { title: '以父之名',     album: '叶惠美',         duration: 345, style: '嘻哈', releaseDate: '2003-07-31', playCount: 1680000000, favoriteCount: 11500000 },
  { title: '东风破',       album: '叶惠美',         duration: 304, style: '中国风', releaseDate: '2003-07-31', playCount: 1650000000, favoriteCount: 11200000 },
  { title: '告白气球',     album: '周杰伦的床边故事', duration: 285, style: '流行', releaseDate: '2016-06-24', playCount: 2200000000, favoriteCount: 16200000 },
  { title: '等你下课',     album: '单曲',           duration: 318, style: '流行', releaseDate: '2018-01-18', playCount: 1580000000, favoriteCount: 10800000 },
  { title: 'Mojito',       album: '单曲',           duration: 296, style: '拉丁', releaseDate: '2020-06-12', playCount: 980000000, favoriteCount: 6500000 },
  { title: '说好不哭',     album: '单曲',           duration: 314, style: '流行', releaseDate: '2019-09-16', playCount: 1520000000, favoriteCount: 10200000 },
  { title: '龙卷风',       album: 'Jay',            duration: 278, style: 'R&B', releaseDate: '2000-11-07', playCount: 1450000000, favoriteCount: 9800000 },
  { title: '双截棍',       album: '范特西',         duration: 296, style: '嘻哈', releaseDate: '2001-09-14', playCount: 1420000000, favoriteCount: 9600000 },
  { title: '搁浅',         album: '七里香',         duration: 293, style: '流行', releaseDate: '2004-08-03', playCount: 1380000000, favoriteCount: 9300000 },
  { title: '一路向北',     album: '十一月的萧邦',   duration: 298, style: '流行', releaseDate: '2005-11-01', playCount: 1350000000, favoriteCount: 9100000 },
  { title: '珊瑚海',       album: '十一月的萧邦',   duration: 307, style: '流行', releaseDate: '2005-11-01', playCount: 1320000000, favoriteCount: 8900000 },
  { title: '最伟大的作品', album: '最伟大的作品',   duration: 326, style: '古典融合', releaseDate: '2022-07-15', playCount: 890000000, favoriteCount: 5800000 },
  { title: '还在流浪',     album: '最伟大的作品',   duration: 289, style: '流行', releaseDate: '2022-07-15', playCount: 620000000, favoriteCount: 4100000 },
]

const songs = jaySongs.map((s, i) => ({
  id: i + 1,
  ...s,
  isrc: 'CN-JVR-' + String(i + 1).padStart(3, '0'),
  coverUrl: `https://picsum.photos/seed/jay${i + 1}/200/200`,
  audioUrl: '',
  lyric: '',
  // 全部已上架，除了最新几首
  auditStatus: i >= jaySongs.length - 3 ? [0, 0, 1][i - jaySongs.length + 3] : 3
}))

const notifications = [
  { id: 1, type: 'song_audit', title: '歌曲审核通过', content: '《最伟大的作品》已通过审核并上架，现在对所有用户可见', isRead: false, relatedId: 24, createdAt: '2026-06-27T10:30:00' },
  { id: 2, type: 'song_audit', title: '歌曲审核通过', content: '《还在流浪》已通过审核并上架，现在对所有用户可见', isRead: false, relatedId: 25, createdAt: '2026-06-27T09:15:00' },
  { id: 3, type: 'certification', title: '认证状态更新', content: '恭喜！您的歌手认证已通过，目前拥有「已认证音乐人」标识，享受平台全部权益', isRead: true, relatedId: null, createdAt: '2026-06-25T10:00:00' },
  { id: 4, type: 'copyright', title: '版权到期提醒', content: '《七里香》专辑版权授权将于60天后到期，请及时联系JVR Music续约，避免歌曲下架', isRead: false, relatedId: 2, createdAt: '2026-06-24T08:00:00' },
  { id: 5, type: 'system', title: '平台公告', content: '曲不离库 4.0 版本全新上线！新增AI智能推荐、多平台一键分发、音乐人指数体系等功能，助力您的音乐事业', isRead: true, relatedId: null, createdAt: '2026-06-20T12:00:00' }
]

const overview = {
  totalPlays: 56800000000,
  totalFavorites: 89200000,
  followerCount: 8926000,
  playsTrend: [
    { date: '06/21', count: 8620000 }, { date: '06/22', count: 9130000 },
    { date: '06/23', count: 8780000 }, { date: '06/24', count: 9510000 },
    { date: '06/25', count: 10230000 }, { date: '06/26', count: 9860000 },
    { date: '06/27', count: 10450000 }
  ],
  followerTrend: [
    { date: '06/21', count: 3500 }, { date: '06/22', count: 4200 },
    { date: '06/23', count: 2800 }, { date: '06/24', count: 5500 },
    { date: '06/25', count: 6300 }, { date: '06/26', count: 4800 },
    { date: '06/27', count: 7200 }
  ],
  topSongs: [
    { id: 1, title: '晴天', coverUrl: 'https://picsum.photos/seed/jay1/200/200', playCount: 2850000000 },
    { id: 2, title: '七里香', coverUrl: 'https://picsum.photos/seed/jay2/200/200', playCount: 2620000000 },
    { id: 3, title: '夜曲', coverUrl: 'https://picsum.photos/seed/jay3/200/200', playCount: 2480000000 },
    { id: 4, title: '稻香', coverUrl: 'https://picsum.photos/seed/jay4/200/200', playCount: 2350000000 },
    { id: 5, title: '青花瓷', coverUrl: 'https://picsum.photos/seed/jay5/200/200', playCount: 2280000000 }
  ]
}

const copyright = { status: 1, company: 'JVR Music International Ltd.', licenseStart: '2020-01-01', licenseEnd: '2030-12-31' }

// 路由映射：URL pattern → mock 响应
function match(url, data) {
  // 登录
  if (url === '/login/wechat' || url === '/login/phone') {
    return { token: 'mock_token_dev_2026', singerInfo, isNewUser: false }
  }
  if (url === '/register') {
    return { token: 'mock_token_dev_2026', singerInfo: { ...singerInfo, certStatus: 1 } }
  }
  if (url === '/sms/send') return { expireIn: 300 }

  // 工作台
  if (url === '/dashboard') return singerInfo

  // 歌曲列表
  if (url === '/songs') {
    const page = data?.page || 1
    const pageSize = data?.pageSize || 20
    let list = [...songs]
    if (data?.auditStatus !== undefined && data.auditStatus !== '') {
      list = list.filter(s => s.auditStatus === parseInt(data.auditStatus))
    }
    const start = (page - 1) * pageSize
    return { records: list.slice(start, start + pageSize), total: list.length, page, pageSize }
  }

  // 歌曲详情
  if (url.match(/^\/songs\/(\d+)$/)) {
    const id = parseInt(RegExp.$1)
    return songs.find(s => s.id === id) || songs[0]
  }
  if (url.match(/^\/songs\/(\d+)\/copyright$/)) return copyright
  if (url.match(/^\/songs\/(\d+)\/resubmit$/)) return { success: true }

  // 歌曲创建
  if (url === '/songs' && data?.title) {
    return { id: songs.length + 1, auditStatus: 0 }
  }

  // 个人资料
  if (url === '/profile') return singerInfo
  if (url === '/profile/resubmit') return { success: true, certStatus: 1 }

  // 认证
  if (url === '/certification') return { certStatus: 2, auditRemark: '' }

  // 通知
  if (url.match(/^\/notifications\/(\d+)$/)) {
    const id = parseInt(RegExp.$1)
    return notifications.find(n => n.id === id) || notifications[0]
  }
  if (url.match(/^\/notifications\/(\d+)\/read$/)) return { success: true }
  if (url === '/notifications') {
    const page = data?.page || 1
    return { records: notifications, total: notifications.length, page, pageSize: 20 }
  }

  // 数据看板
  if (url === '/stats/overview') return overview

  // 上传文件
  if (url === '/songs/upload/cover' || url === '/songs/upload/audio' || url === '/profile/avatar') {
    return { url: 'https://picsum.photos/seed/jay${id}/200/200' }
  }

  return null
}

module.exports = { match }
