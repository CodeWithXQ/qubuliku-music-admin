import type { LoginResult, UserInfo, DashboardOverview, ChartDataItem } from '@/types'
import type { TopSong } from '@/modules/dashboard'

// ============ Mock 工具 ============
let idCounter = 1000
const nextId = () => ++idCounter
const now = () => new Date().toISOString()
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)]

// ============ Auth ============
export function mockLogin(): LoginResult {
  return { token: 'mock-jwt-token-admin-2024', tokenType: 'Bearer', expiresIn: 86400 }
}

export function mockUserInfo(): UserInfo {
  return {
    id: 1,
    username: 'zhangmingyuan',
    phone: '138****8888',
    avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=张明远&size=200',
    realName: '张明远',
    employeeId: 'YY20240001',
    position: '技术总监',
    department: '技术研发部',
    roles: ['admin'],
    permissions: [
      'dashboard:view', 'singer:list', 'singer:edit', 'singer:audit', 'song:list', 'song:audit', 'song:edit',
      'playlist:list', 'playlist:audit', 'playlist:edit', 'user:list', 'data:view', 'log:list',
    ],
    lastLoginIp: '192.168.1.100',
    lastLoginTime: '2026-06-11 08:30',
  }
}

// ============ Dashboard ============
export function mockDashboardOverview(): DashboardOverview {
  return {
    songCount: 48520, activeSongCount: 1280,
    singerCount: 2156, certifiedSingerCount: 890,
    playlistCount: 5680, officialPlaylistCount: 320,
    userCount: 38920, dailyActiveUser: 12480,
    totalPlays: 18492, totalListenHours: 8520,
    playlistSaves: 3284, commentCount: 6521,
    shareCount: 1486, newUserToday: 352,
    songTrend: 12, singerTrend: 5, playlistTrend: 8, userTrend: 18,
  }
}

const topSongTitles = [
  '晴天', '七里香', '夜曲', '稻香', '青花瓷', '告白气球', '等你下课', '说好不哭', 'Mojito', '简单爱',
  '十年', '浮夸', '好久不见', '爱情转移', '富士山下', 'K歌之王', '单车', '最佳损友',
]
const styles = ['流行', '摇滚', '民谣', '电子', 'R&B', '嘻哈', '古典', '爵士']

export function mockTopSongs(limit: number): TopSong[] {
  return Array.from({ length: limit ?? 10 }, (_, i) => ({
    rank: i + 1,
    title: topSongTitles[i] ?? `歌曲${i + 1}`,
    singerName: pick(['周杰伦', '陈奕迅', '林俊杰', '邓紫棋', 'Taylor Swift']),
    style: pick(styles),
    playCount: rand(100000, 9999999),
  }))
}

export function mockStyleDistribution(): ChartDataItem[] {
  const total = 36000
  const colorMap: Record<string, string> = {
    '流行': '#EC4899', '摇滚': '#F97316', '电子': '#8B5CF6',
    '民谣': '#10B981', '嘻哈': '#F59E0B', '古典': '#6366F1',
    'R&B': '#06B6D4', '爵士': '#D946EF',
  }
  return styles.map((label) => {
    const v = rand(500, 8000)
    return { label, value: v, percent: Math.round((v / total) * 100), color: colorMap[label] ?? '#589286' }
  })
}

// ============ Singer ============
const singerNames = ['周杰伦', '陈奕迅', '林俊杰', '邓紫棋', 'Taylor Swift', 'Ed Sheeran', 'Beyoncé', 'Adele', 'Coldplay', 'Imagine Dragons', '张惠妹', '五月天', '陈粒', '薛之谦', '毛不易']
export function mockSingers(params: any) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const total = 2156
  const records = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) => ({
    id: (page - 1) * pageSize + i + 1,
    name: singerNames[i % singerNames.length],
    avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${singerNames[i % singerNames.length]}&size=200`,
    style: pick(styles),
    certStatus: pick([2, 2, 2, 1, 0]),
    intro: pick(['华语乐坛实力唱将，多次获得金曲奖', '新生代创作型歌手，作品广受欢迎', '国际知名音乐人，全球巡演场场爆满', '独立音乐人，风格独特深受青年喜爱']),
    songCount: rand(10, 200),
    followerCount: rand(10000, 9999999),
    createdAt: `202${rand(0, 5)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
  }))
  return { total, page, pageSize, records }
}

// ============ Song ============
const albums = ['最伟大的作品', '孤勇者', '将故事写成我们', '摩天动物园', 'Midnights', '÷ (Divide)', 'Renaissance', '30', 'Music of the Spheres']
export function mockSongs(params: any) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const total = 48520
  const songNames = topSongTitles
  const singers = ['周杰伦', '陈奕迅', '林俊杰', '邓紫棋', 'Taylor Swift']
  const auditStatuses = [3, 3, 3, 3, 0, 0, 2, 4] // 多数已上架，少量待审核/驳回/下架
  const singerIds = [1, 2, 3, 4, 5]
  const records = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) => {
    const singerName = pick(singers)
    const singerIdx = singers.indexOf(singerName)
    return {
      id: (page - 1) * pageSize + i + 1,
      title: songNames[i % songNames.length] ?? `歌曲${i + 1}`,
      singerId: singerIds[singerIdx] ?? 1,
      singerName,
      album: pick(albums),
      style: pick(styles),
      duration: rand(180, 320),
      isrc: `CN-A${String(rand(10, 99)).padStart(2, '0')}-${String(rand(10, 99)).padStart(2, '0')}-${String(rand(100, 999)).padStart(3, '0')}${rand(0, 9)}`,
      coverUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=music${(page - 1) * pageSize + i + 1}&size=300`,
      audioUrl: `https://audio.example.com/songs/${(page - 1) * pageSize + i + 1}.mp3`,
      lyric: pick(['窗外的麻雀在电线杆上多嘴\n你说这一句很有夏天的感觉\n手中的铅笔在纸上来来回回\n我用几行字形容你是我的谁', '我们绕了这么一圈才遇到\n我比谁都更明白你的重要', '终于看开爱回不来\n而你总是太晚明白\n最后才把话说开\n哭着求我留下来', '']),
      playCount: rand(1000, 99999999),
      auditStatus: pick(auditStatuses),
      auditorId: pick([0, 1, 1, 1]),
      auditTime: pick([now(), now(), now(), '']),
      auditRemark: '',
      releaseDate: `202${rand(0, 5)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
      createdAt: `202${rand(3, 5)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
      updatedAt: now(),
    }
  })
  return { total, page, pageSize, records }
}

// ============ Playlist ============
const playlistNames = ['华语热歌榜', '新歌推荐', '经典老歌', '睡前轻音乐', '运动健身', '开车必备', 'KTV必点', '欧美精选', '日韩流行', '独立音乐']
export function mockPlaylists(params: any) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const total = 1640
  const records = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) => ({
    id: (page - 1) * pageSize + i + 1,
    name: playlistNames[i % playlistNames.length],
    coverUrl: `https://api.dicebear.com/9.x/rings/svg?seed=playlist${(page - 1) * pageSize + i + 1}&size=300`,
    description: pick(['精选华语热门金曲', '最新发布歌曲推荐', '经典怀旧音乐合集', '适合睡前放松的轻音乐']),
    type: pick([0, 0, 1, 1, 1]),
    creatorId: 1,
    creatorName: pick(['超级管理员', '运营小王', '音乐编辑']),
    status: pick([1, 1, 1, 1, 0, 2, 3]), // 0待审核 1已发布 2已驳回 3已下架
    publishTime: pick([now(), now(), null]),
    isPinned: pick([0, 0, 0, 0, 1]),
    songCount: rand(5, 200),
    favoriteCount: rand(1000, 9999999),
    playCount: rand(10000, 99999999),
    createdAt: now(),
  }))
  return { total, page, pageSize, records }
}

// ============ User ============
const userNicknames = ['music_fan', 'song_lover', 'pop_king', 'rock_girl', 'jazz_cat', 'beat_maker', 'guitar_hero', 'piano_girl', 'drum_boy', 'vocal_star']
export function mockUsers(params: any) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const total = 38920
  const records = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) => ({
    id: (page - 1) * pageSize + i + 1,
    nickname: userNicknames[i % userNicknames.length],
    phone: `138${String((page - 1) * pageSize + i).padStart(8, '0')}`,
    avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${userNicknames[i % userNicknames.length]}&size=200`,
    userType: pick([0, 0, 0, 1, 1, 2]),
    vipExpire: pick([null, null, '2027-06-11', '2026-12-31']),
    status: pick([1, 1, 1, 1, 0, 2]),
    favoriteCount: rand(5, 500),
    playlistCount: rand(0, 30),
    registeredAt: `202${rand(0, 5)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
    lastLoginAt: now(),
  }))
  return { total, page, pageSize, records }
}

// ============ Data Dashboard ============
export function mockPlayTrend() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return months.map((month) => ({
    month,
    流行: rand(10000, 50000),
    摇滚: rand(5000, 25000),
    民谣: rand(3000, 15000),
    电子: rand(8000, 30000),
  }))
}

export function mockUserGrowth() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  return months.map((month) => ({
    month,
    新增用户: rand(500, 3000),
    活跃用户: rand(5000, 20000),
  }))
}

// ============ Operation Log ============
export function mockOperationLogs(params: any) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const total = 12480
  const opTypes = ['ADD', 'EDIT', 'DELETE', 'LOGIN']
  const modules = ['歌曲', '歌手', '歌单', '用户', '系统']
  const records = Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) => ({
    id: (page - 1) * pageSize + i + 1,
    operatorName: pick(['超级管理员', '运营小王', '审核员']),
    ipAddress: `192.168.1.${rand(1, 255)}`,
    opType: pick(opTypes),
    module: pick(modules),
    detail: pick(['修改了歌曲信息', '新增歌手', '删除歌单', '登录系统', '审核通过']),
    result: rand(0, 10) > 0 ? 1 : 0,
    createdAt: now(),
  }))
  return { total, page, pageSize, records }
}

// ============ System ============
export function mockPreferences() {
  return { defaultPage: '仪表盘', pageSize: 50 }
}

// ============ 路由映射表 ============
export interface MockHandler {
  get?: Record<string, (params: any) => any>
  post?: Record<string, (data: any) => any>
  put?: Record<string, (data: any) => any>
  delete?: Record<string, (data: any) => any>
}

export const mockHandlers: MockHandler = {
  post: {
    '/auth/login': mockLogin,
    '/auth/logout': () => null,
    '/system/password': () => null,
    '/system/preferences': () => null,
    '/system/profile': () => null,
    '/singers': () => nextId(),
    '/songs': () => nextId(),
    '/songs/batch-audit': () => null,
    '/songs/:id/audit': () => null,
    '/songs/:id/publish': () => null,
    '/songs/:id/unpublish': () => null,
    '/songs/:id/resubmit': () => null,
    '/songs/batch-publish': () => null,
    '/songs/batch-unpublish': () => null,
    '/playlists': () => nextId(),
    '/playlists/:id/audit': () => null,
    '/playlists/:id/publish': () => null,
    '/playlists/:id/unpublish': () => null,
    '/playlists/:id/resubmit': () => null,
    '/playlists/batch-audit': () => null,
    '/playlists/batch-unpublish': () => null,
  },
  put: {
    '/singers/:id': () => null,
    '/songs/:id': () => null,
    '/playlists/:id': () => null,
    '/playlists/:id/pin': () => null,
    '/users/:id/status': () => null,
    '/system/profile': () => null,
  },
  delete: {
    '/singers/:id': () => null,
    '/songs/:id': () => null,
    '/playlists/:id': () => null,
    '/users/:id': () => null,
  },
  get: {
    '/auth/info': mockUserInfo,
    '/dashboard/overview': mockDashboardOverview,
    '/dashboard/top-songs': (params) => mockTopSongs(params?.limit),
    '/dashboard/style-distribution': mockStyleDistribution,
    '/singers': mockSingers,
    '/songs': mockSongs,
    '/playlists': mockPlaylists,
    '/users': mockUsers,
    '/data/overview-stats': () => ({ totalPlayCount: 48520000, dailyActiveUser: 12480, newSongCount: 236, conversionRate: 18.5 }),
    '/data/play-trends': mockPlayTrend,
    '/data/user-growth': mockUserGrowth,
    '/data/hot-songs': (params) => mockTopSongs(params?.limit),
    '/logs/operations': mockOperationLogs,
    '/system/preferences': mockPreferences,
  },
}
