import { marketConfig } from "../config/market";

type LocalizedText = { en: string; "zh-CN": string };

type LocalizedStep = {
  title: LocalizedText;
  description: LocalizedText;
};

type PlatformGuideDefinition = {
  toolId: string;
  title: LocalizedText;
  description: LocalizedText;
  linkFormats: string[];
  steps: LocalizedStep[];
  checks: LocalizedText[];
};

export type PlatformGuide = {
  title: string;
  description: string;
  linkFormats: string[];
  steps: Array<{ title: string; description: string }>;
  checks: string[];
};

const text = (en: string, zh: string): LocalizedText => ({ en, "zh-CN": zh });
const step = (enTitle: string, zhTitle: string, enDescription: string, zhDescription: string): LocalizedStep => ({
  title: text(enTitle, zhTitle),
  description: text(enDescription, zhDescription)
});

const definitions: PlatformGuideDefinition[] = [
  {
    toolId: "dola-video",
    title: text("How to copy a Dola thread link", "如何获取 Dola Thread 链接"),
    description: text("Use the public thread page—not a profile, dashboard, or media CDN address.", "请复制公开 Thread 页面地址，不要复制个人主页、工作台或媒体 CDN 地址。"),
    linkFormats: ["https://www.dola.com/thread/…", "https://dola.com/thread/…"],
    steps: [
      step("Open the thread", "打开 Thread", "Open the Dola conversation that contains the videos you want to save.", "进入包含目标视频的 Dola 对话 Thread。"),
      step("Copy the browser URL", "复制浏览器地址", "Select the complete address in the browser bar and copy it.", "选中浏览器地址栏中的完整链接并复制。"),
      step("Check that it is public", "确认可以公开访问", "Open the link in a private window. If it works without signing in, the scanner can usually read it.", "用无痕窗口打开链接；无需登录即可访问时，解析器通常才能读取。"),
      step("Paste and scan", "粘贴并解析", "Paste the thread URL above. Every video found in the thread will appear as a separate result.", "将 Thread 链接粘贴到上方；其中找到的每个视频都会作为独立结果展示。")
    ],
    checks: [
      text("The URL must contain /thread/.", "链接中必须包含 /thread/。"),
      text("Private or sign-in-only threads cannot be scanned.", "私密或必须登录才能查看的 Thread 无法解析。"),
      text("If a link stopped working, copy a fresh link from Dola and try again.", "如果旧链接失效，请从 Dola 重新复制后再试。")
    ]
  },
  {
    toolId: "dola-images",
    title: text("How to copy a Dola image thread link", "如何获取 Dola 图片 Thread 链接"),
    description: text("The same public thread link can contain one or more original images.", "同一个公开 Thread 链接中可以包含一张或多张原始图片。"),
    linkFormats: ["https://www.dola.com/thread/…"],
    steps: [
      step("Open the image thread", "打开图片 Thread", "Open the Dola thread containing the generated images.", "打开包含生成图片的 Dola Thread。"),
      step("Copy the full address", "复制完整地址", "Copy the complete /thread/ URL from your browser address bar.", "从浏览器地址栏复制完整的 /thread/ 链接。"),
      step("Verify public access", "确认公开访问", "Test the link in a private window before submitting it.", "提交前先在无痕窗口测试该链接。"),
      step("Paste and extract", "粘贴并提取", "Paste the link here to list every supported image in the thread.", "在这里粘贴链接，列出 Thread 中所有受支持的图片。")
    ],
    checks: [text("Profiles and home-page URLs do not contain extractable media.", "个人主页和首页链接不包含可提取的媒体。"), text("Only submit images you own or may reuse.", "请仅提交您拥有或获准再利用的图片。")]
  },
  {
    toolId: "jimeng-video",
    title: text("How to copy a Jimeng / Seedance link", "如何获取即梦 / Seedance 分享链接"),
    description: text("Jimeng drafts are private. Publish or share the finished work before copying its link.", "即梦草稿是私密内容，需要先发布或分享成公开作品，再复制链接。"),
    linkFormats: ["https://jimeng.jianying.com/s/…"],
    steps: [
      step("Open the finished video", "打开已完成视频", "Open your completed video in the Jimeng app or on the Jimeng website.", "在即梦 App 或网页端打开已生成完成的视频。"),
      step("Make it shareable", "生成可分享作品", "Publish the work or create a public share page. A private draft cannot be resolved.", "发布作品或生成公开分享页；私密草稿无法解析。"),
      step("Tap Share, then Copy link", "点击分享并复制链接", "Use the share arrow, then tap the link icon or Copy link.", "点击分享箭头，再选择链接图标或“复制链接”。"),
      step("Paste the /s/ link", "粘贴 /s/ 链接", "Paste the complete jimeng.jianying.com/s/… address into the downloader.", "将完整的 jimeng.jianying.com/s/… 地址粘贴到下载器。")
    ],
    checks: [text("The work must be published or publicly shared.", "作品必须已发布或已生成公开分享。"), text("Copy the link from Share, not the editor address bar.", "请从“分享”中复制链接，不要复制编辑器地址。"), text("Generate a new share link if an old one expired.", "旧分享链接失效时，请重新生成。")]
  },
  {
    toolId: "dreamina-video",
    title: text("How to copy a Dreamina / CapCut work link", "如何获取 Dreamina / CapCut 作品链接"),
    description: text("Dreamina uses the work-detail page URL from the browser address bar.", "Dreamina 使用浏览器地址栏中的 work-detail 作品页链接。"),
    linkFormats: ["https://dreamina.capcut.com/ai-tool/work-detail/…"],
    steps: [
      step("Open Dreamina", "打开 Dreamina", "Sign in to Dreamina in a desktop or mobile browser.", "在电脑或手机浏览器中登录 Dreamina。"),
      step("Open the work detail", "打开作品详情", "Select the generated video so the work-detail page is visible.", "点击生成的视频，进入作品详情页。"),
      step("Copy the address bar", "复制地址栏", "Copy the complete URL, including the work ID and query string.", "复制完整网址，包括作品 ID 和后面的查询参数。"),
      step("Paste the work URL", "粘贴作品链接", "Paste the work-detail URL into the platform downloader.", "将 work-detail 链接粘贴到对应下载页面。")
    ],
    checks: [text("The URL should contain /ai-tool/work-detail/.", "链接应包含 /ai-tool/work-detail/。"), text("Copy the detail page, not the Dreamina home page.", "请复制作品详情页，而不是 Dreamina 首页。"), text("The work must be accessible from the shared URL.", "作品必须能通过该分享地址访问。")]
  },
  {
    toolId: "doubao-video",
    title: text("How to copy a Doubao video link", "如何获取豆包视频分享链接"),
    description: text("Copy the public share link from the generated video card.", "请从已生成的视频卡片中复制公开分享链接。"),
    linkFormats: ["https://www.doubao.com/video-sharing?…"],
    steps: [
      step("Open the generated video", "打开生成的视频", "Find the finished AI video in Doubao and open its detail view.", "在豆包中找到已经生成完成的 AI 视频并打开详情。"),
      step("Open Share", "打开分享菜单", "Tap the Share button or the more menu on the video.", "点击视频上的“分享”按钮或更多菜单。"),
      step("Copy link", "复制链接", "Choose Copy link to create a public video-sharing address.", "选择“复制链接”，获得公开的 video-sharing 地址。"),
      step("Paste the full link", "粘贴完整链接", "Paste the complete link, including its query parameters.", "粘贴完整链接，并保留问号后的所有参数。")
    ],
    checks: [text("A chat page URL is not the same as a video share URL.", "对话页面地址不等于视频分享地址。"), text("The expected URL normally contains video-sharing.", "正确链接通常包含 video-sharing。"), text("Keep all characters after the question mark.", "请保留问号后的全部字符。")]
  },
  {
    toolId: "vibes-video",
    title: text("How to copy a Meta AI Vibes link", "如何获取 Meta AI Vibes 链接"),
    description: text("Use a public Vibes post URL from Meta AI, Instagram, or Facebook.", "请使用来自 Meta AI、Instagram 或 Facebook 的公开 Vibes 作品链接。"),
    linkFormats: ["https://www.meta.ai/@username/…", "https://www.instagram.com/…", "https://www.facebook.com/…"],
    steps: [
      step("Open the Vibes post", "打开 Vibes 作品", "Open the individual video post, not the general Vibes feed.", "打开单个视频作品，不要停留在 Vibes 信息流首页。"),
      step("Copy on mobile", "手机端复制", "Tap Share, then Copy link in Meta AI, Instagram, or Facebook.", "在 Meta AI、Instagram 或 Facebook 中点击“分享”，再点“复制链接”。"),
      step("Copy on desktop", "电脑端复制", "Open the individual post and copy its full browser URL.", "打开单个作品页，并复制浏览器中的完整网址。"),
      step("Paste the public URL", "粘贴公开链接", "Paste the copied post URL into the Vibes downloader.", "将复制的作品链接粘贴到 Vibes 下载页面。")
    ],
    checks: [text("The post must be visible without joining a private group.", "作品不能位于私密群组中。"), text("Profile and feed URLs do not identify one video.", "个人主页和信息流地址不能定位单个视频。"), text("Regional or login restrictions may prevent access.", "地区或登录限制可能导致无法访问。")]
  },
  {
    toolId: "tiktok-video",
    title: text("How to copy a TikTok video link", "如何获取 TikTok 视频链接"),
    description: text("Both a full video URL and TikTok's short share URL can identify a public post.", "完整视频地址和 TikTok 分享短链接都可以定位公开作品。"),
    linkFormats: ["https://www.tiktok.com/@user/video/…", "https://vm.tiktok.com/…", "https://vt.tiktok.com/…"],
    steps: [
      step("Open the video", "打开视频", "Open the individual public TikTok video you are authorized to save.", "打开您获准保存的 TikTok 公开视频。"),
      step("Tap Share", "点击分享", "On mobile, tap the Share arrow. On desktop, open the video's share menu.", "手机端点击分享箭头；电脑端打开视频的分享菜单。"),
      step("Choose Copy link", "选择复制链接", "Copy the full or shortened TikTok share URL.", "复制完整地址或 TikTok 生成的分享短链接。"),
      step("Paste only the link", "粘贴链接", "Paste the URL into the TikTok workspace. Extra share text may be removed.", "将网址粘贴到 TikTok 工作区；分享文案可以删掉。")
    ],
    checks: [text("Private, friends-only, and deleted posts cannot be resolved.", "私密、仅好友可见和已删除作品无法解析。"), text("Slideshows and audio may produce different result types.", "图集和音频可能会生成不同类型的结果。"), text("Use a freshly copied link if a short URL fails.", "短链接失败时，请重新复制最新链接。")]
  },
  {
    toolId: "douyin-video",
    title: text("How to copy a Douyin video link", "如何获取抖音视频链接"),
    description: text("The Douyin app normally copies a short v.douyin.com link together with share text.", "抖音 App 通常会复制一段分享文案，其中包含 v.douyin.com 短链接。"),
    linkFormats: ["https://v.douyin.com/…", "https://www.douyin.com/video/…"],
    steps: [
      step("Open the video", "打开视频", "Find the public Douyin video you are authorized to save.", "找到您获准保存的抖音公开视频。"),
      step("Tap Share", "点击分享", "Tap the share arrow on the right side of the video.", "点击视频右侧的分享箭头。"),
      step("Tap Copy link", "点击复制链接", "Douyin copies a short URL, often inside a line of share text.", "抖音会复制一个短链接，通常夹在一段分享文案中。"),
      step("Paste the share text", "粘贴分享内容", "Paste the copied content; the site can identify the URL inside it.", "直接粘贴复制内容，网站会识别其中的网址。")
    ],
    checks: [text("Both v.douyin.com and full /video/ links are recognized.", "支持 v.douyin.com 和完整 /video/ 链接。"), text("Private, friends-only, and deleted posts cannot be read.", "私密、仅好友和已删除作品无法读取。"), text("Do not copy the creator's profile URL.", "不要复制创作者个人主页地址。")]
  },
  {
    toolId: "xiaohongshu-media",
    title: text("How to copy a Xiaohongshu / RedNote link", "如何获取小红书 / RedNote 笔记链接"),
    description: text("Copy the link from the note's share sheet. Video notes and image notes use the same flow.", "请从笔记的分享面板复制链接，视频笔记和图文笔记的操作一致。"),
    linkFormats: ["https://www.xiaohongshu.com/explore/…", "https://xhslink.com/…"],
    steps: [
      step("Open the note", "打开笔记", "Open the individual video or image note in Xiaohongshu.", "在小红书中打开单条视频或图文笔记。"),
      step("Open Share", "打开分享面板", "Tap the Share icon in the upper-right corner or action bar.", "点击右上角或操作栏中的分享图标。"),
      step("Copy link", "复制链接", "Choose Copy link. The app may copy descriptive text plus an xhslink.com URL.", "选择“复制链接”；App 可能会同时复制文案和 xhslink.com 地址。"),
      step("Paste the copied content", "粘贴复制内容", "Paste the full share text or only its URL into the downloader.", "可以粘贴整段分享文案，也可以只保留其中的网址。")
    ],
    checks: [text("The note must be publicly accessible.", "笔记必须可以公开访问。"), text("Profiles, search pages, and collections are not single-note links.", "个人主页、搜索页和合集页不是单篇笔记链接。"), text("Image posts may return several files.", "图文笔记可能会返回多个文件。")]
  },
  {
    toolId: "kuaishou-video",
    title: text("How to copy a Kuaishou video link", "如何获取快手视频链接"),
    description: text("Use Copy link from the video's share panel; short share URLs are expected.", "请在视频分享面板中选择“复制链接”，通常得到的是分享短链接。"),
    linkFormats: ["https://v.kuaishou.com/…", "https://www.kuaishou.com/short-video/…"],
    steps: [
      step("Open the video", "打开视频", "Open the individual public Kuaishou post.", "打开单条快手公开作品。"),
      step("Tap Share", "点击分享", "Tap the share icon on the video detail screen.", "在视频详情页点击分享图标。"),
      step("Copy link", "复制链接", "Choose Copy link to place the short share URL on your clipboard.", "选择“复制链接”，将分享短地址复制到剪贴板。"),
      step("Paste and resolve", "粘贴并解析", "Paste the copied link or share text into the Kuaishou workspace.", "将复制的链接或分享文案粘贴到快手工作区。")
    ],
    checks: [text("The link must point to one public video.", "链接必须指向单条公开视频。"), text("Private and deleted posts cannot be resolved.", "私密或已删除作品无法解析。"), text("Copy a fresh share link if the short URL expired.", "短链接过期时，请重新复制。")]
  }
];

export function platformGuideFor(toolId: string): PlatformGuide | undefined {
  const definition = definitions.find((item) => item.toolId === toolId);
  if (!definition) return undefined;
  const locale = marketConfig.locale;
  return {
    title: definition.title[locale],
    description: definition.description[locale],
    linkFormats: definition.linkFormats,
    steps: definition.steps.map((item) => ({ title: item.title[locale], description: item.description[locale] })),
    checks: definition.checks.map((item) => item[locale])
  };
}
