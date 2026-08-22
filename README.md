# 未然Lab · AI Creator Tools Platform

面向 AI 创作者和自媒体工作流的素材处理基础设施。当前同时提供微信小程序与中英文响应式 Web App；客户端共享 Task、Worker、PostgreSQL、Redis 和阿里云 OSS 能力，不把下载或处理逻辑绑定到某个产品入口。

项目采用单主干双区域构建：国内部署中文 Web + 微信小程序，海外部署英文 Web；两地使用相同后端代码，但数据库、Redis、OSS 和用户身份独立。完整决策见 [双区域架构](docs/multi-region-architecture.md)。

详细的架构、服务拆分、数据模型、接口、状态机、Worker 和小程序结构见 [架构设计](docs/architecture.md)。新版 Web 信息架构、竞品分析和广告边界见 [Web 站点地图](docs/web-information-architecture.md)。

## 已实现范围

- 统一异步任务模型：`SOURCE_DOWNLOAD`、`IMAGE_WATERMARK_REMOVE`、`VIDEO_WATERMARK_REMOVE`
- Docker PostgreSQL 任务/资产/事件审计模型，Docker Redis + BullMQ 重试队列，阿里云 OSS 私有存储
- 图片水印区域：OpenCV inpaint 或模糊处理；视频按来源平台选择解析策略
- Dola、Dreamina / CapCut、即梦 / Seedance、抖音：粘贴公开作品链接；抖音还支持整段分享文案。后端同步解析无水印视频并返回 Redis 随机短票据预览/下载链接，扫描阶段不下载、不写 OSS、不重编码
- 受控的 HTTPS 素材解析与下载（来源/媒体主机白名单、私有网络阻断、重定向与体积限制）
- 可插拔 `SourceExtractor` 与平台定义，后续可继续增加内容平台 connector
- 原生微信小程序：首页、工具分类、平台选择、URL 提交、多视频结果预览与保存
- 中英文响应式 Web App：四类工具地图、平台专属 URL、目录搜索、多平台视频解析、图片拖拽框选、任务结果和浏览器历史，适配 PC 和 Mobile
- 微信登录：`wx.login → code2Session → JWT`；用户 ID 不再由客户端请求头提供
- Web 匿名登录：服务端签发受限 JWT；API 跨域白名单与全局限流可通过环境变量配置
- 区域构建：`cn` 输出中文 Web，`global` 输出英文 Web；Global 可配置 AdSense，国内继续通过独立广告 Adapter 接入本地平台
- Docker Compose 启动 PostgreSQL、Redis、数据库迁移、API、Worker 与 Web/Nginx；对象存储使用阿里云 OSS

## 本地启动

1. 准备后端与 Docker Compose 的服务器环境文件：

   ```bash
   cp .env.example .env
   ```

2. 根目录 `.env` 只供后端、Worker 和 Docker Compose 使用。在其中配置阿里云 OSS Bucket、RAM AccessKey、微信小程序 `AppID/AppSecret`，并将 `POSTGRES_PASSWORD` 改为强密码；生产环境还必须关闭 `ALLOW_INSECURE_DEV_AUTH`。该文件不会进入 Web 镜像或浏览器。

3. 启动应用和迁移：

   ```bash
   docker compose up --build
   ```

4. 打开 Web：`http://localhost:8080`；API 健康检查：`http://localhost:3000/health`。

本地不用 Docker 时，需先自行启动 PostgreSQL、Redis，并配置可访问的阿里云 OSS，再依次执行：

```bash
npm install
npm run migrate
npm run dev:api
npm run dev:worker
npm run dev:web
```

Vite 开发服务器默认在 `http://localhost:5173`，并已将 `/api` 代理到本地 API。Web 自己的环境文件是 `apps/web/.env.local` 或构建参数，其中只能出现可公开的 `VITE_*` 配置；默认只需 `VITE_API_BASE_URL=/api`。微信密钥、JWT 密钥、OSS AccessKey、数据库密码等服务器秘密严禁写入 Web 环境文件。正式部署由内置 Nginx 将同域 `/api/*` 转发给 API，无需将 API 端口暴露到公网。

## API 快速示例

小程序启动时通过 `wx.login` 获取 code 并调用 `POST /v1/auth/wechat`，得到 JWT。图片任务先通过 OSS 上传接口取得 `assetId`；平台原画发现属于同步查询，不创建异步 Task。

图片去水印：

```json
POST /v1/tasks
{
  "taskType": "IMAGE_WATERMARK_REMOVE",
  "input": {
    "sourceAssetId": "a4c5eab2-3be1-4e04-a4f2-54a1c2137a71",
    "regions": [{ "x": 0.72, "y": 0.86, "width": 0.2, "height": 0.08 }],
    "mode": "inpaint"
  }
}
```

平台视频原画解析（`platform` 可取 `dola`、`dreamina`、`jimeng` 或 `douyin`）：

```json
POST /v1/sources/resolve
{
  "platform": "dola",
  "url": "https://www.dola.com/thread/xL02pFHSUcQEQa3ME"
}
```

接口直接返回 `videoCount` 与 `videos[]`。每个视频包含短期 `previewPath` 和 `downloadPath`；浏览器只获得随机短票据，完整源 CDN URL 与请求头在 Redis 中保存 15 分钟。用户点击后由 `GET /v1/source-media/:ticket` 按需流式转发。图片去水印等耗时、需要持久化结果的操作仍返回 `202` Task，并在成功后通过 OSS 短期链接交付。

抖音可直接提交 App 复制出的整段分享内容。结果中的 `downloads[]` 还会列出真实存在的备用画质与原始 MP3；解析器只采用公开详情中的播放流，不使用带水印的下载地址。

开发环境会默认创建本地测试用户。部署生产前，必须关闭 `ALLOW_INSECURE_DEV_AUTH` 并配置 JWT；国内部署还需要微信凭证与小程序合法域名。两地都要将 API CORS、OSS 跨域规则配置为各自的实际 HTTPS 域名。

## Web App

网页入口位于 `apps/web`，路由包括：

- `/`：未然Lab 品牌首页、四大工作区和当前可用工具
- `/tools`：可搜索的完整工具目录，明确区分可用与开发中
- `/download`、`/image`、`/video`、`/creator`：素材下载、图片、视频、创作辅助工作区
- `/download/dola`：扫描公开 Dola Thread，并在同页预览或下载全部源视频
- `/download/dreamina`：解析公开 Dreamina / CapCut AI Work Detail 原始视频
- `/download/jimeng`：解析公开即梦 / Seedance 分享页或 Work Detail 原始视频
- `/download/douyin`：从短链接、完整视频 URL 或整段复制文案提取抖音无水印视频、备用画质与原始 MP3
- `/download/:platform`：每个 AI 应用的稳定专属页面；Extractor 未上线前显示开发中并设置 `noindex`
- `/image/watermark-remover`：上传图片并用鼠标或触控拖拽水印区域
- `/tasks/:id`：轮询任务、预览并下载全部结果
- `/history`：当前浏览器匿名身份下的最近任务
- `/privacy`、`/terms`、`/disclaimer`：广告与公开运营所需的基础规则页面

生产构建会按区域域名自动生成 `sitemap.xml` 与 `robots.txt`。旧路由 `/tools/video` 和 `/tools/image` 保留为重定向，避免已有链接失效。

Web 首次调用后端时自动获取匿名 JWT，JWT 由后端签发，Web 不持有签名密钥。任务历史绑定该浏览器中的令牌；清除站点数据后不会自动找回旧匿名身份，后续可在不改变 Task API 的前提下增加邮箱或 OAuth 登录。

阿里云服务器的完整 HTTPS、OSS CORS 和上线步骤见 [Web 部署说明](docs/web-deployment.md)。

## 国内与海外构建

本地预览：

```bash
npm run dev:web:cn      # 中文 Web
npm run dev:web:global  # 英文 Web
```

生产构建：

```bash
npm run build:web:cn
npm run build:web:global
```

服务器使用 `deploy/cn.env.example` 或 `deploy/global.env.example` 作为模板。Global 服务器运行 `./deploy/init-global-env.sh` 即可一次性生成 JWT 与 PostgreSQL 强密码；脚本不会覆盖已有配置，之后只需填写 `deploy/global.env` 的 `OSS_*` 字段。广告未开通时保持 `WEB_AD_PROVIDER=none`；AdSense 审核通过后设置 `WEB_AD_PROVIDER=adsense`、公开的 Client ID 与各广告位 ID。不要创建长期 `cn` / `global` Git 分支；区域差异通过配置、文案目录和广告 Adapter 管理。

## 微信小程序

在微信开发者工具导入 `apps/miniprogram`。当前项目显示名为“未然Lab”，并已配置 AppID `wxa5c763c97869a2aa`；小程序原始 ID 为 `gh_476d3d7733d7`。将 [app.js](apps/miniprogram/app.js) 中 `apiBaseUrl` 改为已备案的 HTTPS API 域名，并在小程序后台添加 request 合法域名，以及 OSS 域名的 uploadFile、downloadFile 合法域名。

小程序采用“首页 / 工具 / 我的”三 Tab 架构：首页呈现未然Lab 的 AI 创作者工具平台定位和分类；图片、视频去水印属于“素材处理”分类。视频页不再上传视频或填写水印坐标，而是选择平台并粘贴公开 URL；当前启用 Dola、Dreamina / CapCut、即梦 / Seedance 与抖音，抖音支持直接粘贴整段分享文案，后台按平台返回一个或多个原始视频。素材获取、字幕、封面、格式转换等能力以未启用工具预留，不包含资讯、AI 情报、社区、会员或支付。AI 情报媒体应作为公众号、网站和短视频渠道的独立系统运营。用户应只处理拥有或已获授权使用的媒体；各来源 connector 还应遵守相应平台的条款与版权限制。

## 扩展新工具

- 新媒体来源：在 `apps/backend/src/modules/extractor/` 实现 `SourceExtractor` 并在 Worker registry 注册。
- 新处理工具：为任务类型补充 Zod 输入 schema、Task handler 和对应小程序/Web 包装；不要绕开 Task 模块直接调用 FFmpeg/OpenCV。
- 负载增长：按 `media-cpu`、`media-gpu`、`source-download` 拆分队列和 Worker，不需要改变客户端 API。
