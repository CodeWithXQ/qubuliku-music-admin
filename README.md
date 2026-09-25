# 曲不离库 · 音乐后台智能管理系统

> 余音绕梁 — 面向音乐平台运营的后台智能管理系统，覆盖歌曲、歌手、歌单、用户全生命周期管理，内置 RBAC 权限体系、数据可视化看板、操作审计日志和推荐引擎。

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 (Composition API) + TypeScript | 3.4+ |
| 构建工具 | Vite | 5.3+ |
| UI 组件库 | Element Plus | 2.7+ |
| 可视化 | ECharts + Vue-ECharts | 5.5 / 6.7 |
| 状态管理 | Pinia + pinia-plugin-persistedstate | 2.1 |
| 路由 | Vue Router | 4.4 |
| HTTP 客户端 | Axios | 1.7 |
| CSS 方案 | SCSS + UnoCSS | — |
| 后端框架 | Spring Boot | 3.3.5 |
| 安全 | Spring Security + JWT (jjwt 0.12) | 6.x |
| ORM | MyBatis-Plus + XML Mapper | 3.5.7 |
| 数据库 | MySQL | 8.0 |
| 缓存 | Redis（缓存三件套 + 秒杀扣库存） | 7 |
| API 文档 | SpringDoc OpenAPI (Swagger) | 2.6 |
| 工具库 | Hutool / Lombok / EasyExcel | 5.8 / 1.18 / 3.3 |
| Java | JDK | 21 |

---

## 项目结构

```
music_sys/
├── sql/
│   ├── music_sys.sql                     # 完整建表 + 种子数据（16 张表）
│   └── seckill.sql                       # 秒杀模块建表（seckill_activity）
├── admin-ui/                             # 前端 Vue3 项目
│   ├── src/
│   │   ├── api/
│   │   │   ├── request.ts                # Axios 实例、Mock 适配、JWT 注入
│   │   │   └── modules/                  # 9 个 API 模块
│   │   ├── components/                   # AppLayout / SidebarNav / PageHeader / SearchBar / StatCard
│   │   ├── composables/                  # useTable / useModal / useExport / useMounted
│   │   ├── mock/                         # 全量 Mock 数据（开发期可脱离后端运行）
│   │   ├── router/                       # 路由配置 + 权限守卫
│   │   ├── stores/                       # user / app / permission（Pinia）
│   │   ├── styles/                       # variables.scss / global.css / element-override.css
│   │   ├── types/                        # TypeScript 类型定义 + 枚举常量
│   │   ├── utils/                        # Token / Date / Debounce 等工具函数
│   │   └── views/                        # 10 个页面
│   ├── .env.development                  # 开发环境变量
│   ├── vite.config.ts                    # Vite 配置 + API 代理
│   └── uno.config.ts                     # UnoCSS 主题色
├── music-sys-server/                     # 后端 Spring Boot 多模块项目
│   ├── music-sys-common/                 # 公共模块：R 统一响应、BizException、全局异常处理
│   ├── music-sys-model/                  # 数据模型：16 个 Entity + DTO + VO
│   ├── music-sys-mapper/                 # 数据访问：11 个 Mapper 接口 + XML 映射
│   ├── music-sys-service/                # 业务逻辑：9 个 Service（含推荐引擎管道）
│   ├── music-sys-web/                    # Web 层：Controller、Security、AOP、Config
│   └── pom.xml                           # 父 POM（多模块聚合）
└── README.md
```

---

## 功能模块

### 仪表盘
- 总览统计卡片：曲库总量 / 合作艺人 / 歌单总量 / 注册用户
- 热门歌曲 TOP10 排行（支持跳转完整榜单）
- 音乐风格播放量分布（8 种风格 × 多色柱状图）
- 平台营销数据总览：有效播放量 / 播放时长 / 收藏 / 评论 / 分享 / 新增用户
- 数据看板子页：播放趋势折线图 + 用户增长柱状图

### 歌手管理
- 分页列表 + 关键词 / 风格 / 认证状态筛选
- 新增 / 编辑 / 删除歌手
- 认证状态流转：入驻中 → 待认证 → 已认证
- 本地上传头像 + 网络图片链接
- 自动关联未命名歌曲、自动计算作品数
- CSV 导出

### 歌曲管理
- 分页列表 + 多条件筛选（关键词 / 风格 / 审核状态）
- 新增 / 编辑 / 删除歌曲
- 本地上传封面图 + 音频文件
- **审核工作流**：待审核 → 审核通过 / 驳回 → 上架 / 下架
- 批量操作：批量审核、批量上架、批量下架
- 重新提交审核
- ISRC 编码管理
- CSV 导出

### 歌单管理
- 分页列表 + 类型 / 状态筛选
- 新增 / 编辑 / 删除歌单
- 本地上传封面图，创建者自动关联当前管理员
- 审核流程：待审核 → 通过 → 发布 / 驳回
- 置顶 / 取消置顶
- 歌单内歌曲管理：添加 / 移除（按风格筛选曲库）
- 官方歌单 & 用户歌单分类

### 用户管理
- 分页列表 + 用户类型 / 状态筛选
- 新增 / 编辑 / 删除终端用户
- 启用 / 禁用账号
- 本地上传头像，初始密码设置
- 用户类型：普通用户 / VIP 会员 / 音乐人

### 数据看板
- 播放趋势（近 7 天 / 30 天，按风格对比）
- 用户增长统计（新增 vs 活跃）
- 热门歌曲排行
- 总览统计

### 操作日志
- 管理员操作全记录（登录 / 新增 / 编辑 / 删除 / 审核 / 导出）
- 分页 + 操作类型 / 模块 / 结果筛选
- 操作详情 & 请求参数快照
- CSV 导出

### 个人中心
- 个人信息查看 & 编辑（姓名 / 工号 / 部门 / 职务 / 邮箱 / 手机）
- 头像更换（文字头像颜色选择器 / 网络图片链接）
- 修改密码
- 账号安全信息（最后登录 IP、时间）

### 秒杀模块
- 限量数字专辑秒杀：Redis Lua 原子预扣 + DB 乐观扣减（`WHERE stock > 0`）双层防超卖
- `setnx` 幂等：同一用户同一活动只允许成功一次
- Redis 不可用时自动降级直查 / 直扣 DB，核心流程不断

---

## RBAC 权限模型

采用 **用户 — 角色 — 权限** 三级模型：

| 角色 | 编码 | 权限范围 |
|------|------|---------|
| 超级管理员 | `admin` | 系统全部权限 |
| 内容编辑 | `editor` | 歌手 / 歌曲 / 歌单 CRUD + 仪表盘 / 数据 / 用户查看 |
| 审核员 | `auditor` | 歌曲审核 + 歌单审核 + 仪表盘 / 数据查看 |

- 前端：路由按 `meta.perm` 过滤，侧边栏菜单按权限显示
- 后端：Spring Security Filter 链 + `@OperationLog` AOP 自动记录操作

---

## 数据库设计

共 **17 张表**，分为六大模块：

| 模块 | 表名 | 说明 |
|------|------|------|
| 权限 | `sys_user` / `sys_role` / `sys_permission` / `sys_user_role` / `sys_role_permission` | RBAC 五表 |
| 业务 | `singer` / `song` / `song_copyright` / `playlist` / `playlist_song` | 核心业务 |
| 用户 | `app_user` / `user_favorite` | 终端用户 |
| 统计 | `song_play_stat` / `style_play_stat` | 数据统计 |
| 日志 | `operation_log` / `recommendation_log` | 审计 & 推荐 |
| 秒杀 | `seckill_activity` | 秒杀活动库存 |

**种子数据**：5 位管理员 · 30 位歌手 · 60 首歌曲 · 20 个歌单 · 50 个终端用户 · 30 条操作日志 · 8 种风格 7 天播放统计。

---

## 缓存与并发设计

### Redis 缓存三大问题（落地于歌曲详情）

| 问题 | 场景 | 方案 |
|------|------|------|
| 缓存穿透 | 查询不存在的歌曲 id | 空值缓存：结果为 null 时写 `__NULL__` 标记，短过期 60s |
| 缓存击穿 | 热点歌曲 key 过期瞬间大量并发回源 | setnx 互斥锁：只放一个线程回源 DB，其余自旋等待 |
| 缓存雪崩 | 大量 key 同一时刻集中过期 | 随机过期：实际 TTL = 基础 1800s + 随机偏移 |

- 封装 `CacheService.getWithCache()` 通用模板，统一处理三件套 + Redis 异常降级（Redis 挂掉自动直查 DB）
- 写操作（新增 / 编辑 / 删除 / 审核 / 上下架）后主动 `evict` 删除缓存，保证一致性

### 秒杀防超卖（双层保障）

```
用户请求 → ① Redis Lua 原子预扣库存（< 0 直接拒绝，拦截 99% 请求）
               ↓
           ② DB 乐观扣减 WHERE stock > 0（影响行数 = 0 售罄，回补 Redis）
               ↓
           下单成功
```

- **第一层**：Lua 脚本 `get` + `decr` 原子执行，消除「查库存 → 扣库存」两步之间的并发窗口
- **第二层**：`UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock > 0` 乐观锁兜底，Redis 与 DB 短暂不一致也不会超卖
- **幂等**：`setnx` 记录「用户 × 活动」下单标记，同一用户重复下单直接拒绝
- **降级**：Redis 不可用时跳过预扣，直接走 DB 乐观扣减，核心流程不断

### 压测结果（自写 benchmark.py 复现）

| 指标 | 结果 |
|------|------|
| 歌曲详情接口响应 | 冷缓存 28ms → 热缓存 20ms |
| 缓存命中率 | 99.9% |
| 热缓存 QPS | 794 req/s |
| 秒杀并发 | 200 并发抢 100 库存，成功 100 单、DB 库存归零、无超卖 |

> 复现方式：`python benchmark.py`（见仓库根目录），压测前需启动 Redis + MySQL + 后端。

### 踩坑记录

**秒杀超卖 bug**：最初实现是「先查库存 → 判断 → 再扣减」，200 并发下库存被扣成负数。排查发现是并发下「查」和「改」两步之间的竞态窗口导致。改成 Redis Lua 脚本把 `get + decr` 做成原子操作，再加 DB 乐观锁 `WHERE stock > 0` 兜底，压测后 200 并发无超卖。这件事让我明白：并发问题不能靠猜，要靠压测数据说话。

---

## 快速启动

### 环境要求

- **JDK 21**
- **MySQL 8.0+**
- **Node.js 18+**（npm 9+）
- **Maven 3.9+**

### 1. 初始化数据库

```bash
mysql -uroot -p < sql/music_sys.sql
```

默认创建数据库 `music_sys`，字符集 `utf8mb4`，含完整种子数据。

### 2. 启动后端

> **本地开发**：`application-local.yml` 已含本地数据库密码（不提交 git）。用 `mvn spring-boot:run -Dspring-boot.run.profiles=dev,local`，或打包后 `java -jar ... --spring.profiles.active=dev,local`，无需设 `MYSQL_PASSWORD` 环境变量。

**PowerShell：**

```powershell
$env:JAVA_HOME = "D:\path\to\jdk21"   # 替换为你的 JDK21 路径
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
java -version                    # 确认输出 openjdk version "21.0.x"

cd music-sys-server
mvn clean package -DskipTests
java -jar music-sys-web\target\music-sys-web-1.0.0-SNAPSHOT.jar
```

**CMD：**

```cmd
set JAVA_HOME=D:\path\to\jdk21
set PATH=%JAVA_HOME%\bin;%PATH%
java -version

cd music-sys-server
mvn clean package -DskipTests
java -jar music-sys-web\target\music-sys-web-1.0.0-SNAPSHOT.jar
```

后端默认监听 `http://localhost:8080`，Swagger 文档：`http://localhost:8080/swagger-ui.html`。

### 3. 启动前端

```bash
cd admin-ui
npm install
npm run dev
```

前端默认监听 `http://localhost:5173`，Vite 自动代理 `/api` 到后端 `:8080`。

> 在 `.env.development` 中设置 `VITE_USE_MOCK=true` 可脱离后端独立运行（使用 mock 数据）。

### 4. 登录

| 账号 | 密码 | 角色 |
|------|------|------|
| `zhangmingyuan` | `admin123` | 超级管理员 |
| `wangxiaohua` | `admin123` | 内容编辑 |
| `lishenwei` | `admin123` | 审核员 |

---

## API 接口概览

**统一响应格式**：`{ code: 200, msg: "success", data: T }`

**认证方式**：Bearer Token（JWT），登录获取，请求头 `Authorization: Bearer <token>`，有效期 24 小时。

| 前缀 | 端点数 | 说明 |
|------|:---:|------|
| `/api/auth/*` | 3 | 登录 / 登出 / 用户信息 |
| `/api/dashboard/*` | 3 | 仪表盘概览 / 热门歌曲 / 风格分布 |
| `/api/singers/*` | 7 | 歌手 CRUD + 头像上传 + 导出 |
| `/api/songs/*` | 14 | 歌曲 CRUD + 封面上传 / 音频上传 + 审核工作流 + 批量操作 + 导出 |
| `/api/playlists/*` | 10 | 歌单 CRUD + 封面上传 + 审核 + 置顶 + 歌曲管理 |
| `/api/users/*` | 8 | 终端用户 CRUD + 头像上传 + 状态管理 |
| `/api/data/*` | 4 | 播放趋势 / 用户增长 / 热门歌曲 / 总览 |
| `/api/logs/*` | 3 | 操作日志列表 / 导出 / 统计 |
| `/api/system/*` | 3 | 个人资料 / 修改密码 / 偏好设置 |
| `/api/recommend/*` | 3 | 推荐策略 / 推荐日志 / 推荐效果 |
| `/api/seckill/*` | 2 | 秒杀下单 / 活动详情（已放行无需登录） |

---

## 开发模式

### Mock 模式（前端独立开发）

```bash
# .env.development
VITE_USE_MOCK=true
```

启用后所有 API 请求由前端 mock 拦截返回，无需启动后端。Mock 数据覆盖全部 9 个 API 模块。

### 联调模式

```bash
# .env.development
VITE_USE_MOCK=false
```

前端通过 Vite proxy 将 `/api` 代理到 `http://localhost:8080`，直连后端真实数据。同时支持文件上传代理。

---

## 主题定制

系统主题色统一为 **#589286**（青瓷绿），可通过以下文件修改：

| 文件 | 作用 |
|------|------|
| `admin-ui/src/styles/variables.scss` | CSS 变量定义 |
| `admin-ui/src/styles/global.css` | Element Plus 组件覆盖 |
| `admin-ui/src/styles/element-override.css` | 组件级样式覆盖 |
| `admin-ui/uno.config.ts` | UnoCSS 原子类主题色 |

---

## 部署

```bash
# 前端构建
cd admin-ui && npm run build       # 产出 dist/

# 后端打包
cd music-sys-server && mvn clean package -DskipTests  # 产出 Fat JAR

# Nginx 反向代理
# /api/*  → proxy_pass http://localhost:8080
# /*      → root /path/to/admin-ui/dist
```

---

## 设计文档

完整设计方案见项目根目录 `reademe` 文件，包含：
- ER 核心关系图
- 16 张表详细字段说明
- REST API 全部端点定义（40+ 端点）
- 前端组件结构与交互设计
- 推荐引擎策略管道设计
- 部署架构图

---

**曲不离库 · 余音绕梁** — 音乐库后台智能管理系统
