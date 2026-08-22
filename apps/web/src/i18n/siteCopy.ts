import { marketConfig } from "../config/market";

const en = {
  nav: { all: "All tools", download: "Download", image: "Image", video: "Video", creator: "Creator", history: "History" },
  home: {
    eyebrow: "A PRACTICAL AI CREATOR TOOLBOX",
    title: ["Get the asset.", "Fix the details.", "Keep creating."],
    description: "Focused utilities for downloading, cleaning, converting, and preparing AI creator media.",
    primary: "Explore all tools",
    secondary: "Download tools",
    categories: "TOOL MAP",
    categoriesTitle: "One platform, clear workspaces.",
    featured: "AVAILABLE NOW",
    featuredTitle: "Start with working tools.",
    platform: "PLATFORM PRINCIPLE",
    platformTitle: "Small tools. Shared infrastructure.",
    platformDescription: "Every tool uses the same authentication, task, storage, media delivery, and advertising boundaries. New capabilities become focused pages—not disconnected products."
  },
  directory: {
    eyebrow: "ALL CREATOR TOOLS",
    title: "Find the right tool, fast.",
    description: "Browse by workflow or search the complete Weiran Lab roadmap. Live tools are clearly separated from planned capabilities.",
    searchLabel: "Search tools",
    searchPlaceholder: "Search Dola, watermark, subtitles...",
    live: "LIVE",
    planned: "PLANNED",
    empty: "No tools match this search.",
    clear: "Clear search"
  },
  category: {
    directory: "All tools",
    live: "available",
    planned: "planned",
    availableTitle: "Available now",
    roadmapTitle: "On the roadmap"
  },
  sourceRouter: {
    eyebrow: "PASTE ANY SUPPORTED LINK",
    title: "Start with the link you already have.",
    description: "We identify the platform and take you to its dedicated workflow and copy-link guide.",
    label: "Public share link or copied share text",
    placeholder: "Paste a Dola, Jimeng, Douyin, TikTok, Xiaohongshu… link",
    submit: "Identify platform",
    hint: "Live downloads are clearly separated from connectors still in development.",
    invalid: "Paste a complete http or https link.",
    unsupported: "We do not recognize this platform yet. Browse the platform list below."
  },
  guide: {
    eyebrow: "COPY-LINK GUIDE",
    time: "ABOUT 30 SECONDS",
    formats: "EXPECTED LINK FORMATS",
    checks: "BEFORE YOU PASTE",
    legal: "Only download or process media you own or have permission to use. Platform interfaces and link formats can change."
  },
  moreTools: {
    eyebrow: "KEEP CREATING",
    title: "Try another creator tool.",
    description: "Move from acquiring a source to cleaning and preparing the next asset without leaving Weiran Lab.",
    all: "Explore all tools"
  },
  planned: {
    eyebrow: "DEDICATED TOOL PAGE",
    badge: "IN DEVELOPMENT",
    title: "This workspace is mapped and ready for its connector.",
    description: "The page, route, product boundary, and shared platform integration are in place. We will enable it after the extractor and delivery path pass production checks.",
    noFake: "We do not show a download form before the underlying connector works reliably.",
    browse: "Browse working tools",
    related: "RELATED TOOLS"
  },
  footer: {
    product: "Product",
    workspaces: "Workspaces",
    legal: "Legal",
    allTools: "All tools",
    privacy: "Privacy",
    terms: "Terms",
    disclaimer: "Disclaimer",
    tagline: "A modular toolbox for AI creators.",
    notice: "Only process media you own or are authorized to use."
  }
};

const zh: typeof en = {
  nav: { all: "全部工具", download: "素材下载", image: "图片", video: "视频", creator: "创作辅助", history: "记录" },
  home: {
    eyebrow: "面向 AI 创作者的实用工具集合",
    title: ["获取素材。", "处理细节。", "继续创作。"],
    description: "用于下载、清理、转换和准备 AI 创作者素材的专注型小工具。",
    primary: "浏览全部工具",
    secondary: "查看下载工具",
    categories: "网站工具地图",
    categoriesTitle: "一个平台，清晰的工作区。",
    featured: "当前可用",
    featuredTitle: "从已经可用的工具开始。",
    platform: "平台原则",
    platformTitle: "小工具，共享基础设施。",
    platformDescription: "所有工具共享登录、任务、存储、媒体传输和广告边界。新增能力会成为专属页面，而不是彼此割裂的产品。"
  },
  directory: {
    eyebrow: "全部创作者工具",
    title: "快速找到合适工具。",
    description: "按工作流浏览或搜索未然Lab 的完整工具规划。已上线和开发中的能力会明确区分。",
    searchLabel: "搜索工具",
    searchPlaceholder: "搜索 Dola、去水印、字幕……",
    live: "可使用",
    planned: "开发中",
    empty: "没有匹配的工具。",
    clear: "清除搜索"
  },
  category: {
    directory: "全部工具",
    live: "项可使用",
    planned: "项开发中",
    availableTitle: "当前可用",
    roadmapTitle: "后续规划"
  },
  sourceRouter: {
    eyebrow: "粘贴任意已支持链接",
    title: "从您已经复制的链接开始。",
    description: "系统会识别来源平台，并带您进入对应的专属工作区和链接获取指引。",
    label: "公开分享链接或复制的整段分享文案",
    placeholder: "粘贴 Dola、即梦、抖音、TikTok、小红书等链接",
    submit: "识别平台",
    hint: "已上线下载能力与仍在开发的连接器会明确区分。",
    invalid: "请粘贴完整的 http 或 https 链接。",
    unsupported: "暂时无法识别该平台，请从下方平台列表中选择。"
  },
  guide: {
    eyebrow: "链接获取指引",
    time: "约 30 秒",
    formats: "常见链接格式",
    checks: "粘贴前请检查",
    legal: "请仅下载或处理您拥有或已获授权使用的素材。平台界面和链接格式可能随时调整。"
  },
  moreTools: {
    eyebrow: "继续创作",
    title: "接着试试其他创作者工具。",
    description: "从素材获取继续到清理与加工，无需离开未然Lab。",
    all: "浏览全部工具"
  },
  planned: {
    eyebrow: "专属工具页面",
    badge: "开发中",
    title: "工作区与接入边界已经规划完成。",
    description: "页面、路由、产品边界和共享平台接入方式已经就位。Extractor 与媒体传输通过生产验证后即可启用。",
    noFake: "底层连接器可靠工作前，我们不会展示一个无法使用的下载表单。",
    browse: "浏览可用工具",
    related: "相关工具"
  },
  footer: {
    product: "产品",
    workspaces: "工作区",
    legal: "规则",
    allTools: "全部工具",
    privacy: "隐私政策",
    terms: "使用条款",
    disclaimer: "免责声明",
    tagline: "面向 AI 创作者的模块化工具集合。",
    notice: "请仅处理您拥有或已获授权使用的素材。"
  }
};

export const siteCopy = marketConfig.locale === "zh-CN" ? zh : en;
