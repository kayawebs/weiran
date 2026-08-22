import { marketConfig } from "../config/market";

const en = {
  layout: { home: "Home", tools: "Tools", history: "History", menu: "Toggle navigation", nav: "Primary navigation", homeLabel: "Weiran Lab home", tagline: "Practical media infrastructure for AI creators.", legal: "Only process media you own or are authorized to use." },
  common: { live: "LIVE", planned: "PLANNED", video: "VIDEO", image: "IMAGE", media: "MEDIA", cleanup: "CLEANUP" },
  home: {
    eyebrow: "MEDIA INFRASTRUCTURE FOR AI CREATORS", hero: ["Find it.", "Clean it.", "Create more."], description: "One reliable workspace for acquiring and preparing the media behind your next idea.", explore: "Explore tools",
    available: "AVAILABLE NOW", start: "Start with media cleanup.", viewAll: "View all tools",
    videoTitle: "Clean source download", videoDescription: "Paste a public Dola thread. We locate its original video files and prepare secure downloads.",
    imageTitle: "Remove an image watermark", imageDescription: "Upload an authorized image, draw over the unwanted area, and restore the background.",
    platform: "ONE SHARED PLATFORM", workflowTitle: "From source to creation.", workflow: ["Discover", "Acquire", "Clean", "Transform", "Publish"],
    note: "Weiran Lab is being built as a modular creator platform. New tools will share the same task, file, and processing infrastructure."
  },
  tools: {
    eyebrow: "TOOL DIRECTORY", title: "Built for the work between ideas.", description: "Focused tools for getting creator media ready—without the clutter of a full editing suite.", liveCount: "TOOLS LIVE",
    categories: [
      { title: "Media cleanup", description: "Remove visual noise and recover usable source files.", tools: [
        { meta: "VIDEO · DOLA", title: "Clean source download", description: "Extract original videos from a public Dola thread URL." },
        { meta: "IMAGE · CLEANUP", title: "Image watermark remover", description: "Draw a region and repair it with image inpainting." }
      ] },
      { title: "Media acquisition", description: "Bring source material into one consistent workflow.", tools: [
        { meta: "MULTI-PLATFORM", title: "Source download", description: "A shared extractor layer for supported creator platforms." }
      ] },
      { title: "Creator assist", description: "Prepare assets for the next stage of production.", tools: [
        { meta: "VIDEO", title: "Subtitles", description: "Generate and export editable subtitles." },
        { meta: "IMAGE", title: "Cover maker", description: "Turn a frame into a publishing-ready cover." },
        { meta: "MEDIA", title: "Format converter", description: "Convert media into the format your workflow needs." }
      ] }
    ]
  },
  video: {
    eyebrow: "VIDEO · DOLA", title: "Get the clean source.", description: "Paste a public Dola thread URL. We resolve every available original video and turn it into a secure download.", supported: "DOLA SUPPORTED",
    platformTitle: "Choose a platform", platformHint: "More source platforms will plug into the same workflow.", publicLinks: "Public thread links", selected: "Selected",
    urlTitle: "Paste the thread URL", urlHint: "One thread can contain multiple videos.", fieldLabel: "Public Dola URL", needLink: "How do I get this link?", invalid: "Paste a valid public Dola thread URL.", startError: "We could not scan this public link right now.", starting: "Scanning link…", submit: "Find source videos",
    how: "HOW IT WORKS", steps: [
      { title: "Resolve the thread", description: "Identify every video attached to the public post." },
      { title: "Show results", description: "List the clean source files without waiting for an upload." },
      { title: "Stream on demand", description: "Preview or download through a short-lived private link." }
    ], legal: "Only submit material you own or have permission to download and reuse.",
    found: (count: number) => `${count} VIDEO${count === 1 ? "" : "S"} FOUND`, resultsTitle: "Clean source videos", expires: (minutes: number) => `Links refresh after ${minutes} minutes`,
    videoNumber: (index: number) => `VIDEO ${String(index).padStart(2, "0")}`, original: "ORIGINAL", noWatermark: "No watermark", download: "Download", preview: "Preview", hidePreview: "Close"
  },
  image: {
    eyebrow: "IMAGE · CLEANUP", title: "Remove what gets in the way.", description: "Upload an authorized image and draw directly over the watermark. We restore the selected area while preserving the rest.", limit: "REGION PER TASK",
    uploadTitle: "Upload and mark the area", uploadHint: "After uploading, drag a rectangle around the entire watermark.", choose: "Choose an image", sample: "Use the test image", sampleError: "The test image could not be loaded.", formats: "JPG, PNG, or WebP", invalidFile: "Choose a JPG, PNG, or WebP image.", sourceAlt: "Selected source", drawTitle: "Drag over the watermark", drawHint: "Press and drag to draw the area that should be repaired.", removeMarker: "REMOVE", chooseAgain: "Choose a different image",
    finishTitle: "Choose a finish", finishHint: "Smart repair works best for most backgrounds.", repair: "Smart repair", repairHint: "Rebuild the selected background", recommended: "Recommended", blur: "Soft blur", blurHint: "Obscure the selected area", selectedArea: "Selected area",
    selectError: "Draw a box over the watermark before continuing.", startError: "We could not start this task.", uploading: "Uploading…", submit: "Remove watermark", privacy: "Your file uploads directly to private object storage. The download link expires automatically."
  },
  task: {
    labels: { PENDING: "Queued", PROCESSING: "Processing", SUCCESS: "Ready", FAILED: "Failed" }, task: "TASK", pending: "Your task is waiting for an available worker.", processing: "We are preparing your media. You can leave this page and return from History.", ready: (count: number) => count > 0 ? `${count} result${count === 1 ? " is" : "s are"} ready to download.` : "Your results are ready to download.", failed: "The task could not be completed.", failure: (_code: string | undefined) => "The task could not be completed. Please try again later.", loadError: "Could not load this task.", result: "RESULT", file: "FILE", mediaFile: (index: number) => `Media file ${index}`, resultAlt: (index: number) => `Result ${index}`, download: "Download", another: "Start another task", history: "View history"
  },
  history: {
    eyebrow: "YOUR WORKSPACE", title: "Task history.", description: "Recent jobs from this browser session. Open any task to check its status or refresh its download links.", recent: "RECENT TASKS", loading: "Loading your recent work…", loadError: "Could not load history.", emptyTitle: "No tasks yet.", emptyDescription: "Your completed and in-progress tools will appear here.", explore: "Explore tools", creatorTask: "Creator task",
    taskNames: { VIDEO_WATERMARK_REMOVE: "Dola clean source", IMAGE_WATERMARK_REMOVE: "Image watermark remover", SOURCE_DOWNLOAD: "Source download", IMAGE_PROCESS: "Image processing" }, taskKinds: { VIDEO_WATERMARK_REMOVE: "VIDEO PROCESSING", IMAGE_WATERMARK_REMOVE: "IMAGE PROCESSING", SOURCE_DOWNLOAD: "MEDIA ACQUISITION", IMAGE_PROCESS: "IMAGE PROCESSING" },
    statuses: { PENDING: "PENDING", PROCESSING: "PROCESSING", SUCCESS: "SUCCESS", FAILED: "FAILED" }
  },
  notFound: { eyebrow: "404 · OFF THE WORKBENCH", title: "Nothing here.", description: "The page may have moved, but the tools are still ready.", back: "Back home" },
  api: { requestFailed: "The request could not be completed.", uploadFailed: "The image could not be uploaded.", error: (code: string | undefined, _message: string | undefined) => ({ RATE_LIMITED: "Too many requests. Please try again shortly.", UNAUTHENTICATED: "Your session expired. Please try again.", VALIDATION_ERROR: "Check the submitted information and try again.", INVALID_DOLA_URL: "Paste a valid public Dola thread URL.", INVALID_SOURCE_URL: "Paste a valid public share link for the selected platform.", DOLA_NO_VIDEO: "No downloadable videos were found in this public thread.", SOURCE_NO_VIDEO: "No downloadable video was found in this public link.", DOLA_CLEAN_SOURCE_UNAVAILABLE: "The original video is temporarily unavailable.", CLEAN_SOURCE_UNAVAILABLE: "The original video is temporarily unavailable.", DOLA_EXTRACTION_FAILED: "The Dola thread could not be scanned right now.", SOURCE_RESOLVE_FAILED: "The source page could not be scanned right now.", SOURCE_DELIVERY_FAILED: "The source video could not be delivered right now.", SOURCE_TICKET_INVALID: "This media link has expired. Scan the link again.", VIDEO_FLOW_MIGRATED: "This video task has moved to the instant source scanner." }[code || ""] || "The request could not be completed.") },
  ads: { label: "ADVERTISEMENT", houseText: "Creator tools, selected by Weiran Lab." }
};

const zh: typeof en = {
  layout: { home: "首页", tools: "工具", history: "记录", menu: "展开导航", nav: "主导航", homeLabel: "未然Lab 首页", tagline: "面向 AI 创作者的实用素材基础设施。", legal: "请仅处理您拥有或已获授权使用的素材。" },
  common: { live: "可使用", planned: "即将推出", video: "视频", image: "图片", media: "素材", cleanup: "清理" },
  home: {
    eyebrow: "面向 AI 创作者的素材基础设施", hero: ["发现素材。", "清理素材。", "专注创作。"], description: "从素材获取到处理，用一个可靠的工作台准备下一次创作所需的内容。", explore: "浏览工具",
    available: "当前能力", start: "从素材清理开始。", viewAll: "查看全部工具",
    videoTitle: "获取无水印源视频", videoDescription: "粘贴公开 Dola Thread 链接，自动定位原始视频并生成安全下载地址。",
    imageTitle: "图片去水印", imageDescription: "上传已获授权的图片，框选不需要的区域并修复背景。",
    platform: "统一能力平台", workflowTitle: "从素材到创作。", workflow: ["发现", "获取", "清理", "加工", "发布"],
    note: "未然Lab 正在建设为模块化创作者工具平台。未来工具将共享同一套任务、文件与媒体处理基础设施。"
  },
  tools: {
    eyebrow: "工具中心", title: "填补灵感与作品之间的环节。", description: "专注于创作者素材准备，不堆叠复杂的完整编辑功能。", liveCount: "项工具可用",
    categories: [
      { title: "素材清理", description: "清除画面干扰，获得可继续创作的素材。", tools: [
        { meta: "视频 · DOLA", title: "获取无水印源视频", description: "从公开 Dola Thread 链接提取原始视频。" },
        { meta: "图片 · 清理", title: "图片去水印", description: "框选指定区域并使用图像修复处理。" }
      ] },
      { title: "素材获取", description: "把不同来源的素材接入统一工作流。", tools: [
        { meta: "多平台", title: "素材下载", description: "面向不同创作者平台的统一解析能力。" }
      ] },
      { title: "创作辅助", description: "为下一阶段创作加工准备素材。", tools: [
        { meta: "视频", title: "字幕", description: "生成并导出可编辑字幕。" },
        { meta: "图片", title: "封面制作", description: "将视频画面制作成发布封面。" },
        { meta: "素材", title: "格式转换", description: "转换为创作流程需要的媒体格式。" }
      ] }
    ]
  },
  video: {
    eyebrow: "视频 · DOLA", title: "获取无水印源视频。", description: "粘贴公开 Dola Thread 链接，我们会解析其中全部原始视频并生成安全下载地址。", supported: "已支持 DOLA",
    platformTitle: "选择平台", platformHint: "未来平台将继续接入同一套处理流程。", publicLinks: "公开 Thread 链接", selected: "已选择",
    urlTitle: "粘贴链接", urlHint: "一个 Thread 可能包含多个视频。", fieldLabel: "Dola 公开链接", needLink: "这个链接在哪里复制？", invalid: "请粘贴有效的 Dola 公开 Thread 链接。", startError: "暂时无法解析该公开链接，请稍后重试。", starting: "正在扫描链接…", submit: "查找源视频",
    how: "处理流程", steps: [
      { title: "解析 Thread", description: "识别公开内容中包含的全部视频。" },
      { title: "展示结果", description: "无需等待上传，直接列出可用的无水印源视频。" },
      { title: "按需传输", description: "通过短期私有链接预览或下载。" }
    ], legal: "请仅提交您拥有或已获授权下载、使用的素材。",
    found: (count: number) => `找到 ${count} 个视频`, resultsTitle: "无水印源视频", expires: (minutes: number) => `链接将在 ${minutes} 分钟后失效`,
    videoNumber: (index: number) => `视频 ${String(index).padStart(2, "0")}`, original: "原画", noWatermark: "无水印", download: "下载", preview: "预览", hidePreview: "关闭"
  },
  image: {
    eyebrow: "图片 · 清理", title: "移除画面中的干扰。", description: "上传已获授权的图片，直接框选水印区域。系统会在保留其他内容的同时修复选中位置。", limit: "每个任务一个区域",
    uploadTitle: "上传并框选区域", uploadHint: "上传后，在图片上按住并拖动方框，完整覆盖需要移除的水印。", choose: "选择图片", sample: "使用测试图片", sampleError: "测试图片加载失败。", formats: "支持 JPG、PNG、WebP", invalidFile: "请选择 JPG、PNG 或 WebP 图片。", sourceAlt: "已选择的原图", drawTitle: "请拖动框选水印", drawHint: "在图片上按住并拖动，画出需要修复的区域。", removeMarker: "移除", chooseAgain: "重新选择图片",
    finishTitle: "选择处理方式", finishHint: "大多数背景推荐使用智能修复。", repair: "智能修复", repairHint: "重建选中区域的背景", recommended: "推荐", blur: "柔和模糊", blurHint: "模糊遮盖选中区域", selectedArea: "已选区域",
    selectError: "请先框选需要移除的水印区域。", startError: "暂时无法创建任务，请稍后重试。", uploading: "正在上传…", submit: "开始去水印", privacy: "文件会直接上传到私有对象存储，结果下载链接将在有效期后自动失效。"
  },
  task: {
    labels: { PENDING: "排队中", PROCESSING: "处理中", SUCCESS: "已完成", FAILED: "处理失败" }, task: "任务", pending: "任务正在等待可用的处理节点。", processing: "正在准备您的素材。可以离开此页，稍后从记录中返回查看。", ready: (count: number) => count > 0 ? `${count} 个结果已可下载。` : "处理结果已可下载。", failed: "任务未能完成。", failure: (_message: string | undefined) => "任务未能完成，请稍后重试。", loadError: "暂时无法加载该任务。", result: "结果", file: "文件", mediaFile: (index: number) => `素材文件 ${index}`, resultAlt: (index: number) => `处理结果 ${index}`, download: "下载", another: "继续使用工具", history: "查看记录"
  },
  history: {
    eyebrow: "您的工作台", title: "任务记录。", description: "当前浏览器最近提交的任务。可打开任一任务查看进度或刷新下载链接。", recent: "最近任务", loading: "正在加载最近任务…", loadError: "暂时无法加载任务记录。", emptyTitle: "还没有任务。", emptyDescription: "进行中和已完成的工具任务会显示在这里。", explore: "浏览工具", creatorTask: "创作任务",
    taskNames: { VIDEO_WATERMARK_REMOVE: "Dola 无水印源视频", IMAGE_WATERMARK_REMOVE: "图片去水印", SOURCE_DOWNLOAD: "素材下载", IMAGE_PROCESS: "图片处理" }, taskKinds: { VIDEO_WATERMARK_REMOVE: "视频处理", IMAGE_WATERMARK_REMOVE: "图片处理", SOURCE_DOWNLOAD: "素材获取", IMAGE_PROCESS: "图片处理" },
    statuses: { PENDING: "排队中", PROCESSING: "处理中", SUCCESS: "已完成", FAILED: "失败" }
  },
  notFound: { eyebrow: "404 · 页面不存在", title: "这里没有内容。", description: "页面可能已经移动，但工具仍然可以正常使用。", back: "返回首页" },
  api: { requestFailed: "请求暂时无法完成。", uploadFailed: "图片上传失败，请稍后重试。", error: (code: string | undefined) => ({ RATE_LIMITED: "请求过于频繁，请稍后重试。", UNAUTHENTICATED: "登录状态已失效，请重新操作。", VALIDATION_ERROR: "提交的信息格式不正确。", INVALID_TASK_INPUT: "任务参数不正确，请检查后重试。", TASK_NOT_FOUND: "没有找到该任务。", TASK_NOT_READY: "任务尚未处理完成。", INVALID_DOLA_URL: "请粘贴有效的 Dola 公开 Thread 链接。", INVALID_SOURCE_URL: "请粘贴所选平台的有效公开分享链接。", DOLA_NO_VIDEO: "该公开 Thread 中没有找到可下载视频。", SOURCE_NO_VIDEO: "该公开链接中没有找到可下载视频。", DOLA_CLEAN_SOURCE_UNAVAILABLE: "原始无水印视频暂时不可用。", CLEAN_SOURCE_UNAVAILABLE: "原始视频暂时不可用。", DOLA_EXTRACTION_FAILED: "暂时无法解析该 Dola Thread。", SOURCE_RESOLVE_FAILED: "暂时无法解析该素材页面。", SOURCE_DELIVERY_FAILED: "源视频暂时无法下载。", SOURCE_TICKET_INVALID: "下载链接已失效，请重新解析。", VIDEO_FLOW_MIGRATED: "旧版视频任务已迁移到即时素材扫描。" }[code || ""] || "请求暂时无法完成。") },
  ads: { label: "广告", houseText: "未然Lab 为创作者精选的工具与服务。" }
};

export const copy = marketConfig.locale === "zh-CN" ? zh : en;
