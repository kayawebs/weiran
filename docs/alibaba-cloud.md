# 阿里云资源清单

本项目不使用 MinIO 或 S3 兼容服务。当前阶段只使用阿里云 OSS；PostgreSQL、Redis、API 与 Worker 均通过 Docker Compose 部署。

| 服务 | 用途 | 关键配置 |
|---|---|---|
| OSS | 原始上传与处理结果 | 私有 Bucket；区域写入 `OSS_REGION`，名称写入 `OSS_BUCKET` |
| ECS | Docker Compose 宿主机 | 运行 PostgreSQL、Redis、迁移、API 与 Worker；与 OSS 同地域时可填 `OSS_INTERNAL_ENDPOINT` |

## OSS RAM 最小权限

为 API/Worker 建立独立 RAM 用户或 RAM 角色，不使用主账号 AccessKey。策略仅需允许当前 Bucket 的 `uploads/` 与 `results/` 前缀执行 `oss:PutObject`、`oss:GetObject`；不要授予 `oss:CreateBucket`、`oss:DeleteBucket` 或全账号通配权限。

小程序永远不持有 RAM AccessKey。API 对单一对象键签发短时 POST Policy，Policy 同时限制上传大小；结果下载使用短时签名 URL。

## OSS Bucket 配置

- Bucket ACL 设为**私有**。
- 配置生命周期规则：例如上传原件与处理结果 7 天后自动删除。
- 在小程序后台把 `https://{bucket}.{region}.aliyuncs.com` 加入 `uploadFile`、`downloadFile` 合法域名。
- 如使用 OSS 自定义域名，配置 HTTPS 证书和小程序合法域名；当前代码默认签发标准 OSS 公网域名。
- 在 OSS 跨域规则中仅放行实际使用的 HTTPS 域名和所需方法，不使用 `*`。
