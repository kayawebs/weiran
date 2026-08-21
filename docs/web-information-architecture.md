# 未然Lab Web 信息架构与竞品策略

## 定位

未然Lab 是面向 AI 创作者的功能型小工具集合。素材下载是顶层能力之一，不是整个品牌。网站不复制下载站的单一定位，也不把微信小程序变成资讯产品。

顶层工作区固定为：

1. 素材下载与提取（Download & Extract）
2. 图片工具（Image Tools）
3. 视频工具（Video Tools）
4. 创作辅助（Creator Utilities）

所有工具共享身份、Task、Redis、PostgreSQL、OSS、媒体代理、错误边界和广告 Adapter。每个工具仍拥有独立、稳定、可分享的页面 URL。

## SaveVideoRaw 公开页面分析（2026-08-21）

竞品使用了典型的工具站增长模型：

- 首页提供一个自动识别平台的通用输入框。
- 即梦、CapCut、豆包、Dola、Vibes、TikTok、抖音、小红书、快手、Facebook、Spotify、SoundCloud 等各自拥有专属落地页。
- 单个平台页面使用同一内容模板：首屏工具、版权提示、平台介绍、步骤教程、优势、相关工具、FAQ、再次调用按钮。
- 衍生出批量 ZIP、Dola 图片提取、Gemini 图片水印清理等任务型页面。
- 通过教程文章覆盖“平台名 + 下载 + 无水印”等搜索长尾词。

公开页面可以观察到四类变现：

1. Google AdSense 广告脚本与广告 iframe。
2. Ko-fi 捐赠入口与二维码赞助。
3. Sponsored By 赞助商链接。
4. 主机等服务的联盟推广链接。

它的优势是页面意图清晰、长尾覆盖广、工具入口位于首屏、无需登录；不足是品牌几乎完全绑定“下载”，页面内容很长且重复，赞助与目录徽章较杂，部分非 AI 音乐/社交下载能力会放大版权和平台规则风险。

未然Lab 借鉴其“专属页面 + 清晰首屏 + 相关工具”的产品模型，不复制其文案、代码和无边界的平台扩张。

## 新站点地图

```text
/
├── /tools                         全部工具与搜索
├── /download                      素材下载与提取
│   ├── /download/dola             已上线
│   ├── /download/jimeng           专属页面，Connector 待上线
│   ├── /download/dreamina
│   ├── /download/doubao
│   ├── /download/vibes
│   ├── /download/gemini-flow
│   ├── /download/sora
│   ├── /download/kling
│   ├── /download/hailuo
│   ├── /download/dola-images
│   ├── /download/batch
│   ├── /download/tiktok
│   ├── /download/douyin
│   ├── /download/xiaohongshu
│   └── /download/kuaishou
├── /image
│   ├── /image/watermark-remover   已上线
│   ├── /image/gemini-watermark-remover
│   ├── /image/background-remover
│   ├── /image/upscaler
│   └── /image/converter
├── /video
│   ├── /video/compressor
│   ├── /video/converter
│   ├── /video/trimmer
│   └── /video/audio-extractor
├── /creator
│   ├── /creator/subtitles
│   ├── /creator/cover-maker
│   └── /creator/aspect-ratio
├── /history
├── /tasks/:taskId
├── /privacy
├── /terms
└── /disclaimer
```

旧的 `/tools/video` 和 `/tools/image` 只做兼容重定向。

## SEO 和上线状态

- 可用工具、至少含一项可用工具的分类页、首页、目录页和规则页写入 `sitemap.xml`。
- 开发中页面提供真实的产品边界和稳定 URL，但设置 `noindex, follow`，不制造“已经可用”的假页面。
- 工具通过生产验证后，将状态改为 `live`，接入真实页面组件，并加入 `site-routes.ts`。
- 每页独立设置 title、description、canonical、Open Graph 和 robots。
- 下载类页面只处理公开且用户有权使用的素材，不承诺绕过访问控制。

## 广告架构

页面只渲染语义广告位：

- `home-inline`
- `directory-inline`
- `tool-top`
- `result-footer`
- `tool-bottom`

Global 部署可以选择 `adsense` Adapter；国内部署保留独立 Provider。SDK、账号 ID、广告位和同意管理不得进入工具业务组件。广告被拦截或尚未配置时，工具功能保持正常。

建议顺序：

1. 先完成隐私政策、条款、免责声明、站点地图和稳定内容。
2. 申请 AdSense 后再配置广告，不在审核前放空白假广告。
3. 首屏工具表单上方避免高干扰广告；优先目录中段、结果后和工具说明后。
4. 国内广告根据小程序与 Web 平台政策使用单独 Adapter 和配置。

## 功能接入优先级

1. Dola 图片提取：复用现有 Dola Thread 解析，改动最小。
2. 即梦 / Seedance、Dreamina / CapCut、豆包：与当前 AI 创作者定位最匹配。
3. 批量下载：建立在两个以上稳定 Connector 之后，使用客户端或 Worker 打包。
4. Gemini 可见水印清理：优先评估浏览器本地算法，减少服务器成本与隐私风险。
5. 视频压缩、格式转换、提取音频：复用 FFmpeg Worker，形成非下载类使用频次。
6. 字幕和封面：在媒体基础设施稳定后接入模型与模板系统。

Spotify、SoundCloud 等音乐下载不进入当前路线图；它们与 AI 创作者工具定位较弱，同时带来更高版权和平台规则风险。
