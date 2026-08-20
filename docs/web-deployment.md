# 未然Lab Web 部署（阿里云）

本文描述通用 Web HTTPS 部署。国内/海外双区域的代码边界、环境模板和发布策略见 [双区域架构](multi-region-architecture.md)。海外使用 `deploy/global.env.example`，国内使用 `deploy/cn.env.example`。

推荐用一个公网域名承载 Web 和 API：

```text
https://tools.example.com/       -> Web
https://tools.example.com/api/*  -> Backend API
Web browser -> Alibaba OSS       -> Direct upload / temporary download
Web browser -> Backend API       -> On-demand source media stream
```

Web、API、Worker、PostgreSQL 和 Redis 由 Docker Compose 运行。阿里云 OSS 继续作为私有对象存储。宿主机的 Nginx 或 Caddy 只负责公网 HTTPS，并将流量转发到 `127.0.0.1:8080`。

容器内 Nginx 已关闭 `/api/*` 响应缓冲并放宽流式传输超时，因此 Dola 预览/下载会边读取源站边返回客户端，不需要等完整视频落盘。若宿主机还套一层 Nginx，也应对该反向代理关闭 `proxy_buffering`，并保留 `Range` 请求头。

## 1. 域名与安全组

1. 给服务器绑定公网 IP，并添加域名 A 记录，例如 `tools.example.com`。
2. 安全组只开放 `22`、`80`、`443`；不要开放 PostgreSQL、Redis、`3000` 或 `8080`。
3. 如果服务器位于中国大陆，域名投入公开服务前需完成 ICP 备案；境外地域服务器通常不要求中国大陆 ICP，但域名、内容与目标市场仍需遵守当地要求。

## 2. Web 环境变量（公开配置）

Web 只接收公开的区域、API 与广告位配置。项目已经提供 `apps/web/.env.cn` 和 `apps/web/.env.global`，核心字段为：

```dotenv
VITE_API_BASE_URL=/api
VITE_MARKET=cn|global
VITE_WEB_AD_PROVIDER=none
```

正式 Docker 镜像也通过公开构建参数将它设为 `/api`。Web 不需要、也不得配置微信密钥、JWT 密钥、OSS AccessKey 或数据库密码。Vite 会把所有 `VITE_*` 值编译进浏览器 JavaScript，因此只能在这里放允许任何访客看到的配置。

## 3. 后端与 Docker Compose 环境变量（服务器秘密）

根目录 `.env.example` 是通用服务器配置模板，不是 Web 环境文件。双区域部署优先复制对应的 `deploy/*.env.example`；以下内容均属于服务器端配置：

```dotenv
NODE_ENV=production
DEPLOYMENT_MARKET=cn|global
TRUST_PROXY=true
CORS_ORIGINS=
ALLOW_INSECURE_DEV_AUTH=false
ENABLE_WEB_GUEST_AUTH=true
JWT_SECRET=<至少32字符的随机高强度密钥>
POSTGRES_PASSWORD=<数据库强密码>

# 仅国内部署需要
WECHAT_APP_ID=wxa5c763c97869a2aa
WECHAT_APP_SECRET=<微信小程序密钥>

OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=<私有Bucket名称>
OSS_ACCESS_KEY_ID=<RAM用户AccessKey>
OSS_ACCESS_KEY_SECRET=<RAM用户AccessKeySecret>
OSS_INTERNAL_ENDPOINT=https://oss-cn-hangzhou-internal.aliyuncs.com
```

区域服务器环境文件会挂载给迁移、API 和 Worker；Compose 只把明确列出的 `WEB_AD_*` 与 `DEPLOYMENT_MARKET` 作为公开构建参数交给 Web。Web 容器不会读取其他变量，服务器秘密不会进入前端构建产物。Web 与 API 同域时，`CORS_ORIGINS` 保持空值即可。

## 4. OSS 设置

Bucket 保持私有读写，并使用仅允许该 Bucket/前缀的 RAM 用户。浏览器会直传 OSS，因此在 OSS 控制台为 Bucket 添加跨域规则：

- 来源：`https://tools.example.com`
- 允许方法：`GET`、`POST`、`HEAD`
- 允许 Headers：`*`
- 暴露 Headers：`ETag`、`x-oss-request-id`
- 缓存时间：`600`

生产 API/Worker 在同地域 ECS 时，配置 `OSS_INTERNAL_ENDPOINT` 可让服务端下载和上传走内网；浏览器获得的签名地址仍由 SDK 使用公网 Endpoint。

海外模板默认将 `OSS_INTERNAL_ENDPOINT` 留空：非阿里云服务器、或与 Bucket 不同地域的 ECS 无法访问 OSS 内网 Endpoint，误填会导致 Worker 在上传阶段连接超时。Worker 对 8 MiB 以上文件使用分片上传，默认每片 1 MiB、并发 3、单请求超时 120 秒；可分别通过 `OSS_MULTIPART_THRESHOLD_BYTES`、`OSS_MULTIPART_PART_SIZE_BYTES`、`OSS_MULTIPART_PARALLEL` 和 `OSS_REQUEST_TIMEOUT_MS` 调整。

## 5. 启动全部容器

国内服务器在项目根目录执行：

```bash
cp deploy/cn.env.example deploy/cn.env
# 编辑 deploy/cn.env
docker compose --env-file deploy/cn.env up -d --build
```

海外服务器执行：

```bash
./deploy/init-global-env.sh
# 只编辑 deploy/global.env 中的 OSS_* 配置
docker compose --env-file deploy/global.env up -d --build
```

初始化脚本使用 OpenSSL 一次性生成 JWT Secret 和 URL 安全的 PostgreSQL 密码，将 `deploy/global.env` 权限设为 `600`，且在文件已存在时绝不覆盖。Global 版不需要微信凭证；完成初始化后，只需填写 OSS Bucket、地域、RAM AccessKey 和与服务器网络匹配的 OSS Endpoint。

启动后检查：

```bash
docker compose --env-file deploy/cn.env ps
# 海外服务器将 cn.env 替换为 global.env
curl http://127.0.0.1:8080/healthz
# Global 默认使用 3001；国内模板默认使用 3000
curl http://127.0.0.1:3001/health
```

Compose 会依次启动 PostgreSQL、迁移、Redis、API、Worker 和 Web。数据库与 Redis 数据分别保存在命名卷 `postgres-data`、`redis-data`。

## 6. 配置公网 HTTPS

宿主机 Nginx 示例：

```nginx
server {
  listen 80;
  server_name tools.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name tools.example.com;

  ssl_certificate /etc/letsencrypt/live/tools.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/tools.example.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

证书可以使用阿里云 SSL 证书或 Certbot。确认 `https://tools.example.com/healthz` 和 `https://tools.example.com/api/health` 均返回成功。

## 7. 微信小程序共用 API

将小程序 `apps/miniprogram/app.js` 的 API 地址设置为：

```text
https://tools.example.com/api
```

并在微信公众平台添加：

- request 合法域名：`https://tools.example.com`
- uploadFile 合法域名：OSS 公网域名或绑定的 OSS 自定义域名
- downloadFile 合法域名：`https://tools.example.com`，以及 OSS 公网域名或绑定的 OSS 自定义域名

## 8. 更新与回滚前准备

常规更新：

```bash
git pull --ff-only
docker compose --env-file deploy/cn.env up -d --build       # 国内
# 或 docker compose --env-file deploy/global.env up -d --build
docker compose --env-file deploy/cn.env ps
```

更新前备份 PostgreSQL，保留上一版本 Git commit，并检查 Worker 中是否仍有处理任务。数据库迁移容器是一次性任务；任何带破坏性的数据库变更都应单独评审和备份后执行。
