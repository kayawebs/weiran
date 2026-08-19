# 未然Lab 双区域架构

## 结论

国内版和海外版使用同一个 Git 主干、同一套业务模块、同一个后端镜像，不建立长期存在的 `cn` / `global` 分支。区域差异通过明确的适配层和部署配置完成。

```text
                         one main branch
                               │
                    shared Task / Worker code
                               │
             ┌─────────────────┴─────────────────┐
             │                                   │
     China deployment                    Global deployment
     DEPLOYMENT_MARKET=cn                DEPLOYMENT_MARKET=global
             │                                   │
   Chinese Web + Mini Program                 English Web
             │                                   │
   CN API / Worker / PG / Redis         Global API / Worker / PG / Redis
             │                                   │
       China OSS bucket                    Overseas OSS bucket
             │                                   │
  CN Web ads / WeChat ads                 Global Web ad adapter
```

两套部署之间不共享数据库、Redis、任务队列、OSS Bucket 或用户身份。这样可以避免跨境延迟、数据驻留和单区域故障互相影响。当前匿名 Web 历史和微信小程序历史也不会跨区域同步。

## 为什么不用区域 Git 分支

长期维护 `cn` 与 `global` 分支会让每次功能、Bug 修复和安全更新都需要合并两次，并逐渐出现能力不一致。Git 分支只用于短期功能开发和代码评审；区域是部署维度，不是代码版本维度。

推荐发布规则：

1. 功能合并到 `main`。
2. 同一个 commit 构建一个共享 Backend 镜像。
3. 同一个 commit 分别构建 `web:<commit>-cn` 和 `web:<commit>-global`。
4. 先部署预发布环境，通过后分别发布到国内和海外。
5. 用同一 Git tag 标记同一批功能，例如 `v0.2.0`，两地可独立决定上线时间。

## 代码边界

```text
apps/
  backend/                   # 完全共享的 API、Task、Extractor、Processor、Worker
  web/
    src/config/market.ts     # cn/global、品牌名和公开广告配置
    src/i18n/copy.ts         # 中文与英文产品文案
    src/ads/AdSlot.tsx       # Web 广告平台适配器注册表
    src/pages/               # 完全共享的页面与业务交互
  miniprogram/
    config/market.js         # 国内小程序公开配置
    components/ad-slot/      # 微信广告适配边界
deploy/
  cn.env.example             # 国内服务器模板
  global.env.example         # 海外服务器模板
```

页面不得直接判断广告平台，也不应在页面中判断 `cn/global`。页面只读取集中式文案并使用语义广告位，如 `home-footer`、`tools-inline`、`result-footer`。

## Web 区域构建

国内 Web：

```bash
npm run build:web:cn
```

海外 Web：

```bash
npm run build:web:global
```

构建参数会同时决定 HTML 语言、SEO 标题、界面文案和广告适配配置。Web 环境中只能包含 `VITE_*` 公开值；微信 AppSecret、JWT Secret、OSS Secret 和数据库密码永远只能留在服务器环境。

## 后端区域行为

Backend 使用同一份代码和镜像。`DEPLOYMENT_MARKET` 只处理真正的区域运行差异：

- `/health` 和 `/v1/capabilities` 暴露当前区域，便于监控和排查错误部署。
- `cn` 正式环境要求配置微信凭证，因为它服务微信小程序。
- `global` 正式环境不要求微信凭证，仅保留 Web 匿名 JWT。
- 任务类型、API、Worker、Extractor、Processor 完全一致。

如果未来某个工具因法规或上游平台限制只能在一个区域提供，应在 Capability/Policy 层关闭能力，不复制 Task handler。

## 广告适配

广告分成两个客户端边界：

### Web

业务页面只渲染 `AdSlot`。当前内置：

- `none`：默认值，不渲染、不占位。
- `house`：用于联调插槽的自有推广样式。

确定平台后，为国内 Web 和海外 Web 分别新增 Ad Adapter，例如各自负责加载 SDK、渲染广告、错误降级和用户同意状态。广告 Client ID、Slot ID 通常是公开值，可来自区域构建配置；平台服务端密钥必须放入后端，并通过专门的服务端接口使用。

### 微信小程序

小程序页面只使用 `ad-slot` 组件。将 `apps/miniprogram/config/market.js` 的 provider 改为 `wechat` 并填写公开的广告单元 ID 后，组件才会渲染微信原生 `<ad>`；加载错误会自动隐藏。小程序广告逻辑不会进入海外 Web 包。

不同区域的广告适配器需要分别处理隐私同意、未成年人规则、Cookie/跟踪授权和平台审核要求，不应在共享页面中混写这些规则。

## 两套基础设施

| 项目 | 国内 | 海外 |
|---|---|---|
| 客户端 | 中文 Web + 微信小程序 | 英文 Web |
| Backend 镜像 | 相同 | 相同 |
| 数据库/Redis | 国内独立实例 | 海外独立实例 |
| OSS | 国内 Bucket/地域 | 海外 Bucket/地域 |
| 微信认证 | 启用 | 不配置 |
| Web 匿名 JWT | 启用 | 启用 |
| 广告 | 国内 Web Adapter + 微信广告 | 海外 Web Adapter |
| 域名/HTTPS | 国内域名、备案与微信合法域名 | 海外域名与当地合规 |

## 部署命令

国内服务器：

```bash
cp deploy/cn.env.example deploy/cn.env
# 编辑 deploy/cn.env 中的服务端秘密
docker compose --env-file deploy/cn.env up -d --build
```

海外服务器：

```bash
cp deploy/global.env.example deploy/global.env
# 编辑 deploy/global.env 中的服务端秘密
docker compose --env-file deploy/global.env up -d --build
```

`COMPOSE_PROJECT_NAME` 已分别设置为 `weiran-cn` 与 `weiran-global`，容器网络和数据卷不会重名。正式环境推荐使用两台不同地域的服务器；如果临时在同一台测试机同时运行两套，还必须把其中一套的 `WEB_PORT` 和 `API_PUBLIC_PORT` 改为不同端口。
