// ============ 通用类型 ============
export interface PageParams {
  page: number
  pageSize: number
  keyword?: string
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}

// ============ 枚举常量 ============
export const StyleOptions = ['流行', '摇滚', '电子', '民谣', '嘻哈', '古典'] as const
export type MusicStyle = (typeof StyleOptions)[number]

export const AuditStatusMap: Record<number, string> = {
  0: '待审核', 1: '审核通过', 2: '已驳回', 3: '已上架', 4: '已下架',
}

export const CopyrightStatusMap = {
  0: '待录入', 1: '已授权', 2: '即将到期', 3: '已过期',
} as const

export const PlaylistTypeMap = {
  0: '官方歌单', 1: '用户歌单',
} as const

export const PlaylistStatusMap: Record<number, string> = {
  0: '待审核', 1: '审核通过', 2: '已发布', 3: '已驳回', 4: '已下架',
}

export const UserTypeMap = {
  0: '普通用户', 1: 'VIP会员', 2: '音乐人',
} as const

export const UserStatusMap = {
  0: '已禁用', 1: '正常', 2: '待激活',
} as const

export const OpTypeMap = {
  'ADD': '新增', 'EDIT': '编辑', 'DELETE': '删除', 'LOGIN': '登录',
  'AUDIT': '审核', 'EXPORT': '导出',
} as const

// ============ 实体类型 ============
export interface Singer {
  id: number
  name: string
  avatar: string
  style: MusicStyle
  certStatus: number
  auditRemark: string
  intro: string
  socialLinks: string
  songCount: number
  followerCount: number
  createdAt: string
  updatedAt: string
}

export interface Song {
  id: number
  title: string
  singerId: number
  singerName: string
  album: string
  style: MusicStyle
  duration: number
  isrc: string
  coverUrl: string
  audioUrl: string
  lyric: string
  playCount: number
  auditStatus: number
  auditorId: number
  auditTime: string
  auditRemark: string
  copyright?: SongCopyright
  // 版权信息表单字段（提交时合并到 copyright）
  lyricAuthor?: string
  composer?: string
  copyrightCompany?: string
  licenseStart?: string
  licenseEnd?: string
  releaseDate: string
  createdAt: string
  updatedAt: string
}

export interface SongCopyright {
  id: number
  songId: number
  lyricAuthor: string
  composer: string
  copyrightCompany: string
  licenseStart: string
  licenseEnd: string
  status: number
}

export interface Playlist {
  id: number
  name: string
  coverUrl: string
  description: string
  type: number
  category: string | null
  creatorId: number
  creatorName: string
  status: number
  publishTime: string | null
  isPinned: number
  songCount: number
  favoriteCount: number
  playCount: number
  createdAt: string
  updatedAt: string
}

export interface AppUser {
  id: number
  nickname: string
  phone: string
  avatar: string
  userType: number
  vipExpire: string | null
  status: number
  favoriteCount: number
  playlistCount: number
  registeredAt: string
  lastLoginAt: string
  password?: string
}

export interface OperationLog {
  id: number
  operatorId: number
  operatorName: string
  ipAddress: string
  opType: string
  module: string
  detail: string
  result: number
  failReason: string
  createdAt: string
}

export interface DashboardOverview {
  // StatCard 概览
  songCount: number
  activeSongCount: number
  singerCount: number
  certifiedSingerCount: number
  playlistCount: number
  officialPlaylistCount: number
  userCount: number
  dailyActiveUser: number
  // 平台营销数据总览
  totalPlays: number
  totalListenHours: number
  playlistSaves: number
  commentCount: number
  shareCount: number
  newUserToday: number
  // 趋势
  songTrend: number
  singerTrend: number
  playlistTrend: number
  userTrend: number
}

export interface ChartDataItem {
  label: string
  value: number
  percent: number
  color?: string
}

export interface UserInfo {
  id: number
  username: string
  phone: string
  avatar: string
  realName: string
  employeeId: string
  position: string
  department: string
  phone: string
  roles: string[]
  permissions: string[]
  lastLoginIp: string
  lastLoginTime: string
  createdAt?: string
}

export interface LoginForm {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  tokenType: string
  expiresIn: number
}
