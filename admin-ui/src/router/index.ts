import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '@/utils'

// 页面标题映射
const pageTitles: Record<string, string> = {
  dashboard: '首页仪表盘',
  singers: '歌手管理',
  songs: '歌曲管理',
  playlists: '歌单管理',
  users: '用户管理',
  data: '数据看板',
  logs: '操作日志',
  profile: '个人中心',
}

// 懒加载页面组件
const lazyView = (name: string) => () => import(`@/views/${name}/index.vue`)

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: lazyView('login'),
    meta: { title: '登录', hideNav: true },
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: lazyView('dashboard'),
        meta: { title: pageTitles.dashboard, icon: 'LayoutDashboard', perm: 'dashboard:view' },
      },
      {
        path: 'singers',
        name: 'Singers',
        component: lazyView('singer'),
        meta: { title: pageTitles.singers, icon: 'Mic', perm: 'singer:list' },
      },
      {
        path: 'songs',
        name: 'Songs',
        component: lazyView('song'),
        meta: { title: pageTitles.songs, icon: 'Music', perm: 'song:list' },
      },
      {
        path: 'playlists',
        name: 'Playlists',
        component: lazyView('playlist'),
        meta: { title: pageTitles.playlists, icon: 'Disc', perm: 'playlist:list' },
      },
      {
        path: 'users',
        name: 'Users',
        component: lazyView('user'),
        meta: { title: pageTitles.users, icon: 'Users', perm: 'user:list' },
      },
      {
        path: 'data',
        name: 'DataDashboard',
        component: lazyView('data'),
        meta: { title: pageTitles.data, icon: 'BarChart2', perm: 'data:view' },
      },
      {
        path: 'logs',
        name: 'OperationLogs',
        component: lazyView('log'),
        meta: { title: pageTitles.logs, icon: 'ScrollText', perm: 'log:list' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: lazyView('profile'),
        meta: { title: pageTitles.profile, icon: 'User' },
      },
    ],
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: lazyView('403'),
    meta: { title: '403 无权限', hideNav: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ============ 路由守卫 ============
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = (to.meta.title as string)
    ? `${to.meta.title} · 曲不离库`
    : '余音绕梁 · 音乐库后台智能管理系统'

  // 登录页无需验证
  if (to.path === '/login') {
    const token = getToken()
    if (token) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  // 验证 Token
  const token = getToken()
  if (!token) {
    next('/login')
    return
  }

  // 权限检查（权限从 store 中获取，路由守卫阶段 store 已初始化）
  // 详细的权限检查在 AppLayout 的导航守卫中处理
  next()
})

export default router
export { pageTitles }
